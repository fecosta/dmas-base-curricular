import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { analyticsEvents, approvedProperties } from "@/lib/analytics/contract";
import { postHogCaptureUrl, resolveEnvironment } from "@/lib/analytics/config";

/*
 * SPEC-008 Phase 5 — proving absence.
 *
 * The other suites verify that the right things happen. These assert that the
 * forbidden things cannot, by inspecting the implementation itself rather than
 * one execution of it. A behavioural test only covers the paths it exercises;
 * a privacy contract has to hold on the paths nobody thought to exercise.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path: string) => readFileSync(`${root}${path}`, "utf8");

/** Files that may legitimately reference the analytics provider at all. */
const analyticsSources = [
  "src/lib/analytics/boundary.ts",
  "src/lib/analytics/config.ts",
  "src/lib/analytics/contract.ts",
  "src/lib/analytics/library-events.ts",
  "src/lib/analytics/library-signals.ts",
  "src/components/analytics/analytics-boundary.tsx",
  "src/components/analytics/content-opened.tsx",
  "src/components/analytics/download-link.tsx",
  "src/components/analytics/external-reference-link.tsx",
  "src/components/analytics/library-activity.tsx",
];

/** Every tracked application source, via git so nothing untracked is missed. */
function applicationSources() {
  const listed = execFileSync("git", ["ls-files", "src"], { cwd: root, encoding: "utf8" });
  return listed.split("\n").filter((path) => /\.(ts|tsx)$/.test(path));
}

