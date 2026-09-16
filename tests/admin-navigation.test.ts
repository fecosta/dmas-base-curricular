import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess } = vi.hoisted(() => ({ requireAccess: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/app/login/actions", () => ({ signOut: vi.fn() }));
// The navigation is a client component that reads the current path to mark the
// active item; there is no router in this environment.
vi.mock("next/navigation", () => ({ usePathname: () => "/app/library" }));
import ApplicationLayout from "@/app/app/layout";

describe("role-aware application navigation", () => {
  beforeEach(() => vi.resetAllMocks());

  it("shows content management only to Admins", async () => {
    requireAccess.mockResolvedValue({ organizationName: "Red", role: "Admin" });
    const html = renderToStaticMarkup(await ApplicationLayout({ children: React.createElement("main") }));
    expect(html).toContain("Administrar contenido");
    expect(html).not.toContain("Mis contribuciones");
  });

  it("does not advertise authoring to non-Admin readers", async () => {
    requireAccess.mockResolvedValue({ organizationName: "Red", role: "Contributor" });
    const html = renderToStaticMarkup(await ApplicationLayout({ children: React.createElement("main") }));
    expect(html).not.toContain("Administrar contenido");
    expect(html).not.toContain("contribuciones");
    expect(html).toContain("Biblioteca");
  });

  it("labels the persisted Contributor role without implying authoring authority", async () => {
    requireAccess.mockResolvedValue({ organizationName: "Red", role: "Contributor" });
    const html = renderToStaticMarkup(await ApplicationLayout({ children: React.createElement("main") }));
    expect(html).toContain("Miembro");
    expect(html).not.toContain("Colaborador");
  });

  it("labels Admins as Administrador", async () => {
    requireAccess.mockResolvedValue({ organizationName: "Red", role: "Admin" });
    const html = renderToStaticMarkup(await ApplicationLayout({ children: React.createElement("main") }));
    expect(html).toContain("Administrador");
  });

  it("describes the product as the shared network library", async () => {
    requireAccess.mockResolvedValue({ organizationName: "Red", role: "Contributor" });
    const html = renderToStaticMarkup(await ApplicationLayout({ children: React.createElement("main") }));
    expect(html).toContain("Biblioteca curricular compartida de la red Democracia+.");
  });
});
