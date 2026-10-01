import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, rpc, maybeSingle, select, from } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const select = vi.fn<(columns: string) => { maybeSingle: typeof maybeSingle }>();
  const from = vi.fn<(table: string) => { select: typeof select }>();
  return {
    requireAccess: vi.fn(),
    rpc: vi.fn<(name: string, args: Record<string, unknown>) => unknown>(),
    maybeSingle,
    select,
    from,
  };
});

vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from, rpc }) }));

import {
  consentVersion,
  getAnalyticsPreference,
  privacyNoticeVersion,
  setAnalyticsPreference,
} from "@/lib/privacy/analytics-preference";

const stored = (analytics_enabled: boolean) => ({
  analytics_enabled,
  analytics_decided_at: "2026-10-01T10:00:00Z",
  privacy_notice_version: "1.1",
  consent_version: "1.1",
  updated_at: "2026-10-01T10:00:00Z",
});

beforeEach(() => {
  vi.resetAllMocks();
  select.mockReturnValue({ maybeSingle });
  from.mockReturnValue({ select });
  requireAccess.mockResolvedValue({ userId: "user-1", role: "Contributor" });
});

describe("reading the persisted preference", () => {
  it("treats an absent row as undecided rather than as rejection", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    expect(await getAnalyticsPreference()).toEqual({
      status: "resolved",
      preference: {
        decision: "undecided",
        analyticsEnabled: false,
        decidedAt: null,
        privacyNoticeVersion: null,
        consentVersion: null,
      },
    });
  });

  it("reads a stored false as an explicit rejection that keeps analytics off", async () => {
    maybeSingle.mockResolvedValue({ data: stored(false), error: null });
    const result = await getAnalyticsPreference();

    expect(result).toMatchObject({ status: "resolved" });
    if (result.status !== "resolved") throw new Error("unreachable");
    expect(result.preference.decision).toBe("rejected");
    expect(result.preference.analyticsEnabled).toBe(false);
    // The decision metadata is what distinguishes rejected from undecided.
    expect(result.preference.decidedAt).toBe("2026-10-01T10:00:00Z");
    expect(result.preference.privacyNoticeVersion).toBe("1.1");
    expect(result.preference.consentVersion).toBe("1.1");
  });

  it("reads a stored true as acceptance", async () => {
    maybeSingle.mockResolvedValue({ data: stored(true), error: null });
    const result = await getAnalyticsPreference();

    if (result.status !== "resolved") throw new Error("unreachable");
    expect(result.preference.decision).toBe("accepted");
    expect(result.preference.analyticsEnabled).toBe(true);
  });

  /* Privacy fails closed: a failed read is not a decision, and never ON. */
  it("reports an unreadable preference as unavailable rather than inventing a decision", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { code: "42501" } });
    expect(await getAnalyticsPreference()).toEqual({ status: "unavailable" });
  });

  it("passes no user identifier, so RLS alone decides whose row is returned", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await getAnalyticsPreference();

    expect(from).toHaveBeenCalledWith("analytics_preferences");
    const [columns] = select.mock.calls[0];
    expect(columns).not.toContain("user_id");
  });
});

describe("persisting a decision", () => {
  it("records acceptance against the current privacy and consent versions", async () => {
    rpc.mockResolvedValue({ data: [stored(true)], error: null });
    const result = await setAnalyticsPreference(true);

    expect(requireAccess).toHaveBeenCalledOnce();
    // No role argument: the preference belongs to every eligible user.
    expect(requireAccess).toHaveBeenCalledWith();
    expect(rpc).toHaveBeenCalledWith("set_analytics_preference", {
      requested_analytics_enabled: true,
      requested_privacy_notice_version: privacyNoticeVersion,
      requested_consent_version: consentVersion,
    });
    expect(result).toMatchObject({ status: "resolved", preference: { decision: "accepted", analyticsEnabled: true } });
  });

  it("records rejection as a persisted negative decision", async () => {
    rpc.mockResolvedValue({ data: [stored(false)], error: null });
    const result = await setAnalyticsPreference(false);

    expect(rpc).toHaveBeenCalledWith("set_analytics_preference", expect.objectContaining({
      requested_analytics_enabled: false,
    }));
    expect(result).toMatchObject({ status: "resolved", preference: { decision: "rejected", analyticsEnabled: false } });
  });

  it("sends no subject, so an Admin has no argument for another user's row", async () => {
    rpc.mockResolvedValue({ data: [stored(true)], error: null });
    requireAccess.mockResolvedValue({ userId: "admin-1", role: "Admin" });
    await setAnalyticsPreference(true);

    const [, args] = rpc.mock.calls[0];
    expect(Object.keys(args).sort()).toEqual([
      "requested_analytics_enabled",
      "requested_consent_version",
      "requested_privacy_notice_version",
    ]);
  });

  /* An affirmative click that did not persist must never read back as ON. */
  it("fails closed when the write is rejected", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    expect(await setAnalyticsPreference(true)).toEqual({ status: "unavailable" });
  });

  it("fails closed when the write returns no stored row", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await setAnalyticsPreference(true)).toEqual({ status: "unavailable" });
  });

  it("refuses to record a decision for an identity that is no longer eligible", async () => {
    requireAccess.mockRejectedValue(new Error("redirect:/access-denied"));
    await expect(setAnalyticsPreference(true)).rejects.toThrow("redirect:/access-denied");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports the state the database actually stored, not the state requested", async () => {
    // Defensive: the stored row is authoritative, so a divergent response can
    // never present itself as the user's accepted decision.
    rpc.mockResolvedValue({ data: [stored(false)], error: null });
    const result = await setAnalyticsPreference(true);

    if (result.status !== "resolved") throw new Error("unreachable");
    expect(result.preference.analyticsEnabled).toBe(false);
    expect(result.preference.decision).toBe("rejected");
  });
});
