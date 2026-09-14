SPEC-003 — Content Contribution

Status: COMPLETED — IMPLEMENTED, INDEPENDENTLY VERIFIED, CLOUD-APPLIED, AND HOSTED-VALIDATED
Methodology state: CLOSED
Depends on: SPEC-002
Implementation: e50feabc698e29c7bac6cf8b33e98b2a0cbfce20
Closure verified: 2026-09-14

1. Purpose / Objective

Allow eligible authenticated users from approved Democracia+ network organizations to create governed content drafts and submit them for Admin review without granting publication authority.

SPEC-003 introduces the first user-write surface for governed curriculum content. It must preserve the revision-capable persistence, published-reader isolation, and authorization boundaries delivered by SPEC-001 and SPEC-002.

⸻

2. Current State

SPEC-003 is implemented in commit e50feabc698e29c7bac6cf8b33e98b2a0cbfce20, independently verified, applied to the intended Supabase Cloud project, and hosted-validated. The predecessor capabilities below describe the foundation against which this delivery slice was implemented.

SPEC-001 provides:

* authenticated identity;
* approved-domain eligibility;
* active membership;
* active organization;
* persisted Contributor/Admin roles;
* private.current_access() as the authoritative live access primitive.

SPEC-002 provides:

* stable identities and typed revisions for:
    * Module;
    * Program Topic;
    * Instructor;
    * Teaching Note;
    * Material / Study;
    * Institution / Reference Center;
* Draft and Submitted values in the governed revision-status enum;
* current-published pointers;
* published-revision immutability;
* revision-scoped relationships;
* current-published reader RLS;
* PostgreSQL search and published reader RPCs;
* no ordinary authenticated curriculum write authority;
* no contribution workflow;
* no Supabase Storage attachment implementation yet.

The static prototype demonstrates contribution forms, but its contribution state is browser-local and is not a production trust boundary.

⸻

3. Problem / Gap

The product collaboration model requires Democracia+ and partner organizations to contribute governed knowledge, but there is currently no durable authenticated mechanism that:

* preserves contributor provenance;
* enforces draft ownership;
* prevents publication escalation;
* submits revisions into governance;
* protects pending content from ordinary readers;
* supports private governed attachments where required;
* preserves lifecycle evidence needed for later review/audit functionality.

⸻

4. Authoritative Decisions

Existing approved product and governance decisions remain authoritative:

* both Democracia+ and partner organizations may contribute governed knowledge;
* contribution does not grant publication authority;
* contributor user and organization are derived from authenticated/trusted context rather than manually entered identity fields;
* governed content uses revision-based persistence;
* published content remains stable while new work is pending;
* pending/unpublished content must not leak into ordinary browse, detail, search, filters, exports, URLs, or preload payloads;
* private governed attachments use Supabase Storage and inherit content/revision authorization;
* significant lifecycle actions must remain attributable for later audit/history use;
* publication remains an Admin-governed capability belonging to later workflow specs;
* a caller-owned compatible contribution that has already transitioned to Submitted remains a valid read-only dependency for that caller’s other Draft contributions while it remains unpublished;
* submitting one owned contribution must not invalidate, strand, or force deletion of another owned Draft that depends on it.

The Submitted-dependency rule clarifies relationship validity inside the existing contribution lifecycle. It does not grant new mutation, review, publication, or cross-user visibility authority.

No broader product behavior is introduced by this specification reconciliation.

⸻

5. Contribution Persistence Contract

For SPEC-003, the governed revision is the physical unit of contribution workflow.

Do not introduce a second generic contribution lifecycle authority whose status could diverge from revision.status.

For each new governed contribution:

1. create the appropriate stable content identity;
2. create its first typed revision with status = Draft;
3. derive contributor user from authenticated identity;
4. snapshot contributor organization from trusted live access context;
5. leave the stable identity’s current_published_revision_id null;
6. transition the owned revision from Draft to Submitted when valid.

Provenance

The physical model must preserve at minimum:

* contributor user identity;
* contributor organization identity as an immutable creation-time snapshot;
* creation time;
* submission time when submitted.

The existing revision created_by field may represent contributor-user identity.

Contributor organization must also be persisted at revision/contribution time rather than reconstructed later from membership records that may change.

Client input must never be authoritative for:

* contributor user;
* contributor organization;
* submission time;
* lifecycle status;
* publication metadata.

⸻

6. Lifecycle Boundary

SPEC-003 owns only:

Draft -> Submitted

Draft

An eligible Contributor or Admin may create a new governed-content Draft.

