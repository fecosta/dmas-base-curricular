import { renderToStaticMarkup as render } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedbackLink } from "@/components/feedback-link";
import { getFeedbackFormUrl } from "@/lib/feedback/config";

afterEach(() => vi.unstubAllEnvs());

function setUrl(value: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_FEEDBACK_FORM_URL", value ?? "");
}

describe("getFeedbackFormUrl", () => {
  it("accepts an absolute https: URL", () => {
    expect(getFeedbackFormUrl({ NEXT_PUBLIC_FEEDBACK_FORM_URL: "https://forms.gle/abc123" } as unknown as NodeJS.ProcessEnv)).toBe("https://forms.gle/abc123");
  });

  it.each([
    [undefined],
    [""],
    ["   "],
    ["http://forms.example.com"],
    ["javascript:alert(1)"],
    ["/relative/path"],
    ["not a url"],
    ["//example.com"],
    ["ftp://example.com/form"],
  ])("fails closed for %o", (value) => {
    expect(getFeedbackFormUrl({ NEXT_PUBLIC_FEEDBACK_FORM_URL: value } as unknown as NodeJS.ProcessEnv)).toBeUndefined();
  });

  it("trims whitespace", () => {
    expect(getFeedbackFormUrl({ NEXT_PUBLIC_FEEDBACK_FORM_URL: "  https://forms.gle/abc123  " } as unknown as NodeJS.ProcessEnv)).toBe("https://forms.gle/abc123");
  });
});

describe("FeedbackLink", () => {
  it("renders nothing when the env var is missing", () => {
    setUrl(undefined);
    expect(render(<FeedbackLink />)).toBe("");
  });

  it.each([
    "",
    "   ",
    "http://forms.example.com",
    "javascript:alert(1)",
    "/relative/path",
    "not a url",
  ])("renders nothing for invalid URL %o", (value) => {
    setUrl(value);
    expect(render(<FeedbackLink />)).toBe("");
  });

  it("renders a plain external anchor for a valid https: URL", () => {
    setUrl("https://forms.gle/abc123");
    const html = render(<FeedbackLink />);
    expect(html).toMatch(/^<a /);
    expect(html).toContain('href="https://forms.gle/abc123"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="Enviar comentarios"');
    expect(html).toContain('title="Ayúdanos a mejorar la plataforma"');
  });

  it("works with a Google Forms URL", () => {
    const url = "https://docs.google.com/forms/d/e/1FAIpQLScx7kS5A0W1/example/viewform";
    setUrl(url);
    const html = render(<FeedbackLink />);
    expect(html).toContain(`href="${url}"`);
  });

  it("works with a Jotform URL", () => {
    const url = "https://form.jotform.com/241012345678901";
    setUrl(url);
    const html = render(<FeedbackLink />);
    expect(html).toContain(`href="${url}"`);
  });

  it("does not append query parameters", () => {
    setUrl("https://forms.gle/abc123");
    const html = render(<FeedbackLink />);
    expect(html).not.toContain("?");
    expect(html).not.toContain("userId");
    expect(html).not.toContain("organizationId");
  });

  it("keeps the visible label hidden on narrow viewports and shows the icon", () => {
    setUrl("https://forms.gle/abc123");
    const html = render(<FeedbackLink />);
    expect(html).toContain("hidden sm:inline");
    expect(html).toContain("<svg");
  });
});
