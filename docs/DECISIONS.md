# Product Decisions — D+ Base Curricular

**Last reconciled:** 2026-10-26

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

### D-031 — MVP analytics accepts PostHog's one-year query-retention boundary

**State:** SUPERSEDED by D-032 (2026-10-21) — historical record only. Formerly: DECISION (Product Owner + Privacy/Legal for controlled validation only)
**Date:** 2026-10-07

*Superseded: PostHog is no longer the approved analytics provider. The Gate B authorization below was never executed and must not be executed. See D-032.*

For the MVP/pilot, Base Curricular accepts PostHog's one-year Product Analytics query-retention boundary as a known limitation.

This replaces, for the MVP, the SPEC-008 requirement that applicable optional analytics personal data be physically/enforceably deleted within 12 months. That proof is no longer a prerequisite for MVP analytics activation or for Gate B.

The decision does not establish or claim physical deletion within 12 months, deletion from cold storage or backups, a provider-enforced TTL, or an enforceable physical-deletion SLA. Query retention must not be described as physical deletion.

Enforceable physical deletion is deferred, not abandoned. It must be reassessed before analytics becomes a materially expanded or long-term capability, including before: making analytics a permanent strategic capability; materially expanding the event taxonomy; collecting more identifying or sensitive properties; introducing Person Profiles or `identify()`; adding anonymous/device identity; enabling exports or destinations; enabling additional PostHog behavioral products; or materially changing provider or processing architecture.

The decision changes retention/deletion assurance and gate proportionality only. It does not weaken optional, default-OFF, explicit opt-in consent separate from Terms; user ownership of the preference with no Admin override; the six-event taxonomy; the raw-search prohibition; property minimization; profile-free analytics with no `identify()`, `$identify`, anonymous linkage, Person Profiles or extra persistent identity; the raw-IP and GeoIP prohibitions; the absence of autocapture, Session Replay and heatmaps; the forwarding/export prohibition; Production-only isolation; failure isolation; no retry/queue/buffering/replay; or revocation behavior.

**Privacy/Legal decision (2026-10-07): A — APPROVED FOR CONTROLLED MVP VALIDATION.** This approval is limited to bounded Gate B validation using the current six-event taxonomy, profile-free identity model, data-minimization contract, PostHog Cloud EU, and current provider privacy/security posture. Privacy/Legal accepts PostHog's one-year Product Analytics query-retention boundary as a known MVP limitation for this validation, without any claim of guaranteed physical deletion within one year.

This approval does not authorize unrestricted production analytics, external MVP activation, new events or properties, Person Profiles, `identify()`, anonymous/device tracking, GeoIP, autocapture, Session Replay, heatmaps, exports/destinations, or other PostHog products. Privacy/Legal reconciliation for external activation — including whether the Privacy Notice's “12 meses” wording must change — remains required under SPEC-008 §12.2 and §21. The Privacy Notice, `privacyNoticeVersion`, and `consentVersion` remain unchanged.

---

### D-032 — MVP measurement uses GA4 for navigation and Supabase for organizational adoption

**State:** DECISION (Product Owner) — Privacy/Legal approvals PENDING
**Date:** 2026-10-21

The MVP measurement model answers two questions: how people navigate Base Curricular (Navigation) and which organizations use it and how often (Adoption).

- **Navigation:** Google Analytics 4, optional, explicit opt-in, default OFF, Production-only, loaded only after server-verified persisted consent. GA4 receives no names, emails, Supabase UUIDs, organization identifiers, search text, query strings, content titles or private document names. Google Signals, ads personalization, User-ID, User-Provided Data, enhanced measurement and data sharing are OFF. Reports stay in the GA4 UI.
- **Adoption:** Supabase server-side organization-level metrics (registered users, active users in a period, content opens, downloads) derived from the existing organization/membership model, stored as daily aggregate counts plus a minimal per-user-per-day presence marker, readable only by live Admins through a security-definer function returning one row per organization.
- **Dashboard:** one minimal Admin view with Organization, Registered users, Active users during selected period, Content opens, Downloads.

**Amendment (2026-10-21, review remediation; Product Owner).**

- *Recording boundary.* Usage is recorded only inside trusted server-side operations, after the operation succeeded: authorized resolution of current published content (`content_open`), authorized signed-URL issuance (`download`), authenticated `/app` render (presence). The write function `public.record_usage(target_user_id, metric)` is `SECURITY DEFINER`, revoked from `PUBLIC`/`anon`/`authenticated`, executable only by `service_role`, and called only from one `server-only` recorder module with a dedicated server-only secret key (not the Auth Admin key), taking the user ID solely from the server-verified access context. Organization, eligibility and Admin exclusion are derived in the database from live rows with the `current_access()` predicate; no client-supplied organization is accepted. Rejected: an `authenticated`-executable RPC (forgeable by any signed-in user), recording inside the existing published read RPCs (still session-triggerable; cannot cover Storage signed URLs), reusing the Auth Admin key (contradicts its documented contract). Recording fails open for the user, is not retried, and logs no personal data; a failure is an undercount.
- *Definitions.* Content open = successful authorized server-side resolution of current published content, not proof of reading. Download = successful authorized signed-URL issuance, not proof of transfer. Periods are whole UTC days, start and end inclusive, max 90 days, default the 30 days ending today.
- *Admin exclusion.* Actions by a user whose live persisted role is `Admin` are not recorded for adoption metrics (opens, downloads, active users) on any surface; Admins remain in registered users. Chosen over surface-based exclusion because Admin reader-surface activity during the D-030 phase is predominantly content management verification and cannot be told apart from reading.
- *Scope.* Per-content popularity is not in the MVP: no organization-by-content reporting, no rankings, no individual histories, no content identifier in usage tables. The dashboard shows exactly five columns, one row per active organization (zero usage included), no summary row.
- *Retention.* All values are PROVISIONAL. No automatic deletion is guaranteed; organizational-metrics deletion is a manual operator-run procedure (SPEC-008 §7.5) whose worst case (window + cadence + delay) Privacy/Legal must approve. Enforceable retention is BLOCKED for activation until approved.
- *GA4 inventory.* The application allowlist controls only what the application sends; request-inherent and GA4-derived data are inventoried separately and require Privacy/Legal approval (SPEC-008 §6.12).
- *Notice.* An approved updated Privacy Notice (and Terms if affected), version bump, user communication and re-consent decision are hard prerequisites for GA4 activation and for any approved per-user-linked organizational recording. The current Notice describes the inert PostHog runtime and is not adequate for either.

This supersedes the PostHog architecture of SPEC-008 and D-031. PostHog-era Gate B was never executed and is withdrawn. Existing PostHog-era analytics acceptances must not be treated as GA4 consent unless Privacy/Legal decides otherwise.

Internal organizational metrics are not assumed exempt from privacy or consent requirements. Their legal basis and consent treatment, GA4 processor/DPA/US-transfer/jurisdiction/legal basis, the GA4 cookie identifier, Consent Mode, GA4 provider-derived data, re-consent, Privacy Notice changes, disposal of historical PostHog data, and retention periods (all PROVISIONAL: GA4 event data 2 months, `_ga*` cookies 60 days, presence markers 90 days, aggregate counts 24 months) are **REQUIRES PRIVACY/LEGAL APPROVAL**. Until approved, per-user-linked organizational activity is not recorded.

Preserved unchanged: default OFF; consent separate from Terms; user-owned preference with no Admin override; revocability; fail-closed; no search-term capture; environment isolation; private-file protection; no leak of unpublished content; no individual performance evaluation or ranking.

This decision documents a contract only. It is not implemented, authorizes no implementation by itself, and keeps the External Pilot Analytics Activation Gate closed. See `resources/specs/active/008-product-analytics-pilot-observability.md`.

