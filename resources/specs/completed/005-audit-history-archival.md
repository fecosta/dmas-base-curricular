# SPEC-005 — Audit History & Archival

**Status:** COMPLETED — IMPLEMENTED, INDEPENDENTLY VERIFIED, CLOUD-APPLIED/SECURITY-VERIFIED, AND LOCAL-REAL-STACK-VALIDATED
**Methodology state:** CLOSED
**Depends on:** SPEC-004
**Closure verified:** 2026-09-17

## 1. Purpose / Objective

Complete the initial knowledge-governance lifecycle by exposing durable administrative history and implementing reversible archival/restoration for published governed curriculum content.

SPEC-004 provides the active Admin-only content-management foundation:

- Admin-only governed-content authoring;
- Admin-wide management of active Drafts;
- direct `Draft -> Published` publication;
- successor revisions through `Published v1 -> Draft v2 -> Published v2`;
- stable current-published reader resolution;
- preserved historical revisions;
- private governed attachments;
- append-oriented lifecycle-event persistence.

SPEC-005 builds on that verified foundation.

It does not introduce a separate review workflow, revision workflow, publication workflow, or archival revision status.

The objective is to complete the bounded operational lifecycle:

`Published -> Archived -> Restored`

while preserving:

- stable content identity;
- the authoritative current-published revision;
- revision history;
- provenance;
- lifecycle history;
- published dependency integrity;
- reader isolation;
- attachment privacy.

---

## 2. Current State

After verified SPEC-004 implementation, the platform provides:

- Admin-only governed-content creation and mutation;
- Admin-wide access to active Admin Drafts independent of original creator;
- direct Admin publication;
- one active Draft successor per stable identity;
- successor revisions through `Published v1 -> Draft v2 -> Published v2`;
- immutable Published revisions;
- stable `current_published_revision_id` resolution;
- current-published dependency validation during publication;
- reader isolation from Draft and historical revisions;
- private governed attachments;
- reader access only to eligible attachments belonging to authoritative current-published Teaching Note or Material revisions;
- append-oriented `curriculum_lifecycle_events`;
- historical SPEC-003 provenance and lifecycle evidence;
- publication lifecycle events from SPEC-004.

The stable identity tables already provide archival metadata including:

- `archived_at`;
- `archived_by`.

Existing ordinary reader policies already use active, non-archived stable identities as part of reader eligibility.

SPEC-005 therefore does not need to invent archival state or replace the existing reader architecture.

It must complete the authoritative archive/restore mutation boundary, dependency protection, Admin history access, archive/restore lifecycle evidence, attachment isolation, and operational UI.

---

## 3. Problem / Gap

Governed knowledge must remain auditable and safely retireable.

The product needs to:

- reconstruct significant content lifecycle actions;
- preserve trusted actor and organization attribution;
- distinguish stable content identity events from revision events;
- retire published content without destructive deletion;
- prevent archival from invalidating other active published knowledge;
- prevent archival from stranding an active Draft successor;
- restore archived content only when its published representation remains valid;
- prevent archived content and its governed attachments from leaking to ordinary readers.

Permanent deletion, silent dependency breakage, orphaned Draft behavior, unauthorized attachment access, or history loss would violate the confirmed governance contract.

---

## 4. Decision

### 4.1 Archival model

Archival is an **identity-level governance state**.

It is not a revision lifecycle status.

Archiving governed content:

- sets archival state on the stable identity;
- does not change the current published revision from `Published`;
- does not clear `current_published_revision_id`;
- does not create a new semantic revision;
- does not modify the current published revision;
- does not delete historical revisions.

The authoritative current-published revision therefore remains preserved while the stable identity is archived.

### 4.2 Non-destructive retirement

Published governed content is retired through archival rather than destructive deletion.

Archival must:

- remove content from normal reader discovery and resolution;
- prevent ordinary reader access to governed attachments belonging to the archived identity;
- preserve stable identity;
- preserve the current published pointer;
- preserve revisions;
- preserve relationships;
- preserve governed attachment metadata and stored objects;
- preserve provenance;
- preserve lifecycle history.

### 4.3 Draft-safe archival

A stable identity with an active Draft revision must not be archived.

The Admin must first resolve the active Draft through the separately defined content-management workflow before archival becomes eligible.

Archival must not:

