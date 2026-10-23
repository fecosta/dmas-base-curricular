# SPEC-010 — Platform Readiness for Organizational Testing

**Product:** D+ Base Curricular

**Status:** PLANNED — RECONCILED; ACTIVATION BLOCKED

**Delivery state:** NOT IMPLEMENTED. NOT STARTED. NOT IMPLEMENTATION-READY AS A WHOLE (GATES G1, G3, G4, G5 OPEN; G2 PARTIALLY RESOLVED — PRODUCT SCOPE AND G2 PRODUCT DECISIONS D-A TO D-E APPROVED 2026-10-22, TECHNICAL SECURITY DESIGN PENDING; G6 SATISFIED; U2–U5 BLOCKED).

**Dependencies:** SPEC-001–007 and SPEC-009 (completed). Does not depend on SPEC-008 implementation and does not activate or expand analytics; gate G5 coordinates with SPEC-008 Gate P (Privacy/Legal).

**Repository location:** `resources/specs/planned/010-platform-readiness-organizational-testing.md`

**Decisions:** D-033, D-034, D-035 in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md)

## 1. Purpose

Prepare the existing platform for phased testing with Latin American partner organizations without destroying curriculum content, weakening access controls, or changing the governance model.

## 2. Activation status

Activation to `active/` is **BLOCKED**. Under `resources/specs/README.md`, `active/` means implementation-ready and the current authorized delivery slice. This spec is not implementation-ready: gates G1, G3, G4 and G5 (§6) are open, G2 is only partially resolved (product scope and product decisions D-A to D-E approved, technical security design pending), and together they block U2–U5 (G6 is satisfied). This spec therefore stays in `planned/`.

**Product-owner decision (Option A, 2026-10-21):** keep SPEC-010 planned. The lifecycle definitions in `resources/specs/README.md` are not changed.

**Minimum conditions for a later activation request:**

- Every gate that blocks a unit intended for the active slice is resolved and recorded in §6 (decision, date, decider), and that unit's open specification items are written into this spec.
- A separate preflight and an explicit activation, per `resources/specs/README.md` Completion rule item 6.
- At that time, decide whether to activate the whole spec or split the implementation-ready units. This is not decided now.

While planned, no unit is an authorized delivery slice, and nothing here authorizes implementation of U2–U5. U0 and U1 are permitted preparatory work only because they mutate nothing (§5). This spec cannot move to `completed/` until every unit has been implemented and has passed independent verification against §8, or a unit has been explicitly removed by a recorded decision.

## 3. Current implemented behavior (verified read-only on `main`; U0 confirms Cloud data)

- **Institutions** are an implemented governed content type (`institutions`, `institution_revisions`, `module_institutions`; D-009) and are reader-visible when published. Reader surfaces that currently render them: Library `Instituciones` tab and results (published search RPC), search suggestions, module detail `Instituciones` section, and `/app/library/references/institution/[id]`. Instructors carry a free-text `institution` field and materials carry free-text `source_or_institution`; both are displayed to readers. Generic reader-facing copy that mentions "instituciones de referencia" (`src/app/app/layout.tsx:66-67`) is terminology, not an exposure of institution records; G2 product decision D-E (§6) nevertheless brings the reader-facing wording into U2 scope (copy inventory: design preflight §5.2). The Library `Tipo` control, the `País o alcance` options and `entity=reference` currently include institutions (`search_curriculum` returns institutions for `reference`).
- **Country** is stored as free-text `country_or_scope` on material and institution revisions and free-text `country` on instructor revisions (no value list; the application validates length only). The Library filter `País o alcance` lists the distinct `country_or_scope` values of current results and filters by exact normalized match; modules have no country and are excluded when it is applied. Reach and origin are not separate fields today.
- **Organizations** have no country attribute. No content-origin country field exists.
- **Feedback:** no feedback action, JotForm reference, or feedback code exists.
- **Domain:** `bc.democraciamas.com` is not referenced in application code or configuration. Whether it is served is not verified here (U1).
- **Cloud data** (which institutions, countries, and legacy values actually exist): inventoried read-only by U0 (aggregate counts only); see [`docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`](../../../docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md) and gate G6 in §6. The repository reference inventory/impact map half of U0 is not part of that evidence.

