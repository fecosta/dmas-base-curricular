import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-006 Phase 5 — Admin content-management UX.
 *
 * Covers what only a browser can settle for these surfaces: that the recomposed
 * workspace, creation picker and forms fit every validated width without
 * horizontal overflow, that the relationship picker's filtering rule holds
 * through real typing and real checkboxes, that what it submits still reaches
 * the database as relationships, and that a Published revision is genuinely
 * read-only rather than merely styled that way.
 */

const local = localSupabase();
// Privileged access is confined to local test fixture setup, never app code.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const domain = `content-ux-${randomUUID()}.test`;

/** Every width SPEC-006 §15 requires, widest first. */
const WIDTHS = [1440, 1280, 1024, 900, 768, 390];

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

async function provision(role: "Contributor" | "Admin") {
  const email = `${randomUUID()}@${domain}`;
  const created = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(created);
  assertSuccess(await operator.from("memberships").insert({
    user_id: created.data.user!.id, organization_id: organizationId, is_active: true, role,
  }));
  return email;
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

async function signIn(page: Page, role: "Contributor" | "Admin") {
  await login(page, await provision(role));
}

/** A page wider than its viewport is the overflow this phase must not introduce. */
async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Saves a Material Draft through the production form and returns its revision id. */
async function saveMaterialDraft(page: Page, title: string) {
  await page.goto("/app/contributions/new/material");
  await page.getByLabel("Título *").fill(title);
  await page.getByLabel("Tipo de material *").fill("Informe");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/app\/contributions\/material\/[0-9a-f-]+$/);
  return page.url().split("/").pop()!;
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: "Red de gestión de contenido E2E", is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("every content-management surface fits the validated widths, including a form at 390px", async ({ page }) => {
  const marker = randomUUID().slice(0, 8);
  await signIn(page, "Admin");
  const revisionId = await saveMaterialDraft(page, `Material responsive ${marker}`);

  const routes = [
    "/app/contributions",
    "/app/contributions?q=material&type=material&state=draft",
    "/app/contributions?state=archived",
    "/app/contributions/new",
    "/app/contributions/new/module",
    `/app/contributions/material/${revisionId}`,
  ];

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      expect(await horizontalOverflow(page), `${route} overflows at ${width}px`).toBeLessThanOrEqual(0);
    }
  }

  // At the narrowest width the editing controls are still reachable and usable,
  // not merely present: a phone has to be able to finish the job.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/app/contributions/material/${revisionId}`);
  const title = page.getByLabel("Título *");
  await expect(title).toBeVisible();
  await title.fill(`Material responsive editado ${marker}`);
  await expect(page.getByLabel("Agregar archivo")).toBeVisible();
  const save = page.getByRole("button", { name: "Guardar borrador" });
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeVisible();
  await save.click();
  await expect.poll(async () => (await operator.from("material_revisions").select("title").eq("id", revisionId).single()).data?.title)
    .toBe(`Material responsive editado ${marker}`);

  // The lifecycle action stays reachable on the same narrow viewport.
  await expect(page.getByRole("button", { name: "Publicar" })).toBeVisible();
});

