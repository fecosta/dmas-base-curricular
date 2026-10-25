# SPEC-010 — Platform Readiness for Organizational Testing

**Product:** D+ Base Curricular

**Status:** PLANNED — RECONCILED; ACTIVATION BLOCKED

**Delivery state:** NOT IMPLEMENTED. NOT STARTED. NOT IMPLEMENTATION-READY AS A WHOLE (GATES G1, G3, G4, G5 OPEN; U3–U5 BLOCKED). U2 WAS SPLIT OUT ON 2026-10-23, OWNED BY SPEC-012, AND IS NOW COMPLETED (ACCEPTED WITH BASELINE EXCEPTION PER D-036; G2 SATISFIED). G6 SATISFIED.

**Dependencies:** SPEC-001–007 and SPEC-009 (completed); SPEC-012 (completed, accepted with baseline exception, D-036). Does not depend on SPEC-008 implementation and does not activate or expand analytics; gate G5 coordinates with SPEC-008 Gate P (Privacy/Legal). U2 is owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (completed 2026-10-25).

**Repository location:** `resources/specs/planned/010-platform-readiness-organizational-testing.md`

**Decisions:** D-033, D-034, D-035, D-036 in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md). D-033 (institutional references) is implemented through SPEC-012 and closed under D-036.

## 1. Purpose

Prepare the existing platform for phased testing with Latin American partner organizations without destroying curriculum content, weakening access controls, or changing the governance model.

## 2. Activation status

Activation of this spec as a whole to `active/` is **BLOCKED**. Under `resources/specs/README.md`, `active/` means implementation-ready and the current authorized delivery slice. This spec is not implementation-ready as a whole: gates G1, G3, G4 and G5 (§6) are open and block U3–U5. **U2 was split out on 2026-10-23** (Product Owner decision) into [`SPEC-012`](../completed/012-library-institutional-references-presentation.md), which is now **COMPLETED** (accepted with baseline exception, D-036) and is the single owner of the U2 definition (G2 is SATISFIED, §6). G6 is satisfied. This spec therefore stays in `planned/`.

**Product-owner decision (Option A, 2026-10-21):** keep SPEC-010 planned. The lifecycle definitions in `resources/specs/README.md` are not changed.

**Minimum conditions for a later activation request:**

- Every gate that blocks a unit intended for the active slice is resolved and recorded in §6 (decision, date, decider), and that unit's open specification items are written into this spec.
- A separate preflight and an explicit activation, per `resources/specs/README.md` Completion rule item 6.
- The whole-spec-or-split question for U2 is decided: **split** (SPEC-012, now completed). A later activation of the remaining units (U3–U5, and U0/U1 if formalized) is decided at that time.

While this spec is planned, none of its remaining units (U3–U5) is an authorized delivery slice, and nothing here authorizes their implementation. U2 is authorized only by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md), not by this spec. U0 and U1 are permitted preparatory work only because they mutate nothing (§5). **Completion condition:** this spec cannot move to `completed/` until U0, U1, U3, U4 and U5 have each been implemented/verified against §8 (or explicitly removed by a recorded decision). The SPEC-012 dependency is satisfied.

## 3. Current implemented behavior (verified read-only on `main`; U0 confirms Cloud data)

- **Institutions** are an implemented governed content type (`institutions`, `institution_revisions`, `module_institutions`; D-009). They were reader-visible before SPEC-012; after SPEC-012 they remain in the data model and Admin management but are no longer displayed on reader surfaces. Reader-facing suppression covers: the Library `Instituciones` tab (`Tipo` control) and results section, search suggestions (`/api/library/suggestions`), module detail `Instituciones` section (page and overlay), the institution detail route, the instructor subtitle `institution` value, and material `source_or_institution` displayed as `Fuente o institución`. Generic reader-facing copy that mentioned "instituciones de referencia" (`src/app/app/layout.tsx:66-67`, the authenticated shell footer) was replaced by SPEC-012. The `search_curriculum` RPC still returns institution rows, but the Library filters them in application code before results, counts and filter options are derived. (Current-state detail and the verified file list for U2 live in [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) §3 and §5; this bullet is kept as the SPEC-010 baseline and is not a requirement.)
- **Country** is stored as free-text `country_or_scope` on material and institution revisions and free-text `country` on instructor revisions (no value list; the application validates length only). The Library filter `País o alcance` lists the distinct `country_or_scope` values of current results and filters by exact normalized match; modules have no country and are excluded when it is applied. Reach and origin are not separate fields today.
- **Organizations** have no country attribute. No content-origin country field exists.
- **Feedback:** no feedback action, JotForm reference, or feedback code exists.
- **Domain:** `bc.democraciamas.com` is not referenced in application code or configuration. Whether it is served is not verified here (U1).
- **Cloud data** (which institutions, countries, and legacy values actually exist): inventoried read-only by U0 (aggregate counts only); see [`docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`](../../../docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md) and gate G6 in §6. The repository reference inventory/impact map half of U0 is not part of that evidence.

