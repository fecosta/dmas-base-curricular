import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  analyticsActive,
  configureAnalyticsForTest,
  disable,
  enable,
  track,
} from "@/lib/analytics/boundary";
import {
  analyticsEnvironmentAllowed,
  postHogOptions,
  postHogProjectKey,
  resolveEnvironment,
  sanitizeProperties,
} from "@/lib/analytics/config";
import { analyticsEvents, isProhibitedProperty } from "@/lib/analytics/contract";

/**
 * A provider test double. No network, so no test can emit real telemetry.
 *
 * `calls` records the order of consent-relevant provider calls, because the
 * SDK's reset() clears consent: opting in before a reset would be silently
 * discarded, which would look like working code and collect nothing.
 */
function provider() {
  const calls: string[] = [];
  const record = (name: string) => vi.fn(() => { calls.push(name); });
  type Payload = Record<string, unknown>;
  const client = {
    init: vi.fn<(key: string, options: Payload) => void>(() => { calls.push("init"); }),
    identify: vi.fn<(distinctId: string, properties: Payload) => void>(() => { calls.push("identify"); }),
    capture: vi.fn<(event: string, properties: Payload) => void>(),
    reset: record("reset"),
    opt_in_capturing: record("opt_in_capturing"),
    opt_out_capturing: record("opt_out_capturing"),
  };
  return { client, calls, loader: vi.fn(async () => client) };
}

/** Builds an environment without restating NodeJS.ProcessEnv's required keys. */
const env = (values: Record<string, string | undefined>) => values as unknown as NodeJS.ProcessEnv;

/** A production-like environment with analytics configured. */
const productionEnv = env({
  NEXT_PUBLIC_VERCEL_ENV: "production",
  NEXT_PUBLIC_POSTHOG_KEY: "phc_test_key",
});

const identity = { userId: "user-1", organizationId: "org-1", userRole: "Contributor" };

/** Lets the boundary's deferred capture settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => configureAnalyticsForTest());

describe("environment resolution", () => {
  it("treats only the production deployment environment as production", () => {
    expect(resolveEnvironment(env({ NEXT_PUBLIC_VERCEL_ENV: "production" }))).toBe("production");
    expect(resolveEnvironment(env({ NEXT_PUBLIC_VERCEL_ENV: "preview" }))).toBe("preview");
    expect(resolveEnvironment(env({ NEXT_PUBLIC_VERCEL_ENV: "development" }))).toBe("development");
  });

  /*
   * NODE_ENV cannot settle this: a Vercel Preview is also a production build.
   * An unknown or missing deployment environment must fall to a no-op, never
   * to production.
   */
  it("does not treat a production build as the production environment", () => {
    expect(resolveEnvironment(env({ NODE_ENV: "production" }))).toBe("development");
    expect(resolveEnvironment(env({}))).toBe("development");
    expect(resolveEnvironment(env({ NEXT_PUBLIC_VERCEL_ENV: "staging" }))).toBe("development");
  });

  it("resolves a test run as test even when it claims production", () => {
    expect(resolveEnvironment(env({
      NODE_ENV: "test", NEXT_PUBLIC_VERCEL_ENV: "production",
    }))).toBe("test");
    expect(resolveEnvironment(env({
      VITEST: "true", NEXT_PUBLIC_VERCEL_ENV: "production",
    }))).toBe("test");
    expect(resolveEnvironment(env({
      PLAYWRIGHT_TEST_BASE_URL: "http://127.0.0.1:3000", NEXT_PUBLIC_VERCEL_ENV: "production",
    }))).toBe("test");
  });

  it("allows analytics only in production and only when configured", () => {
    expect(analyticsEnvironmentAllowed(productionEnv)).toBe(true);
    expect(analyticsEnvironmentAllowed(env({ NEXT_PUBLIC_VERCEL_ENV: "production" }))).toBe(false);
    for (const deployment of ["preview", "development", undefined]) {
      expect(analyticsEnvironmentAllowed(env({
        NEXT_PUBLIC_VERCEL_ENV: deployment, NEXT_PUBLIC_POSTHOG_KEY: "phc_test_key",
      }))).toBe(false);
    }
  });

  it("refuses a privileged PostHog key even if one is misconfigured for the browser", () => {
    expect(postHogProjectKey(env({ NEXT_PUBLIC_POSTHOG_KEY: "phc_ok" }))).toBe("phc_ok");
    expect(postHogProjectKey(env({ NEXT_PUBLIC_POSTHOG_KEY: "phx_personal" }))).toBeUndefined();
    expect(postHogProjectKey(env({ NEXT_PUBLIC_POSTHOG_KEY: "phs_secret" }))).toBeUndefined();
    expect(postHogProjectKey(env({ NEXT_PUBLIC_POSTHOG_KEY: "  " }))).toBeUndefined();
  });
});

