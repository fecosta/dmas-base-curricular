# SPEC-012 — Library Institutional References Presentation

**Product:** D+ Base Curricular

**Status:** COMPLETED — ACCEPTED WITH BASELINE EXCEPTION (AC-12)

**Delivery state:** IMPLEMENTED AND DOCUMENTATION-CLOSED 2026-10-25. Implementation commits: `2f29601` (feat: suppress institutional references from Library reader surfaces), `5d22a5e` (fix: return a literal 404 for the institution reference route), `38d1c9c` (docs/test: except the footer assertion in SPEC-012 admin test freeze). CODE AND TESTS ONLY (`src/`, `tests/`); NO DATABASE, MIGRATION, RLS, GRANT, FUNCTION OR CLOUD CHANGE.

**Dependencies:** SPEC-001–007 and SPEC-009 (completed); D-033 and D-036 in [`docs/DECISIONS.md`](../../../docs/DECISIONS.md). Does not depend on SPEC-008 implementation; coexists with SPEC-008 (§2). Independent of SPEC-010 gates G1, G3, G4, G5 and of SPEC-010 units U3–U5. Gate G2 is SATISFIED (§13). Gate G6 is not applicable: this spec has no data-dependent operation.

**Repository location:** `resources/specs/completed/012-library-institutional-references-presentation.md`

**Decisions:** D-033 (Institutional references are suppressed from reader surfaces, not removed). Sub-decisions D-B to D-E of gate G2 are recorded in D-033; they are not register entries.

**Split from:** SPEC-010 unit U2. SPEC-012 is the single owner of the U2 definition. SPEC-010 keeps a pointer only and stays planned.

## 1. Purpose

Remove institutional references from the reader-facing Library experience, in the presentation layer only, without deleting, archiving, rewriting or restricting any data, and without changing authentication, authorization, roles, RLS, analytics, consent or Admin management.

## 2. Activation and coexistence with SPEC-008

SPEC-012 was `ACTIVE` alongside SPEC-008 at activation and is now `COMPLETED` (accepted with baseline exception, D-036). `resources/specs/README.md` allows more than one active spec when each is independently implementation-ready and they do not conflict. Reasons recorded by the Product Owner at activation:

- SPEC-008 is documented, not implemented, and waits on Privacy/Legal decisions (Gate P).
- SPEC-012 touches no analytics, consent or privacy-notice behavior. The analytics contract and its `institution` content-type value stay as they are (§7).
- The two specs did not compete: they changed different files and different behavior. If SPEC-008 implementation later touches a file listed in §9, the later change reconciles with the earlier one; neither spec authorizes the other's scope.

Activation and closure record: §13.

## 3. Pre-implementation baseline (verified read-only on `main` at `70224b7`)

- **Institutions** are an implemented governed content type (`institutions`, `institution_revisions`, `module_institutions`; D-009) and are reader-visible when published. Reader surfaces that render them today: the Library `Instituciones` option of the `Tipo` control and its results section (`src/app/app/library/page.tsx`), search suggestions (`/api/library/suggestions`, `src/lib/curriculum/suggestions.ts`), the module detail `Instituciones` section (canonical page and overlay, `module-detail.tsx`), and `/app/library/references/institution/[id]`.
- **Free-text fields.** Instructors carry `institution`, shown in the module detail instructor subtitle (`module-detail.tsx:151`). Materials carry `source_or_institution`, shown on the material reference page as `Fuente o institución`.
- **Footer.** `src/app/app/layout.tsx:66-67` renders "Biblioteca curricular compartida de la red Democracia+. Módulos, programas, docentes e instituciones de referencia en un solo lugar." on every authenticated page.
- **Entity vocabulary.** `libraryEntities` in `src/lib/curriculum/library-state.ts` is `["module", "reference", "material", "institution"]`; `readEntity` accepts `institution`, so `entity=institution` renders an institutions-only Library with a `Tipo: Instituciones` chip.
- **Data.** `getLibrary` (`src/lib/curriculum/queries.ts`) calls the `search_curriculum` RPC twice (filtered, and unfiltered for the `País o alcance` and `Tema` options). The RPC returns institution rows when no entity is given and for `entity=reference`, so both the result list and the filter options currently include institution values.
- **Role behavior.** The Library code has no role branch: Admin and non-Admin readers get the same Library.

## 4. Current implemented behavior

