import { randomUUID } from "node:crypto";
import { expect, test, type Page, type Locator } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-010 U5 / D-035 — external feedback link.
 *
 * Validates the floating feedback action in the authenticated shell: visibility,
 * responsive label, fixed bottom-right placement, viewport containment,
 * keyboard operability, correct external URL attributes, and new-tab behavior.
 * The configured URL is intercepted so no real third-party request is made.
 */

const local = localSupabase();
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const organizationName = "Red de feedback E2E";
const domain = `feedback-${randomUUID()}.test`;
const FEEDBACK_URL = "https://form.jotform.com/e2e-feedback-test";

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

function feedbackLink(page: Page): Locator {
  return page.getByRole("link", { name: "Enviar comentarios" });
}

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: organizationName, is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test.beforeEach(async ({ context }) => {
  await context.route(FEEDBACK_URL, async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Feedback form (intercepted)</body></html>" });
  });
});

test("desktop shows the labelled button fixed at the bottom-right", async ({ page }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/library");

  const link = feedbackLink(page);
  await expect(link).toBeVisible();
  await expect(link).toContainText("Enviar comentarios");

  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  // Fixed at the right edge: right side within two widths of the viewport edge.
  expect(box!.x + box!.width).toBeGreaterThanOrEqual(1440 - box!.width * 2);
  // Fixed at the bottom edge: bottom side within two heights of the viewport edge.
  expect(box!.y + box!.height).toBeGreaterThanOrEqual(900 - box!.height * 2);
});

test("mobile shows an icon-only button that stays inside the viewport", async ({ page }) => {
  await signIn(page, "Contributor");
  const viewport = { width: 375, height: 812 };
  await page.setViewportSize(viewport);
  await page.goto("/app/library");

  const link = feedbackLink(page);
  await expect(link).toBeVisible();
  // Accessible name is preserved even though the visible label is hidden.
  await expect(link).toHaveAttribute("aria-label", "Enviar comentarios");

  const label = link.locator("span");
  await expect(label).toBeHidden();

  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
});

test("mobile button does not obstruct header controls or footer privacy links", async ({ page }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/app/library");

  const link = feedbackLink(page);
  await expect(link).toBeVisible();
  const linkBox = await link.boundingBox();
  expect(linkBox).not.toBeNull();

  function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
    return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
  }

  const menu = page.getByRole("button", { name: "Menú" });
  await expect(menu).toBeVisible();
  const menuBox = await menu.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(overlaps(linkBox!, menuBox!)).toBe(false);

  // Scroll to the bottom so the footer privacy links are in the viewport.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const footer = page.getByRole("contentinfo");
  const privacy = footer.getByRole("link", { name: "Aviso de Privacidad", exact: true });
  await expect(privacy).toBeVisible();
  const privacyBox = await privacy.boundingBox();
  expect(privacyBox).not.toBeNull();
  expect(overlaps(linkBox!, privacyBox!)).toBe(false);
});

test("link exposes the expected external URL attributes", async ({ page }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/library");

  const link = feedbackLink(page);
  await expect(link).toHaveAttribute("href", FEEDBACK_URL);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  await expect(link).toHaveAttribute("rel", /noreferrer/);
});

test("keyboard can focus and activate the link", async ({ page, context }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/library");

  const link = feedbackLink(page);

  // Tab reachability: start from the document body and press Tab repeatedly
  // until the feedback link receives focus. The link is rendered at the end of
  // the authenticated shell, so a bounded number of Tab presses reaches it.
  await page.evaluate(() => document.body.focus());
  let focused = false;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    if (await link.evaluate((el) => el === document.activeElement)) {
      focused = true;
      break;
    }
  }
  expect(focused).toBe(true);
  await expect(link).toBeFocused();

  // Visible keyboard focus: the link is focused via keyboard, so :focus-visible
  // should apply an outline (or equivalent focus indicator).
  const focusIndicator = await link.evaluate((el) => {
    const style = window.getComputedStyle(el);
    const hasOutline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const hasShadow = style.boxShadow !== "none";
    return { hasOutline, hasShadow, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(
    focusIndicator.hasOutline || focusIndicator.hasShadow,
    `expected visible keyboard focus indicator, got outline:${focusIndicator.outlineStyle}/${focusIndicator.outlineWidth}, shadow:${focusIndicator.hasShadow}`,
  ).toBe(true);

  await expect(link).toBeVisible();

  // Activation opens the URL in a new page; close it and return.
  const [newPage] = await Promise.all([
    context.waitForEvent("page", { timeout: 10_000 }),
    link.press("Enter"),
  ]);
  await expect(newPage).toHaveURL(FEEDBACK_URL);
  await newPage.close();
  await expect(page).toHaveURL(/\/app/);
});

test("clicking opens a new tab at the configured URL while the original page remains", async ({ page, context }) => {
  await signIn(page, "Contributor");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/app/library");

  const originalUrl = page.url();
  const [newPage] = await Promise.all([
    context.waitForEvent("page"),
    feedbackLink(page).click(),
  ]);
  await expect(newPage).toHaveURL(FEEDBACK_URL);
  expect(page.url()).toBe(originalUrl);
  await newPage.close();
});

test("the feedback link is absent on the public login page", async ({ page }) => {
  await page.goto("/login");
  await expect(feedbackLink(page)).toHaveCount(0);
});
