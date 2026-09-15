import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const domain = `admin-content-${randomUUID()}.test`;

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

async function provision(role: "Contributor" | "Admin") {
  const email = `${randomUUID()}@${domain}`;
  const result = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(result);
  const id = result.data.user!.id;
  assertSuccess(await operator.from("memberships").insert({ user_id: id, organization_id: organizationId, is_active: true, role }));
  return { id, email };
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

async function userClient(context: BrowserContext) {
  return createServerClient<Database>(local.url, local.key, {
    cookies: { getAll: async () => context.cookies(), setAll: () => {} },
  });
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: "Red de administración E2E", is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("Admins publish new and successor versions while non-Admins remain readers", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const adminA = await provision("Admin");
  const adminB = await provision("Admin");
  const reader = await provision("Contributor");
  const adminAContext = await browser.newContext();
  const adminBContext = await browser.newContext();
  const readerContext = await browser.newContext();
  const adminAPage = await adminAContext.newPage();
  const adminBPage = await adminBContext.newPage();
  const readerPage = await readerContext.newPage();

  await login(readerPage, reader.email);
  await expect(readerPage.getByRole("link", { name: "Administrar contenido" })).toHaveCount(0);
  await readerPage.goto("/app/contributions");
  await expect(readerPage).toHaveURL(/\/access-denied$/);
  const readerClient = await userClient(readerContext);
  expect((await readerClient.rpc("create_contribution", { requested_type: "material", payload: { title: "Ataque", material_type: "Informe" } })).error).not.toBeNull();
  expect((await readerClient.rpc("publish_content_draft", { requested_type: "material", requested_revision_id: randomUUID() })).error).not.toBeNull();
  expect((await readerClient.rpc("create_successor_draft", { requested_type: "material", requested_content_id: randomUUID() })).error).not.toBeNull();
  expect(await readerPage.evaluate(async () => (await fetch(`/api/contributions/material/${crypto.randomUUID()}/attachments/${crypto.randomUUID()}`, { method: "DELETE" })).status)).toBe(403);

  await login(adminAPage, adminA.email);
  await adminAPage.getByRole("link", { name: "Administrar contenido" }).click();
  await expect(adminAPage.getByRole("heading", { name: "Administrar contenido" })).toBeVisible();
  await adminAPage.getByRole("link", { name: "Crear contenido" }).click();
  await adminAPage.getByRole("link", { name: "Material o estudio" }).click();
  await adminAPage.getByLabel("Título *").fill(`Material vigente ${marker}`);
  await adminAPage.getByLabel("Tipo de material *").fill("Informe");
  await adminAPage.getByLabel("Descripción").fill("Descripción creada por la primera administradora.");
  await adminAPage.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(adminAPage).toHaveURL(/\/app\/contributions\/material\/[0-9a-f-]+$/);
  const draftV1Url = adminAPage.url();
  const draftV1RevisionId = draftV1Url.split("/").pop()!;
  await adminAPage.getByLabel("Agregar archivo").setInputFiles({ name: `material-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 managed fixture") });
  await adminAPage.getByRole("button", { name: "Cargar archivo" }).click();
  await expect(adminAPage.getByRole("link", { name: `material-${marker}.pdf` })).toBeVisible();

  await login(adminBPage, adminB.email);
  await adminBPage.goto(draftV1Url);
  await expect(adminBPage.getByRole("heading", { name: "Editar borrador" })).toBeVisible();
  await expect(adminBPage.getByRole("link", { name: `material-${marker}.pdf` })).toBeVisible();
  await adminBPage.getByLabel("Agregar archivo").setInputFiles({ name: `descartar-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 disposable fixture") });
  await adminBPage.getByRole("button", { name: "Cargar archivo" }).click();
  const disposable = adminBPage.getByRole("listitem").filter({ hasText: `descartar-${marker}.pdf` });
  await disposable.getByRole("button", { name: "Eliminar" }).click();
  await expect(disposable).toHaveCount(0);
  await adminBPage.getByLabel("Descripción").fill("Descripción editada por una segunda administradora.");
  await adminBPage.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(adminBPage.getByLabel("Descripción")).toHaveValue("Descripción editada por una segunda administradora.");
  await expect(adminBPage.getByRole("button", { name: /Enviar|revisión/i })).toHaveCount(0);
  await adminBPage.getByRole("button", { name: "Publicar" }).click();
  await expect(adminBPage.getByRole("status")).toContainText("Publicado correctamente");
  await expect(adminBPage.getByRole("heading", { name: "Contenido publicado" })).toBeVisible();

  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material vigente ${marker}`, { exact: true })).toBeVisible();

  await adminAPage.goto(`/app/contributions/material/${draftV1RevisionId}`);
  await adminAPage.getByRole("button", { name: "Crear nueva versión" }).click();
  await expect.poll(() => adminAPage.url()).not.toBe(draftV1Url);
  const draftV2Url = adminAPage.url();
  await expect(adminAPage.getByRole("heading", { name: "Editar borrador" })).toBeVisible();
  await expect(adminAPage.getByText(/biblioteca seguirá mostrando la versión anterior/i)).toBeVisible();
  await expect(adminAPage.getByLabel("Título *")).toHaveValue(`Material vigente ${marker}`);
  await expect(adminAPage.getByText("No hay archivos adjuntos.")).toBeVisible();
  await adminAPage.getByLabel("Título *").fill(`Material actualizado ${marker}`);
  await adminAPage.getByRole("button", { name: "Guardar borrador" }).click();

  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material vigente ${marker}`, { exact: true })).toBeVisible();
  await expect(readerPage.getByText(`Material actualizado ${marker}`, { exact: true })).toHaveCount(0);

  await adminBPage.goto(draftV2Url);
  await expect(adminBPage.getByLabel("Título *")).toHaveValue(`Material actualizado ${marker}`);
  await adminBPage.getByRole("button", { name: "Publicar" }).click();
  await expect(adminBPage.getByRole("status")).toContainText("Publicado correctamente");

  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material actualizado ${marker}`, { exact: true })).toBeVisible();
  await expect(readerPage.getByText(`Material vigente ${marker}`, { exact: true })).toHaveCount(0);

  assertSuccess(await operator.from("memberships").update({ role: "Contributor" }).eq("user_id", adminA.id));
  const revokedClient = await userClient(adminAContext);
  expect((await revokedClient.rpc("create_contribution", { requested_type: "material", payload: { title: "Revocado", material_type: "Informe" } })).error).not.toBeNull();
  await adminAPage.goto("/app/contributions");
  await expect(adminAPage).toHaveURL(/\/access-denied$/);

  await adminAContext.close();
  await adminBContext.close();
  await readerContext.close();
});

// Append-only lifecycle evidence intentionally remains until the next local db:reset.
