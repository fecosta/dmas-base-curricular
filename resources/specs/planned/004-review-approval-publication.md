# SPEC-004 — Review, Approval & Publication

**Status:** PLANNED  
**Depends on:** SPEC-003

## 1. Purpose / Objective

Implement the Admin governance workflow for reviewing external contributions, requesting changes, approving valid revisions, publishing them, and sending required email notifications.

## 2. Current State

The governance workflow is defined in documentation but does not exist in production.

## 3. Problem / Gap

External Contributors can submit content only if an Admin can securely review and control publication.

## 4. Decision

The baseline external workflow is:

`Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

A valid submission may also move:

`Under Review -> Approved -> Published`

Required notifications:

- submission/resubmission -> Admin;
- changes requested -> Contributor.

The MVP uses one `Admin` role for review, approval, and publication.

An Admin may create and publish Democracia+ content directly.

All published content is visible to all authenticated eligible network users.

## 5. Scope

### In Scope

- Admin review queue;
- direct review links;
- review detail surface;
- review comments/notes;
- request-changes action;
- Contributor visibility of review feedback;
- resubmission path;
- approval action;
- publication action;
- valid server-enforced state transitions;
- Resend notifications for required events;
- Admin direct publication of Democracia+ content;
- publication visibility to the authenticated network;
- RLS/authorization for pending content;
- tests for governance authority boundaries.

### Out of Scope

- editing already-published content into a new revision (SPEC-005);
- archive/restore (SPEC-005);
- audit-history UI beyond data needed for workflow;
- multi-reviewer roles;
- organization-specific publication scope;
- content sensitivity tiers;
- scheduled publication.

## 6. Expected Behavior

- Admin receives a review notification after external submission/resubmission;
- Admin can open the relevant pending revision;
- Admin can request changes with notes;
- Contributor receives a notification and can see required adjustments;
- Contributor can resubmit;
- Admin can approve valid content;
- Admin can publish approved content;
- only published revisions become visible to ordinary authenticated readers;
- invalid lifecycle jumps are rejected server-side/data-side;
- Admin can directly publish Democracia+ authored content.

## 7. Constraints

- Resend is the email provider;
- email links do not grant authorization;
- review comments remain attributable and timestamped;
- Contributors cannot approve or publish;
- all published content is network-wide in the MVP;
- no separate Reviewer/Publisher role.

## 8. Impact Surface

- Admin UI;
- Contributor feedback UI;
- workflow state machine;
- Resend integration;
- RLS/authorization;
- publication queries.

## 9. Acceptance Criteria

1. Submission triggers an Admin email containing a secure application link.
2. Resubmission triggers an Admin email.
3. Only Admins can access Admin review actions.
4. An Admin can request changes and must be able to record review notes.
5. Requesting changes triggers a Contributor email notification.
6. The Contributor can view review feedback for their contribution.
7. The Contributor can resubmit after making adjustments.
8. An Admin can approve a valid pending revision.
9. An Admin can publish an approved revision.
10. A Contributor cannot approve or publish through UI, API, or direct data access.
11. A published revision becomes readable to authenticated eligible network users.
12. Pending/unapproved revisions remain hidden from ordinary readers/search.
13. Invalid lifecycle transitions are rejected.
14. An Admin can create and directly publish Democracia+ content.
15. Email possession alone does not bypass authentication/authorization.
16. Tests cover the complete happy path plus change-request/resubmission and unauthorized transition attempts.

## 10. Implementation Freedom

Implementation may choose queue layout, comment UX, exact state-machine organization, transactional implementation, and email template design while preserving confirmed lifecycle semantics.

## 11. Knowledge Updates Required

- reconcile verified lifecycle implementation with `docs/GOVERNANCE.md`;
- update architecture notification details;
- move spec after verification.

## 12. Open Questions / Blockers

The initial Admin notification destination/routing must be configured operationally. This is not a product blocker if the implementation provides an explicit configurable destination or Admin-recipient mechanism.
