"use client";

import { useActionState } from "react";
import type { ContributionType } from "@/lib/contributions/types";
import { deleteContribution, submitContribution, type ContributionActionState } from "./actions";

const initialState: ContributionActionState = {};

export function LifecycleActions({ type, revisionId }: { type: ContributionType; revisionId: string }) {
  const [submitState, submitAction, submitting] = useActionState(submitContribution, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteContribution, initialState);
  return <div className="mt-8 border-t border-slate-900/15 pt-6">
    <div className="flex flex-wrap gap-3">
      <form action={submitAction}><input type="hidden" name="content_type" value={type} /><input type="hidden" name="revision_id" value={revisionId} /><button disabled={submitting}>{submitting ? "Enviando…" : "Enviar a revisión"}</button></form>
      <form action={deleteAction}><input type="hidden" name="content_type" value={type} /><input type="hidden" name="revision_id" value={revisionId} /><button disabled={deleting} className="bg-transparent text-red-800 ring-1 ring-red-800 hover:bg-red-50">Eliminar borrador</button></form>
    </div>
    {(submitState.error || deleteState.error) && <p role="alert" className="mt-4 rounded-md bg-red-50 p-4 font-semibold text-red-800">{submitState.error ?? deleteState.error}</p>}
  </div>;
}
