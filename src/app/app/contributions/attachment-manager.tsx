"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Attachment, ContributionType } from "@/lib/contributions/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { EmptyNote } from "@/components/ui/empty-state";

/**
 * An attachment that is not Ready is mid-operation, not broken. Naming the state
 * in words is what tells the Admin which recovery action applies; the styling
 * only reinforces it.
 */
const stateLabel: Partial<Record<Attachment["state"], string>> = {
  Reserved: "Carga incompleta",
  Deleting: "Eliminación incompleta",
};

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

  return <section className="rounded-xl border border-hairline bg-surface p-5 shadow-card explorer:p-6" aria-labelledby="attachments-title">
    <div className="border-b border-hairline pb-4">
      {/* Not one of the form's numbered groups: files post to their own
          endpoint, and are managed after the Draft has been saved. */}
      <h2 id="attachments-title" className="text-base">Archivos privados</h2>
      <p className="mt-2 text-body text-ink-muted">
        PDF y documentos de oficina, hasta 3 MB por archivo. Solo las personas autorizadas pueden descargarlos.
      </p>
    </div>

    {/* <ul>/<li> is asserted: the E2E suite scopes attachment actions with getByRole("listitem"). */}
    {attachments.length === 0
      ? <EmptyNote className="mt-5">No hay archivos adjuntos.</EmptyNote>
      : <ul className="mt-5 grid gap-2">{attachments.map((attachment) => <li
          key={attachment.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-hairline bg-inset px-4 py-3"
        >
          <div className="min-w-0 flex-[1_1_14rem]">
            {attachment.state === "Ready"
              ? <a href={`/api/attachments/${attachment.id}`} className="font-bold break-words">{attachment.original_filename}</a>
              : <span className="font-bold break-words text-ink-soft">{attachment.original_filename}</span>}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta tracking-normal text-label">
              <span>{Math.ceil(attachment.size_bytes / 1024)} KB</span>
              <span>{attachment.mime_type}</span>
            </p>
          </div>
          {stateLabel[attachment.state] && <Badge tone="warning">{stateLabel[attachment.state]}</Badge>}
          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && attachment.state === "Ready" && <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void remove(attachment)}>Eliminar</Button>}
            {!readOnly && attachment.state === "Reserved" && <>
              <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void recover(attachment, "finalize")}>Completar carga</Button>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void recover(attachment, "cancel")}>Cancelar reserva</Button>
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={() => void remove(attachment)}>Descartar carga</Button>
            </>}
            {!readOnly && attachment.state === "Deleting" && <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => void remove(attachment)}>Completar eliminación</Button>}
          </div>
        </li>)}</ul>}

    {readOnly
      ? <p className="mt-5 text-body text-ink-muted">Los archivos de una versión publicada son de solo lectura.</p>
      : <form
          className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-hairline-strong bg-inset px-4 py-4"
          onSubmit={(event) => { event.preventDefault(); void upload(new FormData(event.currentTarget)); }}
        >
          {/* Native file input, reachable via getByLabel("Agregar archivo"). */}
          <Field label="Agregar archivo" className="min-w-56 flex-1"><input ref={input} type="file" name="file" required /></Field>
          <Button disabled={pending} type="submit">{pending ? "Procesando…" : "Cargar archivo"}</Button>
        </form>}

    {error && <Notice tone="error" className="mt-4">{error}</Notice>}
  </section>;
}
