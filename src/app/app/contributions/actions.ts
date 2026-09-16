"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth/access";
import {
  archiveErrorMessage,
  dependencyBlockers,
  publicationErrorMessage,
  restoreErrorMessage,
} from "@/lib/contributions/errors";
import { contentReferenceKey, findActiveDraftRevision, resolveContentTitles } from "@/lib/contributions/queries";
import { contributionPayload, ContributionValidationError } from "@/lib/contributions/validation";
import { isContributionType, type ContributionType } from "@/lib/contributions/types";
import { createClient } from "@/lib/supabase/server";

export type ContributionActionState = { error?: string };

/** A dependency blocker, resolved to a readable title where one is available. */
export type ResolvedBlocker = { type: ContributionType; contentId: string; title: string | null };

export type GovernanceActionState = { error?: string; blockers?: ResolvedBlocker[] };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function request(form: FormData) {
  const type = String(form.get("content_type") ?? "");
  if (!isContributionType(type)) throw new ContributionValidationError("Selecciona un tipo de contenido válido.");
  return {
    type,
    revisionId: String(form.get("revision_id") ?? ""),
    contentId: String(form.get("content_id") ?? ""),
  };
}

export async function saveContribution(_state: ContributionActionState, form: FormData): Promise<ContributionActionState> {
  await requireAccess("Admin");
  let parsed;
  let payload;
  try {
    parsed = request(form);
    payload = contributionPayload(parsed.type, form);
  } catch (error) {
    return { error: error instanceof ContributionValidationError ? error.message : "Revisa los datos del contenido." };
  }
  const supabase = await createClient();
  const result = parsed.revisionId
    ? await supabase.rpc("update_contribution", { requested_type: parsed.type, requested_revision_id: parsed.revisionId, payload })
    : await supabase.rpc("create_contribution", { requested_type: parsed.type, payload });
  if (result.error) {
    return { error: result.error.code === "42501"
      ? "Tu permiso de administración cambió. Vuelve a ingresar antes de continuar."
      : "No pudimos guardar el borrador. Verifica que siga editable e inténtalo nuevamente." };
  }
  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) return { error: "No pudimos guardar el borrador." };
  const savedRevisionId = String(result.data.revision_id ?? "");
  if (!savedRevisionId) return { error: "No pudimos abrir el borrador guardado." };
  revalidatePath("/app/contributions");
  redirect(`/app/contributions/${parsed.type}/${savedRevisionId}`);
}

export async function publishDraft(_state: ContributionActionState, form: FormData): Promise<ContributionActionState> {
  await requireAccess("Admin");
  let parsed;
  try {
    parsed = request(form);
    if (!parsed.revisionId) throw new ContributionValidationError("No encontramos el borrador que deseas publicar.");
  } catch (error) {
    return { error: error instanceof ContributionValidationError ? error.message : "No encontramos el borrador." };
  }
  const supabase = await createClient();
  const result = await supabase.rpc("publish_content_draft", {
    requested_type: parsed.type,
    requested_revision_id: parsed.revisionId,
  });
  if (result.error) return { error: publicationErrorMessage(result.error) };
  revalidatePath("/app/contributions");
  revalidatePath("/app/library");
  redirect(`/app/contributions/${parsed.type}/${parsed.revisionId}?published=1`);
}

