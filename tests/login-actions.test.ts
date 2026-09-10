import { beforeEach, expect, it, vi } from "vitest";

const { signInWithOtp, verifyOtp } = vi.hoisted(() => ({ signInWithOtp: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithOtp, verifyOtp } }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { requestCode, verifyCode } from "@/app/login/actions";

beforeEach(() => vi.resetAllMocks());

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
