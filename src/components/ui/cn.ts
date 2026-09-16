/** Joins class name fragments, dropping falsy ones. No conflict resolution — order the caller's classes last. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
