import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, revalidatePath } = vi.hoisted(() => ({ requireAccess: vi.fn(), rpc: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc }) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { saveContribution, submitContribution } from "@/app/app/contributions/actions";

describe("contribution Server Actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ userId: "trusted-user", organizationId: "trusted-org", role: "Contributor" });
  });

  it("creates through the narrow RPC without forwarding forged provenance or lifecycle input", async () => {
    rpc.mockResolvedValue({ data: { revision_id: "31000000-0000-4000-8000-000000000001" }, error: null });
    const data = new FormData();
    data.set("content_type", "instructor");
    data.set("name", "Persona experta");
    data.set("created_by", "attacker");
    data.set("contributor_organization_id", "attacker-org");
    data.set("status", "Published");
    await expect(saveContribution({}, data)).rejects.toThrow("redirect:/app/contributions/instructor/31000000-0000-4000-8000-000000000001");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("create_contribution", {
      requested_type: "instructor",
      payload: { name: "Persona experta", role_or_title: null, institution: null, profile: null, linkedin_url: null, thematic_axis_or_themes: [], country: null },
    });
  });

  it("returns a Spanish validation error without calling the database", async () => {
    const data = new FormData();
    data.set("content_type", "material");
    expect(await saveContribution({}, data)).toEqual({ error: "Completa los campos obligatorios." });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps failed submission to a Spanish structural-validation error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "internal constraint" } });
    const data = new FormData();
    data.set("content_type", "teaching_note");
    data.set("revision_id", "34000000-0000-4000-8000-000000000001");
    expect(await submitContribution({}, data)).toEqual({ error: "El borrador todavía no cumple todos los requisitos para enviarse." });
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith();
  });
});
