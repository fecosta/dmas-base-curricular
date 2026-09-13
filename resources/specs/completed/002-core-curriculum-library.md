# SPEC-002 — Core Curriculum Library

**Status:** COMPLETED — IMPLEMENTED, INDEPENDENTLY VERIFIED, CLOUD-APPLIED, AND HOSTED-VALIDATED
**Depends on:** SPEC-001 (completed)
**Authority:** Product/content/security baseline confirmed 2026-09-10/2026-09-11; persistence-architecture decision (D-029) confirmed 2026-09-11; implementation and closure gates verified 2026-09-12

## 1. Purpose / Objective

Implement the read-oriented Base Curricular library so authenticated network users can explore the approved curriculum structure and references, using the canonical content model as the semantic authority.

## 2. Current State

The read-only production curriculum library is implemented in commit `23564067774ba9ec314fbdace3733f34d096e142`, applied to the intended Supabase Cloud project, deployed on Vercel, and independently verified against all 22 acceptance criteria.

`docs/PRODUCT.md`, `docs/CONTENT_MODEL.md`, `docs/GOVERNANCE.md`, and `docs/SECURITY.md` remain the semantic authority. The static prototype referenced by those documents (`Base Curricular - Explorador (offline)(3).html`) was unavailable during implementation; repository-local contracts supplied the verified UX/product boundaries, including exclusion of the module-card completeness percentage (D-015) and LMS-style mandatory sequencing.

## 3. Problem / Gap

Authenticated access alone does not provide the central product value: discovering modules, program topics, instructors, institutions, materials, and their relationships.

## 4. Decision

The product is a library, not an LMS.

The initial top-level curriculum axes are:

1. Strategy & Campaign
2. Evidence-based Public Policy

The module is the primary curriculum unit.

References such as institutions and materials are first-class discoverable knowledge objects.

The current UX must not introduce learning trails, completion tracking, required order, or module completeness percentages.

`level` and `delivery_format` may remain as stored metadata but are not part of the current UX contract.

**Persistence (`docs/DECISIONS.md` D-029):** governed curriculum entities (Module, Program Topic, Instructor, Teaching Note, Material/Study, Institution/Reference Center) are persisted using revision-capable persistence from this slice onward — a stable content identity resolving to exactly one current published revision, capable of coexisting with a later draft/review revision of the same identity. This spec itself creates and exposes only already-published, single revisions per identity and implements no contribution, review, approval, revision-authoring, or audit workflow; those remain SPEC-003/004/005. The physical schema shape satisfying this invariant is implementation freedom (§10).

**Grilla / Programa:** `docs/PRODUCT.md` §4.1 already establishes Grid (`Grilla`) and Program (`Programa`) as two alternative ways of exploring the same module content, independent of the unavailable prototype. Both present the same underlying published module data; they are not separate curricula, learning paths, or authorization surfaces, and neither may expose data the other does not.

## 5. Scope

### In Scope

- persistence schema for core published curriculum entities, satisfying the D-029 revision-capable invariant in §4 (this spec creates/exposes only single already-published revisions);
- axes; modules; program topics; instructors; teaching notes; materials/studies; institutions/reference centers;
- relationships among those entities as required by `docs/CONTENT_MODEL.md`;
- read-only exploration of current-published, non-archived content;
- module detail experience presenting Program Topics and associated knowledge objects;
- reference exploration (institutions, materials/studies) as first-class discoverable objects, per `docs/PRODUCT.md` §3;
- search using PostgreSQL full-text search across Modules and References (Institutions, Materials/Studies) — the object types `docs/PRODUCT.md` §3–4.1 explicitly establishes as browsable/searchable exploration surfaces — honoring the same eligibility, publication, and archival boundary as browse/detail, with reasonable handling of Spanish accents/diacritics; independent top-level search indexing of Instructor/Teaching Note/Program Topic (surfaced today via module relationships per `docs/PRODUCT.md` §4.2) is implementation freedom, not a requirement of this spec;
- filters grounded in fields that actually exist in `docs/CONTENT_MODEL.md`: `axis` (Module, via `axis_id`); `country`/`country_or_scope` (Instructor, Material, Institution — Module has no country field, and none is introduced by this spec); `theme` (Module, Material, Institution), using the existing free-text/array field representation with no new normalized taxonomy table;
- Grid (`Grilla`) and Program (`Programa`) module views, per §4 — both are presentation alternatives over the same published module listing, not distinct content, query results, or authorization surfaces;
- seed/import mechanism for initial content: idempotent and safe for repeated operator use, and satisfiable with representative fixtures for tests/local validation (§12);
- RLS/read policies for authenticated network-wide published, non-archived content, gated by the existing SPEC-001 eligibility chain (authenticated identity → approved domain → active membership → active organization → persisted role), not by matching the reader's organization to a content-owning organization;
- per-request authorization enforcement for protected library/search/detail responses, with no shared/public caching that bypasses the eligibility check;
- archive-aware discovery so archived content is excluded from ordinary browsing/search.

