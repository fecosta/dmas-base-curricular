import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-006 Phase 4 — Module Detail Interaction.
 *
 * The contract under test is what a reader can observe: the URL they start on,
 * what they do, the URL they end on, what is presented, and what the Library
 * still holds when they come back. Nothing here asserts how the routing is
 * arranged — slots, route groups and interception syntax are implementation, and
 * may change without changing any of the above.
 *
 * The canonical route is the invariant throughout: /app/library/modules/[id] is
 * the address in every case, and a direct visit or a reload of it must remain a
 * complete standalone page that depends on no prior navigation.
 */

const local = localSupabase();
// Privileged access is confined to local test fixture setup/cleanup, never app code.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });

const STRATEGY = "a1000000-0000-4000-8000-000000000001";

const organizationId = randomUUID();
const domain = `detail-${randomUUID()}.test`;
const users: string[] = [];

/** A marker unique to this run keeps assertions off any other suite's fixtures. */
const marker = `det${randomUUID().slice(0, 8)}`;
const THEME = `Participación ${marker}`;
const COUNTRY = `Perú ${marker}`;

const content = {
  module: randomUUID(), moduleRevision: randomUUID(),
  topic: randomUUID(), topicRevision: randomUUID(),
  note: randomUUID(), noteRevision: randomUUID(),
  instructor: randomUUID(), instructorRevision: randomUUID(),
  material: randomUUID(), materialRevision: randomUUID(),
  institution: randomUUID(), institutionRevision: randomUUID(),
  // Published at setup and retired mid-test, to exercise a module a reader can
  // still click but may no longer see.
  retired: randomUUID(), retiredRevision: randomUUID(),
};

const MODULE = `Campaña territorial ${marker}`;
const TOPIC = `Mapeo de actores ${marker}`;
const NOTE = `Cómo facilitar el taller ${marker}`;
const OUTCOME = `Diseñar un plan de campaña ${marker}`;
const INSTRUCTOR = `Ana Ficticia ${marker}`;
const MATERIAL = `Manual de campaña ${marker}`;
const INSTITUTION = `Centro Andino ${marker}`;
const RETIRED = `Módulo por retirar ${marker}`;
const DURATION = `16 horas ${marker}`;

const moduleUrl = new RegExp(`/app/library/modules/${content.module}$`);

/** Below --breakpoint-explorer the detail overlay is full-screen. */
const WIDE = 1440;
const TABLET = 768;
const PHONE = 390;

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

