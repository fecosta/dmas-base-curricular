import { getAccess } from "@/lib/auth/access";

export async function GET() {
  const access = await getAccess();
  const headers = { "Cache-Control": "private, no-store" };
  if (access.status === "unauthenticated") return Response.json({ error: "Inicia sesión para continuar." }, { status: 401, headers });
  if (access.status === "unavailable") return Response.json({ error: "No pudimos verificar tu acceso. Inténtalo más tarde." }, { status: 503, headers });
  if (access.status === "ineligible") return Response.json({ error: "Acceso no autorizado." }, { status: 403, headers });
  return Response.json(access.context, { headers });
}
