import "server-only";

import { requireAccess, type Role } from "@/lib/auth/access";
import { normalizeEmail } from "@/lib/auth/validation";
import { resolveOrCreateTrustedIdentity } from "@/lib/supabase/auth-admin";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const USER_PAGE_SIZE = 100;
const USER_PAGE_COUNT_LIMIT = 1000;

export type OrganizationSummary = {
  organizationId: string;
  name: string;
  isActive: boolean;
  approvedDomains: string[];
  memberCount: number;
};

export type OrganizationMember = {
  userId: string;
  email: string;
  role: Role;
  isActive: boolean;
};

export type ManagedUser = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: Role;
  isActive: boolean;
};

export type ManagedUserFilters = {
  email?: string;
  organizationId?: string;
  role?: Role;
  isActive?: boolean;
  page?: number;
};

export type ManagedUserPage = { users: ManagedUser[]; page: number; hasNextPage: boolean };

export type ProvisionedMembership = { userId: string; status: "created" | "already_provisioned" };

export class AdminManagementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminManagementError";
  }
}

function invalid(message = "Revisa los datos e inténtalo nuevamente."): never {
  throw new AdminManagementError(message);
}

function databaseUnavailable(): never {
  throw new AdminManagementError("No pudimos completar la operación. Actualiza la página e inténtalo nuevamente.");
}

function authorizationChanged(): never {
  throw new AdminManagementError("Tu permiso de administración cambió. Vuelve a ingresar antes de continuar.");
}

function requireUuid(value: unknown): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) invalid("Selecciona una opción válida.");
  return value;
}

function requireName(value: unknown): string {
  if (typeof value !== "string") invalid("Introduce el nombre de la organización.");
  const name = value.trim();
  if (!name || name.length > 200) invalid("El nombre debe tener entre 1 y 200 caracteres.");
  return name;
}

export function normalizeApprovedDomain(value: unknown): string {
  if (typeof value !== "string") invalid("Introduce un dominio de correo válido.");
  const domain = value.trim().toLowerCase();
  if (!domain || domain.length > 253 || !DOMAIN_PATTERN.test(domain)) invalid("Introduce un dominio de correo válido.");
  return domain;
}

function requireRole(value: unknown): Role {
  if (value !== "Contributor" && value !== "Admin") invalid("Selecciona un rol válido.");
  return value;
}

function databaseError(error: { code?: string; message?: string }, fallback: string): never {
  if (error.code === "42501" && error.message === "Auth identity is not trusted for membership") {
    throw new AdminManagementError("Esta identidad debe verificarse antes de cambiar su membresía o rol.");
  }
  if (error.code === "42501") authorizationChanged();
  if (error.code === "23505") throw new AdminManagementError("Ese dominio ya está aprobado para otra organización.");
  if (error.code === "23514") throw new AdminManagementError("El dominio actual del correo no está aprobado para esa organización.");
  if (error.code === "22023" && error.message === "organization name is unchanged") {
    throw new AdminManagementError("El nombre de la organización no presenta cambios.");
  }
  if (error.code === "22023") throw new AdminManagementError("Revisa los datos e inténtalo nuevamente.");
  throw new AdminManagementError(fallback);
}

async function adminClient() {
  await requireAccess("Admin");
  return createClient();
}

export async function listAdminOrganizations(): Promise<OrganizationSummary[]> {
  const supabase = await adminClient();
  const { data, error } = await supabase.rpc("list_admin_organizations");
  if (error || !data) databaseUnavailable();
  return data.map((organization) => ({
    organizationId: organization.organization_id,
    name: organization.organization_name,
    isActive: organization.is_active,
    approvedDomains: organization.approved_domains,
    memberCount: organization.member_count,
  }));
}

