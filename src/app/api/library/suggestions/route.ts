import { getAccess } from "@/lib/auth/access";
import { getSearchSuggestions } from "@/lib/curriculum/queries";
import { groupSuggestions, minSuggestionQuery } from "@/lib/curriculum/suggestions";

/**
 * The authenticated server boundary for Library search suggestions.
 *
 * The curriculum query modules are `server-only`, so the Client Component that
 * renders the popover cannot reach them. This is the smallest boundary that
 * closes that gap: one authenticated GET over the search the Library already
 * performs, gated exactly like `/api/access` — eligibility is re-evaluated from
 * live persisted state on every request, never from anything the caller sends.
 *
 * It grants no new read: the RPC underneath is the reader-visible published
 * search, and the response carries only fields the results list already renders.
 */
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const access = await getAccess();
  if (access.status === "unauthenticated") return Response.json({ error: "Inicia sesión para continuar." }, { status: 401, headers });
  if (access.status === "unavailable") return Response.json({ error: "No pudimos verificar tu acceso. Inténtalo más tarde." }, { status: 503, headers });
  if (access.status === "ineligible") return Response.json({ error: "Acceso no autorizado." }, { status: 403, headers });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < minSuggestionQuery) return Response.json({ groups: [] }, { headers });

  return Response.json({ groups: groupSuggestions(await getSearchSuggestions(query)) }, { headers });
}