The owner may:

* read the Draft;
* edit fields permitted by its content type;
* edit permitted revision relationships;
* add/remove permitted private attachments;
* delete the unsubmitted Draft where doing so does not erase required governance evidence;
* submit the Draft when structurally valid.

Submitted

After submission:

* the contributor may continue reading their own submitted contribution;
* the contributor may not edit or delete the submitted revision;
* the contributor may not add/remove/change its relationships;
* the contributor may not add/remove/replace its attachments;
* the revision remains unpublished;
* no current-published pointer changes;
* ordinary library/search/detail surfaces must not expose it;
* the Submitted contribution may remain a read-only dependency of the same contributor’s other Draft contributions where the relationship is semantically compatible.

A Submitted dependency does not become editable merely because another Draft depends on it.

SPEC-003 stops at Submitted.

The following belong to later specifications and must not be implemented here:

* Submitted -> Under Review;
* Under Review -> Changes Requested;
* Changes Requested -> Resubmitted;
* Under Review -> Approved;
* approval;
* publication;
* Admin review queue;
* review comments;
* review notifications;
* Admin direct publication;
* published-content revision authoring.

Resubmitted must not be implemented until change-request/review behavior exists.

⸻

7. Eligible Authors and Publication Boundary

Both eligible Contributor and eligible Admin users may use the SPEC-003 authoring surface to create and submit drafts.

This does not activate Admin publication authority inside SPEC-003.

Admin direct-create/direct-publish behavior remains outside this slice.

Neither Contributor nor Admin authoring requests in SPEC-003 may:

* create a Published revision;
* set publication timestamps;
* set review/approval states;
* modify current-published pointers.

⸻

8. Write-Surface Security Contract

Do not implement SPEC-003 by granting generic client-controlled CRUD authority over governed identity/revision tables.

Implementation must provide narrow server/data-boundary operations equivalent to:

* create Draft;
* list/read own pending contributions;
* update own Draft;
* delete own permitted unsubmitted Draft;
* submit own Draft.

These operations must derive live authorization from the existing eligibility model.

They must fail closed when any of the following becomes invalid:

* membership;
* organization;
* approved domain;
* role;
* authenticated identity.

Implementation may use narrow RPCs, tightly scoped RLS-backed mutations, or a combination.

Client input must not control:

* actor identity;
* contributor organization;
* arbitrary revision status;
* publication timestamp;
* current-published pointer;
* another user’s ownership.

SPEC-002 published-reader RLS and grants must remain intact.

⸻

9. Ownership and Pending Visibility

Pending contribution visibility is separate from published-reader visibility.

Owner surface

A contributor may read:

* their own Draft revisions;
* their own Submitted revisions;
* supporting pending identities/relationships required to render those contributions.

A contributor may mutate only their own editable Draft.

A caller-owned Submitted contribution may be resolved as a read-only dependency for another owned Draft when the relationship is semantically compatible.

Other users

Another ordinary eligible user must not read or mutate someone else’s Draft or Submitted contribution through:

* direct table access;
* RPCs;
* contribution routes;
* direct IDs;
* relationship selectors;
* Storage paths;
* search;
* autocomplete;
* filters;
* preload payloads.

SPEC-003 does not introduce general Admin cross-user pending-content access.

That governance visibility belongs to SPEC-004.

Published surfaces

Existing:

* library;
* module/reference detail;
* Grilla;
* Programa;
* PostgreSQL search;
* filters;
* published reader RPCs

remain strictly current-published only.

⸻

10. New Content Only

SPEC-003 supports creating new governed content identities with their first Draft revisions.

It does not expose:

Published v1 -> Draft Revision v2

Editing currently published content belongs to SPEC-005.

Do not add an “Edit published content” action in SPEC-003.

⸻

11. Governed Content Types

SPEC-003 supports new contributions for:

* Module;
* Program Topic;
* Instructor;
* Teaching Note;
* Material / Study;
* Institution / Reference Center.

A proposed Program Topic uses the existing governed Program Topic identity/revision model.

Do not create a separate proposed_program_topics model.

⸻

12. Draft Relationships

Draft relationships must preserve the revision-scoped D-029 model from SPEC-002.

Where semantically required, contribution forms, selectors, and relationship validation may resolve:

* eligible current-published content;
* compatible Draft identities owned by the same contributor;
* compatible Submitted identities owned by the same contributor, as read-only dependencies while they remain unpublished.

Examples:

* own Draft Program Topic may target own Draft or Submitted Module;
* own Draft Teaching Note may target own Draft or Submitted Module;
* own Draft Teaching Note may target own Draft or Submitted Program Topic.

