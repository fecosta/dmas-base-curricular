# Product Decisions — D+ Base Curricular

**Last reconciled:** 2026-09-12

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

## Decision gates still open

There are no known product-baseline or stack-selection blockers preventing preparation of the first implementation specification.

Implementation-specific details that do not change an established product contract may be resolved in the implementation specification or by the implementation agent.

If a technical constraint requires changing product behavior, data semantics, governance, security boundaries, or authority, work must return to a product decision.

---

## Next delivery gate

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

**State:** ACTIVATED — PENDING IMPLEMENTATION AND VERIFICATION

SPEC-003 is active at `resources/specs/active/003-content-contribution.md` because its SPEC-002 dependency is satisfied and no product blocker is known. Activation does not authorize publication behavior: Contributor drafts and submission must preserve the existing D-029 model and must not grant publication authority. The future trusted/workflow-aware publication write path remains a SPEC-004 concern.

---

## Product Coherence OS state

Current overall state:

**DECISION READY — PRODUCT AND INITIAL STACK CONFIRMED**

SPEC-001 and SPEC-002 are completed with implementation, independent verification, and required Cloud/hosted validation reconciled. SPEC-003 — Content Contribution is now the active delivery slice; its implementation has not begun. SPEC-004, SPEC-005, and SPEC-006 remain planned.
