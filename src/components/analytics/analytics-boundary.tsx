"use client";

import { useEffect } from "react";
import { analyticsAllowed, type AnalyticsDecision } from "@/lib/privacy/contract";
import { disable, enable } from "@/lib/analytics/boundary";
import type { AnalyticsIdentity } from "@/lib/analytics/contract";

/**
 * Connects the resolved privacy decision to the analytics boundary.
 *
 * Renders nothing. It exists so the authenticated shell has exactly one place
 * that decides whether analytics is on, driven by the persisted preference the
 * server read — never by a click, by local storage, or by a page load.
 *
 * `decision` is already the outcome of:
 *
 *   authentication -> authorization/organization -> persisted preference
 *
 * so by the time this runs the only remaining question is whether that stored
 * decision was affirmative. Anything else disables, which also covers
 * revocation, an unreadable preference and a user who never decided.
 */
export function AnalyticsBoundary({ identity, decision }: {
  identity: AnalyticsIdentity;
  decision: AnalyticsDecision;
}) {
  const { userId, organizationId } = identity;

  useEffect(() => {
    if (!analyticsAllowed(decision)) {
      // Covers undecided, rejected, revoked and unreadable alike: no identified
      // analytics, and any previous identity is cleared.
      disable();
      return;
    }
    enable({ userId, organizationId });
    // Leaving the authenticated shell — including sign-out, which replaces it —
    // must not leave an identity behind for the next user of this browser.
    return () => disable();
  }, [decision, userId, organizationId]);

  return null;
}
