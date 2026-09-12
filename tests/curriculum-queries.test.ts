import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, from, notFound } = vi.hoisted(() => ({
  requireAccess: vi.fn(), rpc: vi.fn(), from: vi.fn(),
  notFound: vi.fn(() => { throw new Error("not-found"); }),
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc, from }) }));
vi.mock("next/navigation", () => ({ notFound }));
import { getLibrary, getModule, getReference } from "@/lib/curriculum/queries";

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
});
