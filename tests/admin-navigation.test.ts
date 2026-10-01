import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, getAnalyticsPreference, route } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  getAnalyticsPreference: vi.fn(),
  route: { pathname: "/app/library", search: "" },
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
// The shell renders the privacy surfaces from the persisted preference row;
// there is no database here.
vi.mock("@/lib/privacy/analytics-preference", () => ({ getAnalyticsPreference }));
vi.mock("@/app/login/actions", () => ({ signOut: vi.fn() }));
vi.mock("@/app/app/privacidad/actions", () => ({
  acceptAnalyticsAction: vi.fn(),
  rejectAnalyticsAction: vi.fn(),
}));
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

const resolved = (decision: "undecided" | "rejected" | "accepted") => ({
  status: "resolved" as const,
  preference: {
    decision,
    analyticsEnabled: decision === "accepted",
    decidedAt: decision === "undecided" ? null : "2026-10-01T10:00:00Z",
    privacyNoticeVersion: decision === "undecided" ? null : "1.1",
    consentVersion: decision === "undecided" ? null : "1.1",
  },
});

async function shell(
  role: "Admin" | "Contributor",
  organizationName = "Red",
  preference: ReturnType<typeof resolved> | { status: "unavailable" } = resolved("rejected"),
) {
  requireAccess.mockResolvedValue({ organizationName, role });
  getAnalyticsPreference.mockResolvedValue(preference);
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
    getAnalyticsPreference.mockResolvedValue(resolved("rejected"));
  });

  it("shows content management only to Admins", async () => {
    const html = await shell("Admin");
    expect(html).toContain("Administrar contenido");
    expect(html).toContain("Organizaciones");
    expect(html).toContain("Usuarios");
    expect(html).not.toContain("Mis contribuciones");
  });

  it("does not advertise authoring to non-Admin readers", async () => {
    const html = await shell("Contributor");
    expect(html).not.toContain("Administrar contenido");
    expect(html).not.toContain("Organizaciones");
    expect(html).not.toContain("Usuarios");
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
    expect(html).not.toContain("/app/organizations");
    expect(html).not.toContain("/app/users");
    // Not merely hidden: absent.
    expect(html).not.toMatch(/Administrar contenido/);
  });

  it("serialises the Admin destination exactly once for an Admin", async () => {
    // The closed navigation sheet renders no destinations, so an Admin sees the
    // inline row only. A second copy would duplicate the link's accessible name.
    expect(occurrences(await shell("Admin"), 'href="/app/contributions"')).toBe(1);
    expect(occurrences(await shell("Admin"), 'href="/app/organizations"')).toBe(1);
    expect(occurrences(await shell("Admin"), 'href="/app/users"')).toBe(1);
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

/*
 * The privacy surfaces belong to the authenticated session, so the shell is
 * where they are reachable. Admin status changes nothing about them: the
 * analytics preference is owned by the user, not granted by a role.
 */
describe("privacy surfaces in the application shell", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    route.pathname = "/app/library";
    route.search = "";
    getAnalyticsPreference.mockResolvedValue(resolved("rejected"));
  });

  it("offers Preferencias de datos to a non-Admin reader", async () => {
    expect(await shell("Contributor")).toContain("Preferencias de datos");
  });

  it("offers Preferencias de datos to an Admin on the same terms", async () => {
    expect(await shell("Admin")).toContain("Preferencias de datos");
  });

  it("renders exactly one Preferencias de datos trigger and one dialog", async () => {
    const html = await shell("Contributor");
    // The closed navigation sheet renders no contents, so the inline control is
    // the only trigger and the accessible name is not duplicated. The dialog's
    // own heading is the remaining occurrence; the shell owns a single dialog
    // rather than one per surface that can open it.
    expect(occurrences(html, "Preferencias de datos</button>")).toBe(1);
    expect(occurrences(html, "Preferencias de datos</h2>")).toBe(1);
  });

  it("links the authoritative Privacy Notice and Terms from every authenticated surface", async () => {
    const html = await shell("Contributor");
    expect(html).toContain('href="/app/privacidad/aviso"');
    expect(html).toContain('href="/app/privacidad/terminos"');
    expect(html).toContain("Aviso de Privacidad");
    expect(html).toContain("Términos de Uso");
  });

  it("presents the first privacy choice to a user with no recorded decision", async () => {
    const html = await shell("Contributor", "Red", resolved("undecided"));
    expect(html).toContain("Ayúdanos a mejorar Base Curricular");
    expect(html).toContain("Rechazar analítica");
    expect(html).toContain("Configurar");
    expect(html).toContain("Aceptar");
  });

  /* Rejection is a recorded decision; re-prompting it would be pressure. */
  it("does not re-prompt a user who rejected analytics", async () => {
    const html = await shell("Contributor", "Red", resolved("rejected"));
    expect(html).not.toContain("Ayúdanos a mejorar Base Curricular");
    expect(html).not.toContain("Rechazar analítica");
  });

  it("does not prompt a user who already accepted analytics", async () => {
    expect(await shell("Contributor", "Red", resolved("accepted")))
      .not.toContain("Ayúdanos a mejorar Base Curricular");
  });

  /*
   * A failed preference read is not a decision. It must leave analytics OFF,
   * and it must not present a consent prompt whose outcome would be recorded
   * against an unreadable row.
   */
  it("treats an unreadable preference as analytics off without prompting", async () => {
    const html = await shell("Contributor", "Red", { status: "unavailable" });
    expect(html).not.toContain("Ayúdanos a mejorar Base Curricular");
    expect(html).toContain("Preferencias de datos");
  });

  /*
   * Session Replay is disabled and must not be presented as a preference.
   * Asserted against the rendered body only: React appends its own
   * form-replay bootstrap script, which is framework plumbing and not product
   * copy about session recording.
   */
  it("does not present Session Replay as a preference", async () => {
    const body = (await shell("Contributor", "Red", resolved("undecided"))).split("<script>")[0].toLowerCase();
    expect(body).not.toContain("session replay");
    expect(body).not.toContain("repetición de sesión");
    expect(body).not.toContain("grabación de sesion");
    expect(body).not.toContain("grabación de sesión");
  });
});
