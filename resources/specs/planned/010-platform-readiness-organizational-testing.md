# SPEC-010 — Platform Readiness for Organizational Testing

**Product:** D+ Base Curricular

**Status:** PLANNED — RECONCILED; ACTIVATION BLOCKED; U5 external-link action delivered as a standalone unit (D-035 amendment, 2026-10-28) and **U5 COHERENCE VERIFIED** (2026-10-28, §2 "U5 closure record"; see AC-11), production enablement blocked on G4/G5.

**Delivery state:** NOT IMPLEMENTED AS A WHOLE. NOT IMPLEMENTATION-READY AS A WHOLE (G4, G5 OPEN; G1 SATISFIED 2026-10-26 WITH C1-C3 CONFIRMED; G3 SATISFIED AS PRODUCT DECISION 2026-10-26; U3 COMPLETED VIA SPEC-013; U4 CONTRACT PENDING; U5 EXTERNAL-LINK ACTION DELIVERED VIA STANDALONE UNIT AND U5 COHERENCE VERIFIED 2026-10-28, PRODUCTION ENABLEMENT BLOCKED ON G4/G5). U2 WAS SPLIT OUT ON 2026-10-23, OWNED BY SPEC-012, AND IS NOW COMPLETED (ACCEPTED WITH BASELINE EXCEPTION PER D-036; G2 SATISFIED). G6 SATISFIED. PRODUCT-OWNER DECISIONS 2026-10-28 ARE RECORDED IN THE D-035 AMENDMENT.

**Dependencies:** SPEC-001–007 and SPEC-009 (completed); SPEC-012 (completed, accepted with baseline exception, D-036); [`SPEC-013`](../completed/013-material-reach-country-restriction.md) (completed 2026-10-26, accepted with baseline exception, D-037). Does not depend on SPEC-008 implementation and does not activate or expand analytics; gate G5 coordinates with SPEC-008 Gate P (Privacy/Legal). U2 is owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (completed 2026-10-25). U3 is owned by [`SPEC-013`](../completed/013-material-reach-country-restriction.md).

**Repository location:** `resources/specs/planned/010-platform-readiness-organizational-testing.md`

**Decisions:** D-033, D-034, D-035, D-036 in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md). D-033 (institutional references) is implemented through SPEC-012 and closed under D-036. G1 and G3 product decisions were approved on 2026-10-26 and are recorded in §4 and §6.

## 1. Purpose

Prepare the existing platform for phased testing with Latin American partner organizations without destroying curriculum content, weakening access controls, or changing the governance model.

## 2. Activation status

Activation of this spec as a whole to `active/` is **BLOCKED**. Under `resources/specs/README.md`, `active/` means implementation-ready and the current authorized delivery slice. This spec is not implementation-ready as a whole: gates G4 and G5 (§6) remain open and block production enablement of U5; gate G1 was satisfied on 2026-10-26 with C1-C3 confirmed and U3 is now **COMPLETED** via [`SPEC-013`](../completed/013-material-reach-country-restriction.md) (accepted with baseline exception, D-037); gate G3 was satisfied as a product decision on 2026-10-26, but U4 remains blocked on its own implementation contract (U3 was completed 2026-10-26 by SPEC-013; see §6 records). **U2 was split out on 2026-10-23** (Product Owner decision) into [`SPEC-012`](../completed/012-library-institutional-references-presentation.md), which is now **COMPLETED** (accepted with baseline exception, D-036) and is the single owner of the U2 definition (G2 is SATISFIED, §6). **U5 external-link action was delivered via a standalone authorized unit** (floating feedback link in `src/app/app/layout.tsx`, env-var gated, inert when unset/invalid) and its **coherence verification is recorded 2026-10-28** (§2 "U5 closure record"), but production enablement remains blocked on G4/G5. G6 is satisfied. This spec therefore stays in `planned/`.

**Product-owner decision (Option A, 2026-10-21):** keep SPEC-010 planned. The lifecycle definitions in `resources/specs/README.md` are not changed.

**Product-owner decisions (2026-10-28).** Recorded in full in the D-035 Amendment (`docs/DECISIONS.md`): U5 may be delivered as a standalone unit; Jotform is the currently approved provider; implementation remains provider-independent; provider switching requires an authorized configuration change; icon-only mobile button is acceptable; production activation remains blocked until G4/G5 close.

