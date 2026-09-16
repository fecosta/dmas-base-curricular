import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, from } = vi.hoisted(() => ({ requireAccess: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from }) }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
import { listManagedContent } from "@/lib/contributions/queries";

const rows: Record<string, { identities: unknown[]; revisions: unknown[] }> = {
  modules: { identities: [{ id: "mod-1", current_published_revision_id: "mr-1" }], revisions: [] },
  module_revisions: { identities: [], revisions: [
    { id: "mr-1", module_id: "mod-1", status: "Published", title: "Planificación de campaña", revision_number: 1, created_at: "2026-01-01T00:00:00Z", published_at: "2026-01-02T00:00:00Z" },
    { id: "mr-2", module_id: "mod-1", status: "Draft", title: "Planificación de campaña", revision_number: 2, created_at: "2026-02-01T00:00:00Z", published_at: null },
  ] },
  materials: { identities: [{ id: "mat-1", current_published_revision_id: null }], revisions: [] },
  material_revisions: { identities: [], revisions: [
    { id: "matr-1", material_id: "mat-1", status: "Draft", title: "Estudio comparado", revision_number: 1, created_at: "2026-03-01T00:00:00Z", published_at: null },
  ] },
};

function tableBuilder(table: string) {
  const payload = rows[table] ?? { identities: [], revisions: [] };
  const data = table.endsWith("_revisions") ? payload.revisions : payload.identities;
  const builder = {
    select: () => builder,
    in: async () => ({ data, error: null }),
  };
  // Identity reads resolve straight off select(); revision reads chain .in().
  return table.endsWith("_revisions")
    ? builder
    : { select: async () => ({ data, error: null }) };
}

describe("admin management filtering", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ role: "Admin" });
    from.mockImplementation((table: string) => tableBuilder(table));
  });

  it("requires Admin authority for every management read", async () => {
    await listManagedContent();
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
  });

  it("queries every content type when no type filter is applied", async () => {
    await listManagedContent();
    const queried = from.mock.calls.map((call) => call[0]);
    for (const table of ["modules", "program_topics", "instructors", "teaching_notes", "materials", "institutions"]) {
      expect(queried).toContain(table);
    }
  });

  it("narrows the query to a single content type server-side", async () => {
    await listManagedContent({ type: "material" });
    const queried = from.mock.calls.map((call) => call[0]);
    expect(queried).toEqual(expect.arrayContaining(["materials", "material_revisions"]));
    expect(queried).not.toContain("modules");
    expect(queried).not.toContain("institutions");
  });

  it("filters by derived management state without distorting it", async () => {
    const all = await listManagedContent();
    expect(all.find((item) => item.type === "module")?.state).toBe("published_with_draft");
    const drafts = await listManagedContent({ state: "draft" });
    expect(drafts.map((item) => item.type)).toEqual(["material"]);
    const successors = await listManagedContent({ state: "published_with_draft" });
    expect(successors.map((item) => item.type)).toEqual(["module"]);
    // The published revision survives the filter, so its action stays reachable.
    expect(successors[0].currentPublishedRevisionId).toBe("mr-1");
  });

  it("matches the management title case-insensitively", async () => {
    expect((await listManagedContent({ query: "planificación" })).map((item) => item.type)).toEqual(["module"]);
    expect((await listManagedContent({ query: "ESTUDIO" })).map((item) => item.type)).toEqual(["material"]);
    expect(await listManagedContent({ query: "inexistente" })).toEqual([]);
  });

  it("combines filters", async () => {
    expect(await listManagedContent({ type: "module", state: "draft" })).toEqual([]);
    expect((await listManagedContent({ type: "module", state: "published_with_draft" })).length).toBe(1);
  });
});
