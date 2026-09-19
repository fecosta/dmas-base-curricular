import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/**
 * SPEC-005 governance acceptance on the complete local real stack: real Supabase,
 * real RLS/RPC boundaries, real browser, real fixture identities resolved through
 * `auth identity -> approved domain -> active membership -> active organization ->
 * persisted role`. Complements archival.spec.ts, which owns the archive/restore
 * reader and attachment journey.
 */

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const organizationName = "Red de gobernanza E2E";
const domain = `governance-${randomUUID()}.test`;

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

type Client = Awaited<ReturnType<typeof userClient>>;

/** Publishes a Material through the authoritative RPCs as the signed-in Admin. */
async function publishMaterial(client: Client, title: string) {
  const draft = await client.rpc("create_contribution", { requested_type: "material", payload: { title, material_type: "Informe" } });
  assertSuccess(draft);
  const { content_id: contentId, revision_id: revisionId } = draft.data as { content_id: string; revision_id: string };
  assertSuccess(await client.rpc("publish_content_draft", { requested_type: "material", requested_revision_id: revisionId }));
  return { contentId, revisionId };
}

async function archivedEventCount(contentId: string, action: "content_archived" | "content_restored") {
  const result = await operator.from("curriculum_lifecycle_events")
    .select("id", { count: "exact", head: true }).eq("content_id", contentId).eq("action", action);
  assertSuccess(result);
  return result.count ?? 0;
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: organizationName, is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("governance authority is role-wide: either Admin archives and restores the other's content", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const adminA = await provision("Admin");
  const adminB = await provision("Admin");
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await login(pageA, adminA.email);
  const clientA = await userClient(contextA);
  const material = await publishMaterial(clientA, `Material cruzado ${marker}`);
  const created = await operator.from("materials").select("created_by").eq("id", material.contentId).single();
  assertSuccess(created);
  expect(created.data!.created_by).toBe(adminA.id);

  // Admin B archives content Admin A created and published.
  await login(pageB, adminB.email);
  await pageB.goto(`/app/contributions/material/${material.revisionId}`);
  await pageB.getByRole("button", { name: "Archivar" }).click();
  await pageB.getByRole("button", { name: "Confirmar archivado" }).click();
  await expect(pageB).toHaveURL(/\/app\/contributions\?state=archived$/);
  const archived = await operator.from("materials").select("archived_by,archived_at").eq("id", material.contentId).single();
  assertSuccess(archived);
  expect(archived.data!.archived_by).toBe(adminB.id);
  const archiveEvent = await operator.from("curriculum_lifecycle_events")
    .select("actor_user_id").eq("content_id", material.contentId).eq("action", "content_archived").single();
  assertSuccess(archiveEvent);
  expect(archiveEvent.data!.actor_user_id).toBe(adminB.id);

  // Admin A restores content Admin B archived.
  await pageA.goto("/app/contributions?state=archived");
  await pageA.getByRole("button", { name: `Restaurar Material cruzado ${marker}` }).click();
  await expect(pageA).toHaveURL(new RegExp(`/app/contributions/material/${material.revisionId}$`));
  const restoreEvent = await operator.from("curriculum_lifecycle_events")
    .select("actor_user_id").eq("content_id", material.contentId).eq("action", "content_restored").single();
  assertSuccess(restoreEvent);
  expect(restoreEvent.data!.actor_user_id).toBe(adminA.id);
  expect((await operator.from("materials").select("archived_at,archived_by").eq("id", material.contentId).single()).data)
    .toEqual({ archived_at: null, archived_by: null });

  await contextA.close();
  await contextB.close();
});