**U5 validation note (2026-10-28).** Full Playwright run on the closure tree `112589d` (`E2E_PORT=3221`, local Supabase, dev server): 122 tests — 111 passed, 11 failed. Baseline comparison tree `d811f5f` (implementer run, `E2E_PORT=3218`): 115 tests — 106 passed, 9 failed. Classification of the 11 failures:

- (a) Documented D-036/D-037 baseline failures (6): `library-explorer.spec.ts:522` (modal overlay Filtros), `module-detail.spec.ts:193`, `:446`, `:467` (768px), `:467` (390px), and `contributions.spec.ts:138` (documented in D-036/D-037 as the contributions "Admins publish new and successor versions" journey).
- (b) Additional pre-existing failures not in the D-036/D-037 sets (3), also failing on baseline `d811f5f`: `archival.spec.ts:78`, `archival.spec.ts:184`, `contributions.spec.ts:90`.
- (c) Database-state variability (1): `archival-governance.spec.ts:216` (D-036 failure #1; expected 3 headings, received 20). It passed in the SPEC-013 runs, failed in the closure full run and reproduced on a detached `d811f5f` checkout with the identical assertion, consistent with residual database rows (D-037 test-isolation debt); it did not fail in the implementer's baseline/final full runs.
- (d) Environment-related timeout (1): `admin-organization-users.spec.ts:121` (120 s timeout waiting for the "Activar usuario" button in the full run). It passed when re-run alone (38 s) and on re-run with `archival-governance.spec.ts`.

Full-suite counts differ between runs (9 reported by the implementer vs 11 observed by the orchestrator) because of (c) and (d); the failure sets are not claimed identical across trees. No failure is attributable to the feedback link; no Playwright error mentions "intercepts pointer events"; `feedback-link.spec.ts` (7) and `shell.spec.ts` (11) pass. These failures are not represented as passing and no baseline exception is extended by this note (accepting any remaining failure requires a Product Owner decision at closure time per the baseline-findings rule below).

**U5 closure record (2026-10-28).** **U5 COHERENCE VERIFIED** (U5 only; not the spec as a whole). Verification commit `3e8f85d`; implementation commits `8eb1347`, `d542bd7`, `112589d`, `3e8f85d`; baseline `d811f5f`. All review findings are resolved: R1-1 to R1-10 (verified by independent review of `d542bd7`) and R2-1 to R2-6 (verified by orchestrator diff inspection; no further independent review cycle was run). Checks passed: build (exit 0), typecheck, lint, vitest (637 passed, 1 skipped; feedback unit tests 27/27), and focused Playwright (`feedback-link.spec.ts` 7/7, `shell.spec.ts` 11/11). The Playwright baseline failures listed in the U5 validation note above and in D-036/D-037 remain separate pre-existing findings: they are not represented as passing and no baseline exception is extended. G4 and G5 still block production activation, and the Production env var `NEXT_PUBLIC_FEEDBACK_FORM_URL` must not be set until both close. This record does not satisfy G4/G5, does not activate SPEC-010, and SPEC-010 remains PLANNED and NOT closed: U0, U1 and U4 still need verification or removal by recorded decision, and U5's own final closure still requires the production-enablement gates.

**Minimum conditions for a later activation request:**

- Every gate that blocks a unit intended for the active slice is resolved and recorded in §6 (decision, date, decider), and that unit's open specification items are written into this spec or into a split spec.
- A separate preflight and an explicit activation, per `resources/specs/README.md` Completion rule item 6.
- The whole-spec-or-split question for U2 is decided: **split** (SPEC-012, now completed). The split question for U3 is decided: **split** into [`SPEC-013`](../completed/013-material-reach-country-restriction.md) (completed 2026-10-26, accepted with baseline exception, D-037). A later activation of the remaining units (U0, U1, U4, U5) is decided at that time.

While this spec is planned, none of its remaining units (U4; U5 beyond the already delivered and coherence-verified external-link action) is an authorized delivery slice, and nothing here authorizes their implementation. U2 is authorized only by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md), not by this spec. U3 is authorized only by [`SPEC-013`](../completed/013-material-reach-country-restriction.md), not by this spec; U3 is completed and SPEC-010's SPEC-013 dependency is satisfied. U0 and U1 are permitted preparatory work only because they mutate nothing (§5). **Completion condition:** this spec cannot move to `completed/` until U0, U1, U4 and U5 have each been implemented/verified against §8 (or explicitly removed by a recorded decision).

## 3. Current implemented behavior (verified read-only on `main`; U0 confirms Cloud data)