export async function createSuccessorDraft(_state: ContributionActionState, form: FormData): Promise<ContributionActionState> {
  await requireAccess("Admin");
  let parsed;
  try {
    parsed = request(form);
    if (!parsed.contentId) throw new ContributionValidationError("No encontramos el contenido publicado.");
  } catch (error) {
    return { error: error instanceof ContributionValidationError ? error.message : "No encontramos el contenido publicado." };
  }
  const supabase = await createClient();
  const result = await supabase.rpc("create_successor_draft", {
    requested_type: parsed.type,
    requested_content_id: parsed.contentId,
  });
  if (result.error) {
    if (/active successor Draft already exists/i.test(result.error.message)) {
      const existingRevisionId = await findActiveDraftRevision(parsed.type, parsed.contentId);
      if (existingRevisionId) redirect(`/app/contributions/${parsed.type}/${existingRevisionId}`);
      return { error: "Ya existe una nueva versión en borrador. Actualiza la página para abrirla." };
    }
    if (result.error.code === "42501") return { error: "Tu permiso de administración cambió. Vuelve a ingresar antes de continuar." };
    if (result.error.code === "40001") return { error: "La versión publicada cambió. Actualiza la página antes de crear otra versión." };
    return { error: "No pudimos crear una nueva versión de este contenido." };
  }
  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) return { error: "No pudimos crear la nueva versión." };
  const revisionId = String(result.data.revision_id ?? "");
  if (!revisionId) return { error: "No pudimos abrir la nueva versión." };
  revalidatePath("/app/contributions");
  redirect(`/app/contributions/${parsed.type}/${revisionId}`);
}

/**
 * Archive a published governed identity.
 *
 * The RPC is the authority: it re-resolves live Admin access, locks the identity,
 * and re-checks Draft and dependency eligibility inside the transaction. The checks
 * here only keep a malformed request from reaching it, and a stale UI that still
 * offers Archive is rejected by the database rather than by this function.
 */
export async function archiveContent(_state: GovernanceActionState, form: FormData): Promise<GovernanceActionState> {
  await requireAccess("Admin");
  let parsed;
  try {
    parsed = request(form);
    if (!uuidPattern.test(parsed.contentId)) throw new ContributionValidationError("No encontramos el contenido que deseas archivar.");
  } catch (error) {
    return { error: error instanceof ContributionValidationError ? error.message : "No encontramos el contenido que deseas archivar." };
  }
  const supabase = await createClient();
  const result = await supabase.rpc("archive_governed_content", {
    requested_type: parsed.type,
    requested_content_id: parsed.contentId,
  });
  if (result.error) {
    const blockers = dependencyBlockers(result.error);
    return { error: archiveErrorMessage(result.error), blockers: blockers.length > 0 ? await resolveBlockers(blockers) : undefined };
  }
  revalidatePath("/app/contributions");
  revalidatePath("/app/library");
  // The archived identity is hidden from every active management policy, so its
  // published detail route would now 404: land on the surface that can restore it.
  redirect("/app/contributions?state=archived");
}

/** Restore an archived governed identity. Dependency revalidation happens inside the RPC. */
export async function restoreContent(_state: GovernanceActionState, form: FormData): Promise<GovernanceActionState> {
  await requireAccess("Admin");
  let parsed;
  try {
    parsed = request(form);
    if (!uuidPattern.test(parsed.contentId)) throw new ContributionValidationError("No encontramos el contenido que deseas restaurar.");
  } catch (error) {
    return { error: error instanceof ContributionValidationError ? error.message : "No encontramos el contenido que deseas restaurar." };
  }
  const supabase = await createClient();
  const result = await supabase.rpc("restore_governed_content", {
    requested_type: parsed.type,
    requested_content_id: parsed.contentId,
  });
  if (result.error) return { error: restoreErrorMessage(result.error) };
  revalidatePath("/app/contributions");
  revalidatePath("/app/library");
  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) redirect("/app/contributions");
  const revisionId = String(result.data.revision_id ?? "");
  redirect(revisionId ? `/app/contributions/${parsed.type}/${revisionId}` : "/app/contributions");
}

async function resolveBlockers(blockers: { type: ContributionType; contentId: string }[]): Promise<ResolvedBlocker[]> {
  // Blockers are active current-published identities, which the Admin management
  // policies already expose; an unresolved one falls back to type + id rather than
  // widening any read boundary.
  const titles = await resolveContentTitles(blockers);
  return blockers.map((blocker) => ({ ...blocker, title: titles.get(contentReferenceKey(blocker.type, blocker.contentId)) ?? null }));
}
