import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, from } = vi.hoisted(() => ({ requireAccess: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ rpc, from }) }));
vi.mock("next/navigation", () => ({ notFound: vi.fn() }));
import { HISTORY_PAGE_SIZE, listLifecycleHistory } from "@/lib/contributions/queries";

function event(overrides: Record<string, unknown> = {}) {
  return {
    event_id: 12,
    content_type: "material",
    content_id: "40000000-0000-4000-8000-000000000001",
    revision_id: "41000000-0000-4000-8000-000000000001",
    actor_user_id: "50000000-0000-4000-8000-000000000001",
    actor_organization_id: "60000000-0000-4000-8000-000000000001",
    actor_organization_name: "Red de formación",
    action: "content_published",
    previous_status: "Draft",
    resulting_status: "Published",
    occurred_at: "2026-09-16T10:00:00Z",
    ...overrides,
  };
}

describe("governance history query", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireAccess.mockResolvedValue({ role: "Admin" });
    rpc.mockResolvedValue({ data: [], error: null });
  });

  it("requires Admin authority", async () => {
    await listLifecycleHistory();
    expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
  });

  it("reads the bounded RPC and never the lifecycle-events table directly", async () => {
    await listLifecycleHistory();
    expect(rpc).toHaveBeenCalledExactlyOnceWith("list_curriculum_lifecycle_history", expect.objectContaining({
      page_size: HISTORY_PAGE_SIZE + 1,
    }));
    expect(from).not.toHaveBeenCalled();
  });

  it("maps RPC rows onto the application shape, including organization attribution", async () => {
    rpc.mockResolvedValue({ data: [event()], error: null });
    const { events } = await listLifecycleHistory();
    expect(events).toEqual([{
      eventId: 12,
      type: "material",
      contentId: "40000000-0000-4000-8000-000000000001",
      revisionId: "41000000-0000-4000-8000-000000000001",
      actorUserId: "50000000-0000-4000-8000-000000000001",
      actorOrganizationId: "60000000-0000-4000-8000-000000000001",
      actorOrganizationName: "Red de formación",
      action: "content_published",
      previousStatus: "Draft",
      resultingStatus: "Published",
      occurredAt: "2026-09-16T10:00:00Z",
    }]);
  });

  it("keeps an event whose organization can no longer be resolved", async () => {
    rpc.mockResolvedValue({ data: [event({ actor_organization_name: null })], error: null });
    expect((await listLifecycleHistory()).events[0].actorOrganizationName).toBeNull();
  });

  it("filters to a single stable identity", async () => {
    await listLifecycleHistory({ type: "material", contentId: "40000000-0000-4000-8000-000000000001" });
    expect(rpc.mock.calls[0][1]).toMatchObject({
      content_type_filter: "material",
      content_id_filter: "40000000-0000-4000-8000-000000000001",
    });
  });

  it("never sends a malformed identity filter to the boundary", async () => {
    expect(await listLifecycleHistory({ contentId: "not-a-uuid" })).toEqual({ events: [], nextCursor: null });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("filters by action when asked", async () => {
    await listLifecycleHistory({ action: "content_archived" });
    expect(rpc.mock.calls[0][1]).toMatchObject({ action_filter: "content_archived" });
  });

  it("propagates the event cursor and derives the next one", async () => {
    rpc.mockResolvedValue({ data: [event({ event_id: 12 }), event({ event_id: 11 }), event({ event_id: 10 })], error: null });
    const { events, nextCursor } = await listLifecycleHistory({ pageSize: 2, beforeEventId: 20 });
    expect(rpc.mock.calls[0][1]).toMatchObject({ page_size: 3, before_event_id: 20 });
    expect(events.map((item) => item.eventId)).toEqual([12, 11]);
    expect(nextCursor).toBe(11);
  });

  it("reports no next page when the probe row is absent", async () => {
    rpc.mockResolvedValue({ data: [event()], error: null });
    expect((await listLifecycleHistory({ pageSize: 2 })).nextCursor).toBeNull();
  });

  it("fails loudly instead of presenting an empty history", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "eligible Admin access required" } });
    await expect(listLifecycleHistory()).rejects.toThrow("Governance history read unavailable");
  });
});
