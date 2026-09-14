"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Attachment, ContributionType } from "@/lib/contributions/types";

export function AttachmentManager({ type, revisionId, attachments, readOnly }: {
  type: Extract<ContributionType, "teaching_note" | "material">; revisionId: string; attachments: Attachment[]; readOnly: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [requestPending, setRequestPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const pending = requestPending || refreshing;
  const endpoint = `/api/contributions/${type}/${revisionId}/attachments`;

  async function upload(form: FormData) {
    setError("");
    setRequestPending(true);
    const response = await fetch(endpoint, { method: "POST", body: form });
    const body = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(body.error ?? "No pudimos cargar el archivo.");
    if (input.current) input.current.value = "";
    setRequestPending(false);
    startTransition(() => router.refresh());
  }

  async function remove(attachment: Attachment) {
    setError("");
    setRequestPending(true);
    const response = await fetch(`${endpoint}/${attachment.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(body.error ?? "No pudimos eliminar el archivo.");
    setRequestPending(false);
    startTransition(() => router.refresh());
  }

  async function recover(attachment: Attachment, action: "finalize" | "cancel") {
    setError("");
    setRequestPending(true);
    const response = await fetch(`${endpoint}/${attachment.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action === "finalize" ? "complete_upload" : "cancel_reservation" }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) setError(body.error ?? "No pudimos completar la operación.");
    setRequestPending(false);
    startTransition(() => router.refresh());
  }

  return <section className="mt-10 rounded-2xl border border-slate-900/15 bg-white/55 p-6" aria-labelledby="attachments-title">
    <h2 id="attachments-title" className="text-xl text-[#173f3a]">Archivos privados</h2>
    <p className="mt-2 text-sm text-slate-600">PDF y documentos de oficina, hasta 3 MB por archivo.</p>
    {attachments.length === 0 ? <p className="mt-5 text-sm text-slate-500">No hay archivos adjuntos.</p> : <ul className="mt-5 divide-y divide-slate-900/10">{attachments.map((attachment) => <li key={attachment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      {attachment.state === "Ready" ? <a href={`/api/attachments/${attachment.id}`} className="font-bold text-[#173f3a]">{attachment.original_filename}</a> : <span className="font-bold text-slate-700">{attachment.original_filename}</span>}
      <span className="text-xs text-slate-500">{Math.ceil(attachment.size_bytes / 1024)} KB</span>
      {!readOnly && attachment.state === "Ready" && <button type="button" disabled={pending} onClick={() => void remove(attachment)} className="bg-transparent px-2 py-1 text-sm text-red-800">Eliminar</button>}
      {!readOnly && attachment.state === "Reserved" && <span className="flex flex-wrap gap-2"><button type="button" disabled={pending} onClick={() => void recover(attachment, "finalize")} className="px-2 py-1 text-sm">Completar carga</button><button type="button" disabled={pending} onClick={() => void recover(attachment, "cancel")} className="bg-transparent px-2 py-1 text-sm text-red-800">Cancelar reserva</button><button type="button" disabled={pending} onClick={() => void remove(attachment)} className="bg-transparent px-2 py-1 text-sm text-red-800">Descartar carga</button></span>}
      {!readOnly && attachment.state === "Deleting" && <button type="button" disabled={pending} onClick={() => void remove(attachment)} className="px-2 py-1 text-sm">Completar eliminación</button>}
    </li>)}</ul>}
    {!readOnly && <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void upload(new FormData(event.currentTarget)); }}>
      <label className="min-w-64 flex-1"><span className="filter-label">Agregar archivo</span><input ref={input} type="file" name="file" required /></label>
      <button disabled={pending} type="submit">{pending ? "Procesando…" : "Cargar archivo"}</button>
    </form>}
    {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-800">{error}</p>}
  </section>;
}
