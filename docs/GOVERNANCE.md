# Base Curricular — Knowledge Governance

**Status:** Initial operational governance confirmed  
**Last reconciled:** 2026-09-15

## 1. Purpose

Base Curricular is a private shared curriculum-knowledge library.

During the initial operational phase, governed curriculum content is centrally managed by authorized Admins.

Authenticated non-Admin users consume published knowledge but do not author or submit governed content.

This simplified governance model reduces initial operational complexity while preserving the revision, provenance, publication, security, and audit foundations required for future collaborative governance.

---

## 2. Active governance principles

1. **Only Admins may create or modify governed curriculum content.**
2. **Only Admins may publish governed curriculum content.**
3. **Non-Admin users have read-only access to current published governed content.**
4. **Published content is never edited destructively in place.**
5. **A newer Draft revision must not replace the current published revision until publication succeeds.**
6. **Current published knowledge must remain distinguishable from Draft and historical revisions.**
7. **Publication actions must be attributable and auditable.**
8. **Actor and organization identity must derive from trusted authenticated access.**
9. **Publication authority must be enforced at the server/data boundary.**
10. **Governance state must remain separate from content taxonomy.**
11. **Historical provenance must not be rewritten when governance policy changes.**
12. **Published content is archived rather than destructively deleted as the normal retirement mechanism.**

---

## 3. Roles

### User

An eligible authenticated non-Admin user is a reader.

A User may:

- browse current published content;
- search current published content;
- use published-content filters and references;
- access published attachments they are authorized to read;
- use reader features such as personal itinerary where separately implemented.

A User must not:

- create governed curriculum content;
- edit governed curriculum content;
- create Draft revisions;
- submit or resubmit content;
- review content;
- approve content;
- publish content;
- mutate governed attachments;
- access Admin Drafts.

### Admin

An eligible Admin manages governed curriculum knowledge.

An Admin may:

- create governed content;
- access any active Admin Draft;
- edit any active Admin Draft regardless of original creator;
- manage permitted Draft relationships;
- manage permitted private attachments;
- publish valid Drafts;
- create later Draft revisions from published content;
- publish later revisions;
- archive and restore published content;
- access lifecycle/history information required for administration.

Admin Draft authority is based on the current live Admin role, not creator ownership.

`created_by` and creation-time organization remain provenance and do not grant exclusive editing authority to the Admin who originally created the Draft.

---

## 4. New-content workflow

Any currently eligible Admin may continue editing an active Admin Draft.

The Draft creator does not have exclusive mutation authority.

The active workflow is:

`Draft -> Published`

### Behavior

1. An Admin creates governed content.
2. The system creates the stable content identity and Draft revision.
3. The Admin edits the Draft and its permitted relationships/attachments.
4. The Draft remains invisible to ordinary users.
5. The Admin explicitly publishes the Draft.
6. Publication validates the complete content and its dependencies.
7. The revision becomes Published and the stable identity resolves it as current.
8. Ordinary users can then access it through normal reader surfaces.

There is no approval step between Draft and publication in this phase.

Publication itself remains an explicit Admin action.

---

## 5. Published-content revision workflow

Any currently eligible Admin may create or continue editing the active successor Draft.

Original revision creator identity remains provenance only.

Published content is never edited destructively in place.

The active revision flow is:

`Published v1 -> Draft v2 -> Published v2`

While v2 is Draft:

- v1 remains the current published revision;
- ordinary users continue to receive v1;
- v2 is Admin-only;
- edits to v2 do not modify v1.

Once v2 is successfully published:

- v2 becomes the current published revision;
- ordinary users begin resolving v2;
- v1 remains preserved as historical content.

Only one active editable successor Draft should normally exist for a stable identity.

---

## 6. Publication

Publication is an Admin-only governance action.

A revision may be published only when:

- the actor has live Admin authority;
- the Draft satisfies required structural validation;
- required relationships are valid;
- required attachments are ready;
- required published dependencies resolve to current-published content.

Publication must atomically keep revision status and the stable identity's current-published pointer consistent.

Publication must not be exposed as an arbitrary client-controlled status change.

---

## 7. Reader isolation

Ordinary users resolve only current published content.

Admin Drafts must not leak through:

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
- direct unauthorized data access.

When Published v1 and Draft v2 coexist, ordinary readers continue to receive v1.

---

## 8. Attachments

Governed attachments remain private.

Admins may manage permitted attachments while the associated revision is Draft.

Non-Admin users must not create, replace, or delete governed attachments.

Once associated content is published, attachment access follows the authorization of the published content.

Storage privacy must remain enforced independently of UI visibility.

---

## 9. Provenance

The platform must preserve trusted provenance for governed content.

Where applicable this includes:

- original creator;
- original creator organization;
- revision creator;
- publication actor;
- creation time;
- revision time;
- publication time.

Historical Contributor provenance delivered under earlier product phases must remain preserved.

Changing the active governance model must not rewrite historical authorship.

---

## 10. Lifecycle history

The platform maintains append-oriented history for significant governance events.

Active events should represent actions equivalent to:

- `content_created`;
- `revision_created`;
- `revision_edited`;
- `content_published`;
- future archive/restore events where applicable.

Historical events from previously implemented contribution behavior, including `content_submitted`, remain valid history.

