import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, revalidatePath, resolveContentTitles } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
  resolveContentTitles: vi.fn(),
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/contributions/queries", () => ({
  findActiveDraftRevision: vi.fn(),
  resolveContentTitles,
  contentReferenceKey: (type: string, contentId: string) => `${type}:${contentId}`,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { archiveContent, restoreContent } from "@/app/app/contributions/actions";
import { archiveErrorMessage, dependencyBlockers, restoreErrorMessage } from "@/lib/contributions/errors";

const contentId = "40000000-0000-4000-8000-000000000001";

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("content_type", "material");
  data.set("content_id", contentId);
  for (const [key, value] of Object.entries(overrides)) data.set(key, value);
  return data;
}

describe("Archive and Restore Server Actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ userId: "trusted-user", organizationId: "trusted-org", role: "Admin" });
    resolveContentTitles.mockResolvedValue(new Map());
  });

  it("archives through the authoritative RPC and revalidates Admin and reader surfaces", async () => {
    rpc.mockResolvedValue({ data: { content_id: contentId, revision_id: "41000000-0000-4000-8000-000000000001" }, error: null });
    await expect(archiveContent({}, form())).rejects.toThrow("redirect:/app/contributions?state=archived");
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("archive_governed_content", {
      requested_type: "material",
      requested_content_id: contentId,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/app/contributions");
    expect(revalidatePath).toHaveBeenCalledWith("/app/library");
  });

  it("restores through the authoritative RPC and returns to the published revision", async () => {
    rpc.mockResolvedValue({ data: { content_id: contentId, revision_id: "41000000-0000-4000-8000-000000000001" }, error: null });
    await expect(restoreContent({}, form())).rejects.toThrow("redirect:/app/contributions/material/41000000-0000-4000-8000-000000000001");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("restore_governed_content", {
      requested_type: "material",
      requested_content_id: contentId,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/app/library");
  });

  it("requires Admin authority before reaching the boundary", async () => {
    requireAccess.mockRejectedValue(new Error("redirect:/access-denied"));
    await expect(archiveContent({}, form())).rejects.toThrow("redirect:/access-denied");
    await expect(restoreContent({}, form())).rejects.toThrow("redirect:/access-denied");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a malformed identity without calling the boundary", async () => {
    expect(await archiveContent({}, form({ content_id: "attacker" }))).toEqual({ error: "No encontramos el contenido que deseas archivar." });
    expect(await restoreContent({}, form({ content_id: "" }))).toEqual({ error: "No encontramos el contenido que deseas restaurar." });
    expect(await archiveContent({}, form({ content_type: "not_a_type" }))).toEqual({ error: "Selecciona un tipo de contenido válido." });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("surfaces published dependents as structured blockers resolved to readable titles", async () => {
    rpc.mockResolvedValue({ data: null, error: {
      code: "23514",
      message: "active current-published dependents block archival",
      details: JSON.stringify({ blockers: [
        { content_type: "module", content_id: "30000000-0000-4000-8000-000000000001" },
        { content_type: "teaching_note", content_id: "32000000-0000-4000-8000-000000000001" },
      ] }),
    } });
    resolveContentTitles.mockResolvedValue(new Map([["module:30000000-0000-4000-8000-000000000001", "Planificación de campaña"]]));
    const state = await archiveContent({}, form());
    expect(state.error).toBe("No se puede archivar este contenido porque lo utiliza contenido publicado activo.");
    expect(state.blockers).toEqual([
      { type: "module", contentId: "30000000-0000-4000-8000-000000000001", title: "Planificación de campaña" },
      // No title resolved: the fallback keeps the identity visible instead of
      // reaching past the Admin management boundary for a label.
      { type: "teaching_note", contentId: "32000000-0000-4000-8000-000000000001", title: null },
    ]);
    // Blocking is never a cascade: nothing else was mutated.
    expect(rpc).toHaveBeenCalledExactlyOnceWith("archive_governed_content", expect.anything());
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("distinguishes an active Draft from a generic failure", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "55000", message: "active Draft blocks archival" } });
    const state = await archiveContent({}, form());
    expect(state.error).toBe("Este contenido tiene una nueva versión en borrador. Resuélvela antes de archivarlo.");
    expect(state.blockers).toBeUndefined();
  });

  it("leaves the identity archived when restore dependency revalidation fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23514", message: "Module requires current-published Materials" } });
    const state = await restoreContent({}, form());
    expect(state.error).toContain("ya no está vigente");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps revoked authority and concurrency losses", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "eligible Admin access required" } });
    expect((await archiveContent({}, form())).error).toContain("permiso de administración cambió");
    expect((await restoreContent({}, form())).error).toContain("permiso de administración cambió");
    rpc.mockResolvedValue({ data: null, error: { code: "40001", message: "archival lost the identity race" } });
    expect((await archiveContent({}, form())).error).toContain("Actualiza la página");
    rpc.mockResolvedValue({ data: null, error: { code: "40001", message: "restoration lost the identity race" } });
    expect((await restoreContent({}, form())).error).toContain("Actualiza la página");
  });

  it("maps invalid current state without exposing raw Postgres detail", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "55000", message: "governed content is already archived" } });
    expect((await archiveContent({}, form())).error).toBe("Este contenido ya está archivado. Actualiza la página para ver su estado actual.");
    rpc.mockResolvedValue({ data: null, error: { code: "55000", message: "governed content is not archived" } });
    expect((await restoreContent({}, form())).error).toBe("Este contenido ya no está archivado. Actualiza la página para ver su estado actual.");
    rpc.mockResolvedValue({ data: null, error: { code: "55000", message: "governed content identity not found" } });
    expect((await archiveContent({}, form())).error).toContain("versión publicada vigente");
  });
});

describe("governance error mapping", () => {
  it("prefers the structured blocker payload over the human-readable message", () => {
    expect(dependencyBlockers({ details: JSON.stringify({ blockers: [{ content_type: "module", content_id: "abc" }] }) }))
      .toEqual([{ type: "module", contentId: "abc" }]);
  });

  it("tolerates a missing, malformed or unrecognised blocker payload", () => {
    expect(dependencyBlockers({})).toEqual([]);
    expect(dependencyBlockers({ details: "Key (id)=(1) is still referenced." })).toEqual([]);
    expect(dependencyBlockers({ details: JSON.stringify({ blockers: "nope" }) })).toEqual([]);
    expect(dependencyBlockers({ details: JSON.stringify({ blockers: [{ content_type: "axis", content_id: "abc" }] }) })).toEqual([]);
  });

  it("never leaks raw database text to Admins", () => {
    for (const message of [archiveErrorMessage({ code: "XX000", message: "null value in column \"x\"" }), restoreErrorMessage({ code: "XX000", message: "deadlock detected" })]) {
      expect(message).not.toMatch(/column|deadlock|null value/i);
    }
  });
});
