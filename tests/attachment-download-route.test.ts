import { beforeEach, expect, it, vi } from "vitest";

const { createClient, createSignedUrl, getAccess, maybeSingle } = vi.hoisted(() => ({
  createClient: vi.fn(), createSignedUrl: vi.fn(), getAccess: vi.fn(), maybeSingle: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({ getAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));

import { GET } from "@/app/api/attachments/[attachmentId]/route";

const attachmentId = "35100000-0000-4000-8000-000000000001";
const params = Promise.resolve({ attachmentId });

beforeEach(() => {
  vi.resetAllMocks();
  getAccess.mockResolvedValue({ status: "eligible", context: { role: "Contributor" } });
  createClient.mockResolvedValue({
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) }),
    storage: { from: () => ({ createSignedUrl }) },
  });
});

it("signs a visible Ready attachment for only 60 seconds", async () => {
  maybeSingle.mockResolvedValue({ data: { object_name: attachmentId, original_filename: "material.pdf" }, error: null });
  createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://storage.test/signed" }, error: null });

  const response = await GET(new Request("http://localhost"), { params });

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toBe("https://storage.test/signed");
  expect(createSignedUrl).toHaveBeenCalledWith(attachmentId, 60, { download: "material.pdf" });
});

it("does not sign metadata hidden by attachment RLS", async () => {
  maybeSingle.mockResolvedValue({ data: null, error: null });

  const response = await GET(new Request("http://localhost"), { params });

  expect(response.status).toBe(404);
  expect(createSignedUrl).not.toHaveBeenCalled();
});

it("rejects an ineligible caller before attachment lookup", async () => {
  getAccess.mockResolvedValue({ status: "ineligible" });

  const response = await GET(new Request("http://localhost"), { params });

  expect(response.status).toBe(403);
  expect(createClient).not.toHaveBeenCalled();
});

it("rejects malformed attachment identifiers before data access", async () => {
  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({ attachmentId: "------------------------------------" }),
  });

  expect(response.status).toBe(404);
  expect(createClient).not.toHaveBeenCalled();
});
