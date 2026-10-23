# SPEC-010 — Platform Readiness for Organizational Testing

**Product:** D+ Base Curricular

**Status:** PLANNED — RECONCILED; ACTIVATION BLOCKED

**Delivery state:** NOT IMPLEMENTED. NOT STARTED. NOT IMPLEMENTATION-READY AS A WHOLE (GATES G1, G3, G4, G5 OPEN; G2 PRODUCT SCOPE RESOLVED AS A PRESENTATION-LAYER CHANGE ON 2026-10-23, NO TECHNICAL-DESIGN OR AUTHORIZATION BLOCKER REMAINS, NOT YET FORMALLY RECORDED SATISFIED; U2 DEFINED BUT NOT ACTIVATED; G6 SATISFIED; U3–U5 BLOCKED).

**Dependencies:** SPEC-001–007 and SPEC-009 (completed). Does not depend on SPEC-008 implementation and does not activate or expand analytics; gate G5 coordinates with SPEC-008 Gate P (Privacy/Legal).

**Repository location:** `resources/specs/planned/010-platform-readiness-organizational-testing.md`

**Decisions:** D-033, D-034, D-035 in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md)

## 1. Purpose

Prepare the existing platform for phased testing with Latin American partner organizations without destroying curriculum content, weakening access controls, or changing the governance model.

## 2. Activation status

Activation to `active/` is **BLOCKED**. Under `resources/specs/README.md`, `active/` means implementation-ready and the current authorized delivery slice. This spec is not implementation-ready as a whole: gates G1, G3, G4 and G5 (§6) are open and block U3–U5. G2 product scope is resolved (presentation layer, 2026-10-23) and U2 is defined as one small unit (§5), but it has not been activated (see the G2 record, §6). G6 is satisfied. This spec therefore stays in `planned/`.

**Product-owner decision (Option A, 2026-10-21):** keep SPEC-010 planned. The lifecycle definitions in `resources/specs/README.md` are not changed.

**Minimum conditions for a later activation request:**

- Every gate that blocks a unit intended for the active slice is resolved and recorded in §6 (decision, date, decider), and that unit's open specification items are written into this spec.
- A separate preflight and an explicit activation, per `resources/specs/README.md` Completion rule item 6.
- At that time, decide whether to activate the whole spec or split the implementation-ready units. This is not decided now.

While planned, no unit is an authorized delivery slice, and nothing here authorizes implementation of U2–U5. U0 and U1 are permitted preparatory work only because they mutate nothing (§5). This spec cannot move to `completed/` until every unit has been implemented and has passed independent verification against §8, or a unit has been explicitly removed by a recorded decision.

## 3. Current implemented behavior (verified read-only on `main`; U0 confirms Cloud data)

- **Institutions** are an implemented governed content type (`institutions`, `institution_revisions`, `module_institutions`; D-009) and are reader-visible when published. Reader surfaces that currently render them: Library `Instituciones` tab (`Tipo` control) and results section, search suggestions (`/api/library/suggestions`), module detail `Instituciones` section (page and overlay), and `/app/library/references/institution/[id]`. Instructors carry a free-text `institution` field (shown in the module detail instructor subtitle) and materials carry free-text `source_or_institution` (shown on the material reference page as `Fuente o institución`). Generic reader-facing copy that mentions "instituciones de referencia" (`src/app/app/layout.tsx:66-67`, the authenticated shell footer) is terminology, not an exposure of institution records; G2 decision D-E nevertheless brings the reader-facing wording into U2 scope (copy inventory: `docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md` §3, historical record). The `search_curriculum` RPC returns institution rows when no entity is given and for `entity=reference`, and the Library `País o alcance` and `Tema` options are derived in application code (`getLibrary` in `src/lib/curriculum/queries.ts`) from the unfiltered RPC result, so they currently include institution values.
- **Country** is stored as free-text `country_or_scope` on material and institution revisions and free-text `country` on instructor revisions (no value list; the application validates length only). The Library filter `País o alcance` lists the distinct `country_or_scope` values of current results and filters by exact normalized match; modules have no country and are excluded when it is applied. Reach and origin are not separate fields today.
- **Organizations** have no country attribute. No content-origin country field exists.
- **Feedback:** no feedback action, JotForm reference, or feedback code exists.
- **Domain:** `bc.democraciamas.com` is not referenced in application code or configuration. Whether it is served is not verified here (U1).
- **Cloud data** (which institutions, countries, and legacy values actually exist): inventoried read-only by U0 (aggregate counts only); see [`docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`](../../../docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md) and gate G6 in §6. The repository reference inventory/impact map half of U0 is not part of that evidence.