export async function listAdminOrganizationMembers(organizationId: unknown): Promise<OrganizationMember[]> {
  const supabase = await adminClient();
  const requestedOrganizationId = requireUuid(organizationId);
  const { data, error } = await supabase.rpc("list_admin_organization_members", {
    requested_organization_id: requestedOrganizationId,
  });
  if (error || !data) databaseUnavailable();
  return data.map((member) => ({
    userId: member.user_id,
    email: member.email,
    role: member.role,
    isActive: member.is_active,
  }));
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function searchEmail(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") invalid("Introduce un correo para buscar.");
  const email = value.trim().toLowerCase();
  if (email.length > 320) invalid("La búsqueda de correo es demasiado larga.");
  return email ? escapeLikePattern(email) : undefined;
}

export async function listAdminUsers(filters: ManagedUserFilters = {}): Promise<ManagedUserPage> {
  const supabase = await adminClient();
  const emailSearch = searchEmail(filters.email);
  const organizationFilter = filters.organizationId ? requireUuid(filters.organizationId) : null;
  const roleFilter = filters.role ? requireRole(filters.role) : null;
  if (filters.isActive !== undefined && typeof filters.isActive !== "boolean") invalid("Selecciona un estado válido.");
  const page = filters.page ?? 0;
  if (!Number.isInteger(page) || page < 0 || page >= USER_PAGE_COUNT_LIMIT) invalid("La página solicitada no es válida.");

  const { data, error } = await supabase.rpc("list_admin_memberships", {
    email_search: emailSearch ?? null,
    organization_filter: organizationFilter,
    role_filter: roleFilter,
    active_filter: filters.isActive ?? null,
    page_size: USER_PAGE_SIZE,
    page_offset: page * USER_PAGE_SIZE,
  });
  if (error || !data) databaseUnavailable();
  return {
    users: data.map((user) => ({
      userId: user.user_id,
      email: user.email,
      organizationId: user.organization_id,
      organizationName: user.organization_name,
      role: user.role,
      isActive: user.is_active,
    })),
    page,
    hasNextPage: data.length === USER_PAGE_SIZE,
  };
}

export async function createOrganization(rawName: unknown, rawDomains: unknown[]): Promise<string> {
  const supabase = await adminClient();
  const name = requireName(rawName);
  if (!Array.isArray(rawDomains) || rawDomains.length === 0) invalid("Agrega al menos un dominio aprobado.");
  const domains = rawDomains.map(normalizeApprovedDomain);
  if (new Set(domains).size !== domains.length) invalid("No repitas dominios después de normalizarlos.");

  const { data, error } = await supabase.rpc("admin_create_organization", {
    requested_name: name,
    requested_domains: domains,
  });
  if (error || !data) databaseError(error ?? {}, "No pudimos crear la organización.");
  return data;
}

export async function updateOrganizationName(organizationId: unknown, rawName: unknown): Promise<void> {
  const supabase = await adminClient();
  const requestedOrganizationId = requireUuid(organizationId);
  const requestedName = requireName(rawName);
  const { error } = await supabase.rpc("admin_update_organization_name", {
    requested_organization_id: requestedOrganizationId,
    requested_name: requestedName,
  });
  if (error) databaseError(error, "No pudimos actualizar el nombre de la organización.");
}

export async function setOrganizationActive(organizationId: unknown, isActive: unknown): Promise<void> {
  const supabase = await adminClient();
  const requestedOrganizationId = requireUuid(organizationId);
  if (typeof isActive !== "boolean") invalid("Selecciona un estado válido para la organización.");
  const { error } = await supabase.rpc("admin_set_organization_active", {
    requested_organization_id: requestedOrganizationId,
    requested_is_active: isActive,
  });
  if (error) databaseError(error, "No pudimos cambiar el estado de la organización.");
}

export async function addOrganizationDomain(organizationId: unknown, rawDomain: unknown): Promise<void> {
  const supabase = await adminClient();
  const requestedOrganizationId = requireUuid(organizationId);
  const requestedDomain = normalizeApprovedDomain(rawDomain);
  const { error } = await supabase.rpc("admin_add_organization_domain", {
    requested_organization_id: requestedOrganizationId,
    requested_domain: requestedDomain,
  });
  if (error) databaseError(error, "No pudimos agregar el dominio aprobado.");
}

export async function removeOrganizationDomain(rawDomain: unknown): Promise<void> {
  const supabase = await adminClient();
  const requestedDomain = normalizeApprovedDomain(rawDomain);
  const { error } = await supabase.rpc("admin_remove_organization_domain", { requested_domain: requestedDomain });
  if (error) databaseError(error, "No pudimos retirar el dominio aprobado.");
}

async function findMembershipByEmail(supabase: Awaited<ReturnType<typeof createClient>>, email: string) {
  const pageSize = 100;
  try {
    for (let page = 0; page < USER_PAGE_COUNT_LIMIT; page += 1) {
      const { data, error } = await supabase.rpc("list_admin_memberships", {
        email_search: escapeLikePattern(email),
        organization_filter: null,
        role_filter: null,
        active_filter: null,
        page_size: pageSize,
        page_offset: page * pageSize,
      });
      if (error || !data) return { status: "unavailable" as const };
      const existing = data.find((candidate) => candidate.email?.toLowerCase() === email);
      if (existing) return { status: "found" as const, member: existing };
      if (data.length < pageSize) return { status: "missing" as const };
    }
  } catch {
    return { status: "unavailable" as const };
  }
  return { status: "unavailable" as const };
}

function membershipMatches(
  membership: NonNullable<Extract<Awaited<ReturnType<typeof findMembershipByEmail>>, { status: "found" }>['member']>,
  userId: string,
  organizationId: string,
  role: Role,
): boolean {
  return membership.user_id === userId && membership.organization_id === organizationId
    && membership.role === role && membership.is_active;
}

function conflictingMembership(): never {
  throw new AdminManagementError("Este correo ya tiene una membresía. Usa la gestión de usuarios para cambiar su organización, rol o estado.");
}

function partialProvisioningFailure(): never {
  throw new AdminManagementError("La identidad de Auth existe, pero todavía no tiene acceso. Verifica el dominio aprobado y vuelve a intentarlo; se reutilizará la misma identidad.");
}

export async function provisionUser(
  rawEmail: unknown,
  organizationId: unknown,
  rawRole: unknown,
): Promise<ProvisionedMembership> {
  await requireAccess("Admin");
  const email = normalizeEmail(rawEmail);
  if (!email) invalid("Introduce un correo institucional válido.");
  const requestedOrganizationId = requireUuid(organizationId);
  const role = requireRole(rawRole);

  const supabase = await createClient();
  const { data: organizations, error: organizationError } = await supabase.rpc("list_admin_organizations");
  if (organizationError || !organizations) databaseUnavailable();
  const organization = organizations.find((item) => item.organization_id === requestedOrganizationId);
  if (!organization) invalid("Selecciona una organización válida.");
  if (!organization.is_active) invalid("Activa la organización antes de agregar miembros.");
  const emailDomain = email.slice(email.lastIndexOf("@") + 1);
  if (!organization.approved_domains.includes(emailDomain)) {
    throw new AdminManagementError("El dominio actual del correo no está aprobado para esa organización.");
  }

  const identity = await resolveOrCreateTrustedIdentity(email);
  if (identity.status === "invalid_email") invalid("Introduce un correo institucional válido.");
  if (identity.status === "untrusted_identity") {
    throw new AdminManagementError("Esta identidad ya existe, pero no se puede reutilizar hasta completar la verificación institucional o iniciar sesión con Google.");
  }
  if (identity.status !== "created" && identity.status !== "reused") databaseUnavailable();

  const existing = await findMembershipByEmail(supabase, email);
  if (existing.status === "unavailable") {
    if (identity.status === "created") partialProvisioningFailure();
    databaseUnavailable();
  }
  if (existing.status === "found") {
    if (membershipMatches(existing.member, identity.userId, requestedOrganizationId, role)) {
      return { userId: identity.userId, status: "already_provisioned" };
    }
    conflictingMembership();
  }

  let membershipError: { code?: string; message?: string } | null;
  try {
    const result = await supabase.rpc("admin_create_membership", {
      requested_user_id: identity.userId,
      requested_organization_id: requestedOrganizationId,
      requested_role: role,
      requested_is_active: true,
    });
    membershipError = result.error;
  } catch {
    if (identity.status === "created") partialProvisioningFailure();
    databaseUnavailable();
  }
  if (!membershipError) return { userId: identity.userId, status: "created" };

  if (membershipError.code === "23505") {
    const racedMembership = await findMembershipByEmail(supabase, email);
    if (racedMembership.status === "unavailable") {
      if (identity.status === "created") partialProvisioningFailure();
      databaseUnavailable();
    }
    if (racedMembership.status === "found") {
      if (membershipMatches(racedMembership.member, identity.userId, requestedOrganizationId, role)) {
        return { userId: identity.userId, status: "already_provisioned" };
      }
      conflictingMembership();
    }
  }

  if (identity.status === "created") partialProvisioningFailure();
  databaseError(membershipError, "No pudimos completar la membresía de este usuario.");
}

export async function reassignUserOrganization(userId: unknown, organizationId: unknown): Promise<void> {
  const supabase = await adminClient();
  const requestedUserId = requireUuid(userId);
  const requestedOrganizationId = requireUuid(organizationId);
  const { error } = await supabase.rpc("admin_reassign_membership", {
    requested_user_id: requestedUserId,
    requested_organization_id: requestedOrganizationId,
  });
  if (error) databaseError(error, "No pudimos cambiar la organización de este usuario.");
}

export async function setUserRole(userId: unknown, rawRole: unknown): Promise<void> {
  const supabase = await adminClient();
  const requestedUserId = requireUuid(userId);
  const role = requireRole(rawRole);
  const { error } = await supabase.rpc("admin_set_membership_role", {
    requested_user_id: requestedUserId,
    requested_role: role,
  });
  if (error) databaseError(error, "No pudimos cambiar el rol de este usuario.");
}

export async function setUserActive(userId: unknown, isActive: unknown): Promise<void> {
  const supabase = await adminClient();
  const requestedUserId = requireUuid(userId);
  if (typeof isActive !== "boolean") invalid("Selecciona un estado válido para el usuario.");
  const { error } = await supabase.rpc("admin_set_membership_active", {
    requested_user_id: requestedUserId,
    requested_is_active: isActive,
  });
  if (error) databaseError(error, "No pudimos cambiar el estado de este usuario.");
}