## 4. Approved decisions

Full text: D-033, D-034, D-035.

**D1 — Institutional references (D-033).** Suppress institutional references from reader-facing discovery and display. Preserve all institution records, existing relationships, materials, teaching notes, historical provenance and audit events. Do not archive or hard-delete institutions. Do not modify published revisions destructively. Do not change canonical organizations, memberships or authorization. Suppression is enforced in the appropriate reader-facing data boundaries, not merely by CSS or hidden UI.

**D1 scope — approved product behavior, NOT IMPLEMENTED (G2 product scope, Product Owner, 2026-10-22; full record in §6).** The reader boundary narrows for institution data only; Admin authority, publication, successor-revision and archival rules do not change:

- Institution records are suppressed from every reader-facing Library, search, suggestion, filter, detail, API and preload surface. Legacy institution entity filters (`entity=institution`, including stale URLs) are ignored and normalized to the default Library view, with no error, no empty institutions section and no `Tipo: Instituciones` chip (G2 product decision D-B). Institution detail routes return 404. `reference` remains a valid entity value and represents materials only (D-C).
- Institution relationships are suppressed in reader-facing module responses, while the database relationships are preserved.
- Instructor `institution` and material `source_or_institution` are suppressed from reader-facing display, search and direct data access. Admin access to these two protected fields for management goes through a dedicated, authorization-checked Admin RPC; direct Data API column access may be restricted (D-A).
- Admin and non-Admin users get the same Library experience (Admin Library views also suppress institutions). Admin management surfaces keep full institution management. The archived-content view and the lifecycle-history view are administrative management surfaces, not Library surfaces: they keep their existing permissions and behavior (D-D).
- Generic institutional-reference terminology (for example "instituciones de referencia") is removed from the reader-facing interface text only. Admin management surfaces and technical documentation are unaffected. The replacement Spanish wording is not decided here; it is a U2 implementation detail needing Spanish copy review (D-E).
- Institutional records, revisions, relationships, audit events and provenance are preserved. Free-text content (titles, descriptions, teaching notes, attachments) is not rewritten; editorial cleanup of embedded institutional references is a separate future activity. `source_url` and unrelated metadata are unchanged.
- The `institution` analytics content type stays in the existing contract; no events are added.

The technical authorization mechanism that enforces this is not decided (§6, G2 record; design preflight `docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`, which is not an approval). D-A to D-E are G2 product decisions recorded in the G2 record; they are not entries of the `docs/DECISIONS.md` register (their record lives in D-033) and must not be confused with register IDs such as D-030 to D-035.

**D2 — Content origin country (D-034).** The Admin explicitly selects the content's country of origin. It is not inferred from the Admin's organization, email domain, IP or location, and has no organization-country dependency. It is distinct from geographic reach. Historical content with unknown provenance is `Sin dato`. Published-revision immutability is respected and provenance is preserved across successor revisions. Country metadata creates no organization-specific visibility restriction. Mutation is Admin-only. Eligible content types and successor-revision semantics must be specified before U4 (G3).

**D3 — External feedback form (D-035).** The first version is a visible feedback action that opens an external JotForm URL. No embedded iframe, no modal integration, no custom feedback backend, no new analytics events, and no automatic transmission of tokens, search queries, private content or user identifiers. Spanish-first label; accessible keyboard and mobile behavior. The approved form URL and privacy-governance details are prerequisites for enabling the action. An embedded experience may be considered in a future spec.

**Other stakeholder intent retained.** `bc.democraciamas.com` is the approved public subdomain (no DNS or deployment change presumed). The *reach* country selector offers only an approved Latin American set. Analytics opt-in, default-off behavior and revocation are unchanged.

## 5. Implementation units

