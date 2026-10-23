import { requireAccess } from "@/lib/auth/access";

// SPEC-012 AC-04: institutions have no reader page. This is a route handler
// because the segment's streaming loading.tsx boundaries commit a 200 before a
// page's notFound() runs; a handler responds with a literal 404. Same access
// gate as the authenticated layout, so unauthenticated and ineligible readers
// are redirected exactly as for any other /app route. No lookup, so nothing
// about the id (or the institution it names) is revealed.
export async function GET() {
  await requireAccess();
  return new Response("No encontramos esta publicación.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
