import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsActive, configureAnalyticsForTest, disable, enable, track } from "@/lib/analytics/boundary";
import { analyticsEnvironmentAllowed, postHogCaptureUrl, postHogProjectKey, resolveEnvironment } from "@/lib/analytics/config";
import { analyticsEvents } from "@/lib/analytics/contract";

const a = "11111111-1111-4111-8111-111111111111";
const b = "22222222-2222-4222-8222-222222222222";
const orgA = "33333333-3333-4333-8333-333333333333";
const orgB = "44444444-4444-4444-8444-444444444444";
const identity = { userId: a, organizationId: orgA };
const env = (values: Record<string, string | undefined>) => values as NodeJS.ProcessEnv;
const production = env({ NEXT_PUBLIC_VERCEL_ENV: "production", NEXT_PUBLIC_POSTHOG_KEY: "phc_test" });
const fetcher = vi.fn<typeof fetch>(async () => new Response("not JSON", { status: 200 }));
const emit = (event: string, props: unknown = {}) => (track as (event: string, props: unknown) => void)(event, props);
const bodies = () => fetcher.mock.calls.map(([, init]) => JSON.parse(init!.body as string));

beforeEach(() => { vi.useRealTimers(); fetcher.mockReset().mockResolvedValue(new Response("not JSON")); configureAnalyticsForTest({ env: production, fetch: fetcher }); });

describe("consent and isolation", () => {
  it("drops undecided, rejected, revoked and OFF-period events without replay", () => {
    emit("library_viewed"); disable(); emit("library_viewed");
    enable(identity); emit("library_viewed"); disable(); emit("library_viewed");
    enable(identity); emit("library_viewed");
    expect(bodies().map((x) => x.event)).toEqual(["library_viewed", "library_viewed"]);
  });
  it("isolates A, B and same-user return without stored analytics identity", () => {
    enable(identity); emit("library_viewed"); disable();
    enable({ userId: b, organizationId: orgB }); emit("library_viewed"); disable();
    enable(identity); emit("library_viewed");
    expect(bodies().map((x) => [x.distinct_id, x.properties.organization_id])).toEqual([[a, orgA], [b, orgB], [a, orgA]]);
  });
  it("invalid identity fails closed", () => {
    enable({ userId: "email@example.org", organizationId: orgA }); emit("library_viewed");
    expect(fetcher).not.toHaveBeenCalled(); expect(analyticsActive()).toBe(false);
  });
});

