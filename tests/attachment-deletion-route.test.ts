import { beforeEach, expect, it, vi } from "vitest";

const { getAccess, maybeSingle, rpc, remove } = vi.hoisted(() => ({
  getAccess: vi.fn(), maybeSingle: vi.fn(), rpc: vi.fn(), remove: vi.fn(),
}));
vi.mock("@/lib/auth/access", () => ({ getAccess }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) }),
    rpc,
    storage: { from: () => ({ remove }) },
  }),
}));
import { DELETE } from "@/app/api/contributions/[type]/[revisionId]/attachments/[attachmentId]/route";

const params = Promise.resolve({
  type: "material",
  revisionId: "35000000-0000-4000-8000-000000000001",
  attachmentId: "35100000-0000-4000-8000-000000000001",
});

beforeEach(() => {
  vi.resetAllMocks();
  getAccess.mockResolvedValue({ status: "eligible" });
  remove.mockResolvedValue({ error: null });
});

it("leaves post-object-delete finalization failure retryable in Deleting", async () => {
  maybeSingle
    .mockResolvedValueOnce({ data: { id: "35100000-0000-4000-8000-000000000001", object_name: "opaque", state: "Ready" }, error: null })
    .mockResolvedValueOnce({ data: { id: "35100000-0000-4000-8000-000000000001", object_name: "opaque", state: "Deleting" }, error: null });
  rpc.mockImplementation(async (name: string) => {
    if (name === "finalize_attachment_deletion") {
      return rpc.mock.calls.filter(([called]) => called === name).length === 1
        ? { error: { message: "temporary failure" } }
        : { error: null };
    }
    return { error: null };
  });

  const first = await DELETE(new Request("http://localhost"), { params });
  expect(first?.status).toBe(503);
  expect(rpc).toHaveBeenCalledWith("begin_attachment_deletion", { requested_attachment_id: "35100000-0000-4000-8000-000000000001" });
  expect(rpc).not.toHaveBeenCalledWith("cancel_attachment_deletion", expect.anything());

  const retry = await DELETE(new Request("http://localhost"), { params });
  expect(retry?.status).toBe(204);
  expect(remove).toHaveBeenCalledTimes(2);
  expect(rpc.mock.calls.filter(([name]) => name === "begin_attachment_deletion")).toHaveLength(1);
  expect(rpc.mock.calls.filter(([name]) => name === "finalize_attachment_deletion")).toHaveLength(2);
});
