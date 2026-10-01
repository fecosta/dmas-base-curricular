import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabase } from "./local-supabase";
import type { Database } from "../../src/lib/supabase/database.types";

/*
 * SPEC-008 Phase 2 — privacy UX through the real stack.
 *
 * Covers what only a browser plus a real database can settle: that the
 * decision shown is the decision stored, that rejection is persisted and not
 * re-prompted, that `Configurar` enables nothing, and that a user who declines
 * analytics keeps full product access.
 *
 * The preference row is read back with privileged access in the assertions
 * only — never by application code — so the test verifies persistence rather
 * than trusting the interface that wrote it.
 */

const local = localSupabase();
// Privileged access is confined to local test fixture setup and verification.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = randomUUID();
const organizationName = "Red de privacidad E2E";
const domain = `privacidad-${randomUUID()}.test`;

const WIDE = 1440;
const COMPACT = { width: 390, height: 844 };

function assertSuccess(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

async function provision(role: "Contributor" | "Admin" = "Contributor") {
  const email = `${randomUUID()}@${domain}`;
  const created = await operator.auth.admin.createUser({ email, email_confirm: true });
  assertSuccess(created);
  const userId = created.data.user!.id;
  assertSuccess(await operator.from("memberships").insert({
    user_id: userId, organization_id: organizationId, is_active: true, role,
  }));
  return { email, userId };
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

/** The persisted row, read directly rather than through the interface. */
async function storedPreference(userId: string) {
  const { data, error } = await operator
    .from("analytics_preferences")
    .select("analytics_enabled,analytics_decided_at,privacy_notice_version,consent_version")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

const choice = (page: Page) => page.getByRole("region", { name: "Ayúdanos a mejorar Base Curricular" })
  .or(page.getByRole("heading", { name: "Ayúdanos a mejorar Base Curricular" }));
const preferencesTrigger = (page: Page) => page.getByRole("button", { name: "Preferencias de datos" });
const preferencesDialog = (page: Page) => page.getByRole("dialog", { name: "Preferencias de datos" });
const analyticsSwitch = (page: Page) => preferencesDialog(page).getByRole("switch", { name: /Analítica del producto/ });

test.beforeAll(async () => {
  assertSuccess(await operator.from("organizations").insert({ id: organizationId, name: organizationName, is_active: true }));
  assertSuccess(await operator.from("organization_domains").insert({ domain, organization_id: organizationId }));
});

test("a user with no decision is asked, and nothing is stored until they choose", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);

  await expect(choice(page).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Rechazar analítica" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Configurar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aceptar" })).toBeVisible();

  // Undecided: no row at all, which is distinct from a stored rejection.
  expect(await storedPreference(userId)).toBeNull();

  // Navigating away without deciding changes nothing and blocks nothing.
  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();
  expect(await storedPreference(userId)).toBeNull();
});

test("rejecting analytics persists the negative decision and is not re-prompted", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);

  await page.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect(choice(page).first()).toBeHidden();

  const stored = await storedPreference(userId);
  expect(stored?.analytics_enabled).toBe(false);
  // The decision metadata is what separates rejected from undecided.
  expect(stored?.analytics_decided_at).toBeTruthy();
  expect(stored?.privacy_notice_version).toBe("1.1");
  expect(stored?.consent_version).toBe("1.1");

  // A new session does not ask again.
  await page.reload();
  await expect(choice(page).first()).toBeHidden();
  await page.goto("/app/library");
  await expect(choice(page).first()).toBeHidden();

  // And the preferences surface reports the stored state accurately.
  await preferencesTrigger(page).click();
  await expect(analyticsSwitch(page)).toHaveAttribute("aria-checked", "false");
});

test("rejecting analytics preserves normal product access", async ({ page }) => {
  const { email } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect(choice(page).first()).toBeHidden();

  // Browse, search and filter all keep working after declining.
  await page.goto("/app/library");
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();
  const search = page.getByRole("combobox", { name: "Buscar en la biblioteca" });
  await search.fill("democracia");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=democracia/);
  await expect(page.getByRole("heading", { name: "Biblioteca", level: 1 })).toBeVisible();
});

test("accepting analytics persists the affirmative decision before anything is enabled", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);

  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect(choice(page).first()).toBeHidden();

  const stored = await storedPreference(userId);
  expect(stored?.analytics_enabled).toBe(true);
  expect(stored?.privacy_notice_version).toBe("1.1");

  await preferencesTrigger(page).click();
  await expect(analyticsSwitch(page)).toHaveAttribute("aria-checked", "true");
});

test("Configurar opens preferences without enabling analytics", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);

  await page.getByRole("button", { name: "Configurar" }).click();
  await expect(preferencesDialog(page)).toBeVisible();
  // Opening preferences is not a decision.
  expect(await storedPreference(userId)).toBeNull();
  await expect(analyticsSwitch(page)).toHaveAttribute("aria-checked", "false");

  // Closing it is not a decision either.
  await page.keyboard.press("Escape");
  await expect(preferencesDialog(page)).toBeHidden();
  expect(await storedPreference(userId)).toBeNull();
});

