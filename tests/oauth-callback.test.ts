import { beforeEach, expect, it, vi } from "vitest";

const { exchangeCodeForSession } = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession } }) }));
import { GET } from "@/app/auth/callback/route";

beforeEach(() => vi.resetAllMocks());

it("exchanges a valid OAuth code and redirects only to the protected shell", async () => {
  exchangeCodeForSession.mockResolvedValue({ error: null });
  const response = await GET(new Request("https://base.example.org/auth/callback?code=valid&next=https://attacker.example"));
  expect(exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith("valid");
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("/app");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("rejects missing or invalid authorization input without establishing a session", async () => {
  const missing = await GET(new Request("https://base.example.org/auth/callback?next=/app"));
  expect(missing.headers.get("location")).toBe("/login?error=oauth");
  expect(exchangeCodeForSession).not.toHaveBeenCalled();

  exchangeCodeForSession.mockResolvedValue({ error: { message: "invalid code" } });
  const invalid = await GET(new Request("https://base.example.org/auth/callback?code=invalid"));
  expect(invalid.headers.get("location")).toBe("/login?error=oauth");
});