describe("provider configuration", () => {
  const options = postHogOptions();

  it("sends to PostHog Cloud EU", () => {
    expect(options.api_host).toBe("https://eu.i.posthog.com");
  });

  it("disables every automatic collection behaviour explicitly", () => {
    expect(options.autocapture).toBe(false);
    expect(options.capture_pageview).toBe(false);
    expect(options.capture_pageleave).toBe(false);
    expect(options.capture_performance).toBe(false);
    expect(options.disable_surveys).toBe(true);
    expect(options.enable_heatmaps).toBe(false);
  });

  it("disables Session Replay", () => {
    expect(options.disable_session_recording).toBe(true);
  });

  it("identifies only explicitly, never from a page load", () => {
    expect(options.person_profiles).toBe("identified_only");
  });

  /*
   * The Library keeps the reader's query in the URL, so a URL-shaped property
   * is a raw-search leak. The scrub removes every one the SDK adds itself.
   */
  it("strips URL, referrer and title properties the provider adds on its own", () => {
    const scrubbed = sanitizeProperties({
      $current_url: "https://app.test/app/library?q=secreto+del+usuario",
      $referrer: "https://app.test/app/library?q=secreto",
      $pathname: "/app/library",
      $title: "Biblioteca — secreto",
      $session_entry_url: "https://app.test/app/library?q=secreto",
      $initial_current_url: "https://app.test/app/library?q=secreto",
      content_id: "module-1",
    });

    expect(JSON.stringify(scrubbed)).not.toContain("secreto");
    expect(JSON.stringify(scrubbed)).not.toContain("q=");
    expect(scrubbed.content_id).toBe("module-1");
  });
});

