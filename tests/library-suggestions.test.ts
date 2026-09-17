import { describe, expect, it } from "vitest";
import {
  groupSuggestions,
  maxSuggestionsPerFamily,
  minSuggestionQuery,
  suggestionFamilies,
  type SuggestionRow,
} from "@/lib/curriculum/suggestions";

function row(overrides: Partial<SuggestionRow> & Pick<SuggestionRow, "entity_type" | "id" | "title">): SuggestionRow {
  return { classification: "Eje", country_or_scope: null, theme: null, ...overrides };
}

describe("suggestion families", () => {
  /*
   * The published search contract returns modules, materials and institutions.
   * Nothing else is a searchable entity, so nothing else may be suggested.
   */
  it("covers exactly the published searchable entities", () => {
    expect(suggestionFamilies.map((family) => family.entity)).toEqual(["module", "material", "institution"]);
  });

  it("orders curriculum before references", () => {
    expect(suggestionFamilies.map((family) => family.label)).toEqual(["Módulos", "Materiales", "Instituciones"]);
  });
});

describe("grouping suggestions", () => {
  const rows = [
    row({ entity_type: "module", id: "m1", title: "Campaña electoral", classification: "Estrategia y Campaña", theme: "Participación" }),
    row({ entity_type: "institution", id: "i1", title: "Centro Regional", classification: "Centro de referencia", country_or_scope: "Regional" }),
    row({ entity_type: "material", id: "t1", title: "Guía de campaña", classification: "Manual", country_or_scope: "Perú" }),
  ];

  it("groups by family in the Explorer's order, whatever order the rows arrive in", () => {
    expect(groupSuggestions(rows).map((group) => group.entity)).toEqual(["module", "material", "institution"]);
  });

  it("drops families with no match rather than showing an empty heading", () => {
    const groups = groupSuggestions([rows[0]]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Módulos");
  });

  it("returns no groups at all for no matches", () => {
    expect(groupSuggestions([])).toEqual([]);
  });

  it("sends each suggestion to its existing canonical detail route", () => {
    const [modules, materials, institutions] = groupSuggestions(rows);
    expect(modules.items[0].href).toBe("/app/library/modules/m1");
    expect(materials.items[0].href).toBe("/app/library/references/material/t1");
    expect(institutions.items[0].href).toBe("/app/library/references/institution/i1");
  });

  it("subtitles a suggestion with its classification and scope", () => {
    const [modules, materials, institutions] = groupSuggestions(rows);
    expect(modules.items[0].subtitle).toBe("Estrategia y Campaña · Participación");
    expect(materials.items[0].subtitle).toBe("Manual · Perú");
    expect(institutions.items[0].subtitle).toBe("Centro de referencia · Regional");
  });

  it("omits an absent scope instead of rendering a dangling separator", () => {
    const [group] = groupSuggestions([row({ entity_type: "module", id: "m1", title: "Solo eje", classification: "Estrategia y Campaña" })]);
    expect(group.items[0].subtitle).toBe("Estrategia y Campaña");
  });

  /* The popover stays scannable, and the response stays small. */
  it("bounds each family", () => {
    const many = Array.from({ length: 40 }, (_, index) =>
      row({ entity_type: "module", id: `m${index}`, title: `Módulo ${index}` }));
    expect(groupSuggestions(many)[0].items).toHaveLength(maxSuggestionsPerFamily);
    expect(maxSuggestionsPerFamily).toBeLessThanOrEqual(5);
  });

  it("keeps the ranking the database returned within a family", () => {
    const ranked = [
      row({ entity_type: "module", id: "first", title: "Primero" }),
      row({ entity_type: "module", id: "second", title: "Segundo" }),
    ];
    expect(groupSuggestions(ranked)[0].items.map((item) => item.id)).toEqual(["first", "second"]);
  });

  /*
   * A suggestion carries only what the results list already shows the same
   * reader. Descriptions, revision ids and lifecycle state never leave the
   * server.
   */
  it("exposes no field beyond what a suggestion needs to render and navigate", () => {
    const [group] = groupSuggestions(rows);
    expect(Object.keys(group.items[0]).sort()).toEqual(["href", "id", "subtitle", "title"]);
  });

  it("does not suggest anything outside the published families", () => {
    const groups = groupSuggestions([
      row({ entity_type: "instructor", id: "d1", title: "Persona Ficticia" }),
      row({ entity_type: "teaching_note", id: "n1", title: "Nota reservada" }),
    ]);
    expect(groups).toEqual([]);
  });
});

describe("suggestion thresholds", () => {
  it("waits for more than a single letter before querying", () => {
    expect(minSuggestionQuery).toBeGreaterThanOrEqual(2);
  });
});