## 4. Approved decisions

Full text: D-033, D-034, D-035.

**D1 — Institutional references (D-033).** Institutional references do not appear in the user-facing Library experience. Preserve all institution records, existing relationships, materials, teaching notes, historical provenance and audit events. Do not archive or hard-delete institutions. Do not modify published revisions destructively. Do not change canonical organizations, memberships or authorization.

**D1 scope — approved product behavior, NOT IMPLEMENTED (G2, Product Owner, 2026-10-23: presentation layer; full record in §6).** G2 changes what the reader interface displays. It adds no server-side or data-boundary control and changes no authentication, authorization, role or RLS behavior:

- Institution entities are removed from the Library interface: the `Instituciones` `Tipo` option and results section, institution cards, institution search suggestions and results, the module detail `Instituciones` section, and the institution detail page (`/app/library/references/institution/{id}` returns 404).
- Institutional navigation, filters, suggestions and search results are removed. Legacy institutional Library filters (`entity=institution`, including stale URLs) are normalized to the default Library view, with no error, no empty institutions section and no `Tipo: Instituciones` chip (decision D-B). `reference` remains a valid entity value and represents materials (D-C).
- Instructor `institution` and material `source_or_institution` are not displayed in the user-facing experience.
- Generic institutional-reference terminology (for example "instituciones de referencia") is removed from reader-facing interface text only. Admin management surfaces and technical documentation are unaffected. The replacement Spanish wording is a U2 implementation detail needing Spanish copy review (D-E).
- Admin and non-Admin users get the same Library experience. Admin management surfaces keep full institution management. The archived-content and lifecycle-history views are not Library surfaces and are untouched (D-D).
- Institutional records, revisions, relationships, audit events and provenance are preserved. Free-text content (titles, descriptions, teaching notes, attachments) is not rewritten; editorial cleanup of embedded institutional references is a separate future activity. `source_url` and unrelated metadata are unchanged.
- The `institution` analytics content type stays in the existing contract; no events are added.
- **Accepted residual exposure (MVP).** Institution data (the institution tables, instructor `institution`, material `source_or_institution`) may remain readable through existing APIs, RPCs and Data API reads by users who already have the appropriate access. The reader interface does not display it. This is a documented accepted residual risk, not a new boundary; see `docs/SECURITY.md`. The earlier requirement of API/data-boundary suppression (2026-10-22) is superseded.

G2 decisions D-A to D-E are sub-decisions of gate G2 recorded in the G2 record (§6); they are not entries of the `docs/DECISIONS.md` register (their record lives in D-033) and must not be confused with register IDs such as D-030 to D-035. D-A (Admin RPC for the two fields) is superseded.

**D2 — Content origin country (D-034).** The Admin explicitly selects the content's country of origin. It is not inferred from the Admin's organization, email domain, IP or location, and has no organization-country dependency. It is distinct from geographic reach. Historical content with unknown provenance is `Sin dato`. Published-revision immutability is respected and provenance is preserved across successor revisions. Country metadata creates no organization-specific visibility restriction. Mutation is Admin-only. Eligible content types and successor-revision semantics must be specified before U4 (G3).

**D3 — External feedback form (D-035).** The first version is a visible feedback action that opens an external JotForm URL. No embedded iframe, no modal integration, no custom feedback backend, no new analytics events, and no automatic transmission of tokens, search queries, private content or user identifiers. Spanish-first label; accessible keyboard and mobile behavior. The approved form URL and privacy-governance details are prerequisites for enabling the action. An embedded experience may be considered in a future spec.

**Other stakeholder intent retained.** `bc.democraciamas.com` is the approved public subdomain (no DNS or deployment change presumed). The *reach* country selector offers only an approved Latin American set. Analytics opt-in, default-off behavior and revocation are unchanged.

## 5. Implementation units