---

### D-033 — Institutional references are suppressed from reader surfaces, not removed

**State:** DECISION (Product Owner) — G2 product scope resolved as a presentation-layer change (2026-10-23, superseding the 2026-10-22 data-boundary scope); G2 SATISFIED (Product Owner, 2026-10-23); U2 split out of SPEC-010 and owned by SPEC-012 (COMPLETED 2026-10-25, accepted with baseline exception per D-036); data inventory gate G6 SATISFIED (2026-10-22); product documents reconciled 2026-10-25
**Date:** 2026-10-21 (G2 scope revised 2026-10-23; G2 recorded satisfied and SPEC-012 activated 2026-10-23; SPEC-012 completed 2026-10-25)

**Approved behavior (implemented 2026-10-23, closed 2026-10-25; see Reconciliation below).** Institutional references do not appear in the user-facing Library experience. All institution records, existing relationships, materials, teaching notes, historical provenance and audit events are preserved. Institutions are not archived or hard-deleted. Published revisions are not modified destructively. Canonical organizations, memberships and authorization do not change.

**Pre-SPEC-012 behavior (historical, verified read-only on `main` before implementation).** Institutions were reader-visible governed content (D-009) through the Library, search suggestions, module detail, reference pages and published-search results. Instructors and materials carried free-text institution fields that readers saw. Which institutions and free-text references existed in Cloud data was inventoried by U0 (G6).

**Reconciliation 2026-10-25 (after SPEC-012 implementation).** Institutional references no longer appear in the reader-facing Library experience. Institution records, relationships, revisions, history and provenance remain intact; institutions are neither archived nor deleted. Admin management surfaces keep full institution management. The change is presentation-only: no schema, authorization, RLS, grant or function change; the analytics contract, events and consent are unchanged (`src/lib/analytics/library-signals.ts` was changed as authorized by SPEC-012 §5; the contract, events and consent are unchanged). Institution data may remain readable through existing APIs/RPCs/Data API by users who already have access (accepted MVP residual exposure, `docs/SECURITY.md`).

**Revised G2 scope — presentation layer (Product Owner, 2026-10-23; IMPLEMENTED — see Reconciliation 2026-10-25).** G2 is a change to what the reader interface displays. It replaces the 2026-10-22 requirement that suppression be enforced at API/data boundaries, which is **superseded** and is not an active requirement.

- Institution entities are removed from the Library interface: no institution navigation, filter option, search suggestion, search result, card, section or detail page. Instructor `institution` and material `source_or_institution` are not displayed. Generic institutional-reference wording (for example "instituciones de referencia") is removed from reader-facing interface text.
- Legacy institutional Library filters (`entity=institution`, including stale URLs) are normalized to the default Library view, without errors, empty institution sections or a `Tipo: Instituciones` chip. `reference` remains a valid entity and means materials. Institution detail routes return 404.
- Institutional data may remain readable through existing APIs and RPCs by users who already have access to it. This residual exposure is accepted for the MVP (see `docs/SECURITY.md`, accepted residual risk). It is not a new boundary and it creates no new access path.
- Authentication, authorization, roles and RLS are unchanged and nothing is weakened. No schema change, migration, RLS policy, grant, security-definer function or Admin RPC is part of G2. Content, relationships, revisions, history and audit are preserved; free text is not rewritten (editorial cleanup is a separate future activity); the analytics contract is unchanged.
- Admin and non-Admin users get the same Library experience. Admin management surfaces keep full institution management.

**G2 product decisions D-A to D-E.** Sub-decisions of gate G2 recorded under this D-033 entry; they are **not** separate entries of this register and carry no register number (do not confuse them with D-030 to D-035). Full text: SPEC-010 §6.

- **D-A — SUPERSEDED (2026-10-23).** The dedicated Admin RPC and the restriction of direct column access are not required: no server-side change is made.
- **D-B — kept.** Legacy `entity=institution` is ignored and normalized to the default Library view.
- **D-C — kept.** `reference` remains a valid entity value and represents materials.
- **D-D — kept, unchanged because nothing server-side changes.** The archived-content and lifecycle-history views keep their existing permissions and behavior.
- **D-E — kept.** Generic institutional-reference terminology is removed from reader-facing interface text only; Admin management surfaces and technical documentation are unaffected. The footer replacement copy was approved by the Product Owner on 2026-10-23: "Módulos, programas, docentes y materiales en un solo lugar." (the prefix sentence "Biblioteca curricular compartida de la red Democracia+." stays). After SPEC-012 is implemented and verified, product documents that describe institutions as reader-visible are reconciled.

**Historical rationale.** A data-boundary approach was evaluated in the G2 design preflight (Alt 2: column-level privileges on the two base tables, a dedicated Admin RPC, a rewrite of the reader RLS policies, and a staged deployment). It was judged disproportionate for the MVP and was dropped by the 2026-10-23 decision. It is a historical record, not an active requirement or blocker (`docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`).

**Pending decisions / follow-ups.** None for G2 product scope. SPEC-012 was activated on 2026-10-23 and completed 2026-10-25 (Product Owner; U2 split out of SPEC-010; accepted with baseline exception per D-036). Reader data types are retained (presentation-only change). Privacy/Legal follow-up: `docs/TERMS_OF_USE.md` line 26 ("consultar instituciones y referencias", rendered at `/app/privacidad/terminos` as versioned legal text) is excluded from SPEC-012 and needs Privacy/Legal review of whether a versioned Terms update is required; `TERMS_OF_USE.md` and `PRIVACY_NOTICE.md` are not edited here. `docs/PRODUCT.md`, `docs/CONTENT_MODEL.md`, `docs/SECURITY.md` and the D-033 behavior text above were reconciled 2026-10-25. G6 is satisfied by `docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`; U2 has no data-dependent operation.

**Deferred.** Any hard deletion or archival of institutions; any rewrite of free-text references (editorial cleanup is a separate future activity); any change to Admin management surfaces; any API/data-boundary suppression of institutional data (would need a new decision).

Tracked in `resources/specs/completed/012-library-institutional-references-presentation.md` (SPEC-012, split from SPEC-010 U2; completed 2026-10-25).

---

### D-034 — Content origin country is an Admin-selected attribute distinct from reach

**State:** DECISION (Product Owner) — G3 semantics decided 2026-10-26; G1 reach policy decided and confirmed 2026-10-26; G1 satisfied as product decision with C1-C3 confirmed; G3 satisfied as product decision; U3 completed via SPEC-013 (accepted with baseline exception, D-037); U4-a/U4-b resolved as product decisions; U4 pending only its own implementation contract
**Date:** 2026-10-21 (G1 and G3 product decisions recorded 2026-10-26; C1-C3 and U4-a/U4-b confirmed 2026-10-26; SPEC-013 U3 closed 2026-10-26)

**Approved future behavior (NOT IMPLEMENTED: origin and feedback only; reach is now implemented).** The Admin explicitly selects a content item's country of origin. It is not inferred from the Admin's organization, email domain, IP address or location, and carries no organization-country dependency. It is distinct from geographic reach. Historical content with unknown provenance is `Sin dato`. Published-revision immutability is respected and the value is preserved across successor revisions. Country metadata creates no organization-specific visibility restriction (D-016 is unchanged). Only Admins can set or change it. The *reach* selector has been restricted to an approved Latin American set by SPEC-013, with legacy values handled non-destructively (G1).

