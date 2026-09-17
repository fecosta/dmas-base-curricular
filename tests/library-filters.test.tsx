import { renderToStaticMarkup as render } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LibraryFilterGroups, LibraryFilterPanel } from "@/components/library/filter-panel";
import { ActiveFilters } from "@/components/library/active-filters";
import { appliedFilters } from "@/lib/curriculum/library-state";

const countries = ["Chile", "Perú"];
const themes = ["Democracia", "Participación"];
const axes = [{ id: "aaaaaaaa-0000-4000-8000-000000000001", name: "Estrategia y Campaña" }];

const applied = { q: "campaña", axis: axes[0].id, country: "Perú", theme: "Democracia", view: "programa" };

function groups(query: Record<string, string> = {}) {
  return render(<LibraryFilterGroups query={query} countries={countries} themes={themes} />);
}

/** Every href the rendered markup offers, in order. */
function hrefs(html: string) {
  return [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1].replaceAll("&amp;", "&"));
}

describe("Library filter groups", () => {
  it("offers each dimension as links rather than a form to submit", () => {
    const html = groups();
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<select");
    expect(hrefs(html).every((href) => href.startsWith("/app/library"))).toBe(true);
  });

  it("names each group of values, not only its disclosure", () => {
    const html = groups();
    expect(html).toContain('role="group" aria-label="País o alcance"');
    expect(html).toContain('role="group" aria-label="Tema"');
  });

  it("renders the live vocabulary the Library query returned", () => {
    const html = groups();
    for (const value of [...countries, ...themes]) expect(html).toContain(`>${value}</span>`);
  });

  /* Applying one value must not discard the others; the URL is the whole state. */
  it("carries every other applied filter into each value's URL", () => {
    const html = groups(applied);
    const chile = hrefs(html).find((href) => href.includes("country=Chile"))!;
    const params = new URLSearchParams(chile.split("?")[1]);

    expect(params.get("country")).toBe("Chile");
    expect(params.get("q")).toBe("campaña");
    expect(params.get("axis")).toBe(axes[0].id);
    expect(params.get("theme")).toBe("Democracia");
    expect(params.get("view")).toBe("programa");
  });

  it("marks the applied value and points it back at the state without it", () => {
    const html = groups(applied);
    const selected = /<a[^>]*aria-current="true"[^>]*href="([^"]*)"|<a[^>]*href="([^"]*)"[^>]*aria-current="true"/g;
    const marked = [...html.matchAll(selected)].map((match) => (match[1] ?? match[2]).replaceAll("&amp;", "&"));

    // Exactly the two applied values, each offering its own removal.
    expect(marked).toHaveLength(2);
    expect(marked.some((href) => !href.includes("country="))).toBe(true);
    expect(marked.some((href) => !href.includes("theme="))).toBe(true);
  });

  it("marks the group's catch-all when that dimension is unfiltered", () => {
    const html = groups({ country: "Perú" });
    // "Todos" for theme is current; "Todos" for country is not.
    expect([...html.matchAll(/aria-current="true"/g)]).toHaveLength(2);
  });
});

describe("Library filter panel", () => {
  const panel = (hasFilters: boolean) =>
    render(<LibraryFilterPanel query={applied} countries={countries} themes={themes} hasFilters={hasFilters} />);

  it("is a named landmark holding the filter controls", () => {
    expect(panel(true)).toContain('aria-labelledby="library-filters-title"');
    expect(panel(true)).toContain('id="library-filters-title"');
  });

  it("offers a reset only when something is applied", () => {
    expect(panel(true)).toContain("Limpiar");
    expect(panel(false)).not.toContain("Limpiar");
  });

  it("resets to the canonical Library while keeping the chosen view", () => {
    expect(hrefs(panel(true))).toContain("/app/library?view=programa");
  });
});

describe("active filters", () => {
  const active = (query: Record<string, string>) =>
    render(<ActiveFilters filters={appliedFilters(query, axes)} query={query} />);

  it("renders nothing when nothing is applied", () => {
    expect(active({})).toBe("");
  });

  it("shows every applied value with its removal URL", () => {
    const html = active(applied);
    expect(html).toContain("«campaña»");
    expect(html).toContain("Estrategia y Campaña");
    expect(html).toContain("Perú");
    expect(html).toContain("Democracia");

    const removals = hrefs(html);
    expect(removals.some((href) => !href.includes("country=") && href.includes("theme="))).toBe(true);
  });

  it("names each removal by what it removes, not by the bare value", () => {
    const html = active(applied);
    expect(html).toContain('aria-label="Quitar Tema: Democracia"');
    expect(html).toContain('aria-label="Quitar País o alcance: Perú"');
    expect(html).toContain('aria-label="Quitar Búsqueda: «campaña»"');
  });

  it("keeps the dismiss glyph out of every accessible name", () => {
    expect(active(applied)).toContain('<span aria-hidden="true"');
  });

  it("offers one reset for everything, preserving the view", () => {
    const html = active(applied);
    expect(html).toContain("Limpiar todo");
    expect(hrefs(html)).toContain("/app/library?view=programa");
  });
});
