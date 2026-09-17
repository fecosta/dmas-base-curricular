import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-006 Phase 2 — application shell.
 *
 * Covers what only a browser can settle: which shell controls are actually in
 * the accessibility tree at each width, that the compact navigation sheet is
 * keyboard-operable, and that no responsive variant leaks an Admin destination
 * into a reader's markup.
 */

const local = localSupabase();
// Privileged access is confined to local test fixture setup, never app code.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const organizationName = "Red de shell E2E";
const domain = `shell-${randomUUID()}.test`;

/** Every width the phase is validated at, widest first. */
const WIDE = 1440;
const COMPACT_WIDTHS = [1024, 900, 768, 390];
const ALL_WIDTHS = [1440, 1280, 1180, ...COMPACT_WIDTHS];

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

const menuTrigger = (page: Page) => page.getByRole("button", { name: "Menú" });
const menuSheet = (page: Page) => page.getByRole("dialog", { name: "Menú" });

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: organizationName, is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("wide shell presents brand, destinations, search and session in one band", async ({ page }) => {
  await signIn(page, "Admin");
  await page.setViewportSize({ width: WIDE, height: 900 });
  await page.goto("/app/library");

  await expect(page.getByRole("link", { name: "Base Curricular Democracia+" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Biblioteca", exact: true })).toBeVisible();
  /*
   * Phase 3 gave the shell search its suggestion popover, so it now carries the
   * ARIA 1.2 combobox role rather than the bare searchbox role it exposed in
   * Phase 2. It is still the same one named search input on the same GET form.
   */
  const shellSearch = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await expect(shellSearch).toBeVisible();
  await expect(shellSearch).toHaveAttribute("type", "search");
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  // Organisation and role stay reachable after the utility strip was folded in.
  await expect(page.getByText(`${organizationName} · Administrador`)).toBeVisible();
  // The compact trigger belongs to narrower widths only.
  await expect(menuTrigger(page)).toBeHidden();

  // One logical control each, never a desktop copy plus a mobile copy.
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Biblioteca", exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Administrar contenido" })).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toHaveCount(1);
});

test("the header marks the current destination", async ({ page }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: WIDE, height: 900 });

  await page.goto("/app/library");
  await expect(page.getByRole("link", { name: "Biblioteca", exact: true })).toHaveAttribute("aria-current", "page");

  // A module detail keeps its section marked.
  await page.goto("/app");
  await expect(page.getByRole("link", { name: "Biblioteca", exact: true })).not.toHaveAttribute("aria-current", "page");
});

test("the compact sheet carries destinations, session and sign-out, and is keyboard operable", async ({ page }) => {
  await signIn(page, "Admin");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/library");

  // The inline row stands down; the trigger takes over and reports its state.
  await expect(page.getByRole("link", { name: "Biblioteca", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toHaveCount(0);
  const trigger = menuTrigger(page);
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();
  const sheet = menuSheet(page);
  await expect(sheet).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  // Everything the wide header offers is reachable here, exactly once.
  await expect(sheet.getByRole("link", { name: "Biblioteca", exact: true })).toHaveCount(1);
  await expect(sheet.getByRole("link", { name: "Administrar contenido" })).toHaveCount(1);
  await expect(sheet.getByRole("button", { name: "Cerrar sesión" })).toHaveCount(1);
  await expect(sheet.getByText(`${organizationName} · Administrador`)).toBeVisible();
  // Still one sign-out in the whole document, not one per responsive variant.
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toHaveCount(1);

  // Focus is contained while the sheet is modal.
  await expect(sheet.locator(":focus")).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("choosing a destination in the compact sheet navigates and dismisses it", async ({ page }) => {
  await signIn(page, "Admin");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app");

  await menuTrigger(page).click();
  const sheet = menuSheet(page);
  await expect(sheet).toBeVisible();
  await sheet.getByRole("link", { name: "Biblioteca", exact: true }).click();

  await expect(page).toHaveURL(/\/app\/library$/);
  await expect(sheet).toBeHidden();
  await expect(menuTrigger(page)).toHaveAttribute("aria-expanded", "false");
});

test("the compact sheet is reachable and dismissable by keyboard alone", async ({ page }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/app/library");

  await menuTrigger(page).focus();
  await expect(menuTrigger(page)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(menuSheet(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menuSheet(page)).toBeHidden();
  await expect(menuTrigger(page)).toBeFocused();
});

test("the shell search is scoped to the surfaces it acts on", async ({ page }) => {
  await signIn(page, "Admin");
  await page.setViewportSize({ width: WIDE, height: 900 });
  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });

  await page.goto("/app");
  await expect(search).toBeVisible();

  await page.goto("/app/library");
  await expect(search).toBeVisible();
  // Exactly one search control on the Library: it is not duplicated by the
  // filter panel it was moved out of.
  await expect(search).toHaveCount(1);

  // Content management has its own search semantics; a Library field there
  // would be ambiguous.
  await page.goto("/app/contributions");
  await expect(search).toHaveCount(0);
});

test("searching from the shell narrows the Library without discarding applied filters", async ({ page }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: WIDE, height: 900 });
  await page.goto("/app/library?view=programa&entity=module");

  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill("democracia");
  await search.press("Enter");

  await expect(page).toHaveURL(/q=democracia/);
  // The URL stays the whole filter contract.
  await expect(page).toHaveURL(/view=programa/);
  await expect(page).toHaveURL(/entity=module/);
  // And the field keeps showing what the URL holds.
  await expect(search).toHaveValue("democracia");
});

test("the shell fits every validated width for an Admin, whose extra destination costs the most room", async ({ page }) => {
  await signIn(page, "Admin");
  for (const width of ALL_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/library");
    await expect(page.getByRole("link", { name: "Base Curricular Democracia+" })).toBeVisible();
    expect(await horizontalOverflow(page), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);

    // Destinations stay reachable at every width, inline or behind the trigger.
    if (width >= 1180) await expect(page.getByRole("link", { name: "Administrar contenido" })).toBeVisible();
    else await expect(menuTrigger(page)).toBeVisible();
  }
});

test("no responsive width serialises the Admin destination for a reader", async ({ page }) => {
  await signIn(page, "Contributor");

  for (const width of ALL_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/library");
    const markup = await page.content();
    // Absent from the document, not merely hidden by CSS or collapsed state.
    expect(markup, `Admin destination serialised at ${width}px`).not.toContain("Administrar contenido");
    expect(markup, `Admin route serialised at ${width}px`).not.toContain("/app/contributions");
    expect(await horizontalOverflow(page), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0);
  }

  // Including with the compact sheet open, where the destinations are rendered.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app/library");
  await menuTrigger(page).click();
  await expect(menuSheet(page)).toBeVisible();
  const opened = await page.content();
  expect(opened).not.toContain("Administrar contenido");
  expect(opened).not.toContain("/app/contributions");
  await expect(menuSheet(page).getByRole("link", { name: "Biblioteca", exact: true })).toBeVisible();
});