const retire = (id: string) =>
  operator.from("modules").update({ archived_at: new Date().toISOString() }).eq("id", id);

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: "Red del detalle", is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
  assertSuccess(await operator.from("modules").insert([{ id: content.module }, { id: content.retired }]));
  assertSuccess(await operator.from("program_topics").insert({ id: content.topic }));
  assertSuccess(await operator.from("teaching_notes").insert({ id: content.note }));
  assertSuccess(await operator.from("instructors").insert({ id: content.instructor }));
  assertSuccess(await operator.from("materials").insert({ id: content.material }));
  assertSuccess(await operator.from("institutions").insert({ id: content.institution }));

  const publishedAt = new Date().toISOString();
  assertSuccess(await operator.from("module_revisions").insert([
    { id: content.moduleRevision, module_id: content.module, revision_number: 1, status: "Published", axis_id: STRATEGY, title: MODULE, theme: THEME, description: "Módulo ficticio de estrategia para validar el detalle contextual.", learning_outcomes: [OUTCOME], suggested_duration: DURATION, published_at: publishedAt },
    { id: content.retiredRevision, module_id: content.retired, revision_number: 1, status: "Published", axis_id: STRATEGY, title: RETIRED, theme: THEME, description: "Módulo ficticio que deja de ser visible durante la prueba.", learning_outcomes: [], published_at: publishedAt },
  ]));
  assertSuccess(await operator.from("program_topic_revisions").insert({ id: content.topicRevision, program_topic_id: content.topic, revision_number: 1, status: "Published", module_id: content.module, title: TOPIC, description: "Tema ficticio del Programa.", position: 1, published_at: publishedAt }));
  assertSuccess(await operator.from("instructor_revisions").insert({ id: content.instructorRevision, instructor_id: content.instructor, revision_number: 1, status: "Published", name: INSTRUCTOR, role_or_title: "Directora de campaña", institution: "Organización ficticia", profile: "Perfil exclusivo para validación automatizada.", thematic_axis_or_themes: [THEME], country: COUNTRY, published_at: publishedAt }));
  assertSuccess(await operator.from("material_revisions").insert({ id: content.materialRevision, material_id: content.material, revision_number: 1, status: "Published", title: MATERIAL, material_type: "Manual", description: "Material ficticio del detalle.", source_or_institution: "Fuente ficticia", country_or_scope: COUNTRY, theme: THEME, published_at: publishedAt }));
  assertSuccess(await operator.from("institution_revisions").insert({ id: content.institutionRevision, institution_id: content.institution, revision_number: 1, status: "Published", name: INSTITUTION, institution_type: "Centro de referencia", country_or_scope: COUNTRY, description: "Institución ficticia del detalle.", themes: [THEME], published_at: publishedAt }));

  assertSuccess(await operator.from("program_topics").update({ current_published_revision_id: content.topicRevision }).eq("id", content.topic));
  assertSuccess(await operator.from("teaching_note_revisions").insert({ id: content.noteRevision, teaching_note_id: content.note, revision_number: 1, status: "Published", module_id: content.module, program_topic_id: content.topic, title: NOTE, text: "Divida el grupo en cuatro mesas de trabajo.", source_url: null, published_at: publishedAt }));
  assertSuccess(await operator.from("teaching_notes").update({ current_published_revision_id: content.noteRevision }).eq("id", content.note));
  assertSuccess(await operator.from("instructors").update({ current_published_revision_id: content.instructorRevision }).eq("id", content.instructor));
  assertSuccess(await operator.from("materials").update({ current_published_revision_id: content.materialRevision }).eq("id", content.material));
  assertSuccess(await operator.from("institutions").update({ current_published_revision_id: content.institutionRevision }).eq("id", content.institution));

  assertSuccess(await operator.from("module_instructors").insert({ module_revision_id: content.moduleRevision, instructor_id: content.instructor }));
  assertSuccess(await operator.from("module_materials").insert({ module_revision_id: content.moduleRevision, material_id: content.material }));
  assertSuccess(await operator.from("module_institutions").insert({ module_revision_id: content.moduleRevision, institution_id: content.institution }));

  assertSuccess(await operator.from("modules").update({ current_published_revision_id: content.moduleRevision }).eq("id", content.module));
  assertSuccess(await operator.from("modules").update({ current_published_revision_id: content.retiredRevision }).eq("id", content.retired));
});

test.afterAll(async () => {
  const archived_at = new Date().toISOString();
  assertSuccess(await operator.from("modules").update({ archived_at }).in("id", [content.module, content.retired]));
  assertSuccess(await operator.from("program_topics").update({ archived_at }).eq("id", content.topic));
  assertSuccess(await operator.from("teaching_notes").update({ archived_at }).eq("id", content.note));
  assertSuccess(await operator.from("instructors").update({ archived_at }).eq("id", content.instructor));
  assertSuccess(await operator.from("materials").update({ archived_at }).eq("id", content.material));
  assertSuccess(await operator.from("institutions").update({ archived_at }).eq("id", content.institution));
  for (const id of users) assertSuccess(await operator.auth.admin.deleteUser(id));
  assertSuccess(await operator.from("organization_domains").delete().eq("organization_id", organizationId));
  assertSuccess(await operator.from("organizations").delete().eq("id", organizationId));
});

