"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { privacyDocuments, type AnalyticsDecision } from "@/lib/privacy/contract";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { acceptAnalyticsAction, rejectAnalyticsAction } from "@/app/app/privacidad/actions";

/**
 * `Preferencias de datos` — the persistent surface required by
 * `docs/PRIVACY_UX_CONTRACT.md` §12.
 *
 * Two conceptual categories: `Necesario`, which is informational and carries no
 * control because it is not governed by the analytics preference, and
 * `Analítica del producto`, which is the only thing the user can switch.
 *
 * The displayed state is the persisted state. A toggle is not optimistic: the
 * panel re-renders from the decision the server read back, so a failed write
 * leaves the previous state on screen beside a retryable error rather than a
 * switch that looks enabled but was never stored.
 *
 * Session Replay is deliberately absent: the product does not enable it, and
 * presenting it as a preference would imply otherwise.
 */
export function DataPreferences({ decision, onDecision }: {
  decision: AnalyticsDecision;
  /** Lets the host surface react once a decision is actually persisted. */
  onDecision?: (decision: AnalyticsDecision) => void;
}) {
  const [current, setCurrent] = useState(decision);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const enabled = current === "accepted";

  function choose(next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await (next ? acceptAnalyticsAction() : rejectAnalyticsAction());
      if (result.error || !result.decision) {
        // Fail closed: nothing changes locally unless the row changed.
        setError(result.error ?? "No pudimos guardar tu preferencia. Inténtalo de nuevo.");
        return;
      }
      setCurrent(result.decision);
      onDecision?.(result.decision);
    });
  }

  return <div className="space-y-5">
    <section aria-labelledby="preferencias-necesario" className="rounded-lg border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 id="preferencias-necesario" className="text-lg">Necesario</h3>
        {/* Text, not colour: the state must not depend on a visual cue alone. */}
        <span className="rounded-full border border-hairline bg-inset px-3 py-1 text-control font-bold text-ink-muted">
          Siempre activo
        </span>
      </div>
      <p className="mt-3 text-ink-soft">
        Utilizamos estas funciones para autenticar tu cuenta, aplicar tus permisos, mantener la
        seguridad y operar Base Curricular.
      </p>
    </section>

    <section aria-labelledby="preferencias-analitica" className="rounded-lg border border-hairline bg-surface p-5">
      <h3 id="preferencias-analitica" className="text-lg">Analítica del producto</h3>
      <p className="mt-3 text-ink-soft">
        Nos ayuda a entender cómo se utiliza Base Curricular para mejorar la navegación, la búsqueda
        y el acceso al contenido.
      </p>
      <p className="mt-2 text-ink-soft">
        No utilizamos esta información para publicidad ni para evaluar tu desempeño individual.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {/*
          A real switch rather than two buttons, so the persisted state is
          programmatically exposed through aria-checked instead of being implied
          by which control looks pressed.
        */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending}
          onClick={() => choose(!enabled)}
          className="inline-flex items-center gap-3 rounded-full border border-hairline-strong bg-inset px-2 py-2 font-bold text-ink disabled:opacity-60"
        >
          <span aria-hidden="true" className={`grid h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors ${enabled ? "bg-success" : "bg-label/50"}`}>
            <span className={`block size-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
          </span>
          <span className="pe-2 text-control">Analítica del producto</span>
        </button>
        <span className="text-control font-bold text-ink-muted">
          {pending ? "Guardando…" : enabled ? "Activada" : "Desactivada"}
        </span>
      </div>

      {current === "undecided" && <p className="mt-3 text-control text-ink-muted">
        Aún no has registrado una decisión. La analítica permanece desactivada.
      </p>}

      {error && <Notice tone="error" className="mt-4">{error}</Notice>}

      <p className="mt-4 text-control text-ink-muted">
        Desactivar la analítica detiene la recopilación futura. No elimina automáticamente la
        información ya procesada; para ello existe el proceso de derechos de privacidad descrito en
        el Aviso de Privacidad.
      </p>

      <p className="mt-4">
        <Link href={privacyDocuments.notice.href} prefetch={false} className="font-bold">
          Leer el {privacyDocuments.notice.title}
        </Link>
      </p>
    </section>
  </div>;
}

/** `Preferencias de datos` as a modal, opened from the account area. */
export function DataPreferencesDialog({ open, onClose, decision, onDecision }: {
  open: boolean;
  onClose: () => void;
  decision: AnalyticsDecision;
  onDecision?: (decision: AnalyticsDecision) => void;
}) {
  return <Dialog
    open={open}
    onClose={onClose}
    eyebrow="Privacidad"
    title="Preferencias de datos"
    lede="Controla la analítica opcional del producto. Las funciones necesarias para operar y proteger Base Curricular permanecen activas."
    footer={<div className="flex flex-wrap items-center justify-between gap-3">
      <Link href={privacyDocuments.terms.href} prefetch={false} className="text-sm font-bold">
        {privacyDocuments.terms.title}
      </Link>
      <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
    </div>}
  >
    <DataPreferences decision={decision} onDecision={onDecision} />
  </Dialog>;
}
