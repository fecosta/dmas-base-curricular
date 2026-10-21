# SPEC-010 — Platform Readiness for Organizational Testing

**Product:** D+ Base Curricular

**Status:** ACTIVE — RECONCILED; UNIT-LEVEL GATES OPEN; ONLY U0 AND U1 AUTHORIZED

**Delivery state:** NOT IMPLEMENTED. NO UNIT IS STARTED. THE SPEC IS NOT IMPLEMENTATION-READY AS A WHOLE.

**Dependencies:** SPEC-001–007 and SPEC-009 (completed). Coordinates with active SPEC-008 without depending on it and without activating or expanding analytics.

**Repository location:** `resources/specs/active/010-platform-readiness-organizational-testing.md`

**Decisions:** D-033, D-034, D-035 in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md)

## 1. Purpose

Prepare the existing platform for phased testing with Latin American partner organizations without destroying curriculum content, weakening access controls, or changing the governance model.

## 2. Activation status and authorization boundary

This spec is in `active/` under the precedent of SPEC-008: an active spec may carry pending gates, provided the gated work is explicitly not authorized.

- **Authorized now:** U0 and U1 only. They contain no unresolved product decision and mutate nothing.
- **Not authorized:** U2, U3, U4, U5. Each is BLOCKED by the gates in §6.
- Active status does not authorize any gated unit and does not authorize automatic continuation from one unit into the next.
- Before a gated unit starts, every gate that blocks it must have a recorded resolution in §6 (decision, date, decider), and the unit's open specification items must be written into this spec.
- This spec cannot move to `completed/` until every unit has been implemented and has passed independent verification against §8, or a unit has been explicitly removed by a recorded decision.
- `resources/specs/README.md` lifecycle definitions are unchanged by this activation.

## 3. Current implemented behavior (verified read-only on `main`; U0 confirms Cloud data)

- **Institutions** are an implemented governed content type (`institutions`, `institution_revisions`, `module_institutions`; D-009) and are reader-visible when published. Reader surfaces that currently render them: Library `Instituciones` tab and results (published search RPC), search suggestions, module detail `Instituciones` section, `/app/library/references/institution/[id]`, and the app footer copy. Instructors carry a free-text `institution` field and materials carry free-text `source_or_institution`; both are displayed to readers.
- **Country** is stored as free-text `country_or_scope` on material and institution revisions and free-text `country` on instructor revisions (no value list; the application validates length only). The Library filter `País o alcance` lists the distinct `country_or_scope` values of current results and filters by exact normalized match; modules have no country and are excluded when it is applied. Reach and origin are not separate fields today.
- **Organizations** have no country attribute. No content-origin country field exists.
- **Feedback:** no feedback action, JotForm reference, or feedback code exists.
- **Domain:** `bc.democraciamas.com` is not referenced in application code or configuration. Whether it is served is not verified here (U1).
- **Cloud data** (which institutions, countries, and legacy values actually exist): not verified; U0 establishes it.

## 4. Approved decisions

Full text: D-033, D-034, D-035.

**D1 — Institutional references (D-033).** Suppress institutional references from reader-facing discovery and display. Preserve all institution records, existing relationships, materials, teaching notes, historical provenance and audit events. Do not archive or hard-delete institutions. Do not modify published revisions destructively. Do not change canonical organizations, memberships or authorization. Suppression is enforced in the appropriate reader-facing data boundaries, not merely by CSS or hidden UI. Institution names embedded in material titles or free-text metadata require an explicit scope decision (G2); they are not silently rewritten.

**D2 — Content origin country (D-034).** The Admin explicitly selects the content's country of origin. It is not inferred from the Admin's organization, email domain, IP or location, and has no organization-country dependency. It is distinct from geographic reach. Historical content with unknown provenance is `Sin dato`. Published-revision immutability is respected and provenance is preserved across successor revisions. Country metadata creates no organization-specific visibility restriction. Mutation is Admin-only. Eligible content types and successor-revision semantics must be specified before U4 (G3).

