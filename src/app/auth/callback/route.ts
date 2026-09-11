import { createClient } from "@/lib/supabase/server";

function redirectTo(path: "/app" | "/login?error=oauth") {
  return new Response(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return redirectTo("/login?error=oauth");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectTo("/login?error=oauth");

  return redirectTo("/app");
}
