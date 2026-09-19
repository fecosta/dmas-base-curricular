# Product Decisions — D+ Base Curricular

**Last reconciled:** 2026-09-17

## Decision register

### D-001 — Product is a shared structured curriculum-content library

**State:** DECISION

The product is not only a shared file repository.

It represents curricular knowledge as structured entities and relationships that can be explored, contributed to, reviewed, published, and maintained over time.

The product should behave primarily as a **library**, not as an LMS or course platform.

---

### D-002 — Initial curricular axes

**State:** DECISION

Initial top-level axes are:

1. Strategy & Campaign.
2. Evidence-based Public Policy.

---

### D-003 — Multi-organization contribution

**State:** DECISION

Both Democracia+ and partner organizations can contribute or suggest knowledge.

---

### D-004 — Contribution does not equal publication authority

**State:** DECISION

Content submitted by users from other organizations requires Admin review before publication.

Contribution and publication authority must remain separate.

---

### D-005 — Private network-only access

**State:** DECISION

The platform is private and intended for authorized participants from approved Democracia+ network organizations.

The initial access model uses institutional email identity and approved organization domains.

---

### D-006 — Preserve governance while adopting the newer content structure

**State:** DECISION

The newer interface/content organization may change navigation and presentation, but it must not remove or weaken established knowledge governance.

---

### D-007 — Personal itinerary is a content selection, not a learning trail

**State:** DECISION

The itinerary allows users to assemble a personal selection of modules.

It does not define mandatory order, pedagogical progression, prerequisites, enrollment, completion, or certification.

---

### D-008 — Use “Program” terminology

**State:** DECISION

The product should use **Program** terminology instead of `Ementa`.

Users may associate contributions with an existing program topic or propose a new program topic.

---

### D-009 — Institutions and materials are directly contributable knowledge objects

**State:** DECISION

Institutions/reference centers and materials/studies may be added directly rather than existing only as embedded module metadata.

---

### D-010 — Contributor identity should come from authentication

**State:** DECISION

Where possible, contributor identity and organization must be derived from the authenticated session rather than manually entered into contribution forms.

---

### D-011 — External contribution review workflow

**State:** DECISION

The baseline lifecycle is:

`Draft -> Submitted -> Under Review -> Changes Requested / Approved -> Published`

When changes are requested:

`Changes Requested -> Resubmitted -> Under Review`

Required workflow behavior:

- Admin receives an email notification when content is submitted or resubmitted.
- Admin can request changes with review notes.
- Contributor receives an email notification when changes are requested.
- Admin approves and publishes valid content.

---

### D-012 — Published content uses revision-based editing

**State:** DECISION

Published content is never modified destructively in place.

Editing published content creates a new revision that passes through review again.

The previous published revision remains active until the new revision is approved and republished.

Historical revisions must be preserved.

---

### D-013 — Lifecycle auditability is required

**State:** DECISION

The system must preserve enough history to identify significant lifecycle events and actors, including creation, edits/revisions, submission, review, requested changes, resubmission, approval, and publication.

---

### D-014 — Level and delivery format remain model metadata

**State:** DECISION

`level` and `delivery_format` may remain in the content model because they may be useful in the future.

They are **not part of the current UX contract** and do not need to be displayed.

---

### D-015 — Completeness indicator is superseded

**State:** DECISION

The module-card completeness percentage shown in earlier/static prototype behavior is not part of the approved product baseline.

Implementation should not treat it as a product requirement.

---

### D-016 — Published content is visible across the authenticated network

**State:** DECISION

For the initial product, all published content is visible to all authenticated users from approved Democracia+ network organizations.

The MVP does not require organization-specific or content-specific visibility tiers.

The architecture may preserve future extensibility, but differentiated scopes must not be implemented as current behavior without a new product decision.

---

### D-017 — Published content is archived rather than destructively deleted

**State:** DECISION

Published governed content is retired through archival.

Archived content:

- is excluded from normal browsing, discovery, and search;
- preserves revisions, provenance, review history, and audit events;
- may be restored by an Admin.

Permanent deletion of published governed content is not part of the normal workflow.

Contributors may delete their own unsubmitted drafts when no required governance history is lost.