G2 changed what the reader interface displays. It adds no server-side or data-boundary control and changes no authentication, authorization, role or RLS behavior.

For every reader, Admin and non-Admin alike:

1. **Library.** The `Tipo` control offers `Todo`, `Módulos`, `Materiales`. There is no `Instituciones` option, results section, card, count or empty state. `entity=reference` lists materials only. The `País o alcance` and `Tema` options are not derived from institution rows.
2. **Legacy entity.** `entity=institution`, alone or combined with `q`, `axis`, `country`, `theme` or `view`, renders the default Library view. The other parameters are preserved and applied. There is no error, no empty institutions section and no `Tipo: Instituciones` chip (decision D-B). `reference` remains a valid entity value and represents materials (D-C). `module` and `material` are unchanged.
3. **Suggestions.** The header search popover and `/api/library/suggestions` offer only `Módulos` and `Materiales` groups. The endpoint keeps its authentication and eligibility responses (401/403/503).
4. **Module detail** (canonical page and overlay). No `Instituciones` section; the instructor subtitle omits the instructor's `institution`.
5. **Material page.** The reference page omits `Fuente o institución`.
6. **Institution detail route.** `/app/library/references/institution/{id}` returns 404.
7. **Footer.** The sentence at `src/app/app/layout.tsx:66-67` is replaced. Approved copy (Product Owner, 2026-10-23, exact): the footer reads "Biblioteca curricular compartida de la red Democracia+. Módulos, programas, docentes y materiales en un solo lugar." The prefix sentence "Biblioteca curricular compartida de la red Democracia+." is kept (asserted by `tests/admin-navigation.test.ts:92`). Spanish copy review for this footer is satisfied by that decision. Any other replacement wording needed is Spanish and minimal.
8. **Admin and non-Admin parity.** Admin and non-Admin get the same Library, suggestions and module detail. Admin management surfaces keep full institution management (§10).

Data types are **retained**. `ModuleDetail.institutions`, `Instructor.institution`, `Institution`, `Material.sourceOrInstitution`, `SearchResult.entity_type` (including `"institution"`) and similar reader data types stay. Institutional references are removed from reader-facing **presentation** only, plus the application-layer filtering in §6. `getReference` narrows route acceptance to `material` only.

## 5. Affected reader surfaces

All verified in code at `main` `70224b7`.

| Surface | File | Change |
|---|---|---|
| Entity vocabulary, `Tipo` chip label | `src/lib/curriculum/library-state.ts` (`libraryEntities`, `entityLabels`, `readEntity`, `entityHref`) | Drop `institution` from the accepted entities so `readEntity` returns `undefined` for it. This is the normalization to the default view and removes the applied-filter chip. Narrow `entityHref` to module and material. |
| Library URL rewriting | `src/lib/curriculum/library-href.ts` (`libraryHref`) | Do not copy a legacy `entity=institution` into generated links (axis, view, chip-removal and `Tipo` links). |
| Header search hidden fields | `src/components/shell-search.tsx` (`carried`) | Do not carry `entity=institution` into the search form. |
| Analytics signals | `src/lib/analytics/library-signals.ts` (`librarySignals`) | Do not count `entity=institution` as an applied `entity` filter. The contract in `src/lib/analytics/contract.ts` is unchanged. |
| Library page | `src/app/app/library/page.tsx` | Remove the `Instituciones` `Tipo` option (`:148`), the `institutions` partition (`:43`), the `Instituciones` section and its `institutions-title` (`:215`); `referenceSection` and the `Ver … (n)` link handle materials only; the `kind` type at `:68` narrows to material. |
| Library data | `src/lib/curriculum/queries.ts` (`getLibrary`, `LibraryFilters.entity`) | Filter `institution` rows out of both the filtered and the unfiltered RPC results in application code, before the result list, counts and the `countries`/`themes` options are derived (§6). `LibraryFilters.entity` and `libraryEntities` handling: a legacy `institution` value must never reach the RPC as `entity_filter`; exact type mechanics are the implementer's within this behavior. `SearchResult.entity_type` keeps `"institution"` (types are retained). |
| Cards | `src/components/library/cards.tsx` | `ReferenceCard` kind becomes material only; update the comment at `:49`. |
| Suggestions | `src/lib/curriculum/suggestions.ts` (`suggestionFamilies`), `getSearchSuggestions` | Drop the institution family (`:18`). Institution rows returned by the RPC must be filtered out before grouping. `/api/library/suggestions` (`src/app/api/library/suggestions/route.ts`) needs no change: same auth gate, same RPC. |
| Module detail | `src/app/app/library/module-detail.tsx` | Remove the `Instituciones` section (`:181-194`, `module-institutions-title`, `Sin instituciones asociadas.`) and `instructor.institution` from the instructor subtitle (`:151`). Update the comments at `:55` and `:61`. Types are retained. |
| Reference page | `src/app/app/library/references/[type]/[id]/page.tsx`, `getReference` (`queries.ts:185`) | `getReference` accepts only `material`; anything else, including `institution`, calls `notFound()`. Drop the institution kind label (`:14`), the website branch and `Fuente o institución` (`:55-57`). |
| Footer copy | `src/app/app/layout.tsx:66-67` | Replace the sentence with the approved copy in §4 item 7. |

