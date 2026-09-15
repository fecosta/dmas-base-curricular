"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth/access";
import { publicationErrorMessage } from "@/lib/contributions/errors";
import { findActiveDraftRevision } from "@/lib/contributions/queries";
import { contributionPayload, ContributionValidationError } from "@/lib/contributions/validation";
import { isContributionType } from "@/lib/contributions/types";
import { createClient } from "@/lib/supabase/server";

export type ContributionActionState = { error?: string };

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
