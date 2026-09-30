import { afterEach, beforeEach, expect, it, vi } from "vitest";

const {
  requireAccess,
  revalidatePath,
  createOrganization,
  setOrganizationActive,
  provisionUser,
  setUserRole,
} = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  revalidatePath: vi.fn(),
  createOrganization: vi.fn(),
  setOrganizationActive: vi.fn(),
  provisionUser: vi.fn(),
  setUserRole: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/admin-management", () => ({
  AdminManagementError: class AdminManagementError extends Error {},
  createOrganization,
  updateOrganizationName: vi.fn(),
  addOrganizationDomain: vi.fn(),
  removeOrganizationDomain: vi.fn(),
  setOrganizationActive,
  provisionUser,
  reassignUserOrganization: vi.fn(),
  setUserActive: vi.fn(),
  setUserRole,
}));

import { createOrganizationAction, setOrganizationActiveAction } from "@/app/app/organizations/actions";
import { provisionUserAction, setUserRoleAction } from "@/app/app/users/actions";
import { AdminManagementError } from "@/lib/admin-management";

beforeEach(() => {
  vi.resetAllMocks();
  requireAccess.mockResolvedValue({ role: "Admin" });
  createOrganization.mockResolvedValue("organization-id");
  provisionUser.mockResolvedValue({ userId: "user-id", status: "created" });
});

afterEach(() => vi.unstubAllEnvs());

it("rechecks live Admin access and revalidates organization and user surfaces after create", async () => {
  const form = new FormData();
  form.set("name", "Organización nueva");
  form.set("domains", "partner.test\n segundo.test \n");

  await expect(createOrganizationAction({}, form)).resolves.toEqual({ success: "Organización creada." });

  expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
  expect(createOrganization).toHaveBeenCalledExactlyOnceWith("Organización nueva", ["partner.test", "segundo.test"]);
  expect(revalidatePath).toHaveBeenCalledWith("/app/organizations");
  expect(revalidatePath).toHaveBeenCalledWith("/app/users");
});

it("does not catch authorization redirects or invoke a mutation as a Contributor", async () => {
  requireAccess.mockRejectedValue(new Error("redirect:/access-denied"));
  const form = new FormData();
  form.set("organization_id", "organization-id");
  form.set("is_active", "false");

  await expect(setOrganizationActiveAction({}, form)).rejects.toThrow("redirect:/access-denied");
  expect(setOrganizationActive).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("keeps user provisioning action inputs limited to email, organization, and canonical role", async () => {
  const form = new FormData();
  form.set("email", "person@partner.test");
  form.set("organization_id", "organization-id");
  form.set("role", "Contributor");
  form.set("user_id", "attacker-user");
  form.set("created_by", "attacker");

  await expect(provisionUserAction({}, form)).resolves.toEqual({ success: "Usuario agregado." });

  expect(provisionUser).toHaveBeenCalledExactlyOnceWith("person@partner.test", "organization-id", "Contributor");
  expect(revalidatePath).toHaveBeenCalledWith("/app/users");
  expect(revalidatePath).toHaveBeenCalledWith("/app/organizations");
});

it("uses separate identity-free role action payloads", async () => {
  const form = new FormData();
  form.set("user_id", "trusted-user");
  form.set("role", "Admin");
  form.set("email", "forged@partner.test");

  await setUserRoleAction({}, form);

  expect(setUserRole).toHaveBeenCalledExactlyOnceWith("trusted-user", "Admin");
});

it("rejects a direct user-role action after live Admin revocation", async () => {
  requireAccess.mockRejectedValue(new Error("redirect:/access-denied"));
  const form = new FormData();
  form.set("user_id", "trusted-user");
  form.set("role", "Admin");

  await expect(setUserRoleAction({}, form)).rejects.toThrow("redirect:/access-denied");
  expect(setUserRole).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});

it("returns the recoverable Auth-created/no-membership message without revalidation", async () => {
  provisionUser.mockRejectedValue(new AdminManagementError(
    "La identidad de Auth existe, pero todavía no tiene acceso. Verifica el dominio aprobado y vuelve a intentarlo; se reutilizará la misma identidad.",
  ));
  const form = new FormData();
  form.set("email", "person@partner.test");
  form.set("organization_id", "organization-id");
  form.set("role", "Contributor");

  await expect(provisionUserAction({}, form)).resolves.toEqual({
    error: "La identidad de Auth existe, pero todavía no tiene acceso. Verifica el dominio aprobado y vuelve a intentarlo; se reutilizará la misma identidad.",
  });
  expect(revalidatePath).not.toHaveBeenCalled();
});
