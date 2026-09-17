/**
 * Marks a navigation item active for the current path.
 * Matches the item itself and anything nested below it, so a detail route keeps
 * its section highlighted, while avoiding false positives on sibling segments
 * that merely share a prefix (`/app/library` must not light up on `/app/libraryx`).
 */
export function isActiveNavPath(pathname: string | null | undefined, href: string) {
  if (!pathname) return false;
  const current = normalize(pathname);
  const target = normalize(href);
  if (!target) return false;
  return current === target || current.startsWith(`${target}/`);
}

/**
 * Whether the shell's Library search belongs on this route.
 *
 * The reference is a single-surface explorer, so its header search is
 * unambiguously the Library search. Production also serves Admin content
 * management, where a field that silently searches the published Library would
 * be ambiguous, and a development harness that owns its own search input. The
 * shell search is therefore scoped to the reader surfaces it actually acts on:
 * the application home and the Library.
 */
export function isLibrarySearchPath(pathname: string | null | undefined) {
  if (!pathname) return false;
  return normalize(pathname) === "/app" || isActiveNavPath(pathname, "/app/library");
}

/** Drops query/hash and any trailing slash so comparisons are stable. */
function normalize(path: string) {
  const bare = path.split(/[?#]/)[0];
  return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
}
