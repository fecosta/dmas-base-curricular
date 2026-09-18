import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getModule, id } = vi.hoisted(() => ({
  getModule: vi.fn(),
  id: "9f8b2c26-7d38-4a41-9b7e-2f1b0c5a6d31",
}));
vi.mock("@/lib/curriculum/queries", () => ({ getModule }));
// The overlay reads the current route to know it is up, and dismisses by
// unwinding the navigation that opened it. Static rendering only needs the
// first; the browser suite owns the routing behaviour itself.
vi.mock("next/navigation", () => ({
  usePathname: () => `/app/library/modules/${id}`,
  useRouter: () => ({ back: () => {} }),
}));

import { isModuleDetailPath } from "@/lib/ui/nav";
import CanonicalModulePage from "@/app/app/library/modules/[id]/page";
import ContextualModulePage from "@/app/app/library/@modal/(.)modules/[id]/page";

/*
 * SPEC-006 Phase 4 — the contextual module overlay beside the canonical page.
 *
 * What is under test is the contract the two presentations share: one reader
 * query, one set of reader-visible content, and an overlay that is a dialog
 * rather than a second page. Which files Next.js reaches them through, and how a
 * route is intercepted, are settled in the browser by
 * tests/e2e/module-detail.spec.ts — they are routing mechanics, and they may
 * change without changing anything a reader can observe.
 */

/** A module carrying one of everything the reader contract can hold. */
const full = {
  id,
  revisionId: "6a3f0f4e-2c11-4a55-9f0a-1d2e3f4a5b6c",
  title: "Campaña territorial",
  description: "Módulo sobre organización territorial de campaña.",
  theme: "Participación",
  suggestedDuration: "16 horas",
  learningOutcomes: ["Producir un plan de campaña con metas de voto y presupuesto"],
  axis: { id: "a1", name: "Estrategia y Campaña" },
  programTopics: [
    { id: "t1", title: "Lectura del escenario", description: "Mapa de actores", position: 1 },
    { id: "t2", title: "Camino a la victoria", description: null, position: 2 },
  ],
  instructors: [{
    id: "i1", name: "Ana Rivas", roleOrTitle: "Directora de campaña", institution: "Centro Andino",
    profile: "Veinte años en campañas municipales.", linkedinUrl: "https://example.test/in/ana",
    themes: [], country: "Perú",
  }],
  teachingNotes: [
    {
      id: "n1", title: "Cómo facilitar el taller", text: "Divida el grupo en cuatro mesas.",
      sourceUrl: "https://example.test/fuente", programTopicId: "t1",
      materials: [{ id: "mat-2", title: "Guía de facilitación" }],
      attachments: [{ id: "att-1", originalFilename: "guion-taller.pdf", mimeType: "application/pdf", sizeBytes: 2048 }],
    },
    {
      id: "n2", title: "Nota general del módulo", text: "Orientación transversal.",
      sourceUrl: null, programTopicId: null, materials: [], attachments: [],
    },
  ],
  materials: [{
    id: "mat-1", title: "Manual de campaña", materialType: "Manual", description: null,
    sourceOrInstitution: null, sourceUrl: null, countryOrScope: "Perú", theme: "Participación",
  }],
  institutions: [{
    id: "inst-1", name: "Centro Andino", institutionType: "Centro de referencia",
    countryOrScope: "Perú", description: null, websiteUrl: null, themes: [],
  }],
};

async function canonical(detail: Record<string, unknown> = full) {
  getModule.mockResolvedValue(detail);
  return renderToStaticMarkup(await CanonicalModulePage({ params: Promise.resolve({ id }) }));
}

async function contextual(detail: Record<string, unknown> = full) {
  getModule.mockResolvedValue(detail);
  return renderToStaticMarkup(await ContextualModulePage({ params: Promise.resolve({ id }) }));
}

/** Text of the element an overlay points its aria-labelledby at. */
function labelledBy(html: string) {
  const labelId = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
  if (!labelId) return null;
  return new RegExp(`<[^>]*id="${labelId.replace(/[:$]/g, "\\$&")}"[^>]*>([^<]*)<`).exec(html)?.[1] ?? null;
}

/**
 * Everything the reader contract entitles someone to see for `full`, as text
 * either presentation must carry. Asserting the same list against both is what
 * keeps the overlay from quietly becoming a shorter module than the page.
 */
const readerContent = [
  "Estrategia y Campaña",
  "Campaña territorial",
  "Módulo sobre organización territorial de campaña.",
  "Participación",
  "16 horas",
  "Programa",
  "Lectura del escenario",
  "Mapa de actores",
  "Camino a la victoria",
  "Nota docente",
  "Cómo facilitar el taller",
  "Divida el grupo en cuatro mesas.",
  "Guía de facilitación",
  "Abrir fuente externa",
  "Descargar guion-taller.pdf",
  "Notas docentes generales",
  "Nota general del módulo",
  "Resultados de aprendizaje",
  "Producir un plan de campaña con metas de voto y presupuesto",
  "Docentes y especialistas",
  "Ana Rivas",
  "Directora de campaña",
  "Veinte años en campañas municipales.",
  "https://example.test/in/ana",
  "Materiales y estudios",
  "Manual de campaña",
  "/app/library/references/material/mat-1",
  "Instituciones",
  "Centro Andino",
  "/app/library/references/institution/inst-1",
];

