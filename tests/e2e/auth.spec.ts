import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

const local = localSupabase();
// Privileged access is confined to local test fixture setup/cleanup, never app code.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const otherOrganizationId = randomUUID();
const domain = `network-${randomUUID()}.test`;
const users: string[] = [];
const curriculum = {
  module: randomUUID(), moduleRevision: randomUUID(), draftRevision: randomUUID(),
  topic: randomUUID(), topicRevision: randomUUID(), instructor: randomUUID(), instructorRevision: randomUUID(),
  note: randomUUID(), noteRevision: randomUUID(), material: randomUUID(), materialRevision: randomUUID(),
  institution: randomUUID(), institutionRevision: randomUUID(),
};

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert([
    { id: organizationId, name: "Red de prueba", is_active: true },
    { id: otherOrganizationId, name: "Otra organización privada", is_active: true },
  ]));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
  assertSuccess(await operator.from("modules").insert({ id: curriculum.module }));
  assertSuccess(await operator.from("program_topics").insert({ id: curriculum.topic }));
  assertSuccess(await operator.from("instructors").insert({ id: curriculum.instructor }));
  assertSuccess(await operator.from("teaching_notes").insert({ id: curriculum.note }));
  assertSuccess(await operator.from("materials").insert({ id: curriculum.material }));
  assertSuccess(await operator.from("institutions").insert({ id: curriculum.institution }));
  const publishedAt = new Date().toISOString();
  assertSuccess(await operator.from("module_revisions").insert([
    { id: curriculum.moduleRevision, module_id: curriculum.module, revision_number: 1, status: "Published", axis_id: "a1000000-0000-4000-8000-000000000001", title: "Política democrática de prueba", theme: "Participación", description: "Módulo ficticio para validar la biblioteca.", learning_outcomes: ["Analizar estrategias"], published_at: publishedAt },
    { id: curriculum.draftRevision, module_id: curriculum.module, revision_number: 2, status: "Draft", axis_id: "a1000000-0000-4000-8000-000000000001", title: "Borrador secreto E2E", description: "No debe ser visible.", learning_outcomes: [], published_at: null },
  ]));
  assertSuccess(await operator.from("program_topic_revisions").insert({ id: curriculum.topicRevision, program_topic_id: curriculum.topic, revision_number: 1, status: "Published", module_id: curriculum.module, title: "Mapeo de actores", description: "Tema ficticio del Programa.", position: 1, published_at: publishedAt }));
  assertSuccess(await operator.from("instructor_revisions").insert({ id: curriculum.instructorRevision, instructor_id: curriculum.instructor, revision_number: 1, status: "Published", name: "Persona Ficticia", role_or_title: "Especialista", institution: "Organización de prueba", profile: "Perfil exclusivo para validación automatizada.", thematic_axis_or_themes: ["Participación"], country: "Perú", published_at: publishedAt }));
  assertSuccess(await operator.from("material_revisions").insert({ id: curriculum.materialRevision, material_id: curriculum.material, revision_number: 1, status: "Published", title: "Guía ficticia de participación", material_type: "Manual", description: "Material representativo para E2E.", source_or_institution: "Fuente ficticia", source_url: "https://example.test/guia", country_or_scope: "Perú", theme: "Participación", published_at: publishedAt }));
  assertSuccess(await operator.from("institution_revisions").insert({ id: curriculum.institutionRevision, institution_id: curriculum.institution, revision_number: 1, status: "Published", name: "Centro Ficticio Regional", institution_type: "Centro de referencia", country_or_scope: "Regional", description: "Institución representativa para E2E.", website_url: "https://example.test/centro", themes: ["Participación"], published_at: publishedAt }));
  assertSuccess(await operator.from("program_topics").update({ current_published_revision_id: curriculum.topicRevision }).eq("id", curriculum.topic));
  assertSuccess(await operator.from("teaching_note_revisions").insert({ id: curriculum.noteRevision, teaching_note_id: curriculum.note, revision_number: 1, status: "Published", module_id: curriculum.module, program_topic_id: curriculum.topic, title: "Nota docente ficticia", text: "Orientación representativa para la prueba.", source_url: null, published_at: publishedAt }));
  assertSuccess(await operator.from("instructors").update({ current_published_revision_id: curriculum.instructorRevision }).eq("id", curriculum.instructor));
  assertSuccess(await operator.from("teaching_notes").update({ current_published_revision_id: curriculum.noteRevision }).eq("id", curriculum.note));
  assertSuccess(await operator.from("materials").update({ current_published_revision_id: curriculum.materialRevision }).eq("id", curriculum.material));
  assertSuccess(await operator.from("institutions").update({ current_published_revision_id: curriculum.institutionRevision }).eq("id", curriculum.institution));
  assertSuccess(await operator.from("module_instructors").insert({ module_revision_id: curriculum.moduleRevision, instructor_id: curriculum.instructor }));
  assertSuccess(await operator.from("module_materials").insert({ module_revision_id: curriculum.moduleRevision, material_id: curriculum.material }));
  assertSuccess(await operator.from("module_institutions").insert({ module_revision_id: curriculum.moduleRevision, institution_id: curriculum.institution }));
  assertSuccess(await operator.from("modules").update({ current_published_revision_id: curriculum.moduleRevision }).eq("id", curriculum.module));
});