describe("consent gating", () => {
  it("emits nothing while no decision has been applied", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    expect(analyticsActive()).toBe(false);
    track("library_viewed");
    track("content_opened", { content_id: "module-1", content_type: "module" });
    await settle();

    expect(loader).not.toHaveBeenCalled();
    expect(client.init).not.toHaveBeenCalled();
    expect(client.capture).not.toHaveBeenCalled();
  });

  it("emits nothing after rejection, and never initializes the provider", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    // Rejection reaches the boundary as disable, never as enable.
    disable();
    track("search_performed", { result_count: 3, has_results: true });
    await settle();

    expect(loader).not.toHaveBeenCalled();
    expect(client.capture).not.toHaveBeenCalled();
  });

  it("initializes and identifies pseudonymously once consent is applied", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    expect(analyticsActive()).toBe(true);
    // Enabling alone emits nothing: no historical activity is reconstructed.
    await settle();
    expect(client.capture).not.toHaveBeenCalled();

    track("library_viewed");
    await settle();

    expect(client.init).toHaveBeenCalledWith("phc_test_key", expect.objectContaining({
      autocapture: false, capture_pageview: false, disable_session_recording: true,
    }));
    expect(client.identify).toHaveBeenCalledWith("user-1", {
      user_id: "user-1", organization_id: "org-1", user_role: "Contributor", environment: "production",
    });
    // The Supabase Auth UUID is the distinct_id; no email or name appears.
    const [[distinctId, properties]] = client.identify.mock.calls;
    expect(distinctId).toBe("user-1");
    expect(JSON.stringify(properties)).not.toMatch(/@|email|name/i);
  });

  /*
   * The provider is configured opted out by default, and its reset() clears
   * consent back to that default. Opting in before the reset would therefore
   * be silently discarded and collect nothing, while resetting after opting in
   * on logout is what guarantees the next user starts opted out.
   */
  it("resets, then opts in, then identifies, so consent is not discarded", async () => {
    const { client, calls, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    track("library_viewed");
    await settle();

    expect(calls).toEqual(["init", "reset", "opt_in_capturing", "identify"]);
    expect(client.capture).toHaveBeenCalledTimes(1);
  });

  it("configures the provider to capture nothing until it is opted in", () => {
    expect(postHogOptions().opt_out_capturing_by_default).toBe(true);
  });

  it("opts the provider out after resetting it, so revocation cannot be undone", async () => {
    const { calls, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    track("library_viewed");
    await settle();
    calls.length = 0;

    disable();
    // reset() first returns the provider to its opted-out default; the explicit
    // opt-out follows so it is not discarded by the reset.
    expect(calls).toEqual(["reset", "opt_out_capturing"]);
  });

  it("stops emitting as soon as the preference is revoked", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    track("library_viewed");
    await settle();
    expect(client.capture).toHaveBeenCalledTimes(1);

    disable();
    expect(analyticsActive()).toBe(false);
    track("library_viewed");
    track("filter_applied", { filter_type: "axis" });
    await settle();

    expect(client.capture).toHaveBeenCalledTimes(1);
    expect(client.reset).toHaveBeenCalled();
  });

  it("drops an event whose consent was revoked while the provider was loading", async () => {
    const { client } = provider();
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    configureAnalyticsForTest({ loader: async () => { await gate; return client; }, env: productionEnv });

    enable(identity);
    track("library_viewed");
    disable();
    release!();
    await settle();

    expect(client.capture).not.toHaveBeenCalled();
  });

  it("re-enabling after revocation emits only from that point forward", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    disable();
    // Activity while disabled.
    track("content_opened", { content_id: "module-1", content_type: "module" });
    await settle();
    expect(client.capture).not.toHaveBeenCalled();

    enable(identity);
    track("content_opened", { content_id: "module-2", content_type: "module" });
    await settle();

    expect(client.capture).toHaveBeenCalledTimes(1);
    expect(client.capture.mock.calls[0][1]).toMatchObject({ content_id: "module-2" });
  });
});

describe("logout isolation", () => {
  it("resets the provider identity so a later user cannot inherit it", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    track("library_viewed");
    await settle();

    disable();
    expect(client.reset).toHaveBeenCalled();
    expect(client.opt_out_capturing).toHaveBeenCalled();

    // A different user in the same browser gets their own identity.
    enable({ userId: "user-2", organizationId: "org-2", userRole: "Admin" });
    track("library_viewed");
    await settle();

    expect(client.identify).toHaveBeenLastCalledWith("user-2", expect.objectContaining({
      user_id: "user-2", organization_id: "org-2",
    }));
    expect(client.capture).toHaveBeenLastCalledWith("library_viewed", expect.objectContaining({ user_id: "user-2" }));
  });

  it("resets the previous identity when enable is called for a different user", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    track("library_viewed");
    await settle();

    enable({ userId: "user-2", organizationId: "org-2", userRole: "Admin" });
    track("library_viewed");
    await settle();

    expect(client.reset).toHaveBeenCalled();
    const events = client.capture.mock.calls.map(([, properties]) => properties.user_id);
    expect(events).toEqual(["user-1", "user-2"]);
  });

  it("survives a provider whose reset throws", () => {
    const client = {
      init: vi.fn(), identify: vi.fn(), capture: vi.fn(), opt_in_capturing: vi.fn(),
      reset: vi.fn(() => { throw new Error("provider gone"); }),
    };
    configureAnalyticsForTest({ loader: async () => client, env: productionEnv });

    enable(identity);
    expect(() => disable()).not.toThrow();
  });
});

