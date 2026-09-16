import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, listManagedContent, listArchivedContent } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  listManagedContent: vi.fn(),
  listArchivedContent: vi.fn(),
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/contributions/queries", () => ({
  listManagedContent,
  listArchivedContent,
  ARCHIVED_PAGE_SIZE: 20,
  resolveContentTitles: vi.fn(),
  contentReferenceKey: (type: string, contentId: string) => `${type}:${contentId}`,
  findActiveDraftRevision: vi.fn(),
}));
import ContributionsPage from "@/app/app/contributions/page";

const archivedEntry = {
  type: "material" as const,
  contentId: "40000000-0000-4000-8000-000000000001",
  currentPublishedRevisionId: "41000000-0000-4000-8000-000000000001",
  currentPublishedRevisionNumber: 2,
  title: "Estudio archivado",
  archivedAt: "2026-09-16T10:00:00Z",
  archivedBy: "50000000-0000-4000-8000-000000000001",
};

const publishedSummary = {
  type: "module" as const,
  contentId: "30000000-0000-4000-8000-000000000001",
  title: "Planificación de campaña",
  state: "published" as const,
  currentPublishedRevisionId: "31000000-0000-4000-8000-000000000001",
  currentPublishedRevisionNumber: 1,
  draftRevisionId: null,
  draftRevisionNumber: null,
  activityAt: "2026-09-01T00:00:00Z",
};

async function render(query: Record<string, string> = {}) {
  return renderToStaticMarkup(await ContributionsPage({ searchParams: Promise.resolve(query) }));
}

describe("Admin management with archived content", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ role: "Admin" });
    listManagedContent.mockResolvedValue([publishedSummary]);
    listArchivedContent.mockResolvedValue({ entries: [], nextCursor: null });
  });

  it("offers Archivado in the state filter", async () => {
    const html = await render();
    expect(html).toContain('value="archived"');
    expect(html).toContain("Archivado");
  });

  it("reads archived content through the dedicated boundary, never the active identity query", async () => {
    await render({ state: "archived" });
    expect(listArchivedContent).toHaveBeenCalled();
    expect(listManagedContent).not.toHaveBeenCalled();
  });

  it("renders archived entries with type, version, timestamp, Restore and History", async () => {
    listArchivedContent.mockResolvedValue({ entries: [archivedEntry], nextCursor: null });
    const html = await render({ state: "archived" });
    expect(html).toContain("Estudio archivado");
    expect(html).toContain("Material o estudio");
    expect(html).toContain("Versión 2 publicada");
    expect(html).toContain("Archivado el");
    expect(html).toContain("Restaurar");
    expect(html).toContain("Ver historial");
  });

  it("gives each Restore control a distinct accessible name containing its visible label", async () => {
    listArchivedContent.mockResolvedValue({
      entries: [archivedEntry, { ...archivedEntry, contentId: "40000000-0000-4000-8000-000000000002", title: "Otro estudio" }],
      nextCursor: null,
    });
    const html = await render({ state: "archived" });
    expect(html).toContain('aria-label="Restaurar Estudio archivado"');
    expect(html).toContain('aria-label="Restaurar Otro estudio"');
    expect(html).toContain('aria-label="Ver historial de Estudio archivado"');
  });

  it("keeps an archived identity without resolvable metadata restorable", async () => {
    listArchivedContent.mockResolvedValue({
      entries: [{ ...archivedEntry, title: null, currentPublishedRevisionNumber: null, currentPublishedRevisionId: null }],
      nextCursor: null,
    });
    const html = await render({ state: "archived" });
    expect(html).toContain("Sin título disponible");
    expect(html).toContain("40000000-0000-4000-8000-000000000001");
    expect(html).toContain('aria-label="Restaurar Sin título disponible"');
  });

  it("carries all three keyset components in the archived pagination link", async () => {
    listArchivedContent.mockResolvedValue({
      entries: [archivedEntry],
      nextCursor: { archivedAt: "2026-09-16T10:00:00Z", contentId: "40000000-0000-4000-8000-000000000001", contentType: "material" as const },
    });
    const html = await render({ state: "archived" });
    expect(html).toContain("Ver más contenido archivado");
    expect(html).toContain("before_at=2026-09-16T10%3A00%3A00Z");
    expect(html).toContain("before_id=40000000-0000-4000-8000-000000000001");
    expect(html).toContain("before_type=material");
  });

  it("forwards a complete cursor and the type filter to the archived boundary", async () => {
    await render({
      state: "archived",
      type: "institution",
      before_at: "2026-09-16T10:00:00Z",
      before_id: "40000000-0000-4000-8000-000000000001",
      before_type: "material",
    });
    expect(listArchivedContent).toHaveBeenCalledWith({
      type: "institution",
      cursor: { archivedAt: "2026-09-16T10:00:00Z", contentId: "40000000-0000-4000-8000-000000000001", contentType: "material" },
    });
  });

  it("ignores a partial cursor rather than sending one the boundary would reject", async () => {
    await render({ state: "archived", before_at: "2026-09-16T10:00:00Z" });
    expect(listArchivedContent).toHaveBeenCalledWith({ type: undefined, cursor: null });
  });

  it("says plainly that text search does not narrow archived content", async () => {
    const html = await render({ state: "archived", q: "estudio" });
    expect(html).toContain("La búsqueda por texto todavía no está disponible en el contenido archivado.");
  });

  it("keeps Draft/Published behaviour untouched when the state filter is not archived", async () => {
    const html = await render({ state: "published" });
    expect(listManagedContent).toHaveBeenCalledWith({ query: "", type: undefined, state: "published" });
    expect(listArchivedContent).not.toHaveBeenCalled();
    expect(html).toContain("Planificación de campaña");
    expect(html).toContain("Ver versión publicada");
  });

  it("surfaces archived content as a bounded preview under Todos los estados", async () => {
    listArchivedContent.mockResolvedValue({ entries: [archivedEntry], nextCursor: null });
    const html = await render();
    expect(listArchivedContent).toHaveBeenCalledWith({ type: undefined, pageSize: 5 });
    expect(html).toContain("Estudio archivado");
    expect(html).toContain("Ver todo el contenido archivado");
    // The preview never merges into the active listing's own counts.
    expect(html).toContain("Planificación de campaña");
  });

  it("reaches the global history from the management surface", async () => {
    const html = await render();
    expect(html).toContain('href="/app/contributions/history"');
  });

  it("links each archived entry to its own identity history", async () => {
    listArchivedContent.mockResolvedValue({ entries: [archivedEntry], nextCursor: null });
    const html = await render({ state: "archived" });
    expect(html).toContain("/app/contributions/history?type=material&amp;content=40000000-0000-4000-8000-000000000001");
  });
});