- delete an active Draft automatically;
- convert a Draft into another state;
- silently hide a Draft for later resurrection;
- implicitly publish a Draft.

### 4.4 Dependency-safe archival

Archival must not invalidate another active current-published representation.

An identity must not be archived while it is required by active current-published governed content.

This includes, as applicable:

- a Module referenced by an active current-published Program Topic;
- a Module referenced by an active current-published Teaching Note;
- a Program Topic referenced by an active current-published Teaching Note;
- an Instructor referenced by an active current-published Module;
- a Material referenced by an active current-published Module;
- a Material referenced by an active current-published Teaching Note;
- an Institution referenced by an active current-published Module.

Archival is blocked rather than cascading automatically to dependent content.

Cascade archival is not part of SPEC-005.

### 4.5 Restore

An authorized Admin may restore archived content.

Restore reactivates the existing stable identity and its existing authoritative current-published revision.

Restore must not create a new semantic revision merely because archive state changed.

Before restoration succeeds, the system must revalidate that the archived identity's existing current-published representation still satisfies the current published-dependency contract.

If dependencies required by that representation are no longer active/current-published, restore must fail rather than expose structurally invalid published content.

### 4.6 Audit/history

Audit/history remains append-oriented.

The existing `curriculum_lifecycle_events` foundation remains authoritative for governed-content lifecycle evidence.

SPEC-005 extends that foundation rather than creating a parallel audit-history model.

Historical events from SPEC-003 and SPEC-004 remain valid and must not be rewritten merely because the active governance model changed.

Archive and restore add lifecycle actions equivalent to:

- `content_archived`;
- `content_restored`.

---

## 5. Scope

### In Scope

- Admin access to existing durable lifecycle/audit history;
- trusted actor attribution;
- trusted organization attribution;
- stable content identity attribution;
- revision attribution where applicable;
- timestamp;
- previous/resulting revision state where applicable;
- preservation of historical SPEC-003 lifecycle events;
- preservation of SPEC-004 publication events;
- `content_archived` lifecycle evidence;
- `content_restored` lifecycle evidence;
- Admin history query/read boundary;
- Admin history UI;
- Admin archive action;
- Admin restore action;
- active-Draft archival guard;
- current-published dependent archival guard;
- restore-time dependency revalidation;
- exclusion of archived content from normal reader surfaces;
- exclusion of archived governed attachments from ordinary reader access;
- restoration of normal reader eligibility after valid restore;
- preservation of stable identities;
- preservation of historical revisions;
- preservation of relationships;
- preservation of governed attachment metadata and stored objects;
- authorization tests for archive/restore/history access;
- dependency-integrity tests;
- attachment authorization tests;
- Cloud security verification;
- hosted archive/restore validation.

### Out of Scope

- creating successor Draft revisions;
- editing successor Draft revisions;
- revision publication;
- automatic Draft deletion during archival;
- automatic Draft publication during archival;
- cascade archival;
- review queues;
- review comments;
- requested changes;
- approval;
- resubmission;
- workflow email notifications;
- destructive deletion of published governed content;
- deletion of governed attachment bytes as a consequence of archival;
- generic enterprise audit analytics;
- configurable retention policies;
- scheduled archival;
- organization-specific publication scopes;
- arbitrary rollback of a historical revision as a new publication;
- user-facing collaborative contribution.

---

## 6. Expected Behavior

### 6.1 Audit/history

Significant governed-content lifecycle actions produce attributable lifecycle evidence.

History must preserve:

- trusted actor;
- actor organization;
- action;
- stable content identity;
- revision where applicable;
- timestamp;
- previous/resulting revision state where applicable.

Historical SPEC-003 events remain preserved.

SPEC-004 publication and revision events remain preserved.

Archive and restore actions are appended to the same lifecycle-history foundation.

Audit/history data must not be mutable by ordinary application users.

History must distinguish:

- stable identity events;
- revision-specific events.

Archive and restore are identity-level governance events.

They must not manufacture a fictitious revision transition such as:

`Published -> Archived`

because `Archived` is not a revision lifecycle state.

For archive/restore events, revision-state fields may remain null where no revision status transition occurred.

The event may reference the authoritative current-published revision for context without representing a semantic revision mutation.

### 6.2 Archive

When an eligible Admin requests archival, the system must verify that:

