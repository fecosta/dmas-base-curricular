import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const organizationName = "Red de archivado E2E";
const domain = `archival-${randomUUID()}.test`;

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

/** Creates and publishes a Material, returning its identity, revision and attachment. */
async function publishMaterial(page: Page, marker: string) {
  await page.goto("/app/contributions/new/material");
  await page.getByLabel("Título *").fill(`Material archivable ${marker}`);
  await page.getByLabel("Tipo de material *").fill("Informe");
  await page.getByLabel("Descripción").fill("Material publicado para validar archivado y restauración.");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/app\/contributions\/material\/[0-9a-f-]+$/);
  const revisionId = page.url().split("/").pop()!;
  await page.getByLabel("Agregar archivo").setInputFiles({ name: `archivable-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 archival fixture") });
  await page.getByRole("button", { name: "Cargar archivo" }).click();
  await expect(page.getByRole("link", { name: `archivable-${marker}.pdf` })).toBeVisible();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Publicado correctamente");

  const revision = await operator.from("material_revisions").select("material_id").eq("id", revisionId).single();
  assertSuccess(revision);
  const attachment = await operator.from("curriculum_attachments").select("id,object_name").eq("material_revision_id", revisionId).single();
  assertSuccess(attachment);
  return { contentId: revision.data!.material_id, revisionId, attachment: attachment.data! };
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: organizationName, is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("Admins archive and restore published content while readers lose and regain access", async ({ browser }) => {
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

  await login(adminAPage, adminA.email);
  const material = await publishMaterial(adminAPage, marker);

  // A reader can see the published material and download its attachment.
  await login(readerPage, reader.email);
  const readerClient = await userClient(readerContext);
  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material archivable ${marker}`, { exact: true })).toBeVisible();
  await readerPage.goto(`/app/library/references/material/${material.contentId}`);
  await expect(readerPage.getByRole("link", { name: `Descargar archivable-${marker}.pdf` })).toBeVisible();
  expect((await readerClient.storage.from("governed-attachments").download(material.attachment.object_name)).error).toBeNull();

  // Non-Admins reach neither the governance history nor the archive/restore RPCs.
  await readerPage.goto("/app/contributions/history");
  await expect(readerPage).toHaveURL(/\/access-denied$/);
  expect((await readerClient.rpc("archive_governed_content", { requested_type: "material", requested_content_id: material.contentId })).error).not.toBeNull();
  expect((await readerClient.rpc("restore_governed_content", { requested_type: "material", requested_content_id: material.contentId })).error).not.toBeNull();
  expect((await readerClient.rpc("list_curriculum_lifecycle_history", { page_size: 10 })).error).not.toBeNull();
  expect((await readerClient.rpc("list_archived_governed_content", { page_size: 10 })).error).not.toBeNull();

  // Archive behind the deliberate confirmation step.
  await adminAPage.goto(`/app/contributions/material/${material.revisionId}`);
  await expect(adminAPage.getByRole("heading", { name: "Gobernanza" })).toBeVisible();
  await adminAPage.getByRole("button", { name: "Archivar" }).click();
  await expect(adminAPage.getByText(/No se elimina/)).toBeVisible();
  await expect(adminAPage.getByText(/podrás restaurarlo más adelante/)).toBeVisible();
  await adminAPage.getByRole("button", { name: "Confirmar archivado" }).click();
  await expect(adminAPage).toHaveURL(/\/app\/contributions\?state=archived$/);
  await expect(adminAPage.getByRole("heading", { name: "Contenido archivado" })).toBeVisible();
  await expect(adminAPage.getByText(`Material archivable ${marker}`)).toBeVisible();

  // Archival preserves the Published revision and the current pointer.
  const archivedIdentity = await operator.from("materials").select("current_published_revision_id,archived_at,archived_by").eq("id", material.contentId).single();
  assertSuccess(archivedIdentity);
  expect(archivedIdentity.data!.current_published_revision_id).toBe(material.revisionId);
  expect(archivedIdentity.data!.archived_at).not.toBeNull();
  expect(archivedIdentity.data!.archived_by).toBe(adminA.id);
  expect((await operator.from("material_revisions").select("status").eq("id", material.revisionId).single()).data!.status).toBe("Published");
  expect((await operator.storage.from("governed-attachments").download(material.attachment.object_name)).error).toBeNull();

  // The reader loses browse, search, reference and attachment access.
  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material archivable ${marker}`, { exact: true })).toHaveCount(0);
  await readerPage.goto("/app/library");
  await expect(readerPage.getByText(`Material archivable ${marker}`, { exact: true })).toHaveCount(0);
  await readerPage.goto("/app/library?view=programa");
  await expect(readerPage.getByText(`Material archivable ${marker}`, { exact: true })).toHaveCount(0);
  // The data boundary, not the page: `get_published_reference` is security invoker,
  // so reader RLS (which requires `archived_at is null`) resolves nothing at all.
  expect((await readerClient.rpc("get_published_reference", { reference_type: "material", target_id: material.contentId })).data).toBeNull();
  await readerPage.goto(`/app/library/references/material/${material.contentId}`);
  await expect(readerPage.getByText("No encontramos esta publicación.")).toBeVisible();
  await expect(readerPage.getByText(`Material archivable ${marker}`, { exact: true })).toHaveCount(0);
  expect((await readerClient.storage.from("governed-attachments").download(material.attachment.object_name)).error).not.toBeNull();
  expect(await readerPage.evaluate(async (id) => (await fetch(`/api/attachments/${id}`)).status, material.attachment.id)).toBe(404);

  // History records the identity event, attributes the organization, and invents no
  // revision transition.
  await adminAPage.goto(`/app/contributions/history?type=material&content=${material.contentId}`);
  const archiveEvent = adminAPage.getByRole("listitem").filter({ hasText: "Contenido archivado" });
  await expect(archiveEvent).toHaveCount(1);
  await expect(archiveEvent).toContainText("Identidad");
  await expect(archiveEvent).toContainText(organizationName);
  await expect(archiveEvent).not.toContainText("Cambio de versión");
  await expect(adminAPage.getByText("Publicado → Archivado")).toHaveCount(0);
  await expect(adminAPage.getByRole("listitem").filter({ hasText: "Contenido publicado" }).first()).toContainText("Borrador → Publicado");

  // A different Admin restores it: Admin authority is role-wide, not the archiver's.
  await login(adminBPage, adminB.email);
  await adminBPage.goto("/app/contributions?state=archived");
  await adminBPage.getByRole("button", { name: `Restaurar Material archivable ${marker}` }).click();
  await expect(adminBPage).toHaveURL(new RegExp(`/app/contributions/material/${material.revisionId}$`));
  await expect(adminBPage.getByRole("heading", { name: "Contenido publicado" })).toBeVisible();

  const restoredIdentity = await operator.from("materials").select("current_published_revision_id,archived_at").eq("id", material.contentId).single();
  assertSuccess(restoredIdentity);
  expect(restoredIdentity.data).toEqual({ current_published_revision_id: material.revisionId, archived_at: null });
  // Restore creates no new revision.
  expect((await operator.from("material_revisions").select("id", { count: "exact", head: true }).eq("material_id", material.contentId)).count).toBe(1);

  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material archivable ${marker}`, { exact: true })).toBeVisible();
  await readerPage.goto(`/app/library/references/material/${material.contentId}`);
  await expect(readerPage.getByRole("link", { name: `Descargar archivable-${marker}.pdf` })).toBeVisible();
  expect((await readerClient.storage.from("governed-attachments").download(material.attachment.object_name)).error).toBeNull();

  await adminAPage.goto(`/app/contributions/history?type=material&content=${material.contentId}`);
  await expect(adminAPage.getByRole("listitem").filter({ hasText: "Contenido restaurado" })).toHaveCount(1);

  await adminAContext.close();
  await adminBContext.close();
  await readerContext.close();
});

