"use client";

import { useActionState } from "react";
import type { ContributionType } from "@/lib/contributions/types";
import { createSuccessorDraft, publishDraft, type ContributionActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

const initialState: ContributionActionState = {};

/** Shared shell for the two single-button lifecycle actions. */
function ManagementAction({ action, fields, label, pendingLabel }: {
  action: typeof publishDraft;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <div className="mt-8 border-t border-hairline pt-6">
    <form action={formAction}>
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <Button type="submit" disabled={pending}>{pending ? pendingLabel : label}</Button>
    </form>
    {state.error && <Notice tone="error" className="mt-4">{state.error}</Notice>}
  </div>;
}

export function PublishAction({ type, revisionId }: { type: ContributionType; revisionId: string }) {
  return <ManagementAction
    action={publishDraft}
    fields={{ content_type: type, revision_id: revisionId }}
    label="Publicar"
    pendingLabel="Publicando…"
  />;
}

export function SuccessorAction({ type, contentId }: { type: ContributionType; contentId: string }) {
  return <ManagementAction
    action={createSuccessorDraft}
    fields={{ content_type: type, content_id: contentId }}
    label="Crear nueva versión"
    pendingLabel="Creando versión…"
  />;
}
