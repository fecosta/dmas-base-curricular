import { randomUUID } from "node:crypto";
import { expect, test, type Page, type Request } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-008 Phase 3 — the analytics boundary through a real browser.
 *
 * Proves absence, not just presence: no request reaches any analytics host,
 * and no PostHog script is even fetched, across the undecided, rejected and
 * accepted states. The unit suite proves the boundary's logic; only a browser
 * can prove that nothing left it.
 *
 * This environment is non-production and carries no PostHog key, so these
 * tests are also the environment-isolation evidence: the same journeys that a
 * consenting production user would generate emit nothing here.
 */

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const domain = `analitica-${randomUUID()}.test`;

/** Any host that would indicate telemetry leaving the application. */
const ANALYTICS_HOSTS = /posthog\.com|posthog\.io|i\.posthog|eu\.posthog|us\.posthog|\.hog\./i;

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
 * Records every request to an analytics host, and every script that looks like
 * the provider SDK. Both are failures: the second would mean the application
 * loaded a collector it had no consent to run.
 */
function watchTelemetry(page: Page) {
  const telemetry: string[] = [];
  const scripts: string[] = [];
  const inspect = (request: Request) => {
    const url = request.url();
    if (ANALYTICS_HOSTS.test(url)) telemetry.push(url);
    else if (/posthog/i.test(url) && !url.includes("127.0.0.1") && !url.includes("localhost")) scripts.push(url);
  };
  page.on("request", inspect);
  return { telemetry, scripts };
}

/** The product journeys that would produce every canonical event. */
async function exerciseProduct(page: Page) {
  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();

  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill("democracia");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=democracia/);

  // A filter, then a content open.
  await page.goto("/app/library?entity=module");
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();

  const firstModule = page.locator('a[href^="/app/library/modules/"]').first();
  if (await firstModule.count() > 0) {
    await firstModule.click();
    await page.waitForLoadState("networkidle");
  }
  await page.goto("/app");
  await page.waitForLoadState("networkidle");
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({
    id: organizationId, name: "Red de analítica E2E", is_active: true,
  }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("an undecided user generates no telemetry and loads no collector", async ({ page }) => {
  const { email } = await provision();
  const watched = watchTelemetry(page);

  await login(page, email);
  await exerciseProduct(page);

  expect(watched.telemetry, "telemetry sent before any decision").toEqual([]);
  expect(watched.scripts, "a collector was fetched before any decision").toEqual([]);
});

test("a user who rejected analytics generates no telemetry", async ({ page }) => {
  const { email, userId } = await provision();
  const watched = watchTelemetry(page);

  await login(page, email);
  await page.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect.poll(async () => {
    const { data } = await operator.from("analytics_preferences")
      .select("analytics_enabled").eq("user_id", userId).maybeSingle();
    return data?.analytics_enabled;
  }).toBe(false);

  await exerciseProduct(page);

  expect(watched.telemetry, "telemetry sent after rejection").toEqual([]);
  expect(watched.scripts, "a collector was fetched after rejection").toEqual([]);
});

/*
 * The decisive environment-isolation case. The user has consented, so only the
 * environment guard stands between the application and the provider. This
 * environment is non-production and unconfigured, so the result must still be
 * silence — which is what "Preview, Development and Test are no-ops" means.
 */
test("a consenting user still generates no telemetry outside production", async ({ page }) => {
  const { email, userId } = await provision();
  const watched = watchTelemetry(page);

  await login(page, email);
  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect.poll(async () => {
    const { data } = await operator.from("analytics_preferences")
      .select("analytics_enabled").eq("user_id", userId).maybeSingle();
    return data?.analytics_enabled;
  }).toBe(true);

  await exerciseProduct(page);

  expect(watched.telemetry, "non-production telemetry escaped").toEqual([]);
  expect(watched.scripts, "a collector was fetched outside production").toEqual([]);
});

test("the reader's search query never leaves the application", async ({ page }) => {
  const { email } = await provision();
  const sensitive = `consulta-privada-${randomUUID().slice(0, 8)}`;
  const leaked: string[] = [];

  page.on("request", (request) => {
    const url = request.url();
    // The application's own navigation legitimately carries the query in its
    // URL; anything leaving for a third party must not.
    if (url.includes("127.0.0.1") || url.includes("localhost")) return;
    const body = request.postData() ?? "";
    if (url.includes(sensitive) || body.includes(sensitive)) leaked.push(url);
  });

  await login(page, email);
  await page.getByRole("button", { name: "Aceptar" }).click();

  await page.goto("/app/library");
  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill(sensitive);
  await search.press("Enter");
  await expect(page).toHaveURL(new RegExp(`q=${sensitive}`));
  await page.waitForLoadState("networkidle");

  expect(leaked, "the raw search query left the application").toEqual([]);
});

test("signing out leaves no analytics identity behind", async ({ page }) => {
  const first = await provision();
  const second = await provision();

  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, first.email);
  await page.getByRole("button", { name: "Aceptar" }).click();
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login/);

  // No analytics state survives into the next session in the same browser.
  const residue = await page.evaluate(() => {
    const keys = [
      ...Object.keys(window.localStorage ?? {}),
      ...Object.keys(window.sessionStorage ?? {}),
    ];
    return keys.filter((key) => /posthog|ph_|distinct_id/i.test(key));
  });
  expect(residue, "analytics identity persisted past sign-out").toEqual([]);

  // The next user starts from their own undecided state.
  const watched = watchTelemetry(page);
  await login(page, second.email);
  await expect(page.getByRole("heading", { name: "Ayúdanos a mejorar Base Curricular" })).toBeVisible();
  expect(watched.telemetry).toEqual([]);
});

test("blocking the analytics provider does not affect the product", async ({ page }) => {
  const { email } = await provision();
  /*
   * Simulates a content blocker: every request to the provider's own hosts
   * fails outright. Scoped to those hosts rather than to the string
   * "posthog", because the application's own bundle filenames contain the
   * dependency name — aborting those would break the page under test rather
   * than the collector it is meant to block.
   */
  await page.route(ANALYTICS_HOSTS, (route) => route.abort());

  // The preferences control lives in the compact sheet below this width.
  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Aceptar" }).click();

  // Every core journey still works.
  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();
  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill("democracia");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=democracia/);
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();

  // Including the privacy surfaces themselves.
  await page.getByRole("button", { name: "Preferencias de datos" }).click();
  await expect(page.getByRole("dialog", { name: "Preferencias de datos" })).toBeVisible();
});