Inactive review event types may remain structurally available but are not required active behavior.

Audit records should preserve, as applicable:

- actor;
- organization;
- action;
- content/revision;
- timestamp;
- previous status;
- resulting status.

---

## 11. Deferred collaborative governance

The following workflow is not part of the initial operational phase:

`Contributor Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

Deferred capabilities include:

- partner/user authoring;
- contribution submission;
- review queues;
- review comments;
- requested changes;
- resubmission;
- approval;
- governance workflow email.

Existing technical foundations delivered by SPEC-003 may remain in the system.

They must not grant non-Admin authoring authority while the active Admin-only governance decision remains in force.

Reactivating collaborative governance requires a new explicit product decision/specification.

---

## 12. Notifications

Governance workflow email is not required during the active Admin-only phase.

Resend remains an approved infrastructure choice but no submission, review, change-request, approval, or publication notification is required by the current governance contract.

---

## 13. Publication visibility

The platform remains private and network-only.

All current published content is visible to eligible authenticated users from approved Democracia+ network organizations.

The initial product does not implement:

- organization-specific publication scopes;
- user-specific publication scopes;
- content sensitivity tiers.

Future differentiated visibility requires a separate product decision.

---

## 14. Archival

Published governed content is retired through archival rather than destructive deletion.

When an Admin archives published content:

- it disappears from normal browse/search/discovery;
- its revision history remains preserved;
- provenance remains preserved;
- lifecycle history remains preserved;
- it may be restored by an Admin.

Permanent deletion of published governed content is not normal product behavior.

### Implemented archival contract

Archival is **identity-level governance state**, not a revision status. `Archived`
is deliberately absent from `curriculum_revision_status`.

Archiving published content:

- sets archival metadata on the stable identity;
- leaves the current published revision `Published`;
- preserves `current_published_revision_id`;
- creates no new semantic revision;
- appends a `content_archived` lifecycle event.

Archival is refused when:

- the identity has an active Draft revision;
- another active current-published representation still depends on it.

A dependency-blocked archive never cascades to the dependent content. Restore
revalidates the archived identity's current-published dependency graph using the
same contract publication applies, and fails without clearing archival state when
those dependencies are no longer valid.

Archive and restore are Admin-only and role-wide: any currently eligible Admin may
archive or restore regardless of who created, published or archived the content.
Authority comes from the live persisted role, so revocation removes it on the next
authoritative request.

Because archive and restore act on the identity rather than on a revision, their
lifecycle events record no revision-status transition. Governance history must not
present them as `Published -> Archived`.

---

## 15. Security boundary

Active Admin Draft management is role-wide across currently eligible Admins. Authorization must not require `created_by = current user` for Admin-managed Drafts.

Governance authority follows:

`authenticated identity -> approved domain -> active membership -> active organization -> persisted role`

Only the live persisted Admin role grants governed-content mutation authority.

Security must not rely on:

- hidden buttons;
- disabled controls;
- navigation visibility;
- client-provided roles;
- OAuth profile metadata;
- JWT user metadata.

A non-Admin caller invoking legacy contribution endpoints directly must still be denied.

---

## 16. Change governance

Changes affecting any of the following require explicit product authority:

- who may create governed content;
- who may edit governed content;
- who may publish;
- revision semantics;
- publication visibility;
- archival/deletion semantics;
- content taxonomy;
- authoritative relationships;
- reactivation of collaborative contribution/review.

Routine implementation details that preserve these contracts may be resolved technically.

---

## 17. Governance boundaries

This governance model controls curriculum-content management and publication.

It does not define:

- curriculum learning order;
- enrollment;
- certification;
- course completion;
- progress tracking.

Personal itinerary remains separate from editorial governance except that it references published governed content.

---

## 18. Future governance flexibility

The architecture intentionally preserves the possibility of future collaborative governance, including:

- partner contributions;
- review workflows;
- review comments;
- trusted organizations;
- multiple reviewer roles;
- approval workflows;
- differentiated publication scopes.

These are future possibilities, not current product requirements.

---

## 19. Knowledge reconciliation

When governance changes:

1. preserve historical implementation evidence;
2. update active product decisions;
3. update current-state documentation;
4. prevent inactive capabilities from remaining accidentally authorized;
5. preserve provenance and audit history;
6. clearly separate current behavior from future vision;
7. ensure UI, authorization, persistence, tests, and documentation describe the same active product.

---

## 20. Implementation verification

SPEC-004 is completed. Destructive multi-user acceptance used disposable identities and content in the real local Supabase/application/browser stack. This verified Admin-wide Draft authority, trusted cross-Admin lifecycle attribution, direct publication, successor promotion, current-published reader isolation, attachment currentness, non-Admin denial, and live role revocation.

The intended Cloud project separately passed preservation inventory, migration application, and resulting schema/RLS/grant/function/Storage verification. Production deployment was verified without creating fictional authoritative curriculum. Local integrated acceptance is not hosted production validation; it was selected because production had neither the required safe multi-user accounts nor a supported cleanup lifecycle for Published test content.

---

## 21. Source basis

This governance state reflects:

- the original collaborative-governance baseline;
- completed SPEC-001 through SPEC-003;
- D-030 — Admin-only initial operational content management;
- product decision confirmed 2026-09-14.
