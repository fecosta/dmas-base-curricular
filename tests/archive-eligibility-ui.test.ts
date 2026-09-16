import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getContribution, getContributionOptions } = vi.hoisted(() => ({
  getContribution: vi.fn(),
  getContributionOptions: vi.fn(),
}));
vi.mock("@/lib/contributions/queries", () => ({ getContribution, getContributionOptions }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("notFound"); } }));
import ContributionDetailPage from "@/app/app/contributions/[type]/[revisionId]/page";

const contentId = "30000000-0000-4000-8000-000000000001";
const revisionId = "31000000-0000-4000-8000-000000000001";

function detail(overrides: Record<string, unknown> = {}) {
  return {
    type: "institution",
    revisionId,
    contentId,
    status: "Published",
    revisionNumber: 1,
    createdAt: "2026-09-01T00:00:00Z",
    publishedAt: "2026-09-02T00:00:00Z",
    currentPublishedRevisionId: revisionId,
    successorDraftRevisionId: null,
    fields: { name: "Instituto de políticas", institution_type: "Centro de estudios" },
    relationships: {},
    attachments: [],
    ...overrides,
  };
}

async function render() {
  return renderToStaticMarkup(await ContributionDetailPage({
    params: Promise.resolve({ type: "institution", revisionId }),
    searchParams: Promise.resolve({}),
  }));
}

describe("Archive eligibility on the published revision detail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getContributionOptions.mockResolvedValue({ axes: [], modules: [], programTopics: [], instructors: [], materials: [], institutions: [] });
  });

  it("offers Archive in a governance area for published content with no successor Draft", async () => {
    getContribution.mockResolvedValue(detail());
    const html = await render();
    expect(html).toContain("Gobernanza");
    expect(html).toContain("Archivar");
    expect(html).toContain("Crear nueva versión");
    // Governance sits apart from the editing controls, not inside the form.
    expect(html.indexOf("Gobernanza")).toBeGreaterThan(html.indexOf("Contenido publicado"));
  });

  it("does not present Archive while an active successor Draft exists", async () => {
    getContribution.mockResolvedValue(detail({ successorDraftRevisionId: "31000000-0000-4000-8000-000000000002" }));
    const html = await render();
    expect(html).not.toContain(">Archivar<");
    expect(html).toContain("Este contenido no se puede archivar mientras exista una nueva versión en borrador.");
  });

  it("does not offer Archive on a Draft revision", async () => {
    getContribution.mockResolvedValue(detail({ status: "Draft", currentPublishedRevisionId: null, successorDraftRevisionId: null }));
    const html = await render();
    expect(html).not.toContain("Gobernanza");
    expect(html).not.toContain(">Archivar<");
    expect(html).toContain("Publicar");
  });

  it("puts Archive behind a keyboard-reachable confirmation disclosure", async () => {
    getContribution.mockResolvedValue(detail());
    const html = await render();
    // The control is a real button wired to the panel it reveals, so the
    // confirmation step is reachable without a pointer. The panel copy itself is
    // asserted in the E2E flow, where it is actually opened.
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-controls="[^"]+"/);
    expect(html).not.toMatch(/se elimina permanentemente|borrar definitivamente/i);
    expect(html).not.toContain("Publicado → Archivado");
  });

  it("links to this identity's history from the governance area", async () => {
    getContribution.mockResolvedValue(detail());
    const html = await render();
    expect(html).toContain(`/app/contributions/history?type=institution&amp;content=${contentId}`);
    expect(html).toContain("Ver historial");
  });
});