| Unit | Scope | Mutation | Blocked by | Status |
|---|---|---|---|---|
| **U0** | Read-only Cloud data inventory and repository reference inventory/impact map: institutions and their relationships, free-text institutional references, country values on every content type, legacy reach values, which reader surfaces and data boundaries expose each. Output is a report with aggregate counts, not content or personal data. Satisfies G6. | None. No migration, no Cloud write, no secret or personal data in the report. | — | PREPARATORY (no implementation authority); Cloud inventory COMPLETE and reviewed (G6, §6) |
| **U1** | Verify `bc.democraciamas.com`, navigation, mobile usability, accessibility and regression behavior. No DNS assumption: if verification shows a DNS or deployment change is needed, stop and request separate authorization. | None to application code unless a defect is found; defects are reported, not fixed. | — | PREPARATORY (no implementation authority) |
| **U2** | Remove institution entities and institutional wording from the user-facing Library experience, in the presentation layer only (§5.1). | Code only (`src/`, `tests/`). No schema, migration, RLS, grant or function change. | Activation only: an explicit activation request (§2) and, at implementation time, Spanish copy review. No technical-design or authorization blocker. G6 satisfied (no data-dependent operation). | DEFINED — NOT ACTIVATED; not authorized for implementation |
| **U3** | Restrict the *reach* selector to the approved Latin American set, validated on client and server; legacy values handled by an explicit non-destructive rule. | Yes | G1, G6 (U0 complete) | BLOCKED |
| **U4** | Content-origin country: schema and provenance, Admin selection, filter, display, `Sin dato` for unknown history, successor-revision carry-over. Includes the relationship to the existing `País o alcance` filter. | Yes | G3, G6 (U0 complete) | BLOCKED |
| **U5** | Visible Spanish-first feedback action opening the approved external JotForm URL. | Code only | G4, G5 | BLOCKED |

U0 and U1 are preparatory, read-only/verification activities only. Executing them is not SPEC activation, does not authorize implementation of any gated unit (U2–U5), and does not by itself resolve any gate, except that a completed, reviewed U0 report is the evidence for G6. They are permitted while the spec is planned only because they mutate nothing. If U1 finds a defect, report it; do not fix it under this spec.

U2–U4 are independent of one another unless a recorded gate resolution says otherwise. Any data-dependent migration of U3 or U4 requires G6, satisfied by a completed U0 report; U2 has no data-dependent operation.

### 5.1 U2 — Library presentation change (implementation-ready definition; NOT ACTIVATED)

**Expected behavior (reader, Admin and non-Admin alike).**

- The Library shows no institution anywhere: the `Tipo` control offers `Todo`, `Módulos`, `Materiales`; there is no `Instituciones` results section, card, count or empty state; `entity=reference` lists materials only.
- Search suggestions (header search and `/api/library/suggestions`) offer only `Módulos` and `Materiales` groups.
- Module detail (canonical page and overlay) has no `Instituciones` section and the instructor subtitle omits the instructor's `institution`. The material reference page omits `Fuente o institución`. `/app/library/references/institution/{id}` returns 404.
- `País o alcance` and `Tema` filter options are not derived from institution rows.
- `entity=institution` (alone or combined with `q`, `axis`, `country`, `theme`, `view`) renders the default Library view with the other parameters preserved and applied; there is no error, no empty institutions section and no `Tipo: Instituciones` chip.
- The shell footer and any other reader-facing text no longer say "instituciones de referencia" (inventory: `docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md` §3). Replacement Spanish copy is chosen at implementation time and needs Spanish copy review; it is the only open item and is not a blocker to defining the unit.

**Affected reader surfaces** (all verified in code at `main` `cf0a4d3`):

