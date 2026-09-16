import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, from } = vi.hoisted(() => ({ requireAccess: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc, from }) }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
import { ARCHIVED_PAGE_SIZE, listArchivedContent } from "@/lib/contributions/queries";
import { archivedContentTitle } from "@/lib/contributions/types";

function archivedRow(overrides: Record<string, unknown> = {}) {
  return {
    content_type: "material",
    content_id: "40000000-0000-4000-8000-000000000001",
    current_published_revision_id: "41000000-0000-4000-8000-000000000001",
    revision_number: 2,
    title: "Estudio comparado",
    archived_at: "2026-09-16T10:00:00Z",
    archived_by: "50000000-0000-4000-8000-000000000001",
    ...overrides,
  };
}

describe("archived governed content query", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ role: "Admin" });
    rpc.mockResolvedValue({ data: [], error: null });
  });

  it("requires Admin authority", async () => {
    await listArchivedContent();
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
  });

  it("reads the dedicated RPC and never the active identity tables", async () => {
    await listArchivedContent();
    expect(rpc).toHaveBeenCalledExactlyOnceWith("list_archived_governed_content", expect.objectContaining({
      page_size: ARCHIVED_PAGE_SIZE + 1,
    }));
    // Every direct policy hides archived identities; falling back to a table read
    // would silently return nothing rather than failing loudly.
    expect(from).not.toHaveBeenCalled();
  });

  it("maps RPC rows onto the application shape", async () => {
    rpc.mockResolvedValue({ data: [archivedRow()], error: null });
    const { entries } = await listArchivedContent();
    expect(entries).toEqual([{
      type: "material",
      contentId: "40000000-0000-4000-8000-000000000001",
      currentPublishedRevisionId: "41000000-0000-4000-8000-000000000001",
      currentPublishedRevisionNumber: 2,
      title: "Estudio comparado",
      archivedAt: "2026-09-16T10:00:00Z",
      archivedBy: "50000000-0000-4000-8000-000000000001",
    }]);
  });

  it("keeps an archived identity with unresolvable published metadata on the restore surface", async () => {
    rpc.mockResolvedValue({ data: [archivedRow({ title: null, revision_number: null, current_published_revision_id: null })], error: null });
    const { entries } = await listArchivedContent();
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBeNull();
    expect(archivedContentTitle(entries[0])).toBe("Sin título disponible");
  });

  it("passes the content-type filter to the RPC rather than filtering after the fact", async () => {
    await listArchivedContent({ type: "institution" });
    expect(rpc.mock.calls[0][1]).toMatchObject({ content_type_filter: "institution" });
  });

  it("sends no cursor on the first page", async () => {
    await listArchivedContent();
    const args = rpc.mock.calls[0][1];
    expect(args.before_archived_at).toBeUndefined();
    expect(args.before_content_id).toBeUndefined();
    expect(args.before_content_type).toBeUndefined();
  });

  it("propagates all three keyset components when paginating", async () => {
    await listArchivedContent({ cursor: { archivedAt: "2026-09-16T10:00:00Z", contentId: "40000000-0000-4000-8000-000000000001", contentType: "material" } });
    expect(rpc.mock.calls[0][1]).toMatchObject({
      before_archived_at: "2026-09-16T10:00:00Z",
      before_content_id: "40000000-0000-4000-8000-000000000001",
      before_content_type: "material",
    });
  });

  it("derives the next cursor from the last returned row, dropping the probe row", async () => {
    const rows = Array.from({ length: 4 }, (_, index) => archivedRow({
      content_id: `4000000${index}-0000-4000-8000-000000000001`,
      content_type: index % 2 === 0 ? "material" : "institution",
    }));
    rpc.mockResolvedValue({ data: rows, error: null });
    const { entries, nextCursor } = await listArchivedContent({ pageSize: 3 });
    expect(rpc.mock.calls[0][1].page_size).toBe(4);
    expect(entries).toHaveLength(3);
    expect(nextCursor).toEqual({
      archivedAt: "2026-09-16T10:00:00Z",
      contentId: "40000002-0000-4000-8000-000000000001",
      contentType: "material",
    });
  });

  it("reports no next page when the probe row is absent", async () => {
    rpc.mockResolvedValue({ data: [archivedRow(), archivedRow({ content_id: "40000009-0000-4000-8000-000000000001" })], error: null });
    expect((await listArchivedContent({ pageSize: 3 })).nextCursor).toBeNull();
  });

  it("fails loudly instead of presenting an empty archive when the boundary errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "eligible Admin access required" } });
    await expect(listArchivedContent()).rejects.toThrow("Archived content read unavailable");
  });
});
