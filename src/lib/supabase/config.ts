export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing public Supabase configuration");
  // Reject modern secret keys and legacy service-role JWTs even if misconfigured.
  if (key.startsWith("sb_secret_")) throw new Error("Privileged Supabase key is not allowed");
  if (key.startsWith("eyJ")) {
    const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role !== "anon") throw new Error("Only an anon JWT is allowed");
  }
  return { url, key };
}