Submitting one owned contribution must not invalidate, strand, or force deletion of another owned Draft that already depends on it.

A caller-owned Submitted dependency remains valid for relationship resolution, but it remains immutable under SPEC-003.

A Submitted dependency must not permit:

* editing the submitted revision;
* changing its relationships;
* adding, replacing, or deleting its attachments;
* changing its lifecycle status;
* obtaining review authority;
* obtaining publication authority.

Pending content belonging to another contributor must never:

* appear as a selectable dependency;
* resolve successfully through relationship validation;
* become readable through an existing relationship;
* become accessible through direct IDs or preload payloads.

Relationship mutation must remain limited to relationships anchored to revisions:

* owned by the caller;
* still in Draft.

The status of a dependency and the editability of the anchoring revision are separate concerns:

* a Draft anchoring revision may reference an eligible Published, caller-owned Draft, or caller-owned Submitted dependency;
* only the caller-owned anchoring revision while it remains Draft may have its relationships changed;
* a Submitted dependency is valid for resolution but never gains mutation authority.

⸻

13. Submission Validation

Draft persistence and submission validity are distinct concepts.

Implementation may choose whether to persist incomplete Drafts immediately or only after minimum fields exist, provided database integrity remains safe.

Submission must validate complete structural requirements before the transition to Submitted.

At minimum submission validation must cover:

* required semantic fields;
* valid relationships;
* ownership;
* live eligibility;
* current status = Draft;
* valid Module / Program Topic relationships;
* attachment requirements where applicable.

Relationship validation must not depend on a particular submission order among caller-owned compatible contributions.

A structurally valid Draft must remain submittable when one of its valid caller-owned dependencies has already transitioned from Draft to Submitted.

Teaching Note

A Teaching Note is valid for submission when it has at least one authorized content source:

* text;
* HTTPS source URL;
* at least one valid private attachment.

The SPEC-002 physical constraint requiring text or source_url must therefore be reconciled so an attachment-only Draft/Submitted Teaching Note is representable.

This must not weaken submission validation.

⸻

14. Private Attachment Foundation

SPEC-003 introduces the first Supabase Storage implementation.

Attachments are in scope only where the existing content model requires file-backed content:

* Teaching Note;
* Material / Study.

Do not add governed attachments in this slice to:

* Module;
* Program Topic;
* Instructor;
* Institution.

Requirements:

* private Supabase Storage bucket;
* no public governed-content bucket;
* upload under authenticated user context;
* no browser-exposed privileged credential;
* authoritative relational metadata linked to typed revisions;
* real FK integrity where practical;
* opaque object identifiers/paths;
* original filename stored only as display metadata;
* explicit MIME/size limits;
* path structure must not be treated as authorization.

Attachment authorization

For an owned Draft, the contributor may:

* upload;
* read;
* delete

permitted attachments.

After Submitted, the contributor may read but may not:

* add;
* replace;
* delete

attachments in SPEC-003.

Anonymous, ineligible, and unrelated eligible users must not access pending attachments.

Eligibility revocation must revoke pending-file access on subsequent requests.

Authenticated private-object access is preferred.

If signed URLs are used:

* authorize before creation;
* use short TTL;
* never persist long-lived signed URLs as durable metadata.

Storage/database consistency

PostgreSQL and Storage do not share one transaction.

Implementation must safely handle:

* Storage upload succeeds, metadata fails;
* metadata exists but object is missing;
* abandoned upload before submission.

Do not introduce a background-worker subsystem solely for orphan cleanup.

⸻

15. Minimal Lifecycle Event Foundation

SPEC-003 must persist an append-oriented event foundation for the lifecycle actions introduced in this slice.

At minimum represent events equivalent to:

* content_created;
* revision_created;
* revision_edited;
* content_submitted;
* draft deletion where retained evidence is required.

Event metadata must derive trusted actor/organization context and include as applicable:

* content type;
* stable content ID;
* revision ID;
* actor user;
* actor organization;
* action;
* resulting status;
* timestamp.

Ordinary users must not be able to forge, modify, or delete lifecycle events.

This is persistence foundation only.

Out of scope:

* audit-history UI;
* review events;
* approval events;
* publication events;
* archival UI.

⸻

16. Product UI

The contribution experience is Spanish-first.

Provide protected contribution surfaces equivalent to:

* Mis contribuciones;
* Nueva contribución;
* content-type selection;
* create/save Draft;
* edit Draft;
* submit for review;
* view Submitted contribution read-only.

