import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";

const { listAdminOrganizations, listAdminOrganizationMembers, listAdminUsers } = vi.hoisted(() => ({
  listAdminOrganizations: vi.fn(),
  listAdminOrganizationMembers: vi.fn(),
  listAdminUsers: vi.fn(),
}));

vi.mock("@/lib/admin-management", () => ({ listAdminOrganizations, listAdminOrganizationMembers, listAdminUsers }));
vi.mock("@/app/app/organizations/management-forms", () => ({
  CreateOrganizationForm: () => React.createElement("div", { "data-testid": "create-organization-form" }),
  OrganizationNameForm: () => React.createElement("div", { "data-testid": "organization-name-form" }),
  AddOrganizationDomainForm: () => React.createElement("div", { "data-testid": "add-domain-form" }),
  RemoveOrganizationDomainAction: ({ domain }: { domain: string }) => React.createElement("button", { type: "button" }, `Retirar ${domain}`),
  OrganizationStatusAction: () => React.createElement("div", { "data-testid": "organization-status-action" }),
}));
vi.mock("@/app/app/users/user-management", () => ({
  ProvisionUserForm: () => React.createElement("div", { "data-testid": "provision-user-form" }),
  UserManagementCard: ({ user }: { user: { email: string } }) => React.createElement("article", null,
    React.createElement("p", null, "Correo de acceso · no editable"),
    user.email,
  ),
}));

import OrganizationsPage from "@/app/app/organizations/page";
import OrganizationDetailPage from "@/app/app/organizations/[organizationId]/page";
import UsersPage from "@/app/app/users/page";

const organization = {
  organizationId: "91000000-0000-4000-8000-000000000001",
  name: "Organización Roja",
  isActive: true,
  approvedDomains: ["red.test", "second.red.test"],
  memberCount: 4,
};

const user = {
  userId: "92000000-0000-4000-8000-000000000001",
  email: "member@red.test",
  organizationId: organization.organizationId,
  organizationName: organization.name,
  role: "Contributor" as const,
  isActive: false,
};

beforeEach(() => {
  vi.resetAllMocks();
  listAdminOrganizations.mockResolvedValue([organization, { ...organization, organizationId: "91000000-0000-4000-8000-000000000002", name: "Organización Azul", approvedDomains: ["blue.test"] }]);
  listAdminOrganizationMembers.mockResolvedValue([{ userId: user.userId, email: user.email, role: user.role, isActive: user.isActive }]);
  listAdminUsers.mockResolvedValue({ users: [user], page: 2, hasNextPage: true });
});

it("searches and summarizes organizations from canonical records", async () => {
  const html = renderToStaticMarkup(await OrganizationsPage({ searchParams: Promise.resolve({ q: "roja" }) }));

  expect(html).toContain("Organización Roja");
  expect(html).not.toContain("Organización Azul");
  expect(html).toContain("red.test");
  expect(html).toContain("4 miembros");
  expect(html).toContain("Activa");
  expect(listAdminOrganizations).toHaveBeenCalledExactlyOnceWith();
});

it("shows approved domains and the associated users on the organization detail", async () => {
  const html = renderToStaticMarkup(await OrganizationDetailPage({
    params: Promise.resolve({ organizationId: organization.organizationId }),
    searchParams: Promise.resolve({}),
  }));

  expect(html).toContain("second.red.test");
  expect(html).toContain("member@red.test");
  expect(html).toContain("Miembro");
  expect(html).toContain("Inactivo");
  expect(listAdminOrganizationMembers).toHaveBeenCalledExactlyOnceWith(organization.organizationId);
});

it("parses user search/filter query parameters and keeps email read-only in the member list", async () => {
  const html = renderToStaticMarkup(await UsersPage({ searchParams: Promise.resolve({
    email: "member@red.test",
    organization: organization.organizationId,
    role: "Admin",
    status: "inactive",
    page: "3",
  }) }));

  expect(listAdminUsers).toHaveBeenCalledExactlyOnceWith({
    email: "member@red.test",
    organizationId: organization.organizationId,
    role: "Admin",
    isActive: false,
    page: 2,
  });
  expect(html).toContain("member@red.test");
  expect(html).toContain("Correo de acceso · no editable");
  const userCard = html.match(/<article>[\s\S]*?<\/article>/)?.[0] ?? "";
  expect(userCard).toContain("member@red.test");
  expect(userCard).not.toContain('name="email"');
  expect(html).toContain("Página siguiente");
});