| Unit | Scope | Mutation | Blocked by | Status |
|---|---|---|---|---|
| **U0** | Read-only Cloud data inventory and repository reference inventory/impact map: institutions and their relationships, free-text institutional references, country values on every content type, legacy reach values, which reader surfaces and data boundaries expose each. Output is a report with aggregate counts, not content or personal data. Satisfies G6. | None. No migration, no Cloud write, no secret or personal data in the report. | — | PREPARATORY (no implementation authority); Cloud inventory COMPLETE and reviewed (G6, §6) |
| **U1** | Verify `bc.democraciamas.com`, navigation, mobile usability, accessibility and regression behavior. No DNS assumption: if verification shows a DNS or deployment change is needed, stop and request separate authorization. | None to application code unless a defect is found; defects are reported, not fixed. | — | PREPARATORY (no implementation authority) |
| **U2** | Institutional-reference reader suppression per D1 across the reader data boundaries identified by U0 (RPCs/RLS/routes/suggestions/direct URLs/preload payloads), non-destructively, with documented dry-run and rollback for any data-dependent step. Scope: D1 as approved in the G2 record (§6), including G2 product decisions D-A to D-E. | Yes (schema/data/code) | G2 technical security design: open technical items O-1, O-6, O-8 to O-13 (product scope and decisions D-A to D-E approved 2026-10-22); G6 satisfied | BLOCKED — not authorized for implementation |
| **U3** | Restrict the *reach* selector to the approved Latin American set, validated on client and server; legacy values handled by an explicit non-destructive rule. | Yes | G1, G6 (U0 complete) | BLOCKED |
| **U4** | Content-origin country: schema and provenance, Admin selection, filter, display, `Sin dato` for unknown history, successor-revision carry-over. Includes the relationship to the existing `País o alcance` filter. | Yes | G3, G6 (U0 complete) | BLOCKED |
| **U5** | Visible Spanish-first feedback action opening the approved external JotForm URL. | Code only | G4, G5 | BLOCKED |

U0 and U1 are preparatory, read-only/verification activities only. Executing them is not SPEC activation, does not authorize implementation of any gated unit (U2–U5), and does not by itself resolve any gate, except that a completed, reviewed U0 report is the evidence for G6. They are permitted while the spec is planned only because they mutate nothing. If U1 finds a defect, report it; do not fix it under this spec.

U2–U4 are independent of one another unless a recorded gate resolution says otherwise. Any data-dependent migration or suppression operation requires G6, satisfied by a completed U0 report.

## 6. Unresolved gates

G1, G3, G4 and G5 are OPEN. G2 is PARTIALLY RESOLVED: product scope and product decisions D-A to D-E approved, technical security design pending (record below); it is not satisfied. G6 is SATISFIED (record below). Resolutions are recorded here (decision, date, decider) before the blocked unit starts.

| Gate | What must be decided | Blocks | Owner |
|---|---|---|---|
| **G1** | Approved Latin American country list (including territories and edge cases) and the rule for legacy non-conforming `country_or_scope` values (non-destructive). | U3 | Not recorded |
| **G2** | Exact scope of institutional-reference suppression: which reader surfaces and data boundaries; whether instructor `institution`, material `source_or_institution`, and institution names in material titles or other free text are in scope; how Admin management surfaces are treated. | U2 | Product Owner (scope and decisions D-A to D-E: decided); technical security design owner not recorded. **PARTIALLY RESOLVED** — product scope and decisions D-A to D-E approved 2026-10-22, technical security design pending; see record below |
| **G3** | Content types eligible for origin-country metadata and filtering; the permitted value set (D2 does not tie it to the reach list); successor-revision semantics; how the origin filter relates to the existing `País o alcance` filter. | U4 | Not recorded |
| **G4** | Approved JotForm URL; form owner; fields; retention; privacy requirements (including whether any page context may be passed — D3 permits none by default). | U5 | Not recorded |
| **G5** | Privacy Notice coordination with SPEC-008 where applicable (e.g. whether the external feedback form requires Notice wording). Feedback is separate from analytics consent. | U5 | Privacy/Legal (per SPEC-008 Gate P); not otherwise recorded |
| **G6** | Read-only Cloud data inventory completed and reviewed before any data-dependent migration or suppression operation. Satisfied by U0, which is itself read-only. | U2, U3, U4 | **SATISFIED** — see record below |