test.afterAll(async () => {
  const archived_at = new Date().toISOString();
  assertSuccess(await operator.from("modules").update({ archived_at }).eq("id", curriculum.module));
  assertSuccess(await operator.from("program_topics").update({ archived_at }).eq("id", curriculum.topic));
  assertSuccess(await operator.from("instructors").update({ archived_at }).eq("id", curriculum.instructor));
  assertSuccess(await operator.from("teaching_notes").update({ archived_at }).eq("id", curriculum.note));
  assertSuccess(await operator.from("materials").update({ archived_at }).eq("id", curriculum.material));
  assertSuccess(await operator.from("institutions").update({ archived_at }).eq("id", curriculum.institution));
  for (const id of users) assertSuccess(await operator.auth.admin.deleteUser(id));
  assertSuccess(await operator.from("organization_domains").delete().eq("organization_id", organizationId));
  assertSuccess(await operator.from("organizations").delete().in("id", [organizationId, otherOrganizationId]));
});

async function provision(role: "Contributor" | "Admin", eligible = true) {
  const email = `${randomUUID()}@${eligible ? domain : "unapproved.test"}`;
  const result = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(result);
  const id = result.data.user!.id;
  users.push(id);
  assertSuccess(await operator.from("memberships").insert({ user_id: id, organization_id: organizationId, is_active: true, role }));
  return { id, email };
}

async function provisionIdentityOnly() {
  const email = `${randomUUID()}@${domain}`;
  const result = await operator.auth.admin.createUser({ email, email_confirm: true, user_metadata: { role: "Admin", provider: "google" } });
  assertSuccess(result);
  users.push(result.data.user!.id);
  return { id: result.data.user!.id, email };
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page.getByRole("status")).toContainText("Si tu cuenta está habilitada");
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
  await expect(page).toHaveURL(/\/(app|access-denied)$/);
}

async function userClient(page: Page) {
  return createServerClient<Database>(local.url, local.key, {
    cookies: { getAll: async () => page.context().cookies(), setAll: () => {} },
  });
}

// Use the actual browser's cookie handling. Node APIRequestContext does not send
// Secure cookies on HTTP loopback, while Chromium treats loopback as trustworthy.
async function appRequest(page: Page, path: string, method = "GET") {
  return page.evaluate(async ({ path, method }) => {
    const response = await fetch(path, { method });
    return { status: response.status, body: await response.text(), cache: response.headers.get("cache-control") };
  }, { path, method });
}

