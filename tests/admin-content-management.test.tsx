import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAccess, getContribution, getContributionOptions, listManagedContent, listArchivedContent } = vi.hoisted(() => ({
  requireAccess: vi.fn(),
  getContribution: vi.fn(),
  getContributionOptions: vi.fn(),
  listManagedContent: vi.fn(),
  listArchivedContent: vi.fn(),
}));
vi.mock("@/lib/auth/access", () => ({ requireAccess }));
vi.mock("@/lib/contributions/queries", () => ({
  getContribution,
  getContributionOptions,
  listManagedContent,
  listArchivedContent,
  ARCHIVED_PAGE_SIZE: 20,
  resolveContentTitles: vi.fn(),
  contentReferenceKey: (type: string, contentId: string) => `${type}:${contentId}`,
  findActiveDraftRevision: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("notFound"); },
  useRouter: () => ({ refresh: () => {} }),
}));

import { ContributionForm } from "@/app/app/contributions/contribution-form";
import ContributionsPage from "@/app/app/contributions/page";
import ContributionDetailPage from "@/app/app/contributions/[type]/[revisionId]/page";
import NewContributionPage from "@/app/app/contributions/new/page";
import NewContributionTypePage from "@/app/app/contributions/new/[type]/page";
import { contributionTypes, type ContributionType } from "@/lib/contributions/types";

/*
 * SPEC-006 Phase 5 — Admin content-management presentation.
 *
 * What is under test is the contract the new composition must not have moved:
 * the six governed types and their canonical create routes, every authoritative
 * field name and required field, relationship submission semantics, the
 * Published/Draft distinction, and which lifecycle and governance actions are
 * offered in which state. Layout classes are deliberately not asserted.
 */

const contentId = "30000000-0000-4000-8000-000000000001";
const revisionId = "31000000-0000-4000-8000-000000000001";
const successorId = "31000000-0000-4000-8000-000000000002";

const emptyOptions = { axes: [], modules: [], programTopics: [], instructors: [], materials: [], institutions: [] };

const options = {
  axes: [{ id: "a0000000-0000-4000-8000-000000000001", name: "Estrategia y Campaña" }],
  modules: [{ id: "b0000000-0000-4000-8000-000000000001", label: "Planificación", state: "published" as const }],
  programTopics: [{ id: "c0000000-0000-4000-8000-000000000001", label: "Diagnóstico", state: "draft" as const }],
  instructors: [{ id: "d0000000-0000-4000-8000-000000000001", label: "Ana Ríos", state: "published" as const }],
  materials: [{ id: "e0000000-0000-4000-8000-000000000001", label: "Informe base", state: "published" as const }],
  institutions: [{ id: "f0000000-0000-4000-8000-000000000001", label: "Instituto", state: "published" as const }],
};

/** Every persisted control the production form is authoritative for. */
const contract: Record<ContributionType, { required: string[]; optional: string[]; relationships: string[] }> = {
  module: {
    required: ["axis_id", "title", "description"],
    optional: ["theme", "suggested_duration", "learning_outcomes"],
    relationships: ["instructor_ids", "material_ids", "institution_ids"],
  },
  program_topic: {
    required: ["module_id", "title"],
    optional: ["position", "description"],
    relationships: [],
  },
  instructor: {
    required: ["name"],
    optional: ["role_or_title", "institution", "country", "profile", "linkedin_url", "thematic_axis_or_themes"],
    relationships: [],
  },
  teaching_note: {
    required: ["module_id", "title"],
    optional: ["program_topic_id", "text", "source_url"],
    relationships: ["material_ids"],
  },
  material: {
    required: ["title", "material_type"],
    optional: ["description", "source_or_institution", "source_url", "country_or_scope", "theme"],
    relationships: [],
  },
  institution: {
    required: ["name", "institution_type"],
    optional: ["country_or_scope", "website_url", "description", "themes"],
    relationships: [],
  },
};

/** The opening tag of the named control, so attributes can be asserted on it. */
function control(html: string, name: string) {
  return html.match(new RegExp(`<(?:input|select|textarea)[^>]*name="${name}"[^>]*>`))?.[0] ?? null;
}

