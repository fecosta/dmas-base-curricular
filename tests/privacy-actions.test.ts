import { beforeEach, describe, expect, it, vi } from "vitest";

const { setAnalyticsPreference, revalidatePath } = vi.hoisted(() => ({
  setAnalyticsPreference: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/privacy/analytics-preference", () => ({ setAnalyticsPreference }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { acceptAnalyticsAction, rejectAnalyticsAction } from "@/app/app/privacidad/actions";

const resolved = (enabled: boolean) => ({
  status: "resolved" as const,
  preference: {
    decision: enabled ? ("accepted" as const) : ("rejected" as const),
    analyticsEnabled: enabled,
    decidedAt: "2026-10-01T10:00:00Z",
    privacyNoticeVersion: "1.1",
    consentVersion: "1.1",
  },
});

beforeEach(() => vi.resetAllMocks());

describe("recording an analytics decision", () => {
  it("persists acceptance and reports the stored decision", async () => {
    setAnalyticsPreference.mockResolvedValue(resolved(true));
    expect(await acceptAnalyticsAction()).toEqual({ decision: "accepted" });
    expect(setAnalyticsPreference).toHaveBeenCalledWith(true);
  });

  it("persists rejection and reports the stored decision", async () => {
    setAnalyticsPreference.mockResolvedValue(resolved(false));
    expect(await rejectAnalyticsAction()).toEqual({ decision: "rejected" });
    expect(setAnalyticsPreference).toHaveBeenCalledWith(false);
  });

  it("revalidates the authenticated shell so the surfaces re-read the row", async () => {
    setAnalyticsPreference.mockResolvedValue(resolved(true));
    await acceptAnalyticsAction();
    expect(revalidatePath).toHaveBeenCalledWith("/app", "layout");
  });

  /*
   * Privacy fails closed. An affirmative click whose write did not land must
   * report an error and no decision, so nothing downstream can read it as
   * consent.
   */
  it("reports no decision when the write is unavailable", async () => {
    setAnalyticsPreference.mockResolvedValue({ status: "unavailable" });
    const state = await acceptAnalyticsAction();

    expect(state.decision).toBeUndefined();
    expect(state.error).toBe("No pudimos guardar tu preferencia. Inténtalo de nuevo.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("reports no decision when the write throws", async () => {
    setAnalyticsPreference.mockRejectedValue(new Error("network down"));
    const state = await acceptAnalyticsAction();

    expect(state.decision).toBeUndefined();
    expect(state.error).toBeTruthy();
  });

  it("does not leak the underlying failure to the user", async () => {
    setAnalyticsPreference.mockRejectedValue(new Error("postgres: permission denied for relation"));
    const state = await acceptAnalyticsAction();
    expect(state.error).not.toContain("postgres");
    expect(state.error).not.toContain("permission denied");
  });

  /* A redirect from the eligibility check must reach the framework. */
  it("rethrows a framework redirect rather than reporting it as a save failure", async () => {
    const redirect = Object.assign(new Error("redirect"), { digest: "NEXT_REDIRECT;replace;/login;307;" });
    setAnalyticsPreference.mockRejectedValue(redirect);
    await expect(acceptAnalyticsAction()).rejects.toBe(redirect);
  });

  it("reports the decision the database stored even if it differs from the request", async () => {
    setAnalyticsPreference.mockResolvedValue(resolved(false));
    expect(await acceptAnalyticsAction()).toEqual({ decision: "rejected" });
  });
});
