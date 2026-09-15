import type { PublishedAttachment } from "@/lib/curriculum/queries";

export function PublishedAttachments({ attachments }: { attachments: PublishedAttachment[] }) {
  if (attachments.length === 0) return null;

  return <section className="mt-5" aria-label="Archivos adjuntos">
    <h3 className="text-base font-bold text-[#173f3a]">Archivos adjuntos</h3>
    <ul className="mt-2 space-y-2">
      {attachments.map((attachment) => <li key={attachment.id}>
        <a href={`/api/attachments/${attachment.id}`} className="font-bold text-[#173f3a]">
          Descargar {attachment.originalFilename}
        </a>
        <span className="ml-2 text-xs text-slate-500">{Math.ceil(attachment.sizeBytes / 1024)} KB</span>
      </li>)}
    </ul>
  </section>;
}