async function signIn(page: Page, role: "Contributor" | "Admin" = "Contributor") {
  const email = `${randomUUID()}@${domain}`;
  const created = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(created);
  users.push(created.data.user!.id);
  assertSuccess(await operator.from("memberships").insert({
    user_id: created.data.user!.id, organization_id: organizationId, is_active: true, role,
  }));

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
 * The applied Library state a module is opened from.
 *
 * `country` is deliberately absent: the published search contract does not give
 * modules a country, so applying that dimension removes every module from the
 * results and there would be no card to click. It is covered separately, through
 * the header search, in "carries every applied dimension".
 */
const LIBRARY_STATE = { q: marker, entity: "module", axis: STRATEGY, theme: THEME, view: "grilla" };

function libraryUrl(overrides: Record<string, string> = {}) {
  return `/app/library?${new URLSearchParams({ ...LIBRARY_STATE, ...overrides })}`;
}

/** The applied Library state, as the address bar currently reports it. */
function libraryState(page: Page, keys: readonly string[] = Object.keys(LIBRARY_STATE)) {
  const params = new URL(page.url()).searchParams;
  return Object.fromEntries(keys.map((key) => [key, params.get(key)]));
}

const detail = (page: Page) => page.getByRole("dialog", { name: MODULE });
const moduleCard = (page: Page) => page.getByRole("link", { name: `Abrir módulo: ${MODULE}` });
const search = (page: Page) => page.getByRole("combobox", { name: "Buscar en la biblioteca" });
const closeDetail = (page: Page) => detail(page).getByRole("button", { name: "Cerrar el detalle del módulo" });

/** A page wider than its viewport is the overflow a full-screen overlay must not introduce. */
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const documentOverflow = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).overflow);

/** Overlay entrances animate, so geometry is only meaningful once they have landed. */
const settle = (locator: Locator) =>
  locator.evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished)));

/** Whether a control on the Library behind the overlay can still take focus. */
const canFocusBehind = (page: Page) => page.evaluate(() => {
  const target = document.querySelector("header a");
  if (!(target instanceof HTMLElement)) return false;
  target.focus();
  return document.activeElement === target;
});