**Unchanged:** Admin management surfaces (`/app/contributions/**` and `src/lib/contributions/**`, which have their own queries and types); the `search_curriculum`, `get_published_module` and `get_published_reference` functions; every file under `supabase/`; `src/lib/analytics/contract.ts`.

## 6. Implementation notes (not security controls)

- `search_curriculum` is unchanged and still returns institution rows (also for `entity=reference`), and `get_published_module` still returns `institutions` and instructor `institution`. Filtering is therefore done in the application layer. This hides the rows from the interface only; it is the accepted residual exposure (§11), not a boundary.
- The RPC has no application-level pagination or limit (verified). The only cap is the Data API `max_rows` (1000 in `supabase/config.toml`; the Cloud setting is not verified here), which already applies today before any filtering. Removing institution rows in the application layer therefore cannot make pages short. Results, counts (`resultCount`, the empty state, `LibraryActivity.resultCount`), the `countries`/`themes` options and the `Ver … (n)` link must all be computed from the filtered array. Suggestions are grouped per family after filtering, so the per-family cap does not under-fill. If the published library ever approaches the cap, institution rows would consume part of it; at the SPEC-010 G6 baseline (27 institutions) this is not a present concern.
- A material can still be matched by a term that exists only in its (now hidden) `source_or_institution`, because the RPC indexes it. The match is not explained on screen. Accepted for the MVP; the RPC is not changed.
- Legacy normalization is done by ignoring the value (no redirect). The stale parameter may remain in the address bar until the reader's next navigation; generated links, the header search form and `librarySignals` never re-emit or count it.

## 7. Authorization, analytics and preservation invariants

- No change to authentication, eligibility, roles, RLS or grants. No new access path, route, endpoint, grant or policy. `/api/library/suggestions` keeps its live-access gate.
- No file under `supabase/`, `src/lib/contributions/**` or `src/app/app/contributions/**` is changed.
- Analytics and consent are unchanged: the contract and the content-type enum (which keeps `institution`) are not modified, no event is added, and `tests/analytics-boundary.test.ts` (`:44`) and `tests/analytics-events.test.tsx` (`:64`) stay unchanged.
- Institution records, revisions, relationships (`module_institutions`), history, audit events and provenance are preserved. Institutions are neither archived nor deleted. Published revisions are not modified destructively. Free text is not rewritten; `source_url` and unrelated metadata are unchanged. Canonical organizations, memberships and authorization do not change.
- The Library code has no role branch and this spec adds none.

## 8. Non-goals

Schema changes, migrations, seed or data changes, new RLS policies, grant/ACL changes, new `SECURITY DEFINER` functions, new Admin RPCs, API-level or data-level suppression, data deletion or migration, generic ACL rollback mechanisms, reworking authentication or authorization, changes to Admin management surfaces, changes to the analytics contract or events, rewriting free text, changing `source_url`, any change to publication, successor-revision or archival behavior, removing the retained data types (§4).

## 9. Implementation and regression-test inventory

Paths and line numbers verified at `main` `70224b7`. Re-verify before editing.

**Source (change):** `src/lib/curriculum/{library-state,library-href,suggestions,queries}.ts`; `src/lib/analytics/library-signals.ts`; `src/components/shell-search.tsx`; `src/components/library/cards.tsx`; `src/app/app/library/{page.tsx,module-detail.tsx}`; `src/app/app/library/references/[type]/[id]/page.tsx`; `src/app/app/layout.tsx`. Code comments that mention institutions (`module-detail.tsx` ~`:55`, `:61`; `cards.tsx` ~`:49`) are updated in passing. `src/app/api/library/suggestions/route.ts`: no change expected.