- the actor currently has live Admin authority;
- the stable identity exists;
- the identity is not already archived;
- the identity has an authoritative current-published revision;
- no active Draft exists for that identity;
- archival would not invalidate another active current-published representation.

If any eligibility condition fails, archival must fail without partially changing archival state or lifecycle history.

When eligible archival succeeds:

- the stable identity becomes archived;
- the current published revision remains `Published`;
- `current_published_revision_id` remains unchanged;
- the content disappears from normal browse;
- the content disappears from normal search;
- ordinary users can no longer resolve it through reader routes;
- governed attachments belonging to that archived identity are no longer accessible through ordinary reader authorization;
- revisions remain preserved;
- relationships remain preserved;
- attachment metadata remains preserved;
- attachment objects remain stored privately;
- lifecycle history remains preserved;
- provenance remains preserved;
- a `content_archived` lifecycle event is appended.

### 6.3 Restore

When an eligible Admin requests restoration, the system must verify that:

- the actor currently has live Admin authority;
- the stable identity exists;
- the identity is currently archived;
- its `current_published_revision_id` still identifies its authoritative Published revision;
- the existing published representation satisfies the current published-dependency contract.

If restore validation fails, the identity remains archived.

When valid restoration succeeds:

- archival state is cleared;
- the existing current published revision becomes normally reader-visible again;
- no new semantic revision is created;
- no Published revision is mutated;
- eligible governed attachments belonging to the authoritative current-published Teaching Note or Material revision become reader-accessible again under the existing published-attachment authorization rules;
- historical archive/restore actions remain preserved;
- a `content_restored` lifecycle event is appended.

---

## 7. Authorization

Only currently eligible Admins may:

- archive published governed content;
- restore archived governed content;
- access Admin governance history surfaces.

Admin authority is role-wide rather than based on original content creator.

Any currently eligible Admin may archive or restore eligible governed content regardless of which Admin originally created, edited, or published it.

Authorization must derive from the same live trusted access boundary used by SPEC-004:

`authenticated identity -> approved domain -> active membership -> active organization -> persisted role`

The live persisted `Admin` role grants archive/restore/history authority.

Historical `created_by`, `archived_by`, publication actor, or contributor provenance must not grant current authority.

Non-Admin users must not:

- archive;
- restore;
- access Admin-only lifecycle history;
- modify lifecycle history;
- use direct RPC/API/data access to bypass those restrictions.

Role revocation must take effect through the live authorization boundary.

---

## 8. Data Integrity

Archival must not:

- delete the stable identity;
- clear the authoritative current-published pointer;
- change a Published revision's status;
- delete the current published revision;
- delete historical revisions;
- delete preserved revision relationships;
- delete governed attachment metadata;
- delete governed attachment objects;
- rewrite provenance;
- rewrite lifecycle events;
- invalidate another active current-published representation;
- silently discard an active Draft.

Restore must not:

- manufacture a new revision when no semantic content change occurred;
- mutate an immutable Published revision;
- expose a representation whose required published dependencies are no longer valid.

Lifecycle events remain append-oriented.

Published revision immutability remains authoritative.

Existing revision numbering remains unchanged by archive/restore.

### Archival metadata

Existing stable-identity archival metadata remains authoritative for current archive state:

- `archived_at`;
- `archived_by`.

Restore may clear current archival metadata while the append-oriented lifecycle history preserves who archived/restored the identity and when.

Additional fields such as an archive reason are optional implementation choices and must not become a substitute for lifecycle history.

---

## 9. Dependency Integrity

SPEC-004 establishes a valid current-published dependency graph at publication time.

SPEC-005 must preserve that invariant after publication.

### Archival guard

Before archiving an identity, the authoritative mutation boundary must determine whether any active current-published representation depends on it.

If such a dependency exists, archival must be rejected.

The rejection should provide sufficient structured information for the Admin application to explain that archival is blocked by published dependencies.

The implementation must not automatically archive dependent content.

### Restore validation

Before restoring an identity, the authoritative mutation boundary must validate the dependencies required by the identity's existing current-published representation using semantics equivalent to the active publication dependency contract.

Restore must fail if those dependencies are no longer valid.

This requirement prevents archive/restore from becoming a bypass around publication validation.

---

## 10. Draft Integrity

SPEC-004 permits:

`Published v1 -> Draft v2`