**G3 semantics decided 2026-10-26; U4-a and U4-b resolved as product decisions.** For v1, origin country applies to materials only. It is an explicit Admin selection. It uses ISO 3166-1 worldwide countries and territories, with canonical Spanish display names (U4-a resolved). Historical unknown origin is `Sin dato`. It is exposed as a separate `País de origen` filter. The existing reach label `País o alcance` is kept. Origin is never inferred from organizations or users. Published-revision immutability and successor provenance are preserved. An explicit origin-country selection is required for newly created materials; `Sin dato` is preserved for existing materials with unknown origin (U4-b resolved).

**G1 reach policy decided and confirmed 2026-10-26.** The material reach selector offers a controlled list of Latin American countries, stored as canonical Spanish country names. Existing legacy values are preserved with NO destructive migration. Unchanged legacy values may carry over into successor Drafts. New or modified unsupported values are rejected. Regional and multi-country selections are excluded in v1. The concrete list and scoping confirmations (C1-C3) are confirmed in `resources/specs/completed/013-material-reach-country-restriction.md` §5.

**Current implemented behavior (verified on `main`).** Material *reach* (`country_or_scope` on material revisions) is enforced at the database boundary by `private.enforce_material_reach_country` on Draft rows and the Draft → Published transition; the Admin form presents a select of the 20 approved canonical Spanish country names plus a blank option, and offers a stored off-list value as a labelled "valor existente" option only while it remains stored. Institution `country_or_scope` and instructor `country` remain free text and unchanged. There is no origin-country field. Organizations have no country attribute. Existing Cloud values were inventoried by U0 (G6 satisfied).

**Pending decisions.** G1 is confirmed and U3 is completed. G3: the U4 implementation contract (concrete ISO value list as a constant/contract, required-field enforcement, successor handling and `País de origen` filter mechanics) remains to be written; U4 is otherwise decided. G4 and G5 remain open. G6 is satisfied (see D-033).

**Deferred.** Deriving country from any source other than explicit Admin selection; organization-level country attributes.

Tracked in `resources/specs/planned/010-platform-readiness-organizational-testing.md` (U4, U5) and `resources/specs/completed/013-material-reach-country-restriction.md` (U3).

---

### D-035 — First feedback channel is an external form link

**State:** DECISION (Product Owner) — form URL and privacy governance gates G4 and G5 PENDING
**Date:** 2026-10-21

**Approved future behavior (NOT IMPLEMENTED).** The first version is a visible feedback action that opens an external JotForm URL. There is no embedded iframe, no modal integration, no custom feedback backend and no new analytics event. Tokens, search queries, private content and user identifiers are not transmitted automatically. The label is Spanish-first and the action is keyboard-accessible and usable on mobile. The action is not enabled until the approved form URL and privacy-governance details exist. Feedback is voluntary and separate from analytics consent.

**Current implemented behavior (verified read-only on `main`).** No feedback action or JotForm reference exists in the application.

**Pending decisions.** G4 (approved URL, owner, fields, retention, privacy requirements) and G5 (Privacy Notice coordination with SPEC-008).

**Deferred.** Embedded or modal feedback, to be considered only by a future spec.

Tracked in `resources/specs/planned/010-platform-readiness-organizational-testing.md` (U5). `resources/specs/planned/011-organizational-testing-feedback-program.md` remains planned.

---

### D-036 — SPEC-012 closes with a baseline Playwright exception

**State:** DECISION (Product Owner) — SPEC-012 COMPLETED, ACCEPTED WITH BASELINE EXCEPTION (AC-12)
**Date:** 2026-10-25
**Decider:** Product Owner, communicated by the user. No personal name is recorded: the repository does not establish one.

**Decision.** SPEC-012 AC-12 is **ACCEPTED WITH BASELINE EXCEPTION**. The seven Playwright failures reproduced on both baseline `f16db10` and implementation `38d1c9c` are explicitly accepted as pre-existing. The failing tests must **never** be described as passing.

The seven failures are:

| # | Test file | Test name | Baseline `f16db10` | Head `38d1c9c` |
|---|---|---|---|---|
| 1 | `tests/e2e/archival-governance.spec.ts` | archived management pages through the full three-part keyset without skipping or duplicating | :216 | :216 |
| 2 | `tests/e2e/contributions.spec.ts` | Admins publish new and successor versions while non-Admins remain readers | :62 | :62 |
| 3 | `tests/e2e/library-explorer.spec.ts` | modal overlay contract › Filtros: background inert and locked, scrim dismisses, focus returns | :418 | :522 |
| 4 | `tests/e2e/module-detail.spec.ts` | opening a module from the Library › keeps the canonical URL and presents the module over the Library it was opened from | :193 | :193 |
| 5 | `tests/e2e/module-detail.spec.ts` | detail presentation › is a centred, viewport-constrained panel on a wide desktop | :435 | :446 |
| 6 | `tests/e2e/module-detail.spec.ts` | detail presentation › is full-screen at 768px | :456 | :467 |
| 7 | `tests/e2e/module-detail.spec.ts` | detail presentation › is full-screen at 390px | :456 | :467 |

Evidence: `/tmp/opencode/base-all.log` (baseline `f16db10`, 81 tests: 74 passed, 7 failed), `/tmp/opencode/ac12-head.log` + `/tmp/opencode/rest-head.log` (implementation `38d1c9c`, 26 + 62 tests: 24 + 57 passed, 2 + 5 failed). Failures 1–2 are the AC-12 named regression specs and are of the archival/Admin-form class already recorded as pre-existing test debt in G-007 (SPEC-007). Failures 3–7 were reproduced on baseline `f16db10` and had no earlier repository record. Root causes are not investigated here.

This acceptance covers **only** these seven failures, **only** AC-12's regression gate, and creates **no waiver** for any new or other failure.

**Unchanged boundaries.** SPEC-008 analytics/consent boundaries remain active and unchanged. Authentication, eligibility, roles, RLS, grants, private Storage and every security boundary remain unchanged. The accepted institutional-reference residual exposure remains the current state.

**Production-mode follow-up (not a product decision).** A production-mode Playwright authentication issue is recorded separately. Under `E2E_PRODUCTION=1` (`npm run test:e2e:production`, plain HTTP loopback), the AC-07 parity test fails because `/api/library/suggestions` returns no `groups` (`/tmp/opencode/ac07.log`, `/tmp/opencode/ac07b.log`). The unverified hypothesis is that production-mode `Secure` cookies are not kept over HTTP loopback. This does not change any product or security contract and the production-mode run is not part of the accepted validation evidence. See the completed SPEC-012 §17.4 and G-012.

**Privacy/Legal follow-up.** `docs/TERMS_OF_USE.md` line 26 ("consultar instituciones y referencias", rendered at `/app/privacidad/terminos`) remains excluded from implementation scope and needs Privacy/Legal review of whether a versioned Terms update is required. `TERMS_OF_USE.md` and `PRIVACY_NOTICE.md` are not edited by this closure.

Tracked in `resources/specs/completed/012-library-institutional-references-presentation.md` (SPEC-012) and this register entry.

---

### D-037 — SPEC-013 closes with a limited baseline exception

**State:** DECISION (Product Owner) — SPEC-013 COMPLETED, ACCEPTED WITH BASELINE EXCEPTION (AC-12)
**Date:** 2026-10-26
**Decider:** Product Owner, communicated by the user. No personal name is recorded: the repository does not establish one.

**Decision.** SPEC-013 AC-12 is **ACCEPTED WITH A LIMITED BASELINE EXCEPTION**. The six Playwright failures reproduced on both baseline `a247d09` and the implementation head (`e501f00` plus the test cleanup later committed as `5387f19`) are explicitly accepted as pre-existing. The failing tests must **never** be described as passing. This exception does not classify the failures as passing, does not authorize new regressions, does not authorize Cloud migration apply or production deployment, and does not waive any security, authorization or data-integrity acceptance criterion.