describe("environment isolation", () => {
  for (const deployment of ["preview", "development"] as const) {
    it(`emits nothing in ${deployment} even with consent and a key`, async () => {
      const { client, loader } = provider();
      configureAnalyticsForTest({
        loader,
        env: env({ NEXT_PUBLIC_VERCEL_ENV: deployment, NEXT_PUBLIC_POSTHOG_KEY: "phc_test_key" }),
      });

      enable(identity);
      expect(analyticsActive()).toBe(false);
      track("library_viewed");
      await settle();

      expect(loader).not.toHaveBeenCalled();
      expect(client.init).not.toHaveBeenCalled();
      expect(client.capture).not.toHaveBeenCalled();
    });
  }

  it("emits nothing under test, which is how this suite stays telemetry-free", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({
      loader,
      env: env({ NODE_ENV: "test", NEXT_PUBLIC_VERCEL_ENV: "production", NEXT_PUBLIC_POSTHOG_KEY: "phc_test_key" }),
    });

    enable(identity);
    track("library_viewed");
    await settle();
    expect(client.capture).not.toHaveBeenCalled();
  });

  /* The default environment of this very test process must be inert. */
  it("is inert with the ambient process environment", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader });

    enable(identity);
    track("library_viewed");
    await settle();
    expect(client.capture).not.toHaveBeenCalled();
  });

  it("emits nothing when analytics is not configured", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: env({ NEXT_PUBLIC_VERCEL_ENV: "production" }) });

    enable(identity);
    track("library_viewed");
    await settle();
    expect(client.init).not.toHaveBeenCalled();
    expect(client.capture).not.toHaveBeenCalled();
  });
});

describe("failure isolation", () => {
  it("continues when the provider cannot be loaded", async () => {
    configureAnalyticsForTest({ loader: async () => null, env: productionEnv });
    enable(identity);
    expect(() => track("library_viewed")).not.toThrow();
    await settle();
  });

  it("continues when the provider load rejects, as a blocked script would", async () => {
    configureAnalyticsForTest({
      loader: async () => { throw new Error("blocked by the browser"); },
      env: productionEnv,
    });
    enable(identity);
    expect(() => track("library_viewed")).not.toThrow();
    await settle();
  });

  it("continues when initialization throws", async () => {
    const client = {
      init: vi.fn(() => { throw new Error("init failed"); }),
      identify: vi.fn(), capture: vi.fn(), reset: vi.fn(), opt_in_capturing: vi.fn(),
    };
    configureAnalyticsForTest({ loader: async () => client, env: productionEnv });

    enable(identity);
    expect(() => track("library_viewed")).not.toThrow();
    await settle();
    expect(client.capture).not.toHaveBeenCalled();
  });

  it("continues when capture throws", async () => {
    const client = {
      init: vi.fn(), identify: vi.fn(), reset: vi.fn(), opt_in_capturing: vi.fn(),
      capture: vi.fn(() => { throw new Error("capture failed"); }),
    };
    configureAnalyticsForTest({ loader: async () => client, env: productionEnv });

    enable(identity);
    expect(() => track("library_viewed")).not.toThrow();
    await settle();
  });

  it("returns nothing, so no caller can branch on analytics succeeding", () => {
    configureAnalyticsForTest({ loader: async () => null, env: productionEnv });
    enable(identity);
    expect(track("library_viewed")).toBeUndefined();
  });

  it("loads the provider once across many events", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });

    enable(identity);
    track("library_viewed");
    track("filter_applied", { filter_type: "theme" });
    track("search_performed", { result_count: 0, has_results: false });
    await settle();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(client.init).toHaveBeenCalledTimes(1);
    expect(client.capture).toHaveBeenCalledTimes(3);
  });
});

