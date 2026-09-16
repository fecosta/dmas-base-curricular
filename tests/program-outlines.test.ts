import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, from } = vi.hoisted(() => ({ requireAccess: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from }) }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
import { getProgramOutlines } from "@/lib/curriculum/queries";

const MODULE_A = "11111111-1111-4111-8111-111111111111";
const MODULE_B = "22222222-2222-4222-8222-222222222222";

function respondWith(rows: Record<string, unknown>[], error: unknown = null) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    order: vi.fn(),
  };
  let orders = 0;
  builder.order = vi.fn(() => {
    orders += 1;
    return orders === 2 ? Promise.resolve({ data: rows, error }) : builder;
  });
  from.mockReturnValue(builder);
  return builder;
}

describe("program outlines for the library Programa view", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ role: "Contributor" });
  });

  it("authorizes the read and groups published topics by module", async () => {
    respondWith([
      { program_topic_id: "t1", module_id: MODULE_A, title: "Lectura del escenario", position: 1 },
      { program_topic_id: "t2", module_id: MODULE_A, title: "Camino a la victoria", position: 2 },
      { program_topic_id: "t3", module_id: MODULE_B, title: "Evidencia", position: 1 },
    ]);
    const outlines = await getProgramOutlines([MODULE_A, MODULE_B]);
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith();
    expect(outlines).toEqual([
      { moduleId: MODULE_A, topics: [{ id: "t1", title: "Lectura del escenario" }, { id: "t2", title: "Camino a la victoria" }] },
      { moduleId: MODULE_B, topics: [{ id: "t3", title: "Evidencia" }] },
    ]);
  });

  it("returns an empty outline for a module without published topics", async () => {
    respondWith([]);
    expect(await getProgramOutlines([MODULE_A])).toEqual([{ moduleId: MODULE_A, topics: [] }]);
  });

  it("never queries for an empty or malformed module list", async () => {
    expect(await getProgramOutlines([])).toEqual([]);
    expect(await getProgramOutlines(["not-a-uuid"])).toEqual([]);
    expect(from).not.toHaveBeenCalled();
    expect(requireAccess).not.toHaveBeenCalled();
  });

  it("fails closed when the topic read fails", async () => {
    respondWith([], { message: "denied" });
    await expect(getProgramOutlines([MODULE_A])).rejects.toThrow("Curriculum read unavailable");
  });
});
