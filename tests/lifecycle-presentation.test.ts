import { describe, expect, it } from "vitest";
import { isIdentityLifecycleEvent, lifecycleActionLabel, revisionStatusLabel, revisionTransition } from "@/lib/contributions/lifecycle";
import type { LifecycleAction, LifecycleEvent } from "@/lib/contributions/types";
import { formatGovernanceTimestamp } from "@/lib/ui/datetime";

const actions: LifecycleAction[] = [
  "content_created", "revision_created", "revision_edited", "content_submitted",
  "draft_deleted", "content_published", "content_archived", "content_restored",
];

function event(overrides: Partial<LifecycleEvent> = {}): LifecycleEvent {
  return {
    eventId: 1,
    type: "material",
    contentId: "40000000-0000-4000-8000-000000000001",
    revisionId: "41000000-0000-4000-8000-000000000001",
    actorUserId: "50000000-0000-4000-8000-000000000001",
    actorOrganizationId: "60000000-0000-4000-8000-000000000001",
    actorOrganizationName: "Red de formación",
    action: "content_published",
    previousStatus: "Draft",
    resultingStatus: "Published",
    occurredAt: "2026-09-16T10:00:00Z",
    ...overrides,
  };
}

describe("lifecycle history presentation", () => {
  it("labels every persisted action in Spanish", () => {
    for (const action of actions) {
      expect(lifecycleActionLabel(action)).toMatch(/^[A-ZÁÉÍÓÚÑ]/);
      expect(lifecycleActionLabel(action)).not.toContain("_");
    }
    expect(lifecycleActionLabel("content_archived")).toBe("Contenido archivado");
    expect(lifecycleActionLabel("content_restored")).toBe("Contenido restaurado");
  });

  it("treats archive and restore as identity events", () => {
    expect(isIdentityLifecycleEvent("content_archived")).toBe(true);
    expect(isIdentityLifecycleEvent("content_restored")).toBe(true);
    expect(isIdentityLifecycleEvent("content_published")).toBe(false);
    expect(isIdentityLifecycleEvent("revision_edited")).toBe(false);
  });

  it("renders a real revision transition", () => {
    expect(revisionTransition(event())).toEqual({ previous: "Borrador", resulting: "Publicado" });
    expect(revisionTransition(event({ action: "revision_created", previousStatus: null, resultingStatus: "Draft" })))
      .toEqual({ previous: null, resulting: "Borrador" });
  });

  it("never manufactures a Published -> Archived transition", () => {
    expect(revisionTransition(event({ action: "content_archived", previousStatus: null, resultingStatus: null }))).toBeNull();
    expect(revisionTransition(event({ action: "content_restored", previousStatus: null, resultingStatus: null }))).toBeNull();
    // Even if a future writer populated the columns, an identity event must not
    // be rendered as a revision status change.
    expect(revisionTransition(event({ action: "content_archived", previousStatus: "Published", resultingStatus: "Published" }))).toBeNull();
  });

  it("renders nothing for a revision event that recorded no status", () => {
    expect(revisionTransition(event({ action: "draft_deleted", previousStatus: null, resultingStatus: null }))).toBeNull();
  });

  it("translates the revision statuses it displays", () => {
    expect(revisionStatusLabel("Published")).toBe("Publicado");
    expect(revisionStatusLabel("Draft")).toBe("Borrador");
    // "Archived" is not a revision status and therefore has no label to fall back to.
    expect(revisionStatusLabel("Archived")).toBe("Archived");
  });

  it("formats governance timestamps deterministically and says which zone they are in", () => {
    expect(formatGovernanceTimestamp("2026-09-16T10:00:00Z")).toContain("UTC");
    expect(formatGovernanceTimestamp("2026-09-16T10:00:00Z")).toBe(formatGovernanceTimestamp("2026-09-16T10:00:00.000Z"));
    expect(formatGovernanceTimestamp("not-a-date")).toBe("not-a-date");
  });
});
