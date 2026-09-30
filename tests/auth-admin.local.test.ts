import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { localSupabase } from "./e2e/local-supabase";

const { requireAccess } = vi.hoisted(() => ({ requireAccess: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));

import { resolveOrCreateTrustedIdentity } from "@/lib/supabase/auth-admin";

const runLocalAuthIntegration = process.env.RUN_LOCAL_AUTH_ADMIN_INTEGRATION === "1";
const suite = runLocalAuthIntegration ? describe : describe.skip;

suite("local Supabase Auth Admin integration", () => {
  const createdUserIds: string[] = [];
  let credentials: ReturnType<typeof localSupabase>;
  let operator: ReturnType<typeof createClient>;
  let trustedEmail: string;
  let untrustedEmail: string;

  beforeAll(() => {
    credentials = localSupabase();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", credentials.url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", credentials.key);
    vi.stubEnv("SUPABASE_AUTH_ADMIN_SECRET_KEY", credentials.secret);
    operator = createClient(credentials.url, credentials.secret, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    trustedEmail = `spec009-trusted-${randomUUID()}@auth-admin.test`;
    untrustedEmail = `spec009-untrusted-${randomUUID()}@auth-admin.test`;
    requireAccess.mockResolvedValue({ role: "Admin" });
  });

  afterAll(async () => {
    if (operator) {
      for (const userId of createdUserIds) await operator.auth.admin.deleteUser(userId);
    }
    vi.unstubAllEnvs();
  });

  it("creates once, safely reuses the marked identity on retry, and rejects an untrusted confirmed identity", async () => {
    const created = await resolveOrCreateTrustedIdentity(trustedEmail);
    expect(created.status).toBe("created");
    if (created.status !== "created") return;
    createdUserIds.push(created.userId);

    const retry = await resolveOrCreateTrustedIdentity(trustedEmail.toUpperCase());
    expect(retry).toEqual({ status: "reused", userId: created.userId });

    const untrusted = await operator.auth.admin.createUser({ email: untrustedEmail, email_confirm: true });
    expect(untrusted.error).toBeNull();
    expect(untrusted.data.user).toBeTruthy();
    if (!untrusted.data.user) return;
    createdUserIds.push(untrusted.data.user.id);

    await expect(resolveOrCreateTrustedIdentity(untrustedEmail)).resolves.toEqual({ status: "untrusted_identity" });
    const memberships = await operator.from("memberships").select("user_id").eq("user_id", created.userId);
    expect(memberships.error).toBeNull();
    expect(memberships.data).toEqual([]);
  });
});
