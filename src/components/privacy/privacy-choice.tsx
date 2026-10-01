"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { privacyDocuments, type AnalyticsDecision } from "@/lib/privacy/contract";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { acceptAnalyticsAction, rejectAnalyticsAction } from "@/app/app/privacidad/actions";

/**
 * The first authenticated privacy choice, for a user with no recorded decision.
 *
 * Implements `docs/PRIVACY_UX_CONTRACT.md` §6–§8. A region rather than a modal
 * dialog: it must not block normal product use, and leaving it undecided is a
 * legitimate outcome that keeps analytics OFF.
 *
 * `Rechazar analítica` and `Aceptar` are both one click, side by side, with
 * comparable prominence. Nothing here is preselected, dismissal is not
 * acceptance, and `Configurar` only asks the shell to open the one Data
 * Preferences dialog — it enables nothing and does not own a second copy of it.
 */
export function PrivacyChoice({ onConfigure, onDecision }: {
  onConfigure: () => void;
  onDecision?: (decision: AnalyticsDecision) => void;
}) {
  const [settled, setSettled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function record(decision: Promise<{ decision?: AnalyticsDecision; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await decision;
      if (result.error || !result.decision) {
        // Nothing was stored, so the choice stays open and analytics stays OFF.
        setError(result.error ?? "No pudimos guardar tu preferencia. Inténtalo de nuevo.");
        return;
      }
      onDecision?.(result.decision);
      setSettled(true);
    });
  }

  // Dismissed only once a decision was actually persisted.
  if (settled) return null;

  return <section
    aria-labelledby="eleccion-privacidad-titulo"
    className="border-b border-hairline bg-inset"
  >
    <div className="mx-auto w-full max-w-[1520px] px-5 py-5 lg:px-8">
      <div className="flex flex-col gap-4 explorer:flex-row explorer:items-start explorer:justify-between explorer:gap-8">
        <div className="min-w-0 max-w-2xl">
          <h2 id="eleccion-privacidad-titulo" className="text-lg">Ayúdanos a mejorar Base Curricular</h2>
          <p className="mt-2 text-ink-soft">
            Con tu permiso, recopilamos información limitada sobre cómo se utiliza la plataforma
            para entender qué funciona y qué podemos mejorar.
          </p>
          <p className="mt-2 text-ink-soft">
            No utilizamos esta información para publicidad ni para evaluar tu desempeño individual.
          </p>
          <p className="mt-2 text-control text-ink-muted">
            Puedes cambiar tu decisión posteriormente en Preferencias de datos.
          </p>
          <p className="mt-3">
            <Link href={privacyDocuments.notice.href} prefetch={false} className="font-bold">
              {privacyDocuments.notice.title}
            </Link>
          </p>
        </div>

        {/*
          Reject first in the source order and identical in size and weight to
          Accept, so rejection is never the harder path — including at compact
          widths, where these stack in reading order.
        */}
        <div className="flex flex-wrap items-center gap-3 explorer:shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => record(rejectAnalyticsAction())}
          >Rechazar analítica</Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={onConfigure}
          >Configurar</Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending}
            onClick={() => record(acceptAnalyticsAction())}
          >Aceptar</Button>
        </div>
      </div>

      {error && <Notice tone="error" className="mt-4">{error}</Notice>}
    </div>
  </section>;
}
