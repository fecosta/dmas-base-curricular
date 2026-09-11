# Product Decisions — D+ Base Curricular

**Last reconciled:** 2026-09-11

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

As of this decision, only Email OTP is implemented (see `ARCHITECTURE.md` §18 and `SECURITY.md` §19). Google OAuth provider configuration and implementation are tracked as an active authentication-strategy delta on SPEC-001 (see `resources/specs/active/001-application-foundation-authentication.md`).

---

## Decision gates still open

There are no known product-baseline or stack-selection blockers preventing preparation of the first implementation specification.

Implementation-specific details that do not change an established product contract may be resolved in the implementation specification or by the implementation agent.

If a technical constraint requires changing product behavior, data semantics, governance, security boundaries, or authority, work must return to a product decision.

---

## Next delivery gate

### G-001 — SPEC-001 Application Foundation & Authentication

**State:** ACTIVE SPECIFICATION — IMPLEMENTATION AWAITING INDEPENDENT REVIEW

The active specification at `resources/specs/active/001-application-foundation-authentication.md` covers:

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

The specification contains observable acceptance criteria. Its foundation implementation has passed local unit, SQL/RLS, browser, and production-build checks, independent security/RLS review, a narrow fix re-review, and merge/commit review. The SPEC-001 identity migration has also been applied to the intended Supabase Cloud project, with Cloud RLS/grants/ownership/security-definer posture and baseline email/Auth settings inspected. The Google OAuth application flow is implemented; Supabase Cloud OAuth configuration, a real hosted Google round trip, hosted OTP validation, and Vercel deployment verification remain pending.

App Router organization, normalized identity tables, and operator-managed provisioning were selected within SPEC-001 implementation freedom and remain current. Email-code (OTP) login was originally selected as first-implementation freedom; D-028 has since fixed the approved provider mix as Google OAuth (primary) with Email OTP (fallback), so the login-provider mix is no longer open implementation freedom. SPEC-001 remains active to deliver that narrow authentication-strategy delta. No additional product roles, visibility tiers, or product-scope decisions were introduced by either the original implementation or D-028.

---

## Product Coherence OS state

Current overall state:

**DECISION READY — PRODUCT AND INITIAL STACK CONFIRMED**

SPEC-001 is the active bounded delivery slice and remains active pending independent review and required hosted validation. This implementation report does not close the product-coherence or specification-completion gate. Planned specifications require their own dependency checks and activation.