### G2 resolution record

- **Status:** PARTIALLY RESOLVED — product scope and G2 product decisions D-A to D-E approved; technical security design pending. G2 is **not** satisfied and U2 stays BLOCKED and not authorized for implementation.
- **Decision date:** 2026-10-22 (product scope and product decisions D-A to D-E).
- **Decider:** Product Owner — explicitly authorized by the user on 2026-10-22. No personal name is recorded: the repository does not establish one.
- **Label note:** "D-A" to "D-E" are sub-decisions of gate G2 (they originated as proposed questions in the design preflight §5 and are now approved). They are **not** entries of the `docs/DECISIONS.md` register and carry no register number; their durable record is this section plus D-033. Do not confuse them with register IDs such as D-030 to D-035.
- **Approved product contract (APPROVED FUTURE BEHAVIOR — NOT IMPLEMENTED):**
  - Institution records are suppressed from all reader-facing Library, search, suggestion, filter, detail, API and preload surfaces. Institution detail routes return 404.
  - Institution relationships are suppressed in reader-facing module responses; the database relationships are preserved.
  - Instructor `institution` and material `source_or_institution` are suppressed from reader-facing display, search and direct data access (including direct PostgREST table/column reads by an authenticated non-Admin).
  - Admin and non-Admin users get the same Library experience: Admin Library views also suppress institution data. Admin management surfaces (for example `/app/contributions`) keep full institution management.
  - All institutional records, revisions, relationships, audit events and provenance are preserved. Publication, successor-revision and archival rules are unchanged.
  - Analytics contracts are unchanged: the `institution` content type stays; no events are added.
  - Free text (titles, descriptions, teaching notes, attachments) is not rewritten. Editorial cleanup of embedded institutional references is a separate future activity.
  - `source_url` is unchanged. Existing authorization and privacy guarantees are preserved.
  - **G2 product decision D-A (APPROVED, 2026-10-22, Product Owner).** Admin access to the protected instructor field `institution` and the protected material field `source_or_institution` must use a dedicated, authorization-checked Admin RPC. Direct PostgREST column access may be restricted. (This is a product permission; it does not approve any mechanism, grant posture or sequence.)
  - **G2 product decision D-B (APPROVED).** Legacy institution entity filters (`entity=institution`, for example stale `?entity=institution` URLs) are ignored and normalized to the default Library view: no error, no empty institutions section and no `Tipo: Instituciones` chip.
  - **G2 product decision D-C (APPROVED).** `reference` remains a valid entity value and represents materials only.
  - **G2 product decision D-D (APPROVED).** The archived-content view and the lifecycle-history view are administrative management surfaces, not Library surfaces. They are not subject to the Admin Library parity suppression rule and keep their existing permissions, their existing Admin-only definer RPC behavior and what they currently show.
  - **G2 product decision D-E (APPROVED).** Generic institutional-reference terminology (for example "instituciones de referencia") is removed from the reader-facing interface text only. Admin management surfaces and technical documentation are unaffected. The replacement Spanish wording is **not** decided here: it is a U2 implementation detail that needs Spanish copy review. The inventory of affected strings is in the design preflight §5.2.
- **Resolved by the product decisions (numbering kept; no longer open):**
  - **O-2** (Admin Library data path): resolved by D-A. Admin management reads of the two protected fields go through a dedicated authorization-checked Admin RPC; direct column access may be restricted. The RPC contract is the new technical item O-13.
  - **O-3** (legacy entity normalization semantics): resolved by D-B (ignore and normalize). Where and how the normalization is implemented is the new technical item O-12.
  - **O-4** (`reference` meaning): resolved by D-C (materials only).
  - **O-5** (classification of Admin read-only views): resolved by D-D (archived-content and lifecycle-history views are management surfaces and keep existing behavior).
  - **O-7** (generic copy): resolved by D-E as to scope (reader-facing text only, in scope of U2); the exact Spanish replacement wording is a U2 implementation detail needing copy review, not a gate item.
