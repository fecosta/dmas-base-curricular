import { describe, expect, it } from "vitest";
import { librarySignals } from "@/lib/analytics/library-signals";
import { libraryEmissions, type LibraryReported, type LibraryState } from "@/lib/analytics/library-events";
import { analyticsEvents, filterTypes } from "@/lib/analytics/contract";

/*
 * The server-derived Library signals.
 *
 * This is where the raw-search prohibition is actually enforced: the query is
 * reduced to an opaque change-detection token before it can reach client or
 * analytics code, so there is no search text downstream to leak or redact.
 */

describe("search signals", () => {
  it("reports no applied search when none is present", () => {
    expect(librarySignals({}).searchApplied).toBeNull();
    expect(librarySignals({ q: "" }).searchApplied).toBeNull();
    expect(librarySignals({ q: "   " }).searchApplied).toBeNull();
  });

  it("never carries the search text, in any form", () => {
    const query = "lo que la persona escribió";
    const { searchApplied } = librarySignals({ q: query });

    expect(searchApplied).toBeTruthy();
    expect(searchApplied).not.toContain(query);
    // Not the text, nor any word of it, nor an encoding of it.
    for (const word of query.split(" ")) expect(searchApplied).not.toContain(word);
    expect(searchApplied).not.toContain(Buffer.from(query).toString("base64"));
    expect(searchApplied).not.toContain(encodeURIComponent(query));
    // An opaque short hex token, which is all change detection needs.
    expect(searchApplied).toMatch(/^[0-9a-f]{12}$/);
  });

  it("is stable for the same search, so a filter navigation is not a new search", () => {
    const first = librarySignals({ q: "democracia", country: "Chile" }).searchApplied;
    const second = librarySignals({ q: "democracia", country: "Perú" }).searchApplied;
    expect(first).toBe(second);
  });

  it("changes when the search changes, so a new search is reported once", () => {
    expect(librarySignals({ q: "democracia" }).searchApplied)
      .not.toBe(librarySignals({ q: "participación" }).searchApplied);
  });

  it("ignores surrounding whitespace, which is not a different search", () => {
    expect(librarySignals({ q: "  democracia  " }).searchApplied)
      .toBe(librarySignals({ q: "democracia" }).searchApplied);
  });

  /*
   * The token is salted per process, so it cannot become a durable pseudonym
   * for a search term across sessions, nor be matched against a precomputed
   * dictionary of likely queries.
   */
  it("is not a plain digest of the query", async () => {
    const { createHash } = await import("node:crypto");
    const unsalted = createHash("sha256").update("democracia").digest("hex").slice(0, 12);
    expect(librarySignals({ q: "democracia" }).searchApplied).not.toBe(unsalted);
  });

  it("ignores repeated query parameters rather than joining them", () => {
    // paramValue reads single-valued params only; an array must not stringify.
    const { searchApplied } = librarySignals({ q: ["uno", "dos"] });
    expect(searchApplied).toBeNull();
  });
});

describe("filter signals", () => {
  it("reports only the canonical dimensions", () => {
    const { appliedFilters } = librarySignals({
      axis: "axis-1", entity: "module", country: "Chile", theme: "Democracia",
    });
    expect(appliedFilters).toEqual([...filterTypes]);
  });

  it("reports nothing when no filter is applied", () => {
    expect(librarySignals({}).appliedFilters).toEqual([]);
    expect(librarySignals({ axis: "", theme: "   " }).appliedFilters).toEqual([]);
  });

  /* `view` chooses presentation, not which results exist, so it is no filter. */
  it("does not treat the presentation mode as a filter", () => {
    const { appliedFilters } = librarySignals({ view: "programa" });
    expect(appliedFilters).toEqual([]);
    expect(appliedFilters).not.toContain("view");
  });

  it("does not treat the search as a filter dimension", () => {
    expect(librarySignals({ q: "democracia" }).appliedFilters).toEqual([]);
  });

  it("reports each applied dimension individually", () => {
    expect(librarySignals({ country: "Chile" }).appliedFilters).toEqual(["country"]);
    expect(librarySignals({ axis: "axis-1", theme: "Democracia" }).appliedFilters).toEqual(["axis", "theme"]);
  });

  /* The dimension, not the value: no human-readable filter value is reported. */
  it("carries no filter values", () => {
    const serialized = JSON.stringify(librarySignals({ country: "Chile", theme: "Participación" }));
    expect(serialized).not.toContain("Chile");
    expect(serialized).not.toContain("Participación");
  });
});

/*
 * Which Library events a render emits.
 *
 * The Library re-renders on every filter and search navigation, so the whole
 * correctness question is suppression: a view is reported once per visit, a
 * search once per search, and a dimension once per time it becomes applied.
 */

/** Replays a sequence of Library states the way successive renders would. */
function replay(states: LibraryState[]) {
  let reported: LibraryReported = null;
  const emitted: { event: string; properties: Record<string, unknown> }[] = [];
  for (const state of states) {
    const result = libraryEmissions(state, reported);
    reported = result.reported;
    emitted.push(...result.emissions as { event: string; properties: Record<string, unknown> }[]);
  }
  return emitted;
}

const state = (overrides: Partial<LibraryState> = {}): LibraryState => ({
  searchApplied: null, resultCount: 0, appliedFilters: [], ...overrides,
});