test("the user can switch analytics off and on again from preferences", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect(choice(page).first()).toBeHidden();

  await preferencesTrigger(page).click();
  const control = analyticsSwitch(page);

  // OFF -> ON
  await control.click();
  await expect(control).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => (await storedPreference(userId))?.analytics_enabled).toBe(true);

  // ON -> OFF
  await control.click();
  await expect(control).toHaveAttribute("aria-checked", "false");
  await expect.poll(async () => (await storedPreference(userId))?.analytics_enabled).toBe(false);

  // The state survives a reload because it is stored, not local.
  await page.reload();
  await preferencesTrigger(page).click();
  await expect(analyticsSwitch(page)).toHaveAttribute("aria-checked", "false");
});

test("the analytics control is operable by keyboard and exposes its state", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);
  await page.getByRole("button", { name: "Rechazar analítica" }).click();

  await preferencesTrigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(preferencesDialog(page)).toBeVisible();

  const control = analyticsSwitch(page);
  await control.focus();
  await expect(control).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(control).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => (await storedPreference(userId))?.analytics_enabled).toBe(true);

  // Escape dismisses the dialog and returns focus to its trigger.
  await page.keyboard.press("Escape");
  await expect(preferencesDialog(page)).toBeHidden();
  await expect(preferencesTrigger(page)).toBeFocused();
});

test("Preferencias de datos is reachable at compact widths, where rejection must not get harder", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize(COMPACT);
  await login(page, email);

  // Every choice stays visible and the page does not scroll sideways.
  await expect(page.getByRole("button", { name: "Rechazar analítica" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Configurar" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Aceptar" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect.poll(async () => (await storedPreference(userId))?.analytics_enabled).toBe(false);

  // Preferences live in the compact navigation sheet at this width.
  await page.getByRole("button", { name: "Menú" }).click();
  const sheet = page.getByRole("dialog", { name: "Menú" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Preferencias de datos" }).click();
  await expect(preferencesDialog(page)).toBeVisible();
  await expect(analyticsSwitch(page)).toHaveAttribute("aria-checked", "false");
});

test("an Admin has the same personal preference and no authority over another user's", async ({ page, browser }) => {
  const admin = await provision("Admin");
  const reader = await provision("Contributor");

  // The reader declines through their own session, which is the only path that
  // can write the row at all.
  const readerContext = await browser.newContext();
  const readerPage = await readerContext.newPage();
  await readerPage.setViewportSize({ width: WIDE, height: 900 });
  await login(readerPage, reader.email);
  await readerPage.getByRole("button", { name: "Rechazar analítica" }).click();
  await expect.poll(async () => (await storedPreference(reader.userId))?.analytics_enabled).toBe(false);
  await readerContext.close();

  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, admin.email);

  // The Admin is asked for their own decision like anyone else.
  await expect(choice(page).first()).toBeVisible();
  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect.poll(async () => (await storedPreference(admin.userId))?.analytics_enabled).toBe(true);

  // The reader's decision is untouched: there is no Admin path to it.
  expect((await storedPreference(reader.userId))?.analytics_enabled).toBe(false);

  // No Admin surface offers another user's analytics preference.
  await page.goto("/app/users");
  const users = await page.content();
  expect(users).not.toContain("Analítica del producto");
  expect(users).not.toContain("analytics_enabled");
});

/*
 * The preference is writable only by its live owner. Even privileged operator
 * access — which exists for privacy-rights fulfilment — cannot record or alter
 * someone's analytics decision.
 */
test("privileged operator access cannot write another user's analytics decision", async () => {
  const { userId } = await provision();

  const inserted = await operator.from("analytics_preferences").insert({
    user_id: userId, analytics_enabled: true, privacy_notice_version: "1.1", consent_version: "1.1",
  });
  expect(inserted.error?.message).toContain("permission denied");
  expect(await storedPreference(userId)).toBeNull();

  const called = await operator.rpc("set_analytics_preference", {
    requested_analytics_enabled: true,
    requested_privacy_notice_version: "1.1",
    requested_consent_version: "1.1",
  });
  expect(called.error).toBeTruthy();
  expect(await storedPreference(userId)).toBeNull();
});

test("the Privacy Notice and Terms are reachable and reading them is not a decision", async ({ page }) => {
  const { email, userId } = await provision();
  await page.setViewportSize({ width: WIDE, height: 900 });
  await login(page, email);

  await page.getByRole("link", { name: "Aviso de Privacidad" }).first().click();
  await expect(page).toHaveURL(/\/app\/privacidad\/aviso$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Aviso de Privacidad");
  // The notice renders the authoritative document, including its analytics commitments.
  await expect(page.getByText("La analítica del producto es opcional.").first()).toBeVisible();
  expect(await storedPreference(userId)).toBeNull();

  await page.goto("/app/privacidad/terminos");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Términos de Uso");
  // Reading or accepting the Terms is not an analytics decision.
  expect(await storedPreference(userId)).toBeNull();

  // No raw Markdown survives into either surface.
  const terms = await page.locator("main").innerText();
  expect(terms).not.toContain("**");
  expect(terms).not.toContain("---");
});

test("the privacy documents require a session", async ({ page }) => {
  await page.goto("/app/privacidad/aviso");
  await expect(page).toHaveURL(/\/login/);
});
