import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { requireAccess } from "@/lib/auth/access";
import { normalizeEmail } from "@/lib/auth/validation";
import { getSupabaseConfig } from "./config";

const TRUSTED_PROVISIONING_METADATA = "spec009_trusted_provisioning";
const AUTH_USERS_PAGE_SIZE = 1000;
const AUTH_USERS_MAX_PAGES = 100;

export type AuthIdentityProvisioningResult =
  | { status: "created" | "reused"; userId: string }
  | { status: "invalid_email" | "untrusted_identity" | "unavailable" };

type IdentityLookup =
  | { status: "found"; user: User }
  | { status: "missing" }
  | { status: "unavailable" };

function createAuthAdminOperations() {
  const key = process.env.SUPABASE_AUTH_ADMIN_SECRET_KEY;
  if (!key?.startsWith("sb_secret_")) {
    throw new Error("Missing server-only Supabase Auth Admin configuration");
  }

  const { url } = getSupabaseConfig();
  const client = createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  const authAdmin = client.auth.admin;
  return {
    listUsers: authAdmin.listUsers.bind(authAdmin),
    createUser: authAdmin.createUser.bind(authAdmin),
  };
}

function isTrustedIdentity(user: User, email: string): boolean {
  if (
    user.email?.trim().toLowerCase() !== email ||
    !user.email_confirmed_at ||
    user.deleted_at ||
    user.is_anonymous ||
    (user.banned_until && Date.parse(user.banned_until) > Date.now())
  ) {
    return false;
  }

  return (
    user.app_metadata?.[TRUSTED_PROVISIONING_METADATA] === true ||
    (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes("google"))
  );
}

async function findIdentityByEmail(
  authAdmin: ReturnType<typeof createAuthAdminOperations>,
  email: string,
): Promise<IdentityLookup> {
  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
    const { data, error } = await authAdmin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });
    if (error) return { status: "unavailable" };

    const user = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === email);
    if (user) return { status: "found", user };

    if (data.users.length < AUTH_USERS_PAGE_SIZE) {
      return { status: "missing" };
    }
  }
  return { status: "unavailable" };
}

function resultForExistingIdentity(user: User, email: string): AuthIdentityProvisioningResult {
  if (!isTrustedIdentity(user, email)) return { status: "untrusted_identity" };
  return { status: "reused", userId: user.id };
}

/** Resolve/create only the Auth identity; membership remains an independent database operation. */
export async function resolveOrCreateTrustedIdentity(
  rawEmail: unknown,
): Promise<AuthIdentityProvisioningResult> {
  await requireAccess("Admin");

  const email = normalizeEmail(rawEmail);
  if (!email) return { status: "invalid_email" };

  try {
    const authAdmin = createAuthAdminOperations();
    const existing = await findIdentityByEmail(authAdmin, email);
    if (existing.status === "unavailable") return { status: "unavailable" };
    if (existing.status === "found") return resultForExistingIdentity(existing.user, email);

    const { data, error } = await authAdmin.createUser({
      email,
      email_confirm: true,
      app_metadata: { [TRUSTED_PROVISIONING_METADATA]: true },
    });

    if (error) {
      if (error.status !== 422 || error.code !== "email_exists") {
        return { status: "unavailable" };
      }

      // Another Admin may have created this normalized address between lookup and create.
      const racedIdentity = await findIdentityByEmail(authAdmin, email);
      if (racedIdentity.status !== "found") return { status: "unavailable" };
      return resultForExistingIdentity(racedIdentity.user, email);
    }

    if (!data.user || !isTrustedIdentity(data.user, email)) {
      return { status: "unavailable" };
    }
    return { status: "created", userId: data.user.id };
  } catch {
    // Do not expose provider errors, Auth records, or credential details to callers.
    return { status: "unavailable" };
  }
}
