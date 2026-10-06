import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsEnvironmentAllowed, postHogProjectKey, resolveEnvironment } from "@/lib/analytics/config";
import { analyticsActive, configureAnalyticsForTest, disable, enable, track } from "@/lib/analytics/boundary";

afterEach(() => { disable(); vi.unstubAllEnvs(); configureAnalyticsForTest(); });

describe("default browser analytics configuration", () => {
  const setEnvironment = (deployment?: string, key?: string) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VITEST", "");
    vi.stubEnv("PLAYWRIGHT_TEST_BASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", deployment);
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", key);
  };

  it("uses literal Next.js public-env references on the uninjected path", () => {
    const config = readFileSync(new URL("../src/lib/analytics/config.ts", import.meta.url), "utf8");
    const boundary = readFileSync(new URL("../src/lib/analytics/boundary.ts", import.meta.url), "utf8");
    expect(config).toContain("process.env.NEXT_PUBLIC_VERCEL_ENV");
    expect(config).toContain("process.env.NEXT_PUBLIC_POSTHOG_KEY");
    expect(boundary).not.toMatch(/environment\s*:\s*NodeJS\.ProcessEnv\s*=\s*process\.env/);
    expect(boundary).not.toContain("options.env ?? process.env");
  });

  it("resolves the real default path with a synthetic production token", () => {
    setEnvironment("production", "phc_reviewtest");
    const fetcher = vi.fn<typeof fetch>(async () => new Response("ok"));
    configureAnalyticsForTest({ fetch: fetcher });
    expect(resolveEnvironment()).toBe("production");
    expect(postHogProjectKey()).toBe("phc_reviewtest");
    expect(analyticsEnvironmentAllowed()).toBe(true);
    enable({ userId: "11111111-1111-4111-8111-111111111111", organizationId: "22222222-2222-4222-8222-222222222222" });
    expect(analyticsActive()).toBe(true);
    track("library_viewed");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(JSON.parse(fetcher.mock.calls[0][1]!.body as string).api_key).toBe("phc_reviewtest");
  });

  it.each([
    ["production", undefined], ["production", "phx_secret"], ["production", "phs_secret"],
    ["production", "phc_bad key"], ["preview", "phc_reviewtest"],
    ["development", "phc_reviewtest"], ["test", "phc_reviewtest"],
    ["staging", "phc_reviewtest"], [undefined, "phc_reviewtest"],
  ])("fails closed for deployment %s and token %s", (deployment, key) => {
    setEnvironment(deployment, key);
    expect(analyticsEnvironmentAllowed()).toBe(false);
  });

  it("forces test runners inert even when public config says production", () => {
    setEnvironment("production", "phc_reviewtest");
    vi.stubEnv("VITEST", "true");
    expect(resolveEnvironment()).toBe("test");
    expect(analyticsEnvironmentAllowed()).toBe(false);
  });
});