- **Still open — technical items only (none is a product decision, none changes the approved product scope or decisions D-A to D-E, and none is decided, approved or sequenced by this record):**
  - **O-1:** the enforcement mechanism (RPC-only suppression, column privileges, views, projection move, or another design).
  - **O-6:** handling of the now-unused material full-text index expression. (Application/database deploy sequencing is O-10.)
  - **O-8:** pre-migration Cloud ACL/DDL snapshot, and the documented rollback.
  - **O-9:** Admin RLS preservation predicates: if the reader policies on `institutions`, `institution_revisions` and `module_institutions` are replaced, the live-Admin read set that exists today only through those reader policies (published institution revisions and links of current-published module revisions) must be preserved, specified predicate by predicate and reviewed (design preflight §2.7, §4.2).
  - **O-10:** the staged deployment sequence (Admin RPC first, then application, then restriction, then a final verification gate), its per-stage rollback, application/database version compatibility and the response-shape choice that follows from it (design preflight §4.5). Replaces the sequencing part of O-6.
  - **O-11:** the execution-grant posture of any new Admin security-definer function (design preflight §4.4).
  - **O-12 (new):** where the legacy entity normalization (D-B) is implemented (server-side `readEntity` in `src/lib/curriculum/library-state.ts:31-34`, a URL redirect, or both) so that `entity=institution` is dropped without losing the other Library parameters (`q`, `axis`, `country`, `theme`, `view`); what the `search_curriculum` function does for direct callers that pass `entity_filter = 'institution'` (it must never return an institution row; ignore, empty or error is a technical choice); and that analytics `librarySignals` (`src/lib/analytics/library-signals.ts:52`) does not count a normalized legacy value as an applied `entity` filter. Design preflight §5.3.
  - **O-13 (new):** the contract of the dedicated Admin RPC required by D-A: name, arguments, return shape, status scope and relation to the edit form (design preflight §4.4). O-11 covers only its execution grants.
- **Design analysis:** [`docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`](../../../docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md). It is a design preflight, not a product contract and not an approval record. Alt 2, the staged sequence, the Admin RPC grant posture and the RLS predicates it describes are **unapproved technical recommendations awaiting verification and review**; D-A to D-E approve product behavior only.
- **Before U2 is implementation-ready** (technical list only; design preflight §6; none is satisfied today):
  - an approved technical design for the enforcement mechanism (O-1);
  - an Admin RLS preservation design, specified predicate by predicate and independently reviewed (O-9);
  - a test plan requiring both direct PostgREST positive and negative access tests (non-Admin denied for every in-scope table and column; Admin management reads preserved through the Admin RPC; role revocation) and administrative functionality tests (edit form, option lists, module relationships, publish, successor, archive check), plus the D-B to D-E tests of AC-01;
  - the staged deployment sequence reviewed and approved, with per-stage rollback (O-10);
  - the Admin RPC execution-grant posture reviewed (O-11) and its contract reviewed (O-13);
  - the legacy entity normalization design reviewed (O-12);
  - the disposition of the unused material index expression (O-6);
  - a rollback plan with the pre-migration Cloud snapshot procedure and a local dry-run (O-8);
  - an activation request under the `resources/specs/README.md` Completion rule;
  - independent review of the migrations before any Cloud application.
- **Relation to the G6 record:** the G6 record below predates this decision and is left unaltered; where it says G6 "does not decide G2 scope", that remains true of G6 itself and is superseded in effect only by this record.
- **What this record does not do:** it does not resolve G1, G3, G4 or G5, does not satisfy G2, does not alter the G6 record, does not activate this spec, and does not authorize implementation of U2–U5.

### G6 resolution record