- **Institutions** are an implemented governed content type (`institutions`, `institution_revisions`, `module_institutions`; D-009). They were reader-visible before SPEC-012; after SPEC-012 they remain in the data model and Admin management but are no longer displayed on reader surfaces. Reader-facing suppression covers: the Library `Instituciones` tab (`Tipo` control) and results section, search suggestions (`/api/library/suggestions`), module detail `Instituciones` section (page and overlay), the institution detail route, the instructor subtitle `institution` value, and material `source_or_institution` displayed as `Fuente o institución`. Generic reader-facing copy that mentioned "instituciones de referencia" (`src/app/app/layout.tsx:66-67`, the authenticated shell footer) was replaced by SPEC-012. The `search_curriculum` RPC still returns institution rows, but the Library filters them in application code before results, counts and filter options are derived. (Current-state detail and the verified file list for U2 live in [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) §3 and §5; this bullet is kept as the SPEC-010 baseline and is not a requirement.)
- **Country** is stored as free-text `country_or_scope` on material and institution revisions and free-text `country` on instructor revisions (no value list; the application validates length only). The Library filter `País o alcance` lists the distinct `country_or_scope` values of current results and filters by exact normalized match; modules have no country and are excluded when it is applied. Reach and origin are not separate fields today.
- **Organizations** have no country attribute. No content-origin country field exists.
- **Feedback:** a floating "Enviar comentarios" action is implemented in the authenticated shell (`src/app/app/layout.tsx`). It is a plain external anchor that opens `NEXT_PUBLIC_FEEDBACK_FORM_URL` in a new tab when that URL is a valid absolute `https:` URL without embedded credentials; the action is inert and renders nothing when the env var is unset, empty, whitespace-only, or invalid. The action appends no query parameters, transmits no tokens/identity/context, emits no analytics events, and uses no iframe, modal or backend. Production enablement is an operational control: the Production env var must not be set until G4 and G5 close.
- **Domain:** `bc.democraciamas.com` is not referenced in application code or configuration. Whether it is served is not verified here (U1).
- **Cloud data** (which institutions, countries, and legacy values actually exist): inventoried read-only by U0 (aggregate counts only); see [`docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`](../../../docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md) and gate G6 in §6. The repository reference inventory/impact map half of U0 was completed by the 2026-10-26 preflight (verified surfaces: `material_revisions.country_or_scope` and `institution_revisions.country_or_scope` columns, `search_curriculum`, the `create_contribution` / `update_contribution` / `create_successor_draft` / `publish_content_draft` RPC payload whitelists, `private.validate_submission`, the material/institution/instructor form inputs, `src/lib/contributions/validation.ts`, `src/app/app/contributions/actions.ts`, `src/lib/curriculum/queries.ts` `getLibrary`, and the analytics `country` filter type). The Cloud inventory half remains the authoritative G6 evidence.
- **Domain verification (U1 partial).** As of the 2026-10-26 preflight: `bc.democraciamas.com` resolves to Vercel, HTTPS returns 200 with HSTS, HTTP returns 308 to HTTPS, `/app` unauthenticated redirects to `/login`, `/api/library/suggestions` returns 401, and `/login` is Spanish-first (`lang=es`) with Google and Email OTP options. NOT verified: Vercel project/alias binding, deployed commit, Google OAuth redirect configuration, authenticated flows, mobile usability, accessibility.

## 4. Approved decisions

Full text: D-033, D-034, D-035.

**D1 — Institutional references (D-033).** Institutional references do not appear in the user-facing Library experience. Preserve all institution records, existing relationships, materials, teaching notes, historical provenance and audit events. Do not archive or hard-delete institutions. Do not modify published revisions destructively. Do not change canonical organizations, memberships or authorization.

**D1 scope.** Owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (§4, §5, §6, §11): presentation-layer removal of institutional references from the reader-facing Library (decisions D-B to D-E of G2), retaining all data and data types, with the accepted MVP residual exposure. Nothing server-side or data-related changes. This spec does not duplicate those requirements.

G2 decisions D-A to D-E are sub-decisions of gate G2 recorded in the G2 record (§6) and in D-033; they are not entries of the `docs/DECISIONS.md` register and must not be confused with register IDs such as D-030 to D-035. D-A (Admin RPC for the two fields) is superseded.

