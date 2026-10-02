import { describe, expect, it, vi } from "vitest";
import { postHogOptions } from "@/lib/analytics/config";

/*
 * Verifies the installed PostHog SDK against the assumptions the analytics
 * boundary makes about it.
 *
 * These are deliberately not asserted against a test double. A double proves
 * the boundary calls what it intends to call; only the real package proves the
 * names exist. Both failure modes here are silent: an options key the SDK does
 * not recognise reverts to a collecting default, and an export shape that does
 * not carry the methods yields a client whose calls are all undefined. Either
 * would look like working analytics and either would be a privacy incident.
 *
 * No SDK method is invoked, so this test sends nothing anywhere.
 */

/** Mirrors the capability check the boundary's loader performs. */
function resolveClient(imported: Record<string, unknown>) {
  const candidates = [
    imported.posthog,
    (imported as { default?: { default?: unknown } }).default?.default,
    imported.default,
  ];
  return candidates.find((candidate) => {
    const client = candidate as Record<string, unknown> | null | undefined;
    return typeof client?.init === "function" && typeof client.capture === "function";
  }) as Record<string, unknown> | undefined;
}

describe("the installed PostHog SDK", () => {
  it("exposes a client carrying every method the boundary calls", async () => {
    const client = resolveClient(await import("posthog-js"));
    expect(client).toBeDefined();

    for (const method of ["init", "identify", "capture", "reset", "opt_in_capturing", "opt_out_capturing"]) {
      expect(typeof client![method], method).toBe("function");
    }
  });

  /*
   * Regression guard. Under Node's CJS interop `import("posthog-js").default`
   * resolves to the module namespace rather than to the client, so selecting a
   * candidate positionally produced an object whose methods were all
   * undefined. Which candidate is correct varies by bundler and resolver,
   * which is exactly why the loader selects by capability: whichever export
   * carries the methods is the one used, under every resolution.
   */
  it("resolves the same singleton whichever export carries the methods", async () => {
    const imported = await import("posthog-js") as unknown as Record<string, unknown>;
    const client = resolveClient(imported);
    expect(typeof client!.init).toBe("function");

    // Every candidate that does expose a client is the same instance, so the
    // capability check cannot pick a second, differently-configured one.
    const usable = [
      imported.posthog,
      (imported as { default?: { default?: unknown } }).default?.default,
      imported.default,
    ].filter((candidate) => typeof (candidate as { init?: unknown })?.init === "function");

    expect(usable.length).toBeGreaterThan(0);
    for (const candidate of usable) expect(candidate).toBe(client);
  });

  /*
   * Option names are enforced at typecheck: `postHogOptions` is declared as
   * `Partial<PostHogConfig>`, so a renamed, removed or misspelled key fails
   * `npm run typecheck` rather than silently reverting to a collecting
   * default. That is a stronger guarantee than any runtime check available
   * here — the SDK's resolved `config` only lists keys that carry defaults, so
   * it cannot enumerate recognised names.
   *
   * What remains worth asserting at runtime is that the SDK still honours the
   * two settings whose defaults decide whether anything is collected before
   * the application opts in.
   */
  it("defaults to collecting nothing until the boundary opts in", async () => {
    const { PostHog } = await import("posthog-js");
    const config = new PostHog().config as Record<string, unknown>;

    expect(config).toHaveProperty("opt_out_capturing_by_default");
    expect(config).toHaveProperty("disable_session_recording");
    // The SDK's own defaults are the permissive direction, which is precisely
    // why the boundary overrides them explicitly rather than relying on them.
    expect(postHogOptions().opt_out_capturing_by_default).toBe(true);
    expect(postHogOptions().disable_session_recording).toBe(true);
  });

  it("sets each privacy-critical option to the non-collecting value", () => {
    const options = postHogOptions() as Record<string, unknown>;
    expect(options.autocapture).toBe(false);
    expect(options.capture_pageview).toBe(false);
    expect(options.capture_pageleave).toBe(false);
    expect(options.capture_performance).toBe(false);
    expect(options.disable_session_recording).toBe(true);
    expect(options.disable_surveys).toBe(true);
    expect(options.capture_heatmaps).toBe(false);
    expect(options.enable_heatmaps).toBe(false);
    expect(options.opt_out_capturing_by_default).toBe(true);
    expect(options.disable_external_dependency_loading).toBe(true);
    expect(options.person_profiles).toBe("identified_only");
    expect(options.api_host).toBe("https://eu.i.posthog.com");
  });

  it("supports opting in without emitting the non-canonical $opt_in event", async () => {
    const { PostHog } = await import("posthog-js");
    const client = new PostHog();
    const capture = vi.spyOn(client, "capture");

    client.opt_in_capturing({ captureEventName: false });

    expect(capture).not.toHaveBeenCalled();
  });
});
