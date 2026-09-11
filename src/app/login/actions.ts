"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getApplicationUrl, getSupabaseConfig } from "@/lib/supabase/config";
import { isEmailCode, normalizeEmail } from "@/lib/auth/validation";

export type LoginState = { email?: string; sent?: boolean; error?: string };

export async function signInWithGoogle() {
  const supabase = await createClient();
  const redirectTo = `${getApplicationUrl()}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error || !data.url) redirect("/login?error=oauth");

  let providerUrl: URL;
  try {
    providerUrl = new URL(data.url);
  } catch {
    redirect("/login?error=oauth");
  }
  const expectedUrl = new URL("/auth/v1/authorize", getSupabaseConfig().url);
  if (providerUrl.origin !== expectedUrl.origin || providerUrl.pathname !== expectedUrl.pathname) {
    redirect("/login?error=oauth");
  }
  redirect(providerUrl.toString());
}

export async function requestCode(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(form.get("email"));
  if (!email) return { error: "Introduce un correo institucional válido." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  // Do not reveal whether an identity is provisioned. Rate limiting is enforced by Auth.
  if (error && (error.code === "email_provider_disabled" || !error.status || error.status >= 500)) {
    return { error: "No pudimos enviar el código. Inténtalo de nuevo más tarde." };
  }
  return { email, sent: true };
}

export async function verifyCode(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(form.get("email"));
  const token = form.get("token");
  if (!email || !isEmailCode(token)) return { error: "Introduce el correo y el código de 6 a 8 dígitos." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: "El código no es válido o ha caducado. Solicita otro e inténtalo de nuevo." };
  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error("Sign out unavailable");
  redirect("/login");
}
