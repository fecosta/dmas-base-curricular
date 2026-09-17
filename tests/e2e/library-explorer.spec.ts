import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-006 Phase 3 — Library Explorer.
 *
 * Covers what only a browser can settle: that every filter control is a real
 * Library URL, that applying and removing one filter leaves the others alone,
 * that the narrow-width filter drawer is a modal the keyboard can operate, and
 * that search suggestions reach only published content over an authenticated
 * boundary. The URL is the contract under test throughout.
 */

const local = localSupabase();
// Privileged access is confined to local test fixture setup/cleanup, never app code.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });

const STRATEGY = "a1000000-0000-4000-8000-000000000001";
const POLICY = "a1000000-0000-4000-8000-000000000002";

const organizationId = randomUUID();
const domain = `explorer-${randomUUID()}.test`;
const users: string[] = [];

/** A marker unique to this run keeps assertions off any other suite's fixtures. */
const marker = `expl${randomUUID().slice(0, 8)}`;
const THEME_A = `Participación ${marker}`;
const THEME_B = `Evidencia ${marker}`;
const COUNTRY_A = `Perú ${marker}`;
const COUNTRY_B = `Chile ${marker}`;

const content = {
  moduleA: randomUUID(), moduleARevision: randomUUID(),
  moduleB: randomUUID(), moduleBRevision: randomUUID(),
  draftRevision: randomUUID(),
  topic: randomUUID(), topicRevision: randomUUID(),
  material: randomUUID(), materialRevision: randomUUID(),
  institution: randomUUID(), institutionRevision: randomUUID(),
  archived: randomUUID(), archivedRevision: randomUUID(),
};

const MODULE_A = `Campaña territorial ${marker}`;
const MODULE_B = `Evidencia legislativa ${marker}`;
const DRAFT = `Borrador reservado ${marker}`;
const MATERIAL = `Manual de campaña ${marker}`;
const INSTITUTION = `Centro de campaña ${marker}`;
const ARCHIVED = `Retirado de campaña ${marker}`;

/** Widths this phase is validated at, widest first. */
const WIDE = 1440;
const ALL_WIDTHS = [1440, 1280, 1180, 1024, 900, 768, 390];
/** Below --breakpoint-explorer the sidebar becomes the drawer. */
const NARROW = 768;

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: "Red del explorador", is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
  assertSuccess(await operator.from("modules").insert([{ id: content.moduleA }, { id: content.moduleB }, { id: content.archived }]));
  assertSuccess(await operator.from("program_topics").insert({ id: content.topic }));
  assertSuccess(await operator.from("materials").insert({ id: content.material }));
  assertSuccess(await operator.from("institutions").insert({ id: content.institution }));

  const publishedAt = new Date().toISOString();
  assertSuccess(await operator.from("module_revisions").insert([
    { id: content.moduleARevision, module_id: content.moduleA, revision_number: 1, status: "Published", axis_id: STRATEGY, title: MODULE_A, theme: THEME_A, description: "Módulo ficticio de estrategia para validar el explorador.", learning_outcomes: ["Diseñar una campaña"], published_at: publishedAt },
    { id: content.moduleBRevision, module_id: content.moduleB, revision_number: 1, status: "Published", axis_id: POLICY, title: MODULE_B, theme: THEME_B, description: "Módulo ficticio de políticas para validar el explorador.", learning_outcomes: ["Evaluar evidencia"], published_at: publishedAt },
    // Never published: it must not appear in results or suggestions.
    { id: content.draftRevision, module_id: content.archived, revision_number: 2, status: "Draft", axis_id: STRATEGY, title: DRAFT, description: "No debe ser visible.", learning_outcomes: [] },
    { id: content.archivedRevision, module_id: content.archived, revision_number: 1, status: "Published", axis_id: STRATEGY, title: ARCHIVED, theme: THEME_A, description: "Módulo archivado que no debe ser visible.", learning_outcomes: [], published_at: publishedAt },
  ]));
  assertSuccess(await operator.from("program_topic_revisions").insert({ id: content.topicRevision, program_topic_id: content.topic, revision_number: 1, status: "Published", module_id: content.moduleA, title: `Mapeo de actores ${marker}`, description: "Tema ficticio del Programa.", position: 1, published_at: publishedAt }));
  assertSuccess(await operator.from("material_revisions").insert({ id: content.materialRevision, material_id: content.material, revision_number: 1, status: "Published", title: MATERIAL, material_type: "Manual", description: "Material ficticio para el explorador.", source_or_institution: "Fuente ficticia", country_or_scope: COUNTRY_A, theme: THEME_A, published_at: publishedAt }));
  assertSuccess(await operator.from("institution_revisions").insert({ id: content.institutionRevision, institution_id: content.institution, revision_number: 1, status: "Published", name: INSTITUTION, institution_type: "Centro de referencia", country_or_scope: COUNTRY_B, description: "Institución ficticia para el explorador.", themes: [THEME_B], published_at: publishedAt }));

  assertSuccess(await operator.from("modules").update({ current_published_revision_id: content.moduleARevision }).eq("id", content.moduleA));
  assertSuccess(await operator.from("modules").update({ current_published_revision_id: content.moduleBRevision }).eq("id", content.moduleB));
  assertSuccess(await operator.from("program_topics").update({ current_published_revision_id: content.topicRevision }).eq("id", content.topic));
  assertSuccess(await operator.from("materials").update({ current_published_revision_id: content.materialRevision }).eq("id", content.material));
  assertSuccess(await operator.from("institutions").update({ current_published_revision_id: content.institutionRevision }).eq("id", content.institution));
  // Archived after publication, the way the product retires content.
  assertSuccess(await operator.from("modules").update({ current_published_revision_id: content.archivedRevision, archived_at: publishedAt }).eq("id", content.archived));
});

