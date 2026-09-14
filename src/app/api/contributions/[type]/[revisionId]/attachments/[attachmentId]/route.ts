import { getAccess } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function context(params: Promise<{ type: string; revisionId: string; attachmentId: string }>) {
  const access = await getAccess();
  if (access.status !== "eligible") return { error: Response.json({ error: access.status === "unauthenticated" ? "Inicia sesión para continuar." : access.status === "unavailable" ? "El servicio no está disponible." : "No tienes acceso a este archivo." }, { status: access.status === "unauthenticated" ? 401 : access.status === "unavailable" ? 503 : 403 }) };
  const values = await params;
  if (!/^[0-9a-f-]{36}$/i.test(values.revisionId) || !/^[0-9a-f-]{36}$/i.test(values.attachmentId) || !["teaching_note", "material"].includes(values.type)) {
    return { error: Response.json({ error: "Archivo no encontrado." }, { status: 404 }) };
  }
  const supabase = await createClient();
  const column = values.type === "teaching_note" ? "teaching_note_revision_id" : "material_revision_id";
  const metadata = await supabase.from("curriculum_attachments").select("id,object_name,state").eq("id", values.attachmentId).eq(column, values.revisionId).maybeSingle();
  if (metadata.error || !metadata.data) return { error: Response.json({ error: "Archivo no encontrado." }, { status: 404 }) };
  return { supabase, metadata: metadata.data };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ type: string; revisionId: string; attachmentId: string }> }) {
  const current = await context(params);
  if ("error" in current) return current.error;
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  const functionName = body?.action === "complete_upload" ? "finalize_attachment_upload"
    : body?.action === "cancel_reservation" ? "cancel_attachment_reservation" : null;
  if (!functionName) return Response.json({ error: "Acción de archivo no válida." }, { status: 400 });
  const result = await current.supabase.rpc(functionName, { requested_attachment_id: current.metadata.id });
  if (result.error) return Response.json({ error: body?.action === "complete_upload" ? "La carga todavía no puede completarse." : "La reserva contiene un archivo y no puede cancelarse." }, { status: 409 });
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ type: string; revisionId: string; attachmentId: string }> }) {
  const current = await context(params);
  if ("error" in current) return current.error;
  if (current.metadata.state === "Ready" || current.metadata.state === "Reserved") {
    const begun = await current.supabase.rpc("begin_attachment_deletion", { requested_attachment_id: current.metadata.id });
    if (begun.error) return Response.json({ error: "No se puede eliminar este archivo." }, { status: 409 });
  }
  const removed = await current.supabase.storage.from("governed-attachments").remove([current.metadata.object_name]);
  if (removed.error) {
    await current.supabase.rpc("cancel_attachment_deletion", { requested_attachment_id: current.metadata.id });
    return Response.json({ error: "No pudimos eliminar el archivo." }, { status: 503 });
  }
  const finalized = await current.supabase.rpc("finalize_attachment_deletion", { requested_attachment_id: current.metadata.id });
  if (finalized.error) {
    return Response.json({ error: "Falta completar la limpieza del archivo. Inténtalo nuevamente." }, { status: 503 });
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
}
