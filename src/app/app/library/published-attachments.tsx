import type { PublishedAttachment } from "@/lib/curriculum/queries";

export function PublishedAttachments({ attachments }: { attachments: PublishedAttachment[] }) {
  if (attachments.length === 0) return null;

  return <section className="mt-5 rounded-md border border-hairline bg-inset p-4" aria-label="Archivos adjuntos">
    <h3 className="text-sm font-extrabold tracking-[0.04em] text-ink-soft">Archivos adjuntos</h3>
    {/* <ul>/<li> and the "Descargar {filename}" link name are asserted behaviour. */}
    <ul className="mt-3 space-y-2">
      {attachments.map((attachment) => <li key={attachment.id} className="flex flex-wrap items-baseline gap-x-2">
        <a href={`/api/attachments/${attachment.id}`} className="font-bold">
          Descargar {attachment.originalFilename}
        </a>
        <span className="text-xs text-ink-muted">{Math.ceil(attachment.sizeBytes / 1024)} KB</span>
      </li>)}
    </ul>
  </section>;
}