describe("library_viewed", () => {
  it("is emitted once on arrival", () => {
    expect(replay([state()])).toEqual([{ event: "library_viewed", properties: {} }]);
  });

  it("is not re-emitted by a filter or search navigation", () => {
    const emitted = replay([
      state(),
      state({ appliedFilters: ["axis"] }),
      state({ appliedFilters: ["axis"], searchApplied: "aaa", resultCount: 3 }),
      state({ appliedFilters: ["axis", "theme"], searchApplied: "aaa", resultCount: 3 }),
    ]);
    expect(emitted.filter((entry) => entry.event === "library_viewed")).toHaveLength(1);
  });

  it("carries no properties beyond the context the boundary adds", () => {
    expect(replay([state()])[0].properties).toEqual({});
  });
});

describe("search_performed", () => {
  it("is emitted with the outcome once a search is applied", () => {
    const emitted = replay([state({ searchApplied: "tok1", resultCount: 7 })]);
    expect(emitted).toContainEqual({
      event: "search_performed", properties: { result_count: 7, has_results: true },
    });
  });

  it("reports an empty result set as a search with no results", () => {
    const emitted = replay([state({ searchApplied: "tok1", resultCount: 0 })]);
    expect(emitted).toContainEqual({
      event: "search_performed", properties: { result_count: 0, has_results: false },
    });
  });

  it("is not emitted when no search is applied", () => {
    const emitted = replay([state(), state({ appliedFilters: ["country"] })]);
    expect(emitted.some((entry) => entry.event === "search_performed")).toBe(false);
  });

  /* A filter navigation carries the same search; it is not a new search. */
  it("is not re-emitted while the same search stays applied", () => {
    const emitted = replay([
      state({ searchApplied: "tok1", resultCount: 4 }),
      state({ searchApplied: "tok1", resultCount: 2, appliedFilters: ["country"] }),
      state({ searchApplied: "tok1", resultCount: 1, appliedFilters: ["country", "theme"] }),
    ]);
    expect(emitted.filter((entry) => entry.event === "search_performed")).toHaveLength(1);
  });

  it("is emitted again for a genuinely different search", () => {
    const emitted = replay([
      state({ searchApplied: "tok1", resultCount: 4 }),
      state({ searchApplied: "tok2", resultCount: 9 }),
    ]);
    const searches = emitted.filter((entry) => entry.event === "search_performed");
    expect(searches).toHaveLength(2);
    expect(searches[1].properties).toEqual({ result_count: 9, has_results: true });
  });

  it("is not emitted when a search is cleared", () => {
    const emitted = replay([
      state({ searchApplied: "tok1", resultCount: 4 }),
      state({ searchApplied: null, resultCount: 20 }),
    ]);
    expect(emitted.filter((entry) => entry.event === "search_performed")).toHaveLength(1);
  });

  it("never carries the query, only its outcome", () => {
    const emitted = replay([state({ searchApplied: "tok1", resultCount: 3 })]);
    const search = emitted.find((entry) => entry.event === "search_performed")!;
    expect(Object.keys(search.properties).sort()).toEqual(["has_results", "result_count"]);
    // Not even the change-detection token is reported.
    expect(JSON.stringify(search.properties)).not.toContain("tok1");
  });
});

describe("filter_applied", () => {
  it("is emitted per dimension that becomes applied", () => {
    const emitted = replay([state({ appliedFilters: ["axis", "theme"] })]);
    expect(emitted).toContainEqual({ event: "filter_applied", properties: { filter_type: "axis" } });
    expect(emitted).toContainEqual({ event: "filter_applied", properties: { filter_type: "theme" } });
  });

  it("is not re-emitted while a dimension stays applied", () => {
    const emitted = replay([
      state({ appliedFilters: ["axis"] }),
      state({ appliedFilters: ["axis"] }),
      state({ appliedFilters: ["axis", "country"] }),
    ]);
    const filters = emitted.filter((entry) => entry.event === "filter_applied");
    expect(filters.map((entry) => entry.properties.filter_type)).toEqual(["axis", "country"]);
  });

  it("is emitted again when a dimension is removed and re-applied", () => {
    const emitted = replay([
      state({ appliedFilters: ["theme"] }),
      state({ appliedFilters: [] }),
      state({ appliedFilters: ["theme"] }),
    ]);
    expect(emitted.filter((entry) => entry.event === "filter_applied")).toHaveLength(2);
  });

  it("reports the dimension and never a value", () => {
    const emitted = replay([state({ appliedFilters: ["country"] })]);
    const filter = emitted.find((entry) => entry.event === "filter_applied")!;
    expect(Object.keys(filter.properties)).toEqual(["filter_type"]);
  });

  it("ignores anything outside the canonical dimensions", () => {
    // "view" is not a filter; a non-canonical value must not become an event.
    const emitted = replay([state({ appliedFilters: ["view", "axis"] as unknown as LibraryState["appliedFilters"] })]);
    const filters = emitted.filter((entry) => entry.event === "filter_applied");
    expect(filters.map((entry) => entry.properties.filter_type)).toEqual(["axis"]);
  });
});

describe("the Library emits only canonical events", () => {
  it("uses no event outside the approved taxonomy", () => {
    const emitted = replay([
      state(),
      state({ searchApplied: "tok1", resultCount: 5, appliedFilters: [...filterTypes] }),
    ]);
    for (const { event } of emitted) expect(analyticsEvents).toContain(event);
  });

  it("emits no click-level or session event", () => {
    const emitted = replay([state({ searchApplied: "tok1", resultCount: 1, appliedFilters: ["axis"] })]);
    const names = emitted.map((entry) => entry.event);
    for (const forbidden of ["session_started", "search_result_selected", "card_clicked", "button_clicked"]) {
      expect(names).not.toContain(forbidden);
    }
  });
});
