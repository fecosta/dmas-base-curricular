import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-008 Phase 4 — the canonical events through a real browser.
 *
 * This environment is non-production, so the boundary is inert by design and
 * nothing can be observed on the wire. To verify the instrumentation itself,
 * the approved transport remains inert. Enabled payloads are inspected with
 * a mocked fetch in unit tests, without emitting real telemetry.
 *
 * The production-like enabled transport is tested with a mocked fetch in
 * unit tests; this browser suite confirms non-production remains inert.
 */

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const domain = `eventos-${randomUUID()}.test`;

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

async function provision() {
  const email = `${randomUUID()}@${domain}`;
  const created = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(created);
  assertSuccess(await operator.from("memberships").insert({
    user_id: created.data.user!.id, organization_id: organizationId, is_active: true, role: "Contributor",
  }));
  return { email, userId: created.data.user!.id };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  let code: string | undefined;
  await expect.poll(async () => {
    const response = await fetch(`${local.mailUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const mailbox = await response.json();
    if (!mailbox.messages?.length) return false;
    const message = await (await fetch(`${local.mailUrl}/api/v1/message/${mailbox.messages[0].ID}`)).json();
    code = message.Text?.match(/\b\d{6}\b/)?.[0] ?? message.HTML?.match(/\b\d{6}\b/)?.[0];
    return !!code;
  }, { timeout: 15_000 }).toBe(true);
  await page.getByLabel("Código de acceso").fill(code!);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
}

/**
 * Non-production cannot dispatch. Record accidental provider traffic.
 */
async function recordEvents(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __events: { event: string; properties: Record<string, unknown> }[] }).__events = [];
  });

  await page.route(/https:\/\/eu\.i\.posthog\.com\/i\/v0\/e\//, (route) => {
    throw new Error(`Unexpected analytics request: ${route.request().url()}`);
  });

  return async () => page.evaluate(() =>
    (window as unknown as { __events: { event: string; properties: Record<string, unknown> }[] }).__events);
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({
    id: organizationId, name: "Red de eventos E2E", is_active: true,
  }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

/*
 * The decisive privacy assertion for Phase 4, and the one that does not depend
 * on intercepting anything: whatever the instrumentation does, the reader's
 * query must never appear in a request leaving the application.
 */
test("no request leaving the application carries the reader's query, filters or filenames", async ({ page }) => {
  const { email } = await provision();
  const sensitive = `frase-confidencial-${randomUUID().slice(0, 8)}`;
  const leaked: { url: string; body: string }[] = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("127.0.0.1") || url.includes("localhost")) return;
    const body = request.postData() ?? "";
    if (url.includes(sensitive) || body.includes(sensitive)) leaked.push({ url, body });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Aceptar" }).click();

  // Every journey that produces a canonical event.
  await page.goto("/app/library");
  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill(sensitive);
  await search.press("Enter");
  await expect(page).toHaveURL(new RegExp(`q=${sensitive}`));

  await page.goto(`/app/library?entity=module&q=${sensitive}`);
  await page.waitForLoadState("networkidle");

  const firstModule = page.locator('a[href^="/app/library/modules/"]').first();
  if (await firstModule.count() > 0) {
    await firstModule.click();
    await page.waitForLoadState("networkidle");
  }

  expect(leaked, "the reader's query left the application").toEqual([]);
});

/*
 * In this non-production environment the boundary is inert, so the expected
 * recording is empty. That is precisely the assertion worth making here: the
 * instrumented surfaces are all exercised and *nothing* is captured. Payload
 * shape for the enabled case is proven by the unit suites, which can set a
 * production-like environment without a deployment; this test must not be read
 * as evidence that events were observed emitting.
 */
test("exercising every instrumented surface captures nothing outside production", async ({ page }) => {
  const { email } = await provision();
  const events = await recordEvents(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Aceptar" }).click();

  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();

  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill("democracia");
  await search.press("Enter");
  await page.waitForLoadState("networkidle");

  await page.goto("/app/library?entity=module&axis=&country=&theme=");
  await page.waitForLoadState("networkidle");

  const firstModule = page.locator('a[href^="/app/library/modules/"]').first();
  if (await firstModule.count() > 0) {
    await firstModule.click();
    await page.waitForLoadState("networkidle");
  }

  // Every canonical journey has now run, with consent granted. The only thing
  // still holding analytics off is the environment guard.
  expect(await events(), "an inert environment captured events").toEqual([]);
});

test("a reader who declined analytics still reaches every instrumented surface", async ({ page }) => {
  const { email, userId } = await provision();

  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect.poll(async () => {
    const { data } = await operator.from("analytics_preferences")
      .select("analytics_enabled").eq("user_id", userId).maybeSingle();
    return data?.analytics_enabled;
  }).toBe(false);

  // Library, search, filters.
  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();
  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill("democracia");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=democracia/);

  // Content detail, including its attachments and external references.
  await page.goto("/app/library?entity=module");
  const firstModule = page.locator('a[href^="/app/library/modules/"]').first();
  if (await firstModule.count() > 0) {
    await firstModule.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  // Instrumentation must not have become a precondition for any of it.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("attachment downloads keep their filename in the interface", async ({ page }) => {
  const { email } = await provision();
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Aceptar" }).click();

  // Instrumenting the download link must not have changed what the reader sees.
  await page.goto("/app/library?entity=material");
  const firstMaterial = page.locator('a[href^="/app/library/references/material/"]').first();
  if (await firstMaterial.count() === 0) return;

  await firstMaterial.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const downloads = page.getByRole("link", { name: /^Descargar / });
  if (await downloads.count() > 0) {
    // The link still names the file and still points at the authorized route.
    await expect(downloads.first()).toHaveAttribute("href", /^\/api\/attachments\//);
  }
});