while v1 remains the authoritative reader revision.

SPEC-005 must not introduce ambiguous behavior for this state.

An identity with an active Draft is not eligible for archival.

Archival must not:

- delete the Draft;
- publish the Draft;
- change the Draft status;
- preserve it as a hidden archival side effect.

The active Draft must be resolved through the content-management lifecycle before archival.

Restore therefore does not need to resurrect or reinterpret Draft state created before archival.

---

## 11. Reader Boundary

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

Reader APIs and queries must continue resolving only eligible active stable identities and their authoritative current-published revisions.

Admin governance/history surfaces may expose authorized historical information separately.

Existing reader behavior that already excludes archived stable identities should be preserved and verified rather than unnecessarily replaced.

---

## 12. Attachment Boundary

Governed attachment bytes remain in the private Storage bucket during archive and restore operations.

Archival must not move, copy, or delete attachment objects merely because the stable identity becomes archived.

Ordinary readers must not be able to access governed attachments associated with an archived Teaching Note or Material, including through direct Storage-object access.

Historical revision attachments remain inaccessible to ordinary readers.

After valid restoration:

- only `Ready` attachments;
- belonging to the authoritative current-published Teaching Note or Material revision;
- under the existing eligible-reader authorization contract

may become reader-accessible again.

Draft attachment authorization remains governed by the SPEC-004 Admin-only Draft boundary.

---

## 13. Audit Read Boundary

`curriculum_lifecycle_events` remains append-oriented infrastructure and must not become a generally writable application table.

SPEC-005 should expose Admin history through a controlled Admin-only read boundary.

The implementation may use a dedicated RPC/query abstraction.

The boundary must:

- require live Admin authority;
- expose only the history required for governance administration;
- preserve stable identity versus revision semantics;
- support bounded result retrieval;
- prevent client-controlled mutation of lifecycle evidence.

Pagination and optional filters such as:

- content type;
- content identity;
- action;
- time range

are implementation choices.

Direct broad mutation privileges over lifecycle history must not be granted to authenticated application users.

---

## 14. Authoritative Mutation Boundary

Archive and restore must be implemented through authoritative server/data operations rather than arbitrary client updates to stable identity archival fields.

The archive operation must atomically:

1. resolve live Admin authority;
2. lock or otherwise concurrency-protect the target stable identity;
3. verify current-published eligibility;
4. verify the identity is not already archived;
5. verify no active Draft exists;
6. verify no active current-published dependent blocks archival;
7. apply trusted archival metadata;
8. append `content_archived` lifecycle evidence.

The restore operation must atomically:

1. resolve live Admin authority;
2. lock or otherwise concurrency-protect the target stable identity;
3. verify the identity is archived;
4. verify the authoritative current-published revision;
5. revalidate required current-published dependencies;
6. clear current archival metadata;
7. append `content_restored` lifecycle evidence.

Concurrent archive, restore, Draft creation, or publication operations must not leave identity state, Draft state, current-published pointers, dependency validity, or lifecycle history partially inconsistent.

---

## 15. Impact Surface

Expected primary implementation areas include:

- lifecycle-action persistence;
- archive/restore lifecycle events;
- Admin audit/history query boundary;
- Admin history UI;
- authoritative archive RPC;
- authoritative restore RPC;
- dependency checks;
- active-Draft checks;
- RLS/grants/function authorization;
- published attachment authorization;
- Admin archive/restore UI;
- concurrency behavior;
- tests;
- documentation reconciliation.

Expected regression/verification surfaces include:

- library;
- search;
- filters;
- references;
- Grilla;
- Programa;
- detail routes;
- autocomplete;
- exports;
- preload payloads;
- published attachment reader access;
- Draft isolation;
- historical revision isolation.

Existing reader behavior should not be redesigned where current archived-identity semantics already satisfy the contract.

---

## 16. Acceptance Criteria

1. Significant lifecycle actions required by the active governance model are preserved in append-oriented history.

2. History records trusted actor, organization, stable target identity, revision where applicable, timestamp, and state information sufficient for audit.

3. Historical SPEC-003 lifecycle events remain preserved and unchanged.

4. SPEC-004 lifecycle evidence, including publication events, remains preserved and unchanged.

5. Archive and restore append lifecycle actions equivalent to `content_archived` and `content_restored`.

6. Archive/restore events do not falsely represent archival as a revision status transition.