**D2 — Content origin country (D-034).** The Admin explicitly selects the content's country of origin. It is not inferred from the Admin's organization, email domain, IP or location, and has no organization-country dependency. It is distinct from geographic reach. Historical content with unknown provenance is `Sin dato`. Published-revision immutability is respected and provenance is preserved across successor revisions. Country metadata creates no organization-specific visibility restriction. Mutation is Admin-only.

**D2a — G3 semantics decided 2026-10-26; U4-a and U4-b resolved as product decisions.** For v1, origin country applies to materials only. It is an explicit Admin selection. It uses ISO 3166-1 worldwide countries and territories, with canonical Spanish display names (U4-a resolved). Historical unknown origin = `Sin dato`. It is exposed as a separate `País de origen` filter. The existing reach label `País o alcance` is kept. Origin is never inferred from organizations or users. An explicit origin-country selection is required for newly created materials; `Sin dato` is preserved for existing materials with unknown origin (U4-b resolved). U4 remains owned by SPEC-010 but is **inactive** until its own implementation contract is written and U3 is complete.

**D3 — External feedback form (D-035).** The first version is a visible feedback action that opens an external Jotform URL. No embedded iframe, no modal integration, no custom feedback backend, no new analytics events, and no automatic transmission of tokens, search queries, private content or user identifiers. Spanish-first label; accessible keyboard and mobile behavior. The approved form URL and privacy-governance details are prerequisites for production enablement; the implementation itself is provider-independent and accepts any absolute `https:` URL without embedded credentials. An embedded experience may be considered in a future spec.

**D4 — Geographic reach (G1) decided and confirmed 2026-10-26.** The material reach selector offers a controlled list of Latin American countries, stored as canonical Spanish country names. Existing legacy values are preserved with NO destructive migration. Unchanged legacy values may carry over into successor Drafts. New or modified unsupported values are rejected. Regional and multi-country selections are excluded in v1. The concrete list and scoping confirmations (C1-C3) are confirmed in [`SPEC-013`](../completed/013-material-reach-country-restriction.md) §5. U3 is owned by [`SPEC-013`](../completed/013-material-reach-country-restriction.md).

**Other stakeholder intent retained.** `bc.democraciamas.com` is the approved public subdomain (no DNS or deployment change presumed). The *reach* country selector offers only an approved Latin American set. Analytics opt-in, default-off behavior and revocation are unchanged.

## 5. Implementation units

| Unit | Scope | Mutation | Blocked by | Status |
|---|---|---|---|---|
| **U0** | Read-only Cloud data inventory and repository reference inventory/impact map: institutions and their relationships, free-text institutional references, country values on every content type, legacy reach values, which reader surfaces and data boundaries expose each. Output is a report with aggregate counts, not content or personal data. Satisfies G6. | None. No migration, no Cloud write, no secret or personal data in the report. | — | PREPARATORY (no implementation authority); Cloud inventory COMPLETE and reviewed (G6, §6) |
| **U1** | Verify `bc.democraciamas.com`, navigation, mobile usability, accessibility and regression behavior. No DNS assumption: if verification shows a DNS or deployment change is needed, stop and request separate authorization. | None to application code unless a defect is found; defects are reported, not fixed. | — | PREPARATORY (no implementation authority); partial result recorded in §3 |
| **U2** | Remove institution entities and institutional wording from the user-facing Library experience, in the presentation layer only. | Code only (`src/`, `tests/`). No schema, migration, RLS, grant or function change. | — (G2 SATISFIED; G6 not applicable) | **COMPLETED — owned by SPEC-012 (accepted with baseline exception, D-036)** |
| **U3** | Restrict the material *reach* selector to the approved Latin American set, enforced at the database boundary; legacy values handled by an explicit non-destructive rule. | Yes (schema migration + app) | G1, G6 (U0 complete), C1-C3 confirmation | **COMPLETED — owned by SPEC-013 (accepted with baseline exception, D-037)** |
| **U4** | Content-origin country: schema and provenance, Admin selection, filter, display, `Sin dato` for unknown history, successor-revision carry-over. Includes the relationship to the existing `País o alcance` filter. | Yes | G3 (semantics decided), G6 (U0 complete), U4-a/U4-b resolved; U3 completed 2026-10-26 | **BLOCKED — G3 semantics and U4-a/U4-b decided; pending its own implementation contract (U3 completed 2026-10-26)** |
| **U5** | Visible Spanish-first feedback action opening the approved external form URL (Jotform is the currently approved provider; implementation is provider-agnostic and accepts any absolute `https:` URL without embedded credentials). | Code only | G4, G5 for production enablement | **EXTERNAL-LINK ACTION DELIVERED VIA STANDALONE UNIT AND COHERENCE VERIFIED (U5, 2026-10-28; §2 U5 closure record) — production enablement blocked on G4/G5** |

