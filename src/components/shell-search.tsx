"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { libraryParams } from "@/lib/curriculum/library-href";
import { isLibrarySearchPath } from "@/lib/ui/nav";
import { cn } from "@/components/ui/cn";

/**
 * The primary Library search, in the shell header where the reference puts it.
 *
 * It is a plain GET form onto the existing canonical route: submitting produces
 * `/app/library?q=…`, the same URL the Library filter form has always produced.
 * No new endpoint, no server action, no client-held applied state, and no
 * contact with the server-only curriculum query modules.
 *
 * Every other applied filter is carried through as a hidden field, read from the
 * live URL. Without that, searching from the header would silently clear the
 * country, theme, axis, entity and view the reader had already applied.
 *
 * Suggestions, and the authorized server boundary they need, are Phase 3.
 */
export function ShellSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();

  // Rendered only where a Library search is unambiguous; see isLibrarySearchPath.
  if (!isLibrarySearchPath(pathname)) return null;

  const query = params.get("q") ?? "";
  const carried = libraryParams
    .filter((param) => param !== "q")
    .map((param) => [param, params.get(param) ?? ""] as const)
    .filter(([, value]) => value !== "");

  return <form
    method="get"
    action="/app/library"
    role="search"
    className={cn("min-w-0 flex-1", className)}
  >
    {carried.map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    <SearchInput
      // Remounts when the applied query changes so the uncontrolled field keeps
      // showing what the URL actually holds after a filter navigation.
      key={query}
      label="Buscar en la biblioteca"
      name="q"
      defaultValue={query}
      placeholder="Buscar tema, docente o institución…"
    />
  </form>;
}
