/**
 * The canonical analytics contract for SPEC-008.
 *
 * This module is the only place the approved taxonomy and property vocabulary
 * are defined. It holds no provider code so it can be imported by the client
 * boundary, by instrumentation and by tests without pulling in a browser SDK.
 *
 * Nothing here may grow because an interaction exists. Adding an event or a
 * property requires a defined measurement purpose in the active SPEC.
 */

/**
 * The approved initial taxonomy. Exactly these six, each traceable to a product
 * question in SPEC-008 §7.
 */
export const analyticsEvents = [
  "library_viewed",
  "search_performed",
  "filter_applied",
  "content_opened",
  "external_reference_opened",
  "content_downloaded",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];

/** Canonical content types. A reference is its own event, not a content type. */
export const contentTypes = ["module", "material", "institution"] as const;
export type ContentType = (typeof contentTypes)[number];

/**
 * Canonical filter dimensions. `view` is deliberately absent: it chooses how
 * results are presented, not which ones there are, so it is not a filter.
 */
export const filterTypes = ["axis", "entity", "country", "theme"] as const;
export type FilterType = (typeof filterTypes)[number];

/** Environments the application distinguishes. Only production may emit. */
export type AnalyticsEnvironment = "production" | "preview" | "development" | "test";

/**
 * Pseudonymous identity and context. Deliberately no name, email,
 * organization name or organization domain: canonical identifiers answer every
 * approved question without carrying readable personal information.
 */
export type AnalyticsIdentity = {
  userId: string;
  organizationId: string;
  userRole: string;
};

/** Per-event properties, restricted to the approved vocabulary. */
export type AnalyticsProperties = {
  library_viewed: Record<string, never>;
  /*
   * No query, search_text or q. The raw text never enters analytics code at
   * all: only the shape of the outcome is reported.
   */
  search_performed: { result_count: number; has_results: boolean };
  filter_applied: { filter_type: FilterType };
  content_opened: { content_id: string; content_type: ContentType };
  /* No destination URL during the initial pilot. */
  external_reference_opened: { content_id: string; content_type: ContentType };
  /* No original filename: attachment_id identifies the file. */
  content_downloaded: { attachment_id: string; content_id: string; content_type: ContentType };
};

/**
 * Property names that must never appear in an analytics payload.
 *
 * Checked at the boundary rather than only in review: a future contributor
 * adding a convenient property should hit a failure, not a privacy incident.
 */
export const prohibitedProperties = [
  "query", "search_text", "q", "search", "term", "keyword", "keywords",
  "name", "full_name", "first_name", "last_name", "username",
  "email", "email_address", "mail",
  "organization_name", "organisation_name", "organization_domain", "domain",
  "password", "token", "access_token", "refresh_token", "secret", "credential", "jwt", "api_key",
  "title", "description", "text", "body", "content", "teaching_note", "notes", "outcome",
  "filename", "file_name", "original_filename", "attachment_name",
  "url", "href", "destination", "destination_url", "source_url", "website_url", "link",
] as const;

/**
 * True when a property name is forbidden by the data-minimization contract.
 * Matching is case-insensitive and ignores separators, so `searchText`,
 * `search-text` and `SEARCH_TEXT` are all caught.
 */
export function isProhibitedProperty(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
  return prohibitedProperties.some((forbidden) => forbidden.replace(/_/g, "") === normalized);
}

/** Every property name an approved payload may legitimately carry. */
export const approvedProperties = [
  "organization_id", "user_id", "user_role", "environment",
  "content_id", "content_type", "filter_type",
  "result_count", "has_results", "attachment_id",
] as const;
