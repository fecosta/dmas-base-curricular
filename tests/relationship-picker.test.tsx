import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RelationshipPicker, relationshipOptionView } from "@/app/app/contributions/relationship-picker";
import type { ContributionOption } from "@/lib/contributions/types";

/*
 * SPEC-006 Phase 5 — relationship selection.
 *
 * The picker's contract is submission semantics plus one filtering rule: a
 * search may hide options the Admin has not chosen, and may never hide one they
 * have. Phase 5 restyled it, so both are asserted here rather than left to the
 * browser suite, which exercises selection through real checkboxes.
 */

const options: ContributionOption[] = [
  { id: "11111111-1111-4111-8111-111111111111", label: "Informe de campaña", state: "published" },
  { id: "22222222-2222-4222-8222-222222222222", label: "Manual de políticas", state: "draft" },
  { id: "33333333-3333-4333-8333-333333333333", label: "Estudio comparado", state: "published_with_draft" },
];

const view = (chosen: string[], term = "") => relationshipOptionView(options, chosen, term);

describe("relationshipOptionView", () => {
  it("shows every option when nothing is being searched", () => {
    expect(view([]).visible).toHaveLength(3);
    expect(view([]).selected).toHaveLength(0);
    expect(view([]).hiddenBySearch).toBe(0);
  });

  it("narrows unselected options by the search term", () => {
    const { visible, hiddenBySearch } = view([], "manual");
    expect(visible.map((option) => option.label)).toEqual(["Manual de políticas"]);
    expect(hiddenBySearch).toBe(2);
  });

  it("matches without regard to case or accents", () => {
    expect(view([], "POLÍTICAS").visible).toHaveLength(1);
    expect(view([], "politicas").visible).toHaveLength(1);
    expect(view([], "CAMPAÑA").visible[0].label).toBe("Informe de campaña");
  });

  it("keeps a selected option visible even when the search excludes it", () => {
    const { visible, selected } = view([options[0].id], "manual");
    expect(visible.map((option) => option.id)).toContain(options[0].id);
    expect(visible).toHaveLength(2);
    // The selection itself is never filtered: it is the whole selection.
    expect(selected.map((option) => option.id)).toEqual([options[0].id]);
  });

  it("reports the full selection while a search is narrowing the list", () => {
    const { selected } = view([options[0].id, options[1].id], "estudio");
    expect(selected).toHaveLength(2);
  });

  it("drops an option from the selection once it is removed", () => {
    expect(view([options[0].id, options[1].id]).selected).toHaveLength(2);
    expect(view([options[1].id]).selected.map((option) => option.label)).toEqual(["Manual de políticas"]);
    expect(view([]).selected).toHaveLength(0);
  });

  it("finds nothing rather than everything for a term no option matches", () => {
    expect(view([], "inexistente").visible).toHaveLength(0);
    expect(view([], "inexistente").hiddenBySearch).toBe(3);
  });
});

describe("RelationshipPicker markup", () => {
  const html = (props: Partial<React.ComponentProps<typeof RelationshipPicker>> = {}) => renderToStaticMarkup(
    <RelationshipPicker
      name="material_ids"
      legend="Materiales o estudios"
      searchLabel="Buscar materiales"
      options={options}
      {...props}
    />,
  );

  it("submits through real checkboxes sharing one name, one per option", () => {
    const markup = html();
    const boxes = markup.match(/<input type="checkbox"[^>]*name="material_ids"[^>]*>/g) ?? [];
    expect(boxes).toHaveLength(options.length);
    for (const option of options) expect(markup).toContain(`value="${option.id}"`);
  });

  it("marks the revision's existing relationships as checked", () => {
    const markup = html({ selected: [options[2].id] });
    expect(markup).toMatch(new RegExp(`name="material_ids" checked="" value="${options[2].id}"`));
    expect(markup).not.toMatch(new RegExp(`name="material_ids" checked="" value="${options[0].id}"`));
  });

  it("ignores a stored relationship that is no longer an available option", () => {
    const markup = html({ selected: ["99999999-9999-4999-8999-999999999999"] });
    expect(markup).not.toContain("99999999-9999-4999-8999-999999999999");
  });

  it("names the group so its options are announced as belonging to it", () => {
    const markup = html();
    expect(markup).toContain("<legend");
    expect(markup).toContain("Materiales o estudios");
    expect(markup).toContain('aria-label="Opciones de Materiales o estudios"');
  });

  it("gives each removal chip an accessible name saying what it removes", () => {
    const markup = html({ selected: [options[1].id] });
    expect(markup).toContain('aria-label="Quitar Manual de políticas"');
  });

  it("marks an option that is not a plain published record", () => {
    const markup = html();
    expect(markup).toContain("(borrador)");
    expect(markup).toContain("(nueva versión en borrador)");
  });

  it("says so plainly when there is nothing to relate to yet", () => {
    expect(html({ options: [] })).toContain("Todavía no hay opciones disponibles para vincular.");
  });
});