### Out of Scope

- external contribution forms;
- review queue;
- change requests;
- approval and publication UI;
- revision authoring workflow;
- email notifications;
- audit UI;
- itinerary persistence;
- organization-specific published-content visibility;
- any Admin governance visibility into pending/unpublished/archived content (SPEC-004/005).

## 6. Expected Behavior

- authenticated eligible users can explore all current-published, non-archived content;
- an eligible Admin has exactly the same published-content read access as an eligible Contributor in this spec — no additional governance visibility is introduced here (that belongs to SPEC-004/005);
- users can navigate from modules to associated Program Topics, instructors, teaching notes, institutions, and materials as defined by available relationships;
- users can search reader-visible published, non-archived content across Modules and References, with reasonable Spanish-language accent/diacritic handling;
- users can filter discovery using the persisted structured fields in §5, without changing content semantics or inventing new taxonomy;
- module detail pages use `Program` terminology;
- Grilla and Programa present the same underlying published module content as alternative views; switching between them changes presentation only, never authorization or the underlying data;
- unpublished/draft/pending revisions are never reader-visible through ordinary browse, search, detail, or API flows;
- archived content is not returned through ordinary browse/search flows;
- no UI implies mandatory curriculum sequence, progress, completion, or completeness percentage;
- all user-facing library/search/filter/detail copy introduced by this spec is Spanish-first, consistent with `docs/PRODUCT.md` §9 and `AGENTS.md` §5; where canonical Spanish wording for a concept (e.g. Instructor, Teaching Note, Material/Study, Institution, Axis) is not already established by product documentation, reasonable Spanish wording is reversible implementation freedom — this spec does not require or invent a permanent Spanish terminology registry.

## 7. Constraints

- PostgreSQL is the canonical source of truth;
- governed curriculum persistence satisfies the D-029 revision-capable invariant (§4); this spec creates/exposes only already-published single revisions and implements no contribution/review/approval/revision-authoring/audit functionality;
- PostgreSQL FTS + SQL filters are the approved MVP search approach;
- search and filters must honor the same eligibility, publication, and archival boundary as ordinary browse/detail reads;
- curriculum read RLS must allow any eligible Contributor or Admin reader network-wide and must not require the reader's organization to match a content-owning organization (published content is network-wide per D-016); it must deny anonymous users, deny authenticated-but-ineligible identities, and prevent direct PostgREST access from bypassing eligibility;
- protected library/search/detail responses must not be exposed through shared/public caching that bypasses per-request eligibility evaluation;
- do not implement completeness percentage;
- do not surface `level` / `delivery_format` as required module-card metadata;
- do not invent a Module `country` field or a normalized Theme/Country taxonomy not already established by the content model;
- the latest static prototype is UX evidence, not authority, over contradictory product decisions, and is not currently available in this repository (§2); its absence limits exact visual/layout fidelity but is not an activation blocker.

## 8. Impact Surface

- database schema (revision-capable per D-029);
- seed/import;
- library UI;
- search/filtering;
- RLS/read policies;
- module/reference navigation;
- caching/rendering configuration for protected routes.

## 9. Acceptance Criteria

