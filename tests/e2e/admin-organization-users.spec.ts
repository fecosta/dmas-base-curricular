import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/supabase/database.types";
import { localSupabase } from "./local-supabase";

const local = localSupabase();
// This fixture is local-only. Keep the Admin actor and its organization because
// access_administration_events intentionally preserves actor references.
const operator = createClient<Database>(local.url, local.secret, { auth: { persistSession: false, autoRefreshToken: false } });
const actorOrganizationId = "f9000000-0000-4000-8000-000000000001";
const actorOrganizationName = "SPEC-009 Admin E2E";
const actorDomain = "admin-fixture-spec009.test";
const marker = randomUUID().slice(0, 8);
// Audit references prohibit deleting the acting identity. Use a fresh local
// actor address per run so OTP throttling and prior consumed codes cannot collide.
const actorEmail = `admin-${marker}@${actorDomain}`;
const organizationsToRemove: string[] = [];
const emailsToRemove: string[] = [];

function assertSuccess<T extends { error: { message: string } | null }>(result: T): T {
  if (result.error) throw new Error(result.error.message);
  return result;
}

async function ensureAdminActor() {
  const existingOrganization = assertSuccess(await operator.from("organizations").select("id,name,is_active").eq("id", actorOrganizationId).maybeSingle()).data;
  if (!existingOrganization) {
    assertSuccess(await operator.from("organizations").insert({ id: actorOrganizationId, name: actorOrganizationName, is_active: true }));
  } else if (existingOrganization.name !== actorOrganizationName) {
    throw new Error("SPEC-009 local Admin fixture organization ID is already in use");
  } else if (!existingOrganization.is_active) {
    assertSuccess(await operator.from("organizations").update({ is_active: true }).eq("id", actorOrganizationId));
  }

  const existingDomain = assertSuccess(await operator.from("organization_domains").select("organization_id").eq("domain", actorDomain).maybeSingle()).data;
  if (!existingDomain) {
    assertSuccess(await operator.from("organization_domains").insert({ domain: actorDomain, organization_id: actorOrganizationId }));
  } else if (existingDomain.organization_id !== actorOrganizationId) {
    throw new Error("SPEC-009 local Admin fixture domain is already in use");
  }

  const listedUsers = assertSuccess(await operator.auth.admin.listUsers({ page: 1, perPage: 1000 }));
  let actor = listedUsers.data.users.find((user) => user.email?.toLowerCase() === actorEmail);
  if (!actor) {
    const created = assertSuccess(await operator.auth.admin.createUser({ email: actorEmail, email_confirm: true }));
    actor = created.data.user ?? undefined;
  }
  if (!actor) throw new Error("Could not create the SPEC-009 local Admin fixture identity");

  const existingMembership = assertSuccess(await operator.from("memberships").select("user_id").eq("user_id", actor.id).maybeSingle()).data;
  if (!existingMembership) {
    assertSuccess(await operator.from("memberships").insert({
      user_id: actor.id,
      organization_id: actorOrganizationId,
      role: "Admin",
      is_active: true,
    }));
  } else {
    assertSuccess(await operator.from("memberships").update({
      organization_id: actorOrganizationId,
      role: "Admin",
      is_active: true,
    }).eq("user_id", actor.id));
  }
}

