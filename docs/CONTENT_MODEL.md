# Base Curricular — Content Model

**Status:** Baseline content model  
**Last reconciled:** 2026-09-10

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

Users contributing notes or materials may:

- associate the contribution with an existing program topic; or
- propose a new topic when none of the existing topics fits.

A newly proposed program topic is governed content and therefore follows the review workflow before publication.

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
- `text` — optional when the contribution is attachment/link based
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

Institutions are directly addable knowledge objects, not only metadata embedded inside module cards.

## 10. Contribution

A **Contribution** represents a user's proposed addition or change to governed knowledge.

A contribution may create or revise:

- a module;
- a program topic;
- an instructor;
- a teaching note;
- a material;
- an institution.

### Baseline metadata

- `id`
- `content_type`
- `content_id`
- `contributor_user_id`
- `contributor_organization_id`
- `created_at`
- `submission_status`

The contributor's identity and organization should be derived from the authenticated session whenever possible.

## 11. Content and revisions

Published records require revision history.

The conceptual model must distinguish a durable content identity from its editable versions.

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
- `submitted_at`
- `reviewed_by`
- `reviewed_at`
- `approved_by`
- `approved_at`
- `published_by`
- `published_at`

The exact physical schema is an implementation decision.

The product requirement is that a published revision remains stable and visible while a newer revision is under review.

## 12. Review Comment

A **Review Comment** records requested adjustments from an Admin.

Conceptual fields:

- `id`
- `revision_id`
- `author_user_id`
- `comment`
- `created_at`
- `resolved_at` — optional

Review comments should remain part of the revision history rather than disappearing when a contribution is resubmitted.

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

Unsubmitted personal drafts may be deletable by their author provided no required governance/audit history is lost.

## 16. Lifecycle status versus content classification

Content classification and editorial status are separate concepts.

For example:

- `material_type = Report`
- `review_status = Under Review`

or:

- `instructor relationship = Reference`
- `review_status = Published`

Do not overload content taxonomy fields to represent review state.

## 17. Open technical modeling decisions

The following are implementation decisions, not unresolved product behavior:

- normalized tables versus structured revision payloads;
- exact many-to-many join structures;
- attachment storage implementation;
- search indexing strategy;
- URL-state representation;
- notification delivery provider;
- internal IDs and revision-number generation.

These decisions must preserve the semantic contracts in this document.

## 18. Source basis

This model was derived from:

- stakeholder meeting notes — 2026-08-06;
- Platforms D+ meeting notes — 2026-08-12;
- first static-prototype UX assessment — August 2026;
- latest static prototype — `Base Curricular - Explorador (offline)(3).html`;
- product decisions confirmed on 2026-09-10.
