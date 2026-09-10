import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Role = Database["public"]["Enums"]["product_role"];
export type AccessContext = {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: Role;
};
export type AccessResult =
  | { status: "eligible"; context: AccessContext }
  | { status: "unauthenticated" }
  | { status: "ineligible" }
  | { status: "unavailable" };

export async function getAccess(): Promise<AccessResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { status: "unauthenticated" };
  if (!user.email || !user.email_confirmed_at) return { status: "ineligible" };

  // No user/organization/role arguments: the database uses auth.uid() and live rows.
  const { data, error } = await supabase.rpc("current_access");
  if (error) return { status: "unavailable" };
  const access = data?.[0];
  if (!access || access.user_id !== user.id || !["Contributor", "Admin"].includes(access.role)) {
    return { status: "ineligible" };
  }
  return { status: "eligible", context: {
    userId: user.id,
    email: user.email,
    organizationId: access.organization_id,
    organizationName: access.organization_name,
    role: access.role,
  } };
}

export async function requireAccess(role?: Role): Promise<AccessContext> {
  const result = await getAccess();
  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "unavailable") throw new Error("Access lookup unavailable");
  if (result.status !== "eligible") redirect("/access-denied");
  if (role && result.context.role !== role) redirect("/access-denied");
  return result.context;
}
