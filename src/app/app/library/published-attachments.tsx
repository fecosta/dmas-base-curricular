import type { PublishedAttachment } from "@/lib/curriculum/queries";
import { DownloadLink } from "@/components/analytics/download-link";
import type { ContentType } from "@/lib/analytics/contract";

/**
 * Published attachments for a governed content record.
 *
 * `contentId`/`contentType` identify the record the files belong to. They are
 * required because a download is only analytically meaningful as "an
 * attachment of this content was downloaded" — an attachment id alone would
 * not answer which content generated interest. Callers already know both, so
 * this is the smallest adaptation that supplies the parent context.
 */
export function PublishedAttachments({ attachments, contentId, contentType }: {
  attachments: PublishedAttachment[];
  contentId: string;
  contentType: ContentType;
}) {
  if (attachments.length === 0) return null;

  return <section className="mt-5 rounded-md border border-hairline bg-inset p-4" aria-label="Archivos adjuntos">
    <h3 className="text-sm font-extrabold tracking-[0.04em] text-ink-soft">Archivos adjuntos</h3>
    {/* <ul>/<li> and the "Descargar {filename}" link name are asserted behaviour. */}
    <ul className="mt-3 space-y-2">
      {attachments.map((attachment) => <li key={attachment.id} className="flex flex-wrap items-baseline gap-x-2">
        <DownloadLink
          href={`/api/attachments/${attachment.id}`}
          attachmentId={attachment.id}
          contentId={contentId}
          contentType={contentType}
          className="font-bold"
        >
          Descargar {attachment.originalFilename}
        </DownloadLink>
        <span className="text-xs text-ink-muted">{Math.ceil(attachment.sizeBytes / 1024)} KB</span>
      </li>)}
    </ul>
  </section>;
}