test("unauthenticated routes and data are denied, including forged session cookies", async ({ page }) => {
  await page.goto("/app?role=Admin");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  expect((await appRequest(page, "/api/access")).status).toBe(401);
  const anonymous = createClient<Database>(local.url, local.key);
  expect((await anonymous.from("memberships").select()).error).not.toBeNull();
  expect((await anonymous.rpc("current_access")).error).not.toBeNull();
  expect((await anonymous.from("modules").select()).error).not.toBeNull();
  expect((await anonymous.rpc("search_curriculum", { search_query: "politica" })).error).not.toBeNull();
  const unknownEmail = `self-register-${randomUUID()}@${domain}`;
  await anonymous.auth.signInWithOtp({ email: unknownEmail, options: { shouldCreateUser: false } });
  const listed = await operator.auth.admin.listUsers();
  assertSuccess(listed);
  const unexpectedUser = listed.data.users.find(user => user.email === unknownEmail);
  if (unexpectedUser) users.push(unexpectedUser.id);
  expect(unexpectedUser).toBeUndefined();
  await page.context().addCookies([{ name: "sb-127-auth-token", value: "forged-admin-session", domain: "127.0.0.1", path: "/" }]);
  expect((await appRequest(page, "/api/access?role=Admin")).status).toBe(401);
});

test("eligible Contributor explores one published dataset through Grilla and Programa", async ({ page }) => {
  const user = await provision("Contributor");
  await login(page, user.email);
  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Biblioteca", exact: true })).toBeVisible();
  const libraryCache = (await appRequest(page, "/app/library")).cache;
  if (process.env.E2E_PRODUCTION) expect(libraryCache).toContain("no-store");
  else expect(libraryCache).toContain("no-cache");
  await expect(page.getByText("Política democrática de prueba", { exact: true })).toHaveCount(1);
  await expect(page.getByText("Borrador secreto E2E", { exact: true })).toHaveCount(0);

  await page.getByLabel("Buscar").fill("politica");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText("Política democrática de prueba", { exact: true })).toHaveCount(1);
  await page.getByRole("link", { name: "Programa", exact: true }).click();
  await expect(page).toHaveURL(/view=programa/);
  await expect(page.getByText("Política democrática de prueba", { exact: true })).toHaveCount(1);
  await page.getByRole("link", { name: "Ver programa" }).click();
  await expect(page.getByRole("heading", { name: "Programa", exact: true })).toBeVisible();
  await expect(page.getByText("Mapeo de actores", { exact: true })).toBeVisible();
  await expect(page.getByText("Persona Ficticia", { exact: true })).toBeVisible();
  await expect(page.getByText("Nota docente ficticia", { exact: true })).toBeVisible();
  await expect(page.getByText("Guía ficticia de participación", { exact: true })).toBeVisible();
  await expect(page.getByText("Centro Ficticio Regional", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Programa", exact: true })).toBeVisible();
});

test("references are first-class and Admin reader visibility matches Contributor", async ({ page }) => {
  const user = await provision("Admin");
  await login(page, user.email);
  await page.goto("/app/library?entity=reference");
  await expect(page.getByText("Política democrática de prueba", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Guía ficticia de participación", { exact: true })).toBeVisible();
  await expect(page.getByText("Centro Ficticio Regional", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Explorar referencia" }).first().click();
  await expect(page.getByText(/Material o estudio|Institución o centro de referencia/)).toBeVisible();

  const ordinary = await userClient(page);
  expect((await ordinary.from("module_revisions").select("title")).data).toEqual([
    expect.objectContaining({ title: "Política democrática de prueba" }),
  ]);
  expect((await ordinary.from("module_revisions").update({ title: "Manipulado" }).eq("id", curriculum.moduleRevision)).error).not.toBeNull();
});

test("Google is primary and email code remains available as fallback", async ({ page }) => {
  await page.goto("/login");
  const buttons = page.getByRole("button");
  await expect(buttons.first()).toHaveText("Continuar con Google");
  await expect(page.getByRole("button", { name: "Enviar código" })).toBeVisible();
});

test("Spanish validation and invalid OTP do not establish access", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Introduce un correo" })).toHaveText("Introduce un correo institucional válido.");
  await page.getByLabel("Correo institucional").fill(`unknown@${domain}`);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await page.getByLabel("Código de acceso").fill("000000");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "El código no es válido" })).toBeVisible();
  expect((await appRequest(page, "/api/access")).status).toBe(401);
});

test("eligible Contributor logs in, cannot escalate or switch organizations, and signs out", async ({ page }) => {
  const user = await provision("Contributor");
  await login(page, user.email);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText("Colaborador", { exact: true })).toBeVisible();
  if (process.env.E2E_PRODUCTION) {
    const authCookies = (await page.context().cookies()).filter(cookie => cookie.name.includes("auth-token"));
    expect(authCookies.length).toBeGreaterThan(0);
    expect(authCookies.every(cookie => cookie.secure && cookie.sameSite === "Lax")).toBe(true);
  }
  const ordinary = await userClient(page);
  assertSuccess(await ordinary.auth.updateUser({ data: { role: "Admin", organization_id: otherOrganizationId } }));
  expect((await ordinary.from("memberships").update({ role: "Admin" }).eq("user_id", user.id)).error).not.toBeNull();
  expect((await ordinary.from("memberships").update({ organization_id: otherOrganizationId }).eq("user_id", user.id)).error).not.toBeNull();
  expect((await ordinary.from("memberships").upsert({ user_id: user.id, organization_id: otherOrganizationId, role: "Admin", is_active: true })).error).not.toBeNull();
  expect((await ordinary.rpc("is_admin")).data).toBe(false);
  expect((await ordinary.from("organizations").select("id")).data).toEqual([{ id: organizationId }]);
  expect((await ordinary.from("memberships").select("user_id")).data).toEqual([{ user_id: user.id }]);
  const response = await appRequest(page, `/api/access?role=Admin&organization_id=${otherOrganizationId}`);
  expect(response.status).toBe(200);
  expect(response.cache).toContain("no-store");
  expect(JSON.parse(response.body)).toMatchObject({ userId: user.id, role: "Contributor", organizationId });
  expect((await appRequest(page, "/api/access?role=Admin", "POST")).status).toBe(405);
  await page.reload();
  await expect(page.getByText("Colaborador", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await appRequest(page, "/api/access")).status).toBe(401);
});

