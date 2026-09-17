import Link from "next/link";
import { libraryHref, paramValue, type LibraryQuery } from "@/lib/curriculum/library-href";
import { clearFiltersHref } from "@/lib/curriculum/library-state";
import { FilterChip, FilterGroup } from "@/components/ui/filter";

/**
 * The Explorer's filter dimensions, as one set of controls used by both the
 * desktop panel and the narrow-width drawer.
 *
 * Every chip is a link to the URL it produces, so there is exactly one applied
 * state and it is the one in the address bar. A selected chip points at the URL
 * without that value, which is what makes it a toggle without any client state.
 * Country and theme are single-valued in the Library contract, so choosing a
 * value replaces the previous one rather than accumulating.
 */
export function LibraryFilterGroups({ query, countries, themes }: {
  query: LibraryQuery;
  countries: readonly string[];
  themes: readonly string[];
}) {
  const country = paramValue(query, "country");
  const theme = paramValue(query, "theme");

  return <>
    <FilterGroup label="País o alcance" tone="primary" selectedCount={country ? 1 : 0}>
      <FilterChip label="Todos" href={libraryHref(query, { country: "" })} selected={!country} />
      {countries.map((option) => <FilterChip
        key={option}
        label={option}
        href={libraryHref(query, { country: option === country ? "" : option })}
        selected={option === country}
      />)}
    </FilterGroup>

    <FilterGroup label="Tema" tone="warning" selectedCount={theme ? 1 : 0}>
      <FilterChip label="Todos" href={libraryHref(query, { theme: "" })} selected={!theme} />
      {themes.map((option) => <FilterChip
        key={option}
        label={option}
        href={libraryHref(query, { theme: option === theme ? "" : option })}
        selected={option === theme}
      />)}
    </FilterGroup>
  </>;
}

/** Clears every narrowing dimension at once, keeping the reader's Grilla/Programa choice. */
export function ClearFiltersLink({ query, children, className }: {
  query: LibraryQuery;
  children: React.ReactNode;
  className?: string;
}) {
  return <Link
    href={clearFiltersHref(query)}
    prefetch={false}
    className={className ?? "text-control font-bold text-warning-ink"}
  >{children}</Link>;
}

/**
 * The persistent desktop filter column: the reference's lifted panel, sticky
 * below the application header with its own scroll so a long theme list never
 * pushes the results out of reach or slides under the header.
 */
export function LibraryFilterPanel({ query, countries, themes, hasFilters }: {
  query: LibraryQuery;
  countries: readonly string[];
  themes: readonly string[];
  hasFilters: boolean;
}) {
  return <aside
    aria-labelledby="library-filters-title"
    className="hidden explorer:sticky explorer:top-20 explorer:block explorer:max-h-[calc(100dvh-6rem)] explorer:overflow-y-auto explorer:self-start"
  >
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-panel">
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <h2 id="library-filters-title" className="flex items-center gap-2.5 text-control font-extrabold text-ink">
          <span aria-hidden="true" className="size-[18px] rounded-md bg-gradient-to-br from-primary to-accent" />
          Filtros
        </h2>
        {hasFilters && <ClearFiltersLink query={query} className="text-meta font-extrabold tracking-normal text-warning-ink">Limpiar</ClearFiltersLink>}
      </div>
      <LibraryFilterGroups query={query} countries={countries} themes={themes} />
    </div>
  </aside>;
}