test("Archival is blocked by published dependents and by an active successor Draft", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const admin = await provision("Admin");
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, admin.email);

  // A Material that an active current-published Module depends on.
  const material = await publishMaterial(page, marker);
  const axis = await operator.from("axes").select("id").order("display_order").limit(1).single();
  assertSuccess(axis);
  await page.goto("/app/contributions/new/module");
  await page.getByLabel("Eje *").selectOption(axis.data!.id);
  await page.getByLabel("Título *").fill(`Módulo dependiente ${marker}`);
  await page.getByLabel("Descripción *").fill("Módulo que depende del material publicado.");
  await page.getByRole("group", { name: "Materiales o estudios" })
    .getByRole("checkbox", { name: `Material archivable ${marker}` }).check();
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/app\/contributions\/module\/[0-9a-f-]+$/);
  const moduleRevisionId = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Publicado correctamente");

  // Archiving the Material is refused, and the blocking content is named.
  await page.goto(`/app/contributions/material/${material.revisionId}`);
  await page.getByRole("button", { name: "Archivar" }).click();
  await page.getByRole("button", { name: "Confirmar archivado" }).click();
  // Scoped to the governance region: Next renders its own always-present route announcer with role=alert.
  const blocked = page.getByRole("region", { name: "Gobernanza" }).getByRole("alert");
  await expect(blocked).toContainText("No se puede archivar este contenido");
  await expect(blocked).toContainText("Módulo");
  await expect(blocked).toContainText(`Módulo dependiente ${marker}`);
  await expect(blocked).toContainText("Resuelve estas dependencias");
  // No cascade, and the target stays active.
  expect((await operator.from("materials").select("archived_at").eq("id", material.contentId).single()).data!.archived_at).toBeNull();
  const moduleRevision = await operator.from("module_revisions").select("module_id").eq("id", moduleRevisionId).single();
  assertSuccess(moduleRevision);
  expect((await operator.from("modules").select("archived_at").eq("id", moduleRevision.data!.module_id).single()).data!.archived_at).toBeNull();
  expect((await operator.from("curriculum_lifecycle_events").select("id", { count: "exact", head: true }).eq("content_id", material.contentId).eq("action", "content_archived")).count).toBe(0);

  // An active successor Draft removes Archive from the published Module detail, and
  // the database still refuses a stale attempt.
  await page.goto(`/app/contributions/module/${moduleRevisionId}`);
  await page.getByRole("button", { name: "Crear nueva versión" }).click();
  await expect(page).toHaveURL(/\/app\/contributions\/module\/[0-9a-f-]+$/);
  await page.goto(`/app/contributions/module/${moduleRevisionId}`);
  await expect(page.getByRole("heading", { name: "Gobernanza" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Archivar" })).toHaveCount(0);
  await expect(page.getByText(/Este contenido no se puede archivar mientras exista una nueva versión en borrador/)).toBeVisible();
  const adminClient = await userClient(context);
  const staleAttempt = await adminClient.rpc("archive_governed_content", { requested_type: "module", requested_content_id: moduleRevision.data!.module_id });
  expect(staleAttempt.error?.message).toContain("active Draft blocks archival");

  await context.close();
});
