import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isLibrarySearchPath } from "@/lib/ui/nav";

const { route } = vi.hoisted(() => ({ route: { pathname: "/app/library", search: "" } }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search),
  // The shell search navigates to a suggestion's canonical route when one is
  // chosen by keyboard; static rendering never reaches it.
  useRouter: () => ({ push: () => {} }),
}));
import { ShellSearch } from "@/components/shell-search";
import { SuggestionPopover, suggestionItems, suggestionsFor } from "@/components/search-suggestions";
import type { SuggestionGroup } from "@/lib/curriculum/suggestions";

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

/*
 * Phase 3 added the suggestion popover. The field keeps every Phase 2 contract
 * above; what follows is the combobox shell that fetching suggestions requires.
 */
describe("ShellSearch suggestions", () => {
  beforeEach(() => { route.pathname = "/app/library"; route.search = ""; });

  it("exposes the field as a combobox over its suggestion list", () => {
    const html = render("/app/library");
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-autocomplete="list"');
    // Still a search input on a search form, not a generic text box.
    expect(html).toContain('type="search"');
    expect(html).toContain('role="search"');
  });

  it("points the combobox at the popover it controls", () => {
    const html = render("/app/library");
    const controls = /aria-controls="([^"]+)"/.exec(html)?.[1];
    expect(controls).toBeTruthy();
  });

  it("starts collapsed, with no suggestion list rendered and nothing active", () => {
    const html = render("/app/library", "?q=democracia");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="listbox"');
    expect(html).not.toContain("aria-activedescendant");
  });

  it("keeps the / shortcut the shell search has always advertised", () => {
    expect(render("/app/library")).toContain('aria-keyshortcuts="/"');
  });

  it("turns the browser's own autocomplete off, leaving one suggestion source", () => {
    // HTML attribute names are case-insensitive; React serialises this one in
    // the casing it was given.
    expect(render("/app/library")).toMatch(/autocomplete="off"/i);
  });
});

/*
 * Between two queries there is a window — the debounce, then the request — in
 * which the only answer on hand belongs to the query that was just replaced.
 * Exposing it during that window would leave the reader looking at, moving
 * through and opening results for a query they had already abandoned, since
 * aborting the request does not retract a list that is already on screen.
 */
describe("suggestions describe the query on screen", () => {
  const answer: SuggestionGroup[] = [{
    entity: "module",
    label: "Módulos",
    items: [{ id: "m1", title: "Campaña territorial", subtitle: "Estrategia y Campaña", href: "/app/library/modules/m1" }],
  }];

  it("hands an answer over for the term it was fetched for", () => {
    const { groups, ready } = suggestionsFor("campaña", { query: "campaña", groups: answer });
    expect(groups).toEqual(answer);
    expect(ready).toBe(true);
  });

  it("withholds the previous query's groups while a newer query is still settling", () => {
    const { groups, ready } = suggestionsFor("campañas", { query: "campaña", groups: answer });
    expect(groups).toEqual([]);
    expect(suggestionItems(groups)).toEqual([]);
    // Withheld, not answered: a pending query is not a query that found nothing.
    expect(ready).toBe(false);
  });

  it("withholds them before any answer has arrived at all", () => {
    expect(suggestionsFor("campaña", { query: "", groups: [] }).ready).toBe(false);
  });

  it("withholds them for a query too short to have been asked", () => {
    const { groups, ready } = suggestionsFor("c", { query: "c", groups: answer });
    expect(groups).toEqual([]);
    expect(ready).toBe(false);
  });

  it("reports a settled query that matched nothing", () => {
    const { groups, ready } = suggestionsFor("campaña", { query: "campaña", groups: [] });
    expect(groups).toEqual([]);
    expect(ready).toBe(true);
  });
});

describe("the popover renders only the current query's options", () => {
  const answer: SuggestionGroup[] = [{
    entity: "module",
    label: "Módulos",
    items: [{ id: "m1", title: "Campaña territorial", subtitle: "Estrategia y Campaña", href: "/app/library/modules/m1" }],
  }];

  function popover({ groups, ready }: { groups: readonly SuggestionGroup[]; ready: boolean }, activeIndex = -1) {
    return renderToStaticMarkup(<SuggestionPopover
      id="suggestions"
      groups={groups}
      ready={ready}
      query="campañas"
      activeIndex={activeIndex}
      optionId={(index) => `suggestions-o${index}`}
      onSelect={() => {}}
    />);
  }

  /*
   * Nothing to see, nothing to select, and nothing for assistive technology to
   * read as belonging to what is typed.
   */
  it("renders no option from a query that has been replaced", () => {
    const html = popover(suggestionsFor("campañas", { query: "campaña", groups: answer }));
    expect(html).not.toContain('role="option"');
    expect(html).not.toContain("Campaña territorial");
    expect(html).not.toContain("/app/library/modules/m1");
  });

  it("does not claim the pending query found nothing", () => {
    expect(popover(suggestionsFor("campañas", { query: "campaña", groups: answer }))).not.toContain("Sin sugerencias");
  });

  it("does report a settled query that found nothing", () => {
    expect(popover(suggestionsFor("campañas", { query: "campañas", groups: [] }))).toContain("Sin sugerencias");
  });

  it("selects nothing until the reader moves through the current list", () => {
    const html = popover(suggestionsFor("campaña", { query: "campaña", groups: answer }));
    expect(html).toContain('role="option"');
    expect(html).not.toContain('aria-selected="true"');
  });

  it("marks the highlighted option of the current list", () => {
    const html = popover(suggestionsFor("campaña", { query: "campaña", groups: answer }), 0);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('id="suggestions-o0"');
  });
});
