/**
 * Governance timestamps are rendered in UTC and labelled as such.
 * The network spans several countries and the product stores no user timezone, so
 * a fixed, explicit zone is less misleading than silently using the server's.
 */
const governanceFormatter = new Intl.DateTimeFormat("es", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatGovernanceTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${governanceFormatter.format(parsed)} UTC`;
}
