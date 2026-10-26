# SPEC-013 — Material Reach Country Restriction

**Product:** D+ Base Curricular

**Status:** ACTIVE — IMPLEMENTATION-READY; NOT YET IMPLEMENTED

**Delivery state:** NOT IMPLEMENTED. NOT STARTED.

**Dependencies:** SPEC-001–007 and SPEC-009 (completed); SPEC-012 (completed, accepted with baseline exception, D-036); SPEC-010 U0 (G6 satisfied). Does not depend on SPEC-008 implementation and does not activate or expand analytics.

**Repository location:** `resources/specs/active/013-material-reach-country-restriction.md`

**Decisions:** D-034 in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md). Gate G1 product policy and gate G3 origin semantics were approved on 2026-10-26; C1-C3 were confirmed on 2026-10-26; the concrete G1 reach list is confirmed in §5.

**Split from:** SPEC-010 unit U3. SPEC-013 is the single owner of the U3 definition. SPEC-010 keeps a pointer only and stays planned.

## 1. Purpose

Restrict the *reach* value (`country_or_scope`) of new and edited material Drafts to an approved Latin American set, enforce the restriction at the database boundary, and preserve existing legacy values non-destructively.

## 2. Activation status

SPEC-013 was **activated on 2026-10-26**.

Conditions met:

1. The Product Owner confirmed C1-C3 in §5 on 2026-10-26.
2. A separate preflight and an explicit activation commit were performed per `resources/specs/README.md` Completion rule item 6.
3. The base commit was re-verified at activation time: `e541fae`.

The 2026-10-26 SPEC-010 preflight was re-checked against base commit `e541fae` and serves as the required preflight evidence.

## 3. Verified current behavior

- `material_revisions.country_or_scope` is free text (`supabase/migrations/20260911000100_core_curriculum_library.sql`).
- Admin Draft write paths are the `SECURITY DEFINER` RPCs `create_contribution`, `update_contribution` (`supabase/migrations/20260913000100_content_contribution_persistence.sql`), `create_successor_draft` (`supabase/migrations/20260914000300_successor_revisions.sql`) and `publish_content_draft` (`supabase/migrations/20260914000100_admin_publication_foundation.sql`).
- `create_contribution` and `update_contribution` whitelist payload keys via `private.assert_payload_keys` and bound lengths via `private.assert_content_payload_bounds`; `validate_submission` checks `length(country_or_scope) <= 240`.
- `create_successor_draft` copies `country_or_scope` explicitly from the current published revision into the new Draft.
- Published revisions are immutable (`private.preserve_published_revision`, `private.protect_contribution_revision`).
- `authenticated` has `SELECT` only on revision tables; no direct writes.
- `import_published_curriculum` is `SECURITY INVOKER`, service-role-only in practice, and inserts `Published` rows.
- The Admin form material input `País o alcance` is at `src/app/app/contributions/contribution-form.tsx` (~line 210). Institution `País o alcance` (~line 221) and instructor `País` (~line 163) are NOT in scope.
- Payload building for the material case is in `src/lib/contributions/validation.ts`.
- The Server Action `saveContribution` in `src/app/app/contributions/actions.ts` maps DB errors to a generic Spanish save error.
- Library filter options derive from result rows in `src/lib/curriculum/queries.ts` (`getLibrary`) and are unchanged.
- Latest migration timestamp is `20261001000100`; a new migration must sort after it.
- G6 inventory evidence (`docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`) shows 39 material revisions, all with blank `country_or_scope`, as of the 2026-10-22 snapshot.

## 4. Approved behavior

### 4.1 G1 — Geographic reach (policy decided 2026-10-26)

- Reach is a controlled list of Latin American countries.
- Values are stored as canonical Spanish country names.
- Existing legacy values are preserved with NO destructive migration.
- Unchanged legacy values may carry over into successor Drafts.
- New or modified unsupported values are rejected.
- Regional and multi-country selections are excluded in v1.

### 4.2 G3 — Content origin (semantics decided 2026-10-26; U4-a/U4-b resolved as product decisions)

- Origin country applies to materials only for v1.
- It is an explicit Admin selection.
- It uses ISO 3166-1 worldwide countries and territories, with canonical Spanish display names (U4-a resolved).
- Historical unknown origin = `Sin dato`.
- It is exposed as a separate `País de origen` filter.
- The existing reach label `País o alcance` is kept.
- Published-revision immutability and successor provenance are preserved.
- Origin is never inferred from organizations or users.
- An explicit origin-country selection is **required** for newly created materials; `Sin dato` is preserved for existing materials with unknown origin (U4-b resolved).

