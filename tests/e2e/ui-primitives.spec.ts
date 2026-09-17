import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * Browser validation for the SPEC-006 Phase 1 primitives.
 *
 * Focus containment, Escape, focus restoration and background scroll lock are
 * delegated to the platform's native <dialog>, so they can only be verified in a
 * real browser — a DOM shim would assert the shim. The primitives are driven
 * from the development-only harness at /app/ui-primitives, since Phase 1
 * deliberately does not yet place them on a product surface.
 */

const local = localSupabase();
// Privileged access is confined to local test fixture setup, never app code.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const domain = `primitives-${randomUUID()}.test`;

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
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

const documentOverflow = (page: Page) => page.evaluate(() => getComputedStyle(document.documentElement).overflow);

/** Overlay entrances animate, so geometry is only meaningful once they have landed. */
const settle = (locator: Locator) =>
  locator.evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished)));

/**
 * Walks focus forward and reports where each stop landed.
 *
 * A native modal <dialog> does not wrap Tab; it makes the rest of the document
 * inert, so tabbing past the last control parks focus outside the page (the
 * browser's own UI) and brings it back. "outside" — a focusable element of the
 * page behind the overlay — is the outcome containment has to rule out.
 */
async function walkFocus(page: Page, steps: number) {
  const stops: string[] = [];
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("Tab");
    stops.push(await page.evaluate(() => {
      const active = document.activeElement;
      if (!active || active === document.body) return "parked";
      return active.closest("dialog") ? "inside" : "outside";
    }));
  }
  return stops;
}

/** Whether a control on the page behind the overlay can still take focus. */
const canFocusBehind = (page: Page, name: string) => page.evaluate((label) => {
  const target = [...document.querySelectorAll("button")].find((button) => button.textContent?.includes(label));
  target?.focus();
  return !!target && document.activeElement === target;
}, name);

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: "Red de primitivos E2E", is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test.beforeEach(async ({ page }) => {
  const email = `${randomUUID()}@${domain}`;
  const created = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(created);
  assertSuccess(await operator.from("memberships").insert({
    user_id: created.data.user!.id, organization_id: organizationId, is_active: true, role: "Contributor",
  }));
  await login(page, email);
  await page.goto("/app/ui-primitives");
  await expect(page.getByRole("heading", { name: "Primitivos de interfaz" })).toBeVisible();
});

test("Dialog opens modally, contains focus, dismisses with Escape and restores focus", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Abrir diálogo" });
  const dialog = page.getByRole("dialog", { name: "Diálogo de prueba" });

  await expect(dialog).toBeHidden();
  expect(await documentOverflow(page)).not.toBe("hidden");

  await trigger.click();
  await expect(dialog).toBeVisible();

  // Named by its own title, not by its dismiss control.
  await expect(dialog).toHaveAttribute("aria-labelledby", /./);
  await expect(page.locator("dialog[open]")).toHaveCount(1);

  // Background scroll is locked while the overlay is up.
  expect(await documentOverflow(page)).toBe("hidden");

  // Focus starts on the labelled panel rather than the close button, and never
  // reaches the page behind the overlay.
  await expect(dialog.locator(":focus")).toHaveCount(1);
  const stops = await walkFocus(page, 10);
  expect(stops).not.toContain("outside");
  expect(stops).toContain("inside");
  expect(await canFocusBehind(page, "Abrir panel lateral")).toBe(false);

  // The body scrolls; the page behind it does not move.
  const pageScrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollBefore);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(await documentOverflow(page)).not.toBe("hidden");
  await expect(trigger).toBeFocused();
});

test("Dialog closes from its close control and from a click outside the panel", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Abrir diálogo" });
  const dialog = page.getByRole("dialog", { name: "Diálogo de prueba" });

  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cerrar" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(dialog).toBeVisible();
  // Top-left of the viewport is scrim, never panel: the panel is centred at this width.
  await page.mouse.click(6, 6);
  await expect(dialog).toBeHidden();
});

test("Dialog goes full-screen on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir diálogo" }).click();
  const panel = page.getByRole("dialog", { name: "Diálogo de prueba" }).locator("> div");
  await settle(panel);
  const box = (await panel.boundingBox())!;
  expect(box.width).toBeCloseTo(390, 0);
  expect(box.height).toBeCloseTo(844, 0);
});

test("Drawer opens from the left edge, dismisses with Escape and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const trigger = page.getByRole("button", { name: "Abrir panel lateral" });
  const drawer = page.getByRole("dialog", { name: "Filtros" });

  await expect(drawer).toBeHidden();
  await trigger.click();
  await expect(drawer).toBeVisible();

  const panel = drawer.locator("> div");
  await settle(panel);
  const box = (await panel.boundingBox())!;
  expect(box.x).toBeCloseTo(0, 0);
  expect(box.height).toBeCloseTo(844, 0);
  expect(box.width).toBeLessThan(390);

  expect(await documentOverflow(page)).toBe("hidden");
  await expect(drawer.locator(":focus")).toHaveCount(1);
  const stops = await walkFocus(page, 8);
  expect(stops).not.toContain("outside");
  expect(stops).toContain("inside");
  expect(await canFocusBehind(page, "Abrir diálogo")).toBe(false);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  expect(await documentOverflow(page)).not.toBe("hidden");
  await expect(trigger).toBeFocused();
});

test("SearchInput is reachable by name and by the / shortcut", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Buscar en la biblioteca" });
  await expect(search).toBeVisible();

  await page.getByRole("heading", { name: "Primitivos de interfaz" }).click();
  await expect(search).not.toBeFocused();

  await page.keyboard.press("/");
  await expect(search).toBeFocused();
  // The shortcut must not also type the character it was pressed with.
  await expect(search).toHaveValue("");

  // Inside a text field, "/" is a character rather than a command.
  await search.fill("campaña");
  await page.keyboard.press("/");
  await expect(search).toHaveValue("campaña/");
});

test("the / shortcut does not pull focus out of an open dialog", async ({ page }) => {
  const dialog = page.getByRole("dialog", { name: "Diálogo de prueba" });
  await page.getByRole("button", { name: "Abrir diálogo" }).click();
  await expect(dialog).toBeVisible();

  await page.keyboard.press("/");
  expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  await expect(page.getByRole("searchbox", { name: "Buscar en la biblioteca" })).not.toBeFocused();
});
