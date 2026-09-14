import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const domain = `contributions-${randomUUID()}.test`;

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

async function provision(eligible = true) {
  const email = `${randomUUID()}@${eligible ? domain : "unapproved.test"}`;
  const result = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(result);
  const id = result.data.user!.id;
  assertSuccess(await operator.from("memberships").insert({ user_id: id, organization_id: organizationId, is_active: true, role: "Contributor" }));
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
  await expect(page).toHaveURL(/\/(app|access-denied)$/);
}

async function userClient(context: BrowserContext) {
  return createServerClient<Database>(local.url, local.key, {
    cookies: { getAll: async () => context.cookies(), setAll: () => {} },
  });
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: "Red de contribuciones E2E", is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("owner creates, relates, uploads and submits while other users remain isolated", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const owner = await provision();
  const other = await provision();
  const ineligible = await provision(false);
  const ownerContext = await browser.newContext();
  const otherContext = await browser.newContext();
  const ineligibleContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const otherPage = await otherContext.newPage();
  const ineligiblePage = await ineligibleContext.newPage();

  await login(ownerPage, owner.email);
  await ownerPage.goto("/app/contributions/new/module");
  await ownerPage.getByLabel("Eje *").selectOption("a1000000-0000-4000-8000-000000000001");
  await ownerPage.getByLabel("Título *").fill(`Módulo privado ${marker}`);
  await ownerPage.getByLabel("Descripción *").fill("Descripción inicial del aporte.");
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(ownerPage).toHaveURL(/\/app\/contributions\/module\/[0-9a-f-]+$/);
  const moduleUrl = ownerPage.url();
  const moduleRevisionId = moduleUrl.split("/").pop()!;
  await ownerPage.getByLabel("Título *").fill(`Módulo editado ${marker}`);
  const saveResponse = ownerPage.waitForResponse((response) => response.request().method() === "POST" && response.url() === moduleUrl);
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  expect((await saveResponse).ok()).toBe(true);
  await ownerPage.reload();
  await expect(ownerPage.getByLabel("Título *")).toHaveValue(`Módulo editado ${marker}`);

  await ownerPage.goto("/app/contributions/new/teaching_note");
  await ownerPage.getByLabel("Módulo *").selectOption({ label: `Módulo editado ${marker} (borrador propio)` });
  await ownerPage.getByLabel("Título *").fill(`Nota con archivo ${marker}`);
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(ownerPage).toHaveURL(/\/app\/contributions\/teaching_note\/[0-9a-f-]+$/);
  const noteUrl = ownerPage.url();
  const noteRevisionId = noteUrl.split("/").pop()!;
  await ownerPage.getByLabel("Agregar archivo").setInputFiles({ name: `nota-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 private fixture") });
  await ownerPage.getByRole("button", { name: "Cargar archivo" }).click();
  await expect(ownerPage.getByRole("link", { name: `nota-${marker}.pdf` })).toBeVisible();
  await ownerPage.getByLabel("Agregar archivo").setInputFiles({ name: `eliminar-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 disposable") });
  await ownerPage.getByRole("button", { name: "Cargar archivo" }).click();
  const disposable = ownerPage.getByRole("listitem").filter({ hasText: `eliminar-${marker}.pdf` });
  await disposable.getByRole("button", { name: "Eliminar" }).click();
  await expect(disposable).toHaveCount(0);

  const attachment = await operator.from("curriculum_attachments").select("id,object_name").eq("teaching_note_revision_id", noteRevisionId).single();
  assertSuccess(attachment);
  if (!attachment.data) throw new Error("Attachment fixture was not persisted");
  const download = await ownerPage.evaluate(async (id) => {
    const response = await fetch(`/api/attachments/${id}`);
    return { status: response.status, disposition: response.headers.get("content-disposition"), size: (await response.arrayBuffer()).byteLength };
  }, attachment.data.id);
  expect(download).toMatchObject({ status: 200, size: 24 });

  await login(otherPage, other.email);
  await otherPage.goto("/app/contributions");
  await expect(otherPage.getByText(`Módulo editado ${marker}`, { exact: true })).toHaveCount(0);
  await otherPage.goto(noteUrl);
  await expect(otherPage.getByRole("heading", { name: "No encontramos esta contribución." })).toBeVisible();
  const otherClient = await userClient(otherContext);
  expect((await otherClient.from("module_revisions").select("id").eq("id", moduleRevisionId)).data).toEqual([]);
  expect((await otherClient.storage.from("governed-attachments").download(attachment.data.object_name)).error).not.toBeNull();
  expect(await otherPage.evaluate(async (id) => (await fetch(`/api/attachments/${id}`)).status, attachment.data.id)).toBe(404);

  await login(ineligiblePage, ineligible.email);
  await expect(ineligiblePage).toHaveURL(/\/access-denied$/);
  const ineligibleClient = await userClient(ineligibleContext);
  expect((await ineligibleClient.storage.from("governed-attachments").download(attachment.data.object_name)).error).not.toBeNull();
  expect(await ineligiblePage.evaluate(async (id) => (await fetch(`/api/attachments/${id}`)).status, attachment.data.id)).toBe(403);

  await ownerPage.goto(noteUrl);
  await ownerPage.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(ownerPage.getByRole("heading", { name: "Enviado para revisión" })).toBeVisible();
  await expect(ownerPage.getByRole("button", { name: "Guardar borrador" })).toHaveCount(0);
  const ownerClient = await userClient(ownerContext);
  expect((await ownerClient.rpc("update_contribution", { requested_type: "teaching_note", requested_revision_id: noteRevisionId, payload: { title: "Manipulado" } })).error).not.toBeNull();
  await ownerClient.storage.from("governed-attachments").remove([attachment.data.object_name]);
  expect((await ownerClient.storage.from("governed-attachments").download(attachment.data.object_name)).error).toBeNull();

  await ownerPage.goto(moduleUrl);
  await ownerPage.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(ownerPage.getByRole("heading", { name: "Enviado para revisión" })).toBeVisible();
  await ownerPage.goto(`/app/library?q=${marker}`);
  await expect(ownerPage.getByText(`Módulo editado ${marker}`, { exact: true })).toHaveCount(0);

  assertSuccess(await operator.from("memberships").update({ is_active: false }).eq("user_id", owner.id));
  expect((await ownerClient.from("teaching_note_revisions").select("id").eq("id", noteRevisionId)).data).toEqual([]);
  expect((await ownerClient.storage.from("governed-attachments").download(attachment.data.object_name)).error).not.toBeNull();
  expect(await ownerPage.evaluate(async (id) => (await fetch(`/api/attachments/${id}`)).status, attachment.data.id)).toBe(403);
  assertSuccess(await operator.from("memberships").update({ is_active: true }).eq("user_id", owner.id));

  const orderMarker = randomUUID().slice(0, 8);
  await ownerPage.goto("/app/contributions/new/module");
  await ownerPage.getByLabel("Eje *").selectOption("a1000000-0000-4000-8000-000000000001");
  await ownerPage.getByLabel("Título *").fill(`Módulo orden ${orderMarker}`);
  await ownerPage.getByLabel("Descripción *").fill("Módulo para validar el orden de envío.");
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(ownerPage).toHaveURL(/\/app\/contributions\/module\/[0-9a-f-]+$/);
  const orderModuleUrl = ownerPage.url();

  await ownerPage.goto("/app/contributions/new/program_topic");
  await ownerPage.getByLabel("Módulo *").selectOption({ label: `Módulo orden ${orderMarker} (borrador propio)` });
  await ownerPage.getByLabel("Título *").fill(`Tema orden ${orderMarker}`);
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(ownerPage).toHaveURL(/\/app\/contributions\/program_topic\/[0-9a-f-]+$/);
  const orderTopicUrl = ownerPage.url();

  await ownerPage.goto("/app/contributions/new/teaching_note");
  await ownerPage.getByLabel("Módulo *").selectOption({ label: `Módulo orden ${orderMarker} (borrador propio)` });
  await ownerPage.getByLabel("Tema de programa").selectOption({ label: `Tema orden ${orderMarker} (borrador propio)` });
  await ownerPage.getByLabel("Título *").fill(`Nota orden ${orderMarker}`);
  await ownerPage.getByLabel(/Contenido/).fill("Fuente textual para validar el orden.");
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(ownerPage).toHaveURL(/\/app\/contributions\/teaching_note\/[0-9a-f-]+$/);
  const orderNoteUrl = ownerPage.url();

  await ownerPage.goto(orderModuleUrl);
  await ownerPage.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(ownerPage.getByRole("heading", { name: "Enviado para revisión" })).toBeVisible();

  await ownerPage.goto(orderTopicUrl);
  await expect(ownerPage.getByLabel("Módulo *").locator("option:checked")).toHaveText(`Módulo orden ${orderMarker} (enviado propio)`);
  await ownerPage.getByLabel("Título *").fill(`Tema editable ${orderMarker}`);
  const topicSave = ownerPage.waitForResponse((response) => response.request().method() === "POST" && response.url() === orderTopicUrl);
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  expect((await topicSave).ok()).toBe(true);
  await ownerPage.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(ownerPage.getByRole("heading", { name: "Enviado para revisión" })).toBeVisible();

  await ownerPage.goto(orderNoteUrl);
  await expect(ownerPage.getByLabel("Módulo *").locator("option:checked")).toHaveText(`Módulo orden ${orderMarker} (enviado propio)`);
  await expect(ownerPage.getByLabel("Tema de programa").locator("option:checked")).toHaveText(`Tema editable ${orderMarker} (enviado propio)`);
  await ownerPage.getByLabel(/Contenido/).fill("La nota sigue editable con dependencias enviadas.");
  const noteSave = ownerPage.waitForResponse((response) => response.request().method() === "POST" && response.url() === orderNoteUrl);
  await ownerPage.getByRole("button", { name: "Guardar borrador" }).click();
  expect((await noteSave).ok()).toBe(true);
  await ownerPage.getByRole("button", { name: "Enviar a revisión" }).click();
  await expect(ownerPage.getByRole("heading", { name: "Enviado para revisión" })).toBeVisible();
  await ownerPage.goto(`/app/library?q=${orderMarker}`);
  await expect(ownerPage.getByText(`Módulo orden ${orderMarker}`, { exact: true })).toHaveCount(0);

  await ownerContext.close();
  await otherContext.close();
  await ineligibleContext.close();
});

// Authored fixture identities intentionally remain until the next local db:reset:
// append-only lifecycle evidence correctly prevents destructive user cleanup.