---

### D-018 — MVP uses a single Admin governance role

**State:** DECISION

The initial product does not require separate Reviewer, Approver, Publisher, or Archivist roles.

The Admin role owns:

- review;
- change requests;
- approval;
- publication;
- archival/restoration;
- related governance administration.

The authority boundaries between Contributor and Admin must still be enforced.

---

### D-019 — Democracia+ Admin content may be published directly

**State:** DECISION

The mandatory review workflow applies to content submitted by users from other organizations.

An Admin may create and publish Democracia+ content directly without requiring approval from a second Admin.

---

### D-020 — Initial application stack

**State:** DECISION

The initial MVP stack is:

- Next.js + TypeScript;
- Tailwind CSS;
- Supabase PostgreSQL;
- Supabase Auth;
- application-level authorization + Supabase RLS;
- Supabase Storage for private files;
- Resend for workflow email;
- PostgreSQL full-text search + SQL filters;
- Vitest;
- Playwright;
- Vercel;
- Supabase Cloud.

The MVP should remain a single web application backed by managed services unless a demonstrated requirement justifies additional infrastructure.

---

### D-021 — Supabase is the central backend platform

**State:** DECISION

Supabase is selected as the central managed backend platform for:

- PostgreSQL;
- authentication;
- Row Level Security;
- private file storage.

This reduces infrastructure complexity and supports authorization at the data boundary in addition to application-level checks.

---

### D-022 — Search starts with PostgreSQL

**State:** DECISION

The MVP will use PostgreSQL full-text search and SQL filters.

A dedicated search service such as Algolia or Elasticsearch is not required initially.

Such infrastructure may be reconsidered only if demonstrated scale, relevance, or performance requirements justify it.

---

### D-023 — Resend provides governance email notifications

**State:** DECISION

Resend is selected for workflow email delivery.

Required initial notifications include:

- external contribution submission;
- contribution resubmission;
- Admin change request.

Email links remain subject to normal authentication and authorization.

---

### D-024 — Vercel is the initial application host

**State:** DECISION

The Next.js application will initially deploy to Vercel.

Supabase Cloud and Resend remain separate managed services.

---

### D-025 — Vitest and Playwright form the initial test stack

**State:** DECISION

Use:

- Vitest for unit/integration testing;
- Playwright for critical end-to-end product and authorization journeys.

---

### D-026 — Strapi evaluated but not selected for MVP

**State:** DECISION

Strapi was considered as a possible headless CMS.

It is not selected for the MVP because:

- the product requires a custom contributor and Admin experience;
- the editorial workflow is bounded and product-specific;
- Next.js + Supabase already covers the required application, persistence, identity, RLS, and storage responsibilities;
- adding a generic CMS would introduce another major backend layer without removing the need for product-specific governance logic.

Strapi or another headless CMS may be reconsidered if future editorial complexity materially exceeds the current workflow, for example through extensive generic CMS operations, multi-stage editorial teams, localization, bulk editing, scheduling, or release-management requirements.

### D-027 — Spanish is the primary product language

**State:** DECISION

Spanish is the default language of the D+ Base Curricular product experience.

The MVP must use Spanish for user-facing interface copy, forms, validation, governance workflows, notifications, and exports unless a specific requirement establishes otherwise.

The implementation must not treat English as the primary UI with Spanish postponed as future localization.

Technical implementation artifacts such as code identifiers, database names, comments, commits, and technical documentation may remain in English.

---

### D-028 — Google OAuth is the primary MVP authentication provider; Email OTP is fallback

**State:** DECISION

The MVP authentication strategy is:

- **Primary:** Google OAuth through Supabase Auth.
- **Fallback:** Email OTP through Supabase Auth.

**Rationale:** all participating Democracia+ network organizations currently use Google Workspace, so Google OAuth provides the preferred institutional sign-in experience. Email OTP is retained as a fallback authentication path.

This decision changes the **authentication user experience only**. It does not change, weaken, or redefine the authorization model established by D-005 and SPEC-001. The authoritative product-access chain remains unchanged:

`authenticated identity -> exact approved institutional domain -> explicit active membership -> active organization -> persisted Contributor/Admin role -> access`

