import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { acceptAnalyticsAction, rejectAnalyticsAction } = vi.hoisted(() => ({
  acceptAnalyticsAction: vi.fn(),
  rejectAnalyticsAction: vi.fn(),
}));
vi.mock("@/app/app/privacidad/actions", () => ({ acceptAnalyticsAction, rejectAnalyticsAction }));

import { PrivacyChoice } from "@/components/privacy/privacy-choice";
import { DataPreferences, DataPreferencesDialog } from "@/components/privacy/data-preferences";
import type { AnalyticsDecision } from "@/lib/privacy/contract";

const noop = () => {};

const choice = () => renderToStaticMarkup(<PrivacyChoice onConfigure={noop} />);
const preferences = (decision: AnalyticsDecision) =>
  renderToStaticMarkup(<DataPreferences decision={decision} />);

/** The buttons a surface offers, in rendered order. */
function buttons(html: string) {
  return [...html.matchAll(/<button[^>]*>(?:<[^>]+>)*([^<]*)/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

beforeEach(() => vi.resetAllMocks());

describe("initial privacy choice", () => {
  it("presents the three contract actions", () => {
    const offered = buttons(choice());
    expect(offered).toContain("Rechazar analítica");
    expect(offered).toContain("Configurar");
    expect(offered).toContain("Aceptar");
  });

  /*
   * Equal choice. Rejection must not take more steps or less prominence than
   * acceptance, so both are plain buttons on the same row and rejection comes
   * first in the reading and tab order.
   */
  it("offers rejection before acceptance and at the same control size", () => {
    const html = choice();
    const offered = buttons(html);
    expect(offered.indexOf("Rechazar analítica")).toBeLessThan(offered.indexOf("Aceptar"));

    const reject = /<button[^>]*>Rechazar analítica/.exec(html)![0];
    const accept = /<button[^>]*>Aceptar/.exec(html)![0];
    // Same size class on both; only the colour variant differs.
    expect(reject).toContain("px-3 py-2 text-sm");
    expect(accept).toContain("px-3 py-2 text-sm");
    expect(reject).not.toContain("sr-only");
    expect(reject).not.toContain("hidden");
  });

  it("does not preselect or imply an accepted state", () => {
    const html = choice();
    expect(html).not.toContain("checked");
    expect(html).not.toContain('aria-checked="true"');
  });

  it("names itself and links the Privacy Notice", () => {
    const html = choice();
    expect(html).toContain('aria-labelledby="eleccion-privacidad-titulo"');
    expect(html).toContain("Ayúdanos a mejorar Base Curricular");
    expect(html).toContain('href="/app/privacidad/aviso"');
  });

  it("states that the decision can be changed later", () => {
    expect(choice()).toContain("Puedes cambiar tu decisión posteriormente en Preferencias de datos");
  });

  it("states that analytics is not used for advertising or individual evaluation", () => {
    expect(choice()).toContain("No utilizamos esta información para publicidad ni para evaluar tu desempeño individual");
  });

  /* No optional analytics may measure the consent interaction itself. */
  it("emits no analytics call of its own", () => {
    const html = choice();
    expect(html).not.toContain("posthog");
    expect(html).not.toContain("capture");
  });

  it("is a region rather than a modal, so it cannot block normal product use", () => {
    const html = choice();
    expect(html).toMatch(/^<section/);
    expect(html).not.toContain("<dialog");
    expect(html).not.toContain("aria-modal");
  });
});

describe("Preferencias de datos", () => {
  it("presents the two conceptual categories and only those", () => {
    const html = preferences("rejected");
    expect(html).toContain("Necesario");
    expect(html).toContain("Analítica del producto");
  });

  it("presents Necesario as informational rather than as a toggle", () => {
    const html = preferences("rejected");
    expect(html).toContain("Siempre activo");
    // One switch only: Necesario is not controllable.
    expect([...html.matchAll(/role="switch"/g)]).toHaveLength(1);
  });

  it("exposes the analytics state programmatically, not through colour alone", () => {
    expect(preferences("accepted")).toContain('aria-checked="true"');
    expect(preferences("rejected")).toContain('aria-checked="false"');
    expect(preferences("undecided")).toContain('aria-checked="false"');
    // And in text beside the control.
    expect(preferences("accepted")).toContain("Activada");
    expect(preferences("rejected")).toContain("Desactivada");
  });

  it("reflects the persisted state accurately for each decision", () => {
    expect(preferences("accepted")).not.toContain("Aún no has registrado una decisión");
    expect(preferences("rejected")).not.toContain("Aún no has registrado una decisión");
    // Undecided is shown as undecided, while still being OFF.
    expect(preferences("undecided")).toContain("Aún no has registrado una decisión");
    expect(preferences("undecided")).toContain("Desactivada");
  });

  it("gives the analytics control an accessible name", () => {
    const control = /<button[^>]*role="switch"[\s\S]*?<\/button>/.exec(preferences("rejected"))![0];
    expect(control).toContain("Analítica del producto");
    expect(control).toContain('type="button"');
  });

  it("explains that disabling stops future collection without deleting history", () => {
    const html = preferences("accepted");
    expect(html).toContain("detiene la recopilación futura");
    expect(html).toContain("derechos de privacidad");
  });

  it("links the Privacy Notice", () => {
    expect(preferences("rejected")).toContain('href="/app/privacidad/aviso"');
  });

  /* Session Replay is disabled, so it is not a preference. */
  it("does not present Session Replay as a preference", () => {
    const html = preferences("accepted").toLowerCase();
    expect(html).not.toContain("replay");
    expect(html).not.toContain("grabación");
    expect(html).not.toContain("repetición de sesión");
  });

  it("links the Terms separately from the analytics control", () => {
    const html = renderToStaticMarkup(
      <DataPreferencesDialog open onClose={noop} decision="rejected" />,
    );
    expect(html).toContain('href="/app/privacidad/terminos"');
    // The Terms link is a link, never a control that records an analytics decision.
    expect(html).not.toMatch(/<button[^>]*>T[eé]rminos/);
  });

  it("is reachable as a dialog that names itself", () => {
    const html = renderToStaticMarkup(
      <DataPreferencesDialog open onClose={noop} decision="undecided" />,
    );
    expect(html).toMatch(/^<dialog/);
    expect(html).toContain("Preferencias de datos");
  });
});