U0 and U1 are preparatory, read-only/verification activities only. Executing them is not SPEC activation, does not authorize implementation of any gated unit (U3–U5), and does not by itself resolve any gate, except that a completed, reviewed U0 report is the evidence for G6. They are permitted while the spec is planned only because they mutate nothing. If U1 finds a defect, report it; do not fix it under this spec.

U3 and U4 may be activated independently once their own gates and implementation contracts are complete, but U3 precedes U4 because they share surfaces (the material form and the reader filter `País o alcance`). Any data-dependent migration of U3 or U4 requires G6, satisfied by a completed U0 report; U2 (SPEC-012) has no data-dependent operation.

### 5.1 U2 — split out to SPEC-012 (COMPLETED)

U2 (Library presentation change) is owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md), which holds the purpose, approved behavior, affected surfaces, implementation notes, non-goals, authorization invariants, acceptance criteria, test inventory and closure record. Institutional data types are retained; only reader-facing presentation and application-layer filtering change. Nothing is duplicated here; if this section and SPEC-012 ever differ, SPEC-012 governs U2. U2 is completed and accepted with a baseline Playwright exception (D-036).

### 5.2 U3 — split out to SPEC-013 (COMPLETED)

U3 (material reach country restriction) is owned by [`SPEC-013`](../completed/013-material-reach-country-restriction.md), which holds the purpose, activation conditions, verified current behavior, approved G1 policy, confirmed country list and resolved ambiguities, scoping confirmations C1-C3, technical contract R-1 to R-7, affected surfaces, non-goals, acceptance criteria, validation commands, authorization/analytics invariants, activation record and closure record. Nothing is duplicated here; if this section and SPEC-013 ever differ, SPEC-013 governs U3. U3 was activated on 2026-10-26 and implemented/closed on 2026-10-26 (accepted with baseline exception, D-037).

## 6. Gates

G1 is **SATISFIED** 2026-10-26 (decided and confirmed with C1-C3). G3 is **SATISFIED AS PRODUCT DECISION** 2026-10-26 (U4 remains inactive pending its own implementation contract; U3 was completed 2026-10-26 via SPEC-013). G4 and G5 are OPEN. G2 is SATISFIED (Product Owner, 2026-10-23; record below) and its unit U2 is owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (COMPLETED 2026-10-25, accepted with baseline exception per D-036). G6 is SATISFIED (record below). Resolutions are recorded here (decision, date, decider).

| Gate | What must be decided | Blocks | Owner |
|---|---|---|---|
| **G1** | Approved Latin American country list (including territories and edge cases) and the rule for legacy non-conforming `country_or_scope` values (non-destructive). | U3 (SPEC-013) | Product Owner. **SATISFIED** 2026-10-26 — decided and confirmed with C1-C3 (see record below) |
| **G2** | Exact scope of institutional-reference suppression: which reader surfaces; whether instructor `institution`, material `source_or_institution`, and institution names in free text are in scope; how Admin management surfaces are treated. | U2 (SPEC-012) | Product Owner. **SATISFIED** (2026-10-23); see record below |
| **G3** | Content types eligible for origin-country metadata and filtering; the permitted value set (D2 does not tie it to the reach list); successor-revision semantics; how the origin filter relates to the existing `País o alcance` filter. | U4 | Product Owner. **SATISFIED AS PRODUCT DECISION** 2026-10-26 — U4-a/U4-b resolved; U4 remains blocked on its own implementation contract (U3 completed 2026-10-26; see record below) |
| **G4** | Approved Jotform URL; form owner; fields; retention; privacy requirements (including whether any page context may be passed — D3 permits none by default). | U5 | Not recorded |
| **G5** | Privacy Notice coordination with SPEC-008 where applicable (e.g. whether the external feedback form requires Notice wording). Feedback is separate from analytics consent. | U5 | Privacy/Legal (per SPEC-008 Gate P); not otherwise recorded |
| **G6** | Read-only Cloud data inventory completed and reviewed before any data-dependent migration or suppression operation. Satisfied by U0, which is itself read-only. | U3, U4 | **SATISFIED** — see record below |

### G2 resolution record

