/**
 * Client-safe privacy contract values.
 *
 * Deliberately free of `server-only`: the privacy UX components need the
 * decision vocabulary and the document routes, and nothing here touches the
 * database, the filesystem or any credential. The server-only modules
 * (`analytics-preference.ts`, `documents.ts`) import these same values so the
 * two sides cannot drift.
 */

/**
 * `undecided` and `rejected` both mean analytics is OFF, but they are different
 * product states: one has never been asked, the other has declined.
 */
export type AnalyticsDecision = "undecided" | "rejected" | "accepted";

/** Analytics is ON only for a persisted affirmative decision. */
export function analyticsAllowed(decision: AnalyticsDecision) {
  return decision === "accepted";
}

/** The user-facing privacy document surfaces, rendered from the authoritative docs. */
export const privacyDocuments = {
  notice: { file: "PRIVACY_NOTICE.md", href: "/app/privacidad/aviso", title: "Aviso de Privacidad" },
  terms: { file: "TERMS_OF_USE.md", href: "/app/privacidad/terminos", title: "Términos de Uso" },
} as const;

export type PrivacyDocumentId = keyof typeof privacyDocuments;

/**
 * Versions the decision is recorded against, so a later material privacy change
 * can tell which information applied when the user decided. These track the
 * authoritative documents: `docs/PRIVACY_NOTICE.md` (1.2) and
 * `docs/PRIVACY_AND_DATA_COLLECTION.md` (1.1).
 *
 * `consentVersion` intentionally stays "1.1" when the Notice moves to 1.2: 1.2
 * only adds the feedback-form section, and the optional analytics processing
 * that the consent covers is unchanged. Bump it only for a material change to
 * that processing (docs/PRIVACY_UX_CONTRACT.md §20). Stored decisions recorded
 * under Notice 1.1 are not invalidated.
 */
export const privacyNoticeVersion = "1.2";
export const consentVersion = "1.1";
