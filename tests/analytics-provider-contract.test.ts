import { expect, it } from "vitest";
import { postHogCaptureUrl } from "@/lib/analytics/config";

it("uses the public single-event EU Capture endpoint (never the batch or management API)", () => {
  expect(postHogCaptureUrl).toBe("https://eu.i.posthog.com/i/v0/e/");
});
