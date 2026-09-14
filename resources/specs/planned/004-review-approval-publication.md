# SPEC-004 — Admin Content Management & Publication

**Status:** PLANNED  
**Methodology state:** IMPLEMENTATION READY  
**Depends on:** SPEC-003  
**Supersedes:** planned SPEC-004 — Review, Approval & Publication

## 1. Purpose / Objective

Implement the simplified initial governance model for Base Curricular in which Admins are the only actors allowed to create, edit, revise, and publish governed curriculum content.

Authenticated non-Admin users are readers only.

SPEC-004 must provide a complete Admin publication path while preserving the revision-capable persistence, provenance, private attachment architecture, lifecycle-event foundation, and current-published reader isolation already delivered by SPEC-002 and SPEC-003.

The active initial lifecycle is:

`Draft -> Published`

For later changes to already-published content:

`Published v1 -> Draft v2 -> Published v2`

While `v2` is being prepared, ordinary readers continue to resolve `v1`.

The contribution/review lifecycle implemented or prepared by earlier specifications is temporarily inactive as product behavior and is explicitly outside this phase.

---

## 2. Current State

SPEC-002 provides:

- stable governed content identities;
- typed revision tables;
- exactly one current-published revision pointer per identity;
- published-reader isolation;
- revision-scoped relationships;
- current-published library, search, filters, references, Grilla, Programa, and detail readers;
- revision-capable persistence supporting coexistence of a published revision and later unpublished revision.

SPEC-003 provides:

- creation of new governed identities with first typed revisions;
- Draft authoring;
- contributor-user provenance;
- contributor-organization provenance;
- Draft ownership;
- private Teaching Note and Material attachments;
- revision-scoped pending relationships;
- lifecycle-event persistence;
- `Draft -> Submitted`;
- Submitted immutability;
- owner-only pending visibility;
- published-reader isolation.

SPEC-003 has been completed and verified.

Its implementation remains valid repository history and persistence capability.

However, the active product contract has changed before implementation of the previous SPEC-004 review workflow.

The initial operational phase now restricts governed-content mutation and publication to Admins.

Non-Admin authenticated users must have read-only access to published curriculum content.

The following previously planned workflow is therefore deferred:

`Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

No implementation should destructively remove SPEC-003 persistence solely because this workflow is temporarily inactive.

---

## 3. Problem / Gap

The existing implementation has the technical foundation for contribution but does not yet provide the simplified Admin content-management workflow now required for the initial operational phase.

The product needs:

- an Admin-only content-management surface;
- Admin creation of governed content;
- Admin editing of unpublished Drafts;
- Admin publication;
- Admin creation of later revisions from already-published content;
- safe replacement of the current-published revision;
- read-only published-content access for non-Admin users;
- Admin attachment management;
- publication lifecycle evidence.

The product does not currently need:

- Contributor authoring;
- submission;
- review queues;
- review comments;
- change requests;
- resubmission;
- approval;
- workflow email notifications.

Implementing those workflows now would introduce operational and product complexity that is intentionally deferred.

---

## 4. Authoritative Decision

For the initial operational phase:

### Admin

An eligible Admin may:

- create governed curriculum content;
- edit Admin-managed Drafts;
- manage permitted Draft relationships;
- manage private attachments;
- publish valid Drafts;
- create later Draft revisions from published content;
- edit those later Draft revisions;
- publish those later revisions;
- access lifecycle information required for content administration.

### Non-Admin authenticated user

An eligible non-Admin user may:

- browse published content;
- search published content;
- use published-content filters;
- open published content;
- access published attachments they are authorized to read;
- use other reader capabilities built on published content.

A non-Admin user must not:

- create governed content;
- edit governed content;
- create governed revisions;
- submit content;
- review content;
- request changes;
- approve content;
- publish content;
- mutate governed attachments;
- access unpublished Admin Drafts.

These authority boundaries must be enforced at the server/data boundary.

Hidden UI controls are not sufficient authorization.

---

## 5. Temporary Governance Simplification

The following capabilities are deferred from the active product contract:

- external/user contribution authoring;
- `Draft -> Submitted`;
- Admin review queue;
- `Submitted -> Under Review`;
- review comments;
- `Under Review -> Changes Requested`;
- Contributor editing after changes requested;
- `Changes Requested -> Resubmitted`;
- approval;
- `Under Review -> Approved`;
- `Approved -> Published`;
- submission notifications;
- resubmission notifications;
- change-request notifications.

Existing database structures, enums, functions, event history, provenance fields, or other implementation delivered by SPEC-003 should not be removed merely because these capabilities are inactive.

Where previously exposed contribution UI or mutation paths conflict with the new active authority model, they must become inaccessible to non-Admin users.

The implementation should prefer disabling/restricting obsolete product paths over destructive schema rollback.

Future reactivation of collaborative contribution requires a new explicit product decision/specification.

---

## 6. Active Lifecycle

### New content

The active Admin lifecycle is:

`Draft -> Published`

A Draft:

- belongs to a stable governed content identity;
- has a typed revision;
- is visible only through authorized Admin management surfaces;
- may be edited by authorized Admins;
- may have Draft relationships;
- may have permitted private attachments;
- is invisible to ordinary readers.

Publication promotes the valid Draft revision to Published and makes it the stable identity's current published revision.

### Existing published content

Published content must never be edited destructively in place.

Editing current published content uses:

`Published v1 -> Draft v2 -> Published v2`

During Draft v2:

- `v1` remains Published;
- `v1` remains the stable identity's `current_published_revision_id`;
- ordinary users continue to see `v1`;
- `v2` remains Admin-only;
- changes to `v2` do not alter the reader representation of `v1`.

When `v2` is successfully published:

- `v2` becomes Published;
- the stable identity's current-published pointer moves atomically to `v2`;
- `v1` remains preserved as historical content.

The implementation must not mutate `v1` to create the appearance of revisioning.

---

## 7. Admin Content Management Surface

Provide an Admin-only content-management experience.

It must support management of the governed types already established by the content model:

- Module;
- Program Topic;
- Instructor;
- Teaching Note;
- Material / Study;
- Institution / Reference Center.

The Admin surface must allow an authorized Admin to distinguish at least:

- published content;
- Admin Drafts;
- content with a newer Draft revision.

Exact navigation, filtering, ordering, pagination, grouping, and visual presentation remain implementation freedom.

Access to Admin content-management data must be server/data authorized.

A non-Admin caller must not gain Draft visibility by calling the underlying API/RPC directly.

---

## 8. Admin Creation of New Content

An eligible Admin may create new governed content.

Creation must:

1. verify live Admin authority;
2. create or use the established stable identity;
3. create the first typed revision as Draft;
4. derive actor and organization from trusted authenticated access;
5. persist appropriate provenance;
6. preserve lifecycle evidence;
7. return only data the Admin is authorized to access.

Admin identity and organization must not be accepted as authoritative user-entered mutation fields.

The creation flow should reuse the existing governed identity/revision architecture rather than introduce a parallel Admin content model.

---

## 9. Admin Draft Editing

An authorized Admin may edit an unpublished Admin-managed Draft.

Editable state may include, where applicable:

- semantic content fields;
- revision-scoped relationships;
- permitted private attachments.

Draft editing must preserve:

- stable identity;
- revision identity;
- revision number;
- trusted provenance;
- published-reader isolation.

Ordinary users must not read or mutate the Draft.

Published revisions remain immutable.

---

## 10. Creating a Draft Revision from Published Content

An eligible Admin may begin editing existing published content.

This operation must create a later Draft revision under the same stable content identity.

For example:

`Module identity A`
- revision 1 — Published — current
- revision 2 — Draft — Admin-only

The new Draft should begin from the current published semantic state sufficiently to allow the Admin to edit the existing content rather than recreate it manually.

Where applicable, revision-scoped relationships must also be copied or initialized consistently from the current published revision.

Creating Draft v2 must not:

- change the current-published pointer;
- change v1;
- remove v1 from reader surfaces;
- expose v2 to ordinary readers.

The implementation must prevent ambiguous competing editable Draft revisions for the same stable identity unless a later product decision explicitly allows them.

The simplest valid contract is at most one active Admin Draft successor per governed identity.

---

## 11. Publication Validation

A Draft may become Published only when it satisfies the complete structural rules for its governed content type.

Publication validation must include, where applicable:

- required semantic fields;
- valid URLs;
- valid relationships;
- required Teaching Note source rules;
- attachment readiness;
- relationship compatibility;
- publication dependency readiness.

A revision may become Published only when every dependency required by its published representation resolves to eligible current-published content.

Required dependency rules include:

- Program Topic -> Module resolves to a current-published Module;
- Teaching Note -> Module resolves to a current-published Module;
- Teaching Note -> Program Topic, when present, resolves to a current-published Program Topic;
- Module relationships to Instructor, Material, and Institution resolve to current-published identities;
- Teaching Note relationships to Material resolve to current-published identities.

A Draft depending on another unpublished Draft must not become Published until the required dependency is itself current-published.

Publication must revalidate dependencies against authoritative current-published pointers.

---

## 12. Publication Operation

Only an eligible Admin may publish.

For a valid Draft, publication must atomically:

1. verify live Admin authority;
2. lock or otherwise concurrency-protect the target revision and stable identity;
3. verify that the target revision is the eligible Draft for that identity;
4. validate the complete publication invariant;
5. validate required dependencies from authoritative current-published pointers;
6. set the target revision status to Published;
7. set trusted publication metadata;
8. update the stable identity's `current_published_revision_id`;
9. persist lifecycle evidence.

The operation must not expose an intermediate state where:

- a revision is Published but the current pointer incorrectly resolves another revision due to a partial operation; or
- the current pointer references a non-Published revision.

Publication authority must not be implemented as a generic client-controlled status mutation.

There must be no general-purpose "force status" capability available to ordinary application callers.

---

## 13. Published Reader Boundary

The existing current-published reader architecture remains authoritative.

Ordinary eligible users resolve only current published content.

Admin Drafts must remain absent from ordinary:

- library;
- search;
- filters;
- references;
- Grilla;
- Programa;
- published detail routes;
- autocomplete;
- preload payloads;
- exports or other reader-oriented surfaces.

For an identity with:

- Published v1;
- Draft v2;

ordinary readers must receive v1.

After successful publication of v2, ordinary readers must receive v2 through the existing current-published pointer.

Do not create a second reader architecture for Admin-published content.

---

## 14. Non-Admin Read-Only Boundary

An eligible non-Admin authenticated user is a reader of governed curriculum content.

At the data boundary, non-Admin users must not be able to:

- insert governed identities;
- insert governed revisions;
- mutate governed revisions;
- create later revisions;
- mutate revision relationships;
- create or mutate governed attachments;
- change lifecycle status;
- change current-published pointers;
- publish;
- access Admin-only Draft payloads.

This applies even if legacy SPEC-003 contribution routes, RPC names, database functions, or UI code still physically exist.

The active authorization contract must win over obsolete product exposure.

The implementation must include adversarial tests demonstrating that non-Admin users cannot invoke legacy mutation paths to bypass this rule.

---

## 15. Attachment Behavior

The existing private `governed-attachments` architecture remains.

For an Admin Draft, an eligible Admin may, where supported by the governed content type:

- reserve/upload an attachment;
- read it;
- replace it;
- delete it.

Attachment mutation must remain tied to authorization over the associated Draft revision.

For published content:

- attachment accessibility follows published reader authorization;
- ordinary eligible users may access attachments associated with content they are authorized to read;
- bucket privacy remains enforced;
- published attachment access must not depend on original Draft ownership.

A non-Admin user must not upload, replace, or delete governed attachments.

---

## 16. Provenance

Existing provenance must be preserved.

For Admin-created or Admin-revised content, trusted metadata should preserve, where applicable:

- creator;
- creator organization;
- revision creator;
- revision organization context;
- publication actor;
- publication time.

Historical contributor provenance created under SPEC-003 must not be rewritten merely because contribution is now inactive.

A later Admin revision of historically contributed content must preserve the earlier historical attribution.

---

## 17. Lifecycle Events

Continue using the append-oriented lifecycle-event foundation.

The active Admin workflow must represent significant events equivalent to:

- `content_created`;
- `revision_created`;
- `revision_edited`;
- `content_published`.

Existing historical events such as:

- `content_submitted`

remain valid history and must not be deleted or rewritten.

Future review-related event types may remain structurally available but are not active requirements.

Lifecycle events must derive actor and organization from trusted authenticated context.

Event metadata should preserve, as applicable:

- content type;
- stable content ID;
- revision ID;
- actor;
- actor organization;
- action;
- previous status;
- resulting status;
- timestamp.

---

## 18. Notifications

Workflow email notifications are not part of this phase.

SPEC-004 does not require:

- submission email;
- resubmission email;
- changes-request email;
- approval email;
- publication email.

Resend may remain an approved infrastructure option, but no governance-email implementation is required by this specification.

No notification infrastructure should be introduced solely to satisfy superseded review-workflow requirements.

---

## 19. Existing SPEC-003 Data and Capabilities

SPEC-003 remains completed historical implementation evidence.

SPEC-004 must not rewrite its completion record to imply that its original scope was never implemented.

However, current product behavior changes.

If the production database contains existing non-Admin:

- Draft revisions;
- Submitted revisions;
- attachments;
- lifecycle events;

the implementation must not silently destroy them.

Before implementation completion, repository/database inspection must determine whether such real records exist in the intended Cloud environment.

If they exist, the implementation must preserve them in a safe non-reader-visible state unless an explicit migration/operational decision authorizes another treatment.

They must not automatically become Published.

No historical Submitted contribution may bypass the new Admin-only publication contract merely because the previous review workflow was deferred.

---

## 20. Security and Authorization

Authorization must derive from the existing live access model:

`authenticated identity -> approved institutional domain -> active membership -> active organization -> persisted role`

Admin authority must come from the persisted live role.

The implementation must not trust:

- client-provided role;
- JWT role metadata as product authority;
- OAuth profile metadata;
- hidden UI;
- route visibility;
- user-provided organization or actor IDs.

Revoking Admin role must remove Admin content-management authority on the next authoritative data request according to the existing live-access model.

Ordinary users must retain their existing network-wide access to current published content.

---

## 21. Concurrency and Integrity

Publication and revision creation must preserve data integrity under concurrent actions.

At minimum:

- duplicate successor Draft creation must not create ambiguous active editing state;
- concurrent publication attempts must not corrupt the current-published pointer;
- dependency validation must not knowingly publish against stale dependency state;
- current-published pointer integrity must remain enforced;
- published revision immutability must remain enforced.

Exact locking, transaction, RPC, constraint, or serialization mechanisms remain implementation freedom.

---

## 22. UX Language

Spanish remains the primary product language.

Admin content-management UI must use Spanish user-facing copy.

Examples of acceptable concepts include:

- `Administrar contenido`;
- `Crear contenido`;
- `Borrador`;
- `Editar`;
- `Publicar`;
- `Crear nueva versión`.

Exact copy and layout remain implementation freedom provided the workflow is understandable and does not expose inactive review concepts as current behavior.

Non-Admin navigation must not advertise contribution or editorial actions that the user cannot perform.

---

## 23. Scope

### In Scope

- Admin-only governed-content management;
- Admin creation of new content;
- Admin Draft editing;
- Admin Draft relationship management;
- Admin private attachment management;
- direct Admin publication;
- creation of Draft revisions from published content;
- `Published v1 -> Draft v2 -> Published v2`;
- preservation of current-published content during Draft editing;
- atomic current-published promotion;
- publication validation;
- publication dependency validation;
- publication lifecycle events;
- read-only governed-content behavior for non-Admin users;
- restriction of legacy Contributor mutation paths;
- preservation of SPEC-003 historical data and provenance;
- Spanish Admin UX;
- authorization and adversarial tests.

### Out of Scope

- user/Contributor content creation;
- user/Contributor Draft editing;
- submission;
- resubmission;
- review queue;
- review assignment;
- review comments;
- changes requested;
- approval;
- second-Admin approval;
- workflow notifications;
- trusted-partner contribution;
- multiple governance roles;
- scheduled publication;
- publication scopes;
- content sensitivity tiers;
- bulk content management;
- collaborative editing;
- destructive deletion of published content;
- archival/restoration, except where separately owned by SPEC-005;
- personal itinerary.

---

## 24. Impact Surface

Expected implementation impact includes:

### Authorization

- Contributor/non-Admin mutation access delivered by SPEC-003;
- Admin mutation authorization;
- RLS;
- RPC/function grants;
- server actions and route handlers.

### Persistence

- later revision creation;
- publication transition;
- current-published pointer promotion;
- lifecycle events;
- potentially existing contribution functions that require tightened authorization.

### UI

- Admin content-management navigation;
- Admin content list;
- create/edit flows;
- publication action;
- revision editing;
- removal/hiding of Contributor authoring surfaces for non-Admins.

### Attachments

- Admin Draft attachment operations;
- published attachment reader access.

### Reader surfaces

Existing reader semantics should remain unchanged except that newly Admin-published content becomes available through them.

### Documentation

- product decisions;
- governance;
- security;
- content model;
- architecture after implementation verification;
- SPEC-005 alignment.

---

## 25. Acceptance Criteria

1. An eligible Admin can create a new governed content Draft.

2. A non-Admin authenticated user cannot create governed content through UI or direct server/data calls.

3. An eligible Admin can edit an unpublished Admin Draft.

4. A non-Admin user cannot read an Admin Draft through ordinary reader queries or direct unauthorized access.

5. An eligible Admin can manage permitted relationships for an Admin Draft.

6. An eligible Admin can manage permitted private attachments for supported Draft content types.

7. A non-Admin user cannot create, replace, or delete governed attachments.

8. An Admin can publish a structurally valid new Draft.

9. Invalid Drafts cannot be published.

10. Publication requires live Admin authority at the authoritative server/data boundary.

11. Publication atomically sets the revision Published and makes it the identity's current published revision.

12. Newly published content becomes visible through the existing current-published reader surfaces.

13. Admin Draft content does not leak through library, search, filters, references, Grilla, Programa, detail readers, autocomplete, preload, or equivalent ordinary reader surfaces.

14. An eligible Admin can create a new Draft revision from current published content.

15. Creating Draft v2 does not mutate Published v1.

16. Published v1 remains the current reader-visible revision while Draft v2 exists.

17. The system prevents ambiguous competing active Admin Draft successors for the same identity.

18. Publishing Draft v2 makes v2 the new current published revision atomically.

19. Published v1 remains preserved after v2 publication.

20. Publication rejects dependencies that do not resolve to eligible current-published content.

21. Existing SPEC-003 historical provenance and lifecycle evidence are not destructively rewritten.

22. Existing legacy Contributor mutation paths cannot be used by a non-Admin user after this specification is implemented.

23. Revoking Admin authority removes content-management/publication authority according to the existing live-access model.

24. Published attachments remain private at the storage boundary and accessible only according to associated published-content authorization.

25. Lifecycle events record trusted actor, target, action, status, and time information sufficient for the active workflow.

26. No review, approval, change-request, resubmission, or workflow-email capability is required for completion.

27. Spanish is used for the Admin content-management user experience.

28. Tests cover Admin creation, editing, revision creation, publication, dependency validation, reader isolation, attachment authorization, non-Admin mutation denial, current-published stability, publication promotion, concurrency-sensitive integrity, and live role revocation.

29. Cloud verification confirms the intended RLS/grant/function/storage authorization posture after migration.

30. Hosted validation confirms at least:
    - Admin content creation/editing/publication;
    - non-Admin published-content reading;
    - non-Admin authoring denial;
    - current-published stability during later Draft editing.

---

## 26. Implementation Freedom

Implementation may choose:

- Admin route structure;
- component composition;
- exact Admin list/detail UX;
- pagination/filtering;
- server action versus Route Handler composition;
- database function naming;
- locking/concurrency mechanism;
- how published semantic state is copied into a later Draft;
- exact lifecycle-event payload shape;
- how inactive legacy contribution UI/code is isolated or removed.

Implementation may not silently change:

- Admin-only mutation authority;
- non-Admin read-only authority;
- published revision immutability;
- stable identity semantics;
- current-published reader isolation;
- Draft isolation;
- historical provenance;
- private attachment boundary;
- publication dependency requirements;
- revision-based editing.

If implementation discovers a constraint requiring any of those contracts to change, return:

`BLOCKED / DECISION REQUIRED`

---

## 27. Knowledge Updates Required

Before closure, reconcile verified current state with:

- `docs/DECISIONS.md`;
- `docs/GOVERNANCE.md`;
- `docs/SECURITY.md`;
- `docs/CONTENT_MODEL.md`;
- `docs/ARCHITECTURE.md`;
- `README.md` where workflow/role behavior is described;
- `resources/specs/README.md`;
- SPEC-005.

Do not rewrite completed SPEC-003 as though its original implementation never existed.

After verified implementation, move SPEC-004 according to the repository lifecycle convention.

---

## 28. Open Questions / Blockers

No known product blocker.

Technical preflight must verify whether real non-Admin Draft/Submitted records exist in Supabase Cloud before choosing any migration treatment for legacy pending content.

Their existence does not block implementation, but their treatment must be preservation-first and must not silently publish or destroy them.

---

## Future Vision Appendix — Collaborative Contribution Governance

The following workflow remains a possible future product capability but is not active product behavior:

`Contributor Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

Possible future capabilities include:

- partner contributions;
- review queue;
- review comments;
- changes requested;
- resubmission;
- approval;
- governance notifications;
- trusted organizations;
- multiple reviewer roles;
- differentiated publication authority.

Existing SPEC-003 architecture intentionally preserves useful foundations for this future direction.

Reactivating collaborative contribution requires an explicit product decision and a new or revised implementation specification.

It must not be inferred merely because dormant database states or code paths exist.