7. Ordinary application users cannot update or delete lifecycle history.

8. Non-Admin users cannot access the Admin governance-history surface.

9. An eligible Admin can archive eligible current-published governed content.

10. A different eligible Admin can archive eligible governed content regardless of original creator or publisher.

11. A non-Admin user cannot archive through UI, RPC, API, or direct data access.

12. An identity with an active Draft cannot be archived.

13. Failed archival due to an active Draft leaves stable identity, Draft, current-published pointer, and lifecycle history unchanged.

14. An identity required by another active current-published representation cannot be archived.

15. Dependency-blocked archival does not cascade automatically to dependent content.

16. Failed archival due to published dependencies leaves identity state and lifecycle history unchanged.

17. Eligible archival preserves `current_published_revision_id`.

18. Eligible archival does not change the current revision's `Published` status.

19. Archived content disappears from normal browse, search, filters, references, Grilla, Programa, detail routes, autocomplete, exports, and preload reader payloads.

20. Archival does not delete the stable identity, revisions, relationships, provenance, lifecycle history, governed attachment metadata, or governed attachment objects.

21. Ordinary readers cannot access governed attachments belonging to an archived Teaching Note or Material.

22. An eligible Admin can restore eligible archived content.

23. A different eligible Admin can restore content regardless of original creator, publisher, or archiving Admin.

24. Restore revalidates the archived identity's existing current-published dependency graph.

25. Restore fails if required current-published dependencies are no longer valid.

26. Failed restore leaves the identity archived and does not append a successful restoration event.

27. Successful restore returns the existing authoritative current-published revision to normal reader visibility.

28. Restore does not create a new semantic revision solely because archive state changed.

29. Restore does not mutate the existing Published revision.

30. After valid restore, eligible readers regain access only to authorized `Ready` attachments belonging to the authoritative current-published Teaching Note or Material revision.

31. Historical revisions remain absent from ordinary reader surfaces before, during, and after archive/restore.

32. Archive and restore actions are themselves attributable and auditable.

33. Admin history access uses live persisted Admin authority rather than historical creator ownership.

34. Live Admin-role revocation removes archive, restore, and Admin-history authority.

35. Concurrent archive/restore/Draft/publication operations cannot leave partial archival state, invalid current pointers, stranded active Draft state, invalid dependency state, or successful lifecycle evidence for a failed operation.

36. Tests cover history integrity, Admin-wide authority, non-Admin denial, active-Draft blocking, dependency blocking, archive visibility, attachment isolation, restoration, restore dependency validation, concurrency-sensitive behavior, and live role revocation.

37. Cloud verification confirms the intended RLS, grants, functions, lifecycle-event protections, and Storage authorization posture after migration.

38. Hosted validation confirms archive and restore behavior without exposing archived content, archived governed attachments, Drafts, or historical revisions to ordinary readers.

---

## 17. Implementation Freedom

Implementation may choose:

- lifecycle-event query shape;
- Admin history presentation;
- archive/restore RPC names;
- whether an archive reason is captured;
- pagination/filtering for history;
- exact SQL helper decomposition;
- exact locking mechanism;
- structured representation of dependency-blocking information;
- Admin confirmation UX.

Implementation may reuse existing publication/dependency helpers where doing so preserves their established semantics and security boundary.

Implementation may not silently change:

- archival as identity-level state;
- preservation of the current-published pointer during archival;
- Published revision immutability;
- Admin-only archive/restore authority;
- Admin-wide authority independent of original creator;
- active-Draft archival prohibition;
- dependency-safe archival;
- no cascade archival;
- restore-time dependency revalidation;
- preservation of revisions, relationships, attachments, history, and provenance;
- append-oriented history;
- current-published reader semantics;
- published attachment isolation;
- non-destructive archival.

If implementation discovers a constraint requiring those contracts to change, return:

`BLOCKED / DECISION REQUIRED`

---

## 18. Validation Requirements

Implementation completion requires more than local test success.

Validation must include:

### Local/static validation

- type checking;
- linting;
- unit/integration tests;
- archive/restore authorization tests;
- lifecycle-history tests;
- dependency tests;
- active-Draft tests;
- attachment authorization tests;
- reader regression tests;
- concurrency-sensitive database tests where appropriate.

### Independent review

Review must explicitly examine:

