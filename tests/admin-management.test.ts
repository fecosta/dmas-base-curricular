import { describe, expect, it } from "vitest";
import { mapManagementSummaries } from "@/lib/contributions/queries";

describe("Admin management list mapping", () => {
  const identities = [
    { id: "new", current_published_revision_id: null },
    { id: "stable", current_published_revision_id: "published-1" },
    { id: "revising", current_published_revision_id: "published-2" },
  ];
  const revisions = [
    { id: "draft-1", contentId: "new", title: "Nuevo", status: "Draft", revisionNumber: 1, createdAt: "2026-09-14T03:00:00Z", publishedAt: null },
    { id: "published-1", contentId: "stable", title: "Vigente", status: "Published", revisionNumber: 1, createdAt: "2026-09-14T01:00:00Z", publishedAt: "2026-09-14T02:00:00Z" },
    { id: "published-2", contentId: "revising", title: "Versión uno", status: "Published", revisionNumber: 1, createdAt: "2026-09-14T01:00:00Z", publishedAt: "2026-09-14T02:00:00Z" },
    { id: "draft-2", contentId: "revising", title: "Versión dos", status: "Draft", revisionNumber: 2, createdAt: "2026-09-14T04:00:00Z", publishedAt: null },
  ];

  it("distinguishes new Drafts, Published content, and Published content with a successor", () => {
    expect(mapManagementSummaries("module", identities, revisions)).toEqual([
      expect.objectContaining({ contentId: "new", state: "draft", draftRevisionNumber: 1 }),
      expect.objectContaining({ contentId: "stable", state: "published", currentPublishedRevisionNumber: 1 }),
      expect.objectContaining({ contentId: "revising", title: "Versión dos", state: "published_with_draft", draftRevisionNumber: 2 }),
    ]);
  });
});
