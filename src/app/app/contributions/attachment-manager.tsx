"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Attachment, ContributionType } from "@/lib/contributions/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { EmptyNote } from "@/components/ui/empty-state";

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

  return <section className="mt-10 rounded-lg border border-hairline bg-surface p-6 shadow-card" aria-labelledby="attachments-title">
    <h2 id="attachments-title" className="text-lg">Archivos privados</h2>
    <p className="mt-2 text-sm text-ink-muted">PDF y documentos de oficina, hasta 3 MB por archivo.</p>
    {/* <ul>/<li> is asserted: the E2E suite scopes attachment actions with getByRole("listitem"). */}
    {attachments.length === 0 ? <EmptyNote className="mt-5">No hay archivos adjuntos.</EmptyNote> : <ul className="mt-5 divide-y divide-hairline">{attachments.map((attachment) => <li key={attachment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      {attachment.state === "Ready" ? <a href={`/api/attachments/${attachment.id}`} className="font-bold">{attachment.original_filename}</a> : <span className="font-bold text-ink-soft">{attachment.original_filename}</span>}
      <span className="text-xs text-ink-muted">{Math.ceil(attachment.size_bytes / 1024)} KB</span>
      {!readOnly && attachment.state === "Ready" && <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void remove(attachment)}>Eliminar</Button>}
      {!readOnly && attachment.state === "Reserved" && <span className="flex flex-wrap gap-2"><Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void recover(attachment, "finalize")}>Completar carga</Button><Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void recover(attachment, "cancel")}>Cancelar reserva</Button><Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void remove(attachment)}>Descartar carga</Button></span>}
      {!readOnly && attachment.state === "Deleting" && <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void remove(attachment)}>Completar eliminación</Button>}
    </li>)}</ul>}
    {!readOnly && <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void upload(new FormData(event.currentTarget)); }}>
      {/* Native file input, reachable via getByLabel("Agregar archivo"). */}
      <Field label="Agregar archivo" className="min-w-64 flex-1"><input ref={input} type="file" name="file" required /></Field>
      <Button disabled={pending} type="submit">{pending ? "Procesando…" : "Cargar archivo"}</Button>
    </form>}
    {error && <Notice tone="error" className="mt-4">{error}</Notice>}
  </section>;
}
