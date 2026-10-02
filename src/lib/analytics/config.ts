import type { PostHogConfig } from "posthog-js";
import type { AnalyticsEnvironment } from "./contract";

/**
 * Environment resolution and client-safe PostHog configuration.
 *
 * Optional analytics is available only in the intended production
 * environment. `NODE_ENV` cannot settle this on Vercel, where a Preview
 * deployment is also a production build, so the deployment environment is read
 * from `NEXT_PUBLIC_VERCEL_ENV` and only the literal value `production`
 * qualifies. Anything else — Preview, Development, Test, an unset value, a
 * custom environment name — is a no-op, which is the fail-closed direction.
 */

/** The approved destination. PostHog Cloud EU, per SPEC-008 D-008-03. */
export const postHogHost = "https://eu.i.posthog.com";

export function resolveEnvironment(env: NodeJS.ProcessEnv = process.env): AnalyticsEnvironment {
  // Test first: a test run must never emit regardless of how it set the rest.
  if (env.NODE_ENV === "test" || env.VITEST || env.PLAYWRIGHT_TEST_BASE_URL) return "test";

  const deployment = env.NEXT_PUBLIC_VERCEL_ENV;
  if (deployment === "production") return "production";
  if (deployment === "preview") return "preview";
  // An unrecognised or missing deployment environment is treated as
  // development, never as production.
  return "development";
}

/**
 * The browser-safe project key, or undefined when analytics is not configured.
 *
 * This is a publishable project key, the only PostHog value the browser may
 * ever see. No server-side PostHog credential exists in this implementation.
 */
export function postHogProjectKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return undefined;
  // A private/personal API key must never be shipped to a browser, so reject
  // the shapes PostHog uses for them even if one is misconfigured here.
  if (key.startsWith("phx_") || key.startsWith("phs_")) return undefined;
  return key;
}

/**
 * Whether optional analytics may run at all in this environment.
 *
 * This is the environment gate only. An affirmative persisted user preference
 * is a separate and equally necessary condition.
 */
export function analyticsEnvironmentAllowed(env: NodeJS.ProcessEnv = process.env) {
  return resolveEnvironment(env) === "production" && postHogProjectKey(env) !== undefined;
}

/**
 * The PostHog initialization options.
 *
 * Every automatic collection behaviour is disabled explicitly rather than left
 * to provider defaults, because a default is a decision someone else can
 * change in a minor release. SPEC-008 §21 requires semantic capture only.
 *
 * Typed as the provider's own config so a renamed or removed option fails
 * typechecking here instead of silently reverting to a collecting default.
 */
export function postHogOptions(): Partial<PostHogConfig> {
  return {
    api_host: postHogHost,
    // Semantic events only.
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    // The Library carries search text in the URL, so an automatic pageview or
    // referrer capture would exfiltrate the raw query. Both stay off.
    capture_performance: false,
    // Session Replay is out of scope for SPEC-008 and must not record.
    disable_session_recording: true,
    session_recording: { recordCrossOriginIframes: false },
    // No surveys, no heatmaps, no DOM text collection. Both heatmap keys are
    // set: `enable_heatmaps` is deprecated in favour of `capture_heatmaps`,
    // and a deprecated option can disappear in a minor release.
    disable_surveys: true,
    capture_heatmaps: false,
    enable_heatmaps: false,
    // Consent is the application's own persisted preference; the SDK must not
    // keep its own opt-out state that could diverge from it.
    persistence: "memory" as const,
    // Identity is explicit and pseudonymous: never inferred from a page load.
    person_profiles: "identified_only" as const,
    advanced_disable_decide: true,
    // Nothing about this product should reach a provider's feature-flag or
    // experiment surface during the initial pilot.
    advanced_disable_feature_flags: true,
    advanced_disable_feature_flags_on_first_load: true,
    // Do not collect the full URL/referrer, which on the Library would carry
    // the reader's raw search query.
    mask_personal_data_properties: true,
    sanitize_properties: sanitizeProperties,
    // The boundary only initializes after an affirmative persisted preference,
    // so nothing should be captured merely because init ran. This makes that a
    // provider-level guarantee as well as an application one.
    opt_out_capturing_by_default: true,
    // No replay/surveys/toolbar payloads are fetched, so the provider cannot
    // pull in an extension that collects beyond this SPEC.
    disable_external_dependency_loading: true,
  };
}

/**
 * Last-resort scrub applied by the SDK to every outgoing payload.
 *
 * The boundary already restricts properties to the approved vocabulary; this
 * removes the URL-shaped and text-shaped properties the SDK adds on its own,
 * so a provider default cannot reintroduce the raw search query through
 * `$current_url`, `$referrer` or a page title.
 */
export function sanitizeProperties(properties: Record<string, unknown>) {
  const scrubbed: Record<string, unknown> = { ...properties };
  for (const key of [
    "$current_url", "$referrer", "$referring_domain", "$pathname", "$host",
    "$initial_current_url", "$initial_referrer", "$initial_referring_domain",
    "$initial_pathname", "$session_entry_url", "$session_entry_pathname",
    "$session_entry_referrer", "$session_entry_referring_domain",
    "$session_entry_host", "$title", "$prev_pageview_pathname",
  ]) delete scrubbed[key];
  return scrubbed;
}