**Vitest — update (existing tests that assert institution UI or behavior):**

- `tests/library-suggestions.test.ts` (`:20`, `:24`, `:31`, `:36`, `:50-60` assert the institution family and its items).
- `tests/library-state.test.ts` (`:35` `readEntity({ entity: "institution" })`, `:51`, `:58`, `:67` `entityHref("institution", …)`).
- `tests/module-detail-overlay.test.tsx` (`:137-139` `Instituciones` section and link, `:154-157`, `:229` `Sin instituciones asociadas.`).
- `tests/curriculum-queries.test.ts` (institution rows filtered out of results, counts and filter options; `:21` area).
- `tests/shell-search.test.tsx` (no carried `entity=institution`; hidden-field assertions near `:74-78`).

**Vitest — extend:**

- `tests/library-href.test.ts`: generated links never re-emit `entity=institution`.
- `tests/analytics-instrumentation.test.ts` (the `librarySignals` cases under `describe("filter signals")`, `:69-80`): `entity=institution` is not an applied filter.
- `tests/library-suggestions-route.test.ts`: institution rows in the RPC data are filtered out of the response; 401/403/503 behavior unchanged.
- `tests/admin-navigation.test.ts`: the footer contains the new copy and does not contain "instituciones de referencia"; the existing prefix assertion at `:92` stays.
- `tests/module-detail-program.test.ts` builds `institutions: []`; it keeps working unchanged because the types are retained.

**Playwright — update:**

- `tests/e2e/library-explorer.spec.ts` (`:273-298` `Instituciones` option and entity loops; `:461-464` `Instituciones` suggestion group).
- `tests/e2e/module-detail.spec.ts` (`:217`, `:270-296` `institutions-title` / `module-institutions-title` ids and labels, `:394` institution link).
- `tests/e2e/auth.spec.ts` (`:172` and `:183` assert `Centro Ficticio Regional`; `:185` asserts `Material o estudio|Institución o centro de referencia`).

**Must NOT change:** `tests/analytics-boundary.test.ts`, `tests/analytics-events.test.tsx`; Admin management tests (`tests/admin-*.test.*`, `tests/archive-eligibility-ui.test.ts`, `tests/contribution-*.test.ts`), except that `tests/admin-navigation.test.ts` is extended only for the SPEC-012 footer assertion (§9 Vitest — extend), with no other change to it; anything under `supabase/`; `src/lib/contributions/**`; `src/app/app/contributions/**`.

## 10. Acceptance criteria

Criteria apply once SPEC-012 is implemented. "Existing" test names below were verified in `tests/e2e/`.

