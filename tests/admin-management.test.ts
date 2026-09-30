import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, resolveOrCreateTrustedIdentity } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  rpc: vi.fn(),
  resolveOrCreateTrustedIdentity: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));
vi.mock("@/lib/supabase/auth-admin", () => ({ resolveOrCreateTrustedIdentity }));

import {
  addOrganizationDomain,
  createOrganization,
  listAdminOrganizationMembers,
  listAdminOrganizations,
  listAdminUsers,
  provisionUser,
  reassignUserOrganization,
  removeOrganizationDomain,
  setUserActive,
  setUserRole,
} from "@/lib/admin-management";
import { mapManagementSummaries } from "@/lib/contributions/queries";

const orgId = "91000000-0000-4000-8000-000000000001";
const userId = "92000000-0000-4000-8000-000000000001";

const organization = {
  organization_id: orgId,
  organization_name: "Organización",
  is_active: true,
  approved_domains: ["partner.test"],
  member_count: 2,
};

const member = {
  user_id: userId,
  email: "member@partner.test",
  organization_id: orgId,
  organization_name: "Organización",
  role: "Contributor" as const,
  is_active: true,
};

describe("Admin management list mapping", () => {
  const identities = [
    { id: "new", current_published_revision_id: null },
    { id: "stable", current_published_revision_id: "published-1" },
    { id: "revising", current_published_revision_id: "published-2" },
  ];
  const revisions = [
    { id: "draft-1", contentId: "new", title: "Nuevo", status: "Draft", revisionNumber: 1, createdAt: "2026-09-14T03:00:00Z", publishedAt: null },
    { id: "published-1", contentId: "stable", title: "Vigente", status: "Published", revisionNumber: 1, createdAt: "2026-09-14T01:00:00Z", publishedAt: "2026-09-14T02:00:00Z" },
    { id: "published-2", contentId: "revising", title: "Versión uno", status: "Published", revisionNumber: 1, createdAt: "2026-09-14T01:00:00Z", publishedAt: "2026-09-14T02:00:00Z" },
    { id: "draft-2", contentId: "revising", title: "Versión dos", status: "Draft", revisionNumber: 2, createdAt: "2026-09-14T04:00:00Z", publishedAt: null },
  ];

  it("distinguishes new Drafts, Published content, and Published content with a successor", () => {
    expect(mapManagementSummaries("module", identities, revisions)).toEqual([
      expect.objectContaining({ contentId: "new", state: "draft", draftRevisionNumber: 1 }),
      expect.objectContaining({ contentId: "stable", state: "published", currentPublishedRevisionNumber: 1 }),
      expect.objectContaining({ contentId: "revising", title: "Versión dos", state: "published_with_draft", draftRevisionNumber: 2 }),
    ]);
  });
});

beforeEach(() => {
  vi.resetAllMocks();
  requireAccess.mockResolvedValue({ userId, organizationId: orgId, organizationName: "Organización", role: "Admin" });
  rpc.mockImplementation(async (name: string) => {
    if (name === "list_admin_organizations") return { data: [organization], error: null };
    if (name === "list_admin_memberships" || name === "list_admin_organization_members") return { data: [], error: null };
    if (name === "admin_create_organization") return { data: orgId, error: null };
    return { data: undefined, error: null };
  });
  resolveOrCreateTrustedIdentity.mockResolvedValue({ status: "created", userId });
});

afterEach(() => vi.unstubAllEnvs());

it("rechecks live Admin authority before bounded global reads", async () => {
  await expect(listAdminOrganizations()).resolves.toEqual([{
    organizationId: orgId,
    name: "Organización",
    isActive: true,
    approvedDomains: ["partner.test"],
    memberCount: 2,
  }]);
  expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
  expect(rpc).toHaveBeenCalledExactlyOnceWith("list_admin_organizations");
});

it("denies direct management calls when live access no longer resolves to Admin", async () => {
  requireAccess.mockRejectedValue(new Error("redirect:/access-denied"));

  await expect(setUserRole(userId, "Admin")).rejects.toThrow("redirect:/access-denied");
  expect(rpc).not.toHaveBeenCalled();
  expect(resolveOrCreateTrustedIdentity).not.toHaveBeenCalled();
});

