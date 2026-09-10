# SPEC-005 — Revisions, Audit History & Archival

**Status:** PLANNED  
**Depends on:** SPEC-004

## 1. Purpose / Objective

Complete the knowledge-governance lifecycle by supporting safe edits to published content, durable lifecycle history, and reversible archival/restoration.

## 2. Current State

New-content review/publication is specified separately, but published-content revision, complete audit history, and archival require their own bounded implementation.

## 3. Problem / Gap

Published knowledge must remain stable and auditable. Editing it in place or destructively deleting it would violate confirmed governance decisions.

## 4. Decision

Published content is never edited destructively in place.

Editing published content creates a new revision:

`Published v1 -> Draft Revision v2 -> Submitted -> Under Review -> ... -> Published v2`

Until publication of `v2`, `v1` remains the current published revision.

Published content is retired through archival, not permanent deletion.

Archived content is removed from normal discovery but preserved and restorable.

## 5. Scope

### In Scope

- create draft revision from published content;
- preserve current published revision while newer revision is pending;
- reuse the review workflow for the new revision;
- promote approved revision as the new current published revision;
- preserve historical revisions;
- append-oriented lifecycle/audit events;
- actor, organization, target, timestamp, and resulting status as applicable;
- Admin archive action;
- exclusion of archived content from normal browse/search;
- Admin restore action;
- history access appropriate for Admin governance;
- Contributor deletion of their own unsubmitted drafts when no required history is lost.

### Out of Scope

- destructive deletion of published governed content;
- generic enterprise audit analytics;
- configurable retention policies;
- multiple publication scopes;
- scheduled archival;
- arbitrary rollback of a historical revision as a new publication unless separately specified.

## 6. Expected Behavior

- opening an edit flow for published content creates/uses a new unpublished revision;
- readers continue to receive the prior published revision;
- the pending revision follows review;
- after publication, the new revision becomes current;
- older revisions remain historical;
- lifecycle events are attributable;
- archiving removes content from normal discovery without deleting history;
- restoring returns the content to normal published discovery;
- unauthorized actors cannot archive or restore.

## 7. Constraints

- current and pending revisions must be distinguishable at the data boundary;
- search must not leak archived/pending revisions;
- history is append-oriented for significant governance events;
- only Admin may archive/restore published content;
- permanent deletion of published content is not normal product behavior.

## 8. Impact Surface

- revision persistence;
- workflow integration;
- audit-event model;
- Admin history UI;
- search/read queries;
- archive/restore authorization.

## 9. Acceptance Criteria

1. Editing published content does not mutate the current published revision.
2. A new revision is created or clearly isolated for the proposed changes.
3. Ordinary readers continue to see the previously published revision while the new revision is pending.
4. The new revision passes through the existing review workflow.
5. Publishing the new revision atomically makes it the current published revision.
6. The previous revision remains available in history.
7. Significant lifecycle events record sufficient actor/target/time/status metadata for audit.
8. Only authorized Admins can archive published content.
9. Archived content disappears from normal browse/search results.
10. Archival does not destroy revision or audit history.
11. An Admin can restore archived content.
12. A Contributor can delete their own unsubmitted draft when no required governance history exists.
13. Pending, historical, and archived variants do not leak through normal reader queries.
14. Tests cover revision stability, publication promotion, history creation, archive, restore, and authorization.

## 10. Implementation Freedom

Implementation may choose audit-table shape, snapshot versus structured revision storage, and history presentation, provided the governance contract is preserved.

## 11. Knowledge Updates Required

- update `docs/CONTENT_MODEL.md` with verified physical revision/audit shape when useful;
- update `docs/GOVERNANCE.md` and `docs/ARCHITECTURE.md` with verified current state;
- move spec after verification.

## 12. Open Questions / Blockers

No known blocker.
