import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, listLifecycleHistory } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  listLifecycleHistory: vi.fn(),
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/contributions/queries", () => ({ listLifecycleHistory }));
import GovernanceHistoryPage from "@/app/app/contributions/history/page";
import type { LifecycleEvent } from "@/lib/contributions/types";

const contentId = "40000000-0000-4000-8000-000000000001";

function event(overrides: Partial<LifecycleEvent> = {}): LifecycleEvent {
  return {
    eventId: 12,
    type: "material",
    contentId,
    revisionId: "41000000-0000-4000-8000-000000000001",
    actorUserId: "50000000-0000-4000-8000-000000000001",
    actorOrganizationId: "60000000-0000-4000-8000-000000000001",
    actorOrganizationName: "Red de formación",
    action: "content_published",
    previousStatus: "Draft",
    resultingStatus: "Published",
    occurredAt: "2026-09-16T10:00:00Z",
    ...overrides,
  };
}

async function render(query: Record<string, string> = {}) {
  return renderToStaticMarkup(await GovernanceHistoryPage({ searchParams: Promise.resolve(query) }));
}

describe("Admin governance history", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ role: "Admin" });
    listLifecycleHistory.mockResolvedValue({ events: [], nextCursor: null });
  });

  it("requires live Admin authority before rendering anything", async () => {
    await render();
    expect(requireAccess).toHaveBeenCalledWith("Admin");
  });

  it("redirects a non-Admin instead of rendering history", async () => {
    requireAccess.mockRejectedValue(new Error("redirect:/access-denied"));
    await expect(render()).rejects.toThrow("redirect:/access-denied");
    expect(listLifecycleHistory).not.toHaveBeenCalled();
  });

  it("renders a revision transition for a revision event", async () => {
    listLifecycleHistory.mockResolvedValue({ events: [event()], nextCursor: null });
    const html = await render();
    expect(html).toContain("Contenido publicado");
    expect(html).toContain("Cambio de versión");
    expect(html).toContain("Borrador → Publicado");
    expect(html).toContain("Versión</dt>");
  });

  it("renders archive and restore as identity events with no invented transition", async () => {
    listLifecycleHistory.mockResolvedValue({
      events: [
        event({ eventId: 14, action: "content_archived", previousStatus: null, resultingStatus: null }),
        event({ eventId: 13, action: "content_restored", previousStatus: null, resultingStatus: null }),
      ],
      nextCursor: null,
    });
    const html = await render();
    expect(html).toContain("Contenido archivado");
    expect(html).toContain("Contenido restaurado");
    expect(html).toContain("Identidad");
    expect(html).not.toContain("Cambio de versión");
    expect(html).not.toContain("Publicado → Archivado");
    expect(html).not.toContain("Archivado</dd>");
    // The referenced revision is still shown as context, labelled as such.
    expect(html).toContain("Versión vigente al momento");
  });

  it("distinguishes identity events from revision events visibly", async () => {
    listLifecycleHistory.mockResolvedValue({
      events: [event({ eventId: 14, action: "content_archived", previousStatus: null, resultingStatus: null }), event()],
      nextCursor: null,
    });
    const html = await render();
    expect(html).toContain(">Identidad<");
    expect(html).toContain(">Versión<");
  });

  it("attributes the actor organization by name, without email or auth metadata", async () => {
    listLifecycleHistory.mockResolvedValue({ events: [event()], nextCursor: null });
    const html = await render();
    expect(html).toContain("Organización");
    expect(html).toContain("Red de formación");
    expect(html).not.toMatch(/@|email|auth\./i);
  });

  it("falls back to the organization id when no name resolves", async () => {
    listLifecycleHistory.mockResolvedValue({ events: [event({ actorOrganizationName: null })], nextCursor: null });
    expect(await render()).toContain("000000000001");
  });

  it("scopes history to one identity through query parameters", async () => {
    await render({ type: "material", content: contentId });
    expect(listLifecycleHistory).toHaveBeenCalledWith(expect.objectContaining({ type: "material", contentId }));
  });

  it("keeps the identity filter while the type or action filter is changed", async () => {
    const html = await render({ type: "material", content: contentId });
    expect(html).toContain(`<input type="hidden" name="content" value="${contentId}"/>`);
    expect(html).toContain("Ver todo el historial");
  });

  it("paginates with the event cursor and preserves filters", async () => {
    listLifecycleHistory.mockResolvedValue({ events: [event()], nextCursor: 11 });
    const html = await render({ type: "material", action: "content_archived", content: contentId });
    expect(html).toContain("Ver eventos anteriores");
    expect(html).toContain("type=material");
    expect(html).toContain("action=content_archived");
    expect(html).toContain(`content=${contentId}`);
    expect(html).toContain("before=11");
  });

  it("forwards only a valid cursor to the bounded boundary", async () => {
    await render({ before: "11" });
    expect(listLifecycleHistory).toHaveBeenCalledWith(expect.objectContaining({ beforeEventId: 11 }));
    vi.mocked(listLifecycleHistory).mockClear();
    await render({ before: "drop table" });
    expect(listLifecycleHistory).toHaveBeenCalledWith(expect.objectContaining({ beforeEventId: null }));
  });

  it("offers a way back to the most recent events once paginated", async () => {
    const html = await render({ before: "11", type: "material" });
    expect(html).toContain("Volver a los eventos más recientes");
  });
});