test.describe("opening a module from the Library", () => {
  test.use({ viewport: { width: WIDE, height: 1000 } });

  test("keeps the canonical URL and presents the module over the Library it was opened from", async ({ page }) => {
    await signIn(page);
    await page.goto(libraryUrl());
    await expect(moduleCard(page)).toBeVisible();

    await moduleCard(page).click();

    // The address bar holds the canonical module route, exactly as a direct
    // visit would: what changed is the presentation, not the address.
    await expect(page).toHaveURL(moduleUrl);
    await expect(detail(page)).toBeVisible();

    // The Library is still the page underneath, with its results intact.
    await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
    await expect(moduleCard(page)).toBeAttached();

    // The module itself, not a summary of it: the published Programa, the
    // teaching note inside its topic, the outcomes and the reference column.
    await expect(detail(page).getByRole("heading", { name: TOPIC })).toBeVisible();
    await expect(detail(page).getByText(NOTE)).toBeVisible();
    await expect(detail(page).getByText(OUTCOME)).toBeVisible();
    await expect(detail(page).getByText(DURATION)).toBeVisible();
    await expect(detail(page).getByText(INSTRUCTOR)).toBeVisible();
    await expect(detail(page).getByRole("link", { name: MATERIAL })).toBeVisible();
    await expect(detail(page).getByRole("link", { name: INSTITUTION })).toBeVisible();

    // One overlay, above the sticky shell, with the page behind it inert and
    // locked. Nothing of the Library stays reachable while it is open.
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    expect(await documentOverflow(page)).toBe("hidden");
    expect(await canFocusBehind(page)).toBe(false);
    expect(await horizontalOverflow(page)).toBe(0);
  });

  test("the close control returns to the exact Library the reader came from", async ({ page }) => {
    await signIn(page);
    await page.goto(libraryUrl({ view: "programa" }));
    await page.getByRole("link", { name: `Ver programa: ${MODULE}` }).click();
    await expect(detail(page)).toBeVisible();

    await closeDetail(page).click();

    await expect(page).toHaveURL(/\/app\/library\?/);
    expect(libraryState(page)).toEqual({ ...LIBRARY_STATE, view: "programa" });
    await expect(detail(page)).toBeHidden();
    // The address and the screen agree: no module URL left standing over a
    // Library without the module on it.
    expect(await documentOverflow(page)).not.toBe("hidden");
  });

  test("Escape returns to the Library and gives focus back to the card that opened the module", async ({ page }) => {
    await signIn(page);
    await page.goto(libraryUrl());
    await moduleCard(page).click();
    await expect(detail(page)).toBeVisible();
    // Focus starts inside the overlay, on the named panel rather than the
    // dismiss control.
    await expect(detail(page).locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Escape");

    await expect(page).toHaveURL(/\/app\/library\?/);
    expect(libraryState(page)).toEqual(LIBRARY_STATE);
    await expect(detail(page)).toBeHidden();
    await expect(moduleCard(page)).toBeFocused();
  });

  /*
   * Both surfaces are in one document while the overlay is up, and the Library
   * names sections of its own called "Materiales y estudios" and
   * "Instituciones". Opened without an entity filter so the Library renders
   * those sections, which is the only arrangement where the two can collide.
   */
  test("does not reuse the Library's section ids for the module's own sections", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library?q=${encodeURIComponent(marker)}`);
    await expect(page.locator("#materials-title")).toHaveCount(1);
    await expect(page.locator("#institutions-title")).toHaveCount(1);

    await moduleCard(page).click();
    await expect(detail(page)).toBeVisible();

    // One element per id: the Library keeps its names, the module has its own.
    for (const id of ["materials-title", "institutions-title", "module-materials-title", "module-institutions-title"]) {
      await expect(page.locator(`#${id}`), `#${id} is not unique in the document`).toHaveCount(1);
    }
    // The module's sections are the ones inside the overlay.
    await expect(detail(page).locator("#module-materials-title")).toHaveCount(1);
    await expect(detail(page).locator("#module-institutions-title")).toHaveCount(1);
    await expect(detail(page).locator("#materials-title")).toHaveCount(0);
    await expect(detail(page).locator("#institutions-title")).toHaveCount(0);

    // Each labelled section still resolves to its own heading, which is what
    // the ids exist for.
    const sections = await detail(page).locator("section[aria-labelledby]").evaluateAll((nodes) =>
      nodes.map((node) => {
        const id = node.getAttribute("aria-labelledby")!;
        return [id, node.ownerDocument.getElementById(id)?.textContent?.trim() ?? null];
      }));
    expect(Object.fromEntries(sections)).toMatchObject({
      "module-program-title": "Programa",
      "module-outcomes-title": "Resultados de aprendizaje",
      "module-materials-title": "Materiales y estudios",
      "module-institutions-title": "Instituciones",
    });
  });

  test("a click on the scrim beside the panel dismisses it the same way", async ({ page }) => {
    await signIn(page);
    await page.goto(libraryUrl());
    await moduleCard(page).click();
    await expect(detail(page)).toBeVisible();

    // Top-left of the viewport is scrim, never panel: the panel is centred at
    // this width, clear of the edges.
    await page.mouse.click(6, 6);

    await expect(page).toHaveURL(/\/app\/library\?/);
    expect(libraryState(page)).toEqual(LIBRARY_STATE);
    await expect(detail(page)).toBeHidden();
  });

  test("Back closes the detail and Forward reopens it, with the Library untouched throughout", async ({ page }) => {
    await signIn(page);
    await page.goto(libraryUrl({ view: "programa" }));
    await page.getByRole("link", { name: `Ver programa: ${MODULE}` }).click();
    await expect(detail(page)).toBeVisible();

    await page.goBack();
    await expect(detail(page)).toBeHidden();
    await expect(page).toHaveURL(/\/app\/library\?/);
    expect(libraryState(page)).toEqual({ ...LIBRARY_STATE, view: "programa" });
    // Programa is still the view, still showing published curriculum structure.
    await expect(page.getByRole("link", { name: "Programa", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(TOPIC)).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(moduleUrl);
    await expect(detail(page)).toBeVisible();
  });

  /*
   * Search suggestions already point at the canonical module route, so opening
   * one from the Library contextualises for the same reason a card does, with no
   * suggestion-specific destination. Opening from here also reaches the one
   * dimension a module card cannot: a country filter removes every module from
   * the results, but the applied state still has to survive the round trip.
   */
  test("a module search suggestion opens the same detail and carries every applied dimension", async ({ page }) => {
    await signIn(page);
    const applied = { ...LIBRARY_STATE, country: COUNTRY, view: "programa" };
    await page.goto(`/app/library?${new URLSearchParams(applied)}`);

    await search(page).fill(`campaña ${marker}`);
    await page.getByRole("option", { name: new RegExp(MODULE) }).click();

    await expect(page).toHaveURL(moduleUrl);
    await expect(detail(page)).toBeVisible();
    // The suggestion popover is not left hanging above or behind the scrim.
    await expect(page.getByRole("listbox", { name: "Sugerencias de búsqueda" })).toHaveCount(0);

    await closeDetail(page).click();

    await expect(page).toHaveURL(/\/app\/library\?/);
    expect(libraryState(page, ["q", "entity", "axis", "country", "theme", "view"])).toEqual(applied);
  });

  test("an internal reference link leaves the overlay for the canonical reference route", async ({ page }) => {
    await signIn(page);
    await page.goto(libraryUrl());
    await moduleCard(page).click();
    await expect(detail(page)).toBeVisible();

    await detail(page).getByRole("link", { name: MATERIAL }).click();

    await expect(page).toHaveURL(new RegExp(`/app/library/references/material/${content.material}$`));
    await expect(page.getByRole("heading", { level: 1, name: MATERIAL })).toBeVisible();
    // Phase 4 contextualises module detail only: references stay whole pages.
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    expect(await documentOverflow(page)).not.toBe("hidden");
  });
});

test.describe("reaching the canonical route directly", () => {
  test.use({ viewport: { width: WIDE, height: 1000 } });

  test("renders the complete standalone page with no prior Library navigation", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library/modules/${content.module}`);

    await expect(page).toHaveURL(moduleUrl);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: MODULE })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Volver a la biblioteca" })).toBeVisible();

    // The same module, in full.
    await expect(page.getByRole("heading", { name: TOPIC })).toBeVisible();
    await expect(page.getByText(NOTE)).toBeVisible();
    await expect(page.getByText(OUTCOME)).toBeVisible();
    await expect(page.getByText(INSTRUCTOR)).toBeVisible();
    await expect(page.getByRole("link", { name: MATERIAL })).toBeVisible();
    await expect(page.getByRole("link", { name: INSTITUTION })).toBeVisible();

    // The page scrolls as a page; nothing has locked it.
    expect(await documentOverflow(page)).not.toBe("hidden");
  });

  /*
   * Contextual detail is a Library behaviour. The application home carries the
   * same search, and its suggestions point at the same canonical route, but
   * there is no Library there to keep behind a panel — so the module opens as
   * the page it always was.
   */
  test("opens as a page when the module is reached from outside the Library", async ({ page }) => {
    await signIn(page);
    await page.goto("/app");

    await search(page).fill(`campaña ${marker}`);
    await page.getByRole("option", { name: new RegExp(MODULE) }).click();

    await expect(page).toHaveURL(moduleUrl);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: MODULE })).toBeVisible();
  });

  test("a reload of a contextually opened module leaves a valid standalone page", async ({ page }) => {
    await signIn(page);
    await page.goto(libraryUrl());
    await moduleCard(page).click();
    await expect(detail(page)).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(moduleUrl);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: MODULE })).toBeVisible();
    await expect(page.getByRole("heading", { name: TOPIC })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Volver a la biblioteca" })).toBeVisible();
  });
});

test.describe("detail presentation", () => {
  test("is a centred, viewport-constrained panel on a wide desktop", async ({ page }) => {
    await page.setViewportSize({ width: WIDE, height: 1000 });
    await signIn(page);
    await page.goto(libraryUrl());
    await moduleCard(page).click();
    await expect(detail(page)).toBeVisible();

    const panel = detail(page).locator("> div");
    await settle(panel);
    const box = (await panel.boundingBox())!;

    // The reference's large detail panel: ~1060px wide, centred, and never
    // taller than the viewport it sits in.
    expect(box.width).toBeCloseTo(1060, 0);
    expect(Math.abs(box.x + box.width / 2 - WIDE / 2)).toBeLessThan(20);
    expect(box.height).toBeLessThanOrEqual(1000 - 64);
    expect(box.y).toBeGreaterThan(0);
    expect(await horizontalOverflow(page)).toBe(0);
  });

  for (const width of [TABLET, PHONE]) {
    test(`is full-screen at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await signIn(page);
      await page.goto(libraryUrl());
      await moduleCard(page).click();
      await expect(detail(page)).toBeVisible();

      const panel = detail(page).locator("> div");
      await settle(panel);
      const box = (await panel.boundingBox())!;

      expect(box.width).toBeCloseTo(width, 0);
      expect(box.height).toBeCloseTo(844, 0);
      expect(box.x).toBeCloseTo(0, 0);
      expect(box.y).toBeCloseTo(0, 0);
      expect(await horizontalOverflow(page)).toBe(0);

      // A discoverable dismissal at every width.
      await expect(closeDetail(page)).toBeVisible();
    });
  }

  test("scrolls its own content without moving the Library behind it", async ({ page }) => {
    await page.setViewportSize({ width: PHONE, height: 700 });
    await signIn(page);
    await page.goto(libraryUrl());
    await moduleCard(page).click();
    await expect(detail(page)).toBeVisible();

    const pageScrollBefore = await page.evaluate(() => window.scrollY);
    // The panel's single scroll container; the page behind it is locked.
    const body = detail(page).locator("div.overflow-y-auto").first();
    await body.hover();
    await page.mouse.wheel(0, 700);

    await expect.poll(() => body.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollBefore);
  });
});