test("Admin authority comes from membership and is revoked without refreshing the token", async ({ page }) => {
  const user = await provision("Admin");
  await login(page, user.email);
  await expect(page.getByText("Administrador", { exact: true })).toBeVisible();
  const ordinary = await userClient(page);
  expect((await ordinary.rpc("is_admin")).data).toBe(true);
  assertSuccess(await operator.from("memberships").update({ is_active: false }).eq("user_id", user.id));
  expect((await ordinary.rpc("is_admin")).data).toBe(false);
  expect((await ordinary.from("memberships").select()).data).toEqual([]);
  expect((await appRequest(page, "/api/access")).status).toBe(403);
  await page.goto("/app");
  await expect(page).toHaveURL(/\/access-denied$/);
});

test("a real authenticated identity with an unapproved domain gets no protected data", async ({ page }) => {
  const user = await provision("Contributor", false);
  await login(page, user.email);
  await expect(page).toHaveURL(/\/access-denied$/);
  await expect(page.getByRole("heading", { name: "Acceso no autorizado" })).toBeVisible();
  const ordinary = await userClient(page);
  expect((await ordinary.auth.getUser()).data.user?.id).toBe(user.id);
  for (const table of ["memberships", "organizations", "organization_domains"] as const) {
    const result = await ordinary.from(table).select();
    assertSuccess(result);
    expect(result.data).toEqual([]);
  }
  expect((await ordinary.rpc("current_access")).data).toEqual([]);
  expect((await ordinary.from("modules").select()).data).toEqual([]);
  expect((await ordinary.rpc("search_curriculum", { search_query: "politica" })).data).toEqual([]);
  const response = await appRequest(page, "/api/access");
  expect(response.status).toBe(403);
  expect(JSON.parse(response.body)).toEqual({ error: "Acceso no autorizado." });
  await expect(page.getByText("Red de prueba", { exact: true })).toHaveCount(0);
});

test("an approved-domain Auth identity without membership remains ineligible", async ({ page }) => {
  const user = await provisionIdentityOnly();
  await login(page, user.email);
  await expect(page).toHaveURL(/\/access-denied$/);
  const response = await appRequest(page, "/api/access");
  expect(response.status).toBe(403);
  expect(JSON.parse(response.body)).toEqual({ error: "Acceso no autorizado." });
});
