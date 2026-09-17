import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, route } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  route: { pathname: "/app/library", search: "" },
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/app/login/actions", () => ({ signOut: vi.fn() }));
// The shell is a client component that reads the current route to mark the
// active destination and to scope the Library search; there is no router here.
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
  // The shell search navigates to a suggestion's canonical route when one is
  // chosen by keyboard; static rendering never reaches it.
  useRouter: () => ({ push: () => {} }),
}));
import ApplicationLayout from "@/app/app/layout";

async function shell(role: "Admin" | "Contributor", organizationName = "Red") {
  requireAccess.mockResolvedValue({ organizationName, role });
  return renderToStaticMarkup(await ApplicationLayout({ children: React.createElement("main") }));
}

/** Counts non-overlapping occurrences, for "rendered exactly once" assertions. */
function occurrences(html: string, needle: string) {
  return html.split(needle).length - 1;
}

describe("role-aware application navigation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    route.pathname = "/app/library";
    route.search = "";
  });

  it("shows content management only to Admins", async () => {
    const html = await shell("Admin");
    expect(html).toContain("Administrar contenido");
    expect(html).not.toContain("Mis contribuciones");
  });

  it("does not advertise authoring to non-Admin readers", async () => {
    const html = await shell("Contributor");
    expect(html).not.toContain("Administrar contenido");
    expect(html).not.toContain("contribuciones");
    expect(html).toContain("Biblioteca");
  });

  it("labels the persisted Contributor role without implying authoring authority", async () => {
    const html = await shell("Contributor");
    expect(html).toContain("Miembro");
    expect(html).not.toContain("Colaborador");
  });

  it("labels Admins as Administrador", async () => {
    expect(await shell("Admin")).toContain("Administrador");
  });

  it("describes the product as the shared network library", async () => {
    expect(await shell("Contributor")).toContain("Biblioteca curricular compartida de la red Democracia+.");
  });

  /*
   * The responsive shell renders an inline destination row and a compact
   * navigation sheet. Neither may become a second place where authorization is
   * decided, and the sheet must not serialise a destination the reader is not
   * entitled to just because it happens to be closed.
   */
  it("keeps the Admin destination out of reader markup at every responsive width", async () => {
    const html = await shell("Contributor");
    expect(html).not.toContain("/app/contributions");
    // Not merely hidden: absent.
    expect(html).not.toMatch(/Administrar contenido/);
  });

  it("serialises the Admin destination exactly once for an Admin", async () => {
    // The closed navigation sheet renders no destinations, so an Admin sees the
    // inline row only. A second copy would duplicate the link's accessible name.
    expect(occurrences(await shell("Admin"), 'href="/app/contributions"')).toBe(1);
  });

  it("renders exactly one sign-out control", async () => {
    expect(occurrences(await shell("Admin"), "Cerrar sesión")).toBe(1);
    expect(occurrences(await shell("Contributor"), "Cerrar sesión")).toBe(1);
  });

  it("renders exactly one Library destination", async () => {
    expect(occurrences(await shell("Contributor"), 'href="/app/library"')).toBe(1);
  });

  it("presents organisation and role together rather than as an authority signal", async () => {
    const html = await shell("Admin", "Red de prueba");
    expect(html).toContain("Red de prueba");
    // The role is a bare text node beside the organisation, never its own
    // element: /app already owns the single exact-text role presentation.
    expect(html).not.toContain(">Administrador<");
  });

  it("marks the current destination for assistive technology", async () => {
    route.pathname = "/app/library";
    expect(await shell("Contributor")).toContain('aria-current="page"');
  });

  it("keeps the brand and a route back to the application home", async () => {
    const html = await shell("Contributor");
    expect(html).toContain("Base Curricular");
    expect(html).toContain('href="/app"');
  });
});