The implementation may choose exact route and form architecture.

Where relationship selectors display caller-owned pending dependencies:

* compatible Draft dependencies may be selectable;
* compatible Submitted dependencies may remain selectable as read-only relationship targets for an editable Draft;
* another contributor’s pending content must never appear.

Do not implement:

* review queue;
* Admin review controls;
* review comments;
* approval controls;
* publication controls;
* review emails;
* audit-history UI;
* published-content editing;
* personal itinerary.

⸻

17. Impact Surface

Expected implementation impact includes:

* new Supabase migration(s);
* revision provenance/submission metadata;
* pending ownership/RLS;
* narrow contribution write operations;
* append-only lifecycle-event persistence;
* Supabase Storage enablement/configuration;
* private bucket and Storage RLS;
* typed attachment metadata for Teaching Note and Material / Study;
* generated database types;
* server contribution query/action layer;
* Spanish contribution UI;
* relationship resolution for caller-owned Draft and Submitted dependencies;
* pgTAP/database authorization tests;
* Storage authorization tests;
* Vitest action/validation tests;
* Playwright multi-user contribution flows;
* submission-order regression coverage for owned dependent contributions;
* Cloud migration and Storage verification before closure.

⸻

18. Acceptance Criteria

1. An eligible Contributor can create a new Draft for every governed content type in scope.
2. An eligible Admin can use the same Draft/submission capability without receiving SPEC-003 publication actions.
3. A contribution uses the existing stable identity + typed revision model rather than a parallel content-payload authority.
4. The revision records authenticated contributor user identity and immutable contributor-organization provenance without manual identity entry.
5. Client/request manipulation cannot spoof contributor user, contributor organization, submission time, arbitrary workflow status, publication metadata, or current-published pointer.
6. The owner can read and edit their own structurally permitted Draft.
7. Another eligible user cannot read or mutate the owner’s Draft/Submitted contribution.
8. Membership, organization, or approved-domain revocation removes pending access on the next data request.
9. The owner can submit a structurally valid Draft through Draft -> Submitted, including when a compatible caller-owned dependency has already transitioned to Submitted.
10. A structurally invalid Draft cannot be submitted.
11. After submission, the contributor may read but cannot edit/delete its revision, relationships, or attachments.
12. Submission does not publish content, set a current-published pointer, or expose pending content through published library/search/detail surfaces.
13. A contributor cannot force Under Review, Changes Requested, Resubmitted, Approved, or Published.
14. New Program Topic proposals use governed Program Topic identities/revisions.
15. Relationship selectors and validation may use eligible published content and caller-owned compatible Draft or Submitted dependencies, never another contributor’s pending content.
16. Draft creation does not mutate any existing current-published representation or published relationship snapshot.
17. SPEC-003 exposes no Draft-v2 creation from currently published content.
18. Teaching Note and Material / Study attachments use private Supabase Storage plus authoritative typed revision metadata.
19. Anonymous, ineligible, and unrelated eligible users cannot access another user’s pending attachment.
20. An owner can upload/read/delete permitted Draft attachments but cannot mutate them after submission.
21. An attachment-only Teaching Note may be submitted when its authorized attachment satisfies validation.
22. Public URL/path manipulation cannot bypass attachment authorization.
23. Create/edit/submit lifecycle events are persisted with trusted actor/organization attribution and cannot be forged/destructively rewritten by ordinary users.
24. Published reader RPCs, search, filters, Grilla, Programa, and references remain current-published only.
25. Contribution UI, statuses, validation, empty states, and errors are Spanish-first.
26. Tests cover ownership, cross-user denial, eligibility revocation, state transitions, publication escalation denial, relationship isolation, Storage access, post-submission attachment immutability, lifecycle-event integrity, and published-surface isolation.
27. Tests cover dependency submission ordering so that submitting an owned Module or Program Topic before an owned dependent Draft does not strand that Draft or prevent valid subsequent editing/submission.

⸻

19. Implementation Freedom

Implementation may choose, while preserving this contract:

* form architecture;
* validation library;
* autosave strategy;
* exact narrow RPC / Server Action decomposition;
* exact relational provenance shape;
* exact append-only event-table shape;
* bucket/object naming conventions;
* upload size/MIME limits appropriate to the product;
* authenticated download versus short-lived signed URLs;
* route/component organization;
* test fixture design.

Implementation must not:

* introduce a second lifecycle authority;
* weaken D-029;
* broaden review/publication authority;
* expose pending data to published-reader surfaces;
* make valid caller-owned dependency relationships depend on a specific submission order.