- **Status:** SATISFIED (Cloud data inventory half of U0).
- **Evidence:** [`docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`](../../../docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md) (Q1–Q17 aggregate inventory of Supabase Cloud project `qcxcgwpfgclyebkxawyh`, with the appended independent review).
- **Review verdict:** PASS_WITH_NOTES.
- **Review date:** 2026-10-22, inferred from the report file's modification time; the report body carries no date and the date is not independently verified.
- **Responsible decision-maker:** Product Owner — explicitly authorized by the user on 2026-10-22. No personal name is recorded: neither the evidence nor the repository establishes one.
- **Authorization date:** 2026-10-22 (formal closure of G6 explicitly authorized by the user). This is the date G6 is recorded as satisfied, and it is distinct from the review date above.
- **Provenance limitations (all carried from the evidence and review):**
  - The reviewer was `review-openai`, a 9Router alias whose underlying model and family are unverified. The family of the inventory executor is unresolved. Opposite-family independence is **not** claimed, and no orchestrator usage checkpoints exist.
  - The review was user-directed and manual, not run through the review-routing workflow.
  - The project reference is proven only through the MCP-reported project URL. MCP URL, transaction and per-query receipts are not embedded; they are executor-asserted.
  - Q12 and Q17 are summarized, not reproduced row by row. Q9 is an approximate lower bound. Q17 chronology: evidence §4 (Limits), written by the inventory executor before review, states Q17 was not reconciled against migration text by a reviewer. The appended independent review (§5) later reports that Q17 matches the migrations. The two statements are sequential, not contradictory: the §4 limitation is the pre-review state and the §5 review supersedes it. The review's receipt is still a summary (see the Q12/Q17 limitation above), and the original evidence text is left unmodified.
  - Q1–Q7 were re-run via MCP and not diffed against the earlier manual run.
  - The inventory is a point-in-time snapshot; any data change after the snapshot date is not covered.
- **Scope of what G6 establishes:** the Cloud data inventory required before data-dependent operations. It does not resolve G1–G5, does not decide G2 scope for free-text institutional fields or search indexes, and does not authorize activation or implementation of U2–U5.
- **Findings carried forward:** U2–U4 inputs are listed in evidence §4. The default-ACL observation (evidence Q17) is not a SPEC-010 item; it is tracked as a separate security follow-up in [`docs/SECURITY.md`](../../../docs/SECURITY.md) §19.

## 7. Required semantics

**Reach** describes the geographic scope of a program or material. **Origin country** describes the country the Admin explicitly selects as the origin of content. They are distinct dimensions and must not overwrite one another. Origin country is never derived from organization, email domain, IP, or current location, and organizations gain no country dependency.

Origin and reach filters must never bypass publication, membership, Storage or RLS constraints, and create no organization-specific visibility. Unknown provenance is `Sin dato`, never guessed. Published revisions are not edited in place; provenance survives successor revisions. Suppression, validation and filtering are enforced at server and data boundaries, not only in the UI.

## 8. Acceptance criteria

Criteria apply when the corresponding unit is activated and implemented.

