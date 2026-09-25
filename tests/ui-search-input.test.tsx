import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SearchInput } from "@/components/ui/search-input";

function render(props: Partial<React.ComponentProps<typeof SearchInput>> = {}) {
  return renderToStaticMarkup(<SearchInput label="Buscar en la biblioteca" {...props} />);
}

/** Resolves whether a <label for> actually points at the rendered input. */
function labelMatchesInput(html: string) {
  const forId = /<label for="([^"]+)"/.exec(html)?.[1];
  const inputId = /<input[^>]*\sid="([^"]+)"/.exec(html)?.[1];
  return !!forId && forId === inputId;
}

describe("SearchInput", () => {
  it("associates its label with the input", () => {
    const html = render();
    expect(labelMatchesInput(html)).toBe(true);
    expect(html).toContain("Buscar en la biblioteca");
  });

  it("keeps the label available to assistive technology while hiding it visually", () => {
    expect(render()).toContain('class="sr-only"');
  });

  it("honours a caller-supplied id so external labels and ARIA can target it", () => {
    const html = render({ id: "library-search" });
    expect(html).toContain('for="library-search"');
    expect(html).toContain('id="library-search"');
  });

  it("renders a search input", () => {
    expect(render()).toContain('type="search"');
  });

  it("stays uncontrolled with a form name, preserving the URL filter contract", () => {
    const html = render({ name: "q", defaultValue: "campaña" });
    expect(html).toContain('name="q"');
    expect(html).toContain('value="campaña"');
  });

  it("advertises the / shortcut to assistive technology", () => {
    expect(render()).toContain('aria-keyshortcuts="/"');
  });

  it("drops both the shortcut hint and its ARIA when the shortcut is off", () => {
    const html = render({ shortcut: false });
    expect(html).not.toContain("aria-keyshortcuts");
    expect(html).not.toContain(">/</span>");
  });

  it("shows the / hint only where the explorer breakpoint leaves room, reserving its padding only there", () => {
    const html = render();
    expect(html).toMatch(/class="[^"]*\bhidden\b[^"]*\bexplorer:block\b[^"]*">\/<\/span>/);
    expect(html).toMatch(/<input[^>]*class="[^"]*\bpr-4 explorer:pr-9\b/);
    // Hiding the hint never hides the shortcut from assistive technology.
    expect(html).toContain('aria-keyshortcuts="/"');
  });

  it("keeps the decorative glyph and key hint out of the accessible name", () => {
    const html = render();
    expect(html).toContain('<span aria-hidden="true" class="pointer-events-none absolute left-3.5 text-sm text-label">⌕</span>');
    expect(html).toMatch(/aria-hidden="true"[^>]*>\/<\/span>/);
  });
});