The six failures are:

| # | Test file | Test name | Declaration line (both trees) | Failing line on baseline `a247d09` | Failing line on head (`e501f00` + working-tree cleanup, committed as `5387f19`) |
|---|---|---|---|---|---|
| 1 | `tests/e2e/contributions.spec.ts` | Admins publish new and successor versions while non-Admins remain readers | :62 | Default-timeout run times out (no assertion line); under `--repeat-each=6 --timeout=180000` intermittently :204, 1/6 | `:204` (description concatenation); under `--repeat-each=6 --timeout=180000` intermittently :204, 2/6 |
| 2 | `tests/e2e/library-explorer.spec.ts` | modal overlay contract › Filtros: background inert and locked, scrim dismisses, focus returns | :522 | :542 | :542 |
| 3 | `tests/e2e/module-detail.spec.ts` | opening a module from the Library › keeps the canonical URL and presents the module over the Library it was opened from | :193 | :229 | :229 |
| 4 | `tests/e2e/module-detail.spec.ts` | detail presentation › is a centred, viewport-constrained panel on a wide desktop | :446 | :463 | :463 |
| 5 | `tests/e2e/module-detail.spec.ts` | detail presentation › is full-screen at 768px | :467 | :478 | :478 |
| 6 | `tests/e2e/module-detail.spec.ts` | detail presentation › is full-screen at 390px | :467 | :478 | :478 |

Evidence (temporary logs under `/tmp/opencode/r1/`, not stored in the repository):
- Baseline `a247d09` full targeted suite, dev mode: 79 tests, 73 passed, 6 failed (`base-suite.log`).
- Head: `e501f00` plus the test-cleanup change in `tests/e2e/material-reach-country.spec.ts` present in the working tree, later committed as `5387f19`; full targeted suite, dev mode: 80 tests, 74 passed, 6 failed (`head-suite.log`, generated 2026-10-26 ~18:19). That commit changes only that cleanup spec, so these conclusions are unaffected. The extra pass is the new AC-10 journey in `tests/e2e/material-reach-country.spec.ts`.
- Repeat-each=6 contributions flake evidence: baseline 1/6 at :204 (`base-rep6.log`), head 2/6 at :204 (`head-rep6.log`, generated 2026-10-26 ~18:33), both with `--timeout=180000`.

D-036 failure #1 (`tests/e2e/archival-governance.spec.ts:216`, archived management pages through the full three-part keyset) **passed** in the SPEC-013 runs on both trees; it is **not** part of this exception and must not be described as accepted or as always-passing. Its root cause was not investigated here.

This acceptance covers **only** these six failures, **only** SPEC-013 AC-12's baseline-findings gate, and creates **no waiver** for any new or other failure, for any different assertion, or for any security, authorization or data-integrity criterion.

**Unchanged boundaries.** SPEC-008 analytics/consent boundaries remain active and unchanged. Authentication, eligibility, roles, RLS, grants, private Storage and every security boundary remain unchanged. The accepted institutional-reference residual exposure remains the current state.

**What this decision does not do.** It does not authorize `npx supabase db push`, Cloud migration apply, Vercel production deployment, U4/U5 implementation, or any change to SPEC-008 or SPEC-012. At the time of this decision (2026-10-26) the migration had been applied only to the local development database.

**Subsequent production activation (separate from this decision; scope of D-037 unchanged).** Production activation (separate from the 2026-10-26 closure): migration `20261026000100` was applied to Supabase Cloud project `qcxcgwpfgclyebkxawyh` on 2026-10-27, with Vercel production (`bc.democraciamas.com`) on commit `9f3dc46`; the production verification record distinguishes structural verification, authenticated read-only smoke verification (passed), and Product Owner-confirmed live trigger enforcement (passed). SQL output, assertion-level results and rollback evidence for the database test were not supplied. The Cloud apply and deployment were separately authorized steps; D-037 itself did not authorize them and its exception scope (the six Playwright failures only) is unchanged.

Tracked in `resources/specs/completed/013-material-reach-country-restriction.md` (SPEC-013) and this register entry.

---

## Current delivery state

`SPEC-007` — UX/UI Navigation & Interaction Remediation is **COMPLETED — VALIDATED** at `resources/specs/completed/007-ux-ui-navigation-interaction-remediation.md`. `SPEC-009` — Admin Organization & User Management is **COMPLETED — COHERENCE VERIFIED** at `resources/specs/completed/009-admin-organization-user-management.md`; `SPEC-008` — Product Analytics & Pilot Observability is **ACTIVE — REVISED CONTRACT (GA4 + SUPABASE ORGANIZATIONAL METRICS) DOCUMENTED; NOT IMPLEMENTED; PRIVACY/LEGAL DECISIONS PENDING** (D-032). The superseded PostHog direct transport remains on `main`, inert with no key configured; the PostHog Gate B (D-031) was never executed and is withdrawn. Gates P, O and G are pending; the External Pilot Analytics Activation Gate remains closed.

`SPEC-013` — Material Reach Country Restriction is **COMPLETED — ACCEPTED WITH BASELINE EXCEPTION (AC-12)** at `resources/specs/completed/013-material-reach-country-restriction.md` (D-034, D-037). Implemented 2026-10-26 in commits `e501f00` (database boundary: `supabase/migrations/20261026000100_material_reach_country.sql`, `supabase/tests/material_reach_country.test.sql`) and `5387f19` (test cleanup). The implementation restricts material Draft `country_or_scope` to the confirmed 20-country Latin American set, preserves legacy values non-destructively, leaves institution/instructor country fields unchanged, adds no new grants/policies/RPC parameters, and maps the database rejection to a specific Spanish message in the Admin form. Cloud migration apply and production deployment were not authorized by the closure itself; they were performed afterwards as separate steps. Production activation (separate from the 2026-10-26 closure): migration `20261026000100` was applied to Supabase Cloud project `qcxcgwpfgclyebkxawyh` on 2026-10-27, with Vercel production (`bc.democraciamas.com`) on commit `9f3dc46`; the production verification record distinguishes structural verification, authenticated read-only smoke verification (passed), and Product Owner-confirmed live trigger enforcement (passed). SQL output, assertion-level results and rollback evidence for the database test were not supplied. Status: ACTIVATED — STRUCTURALLY VERIFIED. Pending operational checks: authenticated Admin material-form inspection; authenticated Contributor library/detail-page inspection.

`SPEC-010` — Platform Readiness for Organizational Testing is **PLANNED — RECONCILED; ACTIVATION BLOCKED** at `resources/specs/planned/010-platform-readiness-organizational-testing.md` (D-033–D-037). Product owner decision (Option A, 2026-10-21): it stays in `planned/` because `active/` means implementation-ready. On 2026-10-26 G1 was satisfied (C1-C3 confirmed) and G3 was satisfied as a product decision (U4-a/U4-b resolved); G4 and G5 remain open. G6 is satisfied (reviewed U0 Cloud inventory, 2026-10-22). On 2026-10-23 U2 was split out into SPEC-012 and G2 was recorded satisfied. SPEC-012 is now COMPLETED (accepted with baseline exception, D-036), satisfying the SPEC-012 dependency. On 2026-10-26 U3 was split out into `resources/specs/completed/013-material-reach-country-restriction.md`, implemented and closed 2026-10-26 as COMPLETED — ACCEPTED WITH BASELINE EXCEPTION (D-037), satisfying the SPEC-013 dependency. Nothing else in SPEC-010 is implemented or started. U4 is blocked only on its own implementation contract; U5 remains blocked. U0/U1 are preparatory, mutation-free activities that are not activation. SPEC-010 cannot close until U0, U1, U4 and U5 are each implemented/verified or explicitly removed by a recorded decision. `SPEC-011` remains planned.