- **AC-01 (U2, per G2 product scope and G2 product decisions D-A to D-E; criteria marked [mechanism] depend on the technical design, which is not decided):**
  - **Direct data access.** [mechanism] An eligible non-Admin using the Data API (PostgREST) cannot read `institutions`, `institution_revisions` or `module_institutions` rows, `instructor_revisions.institution`, or `material_revisions.source_or_institution`, whether by select, filter or order. The non-sensitive columns of `instructor_revisions` and `material_revisions` remain readable to eligible readers as today under the existing row policies, while no row or column of `institutions`, `institution_revisions` or `module_institutions` is readable by a non-Admin. An Admin Library view obtains the same suppressed data as a non-Admin. Anonymous and ineligible users stay denied.
  - **Search and entity values (D-B, D-C).** `search_curriculum` never returns an institution row, including for a direct call with `entity_filter = 'institution'` (handling per O-12). `entity=reference` returns materials only: no institution row, and no instructor or material institution value, in the results. No institution row is found by name, and no row matches a term that exists only in `source_or_institution` or in an instructor `institution`.
  - **Detail and suggestions.** `get_published_module` and `get_published_reference` responses and suggestions JSON contain no institution record, relationship, `institution` or `sourceOrInstitution` value. Filter options (`País o alcance`, `Tema`) are not derived from institutions.
  - **Routes and payloads.** `/app/library/references/institution/{id}` returns 404. Server-rendered and RSC/preload payloads contain no institution data.
  - **Legacy entity normalization (D-B).** Opening `/app/library?entity=institution`, alone or with other parameters (`q`, `axis`, `country`, `theme`, `view`), renders the default Library view: no error, no empty institutions section, no `Tipo: Instituciones` chip, no active `Instituciones` option, and the other parameters are preserved and still applied. The `Tipo` control and suggestion groups offer no institution option. A normalized legacy value is not reported as an applied `entity` filter in analytics signals (O-12). `entity=reference`, `module` and `material` still work.
  - **Admin parity and management.** Admin Library views match non-Admin views: the reader functions that return or search library data are role-agnostic and return identical results for the same inputs to an Admin and a non-Admin, including while an Admin-visible Draft exists. Admin management surfaces keep full institution create, edit, publish, successor and archive behavior.
  - **Archived-content and lifecycle-history views unchanged (D-D).** The archived-content view (`list_archived_governed_content`, `/app/contributions`) and the lifecycle-history view (`list_curriculum_lifecycle_history`, `/app/contributions/history`) keep their Admin-only access, their definer RPC behavior and what they show today, and are not altered by U2. Regression tests confirm the RPC result shapes and ACLs are unchanged, that a Contributor, an ineligible user and `anon` are still denied, and that an Admin still sees archived institutions with their current-published `name` and institution events as today.
  - **Admin management reads preserved.** [mechanism] Whatever replaces the reader policies on `institutions`, `institution_revisions` and `module_institutions` keeps a live Admin's current Data API read set unchanged and does not widen it: non-archived institution identities, Draft and current-published institution revisions, and links of Draft and current-published module revisions; archived identities and historical Published institution revisions stay excluded exactly as today. Authority is the live persisted role (`private.current_access()`), never client or JWT metadata. Verified by tests of: opening and saving the edit form of a published institution through the management path; the institution option lists in the management selects; module relationship reads for Draft and published module revisions; Draft reads; archived institutions excluded as today; a demoted or deactivated Admin losing these reads on the next authoritative request while a Contributor never gains them; anon and ineligible denied.
  - **Admin management access to the two protected fields (D-A).** Admin management reads of `instructor_revisions.institution` and `material_revisions.source_or_institution` (the edit form) work through a dedicated, authorization-checked Admin RPC. Restricting direct Data API column access for every `authenticated` user, including Admins, is permitted and is not a defect. [mechanism] The RPC is executable only by a live Admin, denied (with `42501`) to Contributors, ineligible users, Admins whose role was revoked and `anon`, has no `PUBLIC`, `anon` or `service_role` execution, returns only revisions the Admin could already open (Draft, or the current published revision), and accepts only whitelisted content types.
  - **Preservation.** Retained materials and teaching notes remain accessible under existing permissions. Institution/relationship counts and the checksums of preserved columns are unchanged. Immutability, archive-block, publish validation and successor link copy are unchanged. `source_url` is unchanged.
  - **Contracts.** The analytics content-type enum is unchanged and no event is added.
  - **Reader-facing copy (D-E).** The reader-facing rendered text contains none of the inventoried generic institutional-reference strings (design preflight §5.2): checked by a Vitest/Playwright scan of rendered reader-facing text (the authenticated shell footer, Library, module detail, reference page and suggestions) for those exact strings. The Admin management surfaces (`/app/contributions/**`) are out of the scan and keep their institution wording. The replacement Spanish wording is a U2 implementation detail subject to Spanish copy review, not an acceptance criterion of this spec.
  - **Operations.** A documented dry-run and rollback exist before any change to Cloud.
