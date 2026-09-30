import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { requireAccess, createSupabaseClient, listUsers, createUser } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  createSupabaseClient: vi.fn(),
  listUsers: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@supabase/supabase-js", () => ({ createClient: createSupabaseClient }));

import { resolveOrCreateTrustedIdentity } from "@/lib/supabase/auth-admin";

type TestAuthUser = {
  id: string;
  email: string;
  email_confirmed_at?: string;
  app_metadata: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

const trustedUser = (email: string, id = "trusted-user"): TestAuthUser => ({
  id,
  email,
  email_confirmed_at: "2026-09-01T00:00:00.000Z",
  app_metadata: { providers: ["email"], spec009_trusted_provisioning: true },
});

function authPage(users: Array<ReturnType<typeof trustedUser>>, lastPage = 1) {
  return { data: { users, lastPage }, error: null };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("SUPABASE_AUTH_ADMIN_SECRET_KEY", "sb_secret_server-only-test");
  requireAccess.mockResolvedValue({ role: "Admin" });
  listUsers.mockResolvedValue(authPage([]));
  createUser.mockResolvedValue({ data: { user: trustedUser("new@partner.test") }, error: null });
  createSupabaseClient.mockReturnValue({ auth: { admin: { listUsers, createUser } } });
});

afterEach(() => vi.unstubAllEnvs());

it("checks live Admin access before creating the Auth Admin client", async () => {
  requireAccess.mockRejectedValue(new Error("redirect:/access-denied"));

  await expect(resolveOrCreateTrustedIdentity("new@partner.test")).rejects.toThrow("redirect:/access-denied");

  expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
  expect(createSupabaseClient).not.toHaveBeenCalled();
  expect(listUsers).not.toHaveBeenCalled();
});

it.each(["redirect:/login", "redirect:/access-denied"])("denies non-Admin requests before Auth Admin access (%s)", async (denial) => {
  requireAccess.mockRejectedValue(new Error(denial));

  await expect(resolveOrCreateTrustedIdentity("new@partner.test")).rejects.toThrow(denial);

  expect(createSupabaseClient).not.toHaveBeenCalled();
  expect(listUsers).not.toHaveBeenCalled();
  expect(createUser).not.toHaveBeenCalled();
});

it("rejects invalid email before contacting Supabase Auth", async () => {
  await expect(resolveOrCreateTrustedIdentity("not-an-email")).resolves.toEqual({ status: "invalid_email" });

  expect(requireAccess).toHaveBeenCalledExactlyOnceWith("Admin");
  expect(createSupabaseClient).not.toHaveBeenCalled();
});

it("reuses a confirmed trusted Admin-provisioned identity without duplicating it", async () => {
  listUsers.mockResolvedValueOnce(authPage([trustedUser("Member@Partner.Test", "existing-user")]));

  await expect(resolveOrCreateTrustedIdentity(" MEMBER@PARTNER.TEST ")).resolves.toEqual({
    status: "reused",
    userId: "existing-user",
  });

  expect(createSupabaseClient).toHaveBeenCalledExactlyOnceWith("http://127.0.0.1:55321", "sb_secret_server-only-test", {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  expect(listUsers).toHaveBeenCalledExactlyOnceWith({ page: 1, perPage: 1000 });
  expect(createUser).not.toHaveBeenCalled();
});

it("reuses confirmed Google identities, but rejects unconfirmed or unexplained identities", async () => {
  listUsers
    .mockResolvedValueOnce(authPage([{
      ...trustedUser("google@partner.test", "google-user"),
      app_metadata: { provider: "google", providers: ["google"] },
    }]))
    .mockResolvedValueOnce(authPage([{
      ...trustedUser("untrusted@partner.test", "untrusted-user"),
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: { spec009_trusted_provisioning: true },
    }]))
    .mockResolvedValueOnce(authPage([{
      ...trustedUser("unconfirmed@partner.test", "unconfirmed-user"),
      email_confirmed_at: undefined,
      app_metadata: { provider: "google", providers: ["google"] },
    }]));

  await expect(resolveOrCreateTrustedIdentity("google@partner.test")).resolves.toEqual({ status: "reused", userId: "google-user" });
  await expect(resolveOrCreateTrustedIdentity("untrusted@partner.test")).resolves.toEqual({ status: "untrusted_identity" });
  await expect(resolveOrCreateTrustedIdentity("unconfirmed@partner.test")).resolves.toEqual({ status: "untrusted_identity" });
  expect(createUser).not.toHaveBeenCalled();
});

it("creates a confirmed identity without setting a password and marks trusted provisioning in Auth app metadata", async () => {
  createUser.mockResolvedValueOnce({ data: { user: trustedUser("new@partner.test", "new-user") }, error: null });

  await expect(resolveOrCreateTrustedIdentity("NEW@partner.test")).resolves.toEqual({ status: "created", userId: "new-user" });

  expect(createUser).toHaveBeenCalledExactlyOnceWith({
    email: "new@partner.test",
    email_confirm: true,
    app_metadata: { spec009_trusted_provisioning: true },
  });
  expect(createUser.mock.calls[0][0]).not.toHaveProperty("password");
});

it("searches Auth identities through bounded pages", async () => {
  const firstPage = Array.from({ length: 1000 }, (_, index) => trustedUser(`person-${index}@partner.test`));
  listUsers.mockResolvedValueOnce(authPage(firstPage, 1)).mockResolvedValueOnce(authPage([trustedUser("member@partner.test", "page-two-user")], 1));

  await expect(resolveOrCreateTrustedIdentity("member@partner.test")).resolves.toEqual({
    status: "reused",
    userId: "page-two-user",
  });

  expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 });
  expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 });
});

it("resolves create races by re-reading the normalized existing identity", async () => {
  listUsers.mockResolvedValueOnce(authPage([])).mockResolvedValueOnce(authPage([trustedUser("same@partner.test", "raced-user")]));
  createUser.mockResolvedValueOnce({ data: { user: null }, error: { status: 422, code: "email_exists" } });

  await expect(resolveOrCreateTrustedIdentity("same@partner.test")).resolves.toEqual({ status: "reused", userId: "raced-user" });

  expect(createUser).toHaveBeenCalledTimes(1);
  expect(listUsers).toHaveBeenCalledTimes(2);
});

it("fails closed without exposing Auth provider errors", async () => {
  listUsers.mockResolvedValueOnce({ data: { users: [] }, error: { status: 503, message: "private provider details" } });

  await expect(resolveOrCreateTrustedIdentity("member@partner.test")).resolves.toEqual({ status: "unavailable" });
  expect(createUser).not.toHaveBeenCalled();
});

it("fails closed when the server-only key is missing or not a modern secret key", async () => {
  vi.stubEnv("SUPABASE_AUTH_ADMIN_SECRET_KEY", "");
  await expect(resolveOrCreateTrustedIdentity("member@partner.test")).resolves.toEqual({ status: "unavailable" });
  expect(createSupabaseClient).not.toHaveBeenCalled();

  vi.stubEnv("SUPABASE_AUTH_ADMIN_SECRET_KEY", "sb_publishable_not-privileged");
  await expect(resolveOrCreateTrustedIdentity("member@partner.test")).resolves.toEqual({ status: "unavailable" });
  expect(createSupabaseClient).not.toHaveBeenCalled();
});