test.describe("content the reader may not see", () => {
  test.use({ viewport: { width: WIDE, height: 1000 } });

  /*
   * The contextual route must not be a softer boundary than the canonical one.
   * It runs the same published-reader query, so a module that stopped being
   * visible between the Library rendering and the reader clicking it is refused
   * in the overlay exactly as the page would refuse it.
   */
  test("refuses a module retired after the Library was rendered, rather than opening it empty", async ({ page }) => {
    await signIn(page, "Admin");
    await page.goto(libraryUrl({ q: `retirar ${marker}` }));
    const card = page.getByRole("link", { name: `Abrir módulo: ${RETIRED}` });
    await expect(card).toBeVisible();

    assertSuccess(await retire(content.retired));
    await card.click();

    // The refusal is presented where the module would have been, not as a blank
    // panel and not as a silent no-op.
    const refusal = page.getByRole("dialog").filter({ hasText: "No encontramos esta publicación." });
    await expect(refusal).toBeVisible();

    // Nothing of the module itself opened. Its title and summary survive on the
    // stale Library card behind the refusal — that list is what the reader
    // already had, not something the contextual route disclosed.
    await expect(page.getByRole("dialog", { name: RETIRED })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Docentes y especialistas" })).toHaveCount(0);
    await expect(page.getByText("Sin temas de Programa")).toHaveCount(0);
  });

  test("refuses the same module on a direct visit to its canonical URL", async ({ page }) => {
    assertSuccess(await retire(content.retired));
    await signIn(page, "Admin");
    await page.goto(`/app/library/modules/${content.retired}`);

    await expect(page.getByText("No encontramos esta publicación.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: RETIRED })).toHaveCount(0);
  });
});