| Surface | File | Change |
|---|---|---|
| Entity vocabulary, `Tipo` chip label | `src/lib/curriculum/library-state.ts` (`libraryEntities`, `entityLabels`, `readEntity`, `entityHref`) | Drop `institution` from the accepted entities so `readEntity` returns `undefined` for it (this is the normalization to the default view and removes the applied-filter chip); narrow `entityHref` to module and material. |
| Library URL rewriting | `src/lib/curriculum/library-href.ts` (`libraryHref`) | Do not copy a legacy `entity=institution` into generated links (axis, view, chip-removal and `Tipo` links). |
| Header search hidden fields | `src/components/shell-search.tsx` (`carried`) | Do not carry `entity=institution` into the search form. |
| Analytics signals | `src/lib/analytics/library-signals.ts` (`librarySignals`) | Do not count `entity=institution` as an applied `entity` filter. The contract in `src/lib/analytics/contract.ts` is unchanged. |
| Library page | `src/app/app/library/page.tsx` | Remove the `Instituciones` `Tipo` option, the `institutions` partition, the `Instituciones` section and its `institutions-title`; `referenceSection` and the `Ver … (n)` link only handle materials. |
| Library data | `src/lib/curriculum/queries.ts` (`getLibrary`, `LibraryFilters.entity`, `SearchResult`) | Filter `institution` rows out of both the filtered and the unfiltered RPC results in application code, before the result list, counts and the `countries`/`themes` options are derived. See implementation note below. |
| Cards | `src/components/library/cards.tsx` | `ReferenceCard` kind becomes material only. |
| Suggestions | `src/lib/curriculum/suggestions.ts` (`suggestionFamilies`), `getSearchSuggestions` | Drop the institution family; `/api/library/suggestions` needs no other change (same auth gate, same RPC). |
| Module detail | `src/app/app/library/module-detail.tsx` | Remove the `Instituciones` section (and its `module-institutions-title`) and `instructor.institution` from the instructor subtitle. Types `Institution`, `ModuleDetail.institutions`, `Instructor.institution` become unused by readers. |
| Reference page | `src/app/app/library/references/[type]/[id]/page.tsx`, `getReference` | `getReference` accepts only `material` (anything else, including `institution`, calls `notFound()`); drop the institution kind label, the website branch and `Fuente o institución`. |
| Footer copy | `src/app/app/layout.tsx` | Replace the "instituciones de referencia" sentence. |

Unchanged: Admin management surfaces (`/app/contributions/**` and `src/lib/contributions/**`, which have their own queries and types); the `search_curriculum`, `get_published_module` and `get_published_reference` functions; all `supabase/` files.

**Implementation notes (not security controls).**

- `search_curriculum` is unchanged and still returns institution rows (also for `entity=reference`), and `get_published_module` still returns `institutions` and instructor `institution`. The filtering is therefore done in the app layer. This hides the rows from the interface only; it is the accepted residual exposure, not a boundary.
- The RPC has no application-level pagination or limit (verified). The only cap is the Data API `max_rows` (1000 in `supabase/config.toml`; the Cloud setting is not verified here), which already applies today before any filtering. Removing institution rows in the app layer therefore cannot make pages short, but results, counts (`resultCount`, the empty state, `LibraryActivity.resultCount`), the `countries`/`themes` options and the `Ver … (n)` link must all be computed from the filtered array. Suggestions are grouped per family after filtering, so the per-family cap does not under-fill. If the published library ever approaches the cap, institution rows would consume part of it; at the G6 baseline (27 institutions) this is not a present concern.
- A material can still be matched by a term that exists only in its (now hidden) `source_or_institution`, because the RPC indexes it. The match is not explained on screen. Accepted for the MVP; the RPC is not changed.
- Legacy normalization is done by ignoring the value (no redirect). The stale parameter may remain in the address bar until the reader's next navigation; generated links never re-emit it.

**Non-goals.** Schema changes, migrations, new RLS policies, grant/ACL changes, new `SECURITY DEFINER` functions, new Admin RPCs, API-level or data-level suppression, data deletion or migration, generic ACL rollback mechanisms, reworking authentication or authorization, changes to Admin management surfaces, changes to the analytics contract or events, rewriting free text, changing `source_url`, any change to publication, successor-revision or archival behavior.

**Acceptance criteria:** AC-01 (§8). **Validation:** one step: the repository's existing lint, typecheck and Vitest, plus the targeted Playwright specs listed in AC-01. No database check applies.

**Authorization invariants.** No change to authentication, eligibility, roles, RLS or grants; no new access path or endpoint; `/api/library/suggestions` keeps its live-access gate; Admin management surfaces keep their behavior; the Library looks the same for Admin and non-Admin (the Library code has no role branch and U2 adds none).

## 6. Unresolved gates

