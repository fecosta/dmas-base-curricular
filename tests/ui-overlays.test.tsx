import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";

const noop = () => {};

function dialog(props: Partial<React.ComponentProps<typeof Dialog>> = {}) {
  return renderToStaticMarkup(
    <Dialog open onClose={noop} title="Detalle del módulo" {...props}>Cuerpo del diálogo</Dialog>,
  );
}

function drawer(props: Partial<React.ComponentProps<typeof Drawer>> = {}) {
  return renderToStaticMarkup(
    <Drawer open onClose={noop} title="Filtros" {...props}>Cuerpo del panel</Drawer>,
  );
}

/** Pulls the text of the element an overlay points its aria-labelledby at. */
function labelledBy(html: string) {
  const id = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
  if (!id) return null;
  return new RegExp(`<[^>]*id="${id.replace(/[:$]/g, "\\$&")}"[^>]*>([^<]*)<`).exec(html)?.[1] ?? null;
}

describe("Dialog", () => {
  it("renders a native dialog element rather than a div standing in for one", () => {
    expect(dialog()).toMatch(/^<dialog/);
  });

  it("names itself from its own title", () => {
    expect(labelledBy(dialog({ title: "Detalle del módulo" }))).toBe("Detalle del módulo");
  });

  it("renders its body only while open", () => {
    expect(dialog({ open: true })).toContain("Cuerpo del diálogo");
    expect(dialog({ open: false })).not.toContain("Cuerpo del diálogo");
  });

  it("never renders the open attribute itself, leaving showModal to open it", () => {
    // A server-rendered open attribute would produce a non-modal dialog: no
    // focus containment, no Escape, no top layer.
    expect(dialog({ open: true })).not.toMatch(/<dialog[^>]*\sopen[\s>]/);
  });

  it("gives the close control an accessible name", () => {
    expect(dialog()).toContain('aria-label="Cerrar"');
    expect(dialog({ closeLabel: "Cerrar detalle" })).toContain('aria-label="Cerrar detalle"');
  });

  it("keeps the dismiss glyph out of the accessible name", () => {
    expect(dialog()).toContain('<span aria-hidden="true">✕</span>');
  });

  it("holds a focusable panel so focus can land on the labelled container", () => {
    expect(dialog()).toContain('tabindex="-1"');
  });

  it("scrolls its body rather than the page behind it", () => {
    expect(dialog()).toContain("overflow-y-auto");
  });

  it("goes full-screen below the explorer breakpoint and sizes up above it", () => {
    expect(dialog({ size: "md" })).toContain("explorer:w-[min(760px,100%)]");
    expect(dialog({ size: "lg" })).toContain("explorer:w-[min(1060px,100%)]");
    expect(dialog()).toContain("h-full w-full");
  });

  it("renders optional header and footer slots only when given", () => {
    expect(dialog()).not.toContain("Alta de registros");
    expect(dialog({ eyebrow: "Alta de registros" })).toContain("Alta de registros");
    expect(dialog({ footer: <span>Pie del diálogo</span> })).toContain("Pie del diálogo");
  });
});

describe("Drawer", () => {
  it("renders a native dialog element, sharing the Dialog foundation", () => {
    expect(drawer()).toMatch(/^<dialog/);
  });

  it("names itself from its own title", () => {
    expect(labelledBy(drawer({ title: "Filtros" }))).toBe("Filtros");
  });

  it("renders its body only while open", () => {
    expect(drawer({ open: true })).toContain("Cuerpo del panel");
    expect(drawer({ open: false })).not.toContain("Cuerpo del panel");
  });

  it("never renders the open attribute itself, leaving showModal to open it", () => {
    expect(drawer({ open: true })).not.toMatch(/<dialog[^>]*\sopen[\s>]/);
  });

  it("anchors to the left edge at viewport height", () => {
    expect(drawer()).toContain("justify-start");
    expect(drawer()).toContain("h-dvh");
  });

  it("scrolls independently of the page behind it", () => {
    expect(drawer()).toContain("overflow-y-auto");
  });

  it("gives the close control an accessible name", () => {
    expect(drawer()).toContain('aria-label="Cerrar"');
  });
});