function detail(overrides: Record<string, unknown> = {}) {
  return {
    type: "material",
    revisionId,
    contentId,
    status: "Draft",
    revisionNumber: 1,
    createdAt: "2026-09-01T00:00:00Z",
    publishedAt: null,
    currentPublishedRevisionId: null,
    successorDraftRevisionId: null,
    fields: { title: "Estudio comparado", material_type: "Informe" },
    relationships: {},
    attachments: [],
    ...overrides,
  };
}

async function renderDetail(type = "material", query: { published?: string } = {}) {
  return renderToStaticMarkup(await ContributionDetailPage({
    params: Promise.resolve({ type, revisionId }),
    searchParams: Promise.resolve(query),
  }));
}

const summary = {
  type: "material" as const,
  contentId,
  title: "Estudio comparado",
  state: "published_with_draft" as const,
  currentPublishedRevisionId: revisionId,
  currentPublishedRevisionNumber: 1,
  draftRevisionId: successorId,
  draftRevisionNumber: 2,
  activityAt: "2026-09-10T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  requireAccess.mockResolvedValue({ role: "Admin" });
  getContributionOptions.mockResolvedValue(emptyOptions);
  listManagedContent.mockResolvedValue([summary]);
  listArchivedContent.mockResolvedValue({ entries: [], nextCursor: null });
});

