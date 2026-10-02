import { filterTypes, type FilterType } from "./contract";

/**
 * Decides which Library events a render should emit.
 *
 * Extracted from the component so the duplicate-emission rules are a pure
 * function: the Library re-renders on every filter and search navigation, and
 * "emit once per visit", "once per search" and "once per newly applied
 * dimension" are the whole correctness question here. A component effect is a
 * poor place to assert that.
 */

export type LibraryState = {
  /** Opaque change-detection token, or null when no search is applied. */
  searchApplied: string | null;
  resultCount: number;
  appliedFilters: readonly FilterType[];
};

/** What was already reported, or null on the first render of a visit. */
export type LibraryReported = { search: string | null; filters: ReadonlySet<FilterType> } | null;

export type LibraryEmission =
  | { event: "library_viewed"; properties: Record<string, never> }
  | { event: "search_performed"; properties: { result_count: number; has_results: boolean } }
  | { event: "filter_applied"; properties: { filter_type: FilterType } };

export function libraryEmissions(state: LibraryState, reported: LibraryReported): {
  emissions: LibraryEmission[];
  reported: { search: string | null; filters: Set<FilterType> };
} {
  const emissions: LibraryEmission[] = [];

  // Once per visit, on first render. A filter navigation is not a new view.
  if (!reported) emissions.push({ event: "library_viewed", properties: {} });

  /*
   * A changed applied search means a search was actually run. The same token
   * across a filter navigation is the same search, so it is not re-reported;
   * clearing a search is not a search either.
   */
  if (state.searchApplied && state.searchApplied !== reported?.search) {
    emissions.push({
      event: "search_performed",
      properties: { result_count: state.resultCount, has_results: state.resultCount > 0 },
    });
  }

  // Only canonical dimensions, and only ones not already applied.
  const applied = new Set(state.appliedFilters.filter((filter) => filterTypes.includes(filter)));
  for (const filter of applied) {
    if (!reported?.filters.has(filter)) {
      emissions.push({ event: "filter_applied", properties: { filter_type: filter } });
    }
  }

  return { emissions, reported: { search: state.searchApplied, filters: applied } };
}
