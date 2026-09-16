import type { LifecycleAction, LifecycleEvent } from "./types";

/** Readable Spanish labels for the persisted lifecycle actions. */
const actionLabels: Record<LifecycleAction, string> = {
  content_created: "Contenido creado",
  revision_created: "Nueva versión creada",
  revision_edited: "Versión editada",
  content_submitted: "Contenido enviado",
  draft_deleted: "Borrador eliminado",
  content_published: "Contenido publicado",
  content_archived: "Contenido archivado",
  content_restored: "Contenido restaurado",
};

export function lifecycleActionLabel(action: LifecycleAction) {
  return actionLabels[action] ?? action;
}

/** The revision lifecycle statuses, in Spanish, for the transition line. */
const statusLabels: Record<string, string> = {
  Draft: "Borrador",
  Submitted: "Enviado",
  "Under Review": "En revisión",
  "Changes Requested": "Cambios solicitados",
  Resubmitted: "Reenviado",
  Approved: "Aprobado",
  Published: "Publicado",
};

export function revisionStatusLabel(status: string) {
  return statusLabels[status] ?? status;
}

/**
 * Events that act on the stable content identity rather than on a revision.
 *
 * Archive and restore are the governance cases SPEC-005 §6.1 calls out: the
 * database deliberately leaves both status columns null for them because
 * `Archived` is not a revision status. `content_created` is the birth of the
 * identity, and the `revision_created` event written alongside it already carries
 * the initial revision transition, so nothing is lost by treating it the same way.
 */
const identityActions = new Set<LifecycleAction>(["content_created", "content_archived", "content_restored"]);

export function isIdentityLifecycleEvent(action: LifecycleAction) {
  return identityActions.has(action);
}

/**
 * The `previous -> resulting` pair, but only where a revision transition actually
 * happened. Returning null for identity events is what prevents the UI inventing
 * a `Publicado -> Archivado` transition that the data never recorded.
 */
export function revisionTransition(event: LifecycleEvent) {
  if (isIdentityLifecycleEvent(event.action)) return null;
  if (event.previousStatus === null && event.resultingStatus === null) return null;
  return {
    previous: event.previousStatus ? revisionStatusLabel(event.previousStatus) : null,
    resulting: event.resultingStatus ? revisionStatusLabel(event.resultingStatus) : null,
  };
}