G1, G3, G4 and G5 are OPEN. G2 product scope is RESOLVED as a presentation-layer change (2026-10-23); no technical-design or authorization blocker remains; G2 is not yet formally recorded SATISFIED and U2 is not activated (record below). G6 is SATISFIED (record below). Resolutions are recorded here (decision, date, decider) before the blocked unit starts.

| Gate | What must be decided | Blocks | Owner |
|---|---|---|---|
| **G1** | Approved Latin American country list (including territories and edge cases) and the rule for legacy non-conforming `country_or_scope` values (non-destructive). | U3 | Not recorded |
| **G2** | Exact scope of institutional-reference suppression: which reader surfaces; whether instructor `institution`, material `source_or_institution`, and institution names in free text are in scope; how Admin management surfaces are treated. | U2 | Product Owner (decided). **PRODUCT SCOPE RESOLVED** (presentation layer, 2026-10-23); not yet formally recorded SATISFIED; see record below |
| **G3** | Content types eligible for origin-country metadata and filtering; the permitted value set (D2 does not tie it to the reach list); successor-revision semantics; how the origin filter relates to the existing `País o alcance` filter. | U4 | Not recorded |
| **G4** | Approved JotForm URL; form owner; fields; retention; privacy requirements (including whether any page context may be passed — D3 permits none by default). | U5 | Not recorded |
| **G5** | Privacy Notice coordination with SPEC-008 where applicable (e.g. whether the external feedback form requires Notice wording). Feedback is separate from analytics consent. | U5 | Privacy/Legal (per SPEC-008 Gate P); not otherwise recorded |
| **G6** | Read-only Cloud data inventory completed and reviewed before any data-dependent migration or suppression operation. Satisfied by U0, which is itself read-only. | U3, U4 | **SATISFIED** — see record below |

### G2 resolution record

- **Status:** PRODUCT SCOPE RESOLVED (presentation layer, 2026-10-23). No technical-design or authorization blocker remains. G2 is **not yet formally recorded SATISFIED** and U2 is **not activated**; U2 stays not authorized for implementation until activation (see (b)).
- **Decision dates and decider:** 2026-10-22 (original scope and decisions D-A to D-E) and 2026-10-23 (simplification to a presentation-layer change, which supersedes the 2026-10-22 data-boundary requirement). Product Owner, communicated by the user. No personal name is recorded: the repository does not establish one.
- **Label note:** "D-A" to "D-E" are sub-decisions of gate G2. They are **not** entries of the `docs/DECISIONS.md` register and carry no register number; their durable record is this section plus D-033. Do not confuse them with register IDs such as D-030 to D-035.

**(a) Product decisions resolved (APPROVED FUTURE BEHAVIOR — NOT IMPLEMENTED).**

- Institution entities, navigation, filters, suggestions and search results are removed from the user-facing Library; instructor `institution` and material `source_or_institution` are not displayed; the institution detail route returns 404. Admin and non-Admin users get the same Library. Admin management surfaces keep full institution management.
- Institutional data may remain accessible through existing APIs to users who already have access. This residual exposure is accepted for the MVP (`docs/SECURITY.md`). Existing authentication, authorization, roles and RLS stay intact; nothing is weakened and no access path is added.
- Content, relationships, revisions, history, audit and provenance are preserved. Publication, successor-revision and archival rules and the analytics contract are unchanged. Free text is not rewritten (separate future editorial cleanup). `source_url` is unchanged.
- **D-A — SUPERSEDED (2026-10-23).** The dedicated Admin RPC for the two fields and any restriction of direct column access are not required; no server-side change is made.
- **D-B — kept.** Legacy `entity=institution` (including stale URLs) is normalized to the default Library view: no error, no empty institutions section, no `Tipo: Instituciones` chip.
- **D-C — kept.** `reference` remains a valid entity value and represents materials.
- **D-D — kept, unchanged because nothing server-side changes.** The archived-content and lifecycle-history views keep their existing permissions and behavior.
- **D-E — kept.** Generic institutional-reference terminology (for example "instituciones de referencia") is removed from reader-facing interface text only; Admin management surfaces and technical documentation are unaffected. Replacement Spanish wording is a U2 implementation detail needing Spanish copy review. Copy inventory: `docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md` §3.

**(b) Remaining implementation prerequisites (process, not design).**