## 4. Approved decisions

Full text: D-033, D-034, D-035.

**D1 — Institutional references (D-033).** Institutional references do not appear in the user-facing Library experience. Preserve all institution records, existing relationships, materials, teaching notes, historical provenance and audit events. Do not archive or hard-delete institutions. Do not modify published revisions destructively. Do not change canonical organizations, memberships or authorization.

**D1 scope.** Owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (§4, §5, §6, §11): presentation-layer removal of institutional references from the reader-facing Library (decisions D-B to D-E of G2), retaining all data and data types, with the accepted MVP residual exposure. Nothing server-side or data-related changes. This spec does not duplicate those requirements.

G2 decisions D-A to D-E are sub-decisions of gate G2 recorded in the G2 record (§6) and in D-033; they are not entries of the `docs/DECISIONS.md` register and must not be confused with register IDs such as D-030 to D-035. D-A (Admin RPC for the two fields) is superseded.

**D2 — Content origin country (D-034).** The Admin explicitly selects the content's country of origin. It is not inferred from the Admin's organization, email domain, IP or location, and has no organization-country dependency. It is distinct from geographic reach. Historical content with unknown provenance is `Sin dato`. Published-revision immutability is respected and provenance is preserved across successor revisions. Country metadata creates no organization-specific visibility restriction. Mutation is Admin-only. Eligible content types and successor-revision semantics must be specified before U4 (G3).

**D3 — External feedback form (D-035).** The first version is a visible feedback action that opens an external JotForm URL. No embedded iframe, no modal integration, no custom feedback backend, no new analytics events, and no automatic transmission of tokens, search queries, private content or user identifiers. Spanish-first label; accessible keyboard and mobile behavior. The approved form URL and privacy-governance details are prerequisites for enabling the action. An embedded experience may be considered in a future spec.

**Other stakeholder intent retained.** `bc.democraciamas.com` is the approved public subdomain (no DNS or deployment change presumed). The *reach* country selector offers only an approved Latin American set. Analytics opt-in, default-off behavior and revocation are unchanged.

## 5. Implementation units

| Unit | Scope | Mutation | Blocked by | Status |
|---|---|---|---|---|
| **U0** | Read-only Cloud data inventory and repository reference inventory/impact map: institutions and their relationships, free-text institutional references, country values on every content type, legacy reach values, which reader surfaces and data boundaries expose each. Output is a report with aggregate counts, not content or personal data. Satisfies G6. | None. No migration, no Cloud write, no secret or personal data in the report. | — | PREPARATORY (no implementation authority); Cloud inventory COMPLETE and reviewed (G6, §6) |
| **U1** | Verify `bc.democraciamas.com`, navigation, mobile usability, accessibility and regression behavior. No DNS assumption: if verification shows a DNS or deployment change is needed, stop and request separate authorization. | None to application code unless a defect is found; defects are reported, not fixed. | — | PREPARATORY (no implementation authority) |
| **U2** | Remove institution entities and institutional wording from the user-facing Library experience, in the presentation layer only. | Code only (`src/`, `tests/`). No schema, migration, RLS, grant or function change. | — (G2 SATISFIED; G6 not applicable) | **COMPLETED — owned by SPEC-012 (accepted with baseline exception, D-036)** |
| **U3** | Restrict the *reach* selector to the approved Latin American set, validated on client and server; legacy values handled by an explicit non-destructive rule. | Yes | G1, G6 (U0 complete) | BLOCKED |
| **U4** | Content-origin country: schema and provenance, Admin selection, filter, display, `Sin dato` for unknown history, successor-revision carry-over. Includes the relationship to the existing `País o alcance` filter. | Yes | G3, G6 (U0 complete) | BLOCKED |
| **U5** | Visible Spanish-first feedback action opening the approved external JotForm URL. | Code only | G4, G5 | BLOCKED |

U0 and U1 are preparatory, read-only/verification activities only. Executing them is not SPEC activation, does not authorize implementation of any gated unit (U3–U5), and does not by itself resolve any gate, except that a completed, reviewed U0 report is the evidence for G6. They are permitted while the spec is planned only because they mutate nothing. If U1 finds a defect, report it; do not fix it under this spec.

U3 and U4 are independent of one another unless a recorded gate resolution says otherwise. Any data-dependent migration of U3 or U4 requires G6, satisfied by a completed U0 report; U2 (SPEC-012) has no data-dependent operation.

### 5.1 U2 — split out to SPEC-012 (COMPLETED)