it("rejects malformed organization identifiers and roles before invoking mutation RPCs", async () => {
  await expect(listAdminOrganizationMembers("attacker-id")).rejects.toThrow("Selecciona una opción válida.");
  await expect(setUserRole(userId, "Owner")).rejects.toThrow("Selecciona un rol válido.");
  await expect(setUserActive(userId, "yes")).rejects.toThrow("Selecciona un estado válido para el usuario.");
  expect(rpc).not.toHaveBeenCalled();
});

it("normalizes organization names/domains and prevents duplicate normalized domains", async () => {
  await expect(createOrganization("  Nueva organización ", [" PARTNER.TEST ", "segundo.test "]))
    .resolves.toBe(orgId);
  expect(rpc).toHaveBeenCalledExactlyOnceWith("admin_create_organization", {
    requested_name: "Nueva organización",
    requested_domains: ["partner.test", "segundo.test"],
  });

  rpc.mockClear();
  await expect(createOrganization("Organización", ["DUP.test", " dup.test "]))
    .rejects.toThrow("No repitas dominios después de normalizarlos.");
  expect(rpc).not.toHaveBeenCalled();
});

it("maps global domain conflicts to safe Spanish copy", async () => {
  rpc.mockResolvedValueOnce({ data: null, error: { code: "23505", message: "duplicate key value in organization_domains_pkey" } });

  await expect(addOrganizationDomain(orgId, "OTHER.TEST")).rejects.toThrow("Ese dominio ya está aprobado para otra organización.");
  await expect(removeOrganizationDomain("NOT-A-DOMAIN")).rejects.toThrow("Introduce un dominio de correo válido.");
});

it("searches by literal email text with canonical role, organization, and status filters", async () => {
  rpc.mockResolvedValueOnce({ data: [member], error: null });

  await expect(listAdminUsers({ email: "Member_%@Partner.TEST", organizationId: orgId, role: "Contributor", isActive: true, page: 2 }))
    .resolves.toEqual({
      users: [{ userId, email: member.email, organizationId: orgId, organizationName: "Organización", role: "Contributor", isActive: true }],
      page: 2,
      hasNextPage: false,
    });
  expect(rpc).toHaveBeenCalledExactlyOnceWith("list_admin_memberships", {
    email_search: "member\\_\\%@partner.test",
    organization_filter: orgId,
    role_filter: "Contributor",
    active_filter: true,
    page_size: 100,
    page_offset: 200,
  });
});

it("rejects invalid role filters instead of passing arbitrary persistence roles", async () => {
  await expect(listAdminUsers({ role: "User" as never })).rejects.toThrow("Selecciona un rol válido.");
  expect(rpc).not.toHaveBeenCalled();
});

it("rejects domain-incompatible or inactive organization provisioning before touching Auth", async () => {
  await expect(provisionUser("person@unapproved.test", orgId, "Contributor"))
    .rejects.toThrow("El dominio actual del correo no está aprobado para esa organización.");
  expect(resolveOrCreateTrustedIdentity).not.toHaveBeenCalled();

  rpc.mockResolvedValueOnce({ data: [{ ...organization, is_active: false }], error: null });
  await expect(provisionUser("person@partner.test", orgId, "Contributor"))
    .rejects.toThrow("Activa la organización antes de agregar miembros.");
  expect(resolveOrCreateTrustedIdentity).not.toHaveBeenCalled();
});

it("rejects invalid roles before resolving or creating an Auth identity", async () => {
  await expect(provisionUser("person@partner.test", orgId, "SuperAdmin"))
    .rejects.toThrow("Selecciona un rol válido.");
  expect(resolveOrCreateTrustedIdentity).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});

it("creates membership only through the authoritative RPC using the trusted Auth ID", async () => {
  const result = await provisionUser("  PERSON@PARTNER.TEST ", orgId, "Admin");

  expect(result).toEqual({ userId, status: "created" });
  expect(resolveOrCreateTrustedIdentity).toHaveBeenCalledExactlyOnceWith("person@partner.test");
  expect(rpc).toHaveBeenCalledWith("admin_create_membership", {
    requested_user_id: userId,
    requested_organization_id: orgId,
    requested_role: "Admin",
    requested_is_active: true,
  });
  expect(rpc.mock.calls.flat()).not.toContain("created_by");
});

it("rejects untrusted Auth identities without attempting membership creation", async () => {
  resolveOrCreateTrustedIdentity.mockResolvedValueOnce({ status: "untrusted_identity" });

  await expect(provisionUser("person@partner.test", orgId, "Contributor"))
    .rejects.toThrow("Esta identidad ya existe, pero no se puede reutilizar hasta completar la verificación institucional o iniciar sesión con Google.");
  expect(rpc).not.toHaveBeenCalledWith("admin_create_membership", expect.anything());
});

