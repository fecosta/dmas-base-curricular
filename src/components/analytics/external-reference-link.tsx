"use client";

import { track } from "@/lib/analytics/boundary";
import type { ContentType } from "@/lib/analytics/contract";

/**
 * An external reference offered by a governed content record.
 *
 * Deliberately not a generic tracker for every external anchor in the
 * application: it is applied only where a content record publishes a reference
 * to an outside source, which is the signal SPEC-008 MP-04 asks for. An
 * application-wide link listener would collect interactions that have no
 * defined measurement purpose.
 *
 * The destination URL is never reported. The event answers "which content's
 * external reference was followed", which the content identifier already
 * settles; the full URL would add an unapproved data category. The href is
 * only ever used as the link's own destination.
 */
export function ExternalReferenceLink({ href, contentId, contentType, className, children }: {
  href: string;
  contentId: string;
  contentType: ContentType;
  className?: string;
  children: React.ReactNode;
}) {
  return <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={className}
    // Navigation is not awaited on analytics: `track` is non-blocking and
    // cannot fail into the click, so the link behaves exactly as before.
    onClick={() => track("external_reference_opened", {
      content_id: contentId,
      content_type: contentType,
    })}
  >{children}</a>;
}
