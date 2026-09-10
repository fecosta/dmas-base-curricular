import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser }, rpc }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { getAccess, requireAccess } from "@/lib/auth/access";

// Unit tests exercise the server primitive. SQL and E2E tests verify real data authority.
describe("server authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@partner.org", email_confirmed_at: "2026-09-10", user_metadata: { role: "Admin" } } }, error: null });
    rpc.mockResolvedValue({ data: [{ user_id: "user-1", organization_id: "org-1", organization_name: "Organización", role: "Contributor" }], error: null });
  });
  it("denies unauthenticated requests without querying protected data", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAccess()).rejects.toThrow("redirect:/login");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("uses the database context and ignores client-editable metadata", async () => {
    const context = await requireAccess();
    expect(context.role).toBe("Contributor");
    expect(context.organizationId).toBe("org-1");
    expect(rpc).toHaveBeenCalledExactlyOnceWith("current_access");
    await expect(requireAccess("Admin")).rejects.toThrow("redirect:/access-denied");
  });
  it("recognizes authoritative Admin membership", async () => {
    rpc.mockResolvedValue({ data: [{ user_id: "user-1", organization_id: "org-1", organization_name: "Democracia+", role: "Admin" }], error: null });
    expect((await requireAccess("Admin")).role).toBe("Admin");
  });
  it("denies an authenticated ineligible identity", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await expect(requireAccess()).rejects.toThrow("redirect:/access-denied");
  });
  it("fails closed on database errors", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "database down" } });
    expect(await getAccess()).toEqual({ status: "unavailable" });
    await expect(requireAccess()).rejects.toThrow("Access lookup unavailable");
  });
  it("rejects unverified email", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@partner.org" } }, error: null });
    expect(await getAccess()).toEqual({ status: "ineligible" });
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each(["unexpected", "mismatched-subject"])("fails closed on unexpected access result: %s", async (scenario) => {
    rpc.mockResolvedValue({ data: [{ user_id: scenario === "unexpected" ? "user-1" : "other", role: scenario === "unexpected" ? "Owner" : "Admin" }], error: null });
    expect(await getAccess()).toEqual({ status: "ineligible" });
  });
});