Origin-country implementation is **U4** and is **NOT part of this spec**. U4 remains inactive: its exact ISO value list as a concrete constant/contract, how "required" is enforced at the database and publication boundary, successor-revision handling and the `País de origen` filter mechanics are U4 contract work still to be written. See [`SPEC-010`](../planned/010-platform-readiness-organizational-testing.md) §4 and §6.

## 5. Country list and flagged ambiguities

### 5.1 Confirmed v1 reach list (20 values)

Canonical Spanish names, exact strings, case- and accent-sensitive:

Argentina, Bolivia, Brasil, Chile, Colombia, Costa Rica, Cuba, Ecuador, El Salvador, Guatemala, Haití, Honduras, México, Nicaragua, Panamá, Paraguay, Perú, República Dominicana, Uruguay, Venezuela.

**C1 confirmed 2026-10-26.**

### 5.2 Resolved ambiguities

The following ambiguities were resolved by C1 on 2026-10-26:

1. **Puerto Rico** is **EXCLUDED** from v1.
2. **Belice, Guyana, Surinam, Guayana Francesa** and other non-Spanish/Portuguese-language American or Caribbean countries/territories are **EXCLUDED**.
3. **Haití** is **INCLUDED** as part of the confirmed 20-country Latin American set.
4. **España and Portugal** are **EXCLUDED** from the reach list. Existing legacy values such as España, EE. UU., Reino Unido, Suecia remain preserved as legacy (they occur only on hidden institution rows per the G6 evidence).
5. Regional/multi-country values ("Latinoamérica", "Global", "Colombia, Chile") are **EXCLUDED** by decision.

`Sin dato` is NOT a reach value; it belongs to origin.

### 5.3 Scoping confirmations (C1-C3)

Confirmed by the Product Owner on 2026-10-26:

- **C1.** The list in §5.1 is approved, including the handling in §5.2.
- **C2.** U3 covers material revisions' `country_or_scope` ONLY. Institution `country_or_scope` (hidden since SPEC-012, Admin-only) and instructor `country` (a person attribute, not reach) stay free text and unchanged.
- **C3.** The reach field stays OPTIONAL: blank remains valid, and clearing a legacy value to blank is allowed.

## 6. Technical contract

### R-1 Allowed new/changed values

A new or changed value on a material Draft may be NULL/blank, or exactly one of the approved canonical strings confirmed by C1.

### R-2 Legacy carry-over

A value that is unchanged is accepted even if it is not on the approved list. "Unchanged" is defined mechanism-neutrally as byte-equal:

- (a) on UPDATE of a Draft row, byte-equal to `OLD.country_or_scope` of that same row; or
- (b) on INSERT of a Draft row, byte-equal to the `country_or_scope` of the same material's current published revision (the value `create_successor_draft` copies from).

A first-revision Draft (no current published revision for that material) has no carry-over: its value must be blank or on-list. Switching to a different legacy value is rejected.

A Draft that already exists before the migration with a legacy value may be saved/published unchanged.

### R-3 Rejection of off-list changes

Any other off-list value is rejected:

- on `create_contribution` for a new material;
- on `update_contribution` that changes the value to off-list, including to another legacy value from an older revision;
- `create_successor_draft` cannot invent values: it copies the published revision's value unchanged.

### R-4 Enforcement at the database boundary

The rule validates `country_or_scope` on `material_revisions` for rows in `Draft` status on INSERT and UPDATE, and on the Draft -> Published transition (the value must not change in that transition, and an unchanged off-list value passes only under the R-2 carry-over).

Direct INSERT of a row already in `Published` status by the table owner or service role — the style used by existing pgTAP and Playwright fixtures and by `import_published_curriculum` — is **not subject to the rule**. The existing fixtures must remain compatible without edits. This exemption is **not** an application-reachable bypass: no application role (`anon`, `authenticated`) can write `material_revisions` directly, and the exemption must not add any grant, policy, RPC parameter, setting or flag that lets a caller skip validation or publication validation. `private.validate_publication` is not weakened.

Authorization, RLS, published-revision immutability and the existing RPC write paths remain unchanged. No new grants, policies or routes are added; no change to who can write.

Recommended mechanism (non-binding): a `BEFORE INSERT OR UPDATE` trigger on `material_revisions` that fires for `Draft` rows, reads the predecessor in the INSERT case, and calls a private function. `SECURITY INVOKER` is acceptable because the callers are the security-definer RPCs running in an owner context. The private function must not be executable by `anon`, `authenticated` or `PUBLIC`. Reject with `SQLSTATE 23514` and a stable message so the app can map it.

Existing Playwright and pgTAP fixtures insert `Published` rows directly with arbitrary `country_or_scope` values and must not need edits.

### R-5 No backfill, no row rewrite

No backfill, no row rewrite, no `VALIDATE`d `CHECK` over existing rows, no data deletion. Legacy values are preserved exactly. The migration is therefore not data-dependent. Applying the migration to Cloud and deploying the app are SEPARATE authorizations, out of scope for implementation. The migration must be backward compatible with the currently deployed app (off-list free text then fails with the generic save error until the app ships).

