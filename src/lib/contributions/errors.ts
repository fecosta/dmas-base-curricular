import { isContributionType, type ContributionType } from "./types";

type DatabaseError = { code?: string; message?: string; details?: string | null };

export function publicationErrorMessage(error: DatabaseError) {
  const message = error.message ?? "";
  if (/active Admin Draft not found|Draft is not eligible/i.test(message)) return "Este borrador ya no está disponible para edición o publicación.";
  if (error.code === "42501") return "Tu permiso de administración cambió. Vuelve a ingresar antes de continuar.";
  if (/current-published|current published/i.test(message)) return "Publica primero los contenidos relacionados que necesita este borrador.";
  if (/attachment|source|valid for publication/i.test(message)) return "Completa la fuente o los archivos requeridos antes de publicar.";
  if (error.code === "40001") return "El contenido cambió mientras realizabas la acción. Actualiza la página e inténtalo nuevamente.";
  if (error.code === "23514") return "El borrador no cumple todavía todos los requisitos de publicación.";
  return "No pudimos publicar el contenido. Revisa los datos e inténtalo nuevamente.";
}

export type DependencyBlocker = { type: ContributionType; contentId: string };

/**
 * `archive_governed_content` puts the blocking identities in the error DETAIL as
 * `{"blockers":[{"content_type":…,"content_id":…}]}`. That structured payload is the
 * source of truth for the dependency-blocked UX — the human-readable message is only
 * used to tell this failure apart from the other check-violation cases.
 */
export function dependencyBlockers(error: DatabaseError): DependencyBlocker[] {
  if (!error.details) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(error.details);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object") return [];
  const list = (parsed as { blockers?: unknown }).blockers;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { content_type: type, content_id: contentId } = entry as Record<string, unknown>;
    if (typeof type !== "string" || typeof contentId !== "string" || !isContributionType(type)) return [];
    return [{ type, contentId }];
  });
}

export function archiveErrorMessage(error: DatabaseError) {
  const message = error.message ?? "";
  if (error.code === "42501") return "Tu permiso de administración cambió. Vuelve a ingresar antes de continuar.";
  if (/active Draft blocks archival/i.test(message)) return "Este contenido tiene una nueva versión en borrador. Resuélvela antes de archivarlo.";
  if (/dependents block archival/i.test(message)) return "No se puede archivar este contenido porque lo utiliza contenido publicado activo.";
  if (/already archived/i.test(message)) return "Este contenido ya está archivado. Actualiza la página para ver su estado actual.";
  if (/identity not found|current-published revision not found/i.test(message)) return "Este contenido ya no tiene una versión publicada vigente que se pueda archivar.";
  if (error.code === "40001") return "El contenido cambió mientras realizabas la acción. Actualiza la página e inténtalo nuevamente.";
  return "No pudimos archivar el contenido. Actualiza la página e inténtalo nuevamente.";
}

export function restoreErrorMessage(error: DatabaseError) {
  const message = error.message ?? "";
  if (error.code === "42501") return "Tu permiso de administración cambió. Vuelve a ingresar antes de continuar.";
  if (/is not archived/i.test(message)) return "Este contenido ya no está archivado. Actualiza la página para ver su estado actual.";
  // Restore replays the publication dependency contract, so its failures arrive as
  // the same check violations publication raises.
  if (/requires|must belong/i.test(message) || error.code === "23514") return "No se puede restaurar este contenido: el contenido publicado que necesita ya no está vigente. Restaura o publica esas dependencias primero.";
  if (/identity not found|current-published revision not found/i.test(message)) return "Este contenido ya no tiene una versión publicada vigente que se pueda restaurar.";
  if (error.code === "40001") return "El contenido cambió mientras realizabas la acción. Actualiza la página e inténtalo nuevamente.";
  return "No pudimos restaurar el contenido. Actualiza la página e inténtalo nuevamente.";
}
