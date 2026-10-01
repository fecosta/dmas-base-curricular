"use server";

import { revalidatePath } from "next/cache";
import { setAnalyticsPreference } from "@/lib/privacy/analytics-preference";
import type { AnalyticsDecision } from "@/lib/privacy/contract";

export type PreferenceState = {
  /** The decision actually persisted, as read back from the database. */
  decision?: AnalyticsDecision;
  error?: string;
};

/**
 * Records the authenticated user's own analytics decision.
 *
 * The returned state reflects what was persisted, never what was clicked: if
 * the write fails the action reports an error and the caller keeps showing the
 * previous state, so an unpersisted click can never present itself as consent.
 */
async function record(enabled: boolean): Promise<PreferenceState> {
  let result;
  try {
    result = await setAnalyticsPreference(enabled);
  } catch (error) {
    // A redirect from the eligibility check must reach the framework.
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: "No pudimos guardar tu preferencia. Inténtalo de nuevo." };
  }
  if (result.status !== "resolved") {
    return { error: "No pudimos guardar tu preferencia. Inténtalo de nuevo." };
  }
  // The privacy surfaces are server-rendered from the persisted row.
  revalidatePath("/app", "layout");
  return { decision: result.preference.decision };
}

export async function acceptAnalyticsAction(): Promise<PreferenceState> {
  return record(true);
}

export async function rejectAnalyticsAction(): Promise<PreferenceState> {
  return record(false);
}
