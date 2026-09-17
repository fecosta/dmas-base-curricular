import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAccess, getSearchSuggestions } = vi.hoisted(() => ({
  getAccess: vi.fn(), getSearchSuggestions: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({ getAccess }));
vi.mock("@/lib/curriculum/queries", () => ({ getSearchSuggestions }));

import { GET } from "@/app/api/library/suggestions/route";

function request(query: string) {
  return new Request(`http://localhost/api/library/suggestions?q=${encodeURIComponent(query)}`);
}

beforeEach(() => {
  vi.resetAllMocks();
  getAccess.mockResolvedValue({ status: "eligible", context: { role: "Contributor" } });
  getSearchSuggestions.mockResolvedValue([]);
});

/*
 * The suggestion endpoint is a reader data surface. Eligibility is re-evaluated
 * from live persisted state on every request, exactly as /api/access does, and
 * nothing the caller sends can stand in for it.
 */
describe("suggestion authorization boundary", () => {
  it("refuses an unauthenticated caller before touching curriculum data", async () => {
    getAccess.mockResolvedValue({ status: "unauthenticated" });

    const response = await GET(request("democracia"));

    expect(response.status).toBe(401);
    expect(getSearchSuggestions).not.toHaveBeenCalled();
  });

  it("refuses an authenticated but ineligible caller before touching curriculum data", async () => {
    getAccess.mockResolvedValue({ status: "ineligible" });

    const response = await GET(request("democracia"));

    expect(response.status).toBe(403);
    expect(getSearchSuggestions).not.toHaveBeenCalled();
  });

  it("does not fall open when eligibility cannot be established", async () => {
    getAccess.mockResolvedValue({ status: "unavailable" });

    const response = await GET(request("democracia"));

    expect(response.status).toBe(503);
    expect(getSearchSuggestions).not.toHaveBeenCalled();
  });

  it("carries no suggestion payload in any refusal", async () => {
    for (const status of ["unauthenticated", "ineligible", "unavailable"]) {
      getAccess.mockResolvedValue({ status });
      const body = await (await GET(request("democracia"))).json();
      expect(body.groups, `${status} response leaked groups`).toBeUndefined();
    }
  });

  it("never caches a reader-scoped response", async () => {
    getAccess.mockResolvedValue({ status: "ineligible" });
    expect((await GET(request("x"))).headers.get("Cache-Control")).toBe("private, no-store");

    getAccess.mockResolvedValue({ status: "eligible", context: { role: "Admin" } });
    expect((await GET(request("democracia"))).headers.get("Cache-Control")).toBe("private, no-store");
  });

  /*
   * An Admin is a reader here too: suggestions run the published reader search,
   * so Admin authority grants no extra visibility through this route.
   */
  it("runs the same published search for an Admin as for a reader", async () => {
    getAccess.mockResolvedValue({ status: "eligible", context: { role: "Admin" } });
    await GET(request("democracia"));
    expect(getSearchSuggestions).toHaveBeenCalledWith("democracia");
  });
});

describe("suggestion responses", () => {
  it("groups the reader-visible rows it is given", async () => {
    getSearchSuggestions.mockResolvedValue([
      { entity_type: "module", id: "m1", title: "Campaña", classification: "Estrategia y Campaña", country_or_scope: null, theme: "Participación" },
    ]);

    const body = await (await GET(request("campaña"))).json();

    expect(body.groups).toHaveLength(1);
    expect(body.groups[0].label).toBe("Módulos");
    expect(body.groups[0].items[0]).toEqual({
      id: "m1", title: "Campaña", subtitle: "Estrategia y Campaña · Participación", href: "/app/library/modules/m1",
    });
  });

  it("answers a query too short to be worth a search without running one", async () => {
    const body = await (await GET(request("d"))).json();

    expect(body.groups).toEqual([]);
    expect(getSearchSuggestions).not.toHaveBeenCalled();
  });

  it("treats a whitespace-only query as no query", async () => {
    const body = await (await GET(request("   "))).json();

    expect(body.groups).toEqual([]);
    expect(getSearchSuggestions).not.toHaveBeenCalled();
  });

  it("trims the query before searching", async () => {
    await GET(request("  democracia  "));
    expect(getSearchSuggestions).toHaveBeenCalledWith("democracia");
  });

  it("answers an absent query parameter without searching", async () => {
    const body = await (await GET(new Request("http://localhost/api/library/suggestions"))).json();

    expect(body.groups).toEqual([]);
    expect(getSearchSuggestions).not.toHaveBeenCalled();
  });
});
