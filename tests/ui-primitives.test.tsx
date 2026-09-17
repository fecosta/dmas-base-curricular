import { renderToStaticMarkup as render } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SegmentedLinks } from "@/components/ui/segmented";
import { FilterChip, FilterGroup } from "@/components/ui/filter";

describe("FilterChip", () => {
  const chip = (props: Partial<React.ComponentProps<typeof FilterChip>> = {}) =>
    render(<FilterChip label="España" href="/app/library?country=" selected {...props} />);

  it("navigates rather than posting, keeping the URL the filter contract", () => {
    expect(chip()).toMatch(/^<a /);
    expect(chip()).toContain('href="/app/library?country="');
  });

  it("marks the applied value for assistive technology", () => {
    expect(chip({ selected: true })).toContain('aria-current="true"');
    expect(chip({ selected: false })).not.toContain("aria-current");
  });

  it("shows a count only when one is supplied", () => {
    expect(chip({ count: 4 })).toContain(">4</span>");
    expect(chip()).not.toMatch(/>\d+<\/span>/);
  });

  it("shows a zero count rather than hiding it as falsy", () => {
    expect(chip({ count: 0 })).toContain(">0</span>");
  });
});

describe("FilterGroup", () => {
  const group = (props: Partial<React.ComponentProps<typeof FilterGroup>> = {}) =>
    render(<FilterGroup label="País o alcance" {...props}>chips</FilterGroup>);

  it("collapses without JavaScript", () => {
    expect(group()).toMatch(/^<details/);
    expect(group()).toContain("<summary");
  });

  it("is open by default and can start closed", () => {
    expect(group()).toContain("<details open");
    expect(group({ defaultOpen: false })).not.toContain("<details open");
  });

  it("surfaces how many values in the group are applied", () => {
    expect(group({ selectedCount: 2 })).toContain(">2</span>");
    expect(group({ selectedCount: 0 })).not.toMatch(/>\d+<\/span>/);
  });

  it("keeps the colour marker and caret decorative", () => {
    const html = group();
    expect(html).toContain('<span aria-hidden="true" class="size-[7px]');
    expect(html).toMatch(/aria-hidden="true"[^>]*>＋<\/span>/);
  });
});

describe("IconButton", () => {
  const icon = (props: Partial<React.ComponentProps<typeof IconButton>> = {}) =>
    render(<IconButton label="Cerrar" {...props}>✕</IconButton>);

  it("carries an accessible name because its glyph is decorative", () => {
    expect(icon()).toContain('aria-label="Cerrar"');
    expect(icon()).toContain('<span aria-hidden="true">✕</span>');
  });

  it("defaults to type=button so it cannot submit a surrounding form", () => {
    expect(icon()).toContain('type="button"');
  });

  it("offers a dark-header tone for overlay headers", () => {
    expect(icon({ tone: "on-dark" })).toContain("text-white");
    expect(icon()).toContain("text-ink-muted");
  });
});

/*
 * Refinements to the existing primitives are additive by construction. These
 * pin the parts current callers depend on.
 */
describe("existing primitives after the fidelity refinement", () => {
  it("keeps Button's default size and variant unchanged", () => {
    const html = render(<Button>Aplicar filtros</Button>);
    expect(html).toContain("px-5 py-3");
    expect(html).toContain("bg-primary");
  });

  it("adds a compact control size without disturbing sm or md", () => {
    expect(render(<Button size="xs">Abrir</Button>)).toContain("px-3.5 py-2.5 text-control");
    expect(render(<Button size="sm">Abrir</Button>)).toContain("px-3 py-2 text-sm");
  });

  it("keeps ButtonLink rendering an anchor", () => {
    expect(render(<ButtonLink href="/app/library">Biblioteca</ButtonLink>)).toMatch(/^<a /);
  });

  it("keeps Card's default elevation and accent rule", () => {
    const html = render(<Card accent="primary">contenido</Card>);
    expect(html).toContain("shadow-card");
    expect(html).toContain("border-t-primary");
  });

  it("offers a lifted panel elevation without changing the default", () => {
    expect(render(<Card elevation="panel">x</Card>)).toContain("shadow-panel");
    expect(render(<Card elevation="none">x</Card>)).not.toContain("shadow-");
  });

  it("keeps Field rendering its control inside an implicit label with verbatim text", () => {
    const html = render(<Field label="Título *"><input name="title" /></Field>);
    expect(html).toMatch(/^<label/);
    expect(html).toContain("Título *");
    expect(html).toContain('<input name="title"/>');
  });

  it("keeps SegmentedLinks link-based and marked with aria-current", () => {
    const html = render(<SegmentedLinks
      label="Vista"
      options={[
        { label: "Grilla", href: "/app/library?view=grilla", active: true },
        { label: "Programa", href: "/app/library?view=programa", active: false },
      ]}
    />);
    expect(html).toContain('role="group" aria-label="Vista"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/app/library?view=programa"');
  });
});