### R-6 App layer

- A shared client-safe constant holds the approved list (suggest `src/lib/curriculum/reach-countries.ts`).
- The material form control for `País o alcance` becomes a select with a blank option plus the 20 confirmed values.
- When editing a Draft whose stored value is off-list, that value must be offered as an extra, clearly labelled "valor existente" option so the Admin can save unchanged without losing it.
- Rejected submissions keep entered values (existing `submittedValues` behavior).
- `saveContribution` maps SQLSTATE `23514` from the reach rule to a specific Spanish message, e.g. "El alcance debe ser un país de la lista aprobada.".
- Spanish-first UI; keep the label `País o alcance`.
- The Server Action must not be the only enforcement (see R-4).

### R-7 Unchanged surfaces and boundaries

- Reader Library filter and its options (legacy published values stay listed).
- `search_curriculum`, reader RPCs, reader query layer.
- Institution and instructor country fields.
- Analytics contract, events and consent (`country` stays a canonical filter type).
- All authorization boundaries.

## 7. Affected surfaces

| Surface | File | Change |
|---|---|---|
| Constant | `src/lib/curriculum/reach-countries.ts` (new) | Approved list; single source of truth. |
| Material form | `src/app/app/contributions/contribution-form.tsx` | Material `País o alcance` becomes a select; legacy-value option when stored value is off-list. |
| Validation | `src/lib/contributions/validation.ts` | No new app validation that duplicates the DB rule; constant may be reused for typing/convenience only. |
| Server Action | `src/app/app/contributions/actions.ts` | Map SQLSTATE `23514` reach error to specific Spanish message. |
| Database | `supabase/migrations/2026100…_material_reach_country.sql` (new) | Trigger/function enforcing R-1/R-2/R-3 on `material_revisions`. |
| Tests | `supabase/tests/material_reach_country.test.sql` (new); `tests/contribution-validation.test.ts`; `tests/contribution-actions.test.ts`; `tests/admin-content-management.test.tsx` | pgTAP for DB rule; Vitest for constant/action/form; Playwright for the journey. |

**Unchanged:** `search_curriculum`; `getLibrary` filter derivation; institution/instructor country inputs; `import_published_curriculum`; analytics files `tests/analytics-boundary.test.ts` and `tests/analytics-events.test.tsx`.

## 8. Non-goals / out of scope

- Content origin country (U4).
- Unit U5 (feedback action).
- Institution `country_or_scope` and instructor `country` restriction.
- Regional or multi-country reach values in v1.
- Redesign of the reader Library filter.
- Backfill, normalization or deletion of legacy values.
- Cloud migration apply or deployment.
- Renaming the `País o alcance` label.
- Changing analytics contract, events, consent or SPEC-008 boundaries.

## 9. Acceptance criteria

Criteria apply once SPEC-013 is activated and implemented.

- **AC-01 — Approved set.** The approved reach set is exactly the confirmed list from §5.1, stored in one client-safe constant and one database source. A test asserts the exact set and canonical strings.
- **AC-02 — Database rejects off-list values.** pgTAP proves that `create_contribution` and `update_contribution` reject an off-list value with `23514`, including an attempt via a forged payload and an attempt to switch a stored legacy value to a different off-list value; blank is accepted; and application roles (`anon`, `authenticated`) cannot write `material_revisions` directly.
- **AC-03 — Legacy unchanged carry-over.** pgTAP proves that updating a Draft whose stored value is legacy, without changing the value, succeeds; and that `create_successor_draft` copies the predecessor's legacy value unchanged.
- **AC-04 — Publish preserves legacy value.** pgTAP proves that publishing an unchanged-legacy Draft succeeds and the resulting published revision keeps the legacy value exactly.
- **AC-05 — Published revision immutability.** pgTAP proves that `preserve_published_revision`/`protect_contribution_revision` still block direct mutation of published rows.
- **AC-06 — Blank allowed.** pgTAP proves that NULL/blank is accepted on create and update.
- **AC-07 — Non-Admin still denied.** pgTAP proves that a non-Admin receives `42501` on the Admin write RPCs and that no new access path is created.
- **AC-08 — No backfill/row change.** pgTAP asserts that existing legacy rows remain byte-identical after the migration, or equivalent evidence for a migration that adds no data-dependent operation.
- **AC-09 — App form and error mapping.** Vitest proves the constant contents, the form select options (including the legacy-value option), and that `saveContribution` maps the `23514` reach error to the specific Spanish message.
- **AC-10 — Reader filter journey.** One targeted Playwright journey where an Admin selects a country, saves, publishes, and the reader filter `País o alcance` shows it; Library/search combined with the reach filter still works with legacy and approved values.
- **AC-11 — Regression.** Existing pgTAP suite (`npm run test:db`) and `npm run db:lint` pass; existing pgTAP and Playwright fixtures that directly insert `Published` rows remain unchanged and compatible; Vitest suite passes; required typecheck/lint/build pass; analytics boundary tests `tests/analytics-boundary.test.ts` and `tests/analytics-events.test.tsx` remain untouched and passing.
- **AC-12 — Baseline findings.** The seven baseline Playwright failures recorded in D-036 / SPEC-012 §17.2 are KNOWN BASELINE FINDINGS, not an exception automatically accepted for this spec. The implementer must first re-run the named specs on the U3 base commit and record which of the seven reproduce; after the change, report each before/after. Any failure outside those seven, or any of the seven failing at a different assertion, is a regression. Accepting remaining baseline failures for U3 closure requires a NEW explicit Product Owner decision at closure time; they must never be described as passing.
- **AC-13 — Governance.** Activation is recorded in §12. The spec is not moved to `completed/` until independent verification. A closure decision is required for any remaining baseline failures under AC-12.
- **AC-14 — Direct Published inserts remain allowed for fixtures.** pgTAP proves that direct INSERT of a `material_revisions` row already in `Published` status by the table owner or service role (the style used by existing fixtures and `import_published_curriculum`) succeeds with an off-list value and is not subject to the reach rule; existing pgTAP and Playwright fixtures remain compatible without edits.

