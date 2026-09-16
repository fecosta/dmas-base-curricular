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

/** Drops query/hash and any trailing slash so comparisons are stable. */
function normalize(path: string) {
  const bare = path.split(/[?#]/)[0];
  return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
}
