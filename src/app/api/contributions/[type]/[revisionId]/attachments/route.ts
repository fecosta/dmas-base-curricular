import { getAccess } from "@/lib/auth/access";
import { safeAttachmentFilename } from "@/lib/contributions/attachments";
import { isContributionType } from "@/lib/contributions/types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const maximumSize = 3 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf", "text/plain", "text/csv", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.spreadsheet",
]);

function denied(status: number) {
  return Response.json({ error: status === 401 ? "Inicia sesión para continuar." : "No tienes acceso a este archivo." }, { status });
}

async function hasExpectedSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  const starts = (...expected: number[]) => expected.every((value, index) => bytes[index] === value);
  if (file.type === "application/pdf") return starts(0x25, 0x50, 0x44, 0x46, 0x2d);
  if (file.type === "text/plain" || file.type === "text/csv") return !bytes.includes(0);
  if (file.type.includes("openxmlformats") || file.type.includes("opendocument")) return starts(0x50, 0x4b, 0x03, 0x04);
  return starts(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string; revisionId: string }> }) {
  const access = await getAccess();
  if (access.status === "unauthenticated") return denied(401);
  if (access.status === "unavailable") return Response.json({ error: "El servicio no está disponible." }, { status: 503 });
  if (access.status !== "eligible" || access.context.role !== "Admin") return denied(403);
  const { type, revisionId } = await params;
  if (!isContributionType(type) || !["teaching_note", "material"].includes(type) || !/^[0-9a-f-]{36}$/i.test(revisionId)) return denied(404);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > maximumSize || !allowedMimeTypes.has(file.type) || !await hasExpectedSignature(file)) {
    return Response.json({ error: "Selecciona un documento válido de hasta 3 MB." }, { status: 400 });
  }
  const filename = safeAttachmentFilename(file.name);
  if (!filename) return Response.json({ error: "El archivo necesita un nombre válido." }, { status: 400 });

  const supabase = await createClient();
  const reservation = await supabase.rpc("reserve_attachment", {
    requested_type: type, requested_revision_id: revisionId, requested_filename: filename,
    requested_mime_type: file.type, requested_size_bytes: file.size,
  });
  if (reservation.error || !reservation.data || typeof reservation.data !== "object" || Array.isArray(reservation.data)) {
    return Response.json({ error: "No pudimos preparar la carga. Verifica que el borrador siga siendo editable." }, { status: 409 });
  }
  const attachmentId = String(reservation.data.id ?? "");
  const objectName = String(reservation.data.object_name ?? "");
  if (!attachmentId || !objectName) return Response.json({ error: "No pudimos preparar la carga." }, { status: 503 });
  // Detach bytes from Next's request stream before forwarding to Storage.
  const upload = await supabase.storage.from("governed-attachments").upload(objectName, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (upload.error) {
    const cancellation = await supabase.rpc("cancel_attachment_reservation", { requested_attachment_id: attachmentId });
    return Response.json({ error: cancellation.error ? "La carga falló y quedó una reserva pendiente de limpieza." : "No pudimos cargar el archivo. Inténtalo nuevamente." }, { status: 503 });
  }
  const finalized = await supabase.rpc("finalize_attachment_upload", { requested_attachment_id: attachmentId });
  if (finalized.error) return Response.json({ error: "El archivo llegó al almacenamiento, pero falta completar la carga." }, { status: 503 });
  return Response.json({ id: attachmentId }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
