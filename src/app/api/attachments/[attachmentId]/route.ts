import { getAccess } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const access = await getAccess();
  if (access.status === "unauthenticated") return Response.json({ error: "Inicia sesión para continuar." }, { status: 401 });
  if (access.status === "unavailable") return Response.json({ error: "El servicio no está disponible." }, { status: 503 });
  if (access.status !== "eligible") return Response.json({ error: "No tienes acceso a este archivo." }, { status: 403 });
  const { attachmentId } = await params;
  if (!uuidPattern.test(attachmentId)) return Response.json({ error: "Archivo no encontrado." }, { status: 404 });
  const supabase = await createClient();
  const metadata = await supabase.from("curriculum_attachments").select("object_name,original_filename").eq("id", attachmentId).eq("state", "Ready").maybeSingle();
  if (metadata.error || !metadata.data) return Response.json({ error: "Archivo no encontrado." }, { status: 404 });
  const signed = await supabase.storage.from("governed-attachments").createSignedUrl(metadata.data.object_name, 60, { download: metadata.data.original_filename });
  if (signed.error || !signed.data?.signedUrl) return Response.json({ error: "El archivo no está disponible." }, { status: 404 });
  return Response.redirect(signed.data.signedUrl, 302);
}
