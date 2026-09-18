"use client";

import { useActionState } from "react";
import type { ContributionType } from "@/lib/contributions/types";
import { createSuccessorDraft, publishDraft, type ContributionActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

const initialState: ContributionActionState = {};

/**
 * Shared shell for the two single-button lifecycle actions.
 *
 * The panel that frames them — its title and the sentence explaining what the
 * transition does — belongs to the page, so the lifecycle stays legible as
 * something separate from saving the Draft and from archiving the identity.
 * The action itself is unchanged: one hidden-field form, one server action.
 */
function ManagementAction({ action, fields, label, pendingLabel }: {
  action: typeof publishDraft;
  fields: Record<string, string>;
  label: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <div>
    <form action={formAction}>
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <Button type="submit" size="sm" disabled={pending} className="w-full">{pending ? pendingLabel : label}</Button>
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