test("restore is refused while a required dependency is no longer current-published", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const admin = await provision("Admin");
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, admin.email);
  const client = await userClient(context);

  const material = await publishMaterial(client, `Material dependencia ${marker}`);
  const axis = await operator.from("axes").select("id").order("display_order").limit(1).single();
  assertSuccess(axis);
  const moduleDraft = await client.rpc("create_contribution", { requested_type: "module", payload: {
    axis_id: axis.data!.id, title: `Módulo dependiente ${marker}`, description: "Depende de un material publicado.",
    material_ids: [material.contentId],
  } });
  assertSuccess(moduleDraft);
  const { content_id: moduleId, revision_id: moduleRevisionId } = moduleDraft.data as { content_id: string; revision_id: string };
  assertSuccess(await client.rpc("publish_content_draft", { requested_type: "module", requested_revision_id: moduleRevisionId }));

  // Archive the dependent Module first, which then frees the Material to be archived.
  await page.goto(`/app/contributions/module/${moduleRevisionId}`);
  await page.getByRole("button", { name: "Archivar" }).click();
  await page.getByRole("button", { name: "Confirmar archivado" }).click();
  await expect(page).toHaveURL(/state=archived$/);
  await page.goto(`/app/contributions/material/${material.revisionId}`);
  await page.getByRole("button", { name: "Archivar" }).click();
  await page.getByRole("button", { name: "Confirmar archivado" }).click();
  await expect(page).toHaveURL(/state=archived$/);

  // Restoring the Module must now fail: its published representation requires a
  // current-published Material that is archived.
  await page.goto("/app/contributions?state=archived");
  await page.getByRole("button", { name: `Restaurar Módulo dependiente ${marker}` }).click();
  // Scoped to the rendered notice: Next always renders an empty role=alert route announcer.
  await expect(page.locator("p[role=alert]")).toContainText("No se puede restaurar este contenido");
  expect((await operator.from("modules").select("archived_at").eq("id", moduleId).single()).data!.archived_at).not.toBeNull();
  expect(await archivedEventCount(moduleId, "content_restored")).toBe(0);
  expect((await operator.from("module_revisions").select("status").eq("id", moduleRevisionId).single()).data!.status).toBe("Published");

  // Restoring the dependency first makes the Module restorable again.
  await page.goto("/app/contributions?state=archived");
  await page.getByRole("button", { name: `Restaurar Material dependencia ${marker}` }).click();
  await expect(page).toHaveURL(new RegExp(`/app/contributions/material/${material.revisionId}$`));
  await page.goto("/app/contributions?state=archived");
  await page.getByRole("button", { name: `Restaurar Módulo dependiente ${marker}` }).click();
  await expect(page).toHaveURL(new RegExp(`/app/contributions/module/${moduleRevisionId}$`));
  expect((await operator.from("modules").select("archived_at").eq("id", moduleId).single()).data!.archived_at).toBeNull();
  expect(await archivedEventCount(moduleId, "content_restored")).toBe(1);

  await context.close();
});

test("live Admin revocation removes archive, restore and history authority without re-login", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const admin = await provision("Admin");
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, admin.email);
  const client = await userClient(context);

  const material = await publishMaterial(client, `Material revocación ${marker}`);
  // Authority works while the persisted role is Admin.
  expect((await client.rpc("list_archived_governed_content", { page_size: 5 })).error).toBeNull();
  expect((await client.rpc("list_curriculum_lifecycle_history", { page_size: 5 })).error).toBeNull();
  await page.goto("/app/contributions/history");
  await expect(page.getByRole("heading", { name: "Historial de gobernanza" })).toBeVisible();

  // Revoke the persisted role. The browser session and access token are untouched.
  assertSuccess(await operator.from("memberships").update({ role: "Contributor" }).eq("user_id", admin.id));

  for (const [label, result] of [
    ["archive", await client.rpc("archive_governed_content", { requested_type: "material", requested_content_id: material.contentId })],
    ["restore", await client.rpc("restore_governed_content", { requested_type: "material", requested_content_id: material.contentId })],
    ["history", await client.rpc("list_curriculum_lifecycle_history", { page_size: 5 })],
    ["archived list", await client.rpc("list_archived_governed_content", { page_size: 5 })],
  ] as const) {
    expect(result.error, `${label} must be denied after revocation`).not.toBeNull();
    expect(result.error!.code).toBe("42501");
  }
  await page.goto("/app/contributions/history");
  await expect(page).toHaveURL(/\/access-denied$/);
  await page.goto("/app/contributions?state=archived");
  await expect(page).toHaveURL(/\/access-denied$/);
  // Revocation did not archive anything.
  expect((await operator.from("materials").select("archived_at").eq("id", material.contentId).single()).data!.archived_at).toBeNull();

  await context.close();
});