test.afterAll(async () => {
  const archived_at = new Date().toISOString();
  assertSuccess(await operator.from("modules").update({ archived_at }).in("id", [content.moduleA, content.moduleB, content.archived]));
  assertSuccess(await operator.from("program_topics").update({ archived_at }).eq("id", content.topic));
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

/** A page wider than its viewport is the overflow this phase must not introduce. */
async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

function applied(page: Page) {
  return new URL(page.url()).searchParams;
}

const search = (page: Page) => page.getByRole("combobox", { name: "Buscar en la biblioteca" });
const filtersTrigger = (page: Page) => page.getByRole("button", { name: "Filtros" });
const filtersDrawer = (page: Page) => page.getByRole("dialog", { name: "Filtros" });

test.describe("desktop filter panel", () => {
  test.use({ viewport: { width: WIDE, height: 1000 } });

  test("presents filters as a persistent named panel beside the results", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    const panel = page.getByRole("complementary", { name: "Filtros" });
    await expect(panel).toBeVisible();
    // The Explorer's narrow filter column, not a full-width form.
    expect((await panel.boundingBox())!.width).toBeLessThan(340);

    // Grouped dimensions, each named for assistive technology.
    await expect(panel.getByRole("group", { name: "País o alcance" })).toBeVisible();
    await expect(panel.getByRole("group", { name: "Tema" })).toBeVisible();

    // At this width the drawer trigger stands down.
    await expect(filtersTrigger(page)).toBeHidden();
  });

  test("keeps the filter panel clear of the sticky header while scrolling", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");
    await expect(page.getByRole("complementary", { name: "Filtros" })).toBeVisible();
    await page.mouse.wheel(0, 1200);

    // The panel sticks below the header rather than sliding under it.
    const clearance = await page.evaluate(() => {
      const header = document.querySelector("header")!.getBoundingClientRect();
      const panel = document.querySelector("aside")!.getBoundingClientRect();
      return panel.top - header.bottom;
    });
    expect(clearance).toBeGreaterThanOrEqual(0);
  });

  test("applying a filter is a navigation that preserves everything already applied", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library?view=programa&q=${encodeURIComponent(marker)}`);

    await page.getByRole("group", { name: "Tema" }).getByRole("link", { name: THEME_A }).click();

    await expect.poll(() => applied(page).get("theme")).toBe(THEME_A);
    expect(applied(page).get("q")).toBe(marker);
    expect(applied(page).get("view")).toBe("programa");

    // Reload-safe and shareable: the same URL renders the same applied state.
    await page.reload();
    await expect(page.getByRole("group", { name: "Tema" }).getByRole("link", { name: THEME_A })).toHaveAttribute("aria-current", "true");
  });

  test("removing one active filter leaves the others applied", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library?q=${encodeURIComponent(marker)}&country=${encodeURIComponent(COUNTRY_A)}&theme=${encodeURIComponent(THEME_A)}`);

    await page.getByRole("link", { name: `Quitar Tema: ${THEME_A}` }).click();

    await expect.poll(() => applied(page).has("theme")).toBe(false);
    expect(applied(page).get("country")).toBe(COUNTRY_A);
    expect(applied(page).get("q")).toBe(marker);
  });

  test("clearing everything returns to the canonical Library and keeps the chosen view", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library?view=programa&q=${encodeURIComponent(marker)}&theme=${encodeURIComponent(THEME_A)}&entity=module`);

    await page.getByRole("link", { name: "Limpiar todo" }).click();

    await expect(page).toHaveURL(/\/app\/library\?view=programa$/);
    for (const param of ["q", "theme", "entity", "axis", "country"]) {
      expect(applied(page).has(param), `${param} survived clear-all`).toBe(false);
    }
  });

  test("Back and Forward walk the applied filter history", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library?q=${encodeURIComponent(marker)}`);

    await page.getByRole("group", { name: "Tema" }).getByRole("link", { name: THEME_A }).click();
    await expect.poll(() => applied(page).get("theme")).toBe(THEME_A);

    await page.goBack();
    await expect.poll(() => applied(page).has("theme")).toBe(false);
    expect(applied(page).get("q")).toBe(marker);

    await page.goForward();
    await expect.poll(() => applied(page).get("theme")).toBe(THEME_A);
  });
});

