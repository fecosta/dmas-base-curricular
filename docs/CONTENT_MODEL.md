# Base Curricular — Content Model

**Status:** Baseline content model  
**Last reconciled:** 2026-09-15

## 1. Purpose

This document defines the semantic structure of Base Curricular.

It describes what the product knows about and how those concepts relate.

The approved persistence platform is Supabase PostgreSQL, but this document remains a semantic model rather than a physical database schema.

## 2. Core hierarchy

The initial content structure is:

`Axis -> Module -> Program Topic`

Supporting knowledge objects connect to modules and/or themes:

- `Instructor`
- `Teaching Note`
- `Material / Study`
- `Institution / Reference Center`

The product is a library, so this hierarchy organizes content; it does not impose a mandatory learning sequence.

## 3. Axis

An **Axis** is the highest-level curriculum grouping.

Initial axes:

1. Strategy & Campaign
2. Evidence-based Public Policy

An axis may contain many modules.

### Baseline fields

- `id`
- `name`
- `description` — optional
- `display_order` — optional organizational metadata
- `status`

## 4. Module

A **Module** is the primary curriculum unit.

A module belongs to an axis and may be associated with a theme.

### Baseline fields

- `id`
- `axis_id`
- `title`
- `theme`
- `description`
- `program_topics`
- `learning_outcomes` — optional
- `level` — retained metadata; not part of the current UX contract
- `delivery_format` — retained metadata; not part of the current UX contract
- `suggested_duration` — optional
- `status`
- `archived_at` — optional governance metadata

### Notes

`level` and `delivery_format` remain available in the model because they may be useful later. Their presence does not require displaying them in the current interface.

The former prototype completeness percentage is not part of the approved product model.

## 5. Program Topic

A **Program Topic** represents a topic or point within a module's program.

Use the product term **Program**, not `Ementa`.

### Baseline fields

- `id`
- `module_id`
- `title`
- `description` — optional
- `position` — optional

Admins authoring governed curriculum content may:

- associate a record with an existing current-published program topic; or
- create a new program topic as governed content.

During the initial operational phase, program-topic creation is Admin-only.

## 6. Instructor

An **Instructor** represents an instructor, expert, or relevant profile connected to curriculum content.

### Baseline fields

- `id`
- `name`
- `role_or_title`
- `institution`
- `profile`
- `linkedin_url` — optional
- `thematic_axis_or_themes`
- `country` — optional
- `status`

### Relationships

An instructor may be related to one or more modules.

The exact cardinality and implementation mechanism may be decided during technical modeling; the product contract is that instructors can be contextualized against relevant curriculum content.

## 7. Teaching Note

A **Teaching Note** is contextual knowledge associated with a module and, when appropriate, a program topic.

### Baseline fields

- `id`
- `module_id`
- `program_topic_id` — optional when the note applies to the module more broadly
- `text` — optional when the note is attachment/link based
- `source_url` — optional
- `status`

A teaching note may have one or more supporting attachments or linked materials.

## 8. Material / Study

A **Material / Study** is a reference resource.

Examples include:

- research;
- reports;
- manuals;
- courses;
- databases;
- presentations;
- publications;
- links;
- other supporting files.

### Baseline fields

- `id`
- `title`
- `material_type`
- `description` — optional
- `source_or_institution`
- `source_url` — optional
- `country_or_scope` — optional
- `theme` — optional
- `status`

### Relationships

A material may:

- stand alone as a reference;
- be associated with one or more modules;
- support a teaching note;
- be associated with a theme.

## 9. Institution / Reference Center

An **Institution** represents a relevant organization or center.

Examples include:

- universities;
- party schools;
- think tanks;
- multilateral organizations;
- NGOs;
- other institutions working on the subject.

### Baseline fields

- `id`
- `name`
- `institution_type`
- `country_or_scope`
- `description` — optional
- `website_url` — optional
- `themes` — optional
- `status`

Institutions are directly addable governed knowledge objects, not only metadata embedded inside module cards.

## 10. Contribution — inactive current behavior

A **Contribution** represents the collaborative user-submission concept implemented historically by SPEC-003 and retained for possible future governance use.

It is **not active product behavior during the initial Admin-only operational phase defined by D-030**.

