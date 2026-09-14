# SPEC-004 — Review, Approval & Publication

**Status:** PLANNED  
**Methodology state:** IMPLEMENTATION READY  
**Depends on:** SPEC-003

## 1. Purpose / Objective

Implement the Admin governance workflow for reviewing submitted contributions, requesting changes, receiving resubmissions, approving valid revisions, publishing governed content, and sending the required workflow notifications.

SPEC-004 extends the verified contribution foundation delivered by SPEC-003 without changing its stable identity, typed revision, provenance, private attachment, or published-reader architecture.

The objective is to complete the new-content governance path:

`Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

with the shorter valid path:

`Draft -> Submitted -> Under Review -> Approved -> Published`

while preserving Admin-only publication authority and current-published reader isolation.

---

## 2. Current State

SPEC-003 provides:

- new governed content identities with first typed revisions;
- authenticated Contributor/Admin Draft authoring;
- immutable contributor-user provenance;
- immutable contributor-organization provenance;
- Draft ownership;
- owner-only pending visibility;
- private Teaching Note and Material attachments;
- caller-owned Draft/Submitted relationship dependencies;
- lifecycle-event persistence;
- `Draft -> Submitted`;
- Submitted immutability;
- published-reader isolation;
- no cross-user Admin review visibility;
- no review comments;
- no changes-request workflow;
- no approval;
- no publication;
- no workflow notifications.

SPEC-002 already provides:

- Under Review;
- Changes Requested;
- Resubmitted;
- Approved;
- Published;

in the governed revision-status enum.

The physical identity/revision model already supports a stable identity resolving a current published revision.

SPEC-004 must extend that existing authority rather than introduce a parallel workflow status model.

---

## 3. Problem / Gap

The contribution workflow currently stops at Submitted.

Without SPEC-004:

- Admins cannot review another contributor’s pending revision;
- submitted revisions cannot enter an Admin governance workflow;
- Contributors cannot receive or act on review feedback;
- revisions cannot be approved;
- approved revisions cannot become current published content;
- external contributions cannot complete their governance lifecycle;
- required review notifications do not exist.

The product requires a server/data-enforced review and publication process that preserves:

- contributor provenance;
- review attribution;
- lifecycle evidence;
- pending-content isolation;
- publication authority;
- current-published reader behavior.

---

## 4. Authoritative Decisions

The following decisions are already approved and remain authoritative:

- external contributions require Admin review before publication;
- contribution does not grant publication authority;
- the MVP uses one Admin role for:
  - review;
  - change requests;
  - approval;
  - publication;
- Contributors cannot approve or publish;
- review feedback must remain visible to the responsible Contributor;
- review decisions must remain attributable;
- publication is distinct from approval;
- all published content is visible network-wide to authenticated eligible users in the MVP;
- email links do not grant authorization;
- Resend is the workflow-email provider;
- Admin-authored Democracia+ content may be directly published without approval from a second Admin;
- already-published content is not edited in place;
- creation of later revisions from published content belongs to SPEC-005.

SPEC-004 does not introduce new governance roles, publication scopes, sensitivity tiers, or published-content revision authoring.

---

## 5. Lifecycle Authority

For externally governed new contributions, SPEC-004 owns:

- `Submitted -> Under Review`
- `Under Review -> Changes Requested`
- `Changes Requested -> Resubmitted`
- `Resubmitted -> Under Review`
- `Under Review -> Approved`
- `Approved -> Published`

SPEC-003 remains authoritative for:

- `Draft -> Submitted`

Invalid transitions must be rejected.

Examples that must fail:

- `Submitted -> Approved`;
- `Submitted -> Published`;
- `Changes Requested -> Approved`;
- `Changes Requested -> Published`;
- `Resubmitted -> Approved`;
- `Under Review -> Published`;
- Contributor-driven Approved;
- Contributor-driven Published.

Lifecycle status remains the governed revision’s authoritative workflow state.

Do not introduce a second workflow-status authority.

---

## 6. Starting Review

Moving a revision from Submitted or Resubmitted to Under Review requires an explicit Admin action.

Opening or viewing a review page must not mutate lifecycle state.

Examples of acceptable UI actions include:

- `Iniciar revisión`;
- equivalent explicit Admin review action.

The transition must:

- verify live Admin authority;
- lock the target revision;
- verify its current status;
- persist lifecycle evidence;
- remain safe under concurrent review attempts.

Multiple Admins may have visibility, but SPEC-004 does not introduce reviewer assignment or ownership of a review.

---

## 7. Admin Review Visibility

SPEC-004 introduces cross-user pending visibility for eligible Admins only.

An eligible Admin may read pending governed revisions required for review when status is:

- Submitted;
- Under Review;
- Changes Requested;
- Resubmitted;
- Approved.

Admin review access may include:

- stable identity;
- typed revision;
- revision-scoped relationships;
- attachments;
- contributor identity;
- contributor organization;
- lifecycle evidence required for governance;
- review comments.

Ordinary Contributors must not gain cross-user pending visibility.

Admin review visibility must not widen ordinary published-reader RPCs or library/search surfaces.

---

## 8. Review Queue

Provide an Admin-only review queue for pending contributions.

At minimum, queue entries should expose information equivalent to:

- content type;
- title/name;
- contributor;
- contributor organization;
- current workflow status;
- submission/resubmission time;
- link to review detail.

The queue must be authorized at the server/data boundary.

It must not rely on hidden navigation or client-side role checks.

Exact filtering, ordering, pagination, and layout remain implementation freedom.

---

## 9. Review Detail

The Admin review surface must allow an authorized Admin to inspect the submitted revision in sufficient context to make a governance decision.

Where applicable, the review view must include:

- semantic content fields;
- relationships;
- attachments;
- contributor attribution;
- contributor organization;
- current lifecycle status;
- review notes;
- relevant lifecycle timestamps.

Pending relationships and attachments must remain governed by their existing authorization model.

Email/direct links may route to this surface but must still pass normal authentication and Admin authorization.

---

## 10. Review Comments

SPEC-004 uses revision-level review comments.

For the MVP, review comments are:

- associated with one governed revision;
- authored by an authenticated Admin;
- timestamped;
- append-oriented;
- preserved across resubmission;
- readable by the revision owner;
- readable by authorized Admins.

The MVP does not require:

- threads;
- replies;
- field-level anchors;
- comment resolution workflows;
- rich-text collaboration;
- per-comment assignment.

Requesting changes must include at least one meaningful review note describing the required adjustment.

Ordinary users must not be able to forge, edit destructively, or delete Admin review attribution/history.

Review comments and lifecycle events preserve governance evidence, but SPEC-004 does not require immutable snapshots of revision contents at each review cycle. The same physical revision may change while in Changes Requested. Historical content snapshots and arbitrary reconstruction of every prior review-state payload are outside the MVP scope.

---

## 11. Changes Requested

An Admin reviewing a revision in Under Review may request changes.

The operation must:

1. verify live Admin authority;
2. lock the revision;
3. require meaningful review feedback;
4. persist the review comment/note;
5. transition `Under Review -> Changes Requested`;
6. persist lifecycle evidence;
7. trigger the required Contributor notification.

After Changes Requested, the owner Contributor may again edit the same physical revision.

This is a deliberate exception to the SPEC-003 Submitted immutability rule.

The implementation must reconcile the SPEC-003 mutation guards accordingly.

---

## 12. Editing After Changes Requested

A caller-owned revision in Changes Requested becomes editable by its original Contributor for the purpose of addressing review feedback.

The Contributor may modify the same categories of data they could modify while Draft:

- semantic content fields;
- permitted revision relationships;
- permitted private attachments.

The revision remains the same physical revision and retains the same `revision_number`.

SPEC-004 must not create a new revision merely because changes were requested.

Creating a later revision of already-published content belongs to SPEC-005.

During Changes Requested:

- the Contributor may read Admin review feedback;
- the Contributor may edit their own revision;
- the Contributor may not approve;
- the Contributor may not publish;
- another Contributor may not edit it;
- review/audit evidence must remain preserved.

---

## 13. Resubmission

After making required changes, the owner Contributor may explicitly resubmit.

The transition is:

`Changes Requested -> Resubmitted`

Resubmission must:

- validate live eligibility;
- validate ownership;
- re-run complete structural submission validation;
- verify relationships;
- verify attachments;
- persist lifecycle evidence;
- record trusted submission/resubmission timing;
- trigger an Admin notification.

After Resubmitted, Contributor mutation stops again.

An explicit Admin action then moves:

`Resubmitted -> Under Review`

Resubmission itself must not automatically grant approval or publication authority.

---

## 14. Approval

An Admin may approve a revision only when:

- status = Under Review;
- the revision satisfies complete structural validation;
- required relationships are valid;
- attachment state is valid;
- publication dependency requirements are satisfied;
- live Admin authority is valid.

Approval transitions:

`Under Review -> Approved`

Approval must be server/data enforced and attributed to the authenticated Admin.

Approval does not publish.

An Approved revision:

- remains unavailable to ordinary published readers;
- remains visible to authorized Admin governance surfaces;
- remains immutable except for the allowed publication action;
- does not update the stable identity’s `current_published_revision_id`.

---

## 15. Publication Dependency Rule

A revision may become Published only when every dependency required by its published representation resolves to eligible current-published content.

Caller-owned pending dependencies are permitted during Draft/contribution authoring, but must not survive as unresolved dependencies in published content.

Therefore:

- approval should validate publication dependency readiness;
- publication must always revalidate the dependency invariant.

Required dependency rules include:

- Program Topic -> Module dependencies must resolve to a current-published Module;
- Teaching Note -> Module must resolve to a current-published Module;
- Teaching Note -> Program Topic, when present, must resolve to a current-published Program Topic;
- Module relationships to Instructor, Material, and Institution must resolve to current-published identities;
- Teaching Note relationships to Material must resolve to current-published identities.

A revision depending on Draft, Submitted, Under Review, Changes Requested, Resubmitted, or Approved-but-unpublished identities must not be published.

Publication must resolve required dependencies from authoritative current-published pointers under a concurrency strategy that prevents the validated dependency set from becoming stale before commit.

---

## 16. Publication

An Admin may publish only an Approved revision in the external-review path.

Publication transitions:

`Approved -> Published`

Publication must atomically, within the database transaction:

1. verify live Admin authority;
2. lock the revision and stable identity;
3. verify status = Approved;
4. re-run publication validity, resolving required dependencies from authoritative current-published pointers under a concurrency strategy that prevents the validated dependency set from becoming stale before commit;
5. set revision status = Published;
6. set trusted publication timestamp;
7. update the stable identity’s `current_published_revision_id` to this revision;
8. persist lifecycle evidence.

Publication must not expose a state where:

- the revision is Published but the pointer is stale; or
- the pointer references a non-Published revision.

Existing current-published reader RPCs should begin resolving the revision through the existing identity pointer without requiring a second reader architecture.

---

## 17. Published Reader Boundary

SPEC-004 must preserve the existing current-published reader contract.

Before publication, revisions in:

- Submitted;
- Under Review;
- Changes Requested;
- Resubmitted;
- Approved

must remain absent from ordinary:

- library;
- search;
- filters;
- references;
- Grilla;
- Programa;
- direct published-detail readers;
- autocomplete/preload payloads intended for ordinary readers.

After successful publication, the newly Published revision becomes visible through the existing current-published reader surfaces.

Do not add separate reader queries that bypass the stable identity’s current-published pointer.

---

## 18. Admin Direct Publication

An eligible Admin may create and directly publish new Democracia+ content without requiring a second Admin review.

This path applies only to content authored by an eligible Admin acting under a Democracia+ organization context.

Direct publication must still:

- create governed stable identity + typed revision;
- derive actor/organization from trusted live access;
- validate complete content structure;
- validate relationships;
- validate attachments;
- require all published dependencies to already be current-published;
- set trusted publication metadata;
- update the current-published pointer atomically;
- persist lifecycle events.

Direct Admin publication is a separate bounded lifecycle operation for newly Admin-authored Democracia+ content. It may atomically create a Draft revision and promote it directly to Published after full publication validation.

This does not imply that `Draft -> Published` is a generally valid lifecycle transition and must not expose that transition through generic workflow operations.

Direct publication must not provide a generic “force status” capability.

It must not permit arbitrary transitions on:

- another contributor’s revision;
- external Submitted content;
- revisions already governed by the external review workflow.

Implementation may model this as:

- a dedicated direct-publish operation; or
- an Admin-specific bounded creation/publication flow.

Do not weaken the external review workflow to implement this capability.

---

## 19. Workflow Metadata and Lifecycle Events

SPEC-004 extends the append-oriented lifecycle-event foundation.

At minimum represent events equivalent to:

- `review_started`;
- `changes_requested`;
- `content_resubmitted`;
- `content_approved`;
- `content_published`.

Events must derive trusted actor and organization context.

Event metadata should preserve, as applicable:

- content type;
- stable content ID;
- revision ID;
- actor user;
- actor organization;
- action;
- previous status;
- resulting status;
- timestamp.

The implementation must also preserve enough durable information to identify:

- reviewer;
- review time;
- review outcome;
- approver;
- approval time;
- publisher;
- publication time.

The exact distribution between:

- revision metadata;
- review-comment records;
- lifecycle events

is implementation freedom, provided the resulting data is authoritative, attributable, queryable, and not dependent on user-entered actor identity.

Revision status remains the lifecycle authority.

---

## 20. Attachment Behavior Through Review

Private attachment authorization must follow lifecycle authority.

For external contributions:

### Submitted / Under Review

Contributor:

- may read own attachments;
- may not add, replace, or delete.

Admin:

- may read attachments required for review;
- may not mutate contributor attachments merely by reviewing them.

### Changes Requested

Owner Contributor may:

- read;
- add;
- replace;
- delete

permitted attachments while correcting the revision.

Admin may read.

### Resubmitted / Approved

Contributor may read but not mutate.

Admin may read.

### Published

Attachment accessibility must follow the published content’s reader authorization.

Published attachment access must not remain dependent on contributor ownership.

The private bucket remains private.

No public governed-content bucket is introduced.

---

## 21. Notification Routing

Required notifications:

### Submission

Event:

`Draft -> Submitted`

Recipient:

all currently eligible active Admin users.

### Resubmission

Event:

`Changes Requested -> Resubmitted`

Recipient:

all currently eligible active Admin users.

### Changes Requested

Event:

`Under Review -> Changes Requested`

Recipient:

the original Contributor responsible for the revision.

Admin-recipient resolution must derive from the authoritative organization/membership/role model.

Do not hardcode personal email addresses in application code.

Do not create a second parallel Admin allowlist solely for email routing.

Only users whose current access resolves to Admin should receive Admin workflow notifications.

Operational suppression/deduplication/retry strategy remains implementation freedom.

---

## 22. Resend Integration

Resend is the required workflow-email provider.

Email notifications must:

- be sent server-side;
- contain no privileged credentials;
- avoid embedding sensitive content unnecessarily;
- use secure application links;
- preserve Spanish-first product language;
- not act as authorization.

Application access after following an email link must still require:

- authentication;
- current eligibility;
- correct role/ownership for the requested surface.

A forwarded email must not grant access to the linked content.

Email-delivery failure must not silently corrupt lifecycle state.

A successful workflow transition that requires notification must durably record the notification intent as part of, or consistently with, the authoritative workflow operation. Failure or process interruption after lifecycle persistence must not cause the required notification to be silently lost.

Delivery may be synchronous or asynchronous. Retry, outbox, job, delivery-log, suppression, and deduplication design remain implementation freedom.

The lifecycle transition remains authoritative in PostgreSQL; email is a side effect, not the workflow source of truth.

---

## 23. Admin Authorization

All Admin review actions must derive authority from live access state.

Admin authority must fail closed when any of the following is invalid:

- authenticated identity;
- active membership;
- active organization;
- approved email domain;
- persisted Admin role.

Stale JWT/client metadata must not preserve Admin capability.

Contributor requests must not gain review authority by manipulating:

- user IDs;
- organization IDs;
- revision IDs;
- status values;
- reviewer fields;
- approver fields;
- publisher fields;
- request payloads;
- URLs.

---

## 24. Concurrency and Transaction Boundaries

High-risk governance transitions must lock authoritative rows before validating/mutating lifecycle state.

At minimum protect against:

- two Admins starting review simultaneously;
- request-changes racing approval;
- approval racing publication;
- Contributor resubmission racing Admin actions;
- publication racing dependency changes;
- double publication;
- stale role/revocation requests.

Transitions must re-check state after lock acquisition.

Publication must atomically update revision publication state and the stable current-published pointer.

The implementation must use an appropriate locking, isolation, or equivalent database strategy so that publication dependency validation remains valid through transaction commit.

The implementation must not rely only on UI button disabling for concurrency safety.

---

## 25. Product UI

The governance experience is Spanish-first.

Provide surfaces equivalent to:

### Admin

- Revisión de contribuciones;
- pending review queue;
- review detail;
- explicit start-review action;
- review comments;
- request-changes action;
- approve action;
- publish action;
- direct publication flow for authorized Democracia+ Admin content.

### Contributor

Within Mis contribuciones or equivalent:

- current review status;
- review feedback;
- edit behavior when Changes Requested;
- resubmit action;
- read-only behavior while Submitted, Under Review, Resubmitted, Approved;
- Published state after publication.

Exact navigation and route structure remain implementation freedom.

Do not implement SPEC-005 history/archive UI in this slice.

---

## 26. State-Specific Contributor Mutation

Contributor mutation authority is:

### Draft

Editable under SPEC-003 rules.

### Submitted

Read-only.

### Under Review

Read-only.

### Changes Requested

Editable by original owner.

### Resubmitted

Read-only.

### Approved

Read-only.

### Published

Read-only under the new-content workflow.

Editing Published content into a new revision is SPEC-005.

Relationship and attachment mutation guards must follow the same lifecycle distinction.

---

## 27. Security / RLS Contract

SPEC-004 must preserve defense in depth.

Do not implement governance solely through Server Actions or client route guards.

Database/server boundaries must enforce:

- Admin cross-user pending reads;
- Contributor owner-only pending reads;
- Contributor mutation only in Draft / Changes Requested where permitted;
- Admin-only review transitions;
- Admin-only approval;
- Admin-only publication;
- valid state transitions;
- publication dependency rules;
- append-oriented review/audit evidence;
- private attachment access;
- current-published reader isolation.

Avoid generic client-controlled UPDATE authority over revision status.

Prefer narrow workflow operations.

---

## 28. Scope

### In Scope

- Admin review queue;
- Admin cross-user pending visibility;
- direct authenticated review links;
- review detail surface;
- explicit start-review action;
- revision-level review comments;
- request-changes action;
- Contributor review-feedback visibility;
- Contributor editing while Changes Requested;
- resubmission;
- approval;
- publication;
- atomic current-published pointer promotion;
- publication dependency validation;
- Admin direct publication of Democracia+ authored new content;
- workflow lifecycle events;
- Resend notifications;
- Contributor and Admin Spanish UI;
- RLS/authorization updates;
- Storage access reconciliation across review states;
- tests for lifecycle, authority, isolation, notifications, and publication.

### Out of Scope

- editing Published content into Draft Revision v2;
- SPEC-005 published-content revision workflow;
- archival/restoration;
- destructive deletion of published content;
- full audit-history UI;
- arbitrary historical revision browsing;
- separate Reviewer/Approver/Publisher roles;
- review assignment;
- threaded review comments;
- field-level review annotations;
- organization-specific publication scope;
- sensitivity tiers;
- scheduled publication;
- scheduled review;
- notification preferences;
- generic workflow engine;
- immutable snapshots of revision contents at each review cycle.

---

## 29. Impact Surface

Expected impact includes:

- new Supabase migration(s);
- review-comment persistence;
- lifecycle-transition operations;
- SPEC-003 mutation-trigger reconciliation;
- Admin pending-content RLS;
- publication authorization;
- current-published pointer mutation;
- attachment authorization changes by review status;
- lifecycle events;
- durable notification-intent persistence;
- generated database types;
- Admin review queries/actions;
- Contributor correction/resubmission actions;
- Admin UI;
- Contributor review-feedback UI;
- Resend server integration;
- email templates;
- environment/config documentation;
- pgTAP authorization/state-machine tests;
- Vitest notification/action tests;
- Playwright multi-user governance journeys;
- Cloud migration/security verification;
- hosted review/publication validation.

---

## 30. Acceptance Criteria

1. Submitted external contributions enter the Admin review queue without becoming visible to ordinary readers.
2. Only an eligible Admin can access cross-user review detail and governance actions.
3. Viewing a review does not mutate lifecycle state.
4. An Admin can explicitly transition `Submitted -> Under Review`.
5. An Admin can request changes only from Under Review and must record meaningful review feedback.
6. Requesting changes transitions `Under Review -> Changes Requested`.
7. The original Contributor can read the review feedback.
8. The original Contributor can edit their own revision while it is Changes Requested.
9. Another Contributor cannot edit or read that pending revision.
10. The Contributor can resubmit only after the revision passes complete structural validation.
11. Resubmission transitions `Changes Requested -> Resubmitted`.
12. Resubmission triggers the configured Admin-recipient notification.
13. An Admin can explicitly transition `Resubmitted -> Under Review`.
14. An Admin can approve only a valid Under Review revision.
15. Approval transitions `Under Review -> Approved` without publishing.
16. Approved content remains absent from ordinary published-reader/search surfaces.
17. An Admin can publish only an Approved external revision.
18. Publication atomically sets the revision Published and updates the stable identity’s current-published pointer.
19. A revision cannot be published while any required dependency remains unpublished/pending.
20. A Published revision becomes visible through existing authenticated current-published reader surfaces.
21. A Contributor cannot approve or publish through UI, API, RPC, direct data access, or manipulated request state.
22. Invalid lifecycle transitions are rejected at the authoritative data boundary.
23. Review comments remain attributable and preserved across resubmission.
24. Lifecycle events record review, change request, resubmission, approval, and publication with trusted actor/organization attribution and, where applicable, previous/resulting status.
25. Admin workflow authority is revoked on the next request when membership, organization, domain, identity, or Admin role becomes invalid.
26. Submitted/Under Review/Resubmitted/Approved attachments remain immutable to the Contributor while still readable where authorized.
27. Changes Requested restores the owner’s permitted attachment mutation authority.
28. Published attachment access follows published reader authorization rather than contributor ownership.
29. Submission and resubmission notify currently eligible Admin recipients through Resend.
30. Changes Requested notifies the responsible Contributor through Resend.
31. Email links do not bypass authentication or authorization.
32. Notification failure does not become workflow authority, corrupt persisted lifecycle state, or silently lose the durable notification intent.
33. An eligible Democracia+ Admin can create and directly publish new governed content without a second Admin approval.
34. Admin direct publication still performs full content, relationship, dependency, attachment, provenance, event, and publication validation.
35. Direct publication cannot be used to bypass review for another contributor’s external submission.
36. Published library/search/reference/Grilla/Programa surfaces remain current-published only.
37. No Published-v1 -> Draft-v2 authoring behavior is introduced.
38. Governance UI, status labels, review feedback, errors, and notification copy are Spanish-first.
39. Tests cover the full happy path, change-request/resubmission path, direct Admin publication, invalid transitions, Contributor escalation attempts, cross-user isolation, revocation, dependency publication gating, attachment state behavior, notification authorization, and published-reader isolation.
40. Review comments and lifecycle evidence remain durable even though SPEC-004 does not require immutable content snapshots for each review cycle.
41. Publication dependency validation cannot commit using a dependency set that became invalid before transaction commit.
42. Direct Admin publication is available only through its bounded Admin-authored Democracia+ flow and does not create generic `Draft -> Published` transition authority.

---

## 31. Implementation Freedom

Implementation may choose:

- review queue layout;
- review-detail layout;
- exact route structure;
- Server Action/RPC decomposition;
- review-comment table shape;
- review-event metadata shape;
- whether reviewer/approver/publisher metadata is stored directly on revisions or derived from authoritative workflow records/events;
- email-template implementation;
- notification retry/logging/outbox/job mechanism;
- concurrency mechanism used to keep dependency validation valid through publication commit;
- transaction boundaries beyond the minimum required invariants;
- test-fixture design.

Implementation must not:

- introduce a second lifecycle authority;
- make page views mutate workflow state;
- make approval equivalent to publication for external contributions;
- permit publication with pending dependencies;
- weaken current-published isolation;
- broaden Contributor review/publication authority;
- introduce SPEC-005 published-content revision authoring;
- use email possession as authorization;
- implement a generic status-update endpoint;
- interpret Admin direct publication as generic `Draft -> Published` transition authority;
- require immutable per-review content snapshots unless a later product decision introduces them.

---

## 32. Knowledge Updates Required

After verified implementation:

- reconcile actual workflow persistence with `docs/CONTENT_MODEL.md`;
- reconcile lifecycle behavior with `docs/GOVERNANCE.md`;
- reconcile Admin/pending authorization and publication controls with `docs/SECURITY.md`;
- update `docs/ARCHITECTURE.md` with:
  - review workflow;
  - lifecycle operations;
  - publication transaction;
  - Admin pending-read model;
  - notification architecture;
  - durable notification-intent behavior;
  - failure handling;
- update `docs/DECISIONS.md` only if implementation discovers a genuinely new durable decision;
- update setup/deployment docs for Resend/configuration if needed;
- keep SPEC-004 active through independent verification and Cloud/hosted closure;
- move to completed only after all closure gates pass.

---

## 33. Validation / Closure Gate

SPEC-004 is not complete because local tests pass.

Before closure validate, as applicable:

- local migration replay;
- full database/RLS/grant tests;
- lifecycle transition tests;
- direct-data authorization;
- review-comment integrity;
- Contributor vs Admin boundaries;
- revocation;
- concurrent transition behavior;
- publication atomicity;
- dependency publication gating;
- dependency concurrency behavior through transaction commit;
- attachment authorization by workflow state;
- Resend integration behavior;
- durable notification-intent behavior;
- notification failure behavior;
- secure direct-link behavior;
- production build;
- multi-user browser E2E;
- full external-contribution happy path;
- change-request/resubmission path;
- Admin direct-publication path;
- published-reader isolation before publication;
- reader visibility after publication;
- Supabase Cloud migration dry-run/application;
- Cloud RLS/grant/function verification;
- hosted Admin review;
- hosted Contributor correction/resubmission;
- hosted publication;
- hosted cross-user denial;
- hosted revocation;
- hosted notification delivery;
- documentation reconciliation;
- independent adversarial review.

Do not populate production curriculum with fictional authoritative Published content merely for validation unless the test records are clearly controlled and removed/handled according to the project’s validation policy.

---

## 34. Open Questions / Blockers

No known product blocker remains.

Admin notification routing for the MVP is resolved as:

- currently eligible active Admin users;
- derived from authoritative membership/organization/domain/role state;
- no hardcoded personal recipient list.

The following remain implementation freedom rather than product blockers:

- email retry strategy;
- queue sorting/pagination;
- exact review-comment schema;
- exact workflow-event schema extensions;
- whether explicit reviewer/approver/publisher columns supplement lifecycle events;
- exact Spanish wording/templates;
- UI layout;
- exact durable notification-intent mechanism;
- exact publication dependency concurrency strategy.

Implementation must stop with:

`BLOCKED / DECISION REQUIRED`

if satisfying SPEC-004 requires changing an authoritative contract for:

- Contributor/Admin authority;
- mandatory external review;
- approval vs publication semantics;
- current-published behavior;
- pending-content visibility;
- direct Admin publication;
- relationship semantics;
- published dependency rules;
- revision identity semantics;
- SPEC-004 / SPEC-005 scope boundary.

Reversible technical choices under Implementation Freedom do not require a new product decision.