describe("payload minimization", () => {
  it("strips a prohibited property even if one is passed", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });
    enable(identity);

    // Deliberately bypassing the typed event map, as a careless edit would.
    (track as (event: string, properties: Record<string, unknown>) => void)("search_performed", {
      result_count: 2,
      has_results: true,
      query: "lo que escribió la persona",
      email: "persona@organizacion.test",
      original_filename: "documento confidencial.pdf",
      destination_url: "https://externo.test/ruta",
      title: "texto privado del contenido",
    });
    await settle();

    const [, payload] = client.capture.mock.calls[0];
    expect(payload).toEqual({
      result_count: 2, has_results: true,
      user_id: "user-1", organization_id: "org-1", user_role: "Contributor", environment: "production",
    });
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("escribió");
    expect(serialized).not.toContain("persona@");
    expect(serialized).not.toContain("confidencial");
    expect(serialized).not.toContain("externo.test");
  });

  it("drops objects and arrays, which could smuggle arbitrary text", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });
    enable(identity);

    (track as (event: string, properties: Record<string, unknown>) => void)("library_viewed", {
      result_count: 1,
      nested: { secreto: "texto privado" },
      list: ["texto privado"],
    });
    await settle();

    const [, payload] = client.capture.mock.calls[0];
    expect(payload.nested).toBeUndefined();
    expect(payload.list).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("privado");
  });

  it("attaches the approved context to every event and nothing more", async () => {
    const { client, loader } = provider();
    configureAnalyticsForTest({ loader, env: productionEnv });
    enable(identity);

    for (const event of analyticsEvents) {
      (track as (event: string, properties: Record<string, unknown>) => void)(event, {});
    }
    await settle();

    expect(client.capture).toHaveBeenCalledTimes(analyticsEvents.length);
    for (const [name, payload] of client.capture.mock.calls) {
      expect(analyticsEvents).toContain(name);
      expect(payload).toEqual({
        user_id: "user-1", organization_id: "org-1", user_role: "Contributor", environment: "production",
      });
    }
  });

  it("cannot be given the organization name or the user's email", () => {
    // The identity type carries canonical identifiers only, so there is no
    // field through which readable personal information could be passed.
    expect(Object.keys(identity).sort()).toEqual(["organizationId", "userId", "userRole"]);
  });
});

describe("the prohibited-property guard", () => {
  it("catches raw search under any spelling", () => {
    for (const name of ["q", "query", "search_text", "searchText", "SEARCH-TEXT", "search"]) {
      expect(isProhibitedProperty(name), name).toBe(true);
    }
  });

  it("catches identity, credential, content and URL properties", () => {
    for (const name of [
      "email", "name", "full_name", "organization_name", "organization_domain",
      "password", "access_token", "jwt", "api_key",
      "title", "description", "text", "body",
      "original_filename", "filename", "url", "destination_url", "source_url",
    ]) expect(isProhibitedProperty(name), name).toBe(true);
  });

  it("permits the approved vocabulary", () => {
    for (const name of [
      "organization_id", "user_id", "user_role", "environment",
      "content_id", "content_type", "filter_type", "result_count", "has_results", "attachment_id",
    ]) expect(isProhibitedProperty(name), name).toBe(false);
  });
});

describe("the canonical taxonomy", () => {
  it("is exactly the six approved events", () => {
    expect([...analyticsEvents]).toEqual([
      "library_viewed",
      "search_performed",
      "filter_applied",
      "content_opened",
      "external_reference_opened",
      "content_downloaded",
    ]);
  });

  it("excludes the click-level and session events SPEC-008 forbids", () => {
    for (const forbidden of [
      "session_started", "user_returned", "search_result_selected",
      "button_clicked", "card_clicked", "modal_opened", "tab_clicked",
    ]) expect(analyticsEvents).not.toContain(forbidden);
  });
});

