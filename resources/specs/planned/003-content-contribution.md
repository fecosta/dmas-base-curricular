# SPEC-003 — Content Contribution

**Status:** PLANNED  
**Depends on:** SPEC-002

## 1. Purpose / Objective

Allow authenticated Contributors from approved partner organizations to create governed content and submit it for Admin review without granting publication authority.

## 2. Current State

The static prototype demonstrates contribution forms, but contributions are browser-local and do not implement the approved governance lifecycle.

## 3. Problem / Gap

The product's collaboration model requires partner organizations to add knowledge, but there is no durable, authenticated, governed contribution mechanism.

## 4. Decision

Partner-organization users may contribute:

- modules;
- program topics;
- instructors;
- teaching notes/materials;
- institutions/reference centers;
- materials/studies.

Contributor identity and organization come from trusted authenticated context.

External contributions do not become published automatically.

## 5. Scope

### In Scope

- contribution entry points;
- create/edit unsubmitted drafts;
- submit drafts for review;
- associate content with existing modules/topics as appropriate;
- propose a new program topic;
- create new governed content objects;
- derive contributor identity/organization from auth context;
- Contributor ownership/access rules;
- initial content/revision persistence required for submission;
- private file attachment foundation using Supabase Storage where contribution type needs attachments;
- validation and error handling;
- RLS for contributor-owned drafts/pending revisions.

### Out of Scope

- Admin review UI;
- change-request comments;
- approval/publication actions;
- review emails;
- published-content revision workflow;
- audit-history UI;
- personal itinerary.

## 6. Expected Behavior

- eligible Contributors can create content drafts;
- contributors do not manually establish their own identity/provenance;
- drafts remain unpublished;
- contributors can edit their own eligible unsubmitted drafts;
- contributors can submit a valid draft for review;
- submitted content becomes unavailable for unauthorized destructive mutation according to the workflow contract;
- a Contributor cannot publish content;
- files associated with drafts are not publicly accessible.

## 7. Constraints

- governed content uses the revision model;
- authorization must be enforced in Next.js and/or RLS, not only UI;
- external contributor publication is forbidden;
- private files use Supabase Storage;
- no public bucket for governed attachments;
- program topics proposed by Contributors are governed content.

## 8. Impact Surface

- contribution UI;
- content/revision persistence;
- Supabase Storage;
- RLS;
- validation;
- provenance metadata.

## 9. Acceptance Criteria

1. A Contributor can create a draft for each contribution type included in scope.
2. The draft records authenticated contributor identity and organization without manual identity entry.
3. A Contributor can edit a permitted unsubmitted draft.
4. A Contributor cannot edit another Contributor's private draft without explicit authorized capability.
5. A Contributor can submit a valid draft for review.
6. Submission produces the appropriate governed status for SPEC-004 to review.
7. Submission does not publish the content.
8. A Contributor cannot force published status through client manipulation or direct data requests.
9. New program-topic proposals enter governance rather than silently altering published program structure.
10. Governed file attachments are private and inaccessible to unauthorized users.
11. Validation prevents structurally invalid contributions from being submitted.
12. Tests cover ownership, submission, publication denial, and attachment access where applicable.

## 10. Implementation Freedom

Implementation may choose form architecture, validation library, draft autosave behavior, and exact revision payload representation as long as governance semantics remain unchanged.

## 11. Knowledge Updates Required

- reconcile physical contribution/revision model with `docs/CONTENT_MODEL.md`;
- update `docs/ARCHITECTURE.md` with verified Storage and contribution implementation details;
- move spec after verification.

## 12. Open Questions / Blockers

No known product blocker. Exact field requirements for each content type may be refined from the static prototype and canonical content model, but material semantic changes require a product decision.