- **Status:** SATISFIED (2026-10-23); U2 completed 2026-10-25 (accepted with baseline exception, D-036).
- **Decision dates and decider:** 2026-10-22 (original scope and decisions D-A to D-E), 2026-10-23 (simplification to a presentation-layer change, which supersedes the 2026-10-22 data-boundary requirement), 2026-10-23 (formal recording of G2 as SATISFIED, split of U2 into SPEC-012, and activation), and 2026-10-25 (SPEC-012 closure with baseline exception). Product Owner, communicated by the user. No personal name is recorded: the repository does not establish one.
- **Label note:** "D-A" to "D-E" are sub-decisions of gate G2. They are **not** entries of the `docs/DECISIONS.md` register and carry no register number; their durable record is this section plus D-033. Do not confuse them with register IDs such as D-030 to D-035.

**(a) Product decisions resolved (IMPLEMENTED VIA SPEC-012; CLOSED 2026-10-25 WITH BASELINE EXCEPTION D-036).**

- Institution entities, navigation, filters, suggestions and search results are removed from the user-facing Library; instructor `institution` and material `source_or_institution` are not displayed; the institution detail route returns 404. Admin and non-Admin users get the same Library. Admin management surfaces keep full institution management. Data types are retained.
- Institutional data may remain accessible through existing APIs to users who already have access. This residual exposure is accepted for the MVP (`docs/SECURITY.md`). Existing authentication, authorization, roles and RLS stay intact; nothing is weakened and no access path is added.
- Content, relationships, revisions, history, audit and provenance are preserved. Publication, successor-revision and archival rules and the analytics contract are unchanged. Free text is not rewritten (separate future editorial cleanup). `source_url` is unchanged.
- **D-A — SUPERSEDED (2026-10-23).** The dedicated Admin RPC for the two fields and any restriction of direct column access are not required; no server-side change is made.
- **D-B — kept.** Legacy `entity=institution` (including stale URLs) is normalized to the default Library view: no error, no empty institutions section, no `Tipo: Instituciones` chip.
- **D-C — kept.** `reference` remains a valid entity value and represents materials.
- **D-D — kept, unchanged because nothing server-side changes.** The archived-content and lifecycle-history views keep their existing permissions and behavior.
- **D-E — kept.** Generic institutional-reference terminology (for example "instituciones de referencia") is removed from reader-facing interface text only; Admin management surfaces and technical documentation are unaffected. The footer replacement copy was approved by the Product Owner on 2026-10-23 ("Módulos, programas, docentes y materiales en un solo lugar.").

**(b) Activation record.** Activated and owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) on 2026-10-23; completed 2026-10-25 (accepted with baseline exception, D-036): U2 split out of this spec, SPEC-012 ACTIVE alongside SPEC-008, `docs/TERMS_OF_USE.md` excluded from implementation with a Privacy/Legal follow-up. Spanish copy review of the footer is satisfied by the approved copy. `docs/PRODUCT.md`, `docs/CONTENT_MODEL.md`, `docs/SECURITY.md` and `docs/DECISIONS.md` (D-033) were reconciled 2026-10-25.

**(c) Authorization or governance blockers.** None introduced. U2 changes no authentication, authorization, role, RLS or grant behavior and adds no access path. The technical items that existed only for the abandoned data-boundary design (enforcement mechanism, Admin RLS preservation, staged deployment, grant posture, Admin RPC contract, database dry-run/rollback; labelled O-1, O-6, O-8 to O-13 in earlier drafts) are withdrawn, and O-2 to O-5 and O-7 are resolved by the decisions above. The abandoned design is kept as a historical record in [`docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`](../../../docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md); it is not an active requirement or a blocker.

- **Relation to the G6 record:** the G6 record below predates this decision and is left unaltered. G6 stays SATISFIED; U2 has no data-dependent operation, so G6 has nothing to gate for it (it still applies to U3 and U4).
- **What this record does not do:** it does not resolve G4 or G5, does not satisfy G1 or G3 (both were decided later, on 2026-10-26, and are recorded in their own §6 records), does not alter the G6 record, does not activate this spec (which stays planned), and does not authorize implementation of U3–U5.

### G1 resolution record

- **Status:** **SATISFIED** 2026-10-26 (Product Owner confirmed C1-C3).
- **Decision date and decider:** 2026-10-26. Product Owner, communicated by the user. No personal name is recorded: the repository does not establish one.
- **Product decisions resolved.**
  - Reach is a controlled list of Latin American countries, stored as canonical Spanish country names.
  - Existing legacy `country_or_scope` values are preserved with NO destructive migration.
  - Unchanged legacy values may carry over into successor Drafts.
  - New or modified unsupported values are rejected.
  - Regional and multi-country selections are excluded in v1.
