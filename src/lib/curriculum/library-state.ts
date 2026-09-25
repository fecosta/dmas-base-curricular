import { libraryHref, paramValue, type LibraryParam, type LibraryQuery } from "./library-href";

/**
 * Reading of the Library's URL state, shared by every Explorer surface.
 *
 * `libraryHref` stays the single mechanism that writes a Library URL; this
 * module only interprets one and derives the links the Explorer needs from it.
 * Nothing here holds state — the URL remains the applied-filter contract.
 */

/** Entity values the published search contract accepts. `reference` covers both reference families. */
export const libraryEntities = ["module", "reference", "material", "institution"] as const;
export type LibraryEntity = (typeof libraryEntities)[number];

export type LibraryView = "grilla" | "programa";

/**
 * Dimensions that narrow what the Library returns.
 * `view` is deliberately absent: it chooses how results are presented, not which
 * ones there are, so clearing filters must not discard it.
 */
export const narrowingParams: readonly LibraryParam[] = ["q", "entity", "axis", "country", "theme"];

const entityLabels: Record<LibraryEntity, string> = {
  module: "Módulos",
  reference: "Referencias",
  material: "Materiales",
  institution: "Instituciones",
};

export function readEntity(query: LibraryQuery): LibraryEntity | undefined {
  const value = paramValue(query, "entity");
  return (libraryEntities as readonly string[]).includes(value) ? value as LibraryEntity : undefined;
}

/** Programa is curricular module structure, so only surfaces that list modules can present it. */
export function supportsProgram(entity: LibraryEntity | undefined) {
  return entity === undefined || entity === "module";
}

/**
 * The layout actually rendered. On a reference surface `view=programa` renders
 * as Grilla without rewriting the URL, so returning to a module-capable surface
 * restores the reader's Programa layout.
 */
export function readView(query: LibraryQuery): LibraryView {
  return paramValue(query, "view") === "programa" && supportsProgram(readEntity(query)) ? "programa" : "grilla";
}

/**
 * Canonical reader destination for a published search result.
 *
 * Contextual module detail is a routing presentation, not a second address: the
 * Library intercepts this same URL rather than pointing anywhere else at it, so
 * cards, Programa rows and search suggestions all keep one destination, and a
 * copied link is the link the reader was on.
 */
export function entityHref(entityType: "module" | "material" | "institution", id: string) {
  return entityType === "module"
    ? `/app/library/modules/${id}`
    : `/app/library/references/${entityType}/${id}`;
}

/** URL that drops every narrowing dimension while keeping the reader's chosen view. */
export function clearFiltersHref(query: LibraryQuery) {
  const cleared: Partial<Record<LibraryParam, string>> = {};
  for (const param of narrowingParams) cleared[param] = "";
  return libraryHref(query, cleared);
}

export type AppliedFilter = {
  param: LibraryParam;
  /** The dimension the value belongs to, e.g. "Tema". */
  group: string;
  /** The value as the reader applied it. */
  label: string;
  /** URL with this one value removed and every other filter preserved. */
  href: string;
  /** Accessible name: the visible chip says "Participación", which alone does not say what removing it does. */
  removeLabel: string;
};

/**
 * The applied filters, in a form the Explorer can show and remove individually.
 *
 * A value whose vocabulary cannot be resolved (an axis id that no longer exists,
 * an entity outside the contract) produces no chip: it is not something the
 * reader can be shown meaningfully. Both remain clearable through their
 * segmented "Todos"/"Todo" option, which points at the same cleared URL.
 */
export function appliedFilters(
  query: LibraryQuery,
  axes: readonly { id: string; name: string }[],
): AppliedFilter[] {
  const pending: { param: LibraryParam; group: string; label: string }[] = [];

  const search = paramValue(query, "q").trim();
  if (search) pending.push({ param: "q", group: "Búsqueda", label: `«${search}»` });

  const entity = readEntity(query);
  if (entity) pending.push({ param: "entity", group: "Tipo", label: entityLabels[entity] });

  const axis = axes.find((option) => option.id === paramValue(query, "axis"));
  if (axis) pending.push({ param: "axis", group: "Eje", label: axis.name });

  const country = paramValue(query, "country");
  if (country) pending.push({ param: "country", group: "País o alcance", label: country });

  const theme = paramValue(query, "theme");
  if (theme) pending.push({ param: "theme", group: "Tema", label: theme });

  return pending.map((filter) => ({
    ...filter,
    href: libraryHref(query, { [filter.param]: "" }),
    removeLabel: `Quitar ${filter.group}: ${filter.label}`,
  }));
}