test.describe("Grid and Programa", () => {
  test.use({ viewport: { width: WIDE, height: 1000 } });

  test("switching view preserves every applied filter and survives a reload", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library?q=${encodeURIComponent(marker)}&theme=${encodeURIComponent(THEME_A)}&entity=module`);

    await expect(page.getByRole("link", { name: "Grilla", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByRole("link", { name: "Programa", exact: true }).click();

    await expect.poll(() => applied(page).get("view")).toBe("programa");
    expect(applied(page).get("q")).toBe(marker);
    expect(applied(page).get("theme")).toBe(THEME_A);
    expect(applied(page).get("entity")).toBe("module");
    await expect(page.getByRole("link", { name: "Programa", exact: true })).toHaveAttribute("aria-current", "page");

    // Programa exposes published curriculum structure, not a new ordering.
    await expect(page.getByText(`Mapeo de actores ${marker}`)).toBeVisible();

    await page.reload();
    await expect(page.getByRole("link", { name: "Programa", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText(`Mapeo de actores ${marker}`)).toBeVisible();
  });

  test("both views reach the canonical module route", async ({ page }) => {
    await signIn(page);

    await page.goto(`/app/library?q=${encodeURIComponent(marker)}&entity=module`);
    await page.getByRole("link", { name: `Abrir módulo: ${MODULE_A}` }).click();
    await expect(page).toHaveURL(new RegExp(`/app/library/modules/${content.moduleA}$`));

    await page.goto(`/app/library?view=programa&q=${encodeURIComponent(marker)}&entity=module`);
    await page.getByRole("link", { name: `Ver programa: ${MODULE_A}` }).click();
    await expect(page).toHaveURL(new RegExp(`/app/library/modules/${content.moduleA}$`));
  });
});

test.describe("mobile filter drawer", () => {
  test.use({ viewport: { width: NARROW, height: 900 } });

  test("replaces the sidebar with a modal drawer that Escape dismisses", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    // No squeezed desktop column at this width.
    await expect(page.getByRole("complementary", { name: "Filtros" })).toBeHidden();

    const trigger = filtersTrigger(page);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();

    const drawer = filtersDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Left anchored, full height, and narrower than the viewport.
    const panel = drawer.locator("> div");
    await expect.poll(async () => Math.round((await panel.boundingBox())!.x)).toBe(0);
    const box = (await panel.boundingBox())!;
    expect(box.width).toBeLessThan(NARROW);
    expect(box.height).toBeCloseTo(900, 0);

    // Background scroll is locked and focus is contained.
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
    await expect(drawer.locator(":focus")).toHaveCount(1);

    // Exactly one set of filter controls reaches assistive technology.
    await expect(page.getByRole("group", { name: "Tema" })).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("filters chosen in the drawer apply through the URL", async ({ page }) => {
    await signIn(page);
    await page.goto(`/app/library?q=${encodeURIComponent(marker)}`);

    await filtersTrigger(page).click();
    await filtersDrawer(page).getByRole("link", { name: THEME_A }).click();

    await expect.poll(() => applied(page).get("theme")).toBe(THEME_A);
    expect(applied(page).get("q")).toBe(marker);
    // The trigger reports how many of its own dimensions are narrowing results.
    await expect(page.getByRole("button", { name: "Filtros 1" })).toBeVisible();
  });

  test("is reachable and operable by keyboard alone", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    await filtersTrigger(page).focus();
    await page.keyboard.press("Enter");
    await expect(filtersDrawer(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(filtersDrawer(page)).toBeHidden();
    await expect(filtersTrigger(page)).toBeFocused();
  });
});

test.describe("search suggestions", () => {
  test.use({ viewport: { width: WIDE, height: 1000 } });

  test("groups published suggestions by entity family", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    await search(page).fill(`campaña ${marker}`);
    const listbox = page.getByRole("listbox", { name: "Sugerencias de búsqueda" });
    await expect(listbox).toBeVisible();
    await expect(search(page)).toHaveAttribute("aria-expanded", "true");

    await expect(listbox.getByRole("group", { name: "Módulos" })).toBeVisible();
    await expect(listbox.getByRole("group", { name: "Materiales" })).toBeVisible();
    await expect(listbox.getByRole("group", { name: "Instituciones" })).toBeVisible();
    await expect(listbox.getByRole("option", { name: new RegExp(MODULE_A) })).toBeVisible();
    await expect(listbox.getByRole("option", { name: new RegExp(MATERIAL) })).toBeVisible();
    await expect(listbox.getByRole("option", { name: new RegExp(INSTITUTION) })).toBeVisible();
  });

  /*
   * Suggestions are a data-access surface. Nothing unpublished or retired may
   * reach them, exactly as for the results list.
   */
  test("never suggests draft or archived content", async ({ page }) => {
    await signIn(page, "Admin");
    await page.goto("/app/library");

    await search(page).fill(`reservado ${marker}`);
    await expect(page.getByRole("option", { name: new RegExp(DRAFT) })).toHaveCount(0);

    await search(page).fill(`retirado ${marker}`);
    await expect(page.getByRole("option", { name: new RegExp(ARCHIVED) })).toHaveCount(0);

    // The endpoint itself refuses to answer without a live eligible session.
    const anonymous = await page.request.get(`/api/library/suggestions?q=${encodeURIComponent(marker)}`, { headers: { cookie: "" } });
    expect([401, 403]).toContain(anonymous.status());
  });

  test("moves by arrow key and opens the highlighted suggestion with Enter", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    await search(page).fill(`campaña ${marker}`);
    await expect(page.getByRole("option", { name: new RegExp(MODULE_A) })).toBeVisible();

    await page.keyboard.press("ArrowDown");
    const first = page.getByRole("option").first();
    await expect(first).toHaveAttribute("aria-selected", "true");
    // The combobox reports which option is active without moving focus.
    await expect(search(page)).toHaveAttribute("aria-activedescendant", (await first.getAttribute("id"))!);
    await expect(search(page)).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/app/library/modules/${content.moduleA}$`));
    await expect(page.getByRole("listbox", { name: "Sugerencias de búsqueda" })).toHaveCount(0);
  });

  test("Escape dismisses the list without clearing what was typed", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    await search(page).fill(`campaña ${marker}`);
    await expect(page.getByRole("listbox", { name: "Sugerencias de búsqueda" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox", { name: "Sugerencias de búsqueda" })).toHaveCount(0);
    await expect(search(page)).toHaveAttribute("aria-expanded", "false");
    await expect(search(page)).toHaveValue(`campaña ${marker}`);
    await expect(search(page)).toBeFocused();
  });

  test("clicking a suggestion opens its canonical route", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    await search(page).fill(MATERIAL);
    await page.getByRole("option", { name: new RegExp(MATERIAL) }).click();

    await expect(page).toHaveURL(new RegExp(`/app/library/references/material/${content.material}$`));
  });

  /* Suggestions enhance search; they never replace submitting it. */
  test("submitting normally still navigates to the Library with filters intact", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library?view=programa&entity=module");

    await search(page).fill(marker);
    await search(page).press("Enter");

    await expect(page).toHaveURL(/\/app\/library\?/);
    await expect.poll(() => applied(page).get("q")).toBe(marker);
    expect(applied(page).get("view")).toBe("programa");
    expect(applied(page).get("entity")).toBe("module");
  });

  test("does not query for a query too short to mean anything", async ({ page }) => {
    await signIn(page);
    await page.goto("/app/library");

    const calls: string[] = [];
    page.on("request", (request) => { if (request.url().includes("/api/library/suggestions")) calls.push(request.url()); });

    await search(page).fill("c");
    await expect(page.getByRole("listbox", { name: "Sugerencias de búsqueda" })).toHaveCount(0);
    expect(calls).toEqual([]);
  });

  test("stays out of the way of the modal filter drawer", async ({ page }) => {
    await page.setViewportSize({ width: NARROW, height: 900 });
    await signIn(page);
    await page.goto("/app/library");

    await search(page).fill(`campaña ${marker}`);
    await expect(page.getByRole("listbox", { name: "Sugerencias de búsqueda" })).toBeVisible();

    await filtersTrigger(page).click();
    await expect(filtersDrawer(page)).toBeVisible();
    await expect(page.getByRole("listbox", { name: "Sugerencias de búsqueda" })).toHaveCount(0);
  });
});

