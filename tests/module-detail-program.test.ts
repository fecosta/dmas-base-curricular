import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getModule } = vi.hoisted(() => ({ getModule: vi.fn() }));
vi.mock("@/lib/curriculum/queries", () => ({ getModule }));
import ModulePage from "@/app/app/library/modules/[id]/page";

const base = {
  id: "m1", revisionId: "r1", title: "Planificación", description: "Descripción", theme: "Estrategia",
  learningOutcomes: [] as string[], suggestedDuration: "12h", axis: { id: "a1", name: "Eje 1" },
  programTopics: [] as unknown[], instructors: [], teachingNotes: [] as unknown[], materials: [], institutions: [],
};

const note = (id: string, title: string, programTopicId: string | null) => ({
  id, title, text: "Orientación", sourceUrl: null, programTopicId, materials: [], attachments: [],
});

async function render(detail: Record<string, unknown>) {
  getModule.mockResolvedValue(detail);
  return renderToStaticMarkup(await ModulePage({ params: Promise.resolve({ id: "m1" }) }));
}

describe("module detail program structure", () => {
  beforeEach(() => vi.resetAllMocks());

  it("renders a teaching note inside the program topic it references", async () => {
    const html = await render({
      ...base,
      programTopics: [
        { id: "t1", title: "Lectura del escenario", description: "Contexto", position: 1 },
        { id: "t2", title: "Camino a la victoria", description: null, position: 2 },
      ],
      teachingNotes: [note("n1", "Cómo facilitar el taller", "t1")],
    });
    const topicOne = html.indexOf("Lectura del escenario");
    const noteIndex = html.indexOf("Cómo facilitar el taller");
    const topicTwo = html.indexOf("Camino a la victoria");
    expect(topicOne).toBeGreaterThan(-1);
    // The note is rendered between its own topic and the next one.
    expect(noteIndex).toBeGreaterThan(topicOne);
    expect(noteIndex).toBeLessThan(topicTwo);
    expect(html).toContain("Nota docente");
    expect(html).not.toContain("Notas docentes generales");
  });

  it("does not repeat a note title that merely restates its topic", async () => {
    const shared = "Sala de respuesta rápida: roles y rutinas";
    const html = await render({
      ...base,
      programTopics: [{ id: "t1", title: shared, description: null, position: 1 }],
      teachingNotes: [note("n1", shared, "t1")],
    });
    expect(html).toContain("Nota docente");
    expect(html.split(shared).length - 1).toBe(1);
  });

  it("keeps program topics in their published order", async () => {
    const html = await render({
      ...base,
      programTopics: [
        { id: "t1", title: "Primero", description: null, position: 1 },
        { id: "t2", title: "Segundo", description: null, position: 2 },
        { id: "t3", title: "Tercero", description: null, position: 3 },
      ],
    });
    expect(html.indexOf("Primero")).toBeLessThan(html.indexOf("Segundo"));
    expect(html.indexOf("Segundo")).toBeLessThan(html.indexOf("Tercero"));
  });

  it("keeps an unassociated teaching note visible in the general area", async () => {
    const html = await render({
      ...base,
      programTopics: [{ id: "t1", title: "Lectura del escenario", description: null, position: 1 }],
      teachingNotes: [note("n1", "Nota del tema", "t1"), note("n2", "Nota general del módulo", null)],
    });
    expect(html).toContain("Notas docentes generales");
    expect(html).toContain("Nota general del módulo");
    // Each note is rendered exactly once.
    expect(html.split("Nota general del módulo").length - 1).toBe(1);
    expect(html.split("Nota del tema").length - 1).toBe(1);
  });

  it("renders a note whose topic is absent from the published program", async () => {
    const html = await render({
      ...base,
      programTopics: [],
      teachingNotes: [note("n1", "Nota huérfana", null)],
    });
    expect(html).toContain("Nota huérfana");
    expect(html).toContain("Sin temas de Programa");
  });

  it("renders full-sentence learning outcomes as a list rather than badges", async () => {
    const outcome = "Producir un plan de campaña completo, con metas de voto y presupuesto";
    const html = await render({ ...base, learningOutcomes: [outcome] });
    expect(html).toContain(outcome);
    expect(html).toContain("Resultados de aprendizaje");
    const listItem = html.slice(html.indexOf("Resultados de aprendizaje"));
    expect(listItem).toContain("<ul");
  });

  it("does not surface metadata that is not part of the current reader UX", async () => {
    const html = await render({ ...base, level: "Avanzado", delivery_format: "Híbrido" });
    expect(html).not.toContain("Avanzado");
    expect(html).not.toContain("Híbrido");
  });
});
