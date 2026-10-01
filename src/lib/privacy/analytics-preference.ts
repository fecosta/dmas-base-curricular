import "server-only";

import { requireAccess } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";

/**
 * The authoritative optional-analytics preference boundary.
 *
 * Browser-local state is never the source of truth: every read and every write
 * goes through the authenticated database row owned by the user, as required by
 * `docs/PRIVACY_AND_DATA_COLLECTION.md` §19.
 *
 * Privacy fails closed here. `undecided` and `rejected` are distinct product
 * states, but every state other than a successfully persisted `accepted` leaves
 * analytics OFF — including `unavailable`, which is what a failed read is.
 */

/**
 * Versions the decision is recorded against, so a later material privacy change
 * can tell which information applied when the user decided. These track the
 * authoritative documents: `docs/PRIVACY_NOTICE.md` (version 1.1) and
 * `docs/PRIVACY_AND_DATA_COLLECTION.md` (version 1.1).
 */
export const privacyNoticeVersion = "1.1";
export const consentVersion = "1.1";

export type AnalyticsDecision = "undecided" | "rejected" | "accepted";

export type AnalyticsPreference = {
  decision: AnalyticsDecision;
  /** True only for a persisted affirmative decision. */
  analyticsEnabled: boolean;
  decidedAt: string | null;
  privacyNoticeVersion: string | null;
  consentVersion: string | null;
};

export type AnalyticsPreferenceResult =
  | { status: "resolved"; preference: AnalyticsPreference }
  /** The row could not be read. Treated as analytics OFF, and not as a decision. */
  | { status: "unavailable" };

const undecided: AnalyticsPreference = {
  decision: "undecided",
  analyticsEnabled: false,
  decidedAt: null,
  privacyNoticeVersion: null,
  consentVersion: null,
};

function toPreference(row: {
  analytics_enabled: boolean;
  analytics_decided_at: string;
  privacy_notice_version: string;
  consent_version: string;
}): AnalyticsPreference {
  return {
    decision: row.analytics_enabled ? "accepted" : "rejected",
    analyticsEnabled: row.analytics_enabled,
    decidedAt: row.analytics_decided_at,
    privacyNoticeVersion: row.privacy_notice_version,
    consentVersion: row.consent_version,
  };
}

/**
 * Reads the caller's own preference. RLS restricts the row to the live eligible
 * owner, so no user id is passed: an Admin reading this reads only their own.
 */
export async function getAnalyticsPreference(): Promise<AnalyticsPreferenceResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_preferences")
    .select("analytics_enabled,analytics_decided_at,privacy_notice_version,consent_version")
    .maybeSingle();
  if (error) return { status: "unavailable" };
  // No row is the absence of a decision, which is not the same as rejection.
  return { status: "resolved", preference: data ? toPreference(data) : undecided };
}

/**
 * Persists the caller's own decision and returns the state that was actually
 * stored. A rejected write returns `unavailable`, which keeps analytics OFF
 * rather than letting an unpersisted click look like consent.
 */
export async function setAnalyticsPreference(enabled: boolean): Promise<AnalyticsPreferenceResult> {
  // Live eligibility, not a cached claim. Role is irrelevant: the preference
  // belongs to any eligible authenticated user.
  await requireAccess();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_analytics_preference", {
    requested_analytics_enabled: enabled,
    requested_privacy_notice_version: privacyNoticeVersion,
    requested_consent_version: consentVersion,
  });
  const row = data?.[0];
  if (error || !row) return { status: "unavailable" };
  return { status: "resolved", preference: toPreference(row) };
}
