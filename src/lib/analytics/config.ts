import type { AnalyticsEnvironment } from "./contract";

/** Browser-publishable project token and fixed EU ingestion endpoint only. */
export const postHogCaptureUrl = "https://eu.i.posthog.com/i/v0/e/";

export function resolveEnvironment(env?: NodeJS.ProcessEnv): AnalyticsEnvironment {
  if ((env ? env.NODE_ENV : process.env.NODE_ENV) === "test"
    || (env ? env.VITEST : process.env.VITEST)
    || (env ? env.PLAYWRIGHT_TEST_BASE_URL : process.env.PLAYWRIGHT_TEST_BASE_URL)) return "test";
  const deployment = env ? env.NEXT_PUBLIC_VERCEL_ENV : process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (deployment === "production") return "production";
  if (deployment === "preview") return "preview";
  return "development";
}

export function postHogProjectKey(env?: NodeJS.ProcessEnv): string | undefined {
  const key = (env ? env.NEXT_PUBLIC_POSTHOG_KEY : process.env.NEXT_PUBLIC_POSTHOG_KEY)?.trim();
  return key && /^phc_[a-zA-Z0-9_-]+$/.test(key) ? key : undefined;
}

export function analyticsEnvironmentAllowed(env?: NodeJS.ProcessEnv) {
  return resolveEnvironment(env) === "production" && postHogProjectKey(env) !== undefined;
}