Explicitly, none of the following may automatically create membership, organization association, or role authority:

- Google Workspace membership;
- successful Google authentication;
- email suffix/domain alone;
- OAuth provider metadata;
- JWT metadata;
- creation of a Supabase Auth identity.

Google OAuth may create a Supabase Auth identity on first successful sign-in; that identity creation alone must not grant product access. The existing organization/domain/membership/role authorization model and RLS design are not changed by this decision. Email OTP remains available as a fallback and must remain fail-closed, subject to the same eligibility checks as Google OAuth, and must not become an unrestricted signup mechanism.

Both Google OAuth and Email OTP are now implemented and hosted-validated (see `ARCHITECTURE.md` §18 and `SECURITY.md` §19). This delta was delivered on SPEC-001, now completed (see `resources/specs/completed/001-application-foundation-authentication.md`).

---

### D-029 — Governed curriculum content uses revision-capable persistence starting with SPEC-002

**State:** DECISION

`docs/CONTENT_MODEL.md` §11 conceptually distinguishes **Content** (a durable knowledge-object identity) from **Content Revision** (a versioned representation of that identity), and requires that a published revision remain stable and visible while a newer revision is under review. This distinction applies to every governed curriculum object type: Module, Program Topic, Instructor, Teaching Note, Material/Study, and Institution/Reference Center.

SPEC-003 (contribution), SPEC-004 (review/approval/publication), and SPEC-005 (revisions/audit/archival) all assume this distinction already exists as a persistence capability. If SPEC-002 instead persisted governed curriculum content as flat, non-revisionable rows, introducing revision history later would require a destructive schema migration after production curriculum data already exists and is already being read.

**Decision:** governed curriculum persistence must, from its initial implementation in SPEC-002, support the following invariant:

- each governed object has a stable identity that survives across revisions;
- the persisted representation can resolve exactly one current published revision per identity;
- a published revision remains stable and reader-visible while a later draft/review revision may coexist for the same identity;
- SPEC-002 itself creates and exposes only already-published revisions (one published revision per identity is sufficient at this stage) and implements no contribution, review, approval, revision-authoring, or audit workflow — those remain SPEC-003/004/005 responsibilities.

This decision fixes the durable invariant, not the physical schema. Table normalization, join structure, and storage representation of the revision payload remain implementation freedom, provided the invariant above holds without requiring a destructive redesign when SPEC-003–005 are implemented.

This decision does not change product scope, visibility rules, or any SPEC-002 acceptance criterion beyond requiring that its persistence choice satisfy the invariant above. See `resources/specs/completed/002-core-curriculum-library.md` and `docs/ARCHITECTURE.md` §9.

---

### D-030 — Initial operational phase uses Admin-only content management

**State:** DECISION  
**Date:** 2026-09-14

The initial operational phase of Base Curricular simplifies the active knowledge-governance model.

For this phase, governed curriculum content is managed exclusively by Admins.

An eligible Admin may:

- create governed content;
- edit unpublished Drafts;
- create later Draft revisions from published content;
- manage permitted relationships and attachments;
- publish valid revisions.

Admin Draft authority is role-wide rather than creator-owned.

Any currently eligible Admin may access and edit any active Admin-managed Draft, regardless of which Admin originally created the content or revision. `created_by` and creation-time organization remain immutable provenance; they do not create exclusive mutation authority.

Revoking Admin authority removes Draft-management authority on the next authoritative request, including for Drafts originally created by that user.

Eligible authenticated non-Admin users are readers only for governed curriculum content.

They may access current published content but may not create, edit, submit, review, approve, or publish governed content.

The active lifecycle for new content is therefore:

`Draft -> Published`

For changes to already-published content:

`Published v1 -> Draft v2 -> Published v2`

While `v2` remains Draft, `v1` remains the current published revision visible to ordinary readers.

Published revisions remain immutable and historical revisions remain preserved.

The following collaborative-governance workflow is deferred:

`Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

Accordingly, the initial operational phase does not require:

- Contributor authoring;
- submission/resubmission;
- review queues;
- review comments;
- changes requested;
- approval;
- workflow email notifications.

This decision temporarily supersedes the active operational application of D-003, D-004, D-011, D-018, D-019, and D-023 where those decisions require collaborative contribution or review behavior.

Those earlier decisions remain part of the product decision history and may inform a future collaborative-governance phase.

D-012's revision-stability principle remains authoritative, but the active revision workflow is simplified from review-based revisioning to Admin-managed revisioning.

D-013's auditability requirement remains authoritative for lifecycle events that actually occur during the active phase.

D-016 remains unchanged: all current published content is visible across the eligible authenticated network.

D-017 remains unchanged: published governed content is archived rather than destructively deleted.

D-029 remains unchanged: stable content identity and revision-capable persistence remain foundational architecture.

SPEC-003 remains a completed implementation record. Its persistence and provenance foundations must not be destructively removed merely because Contributor authoring is temporarily inactive.

The current implementation must instead enforce the new authority boundary:

`Admin = role-wide governed-content writer/publisher`

`non-Admin = published-content reader`

Reactivation of collaborative contribution, review, approval, or related workflow notifications requires a later explicit product decision/specification.

---

## Current delivery state

`SPEC-006` — Explorer UX/UI Fidelity & Interaction Layer is completed at `resources/specs/completed/006-explorer-ux-ui-fidelity.md`. No specification is currently active or planned.

SPEC-006 raises the interface fidelity of the surfaces SPEC-001 through SPEC-005 delivered. It is bounded to UX/UI: it does not alter product scope, authorization, governance lifecycle, publication authority, archival, audit history, data semantics or security, and it introduces no database change. Where its UX reference conflicts with an implemented contract, the contract wins.

Activating it is governance bookkeeping under the repository methodology, not a new product decision.

Its six implementation phases are completed. Validation confirmed the boundaries it was required to preserve: Admin-only governed-content mutation, the non-Admin published reader boundary, `Draft -> Published`, successor revisions leaving the published version current, published-revision immutability, and archival/restoration semantics. No migration, RLS policy, governance RPC, Storage rule, role or lifecycle state was added or changed. Personal Itinerary and a prototype `Guía` capability both remain outside the delivered slice, and no review workflow was reintroduced.

---

## Delivery history

### G-001 — SPEC-001 Application Foundation & Authentication

**State:** COMPLETED — IMPLEMENTATION, INDEPENDENT REVIEW, AND HOSTED VALIDATION VERIFIED

The completed specification at `resources/specs/completed/001-application-foundation-authentication.md` covers:

- Next.js application foundation;
- Supabase project integration;
- Supabase Auth;
- approved-domain and organization eligibility;
- Contributor/Admin role model;
- initial RLS policies;
- protected application shell;
- test foundation with Vitest and Playwright;
- initial Vercel deployment;
- required documentation updates.

The specification contains observable acceptance criteria, all of which are now satisfied. Its foundation implementation has passed local unit, SQL/RLS, browser, and production-build checks, independent security/RLS review, a narrow fix re-review, and merge/commit review. The SPEC-001 identity migration has also been applied to the intended Supabase Cloud project, with Cloud RLS/grants/ownership/security-definer posture and baseline email/Auth settings inspected. The Google OAuth application flow is implemented; Supabase Cloud OAuth configuration, a real hosted Google round trip, hosted OTP validation (including institutional SMTP delivery through Resend), and Vercel deployment have all been verified against the deployed application at `https://dmas-base-curricular.vercel.app`.

App Router organization, normalized identity tables, and operator-managed provisioning were selected within SPEC-001 implementation freedom and remain current. Email-code (OTP) login was originally selected as first-implementation freedom; D-028 has since fixed the approved provider mix as Google OAuth (primary) with Email OTP (fallback), so the login-provider mix is no longer open implementation freedom. SPEC-001 delivered that narrow authentication-strategy delta and is now completed. No additional product roles, visibility tiers, or product-scope decisions were introduced by either the original implementation or D-028. Long-duration session-expiry/renewal behavior, browser coverage beyond Chromium, an untested OTP pre-registration variant, and operational rate-limit monitoring remain open, non-blocking follow-ups (see the completed spec).

---

### G-002 — SPEC-002 Core Curriculum Library