describe("creation entry", () => {
  it("keeps exactly the six governed types, each on its canonical create route", async () => {
    const html = renderToStaticMarkup(await NewContributionPage());
    expect(contributionTypes.map((item) => item.type).sort()).toEqual(
      ["institution", "instructor", "material", "module", "program_topic", "teaching_note"],
    );
    for (const item of contributionTypes) {
      expect(html, `${item.type} route`).toContain(`href="/app/contributions/new/${item.type}"`);
      expect(html, `${item.type} label`).toContain(item.label);
    }
    expect(html.match(/href="\/app\/contributions\/new\//g)).toHaveLength(contributionTypes.length);
  });

  it("gates the picker on live Admin authority before rendering anything", async () => {
    await NewContributionPage();
    expect(requireAccess).toHaveBeenCalledWith("Admin");

    requireAccess.mockRejectedValue(new Error("redirect /access-denied"));
    await expect(NewContributionPage()).rejects.toThrow("redirect");
  });

  it("gates each typed create form on live Admin authority", async () => {
    await NewContributionTypePage({ params: Promise.resolve({ type: "material" }) });
    expect(requireAccess).toHaveBeenCalledWith("Admin");

    requireAccess.mockRejectedValue(new Error("redirect /access-denied"));
    await expect(NewContributionTypePage({ params: Promise.resolve({ type: "material" }) })).rejects.toThrow("redirect");
    // The gate runs before the content read, not after it.
    expect(getContributionOptions).toHaveBeenCalledTimes(1);
  });

  it("refuses a type that is not a governed content type", async () => {
    await expect(NewContributionTypePage({ params: Promise.resolve({ type: "guía" }) })).rejects.toThrow("notFound");
  });
});

describe("form contract", () => {
  for (const type of Object.keys(contract) as ContributionType[]) {
    it(`keeps every authoritative ${type} field, with its required fields still required`, () => {
      const html = renderToStaticMarkup(<ContributionForm type={type} options={options} />);
      expect(html).toContain(`<input type="hidden" name="content_type" value="${type}"/>`);

      for (const name of contract[type].required) {
        const markup = control(html, name);
        expect(markup, `${name} present`).not.toBeNull();
        expect(markup, `${name} required`).toContain("required");
      }
      for (const name of contract[type].optional) {
        const markup = control(html, name);
        expect(markup, `${name} present`).not.toBeNull();
        expect(markup, `${name} not required`).not.toContain("required");
      }
      for (const name of contract[type].relationships) {
        expect(html, `${name} submits as checkboxes`).toMatch(new RegExp(`<input type="checkbox"[^>]*name="${name}"`));
      }
    });
  }

  it("carries the revision id only when editing an existing Draft", () => {
    const create = renderToStaticMarkup(<ContributionForm type="material" options={options} />);
    expect(create).not.toContain('name="revision_id"');

    const edit = renderToStaticMarkup(<ContributionForm type="material" options={options} detail={detail() as never} />);
    expect(edit).toContain(`<input type="hidden" name="revision_id" value="${revisionId}"/>`);
  });

  it("renders every relationship option once, as a real checkbox sharing one name", () => {
    const html = renderToStaticMarkup(<ContributionForm type="module" options={options} />);
    const boxes = html.match(/<input type="checkbox"[^>]*name="material_ids"[^>]*>/g) ?? [];
    expect(boxes).toHaveLength(options.materials.length);
    expect(boxes[0]).toContain(options.materials[0].id);
  });

  it("preselects the relationships the revision already holds", () => {
    const html = renderToStaticMarkup(<ContributionForm
      type="module"
      options={options}
      detail={detail({ type: "module", relationships: { material_ids: [options.materials[0].id] } }) as never}
    />);
    expect(html).toMatch(new RegExp(`name="material_ids" checked="" value="${options.materials[0].id}"`));
  });

  it("offers Guardar borrador while editable and never on a read-only revision", () => {
    expect(renderToStaticMarkup(<ContributionForm type="material" options={options} />)).toContain("Guardar borrador");
    const readOnly = renderToStaticMarkup(<ContributionForm type="material" options={options} detail={detail() as never} readOnly />);
    expect(readOnly).not.toContain("Guardar borrador");
  });
});

describe("Draft and Published presentation", () => {
  it("leaves a Draft editable and offers publication, not a successor or governance", async () => {
    getContribution.mockResolvedValue(detail());
    const html = await renderDetail();
    expect(html).toContain("Editar borrador");
    expect(html).toContain("<fieldset class=");
    expect(html).not.toContain("<fieldset disabled=");
    expect(html).toContain("Guardar borrador");
    expect(html).toContain("Publicar");
    expect(html).not.toContain("Crear nueva versión");
    expect(html).not.toContain("Gobernanza");
  });

  it("makes a Published revision read-only through the disabled fieldset and says so in words", async () => {
    getContribution.mockResolvedValue(detail({ status: "Published", currentPublishedRevisionId: revisionId, publishedAt: "2026-09-02T00:00:00Z" }));
    const html = await renderDetail();
    expect(html).toContain("Contenido publicado");
    expect(html).toContain("<fieldset disabled=");
    expect(html).toContain("Solo lectura");
    expect(html).not.toContain("Guardar borrador");
    expect(html).not.toContain(">Publicar<");
    expect(html).toContain("Crear nueva versión");
  });

  it("links the existing successor Draft instead of offering to create a second one", async () => {
    getContribution.mockResolvedValue(detail({
      status: "Published",
      currentPublishedRevisionId: revisionId,
      successorDraftRevisionId: successorId,
    }));
    const html = await renderDetail();
    expect(html).toContain(`/app/contributions/material/${successorId}`);
    expect(html).toContain("Abrir el borrador existente");
    expect(html).not.toContain("Crear nueva versión");
    // Archival stays blocked while a successor exists, and says why.
    expect(html).not.toContain(">Archivar<");
    expect(html).toContain("Este contenido no se puede archivar mientras exista una nueva versión en borrador.");
  });

  it("tells a successor Draft apart from the version the Library still serves", async () => {
    getContribution.mockResolvedValue(detail({ revisionNumber: 2, currentPublishedRevisionId: revisionId }));
    const html = await renderDetail();
    expect(html).toContain("La biblioteca seguirá mostrando la versión anterior hasta que publiques este borrador.");
    // And offers the published version it is succeeding.
    expect(html).toContain("Ver la versión publicada");
  });

  it("confirms publication with a status announcement, never a review step", async () => {
    getContribution.mockResolvedValue(detail({ status: "Published", currentPublishedRevisionId: revisionId }));
    const html = await renderDetail("material", { published: "1" });
    expect(html).toContain('role="status"');
    expect(html).toContain("Publicado correctamente");
    expect(html).not.toMatch(/revisión|aprobar|aprobación|enviar a revisión/i);
  });
});

describe("attachments", () => {
  it("offers upload on a Draft of an attachment-bearing type", async () => {
    getContribution.mockResolvedValue(detail());
    const html = await renderDetail();
    expect(html).toContain("Archivos privados");
    expect(html).toContain("Agregar archivo");
    expect(html).toContain("Cargar archivo");
    expect(html).toContain("No hay archivos adjuntos.");
  });

  it("keeps attachments readable but immutable on a Published revision", async () => {
    getContribution.mockResolvedValue(detail({
      status: "Published",
      currentPublishedRevisionId: revisionId,
      attachments: [{ id: "att-1", mime_type: "application/pdf", object_name: "o", original_filename: "informe.pdf", size_bytes: 2048, state: "Ready" }],
    }));
    const html = await renderDetail();
    expect(html).toContain("informe.pdf");
    expect(html).toContain("/api/attachments/att-1");
    expect(html).not.toContain("Cargar archivo");
    expect(html).not.toContain(">Eliminar<");
  });

  it("names the recovery actions for an incomplete upload", async () => {
    getContribution.mockResolvedValue(detail({
      attachments: [{ id: "att-2", mime_type: "application/pdf", object_name: "o", original_filename: "parcial.pdf", size_bytes: 1024, state: "Reserved" }],
    }));
    const html = await renderDetail();
    expect(html).toContain("Completar carga");
    expect(html).toContain("Cancelar reserva");
    expect(html).toContain("Descartar carga");
    // The state is named, not only coloured.
    expect(html).toContain("Carga incompleta");
  });

  it("shows no attachment surface for a type that has none", async () => {
    getContribution.mockResolvedValue(detail({ type: "institution", fields: { name: "Instituto", institution_type: "Centro" } }));
    expect(await renderDetail("institution")).not.toContain("Archivos privados");
  });
});

describe("management landing", () => {
  const render = async (query: Record<string, string> = {}) =>
    renderToStaticMarkup(await ContributionsPage({ searchParams: Promise.resolve(query) }));

  it("keeps q, type and state as the GET filter contract", async () => {
    const html = await render();
    expect(html).toContain('method="get"');
    expect(html).toContain('name="q"');
    expect(html).toContain('name="type"');
    expect(html).toContain('name="state"');
    // No client-only applied state: the form posts to the same address.
    expect(html).not.toContain('method="post"');
  });

  it("forwards the applied filters to the management query unchanged", async () => {
    await render({ q: "estudio", type: "material", state: "draft" });
    expect(listManagedContent).toHaveBeenCalledWith({ query: "estudio", type: "material", state: "draft" });
  });

  it("offers each applied filter as a link that removes only that one value", async () => {
    const html = await render({ q: "estudio", type: "material", state: "draft" });
    expect(html).toContain("Filtros activos");
    // Removing the type keeps the search and the state.
    expect(html).toContain('href="/app/contributions?q=estudio&amp;state=draft"');
    expect(html).toContain('aria-label="Quitar el filtro de tipo Material o estudio"');
    // Removing the search keeps type and state.
    expect(html).toContain('href="/app/contributions?state=draft&amp;type=material"');
  });

  it("reaches the Draft and the Published revision of one identity from its row", async () => {
    const html = await render();
    expect(html).toContain("Nueva versión en borrador");
    expect(html).toContain(`href="/app/contributions/material/${successorId}"`);
    expect(html).toContain("Editar borrador");
    expect(html).toContain(`href="/app/contributions/material/${revisionId}"`);
    expect(html).toContain("Ver versión publicada");
  });

  it("separates an empty listing from an over-filtered one and offers the way out of each", async () => {
    listManagedContent.mockResolvedValue([]);
    const unfiltered = await render();
    expect(unfiltered).toContain("Todavía no hay contenido administrable");
    expect(unfiltered).toContain('href="/app/contributions/new"');

    const filtered = await render({ q: "inexistente" });
    expect(filtered).toContain("Sin resultados para estos filtros");
    expect(filtered).toContain("Limpiar filtros");
  });

  it("keeps creation and governance reachable from the workspace header", async () => {
    const html = await render();
    expect(html).toContain('href="/app/contributions/new"');
    expect(html).toContain("Crear contenido");
    expect(html).toContain('href="/app/contributions/history"');
    expect(html).toContain("Ver historial");
  });

  it("never presents the deferred collaborative review workflow", async () => {
    const html = await render();
    expect(html).not.toMatch(/En revisión|Cambios solicitados|Enviar a revisión|Aprobar/i);
  });
});