U2 (Library presentation change) is owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md), which holds the purpose, approved behavior, affected surfaces, implementation notes, non-goals, authorization invariants, acceptance criteria, test inventory and closure record. Institutional data types are retained; only reader-facing presentation and application-layer filtering change. Nothing is duplicated here; if this section and SPEC-012 ever differ, SPEC-012 governs U2. U2 is completed and accepted with a baseline Playwright exception (D-036).

## 6. Gates

G1, G3, G4 and G5 are OPEN. G2 is SATISFIED (Product Owner, 2026-10-23; record below) and its unit U2 is owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (COMPLETED 2026-10-25, accepted with baseline exception per D-036). G6 is SATISFIED (record below). Resolutions are recorded here (decision, date, decider) before the blocked unit starts.

| Gate | What must be decided | Blocks | Owner |
|---|---|---|---|
| **G1** | Approved Latin American country list (including territories and edge cases) and the rule for legacy non-conforming `country_or_scope` values (non-destructive). | U3 | Not recorded |
| **G2** | Exact scope of institutional-reference suppression: which reader surfaces; whether instructor `institution`, material `source_or_institution`, and institution names in free text are in scope; how Admin management surfaces are treated. | U2 (SPEC-012) | Product Owner. **SATISFIED** (2026-10-23); see record below |
| **G3** | Content types eligible for origin-country metadata and filtering; the permitted value set (D2 does not tie it to the reach list); successor-revision semantics; how the origin filter relates to the existing `País o alcance` filter. | U4 | Not recorded |
| **G4** | Approved JotForm URL; form owner; fields; retention; privacy requirements (including whether any page context may be passed — D3 permits none by default). | U5 | Not recorded |
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
- **What this record does not do:** it does not resolve G1, G3, G4 or G5, does not alter the G6 record, does not activate this spec (which stays planned), and does not authorize implementation of U3–U5.

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

Criteria apply when the corresponding unit is activated and implemented. U2's criteria are owned by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (SPEC-012 AC-01 to AC-13; AC-12 accepted with baseline exception, D-036). **Roll-up:** this spec is not complete until the criteria below are met for U0, U1 and U3–U5. The SPEC-012 dependency is satisfied.

- **AC-01 (U2) — owned by SPEC-012.** See [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) §10 and §17 (SPEC-012 AC-01 to AC-13; AC-12 baseline exception). Not duplicated here.
- **AC-02 (U0, U3, U4; U2 owned by SPEC-012 AC-09):** Institution records, relationships, materials, teaching notes, provenance and audit events are intact; institutions are neither archived nor deleted; published revisions are not destructively modified; canonical organizations, memberships and authorization are unchanged. A U0 inventory precedes any data-dependent operation (U3, U4); any such operation has a documented dry-run and rollback.
- **AC-03 (U3):** The reach selector offers exactly the G1-approved set; the server rejects unsupported new values; existing values follow an explicit non-destructive rule.
- **AC-04 (U4):** Origin country is Admin-selected, never inferred, distinct from reach, `Sin dato` for unknown history, preserved across successor revisions, Admin-mutation-only, creates no organization-specific visibility restriction, and is displayed and filtered consistently for the G3-approved types.
- **AC-05 (U3, U4):** Search combined with reach, origin and other filters behaves correctly; `Sin dato` and zero-result states are understandable.
- **AC-06 (U3, U4; U2 owned by SPEC-012 AC-10):** No unpublished, archived, historical or private content leaks through country filters or query endpoints; Admin permissions are unchanged.
- **AC-07 (U5):** A visible feedback action with a Spanish-first label opens the approved external URL, works with keyboard and on mobile, and is not enabled until G4 and G5 are resolved. No iframe, modal integration or custom backend.
- **AC-08 (U5):** The feedback action transmits no tokens, search queries, private content or user identifiers, appends no context parameters, and adds no analytics events.
- **AC-09 (all; U2 owned by SPEC-012 AC-11):** Existing consent/revocation behavior and SPEC-008 gates are unchanged; analytics is neither activated nor expanded.
- **AC-10 (U1 and regression for every unit; U2 owned by SPEC-012 AC-12):** Existing upload, viewing, downloading, publication and archival regressions pass, subject to the SPEC-012 AC-12 baseline exception recorded in D-036; the deployed domain is verified without assuming DNS changes.
- **AC-11 (governance):** This spec is not activated as a whole until the activation conditions in §2 are met; no gated unit (U3–U5) starts before its gates are resolved in §6. U2 is completed and governed by [`SPEC-012`](../completed/012-library-institutional-references-presentation.md) (SPEC-012 AC-13; accepted with baseline exception, D-036). U0/U1 execution is preparatory and is not activation. This spec is not completed until the remaining units pass independent verification.

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
