import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, revalidatePath, findActiveDraftRevision } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
  findActiveDraftRevision: vi.fn(),
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/contributions/queries", () => ({ findActiveDraftRevision }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { createSuccessorDraft, publishDraft, saveContribution } from "@/app/app/contributions/actions";
import { publicationErrorMessage } from "@/lib/contributions/errors";

describe("Admin content-management Server Actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ userId: "trusted-user", organizationId: "trusted-org", role: "Admin" });
  });

  it("creates a Draft through the bounded RPC without forwarding forged authority fields", async () => {
    rpc.mockResolvedValue({ data: { revision_id: "31000000-0000-4000-8000-000000000001" }, error: null });
    const data = new FormData();
    data.set("content_type", "instructor");
    data.set("name", "Persona experta");
    data.set("created_by", "attacker");
    data.set("contributor_organization_id", "attacker-org");
    data.set("status", "Published");
    await expect(saveContribution({}, data)).rejects.toThrow("redirect:/app/contributions/instructor/31000000-0000-4000-8000-000000000001");
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("create_contribution", {
      requested_type: "instructor",
      payload: { name: "Persona experta", role_or_title: null, institution: null, profile: null, linkedin_url: null, thematic_axis_or_themes: [], country: null },
    });
  });

  it("publishes through the authoritative RPC and revalidates Admin and reader surfaces", async () => {
    rpc.mockResolvedValue({ data: { revision_id: "31000000-0000-4000-8000-000000000001" }, error: null });
    const data = new FormData();
    data.set("content_type", "instructor");
    data.set("revision_id", "31000000-0000-4000-8000-000000000001");
    await expect(publishDraft({}, data)).rejects.toThrow(/published=1$/);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("publish_content_draft", {
      requested_type: "instructor",
      requested_revision_id: "31000000-0000-4000-8000-000000000001",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/app/library");
  });

  it("maps publication domain failures to safe Spanish copy", async () => {
    expect(publicationErrorMessage({ code: "23514", message: "Module requires current-published Materials" }))
      .toBe("Publica primero los contenidos relacionados que necesita este borrador.");
    expect(publicationErrorMessage({ code: "23514", message: "attachment metadata is not Ready" }))
      .toBe("Completa la fuente o los archivos requeridos antes de publicar.");
    expect(publicationErrorMessage({ code: "40001", message: "publication lost the Draft race" }))
      .toContain("Actualiza la página");
  });

  it("creates a successor through the authoritative cloning RPC", async () => {
    rpc.mockResolvedValue({ data: { revision_id: "31000000-0000-4000-8000-000000000002" }, error: null });
    const data = new FormData();
    data.set("content_type", "instructor");
    data.set("content_id", "30000000-0000-4000-8000-000000000001");
    await expect(createSuccessorDraft({}, data)).rejects.toThrow("redirect:/app/contributions/instructor/31000000-0000-4000-8000-000000000002");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("create_successor_draft", {
      requested_type: "instructor",
      requested_content_id: "30000000-0000-4000-8000-000000000001",
    });
  });

  it("redirects to the existing successor after an authoritative conflict", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "55000", message: "active successor Draft already exists" } });
    findActiveDraftRevision.mockResolvedValue("31000000-0000-4000-8000-000000000002");
    const data = new FormData();
    data.set("content_type", "instructor");
    data.set("content_id", "30000000-0000-4000-8000-000000000001");
    await expect(createSuccessorDraft({}, data)).rejects.toThrow("redirect:/app/contributions/instructor/31000000-0000-4000-8000-000000000002");
  });
});