- product-contract fidelity;
- archival semantics;
- dependency safety;
- Draft safety;
- authorization;
- SECURITY DEFINER boundaries where used;
- RLS/grants;
- lifecycle-event immutability;
- concurrency;
- Storage authorization;
- reader isolation.

### Supabase Cloud verification

Verify the intended target project after migration, including:

- migration application;
- functions;
- function grants;
- table grants;
- RLS policies;
- lifecycle-event protection;
- archive metadata behavior;
- Storage policies affected by archival eligibility.

### Hosted/real-stack validation

Validate at minimum:

- eligible Admin archive;
- cross-Admin archive;
- non-Admin denial;
- active-Draft archive rejection;
- published-dependent archive rejection;
- ordinary reader disappearance after archive;
- archived attachment denial;
- eligible restore;
- invalid-dependency restore rejection;
- reader reappearance after valid restore;
- attachment reappearance after valid restore;
- historical revision isolation;
- live role revocation.

---

## 19. Knowledge Updates Required

Before closure, reconcile verified current state with:

- `docs/GOVERNANCE.md`;
- `docs/SECURITY.md`;
- `docs/ARCHITECTURE.md`;
- `docs/CONTENT_MODEL.md` where physical history/archive shape becomes verified and materially useful;
- `docs/DECISIONS.md` where implementation resolves durable technical/product decisions worth preserving;
- `README.md`;
- `docs/README.md` where applicable;
- `resources/specs/README.md`.

Documentation must distinguish:

- current implemented archival behavior;
- historical contribution/review foundations;
- deferred collaborative governance.

Move SPEC-005 to `completed/` only after implementation, independent review, Cloud verification, hosted/real-stack validation, and durable-knowledge reconciliation.

---

## 20. Open Questions / Blockers

No known product blocker.

The following decisions are resolved by this specification:

- archival is identity-level rather than a revision status;
- archival preserves `current_published_revision_id`;
- identities with active Drafts cannot be archived;
- archival cannot invalidate active current-published dependents;
- archival does not cascade;
- restore revalidates published dependencies;
- archive/restore do not create semantic revisions;
- governed attachment bytes remain preserved during archival;
- ordinary reader attachment authorization follows active current-published identity eligibility.

Operational retention duration for audit/login logs remains a separate security/operations decision and does not block the bounded archive/history behavior defined here.

---

## 21. Completion Evidence

### Implementation sequence

- `fc7b2ef` — Phase 1: `archive_governed_content`, `restore_governed_content`, `list_curriculum_lifecycle_history`, identity locking, active-Draft guard, current-published dependent guard, restore-time dependency revalidation, `content_archived`/`content_restored` evidence (`20260915000200`).
- `b6e852a` — Phase 2A: Admin-only `list_archived_governed_content` read boundary and `actor_organization_name` history attribution, added without relaxing any reader or Admin RLS policy (`20260916000100`).
- `aa90339` — deterministic archived pagination correction (`20260916000200`). Independent review established that `(archived_at, content_id)` is not a total order, because the six identity tables each declare an independent client-supplied `id uuid primary key`, so two identities of different types may share a UUID; a page boundary between tied rows could permanently strand an archived identity. `content_type` was added as a third ordering/cursor component and the obsolete four-argument overload was dropped.
- `d5506da` — Phase 2B+C: typed archived/history query layer, Archive/Restore server actions with structured dependency-blocker mapping, Admin Archived management, confirmation step, Restore, and global plus identity-scoped governance History.

Each phase was independently reviewed before the next began; the `aa90339` correction is itself the outcome of that review process.

### Validation environment policy

Closure uses a deliberate evidence split, recorded durably in `docs/DECISIONS.md` (G-005).

**Production Supabase Cloud** — authoritative for migration, schema and security posture:

- project `qcxcgwpfgclyebkxawyh` confirmed as the linked application target;
- all ten migrations report `local == remote`, with Phase 1 and both Phase 2A migrations applied;
- `list_archived_governed_content` exists only in its final five-argument form (`page_size`, `before_archived_at`, `before_content_id`, `before_content_type`, `content_type_filter`); the obsolete four-argument overload is absent;
- all four SPEC-005 RPCs are `SECURITY DEFINER` with `search_path = ''`, owned by `postgres`, `REVOKE ALL … FROM PUBLIC`, and granted `EXECUTE` only to `authenticated`; neither `anon` nor `service_role` holds execution; the two listing operations are `STABLE` and the two mutations `VOLATILE`;
- the RLS policy set is byte-identical before and after migration (60 policies), with archived identities still excluded by `archived_at is null` predicates;
- `curriculum_lifecycle_events` has no table grant to `authenticated` or `anon`;
- `private.can_read_current_published_attachment` still requires a non-archived current-published identity, so the Storage authorization posture is unchanged;
- live `anon` calls to all four RPCs and to the lifecycle-event and curriculum tables are denied with `42501`;
- production deployment of `d5506da` was verified, and anonymous requests to the Admin routes render the not-found boundary and redirect to `/login`, exposing no identifiers or governance labels.

**Local real stack** — authoritative for functional behavior. Real local Supabase Auth, PostgreSQL, RLS, Storage, Next.js and Chromium, with fixture actors resolved through the full `auth identity -> approved domain -> active membership -> active organization -> persisted role` chain:

- Archive happy path through the Admin UI, including the confirmation step, redirect to Archived management, populated `archived_at`/`archived_by`, preserved `current_published_revision_id`, unchanged `Published` status and unchanged revision count;
- Restore happy path returning the same published revision with no new revision created;
- cross-Admin authority in both directions, with lifecycle events attributed to the Admin who actually acted;
- non-Admin denial of `/app/contributions`, Archived management, `/app/contributions/history` and creation routes, plus `42501` on all four RPCs and on direct lifecycle-event reads;
- live Admin role revocation removing archive, restore, history and archived-list authority without re-login or token expiry;
- active-Draft archival blocking, with Archive withheld from the UI, an explanation shown, and the RPC still rejecting a stale direct attempt;
- dependency-blocked archival returning structured blockers rendered as readable titles, with no cascade and no archive event;
- restore refused while a required dependency is no longer current-published, leaving the identity archived with no restoration event, then succeeding once the dependency is restored;
- reader isolation after archive across library browse, search, the Programa view, the reference detail route and the reader RPC boundary;
- attachment isolation across archive and restore: reader API and direct Storage access denied while archived, object bytes and metadata preserved, access returning after restore with no object copy, move or re-upload;
- historical-revision isolation before, during and after archive/restore;
- global and identity-scoped History with newest-first ordering, identity-versus-revision event semantics, organization attribution, no actor email, no fabricated `Published -> Archived` transition, and `before_event_id` pagination;
- archived management pagination across 23 archived identities carrying all three cursor components, with no entry skipped or duplicated and the type filter preserved.

Functional mutation of production was deliberately **not** performed. Production holds real organizations and real Admin identities, and `curriculum_lifecycle_events` is append-oriented governance evidence with no delete path and an `ON DELETE RESTRICT` actor reference. Archiving production content for test evidence would write permanent lifecycle events attributed to real people and permanently pin the acting identity, degrading the trustworthy attribution this specification exists to guarantee. Local real-stack validation is therefore not represented as hosted production functional validation.

### Automated and regression evidence

- pgTAP: 470 assertions across 7 files, `Result: PASS`. Covers history integrity, Admin-wide authority, non-Admin denial, the active-Draft guard, every dependency-blocking branch, restore-time revalidation of each outgoing dependency contract, attachment authorization, live role revocation, the cross-table UUID collision pagination regression, and concurrency through real `dblink` sessions serializing archive against successor-draft creation.
- Vitest: 162 tests across 24 files.
- Playwright: 19 journeys on a clean database in both development and production-build modes, the latter pinned to local Supabase.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:lint` and `git diff --check` all pass.

### Acceptance criteria

All 38 acceptance criteria in §16 are satisfied. Criterion 38 is satisfied by production Cloud security verification of the deployed schema combined with local real-stack functional behavior over that identical schema, under the validation environment policy above rather than by mutating production.

### Non-blocking follow-ups

Recorded, deliberately out of SPEC-005 scope: archived-content text search; archived-listing indexing should archived volume grow materially; SQL-level pagination for the active management listing at larger scale; standalone Instructor reader discovery; intermittent OTP-login flakiness in the E2E login helper; and `auth.spec.ts`'s single-dataset assumption, which conflicts with an imported demo curriculum.

SPEC-005 is closed without activating another specification.