- An explicit activation request and separate preflight under the `resources/specs/README.md` Completion rule item 6, and the decision whether to activate the whole spec or split U2 out (not decided now).
- Formal recording of G2 as SATISFIED at that time.
- Spanish copy review of the replacement reader-facing wording at implementation time.
- After U2 is implemented and verified, reconcile the product documents that describe institutions as reader-visible (`docs/PRODUCT.md`, `docs/CONTENT_MODEL.md`).

**(c) Authorization or governance blockers.** None introduced. U2 changes no authentication, authorization, role, RLS or grant behavior and adds no access path. The technical items that existed only for the abandoned data-boundary design (enforcement mechanism, Admin RLS preservation, staged deployment, grant posture, Admin RPC contract, database dry-run/rollback; labelled O-1, O-6, O-8 to O-13 in earlier drafts) are withdrawn, and O-2 to O-5 and O-7 are resolved by the decisions above. The abandoned design is kept as a historical record in [`docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`](../../../docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md); it is not an active requirement or a blocker.

- **Relation to the G6 record:** the G6 record below predates this decision and is left unaltered. G6 stays SATISFIED; because U2 now has no data-dependent operation, G6 has nothing left to gate for U2 (it still applies to U3 and U4).
- **What this record does not do:** it does not resolve G1, G3, G4 or G5, does not formally mark G2 SATISFIED, does not alter the G6 record, does not activate this spec, and does not authorize implementation of U2–U5.

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

Origin and reach filters must never bypass publication, membership, Storage or RLS constraints, and create no organization-specific visibility. Unknown provenance is `Sin dato`, never guessed. Published revisions are not edited in place; provenance survives successor revisions. Country validation and filtering are enforced at server and data boundaries, not only in the UI. (Institutional-reference suppression is a presentation-layer change; see D1.)

## 8. Acceptance criteria

Criteria apply when the corresponding unit is activated and implemented.

- **AC-01 (U2, G2 presentation-layer scope, decisions D-B to D-E; §5.1):**
  - **Library.** The `Tipo` control, results sections, cards, counts and empty states show no institution. `entity=reference` returns materials only. `País o alcance` and `Tema` options are not derived from institution rows. Verified for an Admin and a non-Admin: the rendered Library is identical for both.
  - **Legacy entity (D-B, D-C).** Opening `/app/library?entity=institution`, alone or with `q`, `axis`, `country`, `theme`, `view`, renders the default Library view: no error, no empty institutions section, no `Tipo: Instituciones` chip; the other parameters are preserved and applied; generated links (axis, `Vista`, chip removal, `Tipo`) and the header search form do not re-emit `entity=institution`; `librarySignals` does not report it as an applied filter. `entity=reference`, `module` and `material` still work.
  - **Suggestions.** `/api/library/suggestions` and the header search popover return and show only `Módulos` and `Materiales` groups; the endpoint keeps its authentication and eligibility responses (401/403/503).
  - **Detail.** Module detail (page and overlay) has no `Instituciones` section and no instructor `institution`; the material reference page has no `Fuente o institución`; `/app/library/references/institution/{id}` returns 404.
  - **Reader-facing copy (D-E).** A rendered-text check (Vitest where the component renders in isolation; the targeted Playwright specs for the authenticated shell footer and the Library) finds none of the inventoried generic institutional-reference strings (`docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md` §3). Admin management surfaces (`/app/contributions/**`) are out of the check and keep their institution wording. The replacement Spanish wording is subject to Spanish copy review and is not itself an acceptance criterion.
  - **Authorization and preservation unchanged.** The change set contains no file under `supabase/` and no change to authentication, eligibility, role or RLS code; Admin management surfaces and their existing tests behave as before; no data is created, altered or deleted; the analytics content-type enum is unchanged and no event is added.
  - **Regression tests.** The existing tests that assert institution UI are updated to the new behavior: `tests/library-suggestions.test.ts`, `tests/library-state.test.ts`, `tests/module-detail-overlay.test.tsx`, `tests/curriculum-queries.test.ts` (institution rows filtered out of results, counts and filter options), `tests/shell-search.test.tsx` (no carried `entity=institution`), and `tests/e2e/library-explorer.spec.ts`, `tests/e2e/module-detail.spec.ts`, `tests/e2e/auth.spec.ts`. Validation is the existing lint, typecheck and Vitest plus those targeted Playwright specs.