test("the creation picker offers every governed type on its canonical route", async ({ page }) => {
  await signIn(page, "Admin");
  await page.goto("/app/contributions/new");

  const types = [
    ["Módulo", "module"],
    ["Tema de programa", "program_topic"],
    ["Docente o especialista", "instructor"],
    ["Nota docente", "teaching_note"],
    ["Material o estudio", "material"],
    ["Institución o centro", "institution"],
  ] as const;

  // Located by destination rather than by accessible name: each card names its
  // type and then describes it, and several descriptions mention other types.
  for (const [label, slug] of types) {
    const card = page.locator(`a[href="/app/contributions/new/${slug}"]`);
    await expect(card, `${slug} card`).toHaveCount(1);
    await expect(card).toContainText(label);
  }

  // Choosing one lands on the existing dedicated create route, not a modal that
  // replaces it, and the form it opens is the production form for that type.
  await page.getByRole("link", { name: "Nota docente" }).click();
  await expect(page).toHaveURL(/\/app\/contributions\/new\/teaching_note$/);
  await expect(page.getByRole("heading", { name: "Nota docente", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Módulo *")).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toBeVisible();
});

test("relationship selection survives searching and removal, and submits as relationships", async ({ page }) => {
  const marker = randomUUID().slice(0, 8);
  const alpha = `Material alfa ${marker}`;
  const beta = `Material beta ${marker}`;
  await signIn(page, "Admin");
  const alphaRevision = await saveMaterialDraft(page, alpha);
  await saveMaterialDraft(page, beta);
  const alphaId = (await operator.from("material_revisions").select("material_id").eq("id", alphaRevision).single()).data!.material_id;

  const axis = await operator.from("axes").select("id").order("display_order").limit(1).single();
  assertSuccess(axis);

  await page.goto("/app/contributions/new/module");
  const materials = page.getByRole("group", { name: "Materiales o estudios" });
  const search = materials.getByRole("searchbox", { name: "Buscar materiales" });

  await materials.getByRole("checkbox", { name: alpha }).check();
  await expect(materials.getByRole("button", { name: `Quitar ${alpha}` })).toBeVisible();

  // A search narrows the unselected options and never the selection.
  await search.fill(beta);
  await expect(materials.getByRole("checkbox", { name: beta })).toBeVisible();
  await expect(materials.getByRole("checkbox", { name: alpha })).toBeChecked();

  await search.fill(`sin-coincidencia-${marker}`);
  await expect(materials.getByRole("checkbox", { name: beta })).toHaveCount(0);
  await expect(materials.getByRole("checkbox", { name: alpha })).toBeChecked();

  // Removing through the chip really unselects it — which, under this search,
  // is exactly what lets the option fall out of the visible list.
  await materials.getByRole("button", { name: `Quitar ${alpha}` }).click();
  await expect(materials.getByRole("checkbox", { name: alpha })).toHaveCount(0);

  await search.fill("");
  await materials.getByRole("checkbox", { name: alpha }).check();

  await page.getByLabel("Eje *").selectOption(axis.data!.id);
  await page.getByLabel("Título *").fill(`Módulo con relaciones ${marker}`);
  await page.getByLabel("Descripción *").fill("Módulo que valida la selección de relaciones.");
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/app\/contributions\/module\/[0-9a-f-]+$/);
  const moduleRevisionId = page.url().split("/").pop()!;

  // What the checkboxes submitted reached the database as a relationship row.
  const related = await operator.from("module_materials").select("material_id").eq("module_revision_id", moduleRevisionId);
  assertSuccess(related);
  expect(related.data!.map((row) => row.material_id)).toEqual([alphaId]);

  // And reopening the Draft shows the stored relationship already selected.
  await page.reload();
  await expect(page.getByRole("group", { name: "Materiales o estudios" }).getByRole("checkbox", { name: alpha })).toBeChecked();
});

test("a Published revision is read-only while its successor Draft stays editable", async ({ page }) => {
  const marker = randomUUID().slice(0, 8);
  await signIn(page, "Admin");
  const revisionId = await saveMaterialDraft(page, `Material de solo lectura ${marker}`);

  // Draft: editable, with publication offered and no successor or archival.
  await expect(page.getByLabel("Título *")).toBeEditable();
  await expect(page.getByRole("button", { name: "Publicar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear nueva versión" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Gobernanza" })).toHaveCount(0);

  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByRole("status")).toContainText("Publicado correctamente");

  // Published: disabled through the fieldset, and said in words rather than by
  // appearance alone.
  await expect(page.getByRole("heading", { name: "Contenido publicado" })).toBeVisible();
  await expect(page.getByLabel("Título *")).toBeDisabled();
  await expect(page.getByText("Solo lectura", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cargar archivo" })).toHaveCount(0);
  // Lifecycle and governance are offered, and are not the same control.
  await expect(page.getByRole("button", { name: "Crear nueva versión" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Gobernanza" }).getByRole("button", { name: "Archivar" })).toBeVisible();

  await page.getByRole("button", { name: "Crear nueva versión" }).click();
  await expect(page).toHaveURL(/\/app\/contributions\/material\/[0-9a-f-]+$/);
  expect(page.url()).not.toContain(revisionId);
  await expect(page.getByLabel("Título *")).toBeEditable();
  await expect(page.getByText(/biblioteca seguirá mostrando la versión anterior/)).toBeVisible();
  // The successor names the version the Library is still serving.
  await expect(page.getByRole("link", { name: "Ver la versión publicada" })).toHaveAttribute(
    "href", `/app/contributions/material/${revisionId}`,
  );

  // Back on the Published revision, the existing successor is linked rather than
  // duplicated, and archival stays blocked while it exists.
  await page.goto(`/app/contributions/material/${revisionId}`);
  await expect(page.getByRole("link", { name: "Abrir el borrador existente" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear nueva versión" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Archivar" })).toHaveCount(0);
});

test("applied management filters are removable through the URL, and readers reach none of it", async ({ browser }) => {
  const marker = randomUUID().slice(0, 8);
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await signIn(adminPage, "Admin");
  await saveMaterialDraft(adminPage, `Material filtrado ${marker}`);

  await adminPage.goto(`/app/contributions?q=${marker}&type=material&state=draft`);
  await expect(adminPage.getByText(`Material filtrado ${marker}`)).toBeVisible();
  await expect(adminPage.getByText("Filtros activos")).toBeVisible();

  // Removing one narrowing leaves the others in the address bar, which stays the
  // whole applied-filter contract.
  await adminPage.getByRole("link", { name: "Quitar el filtro de estado Borrador" }).click();
  await expect(adminPage).toHaveURL(new RegExp(`q=${marker}`));
  await expect(adminPage).toHaveURL(/type=material/);
  await expect(adminPage).toHaveURL((url) => !url.search.includes("state="));
  await expect(adminPage.getByText(`Material filtrado ${marker}`)).toBeVisible();

  const readerContext = await browser.newContext();
  const readerPage = await readerContext.newPage();
  await signIn(readerPage, "Contributor");
  for (const route of ["/app/contributions/new/material", "/app/contributions/new/module", `/app/contributions?q=${marker}`]) {
    await readerPage.goto(route);
    await expect(readerPage, `${route} must be denied`).toHaveURL(/\/access-denied$/);
  }

  await adminContext.close();
  await readerContext.close();
});
