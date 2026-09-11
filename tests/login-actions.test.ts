import { beforeEach, expect, it, vi } from "vitest";

const { signInWithOAuth, signInWithOtp, verifyOtp } = vi.hoisted(() => ({ signInWithOAuth: vi.fn(), signInWithOtp: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithOAuth, signInWithOtp, verifyOtp } }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { requestCode, signInWithGoogle, verifyCode } from "@/app/login/actions";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("APP_URL", "https://base.example.org");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
});

it("initiates Google OAuth with the fixed application callback", async () => {
  signInWithOAuth.mockResolvedValue({ data: { url: "https://project.supabase.co/auth/v1/authorize?provider=google" }, error: null });
  await expect(signInWithGoogle()).rejects.toThrow("redirect:https://project.supabase.co/auth/v1/authorize?provider=google");
  expect(signInWithOAuth).toHaveBeenCalledExactlyOnceWith({
    provider: "google",
    options: { redirectTo: "https://base.example.org/auth/callback" },
  });
});

it("fails safely if OAuth initiation returns an untrusted redirect", async () => {
  signInWithOAuth.mockResolvedValue({ data: { url: "https://attacker.example/authorize" }, error: null });
  await expect(signInWithGoogle()).rejects.toThrow("redirect:/login?error=oauth");
});

it("does not let role or organization inputs provision an account", async () => {
  signInWithOtp.mockResolvedValue({ error: null });
  const form = new FormData();
  form.set("email", "member@partner.org");
  form.set("role", "Admin");
  form.set("organization_id", "another-org");
  await requestCode({}, form);
  expect(signInWithOtp).toHaveBeenCalledExactlyOnceWith({ email: "member@partner.org", options: { shouldCreateUser: false } });
});

it("does not enumerate unprovisioned accounts", async () => {
  const form = new FormData();
  form.set("email", "member@partner.org");
  signInWithOtp.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { status: 400 } });
  expect(await requestCode({}, form)).toEqual(await requestCode({}, form));
});

it("uses a fixed redirect and email verification type", async () => {
  verifyOtp.mockResolvedValue({ error: null });
  const form = new FormData();
  form.set("email", "member@partner.org");
  form.set("token", "123456");
  form.set("next", "https://attacker.example");
  await expect(verifyCode({}, form)).rejects.toThrow("redirect:/app");
  expect(verifyOtp).toHaveBeenCalledExactlyOnceWith({ email: "member@partner.org", token: "123456", type: "email" });
});