/*
 * The overlay is presented for exactly the addresses this predicate accepts, so
 * it is what keeps the address bar and the screen from ever disagreeing.
 */
describe("the route an overlay belongs to", () => {
  it("accepts a module detail route", () => {
    expect(isModuleDetailPath(`/app/library/modules/${id}`)).toBe(true);
    expect(isModuleDetailPath(`/app/library/modules/${id}/`)).toBe(true);
    expect(isModuleDetailPath(`/app/library/modules/${id}?from=x`)).toBe(true);
  });

  it("rejects every other route a reader can reach from inside one", () => {
    // Following a Material or Institution link out of the overlay must take the
    // overlay with it rather than leave it covering the page.
    expect(isModuleDetailPath("/app/library/references/material/abc")).toBe(false);
    expect(isModuleDetailPath("/app/library/references/institution/abc")).toBe(false);
    expect(isModuleDetailPath("/app/library")).toBe(false);
    expect(isModuleDetailPath("/app/library?q=campana&view=programa")).toBe(false);
    expect(isModuleDetailPath("/app")).toBe(false);
    expect(isModuleDetailPath("/app/library/modules")).toBe(false);
    expect(isModuleDetailPath(null)).toBe(false);
  });
});

describe("contextual module detail", () => {
  beforeEach(() => vi.resetAllMocks());

  it("reads the module through the same published-reader query as the canonical route", async () => {
    await contextual();
    expect(getModule).toHaveBeenCalledExactlyOnceWith(id);

    vi.resetAllMocks();
    await canonical();
    expect(getModule).toHaveBeenCalledExactlyOnceWith(id);
  });

  it("presents the module as a dialog named by the module itself", async () => {
    const html = await contextual();
    expect(html).toMatch(/^<dialog/);
    expect(labelledBy(html)).toBe("Campaña territorial");
    expect(html).toContain('aria-label="Cerrar el detalle del módulo"');
  });

  it("does not open the dialog from the server, leaving showModal to make it modal", async () => {
    // A server-rendered open attribute would produce a non-modal dialog: no
    // focus containment, no Escape, no top layer, no inert background.
    expect(await contextual()).not.toMatch(/<dialog[^>]*\sopen[\s>]/);
  });

  it("stays an overlay over the Library rather than a second page", async () => {
    const html = await contextual();
    // The Library behind it already owns the document's one <main id="contenido">.
    expect(html).not.toContain('id="contenido"');
    // Closing is the way back; a page-level back link would leave the reader
    // somewhere the overlay had not been opened from.
    expect(html).not.toContain("Volver a la biblioteca");
  });

  it("keeps the canonical page a complete standalone experience", async () => {
    const html = await canonical();
    expect(html).toContain('<main id="contenido"');
    expect(html).toContain("Volver a la biblioteca");
    expect(html).not.toContain("<dialog");
  });

  it.each(readerContent)("shows %s in both presentations", async (content) => {
    expect(await contextual(), "missing from the overlay").toContain(content);
    vi.resetAllMocks();
    expect(await canonical(), "missing from the canonical page").toContain(content);
  });

  it("names the overlay with a heading rather than nesting a second h1 in the document", async () => {
    const html = await contextual();
    expect(html).not.toContain("<h1");
    // The dialog's own <h2> title is the overlay's accessible name.
    expect(html).toContain("<h2");
  });

  it("renders the reader's empty states when the module holds only what is required", async () => {
    const bare = {
      ...full, theme: null, suggestedDuration: null, learningOutcomes: [],
      programTopics: [], instructors: [], teachingNotes: [], materials: [], institutions: [],
    };
    const html = await contextual(bare);
    expect(html).toContain("Sin temas de Programa");
    expect(html).toContain("Sin perfiles asociados.");
    expect(html).toContain("Sin materiales asociados.");
    expect(html).toContain("Sin instituciones asociadas.");
    expect(html).not.toContain("Resultados de aprendizaje");
    expect(html).not.toContain("Notas docentes generales");
  });

  it("sizes the panel as a detail workspace and lays out to the width it is given", async () => {
    const html = await contextual();
    // The reference's centred detail panel above the explorer breakpoint,
    // full-screen below it.
    expect(html).toContain("explorer:w-[min(1060px,100%)]");
    expect(html).toContain("h-full w-full");
    // Content responds to the panel it sits in rather than to the viewport,
    // because the same markup renders at page width and inside the dialog.
    expect(html).toContain("@container");
    expect(html).toContain("@4xl:grid-cols-[minmax(0,1fr)_20rem]");
  });
});
