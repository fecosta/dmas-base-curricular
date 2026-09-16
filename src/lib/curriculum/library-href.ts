export type LibraryQuery = { [key: string]: string | string[] | undefined };

/** Every filter dimension the library round-trips through the URL. */
export const libraryParams = ["q", "entity", "axis", "country", "theme", "view"] as const;

export type LibraryParam = (typeof libraryParams)[number];

/** Reads a single-valued search param, ignoring repeated keys. */
export function paramValue(query: LibraryQuery, key: string) {
  const current = query[key];
  return typeof current === "string" ? current : "";
}

/**
 * Rebuilds the library URL, preserving every filter the reader already applied
 * and overriding only the named ones. Both segmented controls (EJE and VISTA)
 * navigate through this, which is what keeps filters intact when either changes.
 * An override of "" clears that parameter.
 */
export function libraryHref(query: LibraryQuery, overrides: Partial<Record<LibraryParam, string>> = {}) {
  const params = new URLSearchParams();
  for (const key of libraryParams) {
    const next = key in overrides ? overrides[key] ?? "" : paramValue(query, key);
    if (next) params.set(key, next);
  }
  const search = params.toString();
  return search ? `/app/library?${search}` : "/app/library";
}
