# Base Curricular — Knowledge Governance

**Status:** Governance core confirmed  
**Last reconciled:** 2026-09-10

## 1. Purpose

Base Curricular is collaborative, but collaboration does not imply automatic publication.

Knowledge governance exists to make the shared base trustworthy, maintainable, attributable, and safe for collaboration across organizations.

This document defines the active governance contract for contributions, review, revisions, approval, publication, provenance, and audit history.

## 2. Governance principles

1. **External contributions require review before publication.**
2. **Contribution does not equal publication authority.**
3. **Contributor identity and organization must be preserved.**
4. **Review decisions must be auditable.**
5. **Published content must remain stable while updates are reviewed.**
6. **Review feedback must be visible to the contributor responsible for the revision.**
7. **Publication is an Admin action.**
8. **Permissions applied at publication must respect the content's required access level.**
9. **Governance state must not be confused with content taxonomy.**
10. **Current published knowledge must remain distinguishable from drafts, pending revisions, and historical versions.**

## 3. Roles

### Contributor

A user from an approved organization who can contribute knowledge.

A Contributor may:

- create content;
- edit their draft or revision;
- submit content for review;
- receive review comments;
- make requested adjustments;
- resubmit content.

A Contributor must not publish externally governed content directly.

### Admin

An authorized Democracia+ administrator responsible for review and publication.

An Admin may:

- access submitted content;
- review a revision;
- add review comments;
- request changes;
- approve content;
- publish approved content;
- assign the permissions required for publication.

Additional roles may be introduced later, but these authority boundaries must be preserved.

For the initial product, review, approval, publication, archival, and platform governance responsibilities remain consolidated in the single **Admin** role. A separate Reviewer or Publisher role is not required.

## 4. Initial approval scope

At the initial stage, **all content submitted by users from other organizations requires Admin approval before publication**.

This is the default policy regardless of content type.

The product may support differentiated governance rules in the future.

### Democracia+ / Admin-authored content

An Admin may create and publish Democracia+ content directly.

The mandatory external-contribution review cycle applies to submissions made by users from other organizations.

## 5. New-content workflow

### State flow

`Draft -> Submitted -> Under Review -> Approved -> Published`

or, when adjustments are required:

`Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

### Step-by-step behavior

1. A Contributor creates new content.
2. The Contributor submits the content.
3. The revision enters the review queue.
4. An Admin receives an email notification with a direct link to the content or review surface.
5. The Admin reviews the contribution.
6. The Admin either:
   - approves it; or
   - requests changes and records review notes.
7. When changes are requested, the Contributor receives an email notification.
8. The Contributor makes the requested adjustments while preserving review history.
9. The Contributor resubmits.
10. An Admin is notified again.
11. The Admin reviews the updated submission.
12. When accepted, the Admin approves it.
13. The Admin publishes the approved content with the appropriate permissions.

## 6. Published-content revision workflow

Published content is never edited destructively in place.

### State flow

`Published v1 -> Draft Revision v2 -> Submitted -> Under Review -> Approved -> Published v2`

When changes are requested:

`Published v1 -> Draft Revision v2 -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published v2`

### Stability rule

While revision `v2` is under review:

- `v1` remains the active published version;
- ordinary users continue to see `v1`;
- `v2` is visible only to actors permitted to participate in its contribution/review workflow.

Once `v2` is published:

- it becomes the current published revision;
- `v1` remains preserved in history.

## 7. Review comments

When an Admin requests adjustments:

- comments must be associated with the revision being reviewed;
- comments must identify the Admin who created them;
- comments must preserve their timestamp;
- comments must remain in history after resubmission;
- the Contributor must be able to identify what needs to change.

Whether comments support threads, field-level anchors, or simple revision-level notes is an implementation choice unless later specified.

## 8. Notifications

Email is part of the baseline governance workflow.

**Initial delivery provider: Resend.**

The notification provider is an implementation mechanism and does not hold workflow or authorization authority.

### Required notification events

**Contributor submits**
- recipient: Admin or configured review destination;
- contains: link to the submitted content or review page.

**Admin requests changes**
- recipient: Contributor;
- contains: indication that adjustments are required and a link to the content/revision.

**Contributor resubmits**
- recipient: Admin or configured review destination;
- contains: link to the resubmitted content.

Other notification events, such as publication confirmation, may be added later but are not currently required.

## 9. Provenance

Every governed content lifecycle must preserve, where applicable:

- content creator;
- contributor organization;
- revision author(s);
- source/reference;
- creation time;
- submission time;
- reviewer;
- review time;
- review outcome;
- review comments;
- resubmission events;
- approver;
- approval time;
- publisher;
- publication time.

Where possible, identity metadata must be derived from the authenticated user rather than manually entered.

## 10. Audit log

The platform must maintain an append-oriented history sufficient to reconstruct significant content lifecycle events.

At minimum, the history should represent events equivalent to:

- `content_created`
- `revision_created`
- `content_submitted`
- `review_started` — if explicitly modeled
- `changes_requested`
- `revision_edited`
- `content_resubmitted`
- `content_approved`
- `content_published`

Future events may include:

- `content_unpublished`
- `content_archived`
- `permission_changed`

The exact event-store implementation is a technical decision.

## 11. Publication and permissions

Approval and publication are distinct concepts.

**Approval** means the Admin considers the submitted revision valid.

**Publication** means the approved revision becomes available to its intended audience with the required access permissions.

This distinction allows the system to support sensitive content and differentiated access later without changing review semantics.

The current platform remains private and network-only.

For the initial product, all published content is visible to all authenticated users from approved network organizations. Organization-specific or content-specific publication scopes are not part of the MVP.

## 12. Change governance

Changes that alter any of the following require explicit product authority:

- meaning of a content type;
- taxonomy or axis structure;
- publication/review rules;
- ownership semantics;
- visibility/access boundaries;
- deletion versus archival behavior;
- authoritative relationship types.

Routine implementation details that preserve these contracts may be decided technically.

## 13. Deletion and archival

Published governed content is retired through **archival**, not permanent deletion.

When an Admin archives published content:

- it is removed from normal browsing, discovery, and search;
- its revisions, provenance, review history, and audit events remain preserved;
- it may be restored by an Admin.

Permanent destructive deletion of published governed content is not part of the normal product workflow.

A Contributor may delete their own unsubmitted draft when doing so does not erase required governance or audit history.

## 14. Governance boundaries

This workflow governs content publication. It does not define:

- curriculum learning order;
- user enrollment;
- certification;
- course completion;
- learning progress.

The personal itinerary is outside the editorial lifecycle except where the selected underlying content itself is governed.

## 15. Future governance flexibility

The architecture may support future policies such as:

- trusted organizations with simplified approval;
- content-specific sensitivity levels;
- multiple reviewer groups;
- differentiated publication scopes.

These are future possibilities, not current product requirements.

## 16. Knowledge reconciliation

When the product evolves:

1. verify implemented behavior;
2. update current-state documentation;
3. preserve historical reasoning separately;
4. remove or mark contradictory active guidance;
5. keep future concepts clearly labeled as future;
6. ensure the interface, data semantics, governance rules, and docs describe the same product.

## 17. Superseded document

This document supersedes the former active `KNOWLEDGE_GOVERNANCE.md`.

If that file is retained, it should be moved to an archive/history location and must not be treated as authoritative current guidance.

## 18. Source basis

This governance baseline was derived from:

- stakeholder meeting notes — 2026-08-06;
- Platforms D+ meeting notes — 2026-08-12;
- first static-prototype UX assessment — August 2026;
- latest static prototype — `Base Curricular - Explorador (offline)(3).html`;
- governance decisions confirmed on 2026-09-10.
