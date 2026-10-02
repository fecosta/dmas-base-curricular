"use client";

import { track } from "@/lib/analytics/boundary";
import type { ContentType } from "@/lib/analytics/contract";

/**
 * A published attachment download.
 *
 * Reports canonical identifiers only. The original filename stays out of
 * analytics: `attachment_id` identifies the file for every approved question,
 * and a filename is author-supplied free text that may describe private
 * content. It remains the link's visible label, which is a product concern,
 * not an analytics one.
 */
export function DownloadLink({ href, attachmentId, contentId, contentType, className, children }: {
  href: string;
  attachmentId: string;
  contentId: string;
  contentType: ContentType;
  className?: string;
  children: React.ReactNode;
}) {
  return <a
    href={href}
    className={className}
    // Non-blocking: the download proceeds regardless of analytics.
    onClick={() => track("content_downloaded", {
      attachment_id: attachmentId,
      content_id: contentId,
      content_type: contentType,
    })}
  >{children}</a>;
}