- **AC-02 (U0, U2–U4):** Institution records, relationships, materials, teaching notes, provenance and audit events are intact; institutions are neither archived nor deleted; published revisions are not destructively modified; canonical organizations, memberships and authorization are unchanged. A U0 inventory precedes any data-dependent operation (U3, U4); any such operation has a documented dry-run and rollback. U2 performs no data operation, so its retention check is that the change set touches no migration, seed or data file.
- **AC-03 (U3):** The reach selector offers exactly the G1-approved set; the server rejects unsupported new values; existing values follow an explicit non-destructive rule.
- **AC-04 (U4):** Origin country is Admin-selected, never inferred, distinct from reach, `Sin dato` for unknown history, preserved across successor revisions, Admin-mutation-only, creates no organization-specific visibility restriction, and is displayed and filtered consistently for the G3-approved types.
- **AC-05 (U3, U4):** Search combined with reach, origin and other filters behaves correctly; `Sin dato` and zero-result states are understandable.
- **AC-06 (U2–U4):** No unpublished, archived, historical or private content leaks through country filters or query endpoints; Admin permissions are unchanged. U2 adds no route, endpoint, grant or policy and widens no read; any institution data still returned by existing APIs is the accepted residual exposure (§4), not a new path.
- **AC-07 (U5):** A visible feedback action with a Spanish-first label opens the approved external URL, works with keyboard and on mobile, and is not enabled until G4 and G5 are resolved. No iframe, modal integration or custom backend.
- **AC-08 (U5):** The feedback action transmits no tokens, search queries, private content or user identifiers, appends no context parameters, and adds no analytics events.
- **AC-09 (all):** Existing consent/revocation behavior and SPEC-008 gates are unchanged; analytics is neither activated nor expanded.
- **AC-10 (U1 and regression for every unit):** Existing upload, viewing, downloading, publication and archival regressions pass; the deployed domain is verified without assuming DNS changes.
- **AC-11 (governance):** The spec is not activated until activation conditions in §2 are met; no gated unit (U2–U5) starts before its gates are resolved in §6. U2 additionally requires only an explicit activation request (and the whole-spec-or-split decision) and formal recording of G2 as SATISFIED: no technical-design or authorization gate remains, and Spanish copy review happens at implementation time. G2 decisions D-B to D-E are approved and are not a further gate. U0/U1 execution is preparatory and is not activation; this spec is not completed until all units pass independent verification.

## 9. Out of scope

- Archiving or deleting institutions, organizations, users, memberships, content, attachments, audit history or analytics data.
- Rewriting institution names in material titles or free text: the G2 product scope excludes it; editorial cleanup is a separate future activity.
- Changing the Admin management surfaces' institution wording or forms, the archived-content and lifecycle-history views (D-D), or technical documentation wording (D-E). Post-implementation reconciliation of the product documents that use "reference institutions" terminology is a documentation follow-up after U2 is verified, not part of U2 code.
- Embedded or modal feedback, a custom feedback backend, ticketing, public feedback board or notification engine.
- API-level or data-level suppression of institutional data, schema/migration/RLS/grant changes and new Admin RPCs for G2 (superseded 2026-10-23; a future need would require a new decision).
- Changing publication/archival authorization or reviving Contributor authoring.
- New analytics events, session replay, or enabling any analytics provider.
- Redesigning the taxonomy or translating the whole application.

## 10. Validation and documentation

Use unit/integration tests, browser journeys and independent review per unit; add database checks only for units that change the database (U3, U4). U2 is validated by the existing lint, typecheck, Vitest and the targeted Playwright specs (§5.1, AC-01). Verify data-affecting changes on safe local/test fixtures, never on real production records. Reconcile `docs/` only when a unit's behavior is actually verified; until then the durable docs mark it as approved future behavior, not implemented. Do not push, merge or deploy without explicit authorization.

## 11. Implementation freedom

Within an activated unit: component structure and application-layer mechanics consistent with the approved stack (for U2: how the institution rows are filtered and how the legacy value is ignored, within §5.1). Not allowed: reinterpreting the approved G2 scope, adding server-side or database changes for G2, redefining country semantics, erasing provenance, inferring origin country, expanding data collection or analytics, altering permissions, or reinterpreting suppression as archival or deletion.