**State:** COMPLETED — IMPLEMENTATION, INDEPENDENT VERIFICATION, CLOUD APPLICATION, AND HOSTED VALIDATION VERIFIED

A pre-activation review (2026-09-11) found SPEC-002 required narrow spec edits rather than a product decision, plus the persistence-architecture decision recorded as D-029. Those edits were reconciled directly in the specification, D-029 was recorded above, and the specification then moved from planned to active before implementation.

SPEC-002 was implemented in commit `23564067774ba9ec314fbdace3733f34d096e142`. Local validation passed migration replay, database/RLS tests, DB lint, unit/integration tests, typecheck, lint, production build, and development/production browser journeys. Independent adversarial review found no merge blocker and all 22 acceptance criteria passed; its narrow correction pass was independently re-reviewed successfully.

Migration `20260911000100_core_curriculum_library.sql` was the sole proposed Cloud delta, was applied to the intended `dmas-base-curricular` Supabase project (`qcxcgwpfgclyebkxawyh`), and was confirmed in remote migration history. Cloud schema, D-029 persistence, search indexes, RLS, grants, function security, axes, and private-schema isolation were verified. Vercel served the implementation commit and hosted Google OAuth, Email OTP, eligible library access, authenticated-ineligible denial, and protected caching posture were validated. A legacy privileged API-key exposure discovered during validation was remediated by verifying modern publishable/secret-key consumers and disabling the legacy anon/service-role family before closure.

Real module/reference population remains an operational content-owner activity and was intentionally not performed. This does not block completion of the implementation specification.

---

### G-003 — SPEC-003 Content Contribution

**State:** COMPLETED — IMPLEMENTATION, INDEPENDENT VERIFICATION, CLOUD APPLICATION, AND HOSTED VALIDATION VERIFIED

SPEC-003 is completed at `resources/specs/completed/003-content-contribution.md`. Implementation commit `e50feabc698e29c7bac6cf8b33e98b2a0cbfce20` passed final local validation, independent adversarial review, corrective re-review with PASS verdict, Supabase Cloud migration/security/Storage verification, and hosted functional validation. Its Draft creation/editing and `Draft -> Submitted` capability remains historical implementation foundation; D-030 and completed SPEC-004 make non-Admin contribution inactive and establish Admin-only publication authority.

---

### G-004 — SPEC-004 Admin Content Management & Publication

**State:** COMPLETED — IMPLEMENTATION, INDEPENDENT VERIFICATION, CLOUD APPLICATION, CONTROLLED INTEGRATION ACCEPTANCE, AND DEPLOYMENT VERIFIED

SPEC-004 is completed at `resources/specs/completed/004-admin-content-management-publication.md`. Independently reviewed Phases 1–4 provide Admin-only and Admin-wide Draft management, direct publication, successor revisions, non-Admin mutation shutdown, and private current-published attachment reads.

The four SPEC-004 migrations are applied to Supabase Cloud project `qcxcgwpfgclyebkxawyh`. Preservation inventory found historical SPEC-003 Draft/Submitted data but no duplicate Draft conflict; post-migration inspection confirmed the intended functions, grants, RLS, partial unique indexes, private bucket, and Storage policies without transforming that history.

Multi-user and disposable-content acceptance ran against the real local Supabase/application/browser stack rather than production. This was required because production lacked two safe Admin accounts plus a reader and had no supported cleanup lifecycle for fictional Published validation content. Production separately serves deployment commit `9dfd852345d42d5d628c0837d10692f95758ef2b`, and safe anonymous smoke checks remained fail-closed. This validation-governance clarification changes no product or authorization decision.

---

### G-005 — SPEC-005 Audit History & Archival

**State:** COMPLETED — IMPLEMENTATION, INDEPENDENT VERIFICATION, CLOUD MIGRATION/SECURITY VERIFICATION, AND LOCAL REAL-STACK FUNCTIONAL ACCEPTANCE VERIFIED

SPEC-005 is completed at `resources/specs/completed/005-audit-history-archival.md`. It delivers Admin-only, identity-level archival and restoration with a bounded lifecycle-history boundary: `Archived` is not a revision status, the current `Published` revision and `current_published_revision_id` survive archival, an active Draft or an active current-published dependent blocks archival, archival never cascades, and restore revalidates the published-dependency contract before clearing archival state.