- **Confirmed concrete list and scoping confirmations.** The confirmed v1 list (20 canonical Spanish names), the resolved ambiguities and scoping confirmations C1-C3 live in [`SPEC-013`](../completed/013-material-reach-country-restriction.md) §5. U3 is owned by [`SPEC-013`](../completed/013-material-reach-country-restriction.md) and is completed (accepted with baseline exception, D-037). SPEC-010 keeps a pointer only.
- **What this record does not do:** it does not implement U3, it does not resolve G3/G4/G5, it does not change institution or instructor country fields, and it does not alter SPEC-012 or SPEC-008.

### G3 resolution record

- **Status:** **SATISFIED AS PRODUCT DECISION** 2026-10-26; U4 remains **inactive** until its own implementation contract is written and U3 is complete.
- **Decision date and decider:** 2026-10-26. Product Owner, communicated by the user. No personal name is recorded: the repository does not establish one.
- **Product decisions resolved.**
  - Content origin country applies to materials only for v1.
  - It is an explicit Admin selection.
  - It uses ISO 3166-1 worldwide countries and territories, with canonical Spanish display names.
  - Historical unknown origin = `Sin dato`.
  - It is exposed as a separate `País de origen` filter.
  - The existing reach label `País o alcance` is kept.
  - Published-revision immutability and successor provenance are preserved.
  - Origin is never inferred from organizations, users, email domains, IP addresses or locations.
  - An explicit origin-country selection is **required** for newly created materials; `Sin dato` is preserved for existing materials with unknown origin.
- **U4 contract work remaining.** The exact ISO value list as a concrete constant/contract, how "required" is enforced at the database and publication boundary, successor-revision handling and the `País de origen` filter mechanics are still to be written into a U4 specification.
- **Dependencies.** U4 may be activated independently once its implementation contract is written and U3 is complete, because U3 and U4 share surfaces (material form, reader `País o alcance` filter). U3 must complete first.
- **Owner.** U4 remains owned by SPEC-010 until a future split decision.
- **What this record does not do:** it does not write the U4 implementation contract, it does not activate U4, it does not authorize implementation, it does not resolve G1/G4/G5, it does not change the reach field or SPEC-013 scope, and it does not alter SPEC-012 or SPEC-008.

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

Origin and reach filters must never bypass publication, membership, Storage or RLS constraints, and create no organization-specific visibility. Unknown provenance is `Sin dato`, never guessed. Published revisions are not edited in place; provenance survives successor revisions. Country validation and filtering are enforced at server and data boundaries, not only in the UI. (Institutional-reference suppression is a presentation-layer change owned by SPEC-012; see D1.)

## 8. Acceptance criteria

Criteria apply when the corresponding unit is activated and implemented. U2's criteria are owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (SPEC-012 AC-01 to AC-13; AC-12 accepted with baseline exception, D-036). U3's criteria are owned by [`SPEC-013`](../completed/013-material-reach-country-restriction.md) (SPEC-013 AC-01 to AC-14; AC-12 accepted with baseline exception, D-037; AC-14 covers direct Published inserts by fixtures). **Roll-up:** this spec is not complete until the criteria below are met for U0, U1, U4 and U5. The SPEC-012 dependency is satisfied; the SPEC-013 dependency is satisfied.