test("archived management pages through the full three-part keyset without skipping or duplicating", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const admin = await provision("Admin");
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, admin.email);
  const client = await userClient(context);

  // 23 archived identities forces a second page at the application page size of 20.
  const created: string[] = [];
  for (let index = 0; index < 23; index++) {
    const material = await publishMaterial(client, `Paginado ${marker} ${String(index).padStart(2, "0")}`);
    assertSuccess(await client.rpc("archive_governed_content", { requested_type: "material", requested_content_id: material.contentId }));
    created.push(material.contentId);
  }

  // Only archived entries render an h3 on this surface, so the count is the page size.
  const entryTitles = page.getByRole("heading", { level: 3 });
  await page.goto("/app/contributions?state=archived");
  await expect(entryTitles).toHaveCount(20);
  const first = await entryTitles.allInnerTexts();
  expect(first.every((title) => title.includes(marker))).toBe(true);

  const more = page.getByRole("link", { name: "Ver más contenido archivado" });
  await expect(more).toBeVisible();
  const href = await more.getAttribute("href");
  const cursor = new URLSearchParams(href!.split("?")[1]);
  // The cursor must stay total: dropping content_type is what allowed a tied row to be skipped.
  expect(cursor.get("before_at")).toBeTruthy();
  expect(cursor.get("before_id")).toBeTruthy();
  expect(cursor.get("before_type")).toBe("material");

  await more.click();
  await expect(entryTitles).toHaveCount(3);
  const second = await entryTitles.allInnerTexts();

  const walked = [...first, ...second];
  expect(new Set(walked).size, "no archived entry may be duplicated").toBe(23);
  expect(walked.length, "no archived entry may be skipped").toBe(23);

  // The type filter must still scope the archived boundary.
  await page.goto("/app/contributions?state=archived&type=institution");
  await expect(page.getByText("Sin contenido archivado")).toBeVisible();
  await expect(entryTitles).toHaveCount(0);

  for (const contentId of created) {
    assertSuccess(await client.rpc("restore_governed_content", { requested_type: "material", requested_content_id: contentId }));
  }
  await context.close();
});

test("history is bounded, ordered newest first, and keeps identity and revision events distinct", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const admin = await provision("Admin");
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, admin.email);
  const client = await userClient(context);

  const material = await publishMaterial(client, `Material historial ${marker}`);
  assertSuccess(await client.rpc("archive_governed_content", { requested_type: "material", requested_content_id: material.contentId }));
  assertSuccess(await client.rpc("restore_governed_content", { requested_type: "material", requested_content_id: material.contentId }));

  await page.goto(`/app/contributions/history?type=material&content=${material.contentId}`);
  // Scoped to the events list: the shell navigation also renders list items.
  const entries = page.locator("ol > li");
  // Newest first: restore precedes archive, which precedes publication.
  await expect(entries.nth(0)).toContainText("Contenido restaurado");
  await expect(entries.nth(1)).toContainText("Contenido archivado");
  await expect(entries.nth(2)).toContainText("Contenido publicado");

  const restored = entries.nth(0);
  await expect(restored).toContainText("Identidad");
  await expect(restored).toContainText(organizationName);
  await expect(restored).not.toContainText("Cambio de versión");
  const published = entries.nth(2);
  await expect(published).toContainText("Versión");
  await expect(published).toContainText("Borrador → Publicado");
  // Attribution never exposes the actor's email or auth metadata.
  await expect(page.getByText(admin.email)).toHaveCount(0);
  await expect(page.getByText("Publicado → Archivado")).toHaveCount(0);

  // Global history is bounded and pages with before_event_id.
  await page.goto("/app/contributions/history");
  await expect(page.locator("ol > li").first()).toBeVisible();
  const firstPage = await page.locator("ol > li").count();
  expect(firstPage).toBeLessThanOrEqual(25);
  const older = page.getByRole("link", { name: "Ver eventos anteriores" });
  if (await older.count()) {
    const href = await older.getAttribute("href");
    expect(new URLSearchParams(href!.split("?")[1]).get("before")).toMatch(/^\d+$/);
    await older.click();
    await expect(page.getByRole("link", { name: "Volver a los eventos más recientes" })).toBeVisible();
  }

  await context.close();
});

