import Link from "next/link";
import type { LibraryQuery } from "@/lib/curriculum/library-href";
import type { AppliedFilter } from "@/lib/curriculum/library-state";
import { ClearFiltersLink } from "./filter-panel";

/**
 * What is currently narrowing the Library, in one line above the results.
 *
 * Each chip is a link to the URL without that one value, so removal is as
 * URL-driven as application and every other filter survives it. The visible
 * label is the value; the accessible name says which dimension it belongs to and
 * that activating it removes the value.
 */
export function ActiveFilters({ filters, query }: { filters: readonly AppliedFilter[]; query: LibraryQuery }) {
  if (filters.length === 0) return null;

  return <div className="flex flex-wrap items-center gap-2">
    <span className="filter-label">Filtros activos</span>
    {filters.map((filter) => <Link
      key={filter.param}
      href={filter.href}
      prefetch={false}
      aria-label={filter.removeLabel}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-hairline-strong bg-surface px-3 py-1.5 text-control font-semibold text-ink-soft no-underline shadow-card transition-colors hover:border-primary hover:text-primary hover:no-underline"
    >
      <span className="min-w-0 truncate">{filter.label}</span>
      <span aria-hidden="true" className="text-meta tracking-normal opacity-60">✕</span>
    </Link>)}
    <ClearFiltersLink query={query}>Limpiar todo</ClearFiltersLink>
  </div>;
}
