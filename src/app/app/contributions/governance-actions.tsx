"use client";

import { useActionState, useId, useState } from "react";
import { archiveContent, restoreContent, type GovernanceActionState, type ResolvedBlocker } from "./actions";
import { contributionTypeLabel, type ContributionType } from "@/lib/contributions/types";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

const initialState: GovernanceActionState = {};

/**
 * Dependency blocking is a distinct outcome, not a generic failure: it names the
 * active published content that still uses this identity so the Admin can resolve
 * it. Nothing here archives a dependent — SPEC-005 §4.4 forbids cascade archival.
 */
function BlockedNotice({ message, blockers }: { message: string; blockers: ResolvedBlocker[] }) {
  return <Notice tone="error" as="div" className="mt-4">
    <p>{message}</p>
    <p className="mt-2 font-normal">Está siendo utilizado por contenido publicado activo:</p>
    <ul className="mt-2 list-disc space-y-1 ps-5 font-normal">
      {blockers.map((blocker) => <li key={`${blocker.type}-${blocker.contentId}`}>
        <span className="font-bold">{contributionTypeLabel(blocker.type)}</span>
        {" · "}
        {/* Falls back to the stable id when the title cannot be resolved, rather
            than reaching past the Admin management boundary for a label. */}
        {blocker.title ?? blocker.contentId}
      </li>)}
    </ul>
    <p className="mt-3 font-normal">Resuelve estas dependencias antes de archivarlo.</p>
  </Notice>;
}

/**
 * Archive, behind a deliberate in-page confirmation step.
 *
 * Deliberately not a modal: the repository has no dialog primitive, and a disclosure
 * keeps the explanation in the document flow where it is reachable by keyboard and
 * readable by assistive technology without new abstractions.
 */
export function ArchiveAction({ type, contentId }: { type: ContributionType; contentId: string }) {
  const [state, formAction, pending] = useActionState(archiveContent, initialState);
  const [confirming, setConfirming] = useState(false);
  const panelId = useId();

  return <div>
    <Button
      type="button"
      variant="secondary"
      aria-expanded={confirming}
      aria-controls={panelId}
      onClick={() => setConfirming((open) => !open)}
    >Archivar</Button>

    {confirming && <div id={panelId} className="mt-4 rounded-md border border-hairline bg-inset p-5">
      <p className="font-bold text-ink">¿Archivar este contenido?</p>
      <p className="mt-2 text-ink-soft">
        Dejará de aparecer en la biblioteca, la búsqueda y las referencias para las personas lectoras.
        No se elimina: la versión publicada y su historial se conservan, y podrás restaurarlo más adelante
        si sus dependencias siguen vigentes.
      </p>
      <form action={formAction} className="mt-5 flex flex-wrap items-center gap-3">
        <input type="hidden" name="content_type" value={type} />
        <input type="hidden" name="content_id" value={contentId} />
        <Button type="submit" disabled={pending}>{pending ? "Archivando…" : "Confirmar archivado"}</Button>
        <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>Cancelar</Button>
      </form>
    </div>}

    {state.error && (state.blockers?.length
      ? <BlockedNotice message={state.error} blockers={state.blockers} />
      : <Notice tone="error" className="mt-4">{state.error}</Notice>)}
  </div>;
}

/**
 * Restore, from the archived management surface.
 * The accessible name carries the content title because an archived listing renders
 * many of these; the visible label stays inside it so the two never diverge.
 */
export function RestoreAction({ type, contentId, title }: {
  type: ContributionType;
  contentId: string;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(restoreContent, initialState);
  return <div>
    <form action={formAction}>
      <input type="hidden" name="content_type" value={type} />
      <input type="hidden" name="content_id" value={contentId} />
      <Button type="submit" size="sm" disabled={pending} aria-label={`Restaurar ${title}`}>
        {pending ? "Restaurando…" : "Restaurar"}
      </Button>
    </form>
    {state.error && <Notice tone="error" className="mt-3">{state.error}</Notice>}
  </div>;
}