- **SPEC-012 AC-01 — Library.** The `Tipo` control, results sections, cards, counts and empty states show no institution, for `Todo` and for every `Tipo` option. The `Tipo` control has no `Instituciones` option. `entity=reference` lists materials only. `País o alcance` and `Tema` options are not derived from institution rows.
- **SPEC-012 AC-02 — Legacy entity (D-B, D-C).** `/app/library?entity=institution`, alone and with each of `q`, `axis`, `country`, `theme`, `view`, renders the default Library view: no error, no empty institutions section, no `Tipo: Instituciones` chip; the other parameters are preserved and applied. Generated links (axis, `Vista`, chip removal, `Tipo`), the header search form hidden fields and `librarySignals` do not re-emit or count `entity=institution`. `entity=reference`, `module` and `material` still work.
- **SPEC-012 AC-03 — Suggestions.** `/api/library/suggestions` and the header search popover return and show only `Módulos` and `Materiales` groups, including when the RPC data contains institution rows (route test proves the filtering). Endpoint authentication and eligibility responses (401/403/503) are unchanged.
- **SPEC-012 AC-04 — Detail.** Module detail (canonical page and overlay) has no `Instituciones` section and no instructor `institution` in the subtitle. The material reference page has no `Fuente o institución`. `/app/library/references/institution/{id}` returns 404.
- **SPEC-012 AC-05 — Reader-facing copy (D-E).** The footer carries the approved copy in §4 item 7 and no longer contains "instituciones de referencia". A rendered-text check (Vitest where the component renders in isolation; the targeted Playwright specs for the shell footer and the Library) finds none of the strings listed in §12 as removed. Admin management surfaces (`/app/contributions/**`) keep their institution wording and are out of the check.
- **SPEC-012 AC-06 — Seeded institutions invisible.** The published institution fixtures already seeded in the e2e specs do not appear anywhere in the reader experience: Library (`Todo` and every `Tipo`), search suggestions, module detail page and overlay, material page, and the institution detail route.
- **SPEC-012 AC-07 — Admin/non-Admin parity (explicit assertion).** One Playwright test (in `tests/e2e/library-explorer.spec.ts`) signs in an Admin and a non-Admin on the same data and asserts that the rendered `main#contenido` text of the Library (`/app/library`, `/app/library?entity=reference`, and a legacy `/app/library?entity=institution`), the `/api/library/suggestions` JSON body for the same query, and the module detail page text are equal for both roles. This must be an explicit comparison in one test, not inferred from separate role journeys. (Shell navigation differs by role and is outside `main#contenido`.)
- **SPEC-012 AC-08 — Admin management intact.** Admin management still shows institution wording and forms; the existing Admin tests pass unchanged.
- **SPEC-012 AC-09 — Preservation (covers the U2 part of SPEC-010 AC-02).** The change set contains no migration, seed or data file and nothing under `supabase/`. No data is created, altered or deleted by the change. Institution records, relationships, revisions, history and provenance are intact; institutions are neither archived nor deleted.
- **SPEC-012 AC-10 — No new access path (covers the U2 part of SPEC-010 AC-06).** No new route, endpoint, grant or policy. No change to authentication, eligibility, role or RLS code. Institution data still returned by existing APIs is the accepted residual exposure (§11), not a new path.
- **SPEC-012 AC-11 — Analytics and consent unchanged (covers the U2 part of SPEC-010 AC-09).** The analytics contract and content-type enum are unchanged, no event is added, consent/revocation behavior is unchanged, and `tests/analytics-boundary.test.ts` and `tests/analytics-events.test.tsx` pass unmodified.
- **SPEC-012 AC-12 — Regression (covers the U2 part of SPEC-010 AC-10).** Existing upload, viewing, downloading, publication and archival regressions pass: `tests/e2e/contributions.spec.ts` (publish new and successor versions, attachment reservation and download), `tests/e2e/content-management.spec.ts`, `tests/e2e/archival.spec.ts`, `tests/e2e/archival-governance.spec.ts`, plus `tests/e2e/shell.spec.ts`.
- **SPEC-012 AC-13 — Governance (adapts SPEC-010 AC-11).** Activation is recorded in §13. SPEC-012 moved to `completed/` after implementation, verification and the baseline-exception decision D-036; see the Verification and closure record below.

**Required validation (all, with actual results reported; anything not run is reported with the reason):**

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Targeted Playwright specs on the local Supabase stack: `tests/e2e/library-explorer.spec.ts`, `tests/e2e/module-detail.spec.ts`, `tests/e2e/auth.spec.ts`, plus the AC-12 regression specs.
- `git diff --check`.
- A check that the diff touches no file under `supabase/`, `src/lib/contributions/` or `src/app/app/contributions/`.

**Required negative tests:** AC-01 to AC-07 each need an explicit negative assertion (institution fixture or string absent), not only a positive one for the remaining content.

## 11. Accepted residual exposure (MVP)

Institution data (the institution tables, instructor `institution`, material `source_or_institution`) may remain readable through existing APIs, RPCs and Data API reads by users who already have the appropriate access. The reader interface does not display it. This is a documented accepted residual risk (`docs/SECURITY.md`), not a new boundary and not a security control; hiding it in the interface does not make it confidential. The earlier requirement of API/data-boundary suppression (2026-10-22) is superseded. Any future need to restrict the data at the API level requires a new decision. The abandoned design is kept as a historical record in [`docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`](../../../docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md); it is not an active requirement.

## 12. Reader-facing copy inventory

The historical copy inventory table is [`docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`](../../../docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md) §3 (a historical record, kept as the inventory source; `file:line` references there date from `cf0a4d3` and §5 above is authoritative for current surfaces).

**Strings and UI that must be absent from the reader experience after implementation:**

- "instituciones de referencia" (footer);
- `Instituciones` as a `Tipo` option, results section title, suggestion group, chip label (`Tipo: Instituciones`) or module detail section title; `Sin instituciones asociadas.`;
- `Institución o centro de referencia` (reference page kind label);
- `Fuente o institución`;
- the instructor `institution` value in the module detail subtitle;
- any published institution name from the seeded fixtures.