1. The two approved curriculum axes exist in persisted data.
2. Governed curriculum entities are persisted using revision-capable persistence satisfying the D-029 invariant (stable identity; exactly one resolvable current published revision per identity), even though only single already-published revisions exist at the end of this spec.
3. Published, non-archived modules can be listed and opened by authenticated eligible users.
4. Module details represent program topics and associated knowledge objects defined in the content model.
5. Institutions and materials are discoverable as first-class reference objects.
6. An anonymous (unauthenticated) request cannot read any curriculum data.
7. An authenticated but ineligible identity cannot read any curriculum data.
8. An eligible Contributor can read published, non-archived content.
9. An eligible Admin has the same published-content read access as an eligible Contributor; no additional governance visibility is exposed in this spec.
10. Unpublished/draft/pending revisions are excluded from ordinary browse, search, and detail results.
11. Archived records are excluded from normal browse/search results.
12. Search returns only reader-visible published, non-archived content across the object types in scope (§5), respecting the same eligibility boundary as browse/detail, and behaves reasonably for Spanish-language queries, including accents/diacritics.
13. Filters operate against the persisted structured fields identified in §5 rather than hard-coded UI-only or invented data.
14. Grilla and Programa both present the same underlying published module content; neither view exposes data or an authorization outcome the other does not.
15. `Program` terminology is used in the user experience.
16. No mandatory learning path/order is introduced.
17. No module completeness percentage is displayed or required.
18. `level` and `delivery_format` are not required in the current user-facing cards/details.
19. Direct or client-side manipulation (request tampering, direct data-layer access) does not expand read visibility beyond what server authorization and RLS allow.
20. All user-facing library/search/filter/module-detail copy introduced by this spec is in Spanish.
21. Representative module → Program Topic and module → other knowledge-object relationships resolve correctly end to end.
22. The feature works from production persistence, not browser-local prototype state.

## 10. Implementation Freedom

Implementation may choose:

- normalized relational details, query composition, component decomposition, and indexing mechanics, provided the D-029 invariant and canonical visibility contracts remain unchanged;
- the physical shape of revision-capable persistence (per-type content/revision table pairs, a shared generic content/revision structure, or another approach), provided the invariant in §4 holds;
- exact Grilla/Programa component structure, query composition, and whether switching is client-only or server-rendered, provided both remain presentation alternatives over the same published module data;
- Spanish UX wording for concepts not already named by product documentation (Instructor, Teaching Note, Material/Study, Institution, Axis), as reversible copy;
- whether search results are presented as one unified result set or per-object-type sections, and the exact mechanism for Spanish accent/diacritic-insensitive matching;
- free-text versus array representation for `theme`/`country_or_scope` fields, consistent with `docs/CONTENT_MODEL.md`;
- seed/import data format and tooling.

## 11. Knowledge Updates Required

Completed:

- reconciled the physical schema with `docs/CONTENT_MODEL.md`, including the verified revision-capable shape against D-029;
- updated `docs/ARCHITECTURE.md` with verified search/data implementation details;
- moved this spec to `completed/` after independent, Cloud, hosted, and credential-remediation verification.

## 12. Open Questions / Blockers

No product-authority or closure blocker remains.

Two initial-content activities are distinguished and must not be conflated:

**A. Seed/import mechanism (in scope of this spec):** an idempotent, operator-safe mechanism for loading curriculum content, sufficient to satisfy this spec's acceptance criteria using representative fixture data for tests and local validation.

**B. Real production curriculum population (out of scope, operational):** sourcing and supplying actual Democracia+ curriculum content is an activity for content owners through an approved source, not something the implementation agent fabricates. No authoritative real module inventory currently exists in the repository beyond the two approved axis names (§4), which may be persisted directly. Acceptance criteria in §9 must be — and are — satisfiable with representative fixtures; they do not require fabricated real-world module data.

## 13. Completion Evidence

- Local validation passed migration replay, 108 pgTAP assertions, DB lint, 43 Vitest tests, typecheck, lint, production build, 9 development Chromium E2E journeys, 9 production Chromium E2E journeys, dynamic protected-route checks, and diff checks.
- Independent adversarial review found all 22 acceptance criteria, D-029, security/RLS, importer, search/filter, and UI/product boundaries passing. A narrow correction pass was independently re-reviewed as verified.
- Migration `20260911000100_core_curriculum_library.sql` was the sole Cloud dry-run delta, was applied successfully to project `qcxcgwpfgclyebkxawyh`, and its schema/RLS/grant/function posture was verified.
- Vercel served commit `2356406`; Google OAuth, Email OTP, eligible library access, authenticated-ineligible denial, Spanish empty states, and private/no-store responses were hosted-validated.
- A legacy privileged API credential exposed during validation was remediated before closure by validating modern publishable/secret keys and disabling the legacy anon/service-role family. JWT signing keys were unchanged.
- Production contains only the two approved axes. No authoritative module/reference payload was supplied or imported; real-content search/accent/filter validation remains an operational follow-up after approved population.
