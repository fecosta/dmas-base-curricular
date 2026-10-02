"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/boundary";
import { libraryEmissions, type LibraryReported } from "@/lib/analytics/library-events";
import type { FilterType } from "@/lib/analytics/contract";

/**
 * Emits the Library's three exploration events.
 *
 * The Library is a server-rendered, URL-driven surface, so the facts an event
 * needs are already known on the server: whether a search was applied, how
 * many results it returned, and which filter dimensions are in effect. This
 * component reports those facts. It is deliberately never given the search
 * text — see `searchApplied`.
 *
 * Nothing here depends on automatic pageviews, which are disabled precisely
 * because the Library carries the reader's query in its URL.
 *
 * Which events a render should emit is decided by `libraryEmissions`, so the
 * duplicate-suppression rules are a tested pure function rather than effect
 * bookkeeping.
 */
export function LibraryActivity({ searchApplied, resultCount, appliedFilters }: {
  /*
   * Whether a search is applied, and nothing about what it was: an opaque,
   * salted change-detection token computed on the server. The raw query never
   * crosses into client or analytics code, so there is no value here to leak,
   * redact or accidentally log.
   */
  searchApplied: string | null;
  resultCount: number;
  appliedFilters: readonly FilterType[];
}) {
  const reported = useRef<LibraryReported>(null);

  useEffect(() => {
    const result = libraryEmissions({ searchApplied, resultCount, appliedFilters }, reported.current);
    reported.current = result.reported;
    for (const { event, properties } of result.emissions) {
      // The union is discriminated, so each event keeps its own property type.
      track(event, properties as never);
    }
  }, [searchApplied, resultCount, appliedFilters]);

  return null;
}