describe("the provider is reachable from one place only", () => {
  it("does not import an analytics SDK anywhere in the application", () => {
    const importers = applicationSources().filter((path) => {
      const source = read(path);
      // A type-only import pulls in no provider code and cannot capture
      // anything; config.ts uses one to pin the options to the SDK's own
      // interface, which is what makes a renamed option a build failure.
      const runtime = source.replace(/import\s+type\s+[^;]*?from\s+["']posthog-js["'];/g, "");
      return /from\s+["']posthog-js["']|import\(\s*["']posthog-js["']\s*\)/.test(runtime);
    });
    expect(importers).toEqual([]);
  });

  it("is never called directly by a product surface", () => {
    const offenders = applicationSources()
      .filter((path) => !analyticsSources.includes(path))
      .filter((path) => /posthog\s*\.\s*(capture|identify|init|reset)\s*\(/.test(read(path)));
    expect(offenders).toEqual([]);
  });

  it("routes every emission through the boundary's track", () => {
    // Any file that emits must import track from the boundary; nothing else
    // may define a competing capture function.
    const emitters = applicationSources().filter((path) => /\btrack\(/.test(read(path)));
    for (const path of emitters) {
      expect(read(path), path).toMatch(/from "@\/lib\/analytics\/boundary"/);
    }
  });
});

describe("no prohibited data category appears in analytics code", () => {
  /*
   * The property vocabulary is closed. Anything a payload can carry has to be
   * one of these names, so a reviewer reads one list rather than every call
   * site.
   */
  it("emits only approved property names in every track call", () => {
    const sources = analyticsSources.map(read).join("\n");
    /*
     * Reads the property object of each `track(...)` call. The alternative —
     * scanning for key-like text anywhere — flags the prohibited-name list
     * itself and the comments documenting exclusions, which is noise rather
     * than signal.
     */
    const calls = [...sources.matchAll(/track\(\s*["']\w+["']\s*,\s*\{([^}]*)\}/g)];
    expect(calls.length).toBeGreaterThan(0);

    for (const [, body] of calls) {
      for (const [, key] of body.matchAll(/(\w+):/g)) {
        expect(approvedProperties as readonly string[], `${key} is not approved`).toContain(key);
      }
    }
  });

  it("never mentions a prohibited identity or content field as a payload key", () => {
    for (const path of analyticsSources) {
      const source = read(path)
        // Comments legitimately name the things being excluded.
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");

      for (const forbidden of [
        "email", "full_name", "organization_name", "organization_domain",
        "search_text", "original_filename", "destination_url",
      ]) {
        // As an emitted key, i.e. `forbidden:` in an object literal.
        expect(source, `${path} emits ${forbidden}`).not.toMatch(new RegExp(`\\b${forbidden}\\s*:`));
      }
    }
  });

  it("reads the raw search parameter in exactly one module, which tokenizes it", () => {
    const readers = analyticsSources.filter((path) => {
      const source = read(path).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      return /paramValue\(\s*query\s*,\s*["']q["']\s*\)/.test(source);
    });
    // Only the server-side signal derivation may see the query at all.
    expect(readers).toEqual(["src/lib/analytics/library-signals.ts"]);

    // And it reduces it to a non-reversible token rather than passing it on.
    const signals = read("src/lib/analytics/library-signals.ts");
    expect(signals).toMatch(/createHash/);
    expect(signals).toMatch(/salt/);
    // The returned value is the digest, never the text assigned straight through.
    expect(signals).not.toMatch(/searchApplied:\s*search\s*[,}]/);
  });

  it("does not pass search text into the boundary to be discarded later", () => {
    // The boundary has no parameter that could receive it.
    const boundary = read("src/lib/analytics/boundary.ts");
    expect(boundary).not.toMatch(/query|searchText|search_text/i);
    // And the component is handed a token, not the text.
    const component = read("src/components/analytics/library-activity.tsx");
    expect(component).not.toMatch(/\bq\b\s*[:=]/);
  });
});

describe("the identity surface cannot carry readable personal information", () => {
  it("defines identity as canonical identifiers only", () => {
    const contract = read("src/lib/analytics/contract.ts");
    const identity = /export type AnalyticsIdentity = \{([^}]*)\}/.exec(contract)![1];
    const fields = [...identity.matchAll(/(\w+):/g)].map((match) => match[1]).sort();
    expect(fields).toEqual(["organizationId", "userId"]);
  });

  it("never reads the email or organization name available in access context", () => {
    for (const path of analyticsSources) {
      const source = read(path);
      expect(source, path).not.toMatch(/\.email\b/);
      expect(source, path).not.toMatch(/organizationName/);
    }
  });

  it("passes no email or organization name from the shell into the boundary", () => {
    const layout = read("src/app/app/layout.tsx");
    const identity = /<AnalyticsBoundary[\s\S]*?\/>/.exec(layout)![0];
    expect(identity).not.toContain("email");
    expect(identity).not.toContain("organizationName");
    expect(identity).toContain("organizationId");
  });
});

describe("automatic collection is absent", () => {
  it("has no SDK, identity, replay or background delivery", () => {
    const boundary = read("src/lib/analytics/boundary.ts");
    expect(boundary).not.toMatch(/posthog-js|\.identify\(|sendBeacon|localStorage|sessionStorage|serviceWorker|\$identify|\$create_alias/);
  });
});

describe("the taxonomy cannot quietly grow", () => {
  it("emits no event outside the canonical six", () => {
    const sources = analyticsSources.map(read).join("\n");
    const emitted = [...sources.matchAll(/track\(\s*["'](\w+)["']/g)].map((match) => match[1]);
    expect(emitted.length).toBeGreaterThan(0);
    for (const event of emitted) expect(analyticsEvents).toContain(event);
  });

  it("defines no forbidden click-level or session event", () => {
    const contract = read("src/lib/analytics/contract.ts");
    for (const forbidden of [
      "session_started", "user_returned", "search_result_selected",
      "button_clicked", "card_clicked", "modal_opened", "tab_clicked",
    ]) {
      expect(contract).not.toMatch(new RegExp(`["']${forbidden}["']`));
    }
  });

  it("keeps the approved property vocabulary aligned with the SPEC", () => {
    expect([...approvedProperties].sort()).toEqual([
      "$process_person_profile", "attachment_id", "content_id", "content_type", "environment", "filter_type",
      "has_results", "organization_id", "result_count",
    ]);
  });
});

describe("environment isolation cannot be satisfied by filtering later", () => {
  it("sends nothing outside the production deployment environment", () => {
    for (const deployment of ["preview", "development", "staging", undefined]) {
      expect(resolveEnvironment({ NEXT_PUBLIC_VERCEL_ENV: deployment } as unknown as NodeJS.ProcessEnv))
        .not.toBe("production");
    }
  });

  it("does not rely on NODE_ENV, which cannot distinguish Preview", () => {
    const config = read("src/lib/analytics/config.ts");
    // NODE_ENV is consulted only to force the test environment inert.
    const productionCheck = /if \(env\.NEXT_PUBLIC_VERCEL_ENV === "production"\) return "production";/.test(config);
    expect(productionCheck).toBe(true);
    expect(config).not.toMatch(/NODE_ENV === "production"/);
  });

  it("exposes only a browser-safe project key", () => {
    const config = read("src/lib/analytics/config.ts");
    // No server-side or privileged PostHog credential is read anywhere.
    expect(config).not.toMatch(/POSTHOG_PERSONAL|POSTHOG_API_KEY|POSTHOG_SECRET/);
    expect(config).toMatch(/NEXT_PUBLIC_POSTHOG_KEY/);
  });

  it("targets the approved PostHog Cloud EU host", () => {
    expect(postHogCaptureUrl).toBe("https://eu.i.posthog.com/i/v0/e/");
    const sources = analyticsSources.map(read).join("\n");
    expect(sources).not.toMatch(/us\.i\.posthog\.com|app\.posthog\.com/);
  });
});

describe("the privacy decision is never inferred", () => {
  it("enables analytics only from the persisted decision", () => {
    const shell = read("src/components/analytics/analytics-boundary.tsx");
    // The single condition is the resolved decision; nothing consults storage.
    expect(shell).toMatch(/analyticsAllowed\(decision\)/);
    expect(shell).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
  });

  it("treats only an accepted decision as consent", () => {
    const contract = read("src/lib/privacy/contract.ts");
    expect(contract).toMatch(/decision === "accepted"/);
  });

  it("keeps the preference out of browser-local storage entirely", () => {
    for (const path of applicationSources().filter((file) => file.includes("privacy") || file.includes("analytics"))) {
      expect(read(path), path).not.toMatch(/localStorage|sessionStorage/);
    }
  });

  it("does not let Terms acceptance touch the analytics preference", () => {
    const terms = read("src/app/app/privacidad/terminos/page.tsx");
    expect(terms).not.toMatch(/setAnalyticsPreference|acceptAnalyticsAction/);
    const notice = read("src/app/app/privacidad/aviso/page.tsx");
    expect(notice).not.toMatch(/setAnalyticsPreference|acceptAnalyticsAction/);
  });
});

/*
 * The raw-search guarantee, asserted behaviourally rather than by reading the
 * source. A regex over the implementation can be satisfied by formatting; this
 * cannot.
 */
describe("the search token cannot reveal the query", () => {
  it("never contains the query, any word of it, or a common encoding", async () => {
    const { librarySignals } = await import("@/lib/analytics/library-signals");
    const queries = [
      "estrategia electoral confidencial",
      "nombre de una persona",
      "a",
      "ñandú ÁÉÍÓÚ",
      "<script>alert(1)</script>",
    ];

    for (const query of queries) {
      const token = librarySignals({ q: query }).searchApplied!;

      /*
       * The sound assertion is the shape, not a substring search. The token is
       * 12 hexadecimal characters, so it is incapable of carrying the query:
       * any text outside [0-9a-f] cannot appear, and the alphabet is too small
       * for a substring test on short inputs to mean anything — "a" and "cafe"
       * occur in a random 12-hex string often enough that such an assertion
       * fails intermittently regardless of the implementation.
       */
      expect(token).toMatch(/^[0-9a-f]{12}$/);
      // Fixed width regardless of input length, so it carries no information
      // about the query's size either.
      expect(token).toHaveLength(12);
    }
  });

  it("is a digest of the query rather than a transformation of it", async () => {
    const { librarySignals } = await import("@/lib/analytics/library-signals");
    // Distinct queries give distinct tokens, so it carries information about
    // the query; identical queries agree, so it is usable for change
    // detection. Neither property requires the text to be recoverable.
    const tokens = new Set(
      ["uno", "dos", "tres", "cuatro"].map((query) => librarySignals({ q: query }).searchApplied),
    );
    expect(tokens.size).toBe(4);
    expect(librarySignals({ q: "uno" }).searchApplied).toBe(librarySignals({ q: "uno" }).searchApplied);
  });

  it("is not a reversible digest, because it is salted per process", async () => {
    const { createHash } = await import("node:crypto");
    const { librarySignals } = await import("@/lib/analytics/library-signals");
    const query = "democracia";
    const token = librarySignals({ q: query }).searchApplied;

    // None of the obvious unsalted constructions reproduce it, so a dictionary
    // of likely queries cannot be matched against collected tokens.
    for (const candidate of [
      createHash("sha256").update(query).digest("hex"),
      createHash("sha1").update(query).digest("hex"),
      createHash("md5").update(query).digest("hex"),
    ]) {
      expect(candidate.startsWith(token!)).toBe(false);
    }
  });

  it("carries no filter values either, only dimensions", async () => {
    const { librarySignals } = await import("@/lib/analytics/library-signals");
    const signals = librarySignals({
      q: "secreto", axis: "axis-uuid", entity: "module", country: "Chile", theme: "Participación",
    });
    const serialized = JSON.stringify(signals);
    for (const value of ["secreto", "axis-uuid", "Chile", "Participación"]) {
      expect(serialized).not.toContain(value);
    }
  });
});
