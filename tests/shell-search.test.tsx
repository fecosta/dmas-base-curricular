import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isLibrarySearchPath } from "@/lib/ui/nav";

const { route } = vi.hoisted(() => ({ route: { pathname: "/app/library", search: "" } }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
}));
import { ShellSearch } from "@/components/shell-search";

function render(pathname: string, search = "") {
  route.pathname = pathname;
  route.search = search;
  return renderToStaticMarkup(<ShellSearch />);
}

describe("shell search scope", () => {
  it("covers the reader surfaces the Library search acts on", () => {
    expect(isLibrarySearchPath("/app")).toBe(true);
    expect(isLibrarySearchPath("/app/library")).toBe(true);
    expect(isLibrarySearchPath("/app/library?q=x")).toBe(true);
    expect(isLibrarySearchPath("/app/library/modules/abc")).toBe(true);
  });

  it("stays off surfaces where a Library search would be ambiguous", () => {
    expect(isLibrarySearchPath("/app/contributions")).toBe(false);
    expect(isLibrarySearchPath("/app/contributions/history")).toBe(false);
    // The development harness owns its own search input.
    expect(isLibrarySearchPath("/app/ui-primitives")).toBe(false);
  });

  it("does not match a sibling that merely shares a prefix", () => {
    expect(isLibrarySearchPath("/app/libraryx")).toBe(false);
    expect(isLibrarySearchPath(null)).toBe(false);
  });
});

describe("ShellSearch", () => {
  beforeEach(() => { route.pathname = "/app/library"; route.search = ""; });

  it("renders nothing outside the surfaces it is scoped to", () => {
    expect(render("/app/contributions")).toBe("");
    expect(render("/app/ui-primitives")).toBe("");
  });

  it("submits to the canonical Library route over GET", () => {
    const html = render("/app/library");
    expect(html).toContain('action="/app/library"');
    expect(html).toContain('method="get"');
  });

  it("is a labelled search landmark", () => {
    const html = render("/app/library");
    expect(html).toContain('role="search"');
    expect(html).toContain("Buscar en la biblioteca");
    expect(html).toContain('name="q"');
  });

  it("shows the query the URL currently holds", () => {
    expect(render("/app/library", "?q=campa%C3%B1a")).toContain('value="campaña"');
  });

  /*
   * The URL is the filter contract. Searching from the shell must narrow what
   * the reader already applied rather than quietly resetting it.
   */
  it("carries every other applied filter through as hidden state", () => {
    const html = render("/app/library", "?q=datos&country=Per%C3%BA&theme=Clima&axis=axis-1&entity=module&view=programa");
    expect(html).toContain('type="hidden" name="country" value="Perú"');
    expect(html).toContain('type="hidden" name="theme" value="Clima"');
    expect(html).toContain('type="hidden" name="axis" value="axis-1"');
    expect(html).toContain('type="hidden" name="entity" value="module"');
    expect(html).toContain('type="hidden" name="view" value="programa"');
  });

  it("does not carry the query itself as hidden state", () => {
    expect(render("/app/library", "?q=datos")).not.toContain('type="hidden" name="q"');
  });

  it("omits filters that are not applied", () => {
    const html = render("/app/library", "?country=Per%C3%BA");
    expect(html).toContain('name="country"');
    expect(html).not.toContain('name="theme"');
    expect(html).not.toContain('name="view"');
  });

  it("ignores parameters outside the Library contract", () => {
    const html = render("/app/library", "?role=Admin&country=Per%C3%BA");
    expect(html).not.toContain('name="role"');
    expect(html).toContain('name="country"');
  });
});