test("historical revisions stay hidden from readers before, during and after archive", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const admin = await provision("Admin");
  const reader = await provision("Contributor");
  const adminContext = await browser.newContext();
  const readerContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const readerPage = await readerContext.newPage();
  await login(adminPage, admin.email);
  const client = await userClient(adminContext);

  const material = await publishMaterial(client, `Histórico v1 ${marker}`);
  const successor = await client.rpc("create_successor_draft", { requested_type: "material", requested_content_id: material.contentId });
  assertSuccess(successor);
  const v2RevisionId = (successor.data as { revision_id: string }).revision_id;
  assertSuccess(await client.rpc("update_contribution", { requested_type: "material", requested_revision_id: v2RevisionId, payload: { title: `Histórico v2 ${marker}`, material_type: "Informe" } }));
  assertSuccess(await client.rpc("publish_content_draft", { requested_type: "material", requested_revision_id: v2RevisionId }));

  await login(readerPage, reader.email);
  const readerClient = await userClient(readerContext);
  const readerSeesOnlyCurrent = async () => {
    await readerPage.goto(`/app/library?q=${marker}`);
    await expect(readerPage.getByText(`Histórico v1 ${marker}`, { exact: true })).toHaveCount(0);
    const reference = await readerClient.rpc("get_published_reference", { reference_type: "material", target_id: material.contentId });
    return reference.data as { title?: string } | null;
  };
  expect((await readerSeesOnlyCurrent())?.title).toBe(`Histórico v2 ${marker}`);

  assertSuccess(await client.rpc("archive_governed_content", { requested_type: "material", requested_content_id: material.contentId }));
  expect(await readerSeesOnlyCurrent()).toBeNull();

  assertSuccess(await client.rpc("restore_governed_content", { requested_type: "material", requested_content_id: material.contentId }));
  expect((await readerSeesOnlyCurrent())?.title).toBe(`Histórico v2 ${marker}`);
  // Two revisions exist; archive/restore created none.
  expect((await operator.from("material_revisions").select("id", { count: "exact", head: true }).eq("material_id", material.contentId)).count).toBe(2);

  await adminContext.close();
  await readerContext.close();
});

test("a non-Admin reader is refused every governance surface at the data boundary", async ({ browser }) => {
  const reader = await provision("Contributor");
  const context = await browser.newContext();
  const page = await context.newPage();
  await login(page, reader.email);
  const client = await userClient(context);

  for (const route of ["/app/contributions", "/app/contributions?state=archived", "/app/contributions/history", "/app/contributions/new"]) {
    await page.goto(route);
    await expect(page, `${route} must be denied`).toHaveURL(/\/access-denied$/);
  }
  await expect(page.getByRole("link", { name: "Administrar contenido" })).toHaveCount(0);

  for (const [label, result] of [
    ["archive", await client.rpc("archive_governed_content", { requested_type: "material", requested_content_id: randomUUID() })],
    ["restore", await client.rpc("restore_governed_content", { requested_type: "material", requested_content_id: randomUUID() })],
    ["history", await client.rpc("list_curriculum_lifecycle_history", { page_size: 5 })],
    ["archived list", await client.rpc("list_archived_governed_content", { page_size: 5 })],
  ] as const) {
    expect(result.error, `${label} must be denied for a reader`).not.toBeNull();
    expect(result.error!.code).toBe("42501");
  }
  // Lifecycle evidence is not a readable application table either.
  expect((await client.from("curriculum_lifecycle_events").select("id").limit(1)).error).not.toBeNull();

  await context.close();
});
