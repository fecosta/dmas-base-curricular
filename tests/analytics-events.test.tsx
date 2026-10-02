import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn<(event: string, properties?: Record<string, unknown>) => void>() }));
vi.mock("@/lib/analytics/boundary", () => ({ track, disable: vi.fn(), enable: vi.fn() }));

import { ContentOpened } from "@/components/analytics/content-opened";
import { DownloadLink } from "@/components/analytics/download-link";
import { ExternalReferenceLink } from "@/components/analytics/external-reference-link";
import { LibraryActivity } from "@/components/analytics/library-activity";
import { analyticsEvents } from "@/lib/analytics/contract";

/** Collects the events a click handler emits from rendered markup. */
function clickHandlerOf(element: React.ReactElement): (() => void) | undefined {
  const props = element.props as { onClick?: () => void };
  return props.onClick;
}

beforeEach(() => vi.resetAllMocks());

/*
 * These components are exercised through their real React lifecycle below via
 * a minimal host. Where a component's contract is its rendered output rather
 * than an effect, the markup is asserted directly.
 */

describe("external reference links", () => {
  it("emits the canonical event with canonical identifiers only", () => {
    const element = ExternalReferenceLink({
      href: "https://externo.test/un/recurso?token=secreto",
      contentId: "material-1",
      contentType: "material",
      children: "Abrir sitio externo",
    }) as React.ReactElement;

    clickHandlerOf(element)!();

    expect(track).toHaveBeenCalledWith("external_reference_opened", {
      content_id: "material-1",
      content_type: "material",
    });
    // The destination is never reported, only navigated to.
    const [, properties] = track.mock.calls[0];
    expect(JSON.stringify(properties)).not.toContain("externo.test");
    expect(JSON.stringify(properties)).not.toContain("secreto");
  });

  it("still navigates to the destination it was given", () => {
    const element = ExternalReferenceLink({
      href: "https://externo.test/recurso",
      contentId: "material-1",
      contentType: "material",
      children: "Abrir",
    }) as React.ReactElement;
    const props = element.props as { href: string; target: string; rel: string };

    expect(props.href).toBe("https://externo.test/recurso");
    expect(props.target).toBe("_blank");
    expect(props.rel).toBe("noreferrer");
  });

  it("renders as a plain anchor, so it is not a generic application-wide tracker", () => {
    const html = renderToStaticMarkup(
      <ExternalReferenceLink href="https://externo.test" contentId="c1" contentType="institution">
        Abrir sitio externo
      </ExternalReferenceLink>,
    );
    expect(html).toContain('href="https://externo.test"');
    expect(html).toContain('rel="noreferrer"');
  });
});

describe("download links", () => {
  it("emits canonical identifiers and omits the original filename", () => {
    const element = DownloadLink({
      href: "/api/attachments/attachment-1",
      attachmentId: "attachment-1",
      contentId: "material-1",
      contentType: "material",
      children: "Descargar Informe confidencial 2026.pdf",
    }) as React.ReactElement;

    clickHandlerOf(element)!();

    expect(track).toHaveBeenCalledWith("content_downloaded", {
      attachment_id: "attachment-1",
      content_id: "material-1",
      content_type: "material",
    });
    const [, properties] = track.mock.calls[0];
    expect(JSON.stringify(properties)).not.toContain("confidencial");
    expect(JSON.stringify(properties)).not.toContain(".pdf");
  });

  it("keeps the filename as the visible label, which is a product concern", () => {
    const html = renderToStaticMarkup(
      <DownloadLink
        href="/api/attachments/a1"
        attachmentId="a1"
        contentId="material-1"
        contentType="material"
      >Descargar Informe.pdf</DownloadLink>,
    );
    expect(html).toContain("Descargar Informe.pdf");
    expect(html).toContain('href="/api/attachments/a1"');
  });
});

describe("the attachments surface supplies parent content context", () => {
  it("requires the content it belongs to, so a download is attributable", async () => {
    const { PublishedAttachments } = await import("@/app/app/library/published-attachments");
    const html = renderToStaticMarkup(
      <PublishedAttachments
        attachments={[{ id: "a1", originalFilename: "Informe.pdf", mimeType: "application/pdf", sizeBytes: 2048 }]}
        contentId="material-1"
        contentType="material"
      />,
    );
    // Unchanged product behaviour: the same list, link name and size.
    expect(html).toContain("Descargar Informe.pdf");
    expect(html).toContain("2 KB");
    expect(html).toContain('href="/api/attachments/a1"');
  });

  it("renders nothing when there are no attachments", async () => {
    const { PublishedAttachments } = await import("@/app/app/library/published-attachments");
    expect(renderToStaticMarkup(
      <PublishedAttachments attachments={[]} contentId="material-1" contentType="material" />,
    )).toBe("");
  });
});

describe("instrumentation components render nothing", () => {
  /*
   * They are measurement, not interface. Rendering markup would couple the
   * event to a layout and make a UI refactor an analytics change.
   */
  it("emit no markup", () => {
    expect(renderToStaticMarkup(<ContentOpened contentId="module-1" contentType="module" />)).toBe("");
    expect(renderToStaticMarkup(
      <LibraryActivity searchApplied={null} resultCount={0} appliedFilters={[]} />,
    )).toBe("");
  });

  it("emit nothing during server rendering, where there is no reader yet", () => {
    renderToStaticMarkup(<ContentOpened contentId="module-1" contentType="module" />);
    renderToStaticMarkup(<LibraryActivity searchApplied="abc123" resultCount={5} appliedFilters={["axis"]} />);
    expect(track).not.toHaveBeenCalled();
  });
});

describe("every instrumented event is in the canonical taxonomy", () => {
  it("uses only approved event names", () => {
    const element = ExternalReferenceLink({
      href: "https://externo.test", contentId: "c1", contentType: "module", children: "x",
    }) as React.ReactElement;
    clickHandlerOf(element)!();

    const download = DownloadLink({
      href: "/api/attachments/a1", attachmentId: "a1", contentId: "c1", contentType: "module", children: "x",
    }) as React.ReactElement;
    clickHandlerOf(download)!();

    for (const [name] of track.mock.calls) expect(analyticsEvents).toContain(name);
  });
});