it("does not overwrite a conflicting existing membership and treats exact retries as idempotent", async () => {
  resolveOrCreateTrustedIdentity.mockResolvedValue({ status: "reused", userId });
  rpc.mockImplementation(async (name: string) => {
    if (name === "list_admin_organizations") return { data: [organization], error: null };
    if (name === "list_admin_memberships") return { data: [{ ...member, email: "person@partner.test" }], error: null };
    return { data: undefined, error: null };
  });

  await expect(provisionUser("person@partner.test", orgId, "Contributor"))
    .resolves.toEqual({ userId, status: "already_provisioned" });
  expect(rpc).not.toHaveBeenCalledWith("admin_create_membership", expect.anything());

  await expect(provisionUser("person@partner.test", orgId, "Admin"))
    .rejects.toThrow("Este correo ya tiene una membresía. Usa la gestión de usuarios para cambiar su organización, rol o estado.");
  expect(rpc).not.toHaveBeenCalledWith("admin_create_membership", expect.anything());
});

it("fails closed and gives a recoverable state when Auth succeeds but membership fails", async () => {
  rpc.mockImplementation(async (name: string) => {
    if (name === "list_admin_organizations") return { data: [organization], error: null };
    if (name === "list_admin_memberships") return { data: [], error: null };
    if (name === "admin_create_membership") return { data: null, error: { code: "XX000", message: "raw database details" } };
    return { data: undefined, error: null };
  });

  await expect(provisionUser("person@partner.test", orgId, "Contributor"))
    .rejects.toThrow("La identidad de Auth existe, pero todavía no tiene acceso. Verifica el dominio aprobado y vuelve a intentarlo; se reutilizará la misma identidad.");
  expect(rpc).toHaveBeenCalledTimes(3);
  expect(rpc.mock.calls.flat()).not.toContain("raw database details");
});

it("keeps Auth-created identities fail-closed when the membership RPC throws", async () => {
  rpc.mockImplementation(async (name: string) => {
    if (name === "list_admin_organizations") return { data: [organization], error: null };
    if (name === "list_admin_memberships") return { data: [], error: null };
    if (name === "admin_create_membership") throw new Error("network failure with private detail");
    return { data: undefined, error: null };
  });

  await expect(provisionUser("person@partner.test", orgId, "Contributor"))
    .rejects.toThrow("La identidad de Auth existe, pero todavía no tiene acceso. Verifica el dominio aprobado y vuelve a intentarlo; se reutilizará la misma identidad.");
});

it("reconciles a concurrent successful membership create without a duplicate", async () => {
  rpc.mockImplementationOnce(async () => ({ data: [organization], error: null }))
    .mockImplementationOnce(async () => ({ data: [], error: null }))
    .mockImplementationOnce(async () => ({ data: null, error: { code: "23505", message: "duplicate membership" } }))
    .mockImplementationOnce(async () => ({ data: [{ ...member, email: "person@partner.test" }], error: null }));

  await expect(provisionUser("person@partner.test", orgId, "Contributor"))
    .resolves.toEqual({ userId, status: "already_provisioned" });
});

it("keeps identity email read-only and routes role, organization, and status changes to distinct RPCs", async () => {
  await setUserRole(userId, "Admin");
  await reassignUserOrganization(userId, "91000000-0000-4000-8000-000000000002");
  await setUserActive(userId, false);

  expect(rpc).toHaveBeenNthCalledWith(1, "admin_set_membership_role", { requested_user_id: userId, requested_role: "Admin" });
  expect(rpc).toHaveBeenNthCalledWith(2, "admin_reassign_membership", {
    requested_user_id: userId,
    requested_organization_id: "91000000-0000-4000-8000-000000000002",
  });
  expect(rpc).toHaveBeenNthCalledWith(3, "admin_set_membership_active", { requested_user_id: userId, requested_is_active: false });
  expect(rpc.mock.calls.flat()).not.toContain("email");

  rpc.mockResolvedValueOnce({ data: null, error: { code: "42501", message: "Auth identity is not trusted for membership" } });
  await expect(setUserRole(userId, "Contributor")).rejects.toThrow("Esta identidad debe verificarse antes de cambiar su membresía o rol.");
});
