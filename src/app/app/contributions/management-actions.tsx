"use client";

import { useActionState } from "react";
import type { ContributionType } from "@/lib/contributions/types";
import { createSuccessorDraft, publishDraft, type ContributionActionState } from "./actions";

const initialState: ContributionActionState = {};

export function PublishAction({ type, revisionId }: { type: ContributionType; revisionId: string }) {
  const [state, action, pending] = useActionState(publishDraft, initialState);
  return <div className="mt-8 border-t border-slate-900/15 pt-6">
    <form action={action}>
      <input type="hidden" name="content_type" value={type} />
      <input type="hidden" name="revision_id" value={revisionId} />
      <button disabled={pending}>{pending ? "Publicando…" : "Publicar"}</button>
    </form>
    {state.error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-4 font-semibold text-red-800">{state.error}</p>}
  </div>;
}

export function SuccessorAction({ type, contentId }: { type: ContributionType; contentId: string }) {
  const [state, action, pending] = useActionState(createSuccessorDraft, initialState);
  return <div className="mt-8 border-t border-slate-900/15 pt-6">
    <form action={action}>
      <input type="hidden" name="content_type" value={type} />
      <input type="hidden" name="content_id" value={contentId} />
      <button disabled={pending}>{pending ? "Creando versión…" : "Crear nueva versión"}</button>
    </form>
    {state.error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-4 font-semibold text-red-800">{state.error}</p>}
  </div>;
}