The implementation sequence is:

- `fc7b2ef` — Phase 1 archive/restore RPCs, dependency and active-Draft guards, lifecycle-history boundary (`20260915000200`);
- `b6e852a` — Phase 2A Admin-only archived-content read boundary and history organization attribution (`20260916000100`);
- `aa90339` — deterministic three-part archived keyset correction (`20260916000200`), after independent review found the two-part cursor was not a total order across identity tables that may share a UUID;
- `d5506da` — Phase 2B+C application query layer, Archive/Restore server actions and Admin Archived/History UX.

Each phase passed independent review before the next began.

**Validation evidence split accepted for closure.**

Production Supabase Cloud project `qcxcgwpfgclyebkxawyh` is authoritative for migration, schema and security posture. All ten migrations report `local == remote`; the archived-list RPC exists only in its final five-argument form with no obsolete four-argument overload; the four SPEC-005 RPCs are `SECURITY DEFINER` with `search_path = ''`, owned by `postgres`, revoked from `PUBLIC` and granted `EXECUTE` only to `authenticated`, with `anon` and `service_role` holding none; the RLS policy set is byte-identical before and after migration; `curriculum_lifecycle_events` remains ungranted to application roles; and the governed-attachment reader gate still requires a non-archived current-published identity.

Functional acceptance of Archive, Restore, History, reader isolation, attachment isolation, dependency guards, the active-Draft guard, cross-Admin authority, non-Admin denial, live role revocation and archived keyset pagination was performed on the complete local real stack — real Supabase Auth, PostgreSQL, RLS, Storage, Next.js and Chromium — not against production.

Functional mutation of production was deliberately avoided. Production contains real organizations and real Admin identities, and `curriculum_lifecycle_events` is append-oriented governance evidence with no delete path and an `ON DELETE RESTRICT` actor reference. Archiving production content to generate test evidence would therefore write permanent lifecycle events attributed to real people and permanently pin the acting identity, degrading the trustworthy actor attribution that SPEC-005 exists to provide. Fabricating governance history to prove governance history is self-defeating.

This is an operational validation-governance decision. It changes no archival semantics, authorization boundary, reader contract or product behavior, and it is not a precedent for skipping Cloud security verification, which remained mandatory and passed.

---

### G-006 — SPEC-006 Explorer UX/UI Fidelity & Interaction Layer

**State:** COMPLETED — SIX PHASES, INDEPENDENT VERIFICATION, AND VALIDATION VERIFIED

SPEC-006 is completed at `resources/specs/completed/006-explorer-ux-ui-fidelity.md`. Phases 1–6 were completed, with each phase independently reviewed before progression. The final implementation and validation commit is `116457eb401914788705d6370b68d350f38b09f6`; the final independent review returned `PASS — SPEC-006 READY FOR CLOSURE TASK`, with no merge blockers or fixes required.

Validation covered 385 unit/integration tests, typecheck, lint, production build, 75 development E2E journeys, 75 production-mode E2E journeys, the recorded responsive viewport matrix, keyboard and accessibility behavior, and removal of the temporary development primitives harness after its unique coverage moved to production surfaces. Durable documentation and the approved UX reference relationship were reconciled. The implementation preserved the product, data, authorization, security and governance contracts: no migration, RLS, governance RPC, Storage, authentication, role or lifecycle change was introduced. Personal Itinerary remains approved but separately delivered, and Guide remains outside the delivered scope.

---

## Product Coherence OS state

Current overall state:

**COHERENCE VERIFIED — SPEC-001 THROUGH SPEC-006 COMPLETED**

SPEC-001 through SPEC-006 are completed with implementation, independent verification, and their applicable Cloud/deployment/acceptance gates reconciled. SPEC-006 closed as **COHERENCE VERIFIED**: product intent, specification, implementation, authorization/security boundaries, validation, UX reference, and durable documentation are reconciled under the evidence recorded in G-006. Personal Itinerary remains an approved but separately delivered capability.

No specification is currently active or planned. The completed SPEC-006 interface-fidelity slice does not reopen the contracts reconciled above, and no Guide capability was delivered.