**D3 — External feedback form (D-035).** The first version is a visible feedback action that opens an external JotForm URL. No embedded iframe, no modal integration, no custom feedback backend, no new analytics events, and no automatic transmission of tokens, search queries, private content or user identifiers. Spanish-first label; accessible keyboard and mobile behavior. The approved form URL and privacy-governance details are prerequisites for enabling the action. An embedded experience may be considered in a future spec.

**Other stakeholder intent retained.** `bc.democraciamas.com` is the approved public subdomain (no DNS or deployment change presumed). The *reach* country selector offers only an approved Latin American set. Analytics opt-in, default-off behavior and revocation are unchanged.

## 5. Implementation units

| Unit | Scope | Mutation | Blocked by | Status |
|---|---|---|---|---|
| **U0** | Read-only Cloud data inventory and repository reference inventory/impact map: institutions and their relationships, free-text institutional references, country values on every content type, legacy reach values, which reader surfaces and data boundaries expose each. Output is a report with aggregate counts, not content or personal data. Satisfies G6. | None. No migration, no Cloud write, no secret or personal data in the report. | — | AUTHORIZED |
| **U1** | Verify `bc.democraciamas.com`, navigation, mobile usability, accessibility and regression behavior. No DNS assumption: if verification shows a DNS or deployment change is needed, stop and request separate authorization. | None to application code unless a defect is found; defects are reported, not silently fixed. | — | AUTHORIZED |
| **U2** | Institutional-reference reader suppression per D1 across the reader data boundaries identified by U0 (RPCs/RLS/routes/suggestions/direct URLs/preload payloads), non-destructively, with documented dry-run and rollback for any data-dependent step. | Yes (schema/data/code) | G2, G6 (U0 complete) | BLOCKED |
| **U3** | Restrict the *reach* selector to the approved Latin American set, validated on client and server; legacy values handled by an explicit non-destructive rule. | Yes | G1, G6 (U0 complete) | BLOCKED |
| **U4** | Content-origin country: schema and provenance, Admin selection, filter, display, `Sin dato` for unknown history, successor-revision carry-over. Includes the relationship to the existing `País o alcance` filter. | Yes | G3, G6 (U0 complete) | BLOCKED |
| **U5** | Visible Spanish-first feedback action opening the approved external JotForm URL. | Code only | G4, G5 | BLOCKED |

U2–U4 are independent of one another unless a recorded gate resolution says otherwise. Any data-dependent migration or suppression operation requires G6, satisfied by a completed U0 report.

## 6. Unresolved gates

All gates are OPEN. Resolutions are recorded here (decision, date, decider) before the blocked unit starts.

| Gate | What must be decided | Blocks | Owner |
|---|---|---|---|
| **G1** | Approved Latin American country list (including territories and edge cases) and the rule for legacy non-conforming `country_or_scope` values (non-destructive). | U3 | Not recorded |
| **G2** | Exact scope of institutional-reference suppression: which reader surfaces and data boundaries; whether instructor `institution`, material `source_or_institution`, and institution names in material titles or other free text are in scope; how Admin management surfaces are treated. | U2 | Not recorded |
| **G3** | Content types eligible for origin-country metadata and filtering; the permitted value set (D2 does not tie it to the reach list); successor-revision semantics; how the origin filter relates to the existing `País o alcance` filter. | U4 | Not recorded |
| **G4** | Approved JotForm URL; form owner; fields; retention; privacy requirements (including whether any page context may be passed — D3 permits none by default). | U5 | Not recorded |
| **G5** | Privacy Notice coordination with SPEC-008 where applicable (e.g. whether the external feedback form requires Notice wording). Feedback is separate from analytics consent. | U5 | Privacy/Legal (per SPEC-008 Gate P); not otherwise recorded |
| **G6** | Read-only Cloud data inventory completed and reviewed before any data-dependent migration or suppression operation. Satisfied by U0, which is itself read-only. | U2, U3, U4 | Satisfied by completing U0 |