⸻

20. Knowledge Updates Required

Completed:

* reconciled the physical provenance/contribution model with docs/CONTENT_MODEL.md;
* reconciled pending authorization and Storage controls with docs/SECURITY.md;
* reconciled caller-owned Draft/Submitted dependency resolution with docs/CONTENT_MODEL.md;
* updated docs/ARCHITECTURE.md with verified:
    * write operations;
    * relationship-resolution behavior;
    * event foundation;
    * Storage architecture;
    * failure-handling model;
* no new durable architecture decision was required;
* updated setup/config documentation for local Storage;
* kept SPEC-003 active through implementation and independent verification;
* moved the spec only after Cloud and hosted closure validation.

⸻

21. Validation / Closure Gate

SPEC-003 was not eligible for completion based on local tests alone. The additional gates below are now satisfied as recorded in §23.

Before closure validate, as applicable:

* local migration replay;
* database/RLS/grant tests;
* direct-data authorization;
* Storage policies;
* attachment access;
* unit/integration tests;
* production build;
* multi-user browser E2E;
* owner vs unrelated-user denial;
* submission/read-only behavior;
* dependency submission ordering;
* editing/submission of a Draft whose caller-owned dependency is already Submitted;
* Submitted-dependency immutability;
* published-library isolation;
* Supabase Cloud migration dry-run/application;
* Cloud RLS/grant/function verification;
* Cloud private bucket/Storage verification;
* hosted authoring/submission with controlled test identities;
* hosted cross-user/ineligible denial;
* documentation reconciliation;
* independent review.

Do not populate production curriculum with fictional authoritative content for validation.

⸻

22. Open Questions / Blockers

No known product blocker remains.

The caller-owned Submitted-dependency behavior is resolved by this specification:

* a compatible caller-owned Submitted contribution may remain a valid read-only dependency for another caller-owned Draft;
* this does not grant mutation authority over the Submitted revision;
* it does not make another user’s pending content visible;
* it does not broaden review or publication authority.

Implementation must stop with:

BLOCKED / DECISION REQUIRED

if satisfying SPEC-003 requires changing an authoritative contract for:

* contributor ownership;
* publication/review authority;
* revision semantics;
* pending visibility;
* deletion/archival behavior;
* authoritative content relationships.

Reversible technical choices under Implementation Freedom do not require a new product decision.

⸻

23. Completion Evidence

* implementation commit e50feabc698e29c7bac6cf8b33e98b2a0cbfce20 delivers authenticated Draft creation/editing, Draft -> Submitted, caller-owned Draft/Submitted dependencies, immutable Submitted contributions, provenance, lifecycle events, private attachments, Spanish contribution UI, and published-surface isolation;
* final local validation passed fresh migration replay, 276 pgTAP assertions, database lint, 52 Vitest tests, typecheck, lint, production build, targeted contribution E2E, 10 development Chromium journeys, 10 production-mode Chromium journeys, and diff checks;
* independent adversarial review identified one merge blocker and four fix-before-merge findings; the corrective pass resolved all five, and the independent Opus delta review returned PASS with no remaining merge blocker or fix-before-merge finding;
* migration 20260913000100_content_contribution_persistence.sql is recorded on Supabase Cloud project qcxcgwpfgclyebkxawyh alongside migrations 20260910000100 and 20260911000100;
* Cloud verification confirmed the expected Teaching Note constraint reconciliation, RLS on attachment/event tables, intended narrow SECURITY DEFINER functions and grants, no unexpected anonymous authority, and the private governed-attachments bucket with its 3 MiB limit, MIME allowlist, SELECT/INSERT/DELETE policies, and no UPDATE policy;
* hosted functional validation passed contribution creation/editing/submission, dependency ordering and Submitted dependencies, attachment workflow, Submitted read-only behavior, cross-user and revoked-user denial, and published library/search isolation;
* all 27 SPEC-003 acceptance criteria are satisfied. SPEC-003 is therefore closed without activating SPEC-004.

⸻

24. Residual Non-blocking Follow-ups

The following remain non-blocking follow-ups rather than SPEC-003 acceptance gaps: aggregate attachment quotas; malware/content scanning and stronger MIME/content validation; generalized committed concurrency coverage; positional relationship INSERT cleanup; E2E organization/refactoring; Unicode filename percent/double encoding in Storage download behavior; the application/database C1 filename strictness mismatch; browser validation beyond Chromium; and lifecycle hardening belonging to SPEC-004 or later.
