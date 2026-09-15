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

async function saveDraft(page: Page) {
  const response = page.waitForResponse((candidate) => candidate.request().method() === "POST" && "next-action" in candidate.request().headers());
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  expect((await response).ok()).toBe(true);
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeEnabled();
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
  expect((await readerClient.rpc("update_contribution", { requested_type: "material", requested_revision_id: randomUUID(), payload: { title: "Ataque", material_type: "Informe" } })).error).not.toBeNull();
  expect((await readerClient.rpc("publish_content_draft", { requested_type: "material", requested_revision_id: randomUUID() })).error).not.toBeNull();
  expect((await readerClient.rpc("create_successor_draft", { requested_type: "material", requested_content_id: randomUUID() })).error).not.toBeNull();
  expect((await readerClient.rpc("reserve_attachment", { requested_type: "material", requested_revision_id: randomUUID(), requested_filename: "ataque.pdf", requested_mime_type: "application/pdf", requested_size_bytes: 20 })).error).not.toBeNull();
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
  const materialRevision = await operator.from("material_revisions").select("material_id,created_by,revision_number,status,title").eq("id", draftV1RevisionId).single();
  assertSuccess(materialRevision);
  const materialId = materialRevision.data!.material_id;
  expect(materialRevision.data).toMatchObject({ created_by: adminA.id, revision_number: 1, status: "Draft", title: `Material vigente ${marker}` });
  const materialIdentity = await operator.from("materials").select("created_by,current_published_revision_id").eq("id", materialId).single();
  assertSuccess(materialIdentity);
  expect(materialIdentity.data).toEqual({ created_by: adminA.id, current_published_revision_id: null });
  const v1AttachmentResult = await operator.from("curriculum_attachments").select("id,object_name").eq("material_revision_id", draftV1RevisionId).single();
  assertSuccess(v1AttachmentResult);
  const v1Attachment = v1AttachmentResult.data!;
  expect((await readerClient.storage.from("governed-attachments").download(v1Attachment.object_name)).error).not.toBeNull();
  expect(await readerPage.evaluate(async (id) => (await fetch(`/api/attachments/${id}`)).status, v1Attachment.id)).toBe(404);
  const unauthorizedUpload = await readerClient.storage.from("governed-attachments").upload(randomUUID(), Buffer.from("%PDF-1.4 denied"), { contentType: "application/pdf" });
  expect(unauthorizedUpload.error).not.toBeNull();
  await readerClient.storage.from("governed-attachments").remove([v1Attachment.object_name]);
  expect((await operator.storage.from("governed-attachments").download(v1Attachment.object_name)).error).toBeNull();

  await login(adminBPage, adminB.email);
  await adminBPage.goto(draftV1Url);
  await expect(adminBPage.getByRole("heading", { name: "Editar borrador" })).toBeVisible();
  await expect(adminBPage.getByRole("link", { name: `material-${marker}.pdf` })).toBeVisible();
  const adminBClient = await userClient(adminBContext);
  expect((await adminBClient.storage.from("governed-attachments").download(v1Attachment.object_name)).error).toBeNull();
  await adminBPage.getByLabel("Agregar archivo").setInputFiles({ name: `descartar-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 disposable fixture") });
  await adminBPage.getByRole("button", { name: "Cargar archivo" }).click();
  const disposable = adminBPage.getByRole("listitem").filter({ hasText: `descartar-${marker}.pdf` });
  await disposable.getByRole("button", { name: "Eliminar" }).click();
  await expect(disposable).toHaveCount(0);
  await adminBPage.getByLabel("Descripción").fill("Descripción editada por una segunda administradora.");
  await saveDraft(adminBPage);
  await expect.poll(async () => (await operator.from("material_revisions").select("description").eq("id", draftV1RevisionId).single()).data?.description).toBe("Descripción editada por una segunda administradora.");
  const crossAdminRevision = await operator.from("material_revisions").select("created_by,contributor_organization_id,description").eq("id", draftV1RevisionId).single();
  assertSuccess(crossAdminRevision);
  expect(crossAdminRevision.data).toEqual({ created_by: adminA.id, contributor_organization_id: organizationId, description: "Descripción editada por una segunda administradora." });
  const crossAdminEvent = await operator.from("curriculum_lifecycle_events").select("actor_user_id,actor_organization_id,action").eq("revision_id", draftV1RevisionId).eq("action", "revision_edited").order("occurred_at", { ascending: false }).limit(1).single();
  assertSuccess(crossAdminEvent);
  expect(crossAdminEvent.data).toEqual({ actor_user_id: adminB.id, actor_organization_id: organizationId, action: "revision_edited" });
  await expect(adminBPage.getByRole("button", { name: /Enviar|revisión/i })).toHaveCount(0);
  await adminBPage.getByRole("button", { name: "Publicar" }).click();
  await expect(adminBPage.getByRole("status")).toContainText("Publicado correctamente");
  await expect(adminBPage.getByRole("heading", { name: "Contenido publicado" })).toBeVisible();
  const publishedV1 = await operator.from("materials").select("current_published_revision_id").eq("id", materialId).single();
  assertSuccess(publishedV1);
  expect(publishedV1.data!.current_published_revision_id).toBe(draftV1RevisionId);
  const publishedV1Revision = await operator.from("material_revisions").select("status,published_at,title").eq("id", draftV1RevisionId).single();
  assertSuccess(publishedV1Revision);
  expect(publishedV1Revision.data).toMatchObject({ status: "Published", title: `Material vigente ${marker}` });
  expect(publishedV1Revision.data!.published_at).not.toBeNull();

  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material vigente ${marker}`, { exact: true })).toBeVisible();
  expect((await readerClient.storage.from("governed-attachments").download(v1Attachment.object_name)).error).toBeNull();
  await readerPage.goto(`/app/library/references/material/${materialId}`);
  const v1Download = readerPage.getByRole("link", { name: `Descargar material-${marker}.pdf` });
  await expect(v1Download).toBeVisible();
  const downloadPromise = readerPage.waitForEvent("download");
  await v1Download.click();
  expect((await downloadPromise).suggestedFilename()).toBe(`material-${marker}.pdf`);

  const anonymousClient = createClient<Database>(local.url, local.key, { auth: { persistSession: false, autoRefreshToken: false } });
  expect((await anonymousClient.storage.from("governed-attachments").download(v1Attachment.object_name)).error).not.toBeNull();
  const anonymousContext = await browser.newContext();
  expect((await anonymousContext.request.get(`/api/attachments/${v1Attachment.id}`, { maxRedirects: 0 })).status()).toBe(401);
  await anonymousContext.close();

  await adminAPage.goto(`/app/contributions/material/${draftV1RevisionId}`);
  await adminAPage.getByRole("button", { name: "Crear nueva versión" }).click();
  await expect.poll(() => adminAPage.url()).not.toBe(draftV1Url);
  const draftV2Url = adminAPage.url();
  await expect(adminAPage.getByRole("heading", { name: "Editar borrador" })).toBeVisible();
  await expect(adminAPage.getByText(/biblioteca seguirá mostrando la versión anterior/i)).toBeVisible();
  await expect(adminAPage.getByLabel("Título *")).toHaveValue(`Material vigente ${marker}`);
  await expect(adminAPage.getByText("No hay archivos adjuntos.")).toBeVisible();
  await adminAPage.getByLabel("Título *").fill(`Material actualizado ${marker}`);
  await saveDraft(adminAPage);
  const draftV2RevisionId = draftV2Url.split("/").pop()!;
  await expect.poll(async () => (await operator.from("material_revisions").select("title").eq("id", draftV2RevisionId).single()).data?.title).toBe(`Material actualizado ${marker}`);
  const successorV2 = await operator.from("material_revisions").select("material_id,revision_number,status,created_by").eq("id", draftV2RevisionId).single();
  assertSuccess(successorV2);
  expect(successorV2.data).toEqual({ material_id: materialId, revision_number: 2, status: "Draft", created_by: adminA.id });
  expect((await operator.from("curriculum_attachments").select("id", { count: "exact", head: true }).eq("material_revision_id", draftV2RevisionId)).count).toBe(0);
  expect((await operator.from("materials").select("current_published_revision_id").eq("id", materialId).single()).data!.current_published_revision_id).toBe(draftV1RevisionId);
  expect((await operator.from("material_revisions").select("status,title").eq("id", draftV1RevisionId).single()).data).toEqual({ status: "Published", title: `Material vigente ${marker}` });
  await adminAPage.getByLabel("Agregar archivo").setInputFiles({ name: `material-v2-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 successor fixture") });
  await adminAPage.getByRole("button", { name: "Cargar archivo" }).click();
  await expect(adminAPage.getByRole("link", { name: `material-v2-${marker}.pdf` })).toBeVisible();
  const v2AttachmentResult = await operator.from("curriculum_attachments").select("id,object_name").eq("material_revision_id", draftV2RevisionId).single();
  assertSuccess(v2AttachmentResult);
  const v2Attachment = v2AttachmentResult.data!;

  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material vigente ${marker}`, { exact: true })).toBeVisible();
  await expect(readerPage.getByText(`Material actualizado ${marker}`, { exact: true })).toHaveCount(0);
  expect((await readerClient.storage.from("governed-attachments").download(v1Attachment.object_name)).error).toBeNull();
  expect((await readerClient.storage.from("governed-attachments").download(v2Attachment.object_name)).error).not.toBeNull();
  await readerPage.goto(`/app/library/references/material/${materialId}`);
  await expect(readerPage.getByRole("link", { name: `Descargar material-${marker}.pdf` })).toBeVisible();
  await expect(readerPage.getByRole("link", { name: `Descargar material-v2-${marker}.pdf` })).toHaveCount(0);

  await adminBPage.goto(draftV2Url);
  await expect(adminBPage.getByLabel("Título *")).toHaveValue(`Material actualizado ${marker}`);
  await adminBPage.getByLabel("Descripción").fill("Versión sucesora editada por la segunda administradora.");
  await saveDraft(adminBPage);
  await expect.poll(async () => (await operator.from("material_revisions").select("description").eq("id", draftV2RevisionId).single()).data?.description).toBe("Versión sucesora editada por la segunda administradora.");
  await adminBPage.getByRole("button", { name: "Publicar" }).click();
  await expect(adminBPage.getByRole("status")).toContainText("Publicado correctamente");
  const promotedV2 = await operator.from("materials").select("current_published_revision_id").eq("id", materialId).single();
  assertSuccess(promotedV2);
  expect(promotedV2.data!.current_published_revision_id).toBe(draftV2RevisionId);
  const historicalV1 = await operator.from("material_revisions").select("status,title").eq("id", draftV1RevisionId).single();
  assertSuccess(historicalV1);
  expect(historicalV1.data).toEqual({ status: "Published", title: `Material vigente ${marker}` });

  await readerPage.goto(`/app/library?q=${marker}`);
  await expect(readerPage.getByText(`Material actualizado ${marker}`, { exact: true })).toBeVisible();
  await expect(readerPage.getByText(`Material vigente ${marker}`, { exact: true })).toHaveCount(0);
  expect((await readerClient.storage.from("governed-attachments").download(v2Attachment.object_name)).error).toBeNull();
  expect((await readerClient.storage.from("governed-attachments").download(v1Attachment.object_name)).error).not.toBeNull();
  await readerPage.goto(`/app/library/references/material/${materialId}`);
  await expect(readerPage.getByRole("link", { name: `Descargar material-v2-${marker}.pdf` })).toBeVisible();
  await expect(readerPage.getByRole("link", { name: `Descargar material-${marker}.pdf` })).toHaveCount(0);
  expect((await operator.storage.from("governed-attachments").download(v1Attachment.object_name)).error).toBeNull();
  expect((await operator.storage.from("governed-attachments").download(v2Attachment.object_name)).error).toBeNull();

  assertSuccess(await operator.from("memberships").update({ is_active: false }).eq("user_id", reader.id));
  expect(await readerPage.evaluate(async (id) => (await fetch(`/api/attachments/${id}`)).status, v2Attachment.id)).toBe(403);
  expect((await readerClient.storage.from("governed-attachments").download(v2Attachment.object_name)).error).not.toBeNull();

  await adminAPage.goto(draftV2Url);
  await adminAPage.getByRole("button", { name: "Crear nueva versión" }).click();
  await expect.poll(() => adminAPage.url()).not.toBe(draftV2Url);
  const revokedDraftUrl = adminAPage.url();
  const revokedDraftRevisionId = revokedDraftUrl.split("/").pop()!;
  await adminAPage.getByLabel("Agregar archivo").setInputFiles({ name: `revocado-${marker}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 revoked fixture") });
  await adminAPage.getByRole("button", { name: "Cargar archivo" }).click();
  await expect(adminAPage.getByRole("link", { name: `revocado-${marker}.pdf` })).toBeVisible();
  const revokedAttachment = await operator.from("curriculum_attachments").select("id").eq("material_revision_id", revokedDraftRevisionId).single();
  assertSuccess(revokedAttachment);

  assertSuccess(await operator.from("memberships").update({ role: "Contributor" }).eq("user_id", adminA.id));
  const revokedClient = await userClient(adminAContext);
  expect((await revokedClient.rpc("create_contribution", { requested_type: "material", payload: { title: "Revocado", material_type: "Informe" } })).error).not.toBeNull();
  expect((await revokedClient.rpc("update_contribution", { requested_type: "material", requested_revision_id: revokedDraftRevisionId, payload: { title: "Revocado", material_type: "Informe" } })).error).not.toBeNull();
  expect((await revokedClient.rpc("publish_content_draft", { requested_type: "material", requested_revision_id: revokedDraftRevisionId })).error).not.toBeNull();
  expect((await revokedClient.rpc("create_successor_draft", { requested_type: "material", requested_content_id: materialId })).error).not.toBeNull();
  expect((await revokedClient.rpc("reserve_attachment", { requested_type: "material", requested_revision_id: revokedDraftRevisionId, requested_filename: "revocado-2.pdf", requested_mime_type: "application/pdf", requested_size_bytes: 20 })).error).not.toBeNull();
  expect(await adminAPage.evaluate(async ({ revisionId, attachmentId }) => (await fetch(`/api/contributions/material/${revisionId}/attachments/${attachmentId}`, { method: "DELETE" })).status, { revisionId: revokedDraftRevisionId, attachmentId: revokedAttachment.data!.id })).toBe(403);
  await adminAPage.goto("/app/contributions");
  await expect(adminAPage).toHaveURL(/\/access-denied$/);
  await adminAPage.goto("/app");
  await expect(adminAPage.getByRole("link", { name: "Administrar contenido" })).toHaveCount(0);

  await adminAContext.close();
  await adminBContext.close();
  await readerContext.close();
});

// Append-only lifecycle evidence intentionally remains until the next local db:reset.
