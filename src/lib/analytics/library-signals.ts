import { createHash } from "node:crypto";
import { paramValue, type LibraryQuery } from "@/lib/curriculum/library-href";
import { filterTypes, type FilterType } from "./contract";

/**
 * Derives the Library's analytics signals from its URL state, on the server,
 * without carrying any search text into client or analytics code.
 *
 * The search is reduced here to an opaque, non-reversible token whose only
 * purpose is change detection: it tells the client component whether the
 * applied search differs from the previous one, so `search_performed` is
 * emitted once per search rather than on every filter navigation. The token is
 * never sent anywhere — it is not an analytics property — and it is salted per
 * process so it cannot be compared across sessions or users, nor matched
 * against a precomputed dictionary of likely queries.
 */

/**
 * Per-process salt. Regenerated on every start, which is deliberate: a stable
 * salt would make the token a durable pseudonym for a search term.
 */
const salt = createHash("sha256")
  .update(`${process.pid}:${Date.now()}:${Math.random()}`)
  .digest("hex");

export type LibrarySignals = {
  /** An opaque change-detection token, or null when no search is applied. */
  searchApplied: string | null;
  appliedFilters: FilterType[];
};

/**
 * `entity` is a canonical filter dimension; `view` is not, because it chooses
 * how results are presented rather than which results there are.
 */
const filterParams: Record<FilterType, string> = {
  axis: "axis",
  entity: "entity",
  country: "country",
  theme: "theme",
};

export function librarySignals(query: LibraryQuery): LibrarySignals {
  const search = paramValue(query, "q").trim();

  return {
    searchApplied: search
      // Truncated to 12 hex characters: enough to distinguish one applied
      // search from another, far too little to attack the preimage usefully.
      ? createHash("sha256").update(`${salt}:${search}`).digest("hex").slice(0, 12)
      : null,
    appliedFilters: filterTypes.filter((filter) => paramValue(query, filterParams[filter]).trim() !== ""),
  };
}