`SPEC-012` — Library Institutional References Presentation is **COMPLETED — ACCEPTED WITH BASELINE EXCEPTION (AC-12)** at `resources/specs/completed/012-library-institutional-references-presentation.md` (D-033, D-036). Implemented 2026-10-23 in commits `2f29601` (feat: suppress institutional references from Library reader surfaces) and `5d22a5e` (fix: return a literal 404 for the institution reference route): a code-and-tests-only presentation change limited to `src/` and `tests/`, touching no analytics contract, event or consent, privacy-notice, authorization or database behavior (`src/lib/analytics/library-signals.ts` was modified as authorized by SPEC-012 §5 so that a legacy `entity=institution` is no longer counted as an applied filter). Commit `38d1c9c` is a spec-text docs commit recording the footer-assertion exception in the SPEC-012 admin test freeze; it touches only the SPEC-012 file. Seven pre-existing Playwright failures are accepted as a baseline exception (D-036) and are not represented as passing. `docs/TERMS_OF_USE.md` is excluded and carries a Privacy/Legal follow-up.

`SPEC-006` — Explorer UX/UI Fidelity & Interaction Layer is completed at `resources/specs/completed/006-explorer-ux-ui-fidelity.md`.

SPEC-007 is a bounded UX/UI remediation of surfaces SPEC-006 delivered: responsive global search, contextual `Grilla / Programa` views, an overlay and modal regression contract, and the platform favicon. It does not alter product scope, authorization, governance lifecycle, publication authority, archival, audit history, data semantics or security, and it requires no database change. Its draft was first added under the already-used `SPEC-006` identifier and was renumbered before implementation; technical preflight also removed two draft requirements that described prototype behavior absent from the current product — Library relationship filters for Docentes/Materiales/Instituciones, and the prototype's non-Admin tabbed contribution form, which D-030 supersedes. Where its UX reference conflicts with an implemented contract, the contract wins.

Its activation and closure were governance bookkeeping under the repository methodology; the only product refinement was the approved mobile header wordmark adaptation (SPEC-007 D7). See G-007.

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

### G-007 — SPEC-007 UX/UI Navigation & Interaction Remediation

**State:** COMPLETED — INDEPENDENT COHERENCE VERIFICATION PASSED

SPEC-007 is completed at `resources/specs/completed/007-ux-ui-navigation-interaction-remediation.md`. Implementation HEAD `909f62887b8897b3f9a3ada0407e6827520b54d2` was independently verified against AC-1 to AC-16, all PASS. Validation covered 389 unit/integration tests, lint, typecheck, production build, the full production-mode (79 passed) and development-mode (80 passed) E2E suites, SPEC-007 journeys in WebKit, and Chromium/WebKit visual checks across the responsive matrix. The remaining E2E failures are archival and Admin-form test debt that reproduces on the pre-SPEC-007 base and touches no changed surface. After implementation the product approved one UXR-1 refinement, D7: below 640px the header wordmark is visually hidden, keeping the D+ mark and the brand link's accessible name, so search keeps its width. No migration, RLS, governance RPC, Storage, authentication, role or lifecycle change was introduced.

---

### G-009 — SPEC-009 Admin Organization & User Management

**State:** COMPLETED — COHERENCE VERIFIED

SPEC-009 is completed at `resources/specs/completed/009-admin-organization-user-management.md`. Its four implementation commits are:

- `9625fc3` — bounded Admin organization/domain/membership RPCs, access-administration audit, and pgTAP tests;
- `07b4f6d` — server-only Auth Admin boundary and trusted identity provisioning/reconciliation;
- `712c538` — typed Admin query/mutation domain layer and Server Actions;
- `4151d4a` — Organizations and Users UI, Admin navigation, confirmations, and local E2E coverage.

The implementation retains the `Contributor | Admin` roles and one canonical membership per Auth user. Org/domain/membership operations use live-Admin database RPCs without global table grants. `access_administration_events` is append-only and separate from curriculum lifecycle history. Auth provisioning uses the server-only `SUPABASE_AUTH_ADMIN_SECRET_KEY` boundary for bounded Auth API lookup/create only; membership remains a separate authoritative transaction and failed membership creation does not grant access.

Phase 5 corrected the organization-name editor so the current edited value reaches its Server Action after the Client Component hydrates. Regression evidence verifies that the canonical organization ID, domains, and memberships remain unchanged and the audit records the before/after names.

Local validation includes 165 focused pgTAP tests for SPEC-009, identity RLS, and curriculum lifecycle persistence; `npm run db:lint`; the full Vitest suite (429 passed, 1 optional local integration skipped), typecheck, lint, production build, a browser-static-bundle sentinel scan, and a real local Supabase Auth create/reuse/untrusted-identity integration. The targeted SPEC-009 plus shell Playwright set passed 11 Chromium journeys in both development and production modes, including responsive widths. The full development and production Playwright suites each passed 81/82; the archival keyset test observed 20 pre-existing archived records where its fixture expected 3. The full SQL suite also collides with pre-existing local archive/search data. No local database reset was performed. The SPEC-009 E2E fixture cleans target users and organizations but retains synthetic Admin actor identities and their shared local actor organization because append-only access-audit foreign keys preserve actor attribution.

The complete SQL test suite was attempted against the repository's existing populated local database. Existing archive fixtures and global curriculum-search assertions collide with that local data; the database was not reset or destructively cleaned.

Independent review returned `PUSH READY`. A subsequent Cloud gate applied `20260917000100` to the intended linked project through `npx supabase db push` and verified the result independently of migration success: the remote ledger reports it applied with no drift, all twelve Admin RPCs are `SECURITY DEFINER` with `search_path=""` and `EXECUTE` only for `authenticated`, the three `private` helpers remain `postgres`-only, the four tables have RLS enabled with `SELECT`-only client grants and no grant on the audit table, and thirty direct `authenticated`/`anon` probes were refused with `42501`. Forged elevated JWT claims and a membership-less Auth identity were denied across every RPC, so Admin authority remains the live row. Append-only protection raises `55000` on row-level `UPDATE`/`DELETE` even as table owner. `SUPABASE_AUTH_ADMIN_SECRET_KEY` is configured as a Vercel Production server-only secret and is absent from the full client bundle, and `main @ 80cd776` is deployed and aliased with clean build and runtime logs and server-side `/login` redirection for unauthenticated Admin routes.

Hosted destructive mutation was intentionally not exercised. Production contains three Admin memberships, no Contributor identity, and no designated safe test organization or user, so creating one would have meant inventing production state. Mutation, provisioning, partial-failure, and audit-append behaviour therefore rest on the local real-stack functional evidence recorded above together with the Cloud structural verification; the production inventory is byte-for-byte unchanged after the gate, including zero access-administration events. Hosted Contributor denial was established through role-independent Cloud authorization probes rather than a production Contributor session, because no such identity exists. A designated safe staging fixture would be required to exercise the mutation, provisioning, and partial-failure journeys against hosted infrastructure.

A fresh final coherence review (decision fidelity, behavioral/data/security/architecture coherence, test coherence, knowledge coherence, scope coherence) found no material contradiction and closed SPEC-009 as **COHERENCE VERIFIED**. See the Closure Record in `resources/specs/completed/009-admin-organization-user-management.md` §41. SPEC-008 remains planned and is now unblocked by this closure, but has not been separately activated.

#### Acceptance evidence map (final)