Non-Admin users do not currently create, edit, submit, or resubmit governed curriculum content.

Existing contribution provenance, statuses, lifecycle events, and persisted records remain valid historical data and must not be destructively removed merely because collaborative contribution is deferred.

Future reactivation of Contribution requires an explicit product decision/specification.

### Historical conceptual metadata

- `id`
- `content_type`
- `content_id`
- `contributor_user_id`
- `contributor_organization_id`
- `created_at`
- `submission_status`

Historical contributor identity and organization remain provenance and must not be rewritten.

## 11. Content and revisions

Published records require revision history.

The conceptual model distinguishes a durable content identity from its editable versions.

### Content

Represents the stable identity of the knowledge object.

Conceptual fields:

- `id`
- `content_type`
- `current_published_revision_id`
- `created_by`
- `created_at`

### Content Revision

Represents a version of that content.

Conceptual fields:

- `id`
- `content_id`
- `revision_number`
- `status`
- `content_payload`
- `created_by`
- `created_at`
- `submitted_at` — historical/future workflow metadata
- `reviewed_by` — future workflow metadata
- `reviewed_at` — future workflow metadata
- `approved_by` — future workflow metadata
- `approved_at` — future workflow metadata
- `published_by`
- `published_at`

The exact physical schema is an implementation decision.

The product requirement is that a current published revision remains stable and visible while a newer unpublished revision exists.

During the initial Admin-only phase, that successor is an Admin Draft:

`Published v1 -> Draft v2 -> Published v2`

Any currently eligible Admin may manage the active Draft successor.

`created_by` remains provenance and does not imply exclusive Admin editing ownership.

Future collaborative governance may add review states without changing the current-published stability invariant.

## 12. Review Comment — inactive current behavior

A **Review Comment** records requested adjustments in the conceptual collaborative-governance model.

Review Comments are **inactive in the initial operational phase**.

They remain part of the possible future collaborative-governance model but are not current product behavior under D-030.

Conceptual fields:

- `id`
- `revision_id`
- `author_user_id`
- `comment`
- `created_at`
- `resolved_at` — optional

Future reactivation of review comments requires an explicit product decision/specification.

## 13. User and Organization

### Organization

Represents an organization allowed to participate in the network.

Conceptual fields:

- `id`
- `name`
- `approved_email_domains`
- `status`

### User

Represents an authenticated member.

Conceptual fields:

- `id`
- `name`
- `email`
- `organization_id`
- `role`
- `status`

Detailed authorization rules are owned by `SECURITY.md` and `GOVERNANCE.md`.

The persisted `Contributor` role currently represents an eligible non-Admin reader for governed content; the `Admin` role grants governed-content management authority.

## 14. Personal Itinerary

A **Personal Itinerary** is a user's module selection.

It is not a curriculum hierarchy or learning trail.

Conceptual fields:

- `id`
- `user_id`
- `created_at`
- `updated_at`

It contains one or more module references.

Possible future metadata such as name or description may be added later without changing the core product semantics.

## 15. Archival

Published governed content uses archival rather than destructive deletion as the normal retirement mechanism.

Conceptually, governed content should be able to represent:

- active/current;
- archived;
- restored.

Possible fields include:

- `archived_at`
- `archived_by`
- `archive_reason` — optional
- `restored_at` — optional
- `restored_by` — optional

Exact storage is an implementation decision.

## 16. Lifecycle status versus content classification

Content classification and editorial status are separate concepts.

For example:

- `material_type = Report`
- `status = Draft`

or:

- `instructor relationship = Reference`
- `status = Published`

Do not overload content taxonomy fields to represent governance lifecycle state.

Historical statuses such as `Submitted`, `Under Review`, `Changes Requested`, `Resubmitted`, and `Approved` may remain in persistence for historical/future compatibility even when inactive in the current product.

## 17. Technical modeling decisions

SPEC-002 resolves normalized revision tables, the initial many-to-many joins, reader search indexing, URL-backed reader filters, and stable UUID/revision-number mechanics as described in §18.

SPEC-003 resolves contribution provenance, pending persistence, lifecycle-event foundation, and private attachment persistence as described in §19.