- **AC-02 (U0, U2–U4):** Institution records, relationships, materials, teaching notes, provenance and audit events are intact; institutions are neither archived nor deleted; published revisions are not destructively modified; canonical organizations, memberships and authorization are unchanged. A U0 inventory precedes any data-dependent operation, and any such operation has a documented dry-run and rollback. For U2, retention is verified against the G6 baseline (27 institutions, 54 module links) with row counts and column checksums before and after, and suppression is never implemented by archiving, deleting or rewriting data.
- **AC-03 (U3):** The reach selector offers exactly the G1-approved set; the server rejects unsupported new values; existing values follow an explicit non-destructive rule.
- **AC-04 (U4):** Origin country is Admin-selected, never inferred, distinct from reach, `Sin dato` for unknown history, preserved across successor revisions, Admin-mutation-only, creates no organization-specific visibility restriction, and is displayed and filtered consistently for the G3-approved types.
- **AC-05 (U3, U4):** Search combined with reach, origin and other filters behaves correctly; `Sin dato` and zero-result states are understandable.
- **AC-06 (U2–U4):** No unpublished, archived, historical or private content leaks through country filters, suppression gaps, or query endpoints; Admin permissions are unchanged. For U2, the suppression mechanism introduces no new route to unpublished or archived data, does not widen any grant to `anon` or to ineligible users, and does not widen any Admin read (for example to historical Published institution revisions). Any new Admin function has hardened execution grants (`revoke all` from `public`, `anon`, `authenticated` and `service_role`, then `grant execute` to `authenticated` only; empty `search_path`; explicit live-Admin check). This grant posture is a technical requirement awaiting review (O-11), not an approved design.
- **AC-07 (U5):** A visible feedback action with a Spanish-first label opens the approved external URL, works with keyboard and on mobile, and is not enabled until G4 and G5 are resolved. No iframe, modal integration or custom backend.
- **AC-08 (U5):** The feedback action transmits no tokens, search queries, private content or user identifiers, appends no context parameters, and adds no analytics events.
- **AC-09 (all):** Existing consent/revocation behavior and SPEC-008 gates are unchanged; analytics is neither activated nor expanded.
- **AC-10 (U1 and regression for every unit):** Existing upload, viewing, downloading, publication and archival regressions pass; the deployed domain is verified without assuming DNS changes.
- **AC-11 (governance):** The spec is not activated until activation conditions in §2 are met; no gated unit (U2–U5) started before its gates were resolved in §6 (U2 additionally requires the G2 technical security design, since G2 is only partially resolved: the approved mechanism, the Admin RLS preservation design (O-9), a test plan covering both direct Data API and administrative-functionality tests, the reviewed and approved staged deployment sequence (O-10), the reviewed Admin function grant posture and contract (O-11, O-13), the reviewed entity normalization design (O-12) and the disposition of the unused material index expression (O-6)); the G2 product decisions D-A to D-E are approved and are not a further gate; U0/U1 execution is preparatory and is not activation; this spec is not completed until all units pass independent verification.

## 9. Out of scope

- Archiving or deleting institutions, organizations, users, memberships, content, attachments, audit history or analytics data.
- Rewriting institution names in material titles or free text: the G2 product scope excludes it; editorial cleanup is a separate future activity.
- Changing the Admin management surfaces' institution wording or forms, the archived-content and lifecycle-history views (D-D), or technical documentation wording (D-E). Post-implementation reconciliation of the product documents that use "reference institutions" terminology is a documentation follow-up after U2 is verified (design preflight §5.2), not part of U2 code.
- Embedded or modal feedback, a custom feedback backend, ticketing, public feedback board or notification engine.
- Changing publication/archival authorization or reviving Contributor authoring.
- New analytics events, session replay, or enabling any analytics provider.
- Redesigning the taxonomy or translating the whole application.

## 10. Validation and documentation

Use unit/integration tests, RLS/database checks, browser journeys and independent review per unit. Verify data-affecting changes on safe local/test fixtures, never on real production records. Reconcile `docs/` only when a unit's behavior is actually verified; until then the durable docs mark it as approved future behavior, not implemented. Do not push, merge or deploy without explicit authorization.

## 11. Implementation freedom

Within an activated unit: component structure, query mechanics and database mechanism consistent with the approved stack. Not allowed: reinterpreting the approved G2 scope, redefining country semantics, erasing provenance, inferring origin country, expanding data collection or analytics, altering permissions, or reinterpreting suppression as archival or deletion.