The map below reflects the final AC-01–AC-27 closure review, combining implementation inspection, local real-stack tests, independent review, Cloud structural verification, and safe hosted validation. No criterion required an unsafe destructive production mutation to reach PASS; the documented full-suite fixture-isolation limitations and the absence of a hosted destructive-mutation run are retained as known non-blocking limitations, not evidence gaps against any criterion.

| Criterion | Evidence | State |
|---|---|---|
| AC-01 — Admin Organizations surface | `tests/e2e/admin-organization-users.spec.ts`; `src/app/app/organizations/page.tsx`; Cloud unauthenticated-denial probe | PASS |
| AC-02 — Organization list | `tests/admin-management-pages.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-03 — Organization creation | `supabase/tests/admin_organization_user_management.test.sql`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-04 — Organization editing | `supabase/tests/admin_organization_user_management.test.sql`; `tests/e2e/admin-organization-users.spec.ts`; Phase-5 hydration-fix regression | PASS |
| AC-05 — Multiple approved domains | `supabase/tests/admin_organization_user_management.test.sql`; `tests/admin-management.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-06 — Organization deactivation | `supabase/tests/admin_organization_user_management.test.sql`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-07 — Organization eligibility effect | `supabase/tests/admin_organization_user_management.test.sql`; `supabase/tests/identity_rls.test.sql` | PASS |
| AC-08 — Organization member visibility | `tests/admin-management-pages.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-09 — Admin Users surface | `tests/e2e/admin-organization-users.spec.ts`; `tests/e2e/shell.spec.ts`; Cloud unauthenticated-denial probe | PASS |
| AC-10 — User discovery | `tests/admin-management-pages.test.ts`; `tests/admin-management.test.ts` | PASS |
| AC-11 — User provisioning | `tests/auth-admin.test.ts`; `tests/auth-admin.local.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-12 — Duplicate/untrusted identity protection | `tests/auth-admin.test.ts`; `tests/auth-admin.local.test.ts`; `tests/admin-management.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-13 — Organization assignment | `supabase/tests/admin_organization_user_management.test.sql`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-14 — Domain-compatible assignment | `supabase/tests/admin_organization_user_management.test.sql`; `tests/admin-management.test.ts` | PASS |
| AC-15 — Role management | `supabase/tests/admin_organization_user_management.test.sql`; `tests/admin-management-actions.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-16 — User deactivation | `supabase/tests/admin_organization_user_management.test.sql`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-17 — Read-only login email | `tests/admin-management-pages.test.ts`; `tests/admin-management.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-18 — Server-side authorization | `supabase/tests/admin_organization_user_management.test.sql`; `tests/admin-management-actions.test.ts`; `tests/admin-management.test.ts`; Cloud `42501` probes | PASS |
| AC-19 — Self-escalation protection | `supabase/tests/admin_organization_user_management.test.sql`; `supabase/tests/identity_rls.test.sql`; Cloud forged-JWT-claim probes | PASS |
| AC-20 — Historical preservation | `supabase/tests/admin_organization_user_management.test.sql` | PASS |
| AC-21 — Access-administration audit | `supabase/tests/admin_organization_user_management.test.sql`; Cloud append-only `55000` verification | PASS |
| AC-22 — Privileged Auth boundary | `tests/auth-admin.test.ts`; `tests/auth-admin.local.test.ts`; production bundle sentinel scan on the deployed Admin routes | PASS |
| AC-23 — Minimal Admin identity exposure | `supabase/tests/admin_organization_user_management.test.sql`; `src/lib/admin-management.ts`; Cloud `SELECT`-only grant verification | PASS |
| AC-24 — Partial provisioning failure | `tests/admin-management.test.ts`; `tests/admin-management-actions.test.ts`; `tests/e2e/admin-organization-users.spec.ts` | PASS |
| AC-25 — Analytics readiness | `supabase/tests/admin_organization_user_management.test.sql`; `docs/CONTENT_MODEL.md` | PASS |
| AC-26 — Existing product behavior | Full Vitest suite; targeted shell Playwright in dev/prod; production inventory unchanged after Cloud gate | PASS (pre-existing full-suite fixture-isolation collisions are unrelated/non-blocking) |
| AC-27 — Automated tests | Focused pgTAP (165), full Vitest (429), typecheck/lint, targeted dev/prod Playwright, independent review `PUSH READY` | PASS |

Hosted destructive mutation/provisioning/role-change/deactivation/audit-append flows were intentionally not exercised in production (no designated safe fixture; see above). No criterion above required that evidence to reach PASS: each is independently established by local real-stack tests plus Cloud structural verification, consistent with the SPEC-004/SPEC-005 validation-split precedent.

---

### G-012 — SPEC-012 Library Institutional References Presentation

**State:** COMPLETED — ACCEPTED WITH BASELINE EXCEPTION (AC-12)

SPEC-012 is completed at `resources/specs/completed/012-library-institutional-references-presentation.md`. It delivers the SPEC-010 U2 presentation-layer removal of institutional references from the reader-facing Library. Implementation commits: `2f29601` (suppress institutional references from Library reader surfaces) and `5d22a5e` (return a literal 404 for the institution reference route); the implementation change set is limited to `src/` and `tests/`. Commit `38d1c9c` is a spec-text docs commit recording the footer-assertion exception in the SPEC-012 admin test freeze; it touches only the SPEC-012 file. The implementation touches no file under `supabase/`, `src/lib/contributions/` or `src/app/app/contributions/`, adds no migration, RLS policy, grant, `SECURITY DEFINER` function or Storage rule. Authentication, eligibility, roles, RLS, grants, private Storage and Admin management surfaces are unchanged; there is no analytics contract, event or consent change (`src/lib/analytics/library-signals.ts` was modified as authorized by SPEC-012 §5 so that a legacy `entity=institution` is no longer counted as an applied filter). Institution records, relationships, revisions, history, audit events and provenance are preserved; institutions are neither archived nor deleted. Free text is not rewritten.

Local validation run by the closure task: `npm run lint` pass; `npm run typecheck` pass; `npm test` (`vitest run`) 604 passed, 1 skipped; `npm run build` pass. Diff inspection confirms the bounded scope.

Playwright validation evidence is read from `/tmp/opencode` logs, not independently re-run by this documentation task:

- Baseline `f16db10` full 8-spec AC-12 + targeted suite, dev mode: 81 tests, 74 passed, 7 failed (`base-all.log`).
- Implementation `38d1c9c` targeted AC-12 suite, dev mode: 26 tests, 24 passed, 2 failed (`ac12-head.log`).
- Implementation `38d1c9c` remaining targeted specs, dev mode: 62 tests, 57 passed, 5 failed (`rest-head.log`).
- AC-07 Admin/non-Admin parity, dev mode: pass (`ac07dev.log`).

The same seven failures reproduce on baseline and implementation:

1. `tests/e2e/archival-governance.spec.ts:216` — archived management pages through the full three-part keyset without skipping or duplicating;
2. `tests/e2e/contributions.spec.ts:62` — Admins publish new and successor versions while non-Admins remain readers;
3. `tests/e2e/library-explorer.spec.ts:418` baseline / `:522` head — modal overlay contract › Filtros: background inert and locked, scrim dismisses, focus returns;
4. `tests/e2e/module-detail.spec.ts:193` — opening a module from the Library › keeps the canonical URL and presents the module over the Library it was opened from;
5. `tests/e2e/module-detail.spec.ts:435` baseline / `:446` head — detail presentation › is a centred, viewport-constrained panel on a wide desktop;
6. `tests/e2e/module-detail.spec.ts:456` baseline / `:467` head — detail presentation › is full-screen at 768px;
7. `tests/e2e/module-detail.spec.ts:456` baseline / `:467` head — detail presentation › is full-screen at 390px.

These seven failures are accepted as pre-existing by Product Owner decision 2026-10-25 (D-036). They are never described as passing. Failures 1–2 are the AC-12 named regression specs and are of the archival/Admin-form class already recorded as pre-existing test debt in G-007 (SPEC-007). Failures 3–7 were reproduced on baseline `f16db10` and had no earlier repository record. Root causes are not investigated here.

**Production-mode follow-up (not part of accepted validation).** Under `E2E_PRODUCTION=1` (`npm run test:e2e:production`, plain HTTP loopback at `127.0.0.1`), the AC-07 parity test fails because `/api/library/suggestions` returns no `groups` (`/tmp/opencode/ac07.log`, `/tmp/opencode/ac07b.log`). The unverified hypothesis is that production-mode `Secure` cookies are not kept over HTTP loopback. The same test passes in dev mode. This is recorded as a technical follow-up in the completed SPEC-012 §17.4 and D-036; it does not change any product or security contract.

**Privacy/Legal follow-up.** `docs/TERMS_OF_USE.md` line 26 ("consultar instituciones y referencias") remains excluded from implementation scope and needs Privacy/Legal review of whether a versioned Terms update is required. `TERMS_OF_USE.md` and `PRIVACY_NOTICE.md` remain untouched.

SPEC-010's SPEC-012 dependency is satisfied; SPEC-013 is completed and owns U3 (accepted with baseline exception, D-037). SPEC-010 remains planned: G1 is satisfied and U3 is completed, and G3 is satisfied as a product decision; G4 and G5 remain open; U4 is inactive pending its own implementation contract; U5 remains blocked.

---

### G-008 — SPEC-008 Product Analytics & Pilot Observability

**State:** ACTIVE — REVISED CONTRACT DOCUMENTED (D-032); NOT IMPLEMENTED. The PostHog delivery history below is historical.

*The state, evidence and gate references below through "Not established" record the original SDK implementation and the SPEC revision current at that time (§38/§42 there correspond to the record preserved at `b3321fd`). The PostHog gates are superseded by D-032; the current gates are SPEC-008 §11.*

Optional, consent-gated product analytics using PostHog Cloud EU, delivered in five phases on `main` from baseline `f7fcaa9`: preference persistence and RLS (`ca30458`), privacy UX (`21fe830`), the analytics boundary and environment isolation (`913ea86`), semantic event instrumentation (`03fdf93`), and integrated validation plus documentation reconciliation.

It changes no authorization, organization-access, publication, archival, audit or governance rule, adds no server-side analytics, and introduces no feature flags, experiments or Session Replay. The authoritative privacy behaviour remains in `docs/PRIVACY_AND_DATA_COLLECTION.md`, `docs/PRIVACY_UX_CONTRACT.md`, `docs/PRIVACY_NOTICE.md` and `docs/TERMS_OF_USE.md`; the canonical measurement/event contract remains in the SPEC. Verified technical structure is recorded in `docs/ARCHITECTURE.md` §24 and the security boundary in `docs/SECURITY.md` §28.

Analytics is OFF by default and stays OFF for `undecided`, `rejected`, revoked and unreadable-preference states alike. The preference is user-owned structurally: the mutation RPC takes no subject argument and the table carries no write grant for any role, so no Admin or organization path to another user's decision exists. Privacy fails closed in both directions — an unreadable row and a failed write leave analytics OFF rather than inferring consent. Terms acceptance remains a separate decision. Exactly the six canonical events are emitted, with a closed property vocabulary; raw search text is reduced on the server to a non-reversible token and never reaches client or analytics code.

**Local evidence.** Full pgTAP 575 tests on a reset database (41 new, covering RLS, cross-user denial, Admin non-authority, undecided/rejected/accepted, version metadata, validation, revoked eligibility, cascade delete); `supabase db lint` clean; generated types match `supabase gen types`. Unit suite 618 tests across 47 files, verified deterministic; typecheck, lint and production build pass. Playwright 104 Chromium journeys on a reset database, including 12 privacy-UX journeys reading the persisted row back directly, 6 boundary journeys and 4 event journeys. Browser evidence shows zero requests to any analytics host and no collector fetched while undecided, after rejection, and — decisively for environment isolation — with consent granted in a non-production environment; a blocked provider leaves every core journey and the privacy surfaces working; no request leaving the application carries the reader's query. Build inspection confirms the SDK is a lazily-loaded chunk and not an eager asset of any route.

**Cloud and hosted evidence (analytics disabled).** Migration `20261001000100` is applied to Cloud. RLS, grants and the subject-less RPC were verified structurally and behaviorally with dedicated users across two organizations, and an eligible Admin was confirmed to have no analytics-preference read or write override. Production runs `dbb40c4` with `NEXT_PUBLIC_POSTHOG_KEY` absent. There, the following all passed with zero PostHog traffic and no SDK fetch, with the preference OFF and ON: undecided/rejected/accepted/revoked persistence, reload and new-session persistence, the Privacy Notice, Terms independence, the 390px first-choice prompt, accessibility smoke checks, logout separation, and a member download of a published, later-archived synthetic fixture. Full record: SPEC-008 §42.

**Preference-failure UX.** A failed preference save is verified fail-closed and recoverable. The hosted UI shows the general retryable error screen rather than the intended inline preference error. Accepted for SPEC-008 privacy correctness; tracked as a non-blocking UX refinement.

**Not established.** No hosted validation of enabled analytics. Enabled-state payload shape rests on unit evidence against a production-like environment with a provider double, not observed production traffic. The **External Pilot Analytics Activation Gate (SPEC-008 §38) remains closed**, including the legal review required by `docs/PRIVACY_AND_DATA_COLLECTION.md`, PostHog access restriction, and 12-month retention configuration. `NEXT_PUBLIC_POSTHOG_KEY` is intentionally unset, so analytics is inert in every environment until that gate is satisfied. SPEC-008 must not be moved to `completed/` on the strength of this implementation report.

**2026-10-06 technical correction (SPEC-008).** The earlier SDK/identify integration described above is historical evidence, not the current runtime. The current analytics boundary sends one direct browser Capture API request per validated event, with `$process_person_profile: false`, the authenticated UUID only as event-level `distinct_id`, and generation-owned abort/timeout handling. `posthog-js` and its SDK identity lifecycle were removed. Local mocked tests replace SDK-specific evidence; browser/network retransmission remains possible outside application control. This correction does not validate provider settings, retention/deletion, Legal/Privacy or account security, does not authorize Gate B, and does not open the external pilot gate.

**2026-10-07 MVP contract reconciliation (SPEC-008).** D-031 replaces the ≤12-month physical-deletion prerequisite with PostHog's one-year query-retention boundary as a known MVP limitation, with physical-deletion assurance deferred behind documented reassessment triggers. `e2c4145` inlines the public analytics environment in the client build and `57b03da` adds the `test:analytics-build` regression guard. Provider/account evidence (not repository evidence, not re-verified here) records project `289698` on PostHog Cloud EU with raw-IP discard ON, GeoIP PAUSED, Web and Web Vitals autocapture OFF, Heatmaps OFF, Session Replay OFF, one human Owner with MFA, no pending invitations, no known forwarding/export pipeline or automated AI processing, and investigation-time WebMCP OAuth grants revoked; provider security readiness is PASS. Privacy/Legal decision A authorizes only the bounded controlled Gate B validation under the current minimized model and accepts the one-year query-retention limitation without a physical-deletion guarantee. Gate B execution remains pending; external activation remains closed pending successful Gate B and the remaining Privacy/Legal items in SPEC-008 §12.2.

**2026-10-21 architecture revision (SPEC-008, D-032).** The PostHog architecture recorded above is superseded and its section references (§12.2, §19–§21, §38, §42) point to the historical SPEC text at `948abae` / `b3321fd`. Gate B was never executed. SPEC-008 now documents GA4 for navigation analytics, Supabase organization-level adoption metrics and a minimal Admin dashboard; this is a contract only, with Gate P (Privacy/Legal), Gate O and Gate G pending and the External Pilot Analytics Activation Gate (SPEC-008 §11.4) closed. The PostHog transport remains on `main`, inert, until a separate authorized implementation removes it (SPEC-008 §14).

---

### G-013 — SPEC-013 Material Reach Country Restriction

**State:** COMPLETED — ACCEPTED WITH BASELINE EXCEPTION (AC-12)

SPEC-013 is completed at `resources/specs/completed/013-material-reach-country-restriction.md`. It delivers the SPEC-010 U3 material reach country restriction: material Draft `country_or_scope` is restricted to the confirmed 20-country Latin American set at the database boundary, legacy values are preserved non-destructively, and the Admin form exposes the approved list with a legacy-value option. Implementation commits are `e501f00` (database boundary and Admin form) and `5387f19` (test cleanup). The change set touches `supabase/migrations/20261026000100_material_reach_country.sql`, `supabase/tests/material_reach_country.test.sql`, `src/lib/curriculum/reach-countries.ts`, `src/app/app/contributions/contribution-form.tsx`, `src/app/app/contributions/actions.ts`, and `tests/e2e/material-reach-country.spec.ts`; it adds no new grant, policy, route or public RPC and does not change analytics, authorization, RLS, institution/instructor country fields, or the `country` filter type.

Local validation run by the closure task: `npm run lint` pass; `npm run typecheck` pass; `npm test` 610 passed, 1 skipped; `npm run test:db` 616 passed; `npm run db:lint` clean; `git diff --check` clean. Diff inspection confirms the bounded scope.

Playwright validation evidence is read from `/tmp/opencode/r1` logs, not independently re-run by this documentation task:

- Baseline `a247d09` full targeted SPEC-013 suite, dev mode: 79 tests, 73 passed, 6 failed (`base-suite.log`).
- Head (`e501f00` plus the test-cleanup change in `tests/e2e/material-reach-country.spec.ts` present in the working tree, later committed as `5387f19`) full targeted SPEC-013 suite, dev mode: 80 tests, 74 passed, 6 failed (`head-suite.log`, generated 2026-10-26 ~18:19). That commit changes only that cleanup spec, so the conclusions are unaffected. The extra pass is the new AC-10 journey in `tests/e2e/material-reach-country.spec.ts`.
- Repeat-each=6 contributions flake evidence: baseline 1/6 at `:204` (`base-rep6.log`), head 2/6 at `:204` (`head-rep6.log`, generated 2026-10-26 ~18:33), both with `--timeout=180000`.

The same six failures reproduce on baseline and implementation:

1. `tests/e2e/contributions.spec.ts:62` — Admins publish new and successor versions while non-Admins remain readers (observed failing line varies with the default 30s timeout; also intermittently at `:204` on both trees — description concatenation / hydration race flake).
2. `tests/e2e/library-explorer.spec.ts:522` — modal overlay contract › Filtros: background inert and locked, scrim dismisses, focus returns (fails at `:542` on both).
3. `tests/e2e/module-detail.spec.ts:193` — opening a module from the Library › keeps the canonical URL and presents the module over the Library it was opened from (fails at `:229` on both).
4. `tests/e2e/module-detail.spec.ts:446` — detail presentation › is a centred, viewport-constrained panel on a wide desktop (fails at `:463` on both).
5. `tests/e2e/module-detail.spec.ts:467` — detail presentation › is full-screen at 768px (fails at `:478` on both).
6. `tests/e2e/module-detail.spec.ts:467` — detail presentation › is full-screen at 390px (fails at `:478` on both).

These six failures are accepted as pre-existing by Product Owner decision 2026-10-26 (D-037). They are never described as passing. D-036 failure #1 (`tests/e2e/archival-governance.spec.ts:216`) passed in the SPEC-013 runs and is not covered by this exception. Root causes are not investigated here.

**Remaining test-isolation technical debt (recorded, not fixed).**

1. The pgTAP suite (`npm run test:db`) only passes reliably on a freshly reset database. Running certain Playwright specs (archival, archival-governance, content-management, library-explorer, module-detail, and residual reach-spec assertions such as `audit_history_archival` lines 94, 117–119) leaves state that breaks later `audit_history_archival` and `curriculum_library_rls` pgTAP runs. This reproduces on baseline `a247d09` as well as on implementation `5387f19`.
2. Local Supabase Storage after `supabase db reset` lacks the unique index `(name, bucket_id)` required for E2E attachment upserts, producing `42P10`; the index was applied manually in the local environment for the SPEC-013 runs.
3. `tests/e2e/contributions.spec.ts` has a hydration-race flake at `:204` and depends on an empty database for its strict-mode "Crear contenido" duplicate-link assertion.
4. The six accepted Playwright failures above need their own root-cause work; the exception does not authorize leaving them unfixed indefinitely.

These items are not implementation defects of SPEC-013 and are not fixed by this closure.

**What this closure does not do.** It does not authorize Cloud migration apply, Vercel production deployment, U4/U5 implementation, or any change to SPEC-008 or SPEC-012. At closure (2026-10-26) the migration had been applied only to the local development database; see the production activation note in D-037 and the "Current delivery state" entry for SPEC-013 for the later activation.

---

## Product Coherence OS state

Current overall state:

**COHERENCE VERIFIED — SPEC-001 THROUGH SPEC-007, SPEC-009**

SPEC-001 through SPEC-007 and SPEC-009 are completed with implementation, independent verification, and their applicable Cloud/deployment/acceptance gates reconciled. SPEC-006 closed as **COHERENCE VERIFIED**: product intent, specification, implementation, authorization/security boundaries, validation, UX reference, and durable documentation are reconciled under the evidence recorded in G-006. Personal Itinerary remains an approved but separately delivered capability.

SPEC-007 — UX/UI Navigation & Interaction Remediation closed as **COHERENCE VERIFIED** under the evidence recorded in G-007. SPEC-009 — Admin Organization & User Management closed as **COHERENCE VERIFIED** under the evidence recorded in G-009 and the Closure Record in `resources/specs/completed/009-admin-organization-user-management.md` §41: implementation, independent review, Cloud migration/security verification, and safe hosted validation are all reconciled; hosted destructive mutation/provisioning flows were intentionally not exercised because production has no designated safe fixture, consistent with the SPEC-004/SPEC-005 validation-split precedent. SPEC-008 — Product Analytics & Pilot Observability is **active and not coherence verified**. Its state has five distinct parts: (1) the *previous PostHog implementation* was delivered, deployed and validated in Production with analytics disabled under the evidence recorded in G-008 (historical); (2) that PostHog transport *remains on `main`, production-disabled and inert* (`NEXT_PUBLIC_POSTHOG_KEY` unset); (3) the *proposed GA4 + Supabase organizational-metrics architecture* (D-032 and its amendment) is a documented contract only — no GA4 or organizational-metrics code exists; (4) *implementation work is pending* and not authorized by the contract (SPEC-008 §14); (5) *privacy and production activation requirements* — Gate P, Gate O, Gate G, the Privacy Notice dependency and enforceable retention (BLOCKED) — are unmet, so the External Pilot Analytics Activation Gate (SPEC-008 §11.4) is closed. The PostHog Gate B never ran and is withdrawn. The completed SPEC-006 interface-fidelity slice and the SPEC-007 remediation do not reopen the contracts reconciled above, and no Guide capability was delivered.