SPEC-004 owns the active Admin-management/publication write path, successor revision creation, Admin-wide Draft access, published attachment reader access, and non-Admin mutation shutdown. Its local Phase 2 persistence foundation enforces one active Draft per stable identity, copies current Published typed semantic fields and Module/Teaching Note revision-scoped relationships into a successor Draft, and intentionally copies no attachment membership. Its local Phase 3 application surface exposes these Draft, publication, and successor primitives to Admins. Local Phase 4 authorizes eligible readers to access only `Ready` attachments belonging to the authoritative current-published Teaching Note or Material revision; Draft and historical attachment membership remain isolated, and the bucket remains private. Independent review, Cloud application, and hosted validation remain pending.

These decisions must preserve the semantic contracts in this document.

## 18. Verified SPEC-002 physical persistence

SPEC-002 implements the D-029 identity/revision distinction with normalized per-entity table pairs for Module, Program Topic, Instructor, Teaching Note, Material/Study, and Institution/Reference Center.

For each governed type:

- the identity table owns the stable UUID, creation metadata, archival metadata, and `current_published_revision_id`;
- the typed revision table owns revision-numbered semantic fields, publication status, and publication timestamp;
- a composite foreign key guarantees that the current pointer belongs to the same stable identity;
- a trigger requires the selected current revision to have `Published` status;
- published revision fields are immutable;
- module and teaching-note relationships are revision-scoped and become immutable once the identity resolves its published revision.

Reader policies expose an identity only when it has a current pointer and is not archived. Revision policies expose only the pointed-to `Published` row. A later Draft can therefore coexist under the same identity while readers continue resolving the unchanged published row. Axis remains a directly persisted structural classification rather than a governed revision pair; the two approved axes have stable UUIDs and are inserted idempotently by migration.

Typed relationships are:

- Program Topic revision -> stable Module identity;
- Teaching Note revision -> stable Module identity and optional stable Program Topic identity;
- Module revision -> stable Instructor, Material, and Institution identities through join tables;
- Teaching Note revision -> stable Material identity through a join table.

This physical design stores semantic fields relationally rather than as generic JSON revision payloads. JSON is used only as a composed RPC return representation and as the trusted import interchange format; PostgreSQL tables remain canonical.

## 19. Verified SPEC-003 contribution persistence

SPEC-003 extends each typed revision with `contributor_organization_id`, an immutable creation-time organization snapshot, and `submitted_at`. New contributions use the existing stable identity and typed revision pairs: the database creates a new identity with a null current-published pointer and revision 1 in `Draft`, then permits the owner transition to `Submitted`.

`curriculum_lifecycle_events` is an append-only event foundation for content/revision creation, Draft edits, submission, and retained Draft-deletion evidence. Revision status remains the sole lifecycle authority.

`curriculum_attachments` stores authoritative metadata only for Teaching Note or Material revisions through mutually exclusive typed foreign keys. Metadata uses `Reserved -> Ready` for upload and `Ready/Reserved -> Deleting` for recoverable deletion. Only `Ready` objects can satisfy submission validation; object bytes remain in the private `governed-attachments` Storage bucket.

An owned Draft may resolve compatible current-published, caller-owned Draft, or caller-owned Submitted dependencies. Dependency status does not change the SPEC-003 mutation boundary: only the caller-owned anchoring revision while it remains Draft may change its relationships, and Submitted dependencies remain read-only.

Teaching Note Drafts may omit both `text` and `source_url` so attachment-only records are physically representable. The authoritative SPEC-003 submission operation enforces the cross-table source rule.

This persistence model is independently verified, applied to the intended Supabase Cloud project, and hosted-validated.

Under D-030, SPEC-003 remains historical implementation evidence, but its Contributor authoring/owner-only mutation authority is no longer the active target. SPEC-004 must reconcile it with Admin-only, Admin-wide Draft management without destructively removing provenance or history.

## 20. Source basis

This model was derived from:

- stakeholder meeting notes — 2026-08-06;
- Platforms D+ meeting notes — 2026-08-12;
- first static-prototype UX assessment — August 2026;
- latest static prototype — `Base Curricular - Explorador (offline)(3).html`;
- product decisions confirmed on 2026-09-10;
- D-030 Admin-only initial operational content-management decision — 2026-09-14.
