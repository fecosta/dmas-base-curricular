import { entityHref } from "./library-state";

/**
 * Shape and grouping of the Library search suggestions.
 *
 * Deliberately free of server-only imports: the route handler and the Client
 * Component that renders the popover both need this contract, and the
 * curriculum query modules must not be reachable from the browser.
 */

/**
 * The published families the Library search already returns. Nothing else is a
 * searchable entity under the current contract, so nothing else is suggested.
 */
export const suggestionFamilies = [
  { entity: "module", label: "Módulos" },
  { entity: "material", label: "Materiales" },
  { entity: "institution", label: "Instituciones" },
] as const;

export type SuggestionEntity = (typeof suggestionFamilies)[number]["entity"];

/** Shortest query worth a round trip. One letter matches most of the library. */
export const minSuggestionQuery = 2;

/** Per family. Keeps the popover scannable and the response small. */
export const maxSuggestionsPerFamily = 5;

/** Exactly the columns a suggestion needs. The reader already sees all of them in the results list. */
export type SuggestionRow = {
  entity_type: string;
  id: string;
  title: string;
  classification: string;
  country_or_scope: string | null;
  theme: string | null;
};

export type Suggestion = { id: string; title: string; subtitle: string; href: string };
export type SuggestionGroup = { entity: SuggestionEntity; label: string; items: Suggestion[] };

/**
 * Groups reader-visible search rows into the Explorer's families, keeping the
 * ranking the database returned within each one and dropping empty families.
 */
export function groupSuggestions(rows: readonly SuggestionRow[]): SuggestionGroup[] {
  return suggestionFamilies
    .map(({ entity, label }) => ({
      entity,
      label,
      items: rows
        .filter((row) => row.entity_type === entity)
        .slice(0, maxSuggestionsPerFamily)
        .map((row) => ({
          id: row.id,
          title: row.title,
          // Axis for a module, type plus scope for a reference: enough to tell
          // two similarly titled records apart without a second line of prose.
          subtitle: [row.classification, row.country_or_scope ?? row.theme].filter(Boolean).join(" · "),
          href: entityHref(entity, row.id),
        })),
    }))
    .filter((group) => group.items.length > 0);
}