## 10. Validation

Required commands at closure:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:db`
- `npm run db:lint`
- `git diff --check`
- Targeted Playwright specs: `tests/e2e/content-management.spec.ts`, `tests/e2e/contributions.spec.ts`, `tests/e2e/archival.spec.ts`, `tests/e2e/archival-governance.spec.ts`, `tests/e2e/library-explorer.spec.ts`, `tests/e2e/shell.spec.ts`, plus the new AC-10 journey.

See AC-12 for the baseline-findings rule.

## 11. Authorization, analytics and invariants

- No change to authentication, eligibility, roles, RLS or grants.
- No new route, endpoint, policy or grant.
- SPEC-008 analytics contract, events and consent remain unchanged; `country` remains a canonical filter type.
- Published-revision immutability and successor provenance are preserved.
- Admin Draft authority remains role-wide, not creator-owned.

## 12. Activation record

- **Activated:** 2026-10-26.
- **Closed:** NOT CLOSED.
- **Decider:** Product Owner, communicated by the user. No personal name recorded.
- **Base commit re-verified at activation:** `e541fae`.
- **Preflight:** the 2026-10-26 SPEC-010 preflight was re-checked against base commit `e541fae`.
- **Product Owner decisions recorded 2026-10-26:**
  1. **C1.** The v1 reach list is the 20 canonical Spanish names in §5.1; Puerto Rico, Belice, Guyana, Surinam, Guayana Francesa, España, Portugal, and regional/multi-country values are excluded; Haití is included.
  2. **C2.** U3 covers material revisions' `country_or_scope` only; institution `country_or_scope` and instructor `country` stay unchanged.
  3. **C3.** Reach stays optional; blank is valid; clearing a legacy value to blank is allowed.
  4. **G1 reach policy:** controlled Latin American list; canonical Spanish names; preserve legacy values non-destructively; reject new/modified unsupported values; exclude regional/multi-country selections in v1.
  5. **G3 origin semantics:** materials only for v1; explicit Admin selection; ISO 3166-1 worldwide countries and territories with canonical Spanish display names; `Sin dato` for unknown history; separate `País de origen` filter; keep `País o alcance` label; preserve published-revision immutability and successor provenance; never infer from organizations or users.
  6. **U4-a and U4-b resolved as product decisions:** origin uses ISO 3166-1 worldwide countries with canonical Spanish display names; an explicit origin-country selection is required for newly created materials; `Sin dato` is preserved for existing materials with unknown origin.
  7. U3 and U4 may be activated independently once their own gates and implementation contracts are complete; U3 precedes U4 because they share surfaces.
  8. U5 stays blocked by G4/G5.
  9. SPEC-012 stays completed; SPEC-008 analytics boundaries stay unchanged.
- **Gate status:** G1 **SATISFIED** 2026-10-26 (decided and confirmed with C1-C3); G3 **SATISFIED AS PRODUCT DECISION** 2026-10-26 (U4 remains inactive pending its own implementation contract and U3 completion); G4/G5 unchanged OPEN; G2 and G6 unchanged SATISFIED.
- **What this record does not do:** it does not implement U3, does not activate U4/U5/SPEC-010, does not alter SPEC-012 or SPEC-008, does not accept the baseline Playwright failures as passing, and does not authorize any Cloud apply or deployment.