## 7. Required semantics

**Reach** describes the geographic scope of a program or material. **Origin country** describes the country the Admin explicitly selects as the origin of content. They are distinct dimensions and must not overwrite one another. Origin country is never derived from organization, email domain, IP, or current location, and organizations gain no country dependency.

Origin and reach filters must never bypass publication, membership, Storage or RLS constraints, and create no organization-specific visibility. Unknown provenance is `Sin dato`, never guessed. Published revisions are not edited in place; provenance survives successor revisions. Suppression, validation and filtering are enforced at server and data boundaries, not only in the UI.

## 8. Acceptance criteria

Criteria apply when the corresponding unit is authorized and implemented.

- **AC-01 (U2):** Institutional references covered by the G2 scope no longer appear in reader-facing discovery or display — search, suggestions, filters, references, detail readers, direct URLs and client preload payloads — enforced at the reader data boundary. Retained materials and teaching notes remain accessible under existing permissions.
- **AC-02 (U0, U2–U4):** Institution records, relationships, materials, teaching notes, provenance and audit events are intact; institutions are neither archived nor deleted; published revisions are not destructively modified; canonical organizations, memberships and authorization are unchanged. A U0 inventory precedes any data-dependent operation, and any such operation has a documented dry-run and rollback.
- **AC-03 (U3):** The reach selector offers exactly the G1-approved set; the server rejects unsupported new values; existing values follow an explicit non-destructive rule.
- **AC-04 (U4):** Origin country is Admin-selected, never inferred, distinct from reach, `Sin dato` for unknown history, preserved across successor revisions, Admin-mutation-only, creates no organization-specific visibility restriction, and is displayed and filtered consistently for the G3-approved types.
- **AC-05 (U3, U4):** Search combined with reach, origin and other filters behaves correctly; `Sin dato` and zero-result states are understandable.
- **AC-06 (U2–U4):** No unpublished, archived, historical or private content leaks through country filters, suppression gaps, or query endpoints; Admin permissions are unchanged.
- **AC-07 (U5):** A visible feedback action with a Spanish-first label opens the approved external URL, works with keyboard and on mobile, and is not enabled until G4 and G5 are resolved. No iframe, modal integration or custom backend.
- **AC-08 (U5):** The feedback action transmits no tokens, search queries, private content or user identifiers, appends no context parameters, and adds no analytics events.
- **AC-09 (all):** Existing consent/revocation behavior and SPEC-008 gates are unchanged; analytics is neither activated nor expanded.
- **AC-10 (U1 and regression for every unit):** Existing upload, viewing, downloading, publication and archival regressions pass; the deployed domain is verified without assuming DNS changes.
- **AC-11 (governance):** No gated unit started before its gates were resolved in §6; this spec is not completed until all units pass independent verification.

## 9. Out of scope

- Archiving or deleting institutions, organizations, users, memberships, content, attachments, audit history or analytics data.
- Rewriting institution names in material titles or free text without a G2 decision.
- Embedded or modal feedback, a custom feedback backend, ticketing, public feedback board or notification engine.
- Changing publication/archival authorization or reviving Contributor authoring.
- New analytics events, session replay, or enabling any analytics provider.
- Redesigning the taxonomy or translating the whole application.

## 10. Validation and documentation

Use unit/integration tests, RLS/database checks, browser journeys and independent review per unit. Verify data-affecting changes on safe local/test fixtures, never on real production records. Reconcile `docs/` only when a unit's behavior is actually verified; until then the durable docs mark it as approved future behavior, not implemented. Do not push, merge or deploy without explicit authorization.

## 11. Implementation freedom

Within an authorized unit: component structure, query mechanics and database mechanism consistent with the approved stack. Not allowed: redefining country semantics, erasing provenance, inferring origin country, expanding data collection or analytics, altering permissions, or reinterpreting suppression as archival or deletion.