- **AC-01 (U2) — owned by SPEC-012.** See [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) §10 and §17 (SPEC-012 AC-01 to AC-13; AC-12 baseline exception). Not duplicated here.
- **AC-02 (U0, U3, U4; U2 owned by SPEC-012 AC-09):** Institution records, relationships, materials, teaching notes, provenance and audit events are intact; institutions are neither archived nor deleted; published revisions are not destructively modified; canonical organizations, memberships and authorization are unchanged. A U0 inventory precedes any data-dependent operation (U3, U4); any such operation has a documented dry-run and rollback.
- **AC-03 (U3) — owned by SPEC-013.** See [`SPEC-013`](../completed/013-material-reach-country-restriction.md) §9 (SPEC-013 AC-01 to AC-14; AC-12 accepted with baseline exception, D-037; AC-14 covers direct Published inserts by fixtures). Not duplicated here.
- **AC-04 (U4):** Origin country is Admin-selected, never inferred, distinct from reach, `Sin dato` for unknown history, preserved across successor revisions, Admin-mutation-only, creates no organization-specific visibility restriction, and is displayed and filtered consistently for the G3-approved types (materials, for v1).
- **AC-05 (U3, U4):** Search combined with reach, origin and other filters behaves correctly; `Sin dato` and zero-result states are understandable.
- **AC-06 (U3, U4; U2 owned by SPEC-012 AC-10):** No unpublished, archived, historical or private content leaks through country filters or query endpoints; Admin permissions are unchanged.
- **AC-07 (U5):** A visible feedback action with a Spanish-first label opens the configured external URL, works with keyboard and on mobile, and is rendered only when a valid absolute `https:` URL without embedded credentials is configured. Production enablement also requires G4/G5. The action is inert when the env var is unset, empty, whitespace-only, or invalid. No iframe, modal integration or custom backend.
- **AC-08 (U5):** The feedback action transmits no tokens, search queries, private content or user identifiers, appends no context parameters, and adds no analytics events.
- **AC-09 (all; U2 owned by SPEC-012 AC-11):** Existing consent/revocation behavior and SPEC-008 gates are unchanged; analytics is neither activated nor expanded.
- **AC-10 (U1 and regression for every unit; U2 owned by SPEC-012 AC-12; U3 owned by SPEC-013 AC-12):** Existing upload, viewing, downloading, publication and archival regressions pass, subject to the SPEC-012 AC-12 baseline exception recorded in D-036 and the SPEC-013 AC-12 baseline exception recorded in D-037; the deployed domain is verified without assuming DNS changes.
- **AC-11 (governance):** This spec is not activated as a whole until the activation conditions in §2 are met; U4 may not start before its gates are resolved in §6. U5's external-link action was delivered via a standalone authorized unit behind an env var (Product Owner, 2026-10-28) and remains inert until a valid URL is configured; it does not by itself activate SPEC-010 or satisfy U5's production gate. U2 is completed and governed by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (SPEC-012 AC-13; accepted with baseline exception, D-036). U3 is completed and governed by [`SPEC-013`](../completed/013-material-reach-country-restriction.md) (SPEC-013 AC-13; accepted with baseline exception, D-037). U0/U1 execution is preparatory and is not activation. This spec is not completed until the remaining units pass independent verification.

**Baseline-findings rule for U4 and later units.** The seven Playwright failures recorded in D-036 / SPEC-012 §17.2 and the six Playwright failures recorded in D-037 / SPEC-013 §12 are KNOWN BASELINE FINDINGS for their respective specs, not an exception automatically accepted for any future unit. The implementer must first re-run the named specs on the base commit for the unit and record which reproduce; after the change, report each before/after. Any failure outside those recorded sets, or any recorded failure failing at a different assertion, is a regression. Accepting remaining baseline failures for closure of U4 or U5 requires a NEW explicit Product Owner decision at closure time; they must never be described as passing.

## 9. Out of scope

- Archiving or deleting institutions, organizations, users, memberships, content, attachments, audit history or analytics data.
- Rewriting institution names in material titles or free text (editorial cleanup is a separate future activity). U2-specific out-of-scope items (Admin management surfaces, archived/lifecycle-history views, technical documentation wording, API/data-level suppression, `docs/TERMS_OF_USE.md`, generic "referencia(s)" wording) are owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) §14.
- Embedded or modal feedback, a custom feedback backend, ticketing, public feedback board or notification engine.
- Changing publication/archival authorization or reviving Contributor authoring.
- New analytics events, session replay, or enabling any analytics provider.
- Redesigning the taxonomy or translating the whole application.

## 10. Validation and documentation

Use unit/integration tests, browser journeys and independent review per unit; add database checks only for units that change the database (U3, U4). U2 is validated and closed as specified in [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) §10 and §17 (existing lint, typecheck, Vitest, build and targeted Playwright specs; no database check applies; AC-12 accepted with baseline exception, D-036). Verify data-affecting changes on safe local/test fixtures, never on real production records. Reconcile `docs/` when a unit's behavior is verified; U2 reconciliation was performed 2026-10-25. Do not push, merge or deploy without explicit authorization.

## 11. Implementation freedom

Within an activated unit: component structure and application-layer mechanics consistent with the approved stack (U2 freedom is in [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) §15). Not allowed: reinterpreting approved gate decisions, redefining country semantics, erasing provenance, inferring origin country, expanding data collection or analytics, altering permissions, or reinterpreting suppression as archival or deletion.
