import type { AnalyticsEnvironment } from "./contract";

/** Browser-publishable project token and fixed EU ingestion endpoint only. */
export const postHogCaptureUrl = "https://eu.i.posthog.com/i/v0/e/";

export function resolveEnvironment(env: NodeJS.ProcessEnv = process.env): AnalyticsEnvironment {
  if (env.NODE_ENV === "test" || env.VITEST || env.PLAYWRIGHT_TEST_BASE_URL) return "test";
  if (env.NEXT_PUBLIC_VERCEL_ENV === "production") return "production";
  if (env.NEXT_PUBLIC_VERCEL_ENV === "preview") return "preview";
  return "development";
}

export function postHogProjectKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return key && /^phc_[a-zA-Z0-9_-]+$/.test(key) ? key : undefined;
}

export function analyticsEnvironmentAllowed(env: NodeJS.ProcessEnv = process.env) {
  return resolveEnvironment(env) === "production" && postHogProjectKey(env) !== undefined;
}
