import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, from, notFound } = vi.hoisted(() => ({
  requireAccess: vi.fn(), rpc: vi.fn(), from: vi.fn(),
  notFound: vi.fn(() => { throw new Error("not-found"); }),
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc, from }) }));
vi.mock("next/navigation", () => ({ notFound }));
import { getLibrary, getModule, getReference, getSearchSuggestions } from "@/lib/curriculum/queries";

describe("curriculum server queries", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ role: "Contributor" });
    from.mockReturnValue({
      select: () => ({ order: async () => ({ data: [{ id: "axis-1", name: "Eje", display_order: 1 }], error: null }) }),
    });
    rpc.mockImplementation(async (name: string, args: Record<string, string | undefined>) => {
      if (name === "search_curriculum" && Object.keys(args).length === 0) {
        return { data: [{ entity_type: "material", country_or_scope: "Perú", theme: "Democracia, Evidencia" }], error: null };
      }
      return { data: [], error: null };
    });
  });

  it("authorizes each library read and passes only normalized persisted filters", async () => {
    const result = await getLibrary({ query: "  política  ", axis: "forged", country: " Perú ", theme: " Democracia " });
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith();
    expect(rpc).toHaveBeenCalledWith("search_curriculum", {
      search_query: "política", entity_filter: undefined, axis_filter: undefined,
      country_filter: "Perú", theme_filter: "Democracia",
    });
    expect(result.countries).toEqual(["Perú"]);
    expect(result.themes).toEqual(["Democracia", "Evidencia"]);
  });

  it("fails closed when a curriculum RPC fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(getLibrary({})).rejects.toThrow("Curriculum read unavailable");
  });

  it("rejects malformed direct module identifiers before data access", async () => {
    await expect(getModule("not-a-uuid")).rejects.toThrow("not-found");
    expect(requireAccess).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns only an authorized published module RPC representation", async () => {
    rpc.mockResolvedValue({ data: { id: "30000000-0000-4000-8000-000000000001", title: "Módulo" }, error: null });
    const result = await getModule("30000000-0000-4000-8000-000000000001");
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith();
    expect(rpc).toHaveBeenCalledWith("get_published_module", { target_id: "30000000-0000-4000-8000-000000000001" });
    expect(result.title).toBe("Módulo");
  });

  it("rejects manipulated reference types", async () => {
    await expect(getReference("instructor", "36000000-0000-4000-8000-000000000001")).rejects.toThrow("not-found");
    expect(requireAccess).not.toHaveBeenCalled();
  });

  /*
   * Search suggestions run the reader's own published search. They must not
   * become a second, looser read path around the boundary the Library uses.
   */
  it("authorizes each suggestion read and runs the published reader search", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await getSearchSuggestions("  política  ");
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith();
    expect(rpc).toHaveBeenCalledExactlyOnceWith("search_curriculum", { search_query: "política" });
  });

  it("applies no filter that could widen what a suggestion search returns", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await getSearchSuggestions("política");
    expect(Object.keys(rpc.mock.calls[0][1] as object)).toEqual(["search_query"]);
  });

  it("returns only the columns a suggestion renders, dropping the rest of the row", async () => {
    rpc.mockResolvedValue({ data: [{
      entity_type: "module", id: "m1", title: "Módulo", description: "Texto largo que no viaja",
      classification: "Eje", country_or_scope: null, theme: "Democracia", rank: 0.5,
    }], error: null });

    const rows = await getSearchSuggestions("módulo");

    expect(Object.keys(rows[0]).sort()).toEqual(["classification", "country_or_scope", "entity_type", "id", "theme", "title"]);
  });

  it("does not search at all for an empty query", async () => {
    expect(await getSearchSuggestions("   ")).toEqual([]);
    expect(requireAccess).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed when the suggestion search fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(getSearchSuggestions("política")).rejects.toThrow("Curriculum read unavailable");
  });
});
