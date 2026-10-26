import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-013 AC-10 — an Admin selects an approved reach, saves and publishes; the
 * reader `País o alcance` filter lists it next to a legacy published value, and
 * combining the filter with search keeps working for both.
 */

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const domain = `reach-${randomUUID()}.test`;
const marker = `reach${randomUUID().slice(0, 8)}`;
const LEGACY = "Regional";
const LEGACY_TITLE = `Material legado ${marker}`;
const NEW_TITLE = `Material nuevo ${marker}`;
const legacy = { material: randomUUID(), revision: randomUUID() };

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

async function signIn(page: Page, role: "Contributor" | "Admin") {
  const email = `${randomUUID()}@${domain}`;
  const created = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(created);
  assertSuccess(await operator.from("memberships").insert({ user_id: created.data.user!.id, organization_id: organizationId, is_active: true, role }));
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

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: "Red de alcance E2E", is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
  assertSuccess(await operator.from("materials").insert({ id: legacy.material }));
  assertSuccess(await operator.from("material_revisions").insert({ id: legacy.revision, material_id: legacy.material, revision_number: 1, status: "Published", title: LEGACY_TITLE, material_type: "Manual", description: "Material ficticio con alcance legado.", country_or_scope: LEGACY, published_at: new Date().toISOString() }));
  assertSuccess(await operator.from("materials").update({ current_published_revision_id: legacy.revision }).eq("id", legacy.material));
});

test.afterAll(async () => {
  assertSuccess(await operator.from("materials").update({ archived_at: new Date().toISOString() }).eq("id", legacy.material));
  // Users that authored content stay, as in the other content journeys: attribution is immutable.
});

async function userClient(context: BrowserContext) {
  return createServerClient<Database>(local.url, local.key, { cookies: { getAll: async () => context.cookies(), setAll: () => {} } });
}

test("an Admin publishes an approved reach and readers filter by it alongside legacy values", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  const readerContext = await browser.newContext();
  const reader = await readerContext.newPage();
  await signIn(admin, "Admin");
  await signIn(reader, "Contributor");

  // The database rejects an off-list reach even when the form is bypassed.
  const forged = await (await userClient(adminContext)).rpc("create_contribution", { requested_type: "material", payload: { title: `Forjado ${marker}`, material_type: "Informe", country_or_scope: "Latinoamérica" } });
  expect(forged.error?.code).toBe("23514");

  await admin.goto("/app/contributions/new/material");
  const select = admin.getByLabel("País o alcance");
  await expect(select).toHaveJSProperty("tagName", "SELECT");
  await expect(select.locator("option")).toHaveCount(21);
  await admin.getByLabel("Título *").fill(NEW_TITLE);
  await admin.getByLabel("Tipo de material *").fill("Informe");
  await admin.getByLabel("Fuente o institución").fill("Fuente ficticia");
  await select.selectOption("Perú");
  await admin.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(admin).toHaveURL(/\/app\/contributions\/material\/[0-9a-f-]+$/);
  await expect(admin.getByLabel("País o alcance")).toHaveValue("Perú");
  await admin.getByRole("button", { name: "Publicar" }).click();
  await expect(admin.getByRole("status")).toContainText("Publicado correctamente");

  await reader.goto(`/app/library?q=${marker}`);
  const group = reader.getByRole("group", { name: "País o alcance" }).first();
  await expect(group.getByRole("link", { name: "Perú", exact: true })).toBeVisible();
  await expect(group.getByRole("link", { name: LEGACY, exact: true })).toBeVisible();

  await reader.goto(`/app/library?q=${marker}&country=${encodeURIComponent("Perú")}`);
  await expect(reader.getByRole("heading", { name: NEW_TITLE })).toBeVisible();
  await expect(reader.getByRole("heading", { name: LEGACY_TITLE })).toHaveCount(0);

  await reader.goto(`/app/library?q=${marker}&country=${LEGACY}`);
  await expect(reader.getByRole("heading", { name: LEGACY_TITLE })).toBeVisible();
  await expect(reader.getByRole("heading", { name: NEW_TITLE })).toHaveCount(0);
});
