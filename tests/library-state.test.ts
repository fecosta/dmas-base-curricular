import { describe, expect, it } from "vitest";
import {
  appliedFilters,
  clearFiltersHref,
  entityHref,
  readEntity,
  readView,
  supportsProgram,
} from "@/lib/curriculum/library-state";

const axes = [
  { id: "aaaaaaaa-0000-4000-8000-000000000001", name: "Estrategia y Campaña" },
  { id: "aaaaaaaa-0000-4000-8000-000000000002", name: "Políticas Públicas" },
];

/** Applied state covering every dimension at once, so preservation is testable. */
const everything = {
  q: "campaña",
  entity: "module",
  axis: axes[0].id,
  country: "Perú",
  theme: "Participación",
  view: "programa",
};

function params(href: string) {
  return new URLSearchParams(href.split("?")[1] ?? "");
}

describe("reading Library URL state", () => {
  it("accepts only the entity values the search contract defines", () => {
    expect(readEntity({ entity: "module" })).toBe("module");
    expect(readEntity({ entity: "reference" })).toBe("reference");
    expect(readEntity({ entity: "material" })).toBe("material");
    expect(readEntity({ entity: "institution" })).toBe("institution");
    expect(readEntity({ entity: "instructor" })).toBeUndefined();
    expect(readEntity({})).toBeUndefined();
  });

  it("falls back to Grilla for anything that is not Programa", () => {
    expect(readView({ view: "programa" })).toBe("programa");
    expect(readView({ view: "grilla" })).toBe("grilla");
    expect(readView({ view: "lista" })).toBe("grilla");
    expect(readView({})).toBe("grilla");
  });

  it("offers Programa only on module-capable surfaces", () => {
    expect(supportsProgram(undefined)).toBe(true);
    expect(supportsProgram("module")).toBe(true);
    expect(supportsProgram("material")).toBe(false);
    expect(supportsProgram("institution")).toBe(false);
    expect(supportsProgram("reference")).toBe(false);
  });

  it("renders a reference surface as Grilla even when the URL still asks for Programa", () => {
    expect(readView({ entity: "module", view: "programa" })).toBe("programa");
    expect(readView({ entity: "material", view: "programa" })).toBe("grilla");
    expect(readView({ entity: "institution", view: "programa" })).toBe("grilla");
    expect(readView({ entity: "reference", view: "programa" })).toBe("grilla");
    // An entity outside the contract reads as Todo, which can present Programa.
    expect(readView({ entity: "otro", view: "programa" })).toBe("programa");
  });

  it("points each result family at its existing canonical route", () => {
    expect(entityHref("module", "abc")).toBe("/app/library/modules/abc");
    expect(entityHref("material", "abc")).toBe("/app/library/references/material/abc");
    expect(entityHref("institution", "abc")).toBe("/app/library/references/institution/abc");
  });
});

describe("applied filters", () => {
  it("describes every applied dimension, naming its group", () => {
    const applied = appliedFilters(everything, axes);
    expect(applied.map((filter) => [filter.param, filter.group, filter.label])).toEqual([
      ["q", "Búsqueda", "«campaña»"],
      ["entity", "Tipo", "Módulos"],
      ["axis", "Eje", "Estrategia y Campaña"],
      ["country", "País o alcance", "Perú"],
      ["theme", "Tema", "Participación"],
    ]);
  });

  it("reports nothing when nothing narrows the Library", () => {
    expect(appliedFilters({}, axes)).toEqual([]);
    // The view is a presentation mode, not a filter.
    expect(appliedFilters({ view: "programa" }, axes)).toEqual([]);
  });

  /* Removal is as URL-driven as application: one value out, everything else intact. */
  it("removes exactly one value and preserves every other applied filter", () => {
    const applied = appliedFilters(everything, axes);
    const theme = applied.find((filter) => filter.param === "theme")!;
    const removed = params(theme.href);

    expect(removed.has("theme")).toBe(false);
    expect(removed.get("q")).toBe("campaña");
    expect(removed.get("entity")).toBe("module");
    expect(removed.get("axis")).toBe(axes[0].id);
    expect(removed.get("country")).toBe("Perú");
    expect(removed.get("view")).toBe("programa");
  });

  it("removes the search term without disturbing the filters around it", () => {
    const search = appliedFilters(everything, axes).find((filter) => filter.param === "q")!;
    const removed = params(search.href);
    expect(removed.has("q")).toBe(false);
    expect(removed.get("country")).toBe("Perú");
    expect(removed.get("theme")).toBe("Participación");
  });

  it("names removal by what is being removed, not by the value alone", () => {
    const applied = appliedFilters(everything, axes);
    expect(applied.find((filter) => filter.param === "theme")!.removeLabel).toBe("Quitar Tema: Participación");
    expect(applied.find((filter) => filter.param === "axis")!.removeLabel).toBe("Quitar Eje: Estrategia y Campaña");
  });

  it("resolves the axis through the live vocabulary rather than echoing its id", () => {
    expect(appliedFilters({ axis: axes[1].id }, axes)[0].label).toBe("Políticas Públicas");
    // An axis the vocabulary no longer holds has no meaningful chip; the Eje
    // control's "Todos" option still clears it.
    expect(appliedFilters({ axis: "aaaaaaaa-0000-4000-8000-00000000ffff" }, axes)).toEqual([]);
  });

  it("ignores whitespace-only searches", () => {
    expect(appliedFilters({ q: "   " }, axes)).toEqual([]);
  });
});

describe("clearing filters", () => {
  it("drops every narrowing dimension", () => {
    const cleared = params(clearFiltersHref(everything));
    for (const param of ["q", "entity", "axis", "country", "theme"]) {
      expect(cleared.has(param), `${param} survived clear-all`).toBe(false);
    }
  });

  /*
   * Grilla/Programa chooses how results are presented, not which results there
   * are, so clearing filters must not silently throw the reader back to Grilla.
   */
  it("keeps the reader's chosen view", () => {
    expect(clearFiltersHref(everything)).toBe("/app/library?view=programa");
    expect(clearFiltersHref({ ...everything, view: "grilla" })).toBe("/app/library?view=grilla");
  });

  it("returns the canonical bare Library when there is nothing else to keep", () => {
    expect(clearFiltersHref({})).toBe("/app/library");
    expect(clearFiltersHref({ q: "x", country: "Perú" })).toBe("/app/library");
  });
});