/*
 * The payloads the canonical events actually produce when analytics is
 * enabled.
 *
 * The browser suite cannot show this: a non-production environment is inert by
 * design, and making it emit would mean weakening the environment guard. So
 * the real boundary is driven here with a production-like environment and a
 * provider double, which is the only place the enabled-state payloads can be
 * inspected without a deployment.
 */
describe("enabled-state payloads", () => {
  async function emitted(run: (emit: typeof import("@/lib/analytics/boundary").track) => void) {
    const captured: { event: string; properties: Record<string, unknown> }[] = [];
    const client = {
      init: () => {}, identify: () => {}, reset: () => {},
      opt_in_capturing: () => {}, opt_out_capturing: () => {},
      capture: (event: string, properties: Record<string, unknown>) => { captured.push({ event, properties }); },
    };
    configureAnalyticsForTest({
      loader: async () => client,
      env: env({ NEXT_PUBLIC_VERCEL_ENV: "production", NEXT_PUBLIC_POSTHOG_KEY: "phc_test" }),
    });
    enable(identity);
    run(track);
    await settle();
    return captured;
  }

  const context = {
    user_id: "user-1", organization_id: "org-1", user_role: "Contributor", environment: "production",
  };

  it("library_viewed carries approved context only", async () => {
    const captured = await emitted((emit) => emit("library_viewed"));
    expect(captured).toEqual([{ event: "library_viewed", properties: context }]);
  });

  it("search_performed carries the outcome and no query", async () => {
    const captured = await emitted((emit) => emit("search_performed", { result_count: 4, has_results: true }));
    expect(captured[0].properties).toEqual({ ...context, result_count: 4, has_results: true });
  });

  it("filter_applied carries the dimension and no value", async () => {
    const captured = await emitted((emit) => emit("filter_applied", { filter_type: "theme" }));
    expect(captured[0].properties).toEqual({ ...context, filter_type: "theme" });
  });

  it("content_opened carries canonical identifiers for each content type", async () => {
    for (const contentType of ["module", "material", "institution"] as const) {
      const captured = await emitted((emit) =>
        emit("content_opened", { content_id: `${contentType}-1`, content_type: contentType }));
      expect(captured[0].properties).toEqual({
        ...context, content_id: `${contentType}-1`, content_type: contentType,
      });
    }
  });

  it("external_reference_opened carries no destination URL", async () => {
    const captured = await emitted((emit) =>
      emit("external_reference_opened", { content_id: "material-1", content_type: "material" }));
    expect(captured[0].properties).toEqual({ ...context, content_id: "material-1", content_type: "material" });
    expect(Object.keys(captured[0].properties)).not.toContain("url");
  });

  it("content_downloaded carries ids and no filename", async () => {
    const captured = await emitted((emit) => emit("content_downloaded", {
      attachment_id: "a1", content_id: "material-1", content_type: "material",
    }));
    expect(captured[0].properties).toEqual({
      ...context, attachment_id: "a1", content_id: "material-1", content_type: "material",
    });
  });

  it("emits every canonical event with no prohibited property anywhere", async () => {
    const captured = await emitted((emit) => {
      emit("library_viewed");
      emit("search_performed", { result_count: 1, has_results: true });
      emit("filter_applied", { filter_type: "axis" });
      emit("content_opened", { content_id: "module-1", content_type: "module" });
      emit("external_reference_opened", { content_id: "module-1", content_type: "module" });
      emit("content_downloaded", { attachment_id: "a1", content_id: "module-1", content_type: "module" });
    });

    expect(captured.map((entry) => entry.event)).toEqual([...analyticsEvents]);
    const approved = new Set([
      "organization_id", "user_id", "user_role", "environment",
      "content_id", "content_type", "filter_type", "result_count", "has_results", "attachment_id",
    ]);
    for (const { event, properties } of captured) {
      for (const key of Object.keys(properties)) {
        expect(approved.has(key), `${key} on ${event}`).toBe(true);
      }
    }
  });
});
