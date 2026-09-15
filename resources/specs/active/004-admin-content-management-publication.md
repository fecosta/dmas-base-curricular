# SPEC-004 — Admin Content Management & Publication

**Status:** ACTIVE  
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

Any currently eligible Admin may manage any active Admin Draft. Original creator identity remains provenance and does not create exclusive editing ownership.

The contribution/review lifecycle implemented or prepared by earlier specifications is temporarily inactive as product behavior and is explicitly outside this phase.

---

## 2. Current State

**Local implementation status (2026-09-15):** Phases 1–4 are implemented locally. Phase 4 keeps `governed-attachments` private and authorizes eligible readers only for `Ready` attachments on authoritative current-published Teaching Note and Material revisions. Draft and historical attachments remain isolated, and existing Admin Draft attachment management remains separate. Independent review, Cloud migration application, hosted validation, and SPEC closure remain pending; this specification remains ACTIVE.

SPEC-002 provides:

- stable governed content identities with typed revision tables;
- exactly one current-published revision pointer per identity;
- published-reader isolation;
- revision-scoped relationships;
- current-published library, search, filters, references, Grilla, Programa, and detail readers;
- revision-capable persistence supporting coexistence of a published revision and later unpublished revision.

SPEC-003 provides:

- creation of new governed identities with first typed revisions;
- Draft authoring;
- contributor-user provenance;
- immutable contributor-organization provenance;
- Draft ownership under the historical SPEC-003 model;
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

Non-Admin authenticated users must have read-only access to current published curriculum content.

The active Admin model also supersedes SPEC-003's owner-exclusive pending mutation semantics: Admin Draft management is role-wide across currently eligible Admins.

The following previously planned workflow is deferred:

`Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

No implementation should destructively remove SPEC-003 persistence solely because this workflow is temporarily inactive.

---

## 3. Problem / Gap

The existing implementation has the technical foundation for contribution but does not yet provide the simplified Admin content-management workflow now required for the initial operational phase.

The product needs:

- an Admin-only content-management surface;
- Admin creation of governed content;
- Admin-wide access to active Admin Drafts;
- Admin editing of any active Admin Draft regardless of creator;
- Admin publication;
- Admin creation of later revisions from already-published content;
- safe replacement of the current-published revision;
- read-only published-content access for non-Admin users;
- Admin attachment management;
- published attachment reader access;
- publication lifecycle evidence.

The product does not currently need:

- Contributor authoring;
- owner-exclusive Admin Draft editing;
- submission;
- review queues;
- review comments;
- change requests;
- resubmission;
- approval;
- workflow email notifications.

---

## 4. Authoritative Decision

### Admin

An eligible Admin may:

- create governed curriculum content;
- list and access active Admin Drafts;
- edit any active Admin Draft regardless of who created it;
- manage permitted Draft relationships;
- manage permitted private attachments;
- publish valid Drafts;
- create later Draft revisions from published content;
- edit any active later Draft revision;
- publish those later revisions;
- access lifecycle information required for content administration.

`created_by` and creation-time organization remain immutable provenance. They do not grant exclusive Draft ownership.

Admin authority is determined from the caller's current live persisted role.

### Non-Admin authenticated user

An eligible non-Admin user may:

- browse current published content;
- search current published content;
- use published-content filters;
- open current published content;
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

### Admin Draft authority

Active Admin Drafts are managed at the Admin-role level rather than through exclusive creator ownership.

Any currently eligible Admin may:

- list active Admin Drafts;
- open an active Admin Draft;
- edit its semantic fields;
- manage permitted relationships;
- manage permitted attachments;
- publish the Draft when valid.

The Admin who originally created the Draft does not receive exclusive mutation authority.

`created_by` and `contributor_organization_id` remain immutable provenance and must continue to identify the original creation context.

Admin authority must be re-evaluated from the current live access model on authoritative requests.

An Admin whose role is revoked must lose Draft-management authority even for Drafts they originally created.

### Admin-wide Draft management

Active Admin Drafts are not personal/owner-exclusive records.

Any currently eligible Admin may read and mutate any active Admin Draft through the bounded Admin-management operations.

Original creator and organization values remain immutable provenance.

The implementation must replace or supersede SPEC-003 owner-only authorization wherever that owner boundary would prevent role-wide Admin management.

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

### Legacy submission capability

Submission is inactive during the Admin-only operational phase.

Existing SPEC-003 persistence structures and functions supporting:

`Draft -> Submitted`

may remain physically present for historical/future compatibility.

However, ordinary application roles must not retain an executable active-product path that transitions a Draft to Submitted.

At minimum:

- the application must expose no submission action;
- non-Admin users must not be able to invoke submission directly;
- Admin content management must use `Draft -> Published`, not submission;
- legacy submission capability must not create an alternate lifecycle around the active SPEC-004 contract.

Historical Submitted records, if any exist, remain historical/dormant and must not be automatically published, deleted, or converted without an explicit migration decision.

---

## 6. Active Lifecycle

### New content

The active Admin lifecycle is:

`Draft -> Published`

A Draft:

- belongs to a stable governed content identity;
- has a typed revision;
- is visible only through authorized Admin management surfaces;
- may be edited by any currently eligible Admin;
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
- any currently eligible Admin may continue editing `v2`;
- changes to `v2` do not alter the reader representation of `v1`.

When `v2` is successfully published:

- `v2` becomes Published;
- the stable identity's current-published pointer moves atomically to `v2`;
- `v1` remains preserved as historical content.

The implementation must not mutate `v1` to create the appearance of revisioning.

---

## 7. Admin Content Management Surface

Provide an Admin-only content-management experience.

It must support management of:

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

All currently eligible Admins must see the relevant Admin-managed Draft set; the list must not be limited to Drafts created by the current Admin.

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

The creator's identity and organization remain provenance after creation. They must not become an exclusive edit-authorization boundary.

Admin identity and organization must not be accepted as authoritative user-entered mutation fields.

The creation flow should reuse the existing governed identity/revision architecture rather than introduce a parallel Admin content model.

---

## 9. Admin Draft Editing

Any currently eligible Admin may edit an unpublished Admin-managed Draft.

Editing authorization must not require `created_by` to equal the current Admin.

Editable state may include, where applicable:

- semantic content fields;
- revision-scoped relationships;
- permitted private attachments.

Draft editing must preserve:

- stable identity;
- revision identity;
- revision number;
- original creator provenance;
- original creation-time organization provenance;
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

The new Draft must begin from the current published semantic state sufficiently to allow an Admin to edit the existing content rather than recreate it manually.

Where applicable, revision-scoped relationships must be copied or initialized consistently from the current published revision.

Creating Draft v2 must not:

- change the current-published pointer;
- change v1;
- remove v1 from reader surfaces;
- expose v2 to ordinary readers.

Any currently eligible Admin may continue editing the resulting successor Draft.

The implementation must prevent ambiguous competing editable Draft revisions for the same stable identity unless a later product decision explicitly allows them.

The active contract is at most one active Admin Draft successor per governed identity.

### Successor revision initialization

When an Admin creates a Draft successor from current published content:

`Published v1 -> Draft v2`

the implementation must initialize `v2` from the current published semantic state.

Where applicable, this includes:

- semantic revision fields;
- revision-scoped Module relationships;
- revision-scoped Teaching Note relationships.

Creating `v2` must not:

- mutate `v1`;
- change the current-published pointer;
- make `v2` visible to ordinary readers.

### Successor attachments

Existing attachment bytes and attachment metadata belonging to `Published v1` are not automatically copied into `Draft v2` during SPEC-004.

Published attachments remain immutable historical members of their original revision.

The Admin may add the attachments that should belong to `v2` while it remains Draft.

If a content type requires an attachment or another valid source to satisfy publication validation, `v2` must independently satisfy that requirement before publication.

Automatic Storage-byte copying, attachment sharing across revisions, and attachment deduplication are outside SPEC-004 unless separately authorized.

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

Submission validation semantics must not be treated as sufficient publication dependency validation where SPEC-003 permitted pending dependencies.

---

## 12. Publication Operation

Only an eligible Admin may publish.

For a valid Draft, publication must atomically:

1. verify live Admin authority;
2. lock or otherwise concurrency-protect the target revision and stable identity;
3. verify that the target revision is the eligible active Draft for that identity;
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

For an Admin Draft, any currently eligible Admin may, where supported by the governed content type:

- reserve/upload an attachment;
- read it;
- replace it;
- delete it.

Attachment mutation authority follows current Admin role over the associated active Draft, not original attachment/Draft creator ownership.

For published content:

- attachment accessibility follows current-published reader authorization;
- ordinary eligible users may access attachments associated with content they are authorized to read;
- bucket privacy remains enforced;
- published attachment access must not depend on original Draft ownership.

A non-Admin user must not upload, replace, or delete governed attachments.

---

## 16. Provenance

Existing provenance must be preserved.

For Admin-created or Admin-revised content, trusted metadata should preserve, where applicable:

- original creator;
- original creator organization;
- revision creator;
- revision organization context;
- lifecycle actors;
- publication actor;
- publication time.

Historical contributor provenance created under SPEC-003 must not be rewritten merely because contribution is now inactive.

A later Admin revision of historically contributed content must preserve earlier historical attribution.

Provenance does not confer exclusive Admin mutation rights over an active Admin Draft.

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

When multiple Admins work on the same Draft, lifecycle attribution must identify the actual actor for each significant event while preserving original creation provenance separately.

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

Historical creator ownership must not automatically convert a former non-Admin creator into an authorized current editor.

---

## 20. Security and Authorization

Authorization must derive from the existing live access model:

`authenticated identity -> approved institutional domain -> active membership -> active organization -> persisted role`

Admin authority must come from the persisted live role.

Admin Draft mutation authority is role-wide: any currently eligible Admin may manage any active Admin Draft.

The implementation must not trust:

- `created_by` as an exclusive authorization boundary between Admins;
- client-provided role;
- JWT role metadata as product authority;
- OAuth profile metadata;
- hidden UI;
- route visibility;
- user-provided organization or actor IDs.

Revoking Admin role must remove Admin content-management authority on the next authoritative data request, including for Drafts the user originally created.

Ordinary users must retain their existing network-wide access to current published content.

---

## 21. Concurrency and Integrity

Publication and revision creation must preserve data integrity under concurrent actions.

At minimum:

- duplicate successor Draft creation must not create ambiguous active editing state;
- concurrent Admin edits must not silently violate stable identity/revision invariants;
- concurrent publication attempts must not corrupt the current-published pointer;
- dependency validation must not knowingly publish against stale dependency state;
- current-published pointer integrity must remain enforced;
- published revision immutability must remain enforced.

Exact locking, transaction, RPC, constraint, optimistic-concurrency, or serialization mechanisms remain implementation freedom as long as the observable contracts above hold.

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

The UI must not imply that Drafts are personal to the creating Admin.

---

## 23. Scope

### In Scope

- Admin-only governed-content management;
- Admin creation of new content;
- Admin-wide active Draft visibility;
- Admin editing of any active Admin Draft regardless of original creator;
- Admin Draft relationship management;
- Admin private attachment management;
- direct Admin publication;
- creation of Draft revisions from published content;
- `Published v1 -> Draft v2 -> Published v2`;
- semantic/relationship initialization of successor Drafts;
- no automatic attachment copying to successor Drafts;
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
- owner-exclusive Admin Drafts;
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
- real-time collaborative editing;
- automatic Storage-byte copying across revisions;
- attachment deduplication across revisions;
- destructive deletion of published content;
- archival/restoration, except where separately owned by SPEC-005;
- personal itinerary.

---

## 24. Impact Surface

### Authorization

- Contributor/non-Admin mutation access delivered by SPEC-003;
- Admin-wide pending-content authorization;
- removal of creator-exclusive Admin Draft semantics;
- RLS;
- RPC/function grants;
- server actions and route handlers.

### Persistence

- later revision creation;
- publication transition;
- current-published pointer promotion;
- lifecycle events;
- existing contribution functions requiring tightened/replaced authorization;
- active-Draft uniqueness/concurrency.

### UI

- Admin content-management navigation;
- Admin content list;
- create/edit flows;
- publication action;
- revision editing;
- cross-Admin Draft access;
- removal/hiding of Contributor authoring surfaces for non-Admins.

### Attachments

- Admin-wide Draft attachment operations;
- published attachment reader access;
- successor Draft attachment behavior.

### Reader surfaces

Existing reader semantics remain unchanged except that newly Admin-published content becomes available through them.

### Documentation

- governance/security clarification of Admin-wide Draft authority;
- content model;
- architecture;
- README;
- specification index;
- SPEC-005 alignment.

---

## 25. Acceptance Criteria

1. An eligible Admin can create a new governed content Draft.
2. A different eligible Admin can list, open, and edit that active Draft.
3. Original `created_by` and creation-time organization provenance remain unchanged when another Admin edits the Draft.
4. A non-Admin authenticated user cannot create governed content through UI or direct server/data calls.
5. A non-Admin user cannot read an Admin Draft through ordinary reader queries or direct unauthorized access.
6. Any eligible Admin can manage permitted relationships for an active Admin Draft.
7. Any eligible Admin can manage permitted private attachments for supported active Draft content types.
8. A non-Admin user cannot create, replace, or delete governed attachments.
9. An Admin can publish a structurally valid new Draft.
10. Invalid Drafts cannot be published.
11. Publication requires live Admin authority at the authoritative server/data boundary.
12. Publication atomically sets the revision Published and makes it the identity's current published revision.
13. Newly published content becomes visible through the existing current-published reader surfaces.
14. Admin Draft content does not leak through library, search, filters, references, Grilla, Programa, detail readers, autocomplete, preload, or equivalent ordinary reader surfaces.
15. An eligible Admin can create a new Draft revision from current published content.
16. A different eligible Admin can continue editing that successor Draft.
17. Creating Draft v2 copies the required current-published semantic state and applicable revision-scoped relationships without mutating Published v1.
18. Published v1 remains the current reader-visible revision while Draft v2 exists.
19. Existing Published v1 attachment metadata/bytes are not automatically copied to v2.
20. Draft v2 independently satisfies attachment/source publication requirements before publication.
21. The system prevents ambiguous competing active Admin Draft successors for the same identity.
22. Publishing Draft v2 makes v2 the new current published revision atomically.
23. Published v1 remains preserved after v2 publication.
24. Publication rejects dependencies that do not resolve to eligible current-published content.
25. Existing SPEC-003 historical provenance and lifecycle evidence are not destructively rewritten.
26. Existing legacy Contributor mutation paths cannot be used by a non-Admin user after this specification is implemented.
27. No active application path transitions a new Admin-managed Draft to Submitted.
28. Revoking Admin authority removes content-management/publication authority according to the existing live-access model, including for Drafts originally created by that user.
29. Published attachments remain private at the storage boundary and become accessible according to associated current-published authorization, not original Draft creator ownership.
30. Lifecycle events record trusted actor, target, action, status, and time information sufficient for the active workflow and correctly attribute cross-Admin edits.
31. No review, approval, change-request, resubmission, or workflow-email capability is required for completion.
32. Spanish is used for the Admin content-management user experience.
33. Tests cover Admin creation, cross-Admin editing, revision creation, publication, dependency validation, reader isolation, attachment authorization, non-Admin mutation denial, current-published stability, publication promotion, concurrency-sensitive integrity, and live role revocation.
34. Cloud verification confirms the intended RLS/grant/function/storage authorization posture after migration.
35. Hosted validation confirms at least:
    - Admin content creation/editing/publication;
    - a second Admin editing a Draft created by the first Admin;
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
- Admin-wide active Draft authority;
- non-Admin read-only authority;
- provenance semantics;
- published revision immutability;
- stable identity semantics;
- current-published reader isolation;
- Draft isolation;
- private attachment boundary;
- successor attachment non-copy behavior;
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
- `README.md`;
- `resources/specs/README.md`;
- SPEC-005.

Do not rewrite completed SPEC-003 as though its original implementation never existed.

After verified implementation, move SPEC-004 according to the repository lifecycle convention.

---

## 28. Open Questions / Blockers

No known product blocker.

Before applying the implementation migration to the intended Cloud project, inspect whether real non-Admin Draft/Submitted records exist.

Their existence does not block implementation, but their treatment must be preservation-first and must not silently publish, delete, or convert them.

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
