# SPEC-005 — Audit History & Archival

**Status:** PLANNED  
**Depends on:** SPEC-004

## 1. Purpose / Objective

Complete the initial knowledge-governance lifecycle by providing durable administrative history and reversible archival/restoration for published governed curriculum content.

Revision creation, Admin Draft editing, current-published stability, and revision publication are owned by SPEC-004.

SPEC-005 builds on that foundation rather than implementing a separate review or revision workflow.

## 2. Current State

After SPEC-004, the platform is expected to provide:

- Admin-only governed-content authoring;
- Admin-wide management of active Admin Drafts;
- direct Admin publication;
- successor revisions through `Published v1 -> Draft v2 -> Published v2`;
- stable current-published reader resolution;
- preserved historical revisions;
- append-oriented lifecycle-event foundations.

SPEC-005 adds the operational history and retirement behavior required around those capabilities.

## 3. Problem / Gap

Governed knowledge must remain auditable and safely retireable.

The product needs to:

- reconstruct significant content lifecycle actions;
- preserve actor and organization attribution;
- distinguish current and historical revisions;
- retire published content without destructive deletion;
- restore archived content when required.

Permanent deletion or history loss would violate the confirmed governance contract.

## 4. Decision

Published governed content is retired through archival rather than destructive deletion.

Archival must:

- remove content from normal reader discovery;
- preserve stable identity;
- preserve revisions;
- preserve provenance;
- preserve lifecycle history.

An authorized Admin may restore archived content.

Audit/history is append-oriented.

Historical events from SPEC-003 and SPEC-004 remain valid and must not be rewritten simply because the active governance model changed.

## 5. Scope

### In Scope

- durable lifecycle/audit history for significant governance actions;
- actor attribution;
- organization attribution;
- target stable content identity;
- revision attribution where applicable;
- timestamp;
- previous/resulting state where applicable;
- Admin history access;
- Admin archive action;
- exclusion of archived content from normal browse/search;
- Admin restore action;
- preservation of historical revisions;
- preservation of historical SPEC-003 submission events;
- authorization tests for archive/restore/history access.

### Out of Scope

- creating successor Draft revisions;
- editing successor Draft revisions;
- revision publication;
- review queues;
- review comments;
- requested changes;
- approval;
- resubmission;
- workflow email notifications;
- destructive deletion of published governed content;
- generic enterprise audit analytics;
- configurable retention policies;
- scheduled archival;
- organization-specific publication scopes;
- arbitrary rollback of a historical revision as a new publication;
- user-facing collaborative contribution.

## 6. Expected Behavior

### Audit/history

- significant Admin content-management actions produce attributable lifecycle evidence;
- historical SPEC-003 events remain preserved;
- publication events from SPEC-004 remain preserved;
- audit/history data is not mutable by ordinary application users;
- history distinguishes stable content identity from specific revision events.

### Archive

When an eligible Admin archives current published content:

- it disappears from normal browse;
- it disappears from normal search;
- ordinary users can no longer resolve it through reader routes;
- its revisions remain preserved;
- its lifecycle history remains preserved;
- its provenance remains preserved.

### Restore

When an eligible Admin restores archived content:

- the existing current published revision becomes normally reader-visible again;
- restoration does not create a new semantic revision merely because archive state changed;
- historical archive/restore actions remain auditable.

## 7. Authorization

Only currently eligible Admins may:

- archive published governed content;
- restore archived governed content;
- access Admin governance history surfaces.

Admin authority is role-wide rather than based on original content creator.

Any currently eligible Admin may archive or restore eligible governed content regardless of which Admin originally created or published it.

Non-Admin users must not:

- archive;
- restore;
- modify audit history;
- use direct RPC/API calls to bypass those restrictions.

Admin authority derives from the live persisted role.

Historical `created_by` values do not grant or preserve administrative authority.

## 8. Data Integrity

Archival must not:

- delete the stable identity;
- delete the current published revision;
- delete historical revisions;
- rewrite provenance;
- rewrite lifecycle events.

Restore must not manufacture a new revision when no semantic content change occurred.

Lifecycle events must remain append-oriented.

Published revision immutability remains authoritative.

## 9. Reader Boundary

Archived governed content must not leak through:

- library;
- search;
- filters;
- references;
- Grilla;
- Programa;
- ordinary detail routes;
- autocomplete;
- exports;
- preload payloads.

Historical revisions remain outside ordinary reader surfaces.

Admin governance/history surfaces may expose authorized historical information separately.

## 10. Impact Surface

Expected implementation areas include:

- lifecycle-event persistence;
- audit/history queries;
- Admin history UI;
- stable identity archival metadata;
- archive/restore RPCs;
- RLS/authorization;
- reader/search behavior;
- tests;
- documentation reconciliation.

## 11. Acceptance Criteria

1. Significant lifecycle actions required by the active governance model are preserved in append-oriented history.
2. History records trusted actor, organization, target, revision where applicable, timestamp, and state information sufficient for audit.
3. Historical SPEC-003 lifecycle events remain preserved.
4. Ordinary application users cannot update or delete lifecycle history.
5. An eligible Admin can archive current published governed content.
6. A different eligible Admin can archive eligible governed content regardless of original creator.
7. A non-Admin user cannot archive through UI or direct data access.
8. Archived content disappears from normal browse/search/reader routes.
9. Archival does not delete the stable identity, revisions, provenance, or lifecycle history.
10. An eligible Admin can restore archived content.
11. A different eligible Admin can restore content regardless of original creator.
12. Restoring content returns its existing current published revision to normal reader visibility.
13. Restore does not create a new semantic revision solely because archive state changed.
14. Archive and restore actions are themselves auditable.
15. Historical revisions remain absent from ordinary reader surfaces.
16. Tests cover history integrity, Admin-wide archive/restore authority, non-Admin denial, archive visibility, restoration, and live role revocation.
17. Cloud verification confirms the intended RLS/grant/function posture after migration.
18. Hosted validation confirms archive and restore behavior without exposing archived or historical content to ordinary readers.

## 12. Implementation Freedom

Implementation may choose:

- lifecycle-event query shape;
- Admin history presentation;
- archive/restore RPC names;
- whether archive reason is captured;
- pagination/filtering for history;
- transaction/locking mechanics.

Implementation may not silently change:

- Admin-only archive/restore authority;
- Admin-wide authority independent of original creator;
- preservation of revisions and provenance;
- append-oriented history;
- current-published reader semantics;
- non-destructive archival.

If implementation discovers a constraint requiring those contracts to change, return:

`BLOCKED / DECISION REQUIRED`

## 13. Knowledge Updates Required

Before closure, reconcile verified current state with:

- `docs/GOVERNANCE.md`;
- `docs/SECURITY.md`;
- `docs/ARCHITECTURE.md`;
- `docs/CONTENT_MODEL.md` where physical history/archive shape becomes verified and materially useful;
- `README.md`;
- `resources/specs/README.md`.

Move SPEC-005 to `completed/` only after implementation and independent verification.

## 14. Open Questions / Blockers

No known product blocker.

Operational retention duration for audit/login logs remains a separate security/operations decision and does not block the bounded archive/history behavior defined here.