**Present after implementation:** the footer copy in §4 item 7.

**Kept as-is (generic "referencia(s)" wording; not institutional unless a Spanish copy review objects):** `src/app/app/page.tsx:14` (`referencias publicadas`), `src/app/app/library/page.tsx:108` (`Módulos y referencias publicados`), `src/app/app/library/references/[type]/[id]/page.tsx:22` (`← Volver a referencias`) and `:32` (`Esta referencia no tiene descripción publicada.`), `src/lib/curriculum/library-state.ts:26` (`reference: "Referencias"`, the chip for `entity=reference`, which means materials), `src/components/library/cards.tsx:65,67` (`Explorar referencia`).

**Not institutional-reference copy (out of scope):** `Correo institucional` and `dominio institucional` (identity and organization domains); `Referencia del error:`; Admin management surfaces (`src/app/app/contributions/**`, `src/lib/contributions/types.ts`, `src/lib/contributions/families.ts`).

## 13. Activation record

- **Activated:** 2026-10-23.
- **Closed:** 2026-10-25 (accepted with baseline exception, D-036).
- **Decider:** Product Owner, communicated by the user. No personal name is recorded: the repository does not establish one.
- **Product Owner decisions recorded 2026-10-23:**
  1. U2 is split out of SPEC-010 into this SPEC-012 (resolves SPEC-010's "activate the whole spec or split U2" as: split).
  2. Gate G2 is SATISFIED.
  3. SPEC-012 is ACTIVE alongside SPEC-008 (reasons in §2).
  4. The approved footer copy is "Módulos, programas, docentes y materiales en un solo lugar." (replacing the sentence at `src/app/app/layout.tsx:66-67`; prefix sentence kept).
  5. `docs/TERMS_OF_USE.md` is excluded from SPEC-012 implementation scope (§14).
  6. Existing reader data types are retained; institutional references are removed from reader-facing presentation only, plus the application-layer filtering of §6.
  7. Existing authorization, analytics, consent, Admin management and database behavior are preserved.
- **Gate status:** G2 SATISFIED. G6 not applicable (no data-dependent operation). SPEC-010 gates G1, G3–G5 are open and do not gate this spec.
- **Review:** independent activation review recorded in the commit/report that activated this spec; closure documentation review recorded in the commit/report that closed it.
- **What this record does not do:** it does not activate SPEC-010 (which stays planned), does not alter SPEC-008, and does not authorize any change outside §5 and §9.

## 14. Out of scope

- Everything in §8.
- **`docs/TERMS_OF_USE.md`** (line 26, "consultar instituciones y referencias", rendered at `/app/privacidad/terminos` as versioned legal text) is excluded from implementation. **Privacy/Legal follow-up:** Privacy/Legal reviews that line and decides whether a versioned Terms update is needed; `TERMS_OF_USE.md` and `PRIVACY_NOTICE.md` are not edited by this spec. Line ~165 ("instituciones" as content authors) is not a Library feature reference and needs no change.
- Generic "referencia(s)" wording kept as-is (§12), unless a Spanish copy review objects.
- Admin management surfaces and their institution wording and forms; the archived-content and lifecycle-history views (decision D-D: they are not Library surfaces and are untouched).
- Rewriting institution names in material titles or free text (separate future editorial cleanup).
- Embedded or modal feedback, origin-country metadata, reach-selector changes (SPEC-010 U3–U5).
- New analytics events, consent changes, enabling any analytics provider.
- Post-implementation reconciliation of `docs/PRODUCT.md` and `docs/CONTENT_MODEL.md`: a documentation follow-up after SPEC-012 is verified, not part of this spec's code. Until then the durable docs describe this behavior as approved future behavior, not implemented.

## 15. Implementation freedom

Component structure and application-layer mechanics consistent with the approved stack: how institution rows are filtered, how the legacy `entity` value is ignored, and how `LibraryFilters.entity` / `libraryEntities` are typed, within §4–§6. Other replacement Spanish wording, if needed, stays minimal. Not allowed: reinterpreting the approved G2 scope, server-side or database changes, removing retained data types, altering permissions, expanding data collection or analytics, or reinterpreting suppression as archival or deletion.

## 16. Validation and documentation

Per §10. No database check applies (nothing under `supabase/` changes). Do not push, merge or deploy without explicit authorization. After implementation and independent verification, reconcile `docs/PRODUCT.md`, `docs/CONTENT_MODEL.md`, `docs/SECURITY.md` and `docs/DECISIONS.md` (D-033) with the verified behavior, and update the SPEC-010 roll-up. Reconciliation was performed 2026-10-25 and is recorded in the closure commit/report.

## 17. Verification and closure record

### 17.1 Acceptance-criteria status

| Criterion | Status | Evidence |
|---|---|---|
| AC-01 — Library hides institutions | PASS | `tests/e2e/library-explorer.spec.ts` (:314, :341), Vitest `tests/curriculum-queries.test.ts`, `tests/library-state.test.ts` |
| AC-02 — Legacy `entity=institution` normalized | PASS | `tests/e2e/library-explorer.spec.ts` (:356), Vitest `tests/library-href.test.ts`, `tests/library-state.test.ts` |
| AC-03 — Suggestions only modules/materials | PASS | `tests/e2e/library-explorer.spec.ts` (:574), `tests/library-suggestions-route.test.ts`, `tests/library-suggestions.test.ts` |
| AC-04 — Detail hides institutions, route 404 | PASS | `tests/e2e/library-explorer.spec.ts` (:394), `tests/e2e/module-detail.spec.ts`, `tests/module-detail-overlay.test.tsx`; route handler `src/app/app/library/references/institution/[id]/route.ts` |
| AC-05 — Footer copy updated | PASS | `tests/e2e/shell.spec.ts` (:120), Vitest `tests/admin-navigation.test.ts` |
| AC-06 — Seeded institutions invisible | PASS | Negative assertions in AC-01–AC-04 journeys; no institution fixture name appears in reader output |
| AC-07 — Admin/non-Admin parity | PASS (dev mode) | `tests/e2e/library-explorer.spec.ts` (:881) passes in dev mode (`/tmp/opencode/ac07dev.log`); production-mode run is NOT part of accepted validation (see §17.4) |
| AC-08 — Admin management intact | PASS | Diff touches no Admin management file; existing Admin tests pass unchanged |
| AC-09 — Preservation | PASS | `git diff --stat f16db10..38d1c9c` contains no `supabase/`, seed or data file; no migration |
| AC-10 — No new access path | PASS | No new route, endpoint, grant or policy in diff; auth/RLS files unchanged |
| AC-11 — Analytics and consent unchanged | PASS | `tests/analytics-boundary.test.ts` and `tests/analytics-events.test.tsx` untouched; full Vitest suite passes (604 passed, 1 skipped) |
| AC-12 — Regression suite | **ACCEPTED WITH BASELINE EXCEPTION** | Seven pre-existing failures reproduce on baseline `f16db10` and implementation `38d1c9c` (see §17.2). They are **never described as passing**. |
| AC-13 — Governance | CLOSED | Activation recorded in §13; closure decision recorded as D-036; this documentation task performed the required reconciliation |

### 17.2 Baseline-exception table (AC-12)

The same seven Playwright journeys fail on baseline `f16db10` and on implementation `38d1c9c` (chromium, local Supabase stack, dev server). Line numbers shift because SPEC-012 edited `tests/e2e/library-explorer.spec.ts` and `tests/e2e/module-detail.spec.ts`; test names are the stable identity.

| # | Test file | Test name | Baseline `f16db10` | Head `38d1c9c` |
|---|---|---|---|---|
| 1 | `tests/e2e/archival-governance.spec.ts` | archived management pages through the full three-part keyset without skipping or duplicating | :216 | :216 |
| 2 | `tests/e2e/contributions.spec.ts` | Admins publish new and successor versions while non-Admins remain readers | :62 | :62 |
| 3 | `tests/e2e/library-explorer.spec.ts` | modal overlay contract › Filtros: background inert and locked, scrim dismisses, focus returns | :418 | :522 |
| 4 | `tests/e2e/module-detail.spec.ts` | opening a module from the Library › keeps the canonical URL and presents the module over the Library it was opened from | :193 | :193 |
| 5 | `tests/e2e/module-detail.spec.ts` | detail presentation › is a centred, viewport-constrained panel on a wide desktop | :435 | :446 |
| 6 | `tests/e2e/module-detail.spec.ts` | detail presentation › is full-screen at 768px | :456 | :467 |
| 7 | `tests/e2e/module-detail.spec.ts` | detail presentation › is full-screen at 390px | :456 | :467 |

Failures 1–2 are the AC-12 named regression specs (`contributions.spec.ts`, `archival-governance.spec.ts`). Failure 3 and failures 4–7 are overlay/presentation failures of the same class already recorded as pre-existing test debt in G-007 (SPEC-007). Root causes are **not investigated here**.

This acceptance covers **only** these seven failures, **only** AC-12's regression gate, and creates **no waiver** for any new or other failure.

### 17.3 Validation commands

Commands actually run by this closure task and their results:

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` (`vitest run`) — 604 passed, 1 skipped, 48 test files passed, 1 skipped.
- `npm run build` — pass.
- `git diff --check` — pass (run after documentation edits).
- Diff inspection `git diff --stat f16db10..38d1c9c` — confirms changes are only in `src/`, `tests/` and the SPEC-012 file; no `supabase/`, `src/lib/contributions/` or `src/app/app/contributions/` changes; `tests/analytics-boundary.test.ts` and `tests/analytics-events.test.tsx` untouched.

Evidence read from `/tmp/opencode` logs (not independently re-run by this documentation task):

- Baseline full 8-spec AC-12 + targeted suite, dev mode: 81 tests, 74 passed, 7 failed (`base-all.log`, commit `f16db10`).
- Implementation head targeted AC-12 suite, dev mode: 26 tests, 24 passed, 2 failed (`ac12-head.log`, commit `38d1c9c`).
- Implementation head remaining targeted specs, dev mode: 62 tests, 57 passed, 5 failed (`rest-head.log`, commit `38d1c9c`).
- AC-07 parity test in dev mode: pass (`ac07dev.log`).

The full Playwright suite was not independently re-run by this documentation task; it relies on the recorded logs above.

### 17.4 Production-mode Playwright follow-up (NOT part of accepted validation)

A separate technical follow-up is recorded, not a SPEC and not a product decision.

Observed in `/tmp/opencode/ac07.log` and `/tmp/opencode/ac07b.log`: running the AC-07 parity test under production mode (`E2E_PRODUCTION=1`, `npm run test:e2e:production`, which runs `next build` + `next start` over plain HTTP at `127.0.0.1`) failed with `observed.suggestions.groups` undefined at `tests/e2e/library-explorer.spec.ts:926`. The `/api/library/suggestions` response had no `groups`. The same test passes in dev mode (`/tmp/opencode/ac07dev.log`).

Unverified hypothesis: session cookies use `secure: process.env.NODE_ENV === "production"` (`src/proxy.ts:9`, `src/lib/supabase/server.ts:12`), so authenticated browser/API-request contexts may not keep the session over plain-HTTP loopback in production mode. SPEC-007 already notes that Secure cookies are not kept over HTTP loopback in WebKit. This hypothesis is **unverified**.

This follow-up does not change any product or security contract. The production-mode run of the SPEC-012 specs is therefore **not** part of the accepted validation evidence for closure.

### 17.5 Residual risks and follow-ups

- **Institutional-reference residual exposure.** Institution tables, `instructor.institution` and `material.source_or_institution` remain readable through existing APIs/RPCs/Data API by users who already have access. Hiding them in the UI is not a confidentiality control. This is the accepted MVP residual risk and remains current state.
- **Hidden-source search match.** A material can still be matched by a term that exists only in its hidden `source_or_institution` because the RPC indexes it. The match is not explained on screen. Accepted for the MVP.
- **Stale `entity=institution` parameter.** Legacy normalization ignores the value, so the stale parameter may remain in the address bar until the reader's next navigation.
- **Data API `max_rows`.** `search_curriculum` has no application-level pagination; the only cap is the Data API `max_rows` setting. Removing institution rows in the application layer cannot make pages shorter than they would already be.
- **Privacy/Legal follow-up.** `docs/TERMS_OF_USE.md` line 26 ("consultar instituciones y referencias", rendered at `/app/privacidad/terminos`) was excluded from implementation. Privacy/Legal must review whether a versioned Terms update is required. `TERMS_OF_USE.md` and `PRIVACY_NOTICE.md` remain untouched.

### 17.6 Boundaries preserved

- SPEC-008 remains active and unchanged; its analytics/consent boundaries are not affected.
- Authentication, eligibility, roles, RLS, grants, private Storage and every security boundary remain unchanged.
- SPEC-010 remains planned; SPEC-012's dependency is now satisfied, but G1, G3–G5 remain open and U3–U5 remain blocked.