async function findAuthUserId(email: string): Promise<string | null> {
  const listed = assertSuccess(await operator.auth.admin.listUsers({ page: 1, perPage: 1000 }));
  return listed.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await expect(page.getByRole("status")).toContainText("Si tu cuenta está habilitada");
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

async function accessResult(page: Page): Promise<{ status: number; role?: string; organizationId?: string }> {
  return page.evaluate(async () => {
    const response = await fetch("/api/access");
    const body = await response.json();
    return { status: response.status, role: body.role, organizationId: body.organizationId };
  });
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.beforeAll(async () => ensureAdminActor());

test.afterAll(async () => {
  for (const email of emailsToRemove) {
    const userId = await findAuthUserId(email);
    if (userId) assertSuccess(await operator.auth.admin.deleteUser(userId));
  }
  for (const name of organizationsToRemove) {
    const result = assertSuccess(await operator.from("organizations").select("id").eq("name", name));
    if (!result.data) continue;
    const ids = result.data.map((organization) => organization.id);
    if (ids.length === 0) continue;
    assertSuccess(await operator.from("organization_domains").delete().in("organization_id", ids));
    assertSuccess(await operator.from("organizations").delete().in("id", ids));
  }
});

test("Admin manages organizations, trusted users, domains, status and roles through live boundaries", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const organizationA = `SPEC-009 Organización ${marker}`;
  const renamedOrganizationA = `${organizationA} Editada`;
  const organizationB = `SPEC-009 Reasignación ${marker}`;
  const domainA = `spec009-a-${marker}.test`;
  const domainB = `spec009-b-${marker}.test`;
  const domainC = `spec009-c-${marker}.test`;
  const untrustedEmail = `preexistente-${marker}@${domainA}`;
  const memberEmail = `miembro-${marker}@${domainB}`;
  organizationsToRemove.push(organizationA, renamedOrganizationA, organizationB);
  emailsToRemove.push(untrustedEmail, memberEmail);

  await login(page, actorEmail);
  await page.goto("/app/organizations");
  await expect(page.getByRole("heading", { name: "Organizaciones", exact: true })).toBeVisible();
  await page.getByLabel("Nombre de la organización").fill(organizationA);
  await page.getByLabel("Dominios aprobados").fill(`${domainA}\n${domainB}`);
  await page.getByRole("button", { name: "Crear organización", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Organización creada.");

  const organizationCardA = page.locator("article").filter({ hasText: organizationA });
  const organizationAPath = await organizationCardA.getByRole("link", { name: "Gestionar organización" }).getAttribute("href");
  expect(organizationAPath).toMatch(/^\/app\/organizations\/[0-9a-f-]+$/);
  const organizationAId = organizationAPath!.split("/").pop()!;
  await organizationCardA.getByRole("link", { name: "Gestionar organización" }).click();
  await expect(page.getByRole("heading", { name: organizationA, exact: true })).toBeVisible();
  await expect(page.getByText(domainA, { exact: true })).toBeVisible();
  await expect(page.getByText(domainB, { exact: true })).toBeVisible();
  await expect(page.locator('form[data-client-ready="true"]')).toBeVisible();
  const organizationNameInput = page.getByLabel("Nombre de la organización");
  await organizationNameInput.fill(renamedOrganizationA);
  await expect(organizationNameInput).toHaveValue(renamedOrganizationA);
  const organizationNameRequest = page.waitForRequest((request) => request.method() === "POST" && !!request.headers()["next-action"]);
  await page.getByRole("button", { name: "Guardar nombre" }).click();
  expect(await (await organizationNameRequest).postData()).toContain(renamedOrganizationA);
  await expect(page.getByRole("status")).toContainText("Nombre de la organización actualizado.");
  await expect(page.getByRole("heading", { name: renamedOrganizationA, exact: true })).toBeVisible();
  await page.goto("/app/organizations");
  const renamedCard = page.locator("article").filter({ hasText: renamedOrganizationA });
  expect(await renamedCard.getByRole("link", { name: "Gestionar organización" }).getAttribute("href"))
    .toBe(`/app/organizations/${organizationAId}`);

  await page.goto("/app/organizations");
  await page.getByLabel("Nombre de la organización").fill(organizationB);
  await page.getByLabel("Dominios aprobados").fill(domainC);
  await page.getByRole("button", { name: "Crear organización", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Organización creada.");
  const organizationCardB = page.locator("article").filter({ hasText: organizationB });
  const organizationBPath = await organizationCardB.getByRole("link", { name: "Gestionar organización" }).getAttribute("href");
  expect(organizationBPath).toMatch(/^\/app\/organizations\/[0-9a-f-]+$/);
  const organizationBId = organizationBPath!.split("/").pop()!;

  const untrustedIdentity = assertSuccess(await operator.auth.admin.createUser({
    email: untrustedEmail,
    email_confirm: true,
    user_metadata: { role: "Admin", spec009_trusted_provisioning: true },
  }));
  expect(untrustedIdentity.data.user).toBeTruthy();

  await page.goto("/app/users");
  await page.locator("#provision-user > summary").click();
  await page.getByLabel("Correo de acceso").fill(untrustedEmail);
  await page.getByLabel("Organización").first().selectOption(organizationAId);
  await page.getByLabel("Rol").first().selectOption("Admin");
  await page.getByRole("button", { name: "Agregar usuario", exact: true }).last().click();
  await expect(page.getByText(/no se puede reutilizar/)).toBeVisible();
  const untrustedMembership = assertSuccess(await operator.from("memberships").select("user_id")
    .eq("user_id", untrustedIdentity.data.user!.id).maybeSingle()).data;
  expect(untrustedMembership).toBeNull();

  await page.getByLabel("Correo de acceso").fill(memberEmail);
  await page.getByLabel("Organización").first().selectOption(organizationAId);
  await page.getByLabel("Rol").first().selectOption("Contributor");
  await page.getByRole("button", { name: "Agregar usuario", exact: true }).last().click();
  await expect(page.getByRole("status")).toContainText("Usuario agregado.");
  await page.getByLabel("Buscar por correo").fill(memberEmail);
  const userFilters = page.locator('form[method="get"]');
  await userFilters.getByLabel("Organización").selectOption(organizationAId);
  await userFilters.getByLabel("Rol").selectOption("Contributor");
  await userFilters.getByLabel("Estado").selectOption("active");
  await userFilters.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/\/app\/users\?/);

  const memberCard = page.locator("article").filter({ hasText: memberEmail });
  await expect(memberCard).toBeVisible();
  await expect(memberCard.locator('input[name="email"]')).toHaveCount(0);
  const memberContext = await browser.newContext();
  const memberPage = await memberContext.newPage();
  try {
    await login(memberPage, memberEmail);
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(200);

    // The target domain is not yet approved by organization B, so reassignment fails closed.
    await memberCard.getByText("Gestionar usuario", { exact: true }).click();
    await memberCard.locator('select[name="organization_id"]').selectOption(organizationBId);
    await memberCard.getByRole("button", { name: "Cambiar organización" }).click();
    await expect(memberCard.getByText(`¿Reasignar a ${organizationB}?`)).toBeVisible();
    await memberCard.getByRole("button", { name: "Confirmar reasignación" }).click();
    await expect(memberCard.getByRole("alert")).toContainText("dominio actual del correo no está aprobado");
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(200);

    // Moving the approved domain is deliberate and warns that current users may lose access.
    await page.goto(`/app/organizations/${organizationAId}`);
    const domainRow = page.locator("li").filter({ hasText: domainB });
    await domainRow.getByRole("button", { name: "Retirar dominio" }).click();
    await expect(domainRow.getByText(/pueden perder acceso/)).toBeVisible();
    await domainRow.getByRole("button", { name: "Confirmar retiro" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(403);

    await page.goto(`/app/organizations/${organizationBId}`);
    await page.getByLabel("Agregar dominio aprobado").fill(domainB);
    await page.getByRole("button", { name: "Agregar dominio" }).click();
    await expect(page.getByRole("status")).toContainText("Dominio aprobado agregado.");

    await page.goto(`/app/users?email=${encodeURIComponent(memberEmail)}`);
    const refreshedMemberCard = page.locator("article").filter({ hasText: memberEmail });
    await refreshedMemberCard.getByText("Gestionar usuario", { exact: true }).click();
    await refreshedMemberCard.locator('select[name="organization_id"]').selectOption(organizationBId);
    await refreshedMemberCard.getByRole("button", { name: "Cambiar organización" }).click();
    await refreshedMemberCard.getByRole("button", { name: "Confirmar reasignación" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(200);
    await expect.poll(async () => (await accessResult(memberPage)).organizationId).toBe(organizationBId);

    // Organization status blocks access without rewriting the membership state.
    await page.goto(`/app/organizations/${organizationBId}`);
    await expect(page.getByRole("region", { name: "Miembros" }).getByText(memberEmail)).toBeVisible();
    await page.getByRole("button", { name: "Desactivar organización" }).click();
    await expect(page.getByText(/perderán acceso mientras permanezca inactiva/)).toBeVisible();
    await page.getByRole("button", { name: "Confirmar desactivación" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(403);
    const memberId = await findAuthUserId(memberEmail);
    expect(memberId).toBeTruthy();
    const membershipWhileOrganizationInactive = assertSuccess(await operator.from("memberships").select("is_active")
      .eq("user_id", memberId!).maybeSingle()).data;
    expect(membershipWhileOrganizationInactive?.is_active).toBe(true);
    await page.getByRole("button", { name: "Activar organización" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(200);

    // User deactivation is confirmed and retains the account/membership row.
    await page.goto(`/app/users?email=${encodeURIComponent(memberEmail)}`);
    const activeMemberCard = page.locator("article").filter({ hasText: memberEmail });
    await activeMemberCard.getByText("Gestionar usuario", { exact: true }).click();
    await activeMemberCard.getByRole("button", { name: "Desactivar usuario" }).click();
    await expect(activeMemberCard.getByText(/cuenta, organización e historial se conservarán/)).toBeVisible();
    await activeMemberCard.getByRole("button", { name: "Confirmar desactivación" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(403);
    const inactiveMembership = assertSuccess(await operator.from("memberships").select("is_active")
      .eq("user_id", memberId!).maybeSingle()).data;
    expect(inactiveMembership?.is_active).toBe(false);
    await activeMemberCard.getByText("Gestionar usuario", { exact: true }).click();
    await page.getByRole("button", { name: "Activar usuario" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).status).toBe(200);

    await page.goto(`/app/users?email=${encodeURIComponent(memberEmail)}`);
    const contributorCard = page.locator("article").filter({ hasText: memberEmail });
    await contributorCard.getByText("Gestionar usuario", { exact: true }).click();
    await contributorCard.locator('select[name="role"]').selectOption("Admin");
    await contributorCard.getByRole("button", { name: "Cambiar rol" }).click();
    await expect(contributorCard.getByText("¿Cambiar de Miembro a Administrador?")).toBeVisible();
    await contributorCard.getByRole("button", { name: "Confirmar cambio de rol" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).role).toBe("Admin");
    await memberPage.goto("/app");
    await expect(memberPage.getByRole("link", { name: "Organizaciones", exact: true })).toBeVisible();
    await expect(memberPage.getByRole("link", { name: "Usuarios", exact: true })).toBeVisible();

    await page.goto(`/app/users?email=${encodeURIComponent(memberEmail)}`);
    const adminCard = page.locator("article").filter({ hasText: memberEmail });
    await adminCard.getByText("Gestionar usuario", { exact: true }).click();
    await adminCard.locator('select[name="role"]').selectOption("Contributor");
    await adminCard.getByRole("button", { name: "Cambiar rol" }).click();
    await expect(adminCard.getByText("¿Cambiar de Administrador a Miembro?")).toBeVisible();
    await adminCard.getByRole("button", { name: "Confirmar cambio de rol" }).click();
    await expect.poll(async () => (await accessResult(memberPage)).role).toBe("Contributor");
    await memberPage.goto("/app");
    await expect(memberPage.getByRole("link", { name: "Organizaciones", exact: true })).toHaveCount(0);
    await expect(memberPage.getByRole("link", { name: "Usuarios", exact: true })).toHaveCount(0);

    for (const route of ["/app/organizations", `/app/organizations/${organizationAId}`, `/app/organizations/${organizationBId}`, `/app/users?email=${encodeURIComponent(memberEmail)}`]) {
      for (const width of [390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        expect(await horizontalOverflow(page), `${route} overflows at ${width}px`).toBeLessThanOrEqual(0);
      }
    }

    for (const route of ["/app/organizations", "/app/users", `/app/organizations/${organizationBId}`]) {
      await memberPage.goto(route);
      await expect(memberPage).toHaveURL(/\/access-denied$/);
    }
  } finally {
    await memberContext.close();
  }
});