describe("closed event schemas", () => {
  it("accepts exactly six event names with exact provider envelope", () => {
    const examples: Record<string, object> = {
      library_viewed: {}, search_performed: { result_count: 2, has_results: true },
      filter_applied: { filter_type: "theme" }, content_opened: { content_id: a, content_type: "module" },
      external_reference_opened: { content_id: a, content_type: "material" },
      content_downloaded: { attachment_id: b, content_id: a, content_type: "institution" },
    };
    enable(identity);
    for (const name of analyticsEvents) emit(name, examples[name]);
    expect(bodies()).toEqual(analyticsEvents.map((name) => ({ api_key: "phc_test", event: name,
      distinct_id: a, timestamp: expect.any(String), properties: { "$process_person_profile": false,
        organization_id: orgA, environment: "production", ...examples[name] } })));
    expect(Object.keys(bodies()[0])).toEqual(["api_key", "event", "distinct_id", "timestamp", "properties"]);
    expect(Number.isNaN(Date.parse(bodies()[0].timestamp))).toBe(false);
  });
  it("rejects malformed names, prototypes, accessors, arrays, fields, IDs, counts and enums", () => {
    enable(identity);
    const getter = Object.defineProperty({}, "filter_type", { enumerable: true, get: () => "theme" });
    const bad: [unknown, unknown][] = [
      ["constructor", {}], ["toString", {}], ["$identify", {}], ["library_viewed", { extra: "value" }],
      ["library_viewed", []], ["library_viewed", Object.create({ inherited: 1 })],
      ["filter_applied", getter], ["filter_applied", { filter_type: "view" }],
      ["content_opened", { content_id: "not-uuid", content_type: "module" }],
      ["content_opened", { content_id: a, content_type: "teaching_note" }],
      ["content_downloaded", { attachment_id: "a1", content_id: a, content_type: "module" }],
      ["search_performed", { result_count: -1, has_results: false }],
      ["search_performed", { result_count: 1.5, has_results: true }],
      ["search_performed", { result_count: 0, has_results: true }],
      ["search_performed", { result_count: 2, has_results: false }],
      ["search_performed", { result_count: "2", has_results: true }],
      ["library_viewed", null], ["library_viewed", "text"],
    ];
    for (const [name, props] of bad) emit(name as string, props);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects all prohibited data categories even when accompanying valid fields", () => {
    enable(identity);
    for (const property of ["query", "normalized_query", "query_hash", "name", "email", "organization_name",
      "organization_domain", "teaching_note", "private_content", "filename", "external_url", "$current_url",
      "$referrer", "pathname", "utm_source", "password", "access_token", "authorization", "device_id",
      "anonymous_id", "session_id", "window_id", "screen_width", "timezone", "browser", "os", "geoip_country",
      "$set", "$set_once", "$unset", "$groups", "user_id", "user_role"]) {
      emit("search_performed", { result_count: 1, has_results: true, [property]: "sensitive" });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("transport and failures", () => {
  it("dispatches once per call with no cookies, referrer, keepalive or response parsing", async () => {
    enable(identity); emit("library_viewed");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][0]).toBe(postHogCaptureUrl);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "omit", referrerPolicy: "no-referrer",
      cache: "no-store", keepalive: false, headers: { "Content-Type": "text/plain" }, signal: expect.any(AbortSignal) });
    await Promise.resolve(); await Promise.resolve();
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it.each([400, 429, 500, 200])("drops HTTP %i or malformed response without retry", async (status) => {
    fetcher.mockResolvedValueOnce(new Response("malformed", { status })); enable(identity); emit("library_viewed");
    await Promise.resolve(); await Promise.resolve(); expect(fetcher).toHaveBeenCalledOnce();
  });
  it("drops network failure and synchronous dispatch failure", async () => {
    fetcher.mockRejectedValueOnce(new Error("offline")); enable(identity); emit("library_viewed");
    fetcher.mockImplementationOnce(() => { throw new Error("blocked"); }); emit("library_viewed");
    await Promise.resolve(); await Promise.resolve(); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("aborts concurrent requests on revoke; stale completion cannot affect B", async () => {
    const pending: (() => void)[] = [];
    fetcher.mockImplementation(() => new Promise((resolve) => pending.push(() => resolve(new Response("ok")))));
    enable(identity); emit("library_viewed"); emit("library_viewed");
    const oldSignals = fetcher.mock.calls.map(([, init]) => init!.signal as AbortSignal);
    disable(); expect(oldSignals.every((signal) => signal.aborted)).toBe(true);
    enable({ userId: b, organizationId: orgB }); emit("library_viewed");
    const fresh = fetcher.mock.calls[2][1]!.signal as AbortSignal;
    pending[0](); pending[1](); await Promise.resolve(); await Promise.resolve();
    expect(fresh.aborted).toBe(false); expect(bodies()[2].distinct_id).toBe(b);
    disable(); expect(fresh.aborted).toBe(true);
  });
  it("times out with no retry or replay", async () => {
    vi.useFakeTimers(); fetcher.mockImplementation(() => new Promise(() => {}));
    enable(identity); emit("library_viewed");
    const signal = fetcher.mock.calls[0][1]!.signal as AbortSignal;
    await vi.advanceTimersByTimeAsync(5000);
    expect(signal.aborted).toBe(true); expect(fetcher).toHaveBeenCalledOnce();
    disable();
  });
  it("an old generation timeout cannot abort a new user's request", async () => {
    vi.useFakeTimers(); fetcher.mockImplementation(() => new Promise(() => {}));
    enable(identity); emit("library_viewed");
    await vi.advanceTimersByTimeAsync(2500);
    disable(); enable({ userId: b, organizationId: orgB }); emit("library_viewed");
    const fresh = fetcher.mock.calls[1][1]!.signal as AbortSignal;
    await vi.advanceTimersByTimeAsync(2500);
    expect(fresh.aborted).toBe(false);
    disable(); expect(fresh.aborted).toBe(true);
  });
});

describe("environment", () => {
  it("only permits production with a publishable token", () => {
    expect(analyticsEnvironmentAllowed(production)).toBe(true);
    for (const deployment of ["preview", "development", "staging", undefined]) {
      expect(resolveEnvironment(env({ NEXT_PUBLIC_VERCEL_ENV: deployment }))).not.toBe("production");
      configureAnalyticsForTest({ env: env({ NEXT_PUBLIC_VERCEL_ENV: deployment, NEXT_PUBLIC_POSTHOG_KEY: "phc_test" }), fetch: fetcher });
      enable(identity); emit("library_viewed");
    }
    for (const key of [undefined, "", "phx_secret", "phs_secret", "other", "phc_bad key"]) {
      expect(postHogProjectKey(env({ NEXT_PUBLIC_POSTHOG_KEY: key }))).toBeUndefined();
      configureAnalyticsForTest({ env: env({ NEXT_PUBLIC_VERCEL_ENV: "production", NEXT_PUBLIC_POSTHOG_KEY: key }), fetch: fetcher });
      enable(identity); emit("library_viewed");
    }
    configureAnalyticsForTest({ env: env({ ...production, NODE_ENV: "test" }), fetch: fetcher });
    enable(identity); emit("library_viewed");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
