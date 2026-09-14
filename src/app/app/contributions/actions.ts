"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccess } from "@/lib/auth/access";
import { contributionPayload, ContributionValidationError } from "@/lib/contributions/validation";
import { isContributionType } from "@/lib/contributions/types";
import { createClient } from "@/lib/supabase/server";

export type ContributionActionState = { error?: string };

function request(form: FormData) {
  const type = String(form.get("content_type") ?? "");
  if (!isContributionType(type)) throw new ContributionValidationError("Selecciona un tipo de contribución válido.");
  return { type, revisionId: String(form.get("revision_id") ?? "") };
}

function message(error: unknown) {
  return error instanceof ContributionValidationError ? error.message : "No pudimos guardar la contribución. Revisa los datos e inténtalo nuevamente.";
}

export async function saveContribution(_state: ContributionActionState, form: FormData): Promise<ContributionActionState> {
  let destination = "";
  try {
    await requireAccess();
    const { type, revisionId } = request(form);
    const payload = contributionPayload(type, form);
    const supabase = await createClient();
    const result = revisionId
      ? await supabase.rpc("update_contribution", { requested_type: type, requested_revision_id: revisionId, payload })
      : await supabase.rpc("create_contribution", { requested_type: type, payload });
    if (result.error || !result.data || typeof result.data !== "object" || Array.isArray(result.data)) throw new Error("write failed");
    const savedRevisionId = String(result.data.revision_id ?? "");
    if (!savedRevisionId) throw new Error("missing revision");
    revalidatePath("/app/contributions");
    destination = `/app/contributions/${type}/${savedRevisionId}`;
  } catch (error) {
    return { error: message(error) };
  }
  redirect(destination);
}

export async function submitContribution(_state: ContributionActionState, form: FormData): Promise<ContributionActionState> {
  let destination = "";
  try {
    await requireAccess();
    const { type, revisionId } = request(form);
    if (!revisionId) throw new ContributionValidationError("No encontramos el borrador que deseas enviar.");
    const supabase = await createClient();
    const result = await supabase.rpc("submit_contribution", { requested_type: type, requested_revision_id: revisionId });
    if (result.error) throw new ContributionValidationError("El borrador todavía no cumple todos los requisitos para enviarse.");
    revalidatePath("/app/contributions");
    destination = `/app/contributions/${type}/${revisionId}`;
  } catch (error) {
    return { error: message(error) };
  }
  redirect(destination);
}

export async function deleteContribution(_state: ContributionActionState, form: FormData): Promise<ContributionActionState> {
  try {
    await requireAccess();
    const { type, revisionId } = request(form);
    if (!revisionId) throw new ContributionValidationError("No encontramos el borrador que deseas eliminar.");
    const supabase = await createClient();
    const result = await supabase.rpc("delete_contribution", { requested_type: type, requested_revision_id: revisionId });
    if (result.error) throw new ContributionValidationError("No se puede eliminar este borrador. Elimina primero sus archivos o relaciones dependientes.");
    revalidatePath("/app/contributions");
  } catch (error) {
    return { error: message(error) };
  }
  redirect("/app/contributions");
}
