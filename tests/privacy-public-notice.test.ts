import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

/*
 * SPEC-010 G5: the Privacy Notice is the only privacy document reachable
 * without signing in. It lives outside /app, where neither the app layout's
 * requireAccess() nor the session proxy runs, so the page itself must stay free
 * of auth, session and analytics code and must not read any user state.
 */
describe("public Privacy Notice route", () => {
  const source = read("src/app/privacidad/aviso/page.tsx");
  const imports = [...source.matchAll(/^import .* from "([^"]+)";$/gm)].map((match) => match[1]);

  it("imports only the document reader and presentation primitives", () => {
    expect(imports.sort()).toEqual([
      "@/app/app/privacidad/document-body",
      "@/components/ui/page",
      "@/lib/privacy/documents",
    ]);
  });

  it("uses no auth, Supabase, analytics, preference, cookie or header access", () => {
    for (const forbidden of [
      "requireAccess", "supabase", "analytics", "analytics-preference", "next/headers",
      "cookies(", "headers(", "process.env", "searchParams", "getAnalyticsPreference",
    ]) {
      expect(source.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain(forbidden);
    }
  });

  it("renders the Notice only, never the Terms", () => {
    expect(source).toContain('getPrivacyDocument("notice")');
    expect(source).not.toContain('"terms"');
  });

  it("is traced into the bundle and stays outside the proxy matcher and app layout", () => {
    const config = read("next.config.ts");
    expect(config).toContain('"/privacidad/aviso": ["./docs/PRIVACY_NOTICE.md"]');
    // The authenticated routes keep their own tracing.
    expect(config).toContain('"/app/privacidad/aviso": ["./docs/PRIVACY_NOTICE.md"]');
    expect(config).toContain('"/app/privacidad/terminos": ["./docs/TERMS_OF_USE.md"]');
    const matcher = /matcher: (\[[^\]]*\])/.exec(read("src/proxy.ts"))?.[1] ?? "";
    expect(matcher).not.toContain("privacidad");
  });
});