test("the Explorer fits every validated width without horizontal overflow", async ({ page }) => {
  await signIn(page);

  for (const width of ALL_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/app/library?q=${encodeURIComponent(marker)}`);
    await expect(page.getByRole("heading", { name: "Biblioteca", exact: true })).toBeVisible();
    expect(await horizontalOverflow(page), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);

    // Filters stay reachable either as the column or behind the trigger.
    if (width >= 900) await expect(page.getByRole("complementary", { name: "Filtros" })).toBeVisible();
    else await expect(filtersTrigger(page)).toBeVisible();

    // And the results keep the width the sidebar is not using.
    const results = (await page.getByRole("article").first().boundingBox())!;
    expect(results.width, `card collapsed at ${width}px`).toBeGreaterThan(220);
  }
});

test("an empty result set offers a way back rather than a dead end", async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: WIDE, height: 1000 });
  await page.goto(`/app/library?q=${encodeURIComponent(marker)}&country=${encodeURIComponent(COUNTRY_A)}&theme=${encodeURIComponent(THEME_B)}`);

  await expect(page.getByText("Ningún resultado con esta combinación")).toBeVisible();
  await page.getByRole("link", { name: "Limpiar filtros" }).click();
  await expect(page).toHaveURL(/\/app\/library$/);
});
