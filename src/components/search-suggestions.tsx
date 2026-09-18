"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { minSuggestionQuery, type Suggestion, type SuggestionGroup } from "@/lib/curriculum/suggestions";

/** Keystrokes settle before a request goes out. */
const DEBOUNCE_MS = 200;

/** Stable identity, so "no suggestions" does not look like a new list on every render. */
const NONE: SuggestionGroup[] = [];

/**
 * What the reader may be shown for `term`, given the last answer that arrived.
 *
 * An answer belongs to the exact term it was fetched for. While a newer term is
 * still settling, the caller therefore gets no groups rather than the previous
 * term's: options that describe a query the reader has already moved on from
 * must never stay visible, highlightable or actionable. `ready` says the same
 * thing from the other side — there is a settled answer for what is on screen —
 * which is what keeps a pending query from being reported as an empty result.
 *
 * Kept as a function of its inputs so the rule itself is directly testable.
 */
export function suggestionsFor(term: string, answered: { query: string; groups: SuggestionGroup[] }) {
  const current = term.length >= minSuggestionQuery && answered.query === term;
  return { groups: current ? answered.groups : NONE, ready: current };
}

/**
 * Fetches grouped suggestions for what the reader is typing.
 *
 * One request per settled query: the cleanup both cancels a pending debounce and
 * aborts an in-flight request, so a slow earlier response can never overwrite a
 * later one. What the hook hands back is then narrowed to the current query by
 * suggestionsFor, because cancelling the request does not by itself retract a
 * list that is already on screen.
 */
export function useSuggestions(query: string) {
  const term = query.trim();
  const [answered, setAnswered] = useState<{ query: string; groups: SuggestionGroup[] }>({ query: "", groups: [] });

  useEffect(() => {
    if (term.length < minSuggestionQuery) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/library/suggestions?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        // A 401/403 means the session is no longer eligible. Suggestions are an
        // enhancement, so this stays silent; the page itself is the surface that
        // reports lost access.
        const payload = response.ok ? await response.json() : { groups: [] };
        setAnswered({ query: term, groups: Array.isArray(payload.groups) ? payload.groups : [] });
      } catch {
        // Aborted, offline, or malformed: keep whatever is already on screen.
      }
    }, DEBOUNCE_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term]);

  return suggestionsFor(term, answered);
}

export function suggestionItems(groups: readonly SuggestionGroup[]): Suggestion[] {
  return groups.flatMap((group) => group.items);
}

/**
 * The reference's grouped search popover.
 *
 * Options are real links to the canonical detail routes, so they keep the
 * browser affordances a suggestion list usually throws away, while `role`,
 * `aria-selected` and the caller's `aria-activedescendant` give the combobox the
 * semantics assistive technology expects. Keyboard movement lives with the
 * input, which is where focus stays.
 */
export function SuggestionPopover({ id, groups, ready, query, activeIndex, optionId, onSelect }: {
  id: string;
  groups: readonly SuggestionGroup[];
  ready: boolean;
  query: string;
  activeIndex: number;
  optionId: (index: number) => string;
  onSelect: () => void;
}) {
  // Where each family starts in the flat option order the arrow keys walk.
  const offsets = groups.map((_, position) =>
    groups.slice(0, position).reduce((total, group) => total + group.items.length, 0));

  return <div
    id={id}
    role="listbox"
    aria-label="Sugerencias de búsqueda"
    className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[58vh] animate-panel-in overflow-y-auto rounded-lg border border-hairline bg-surface p-2 shadow-overlay"
  >
    {groups.map((group, position) => <div key={group.entity} role="group" aria-labelledby={`${id}-${group.entity}`}>
      <p id={`${id}-${group.entity}`} className="eyebrow px-2 pb-1 pt-2">{group.label}</p>
      {group.items.map((item, offset) => {
        const index = offsets[position] + offset;
        const active = index === activeIndex;
        return <Link
          key={`${group.entity}-${item.id}`}
          id={optionId(index)}
          role="option"
          aria-selected={active}
          href={item.href}
          prefetch={false}
          // Keeps focus in the input so the popover is not torn down by the
          // blur before the click lands.
          onMouseDown={(event) => event.preventDefault()}
          onClick={onSelect}
          className={cn(
            "flex flex-col gap-0.5 rounded-md px-2 py-2 no-underline transition-colors hover:no-underline",
            active ? "bg-inset" : "hover:bg-inset",
          )}
        >
          <span className="truncate text-control font-bold text-ink">{item.title}</span>
          {item.subtitle && <span className="truncate text-meta tracking-normal text-label">{item.subtitle}</span>}
        </Link>;
      })}
    </div>)}

    {ready && groups.length === 0 && <p className="px-2 py-3 text-control text-ink-muted">
      Sin sugerencias para «{query}». Pulse Intro para buscar en la biblioteca.
    </p>}
  </div>;
}
