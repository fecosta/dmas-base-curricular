"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/boundary";
import type { ContentType } from "@/lib/analytics/contract";

/**
 * Emits `content_opened` for a governed content record the reader has opened.
 *
 * Rendered by the content surfaces themselves, so the event describes the
 * product action rather than the interaction that caused it: it is the same
 * event whether the module was reached as a standalone page, through the
 * Library's contextual overlay, from a search result, from a card, from a
 * Programa row, or from a shared link. No click handler is attached anywhere,
 * which is why no UI refactor can change the analytical meaning.
 *
 * Only the canonical identifier and type are reported. The title,
 * description, teaching notes and every other piece of content text stay out
 * of analytics entirely — they are not passed to this component.
 */
export function ContentOpened({ contentId, contentType }: {
  contentId: string;
  contentType: ContentType;
}) {
  // Guards against a second emission from an effect re-run for the same
  // record, while still reporting a genuine move to a different record.
  const reported = useRef<string | null>(null);

  useEffect(() => {
    const key = `${contentType}:${contentId}`;
    if (reported.current === key) return;
    reported.current = key;
    track("content_opened", { content_id: contentId, content_type: contentType });
  }, [contentId, contentType]);

  return null;
}
