import { afterEach, expect, it, vi } from "vitest";
import { getApplicationUrl, getSupabaseConfig } from "@/lib/supabase/config";

afterEach(() => vi.unstubAllEnvs());

it("requires explicit project configuration", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  expect(getSupabaseConfig).toThrow("Missing public Supabase configuration");
});

it("rejects privileged key types", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_test-not-a-real-key");
  expect(getSupabaseConfig).toThrow("Privileged Supabase key is not allowed");
  const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", `${header}.${payload}.test-only`);
  expect(getSupabaseConfig).toThrow("Only an anon JWT is allowed");
});

it("accepts browser-safe publishable configuration", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test-not-a-real-key");
  expect(getSupabaseConfig()).toEqual({ url: "https://project.supabase.co", key: "sb_publishable_test-not-a-real-key" });
});

it("accepts only an application origin suitable for OAuth callbacks", () => {
  vi.stubEnv("APP_URL", "https://base.example.org");
  expect(getApplicationUrl()).toBe("https://base.example.org");
  vi.stubEnv("APP_URL", "https://base.example.org/untrusted-path");
  expect(getApplicationUrl).toThrow("Invalid application URL");
  vi.stubEnv("APP_URL", "http://base.example.org");
  expect(getApplicationUrl).toThrow("Invalid application URL");
  vi.stubEnv("APP_URL", "http://127.0.0.1:3000");
  expect(getApplicationUrl()).toBe("http://127.0.0.1:3000");
});
