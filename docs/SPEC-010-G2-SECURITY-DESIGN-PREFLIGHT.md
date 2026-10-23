# SPEC-010 / U2 — G2 design preflight (HISTORICAL — SUPERSEDED)

**Status:** HISTORICAL RECORD — SUPERSEDED 2026-10-23. **Not a requirement and not a blocker.** Nothing in the abandoned design was approved, implemented or sequenced, and nothing was run against Cloud.

**Referenced by:** `resources/specs/planned/010-platform-readiness-organizational-testing.md` (§3, §5.1, §6, AC-01) and `docs/DECISIONS.md` D-033.

**Why this file still exists.** Other documents link to it, and it keeps the reader-facing copy inventory (§3) and the list of reader code surfaces and tests (§4) that U2 uses. The authoritative G2 contract is the G2 resolution record in SPEC-010 §6 and D-033, not this file.

---

## 1. What was superseded

On 2026-10-22 the G2 product scope required that institutional data be suppressed at the API/data boundaries: direct Data API reads of the institution tables, `instructor_revisions.institution` and `material_revisions.source_or_institution` were to be denied to non-Admin users, with a dedicated Admin RPC for management reads (decision D-A).

On 2026-10-23 the Product Owner simplified G2 to a **presentation-layer change**: institutional references must not appear in the user-facing Library experience; institutional data may remain accessible through existing APIs to users who already have access (accepted MVP residual exposure, `docs/SECURITY.md`); authentication, authorization, roles and RLS stay intact. Decision D-A is superseded; D-B, D-C and D-E are kept; D-D is kept and unchanged because nothing server-side changes.

## 2. What was evaluated and why it was dropped

This preflight compared several mechanisms for the data-boundary requirement. The recommended one (Alt 2) combined column-level privileges on `instructor_revisions` and `material_revisions`, a dedicated authorization-checked Admin RPC for the two protected columns, a rewrite of the reader RLS policies on `institutions`, `institution_revisions` and `module_institutions` (with predicate-by-predicate preservation of the Admin read set), changed reader RPCs, and a staged deployment with a Cloud ACL snapshot and rollback. It was judged **disproportionate for the MVP**: a multi-migration security change across the database, the Admin management path and the reader RPCs, with its own risk of breaking Admin content management, in order to hide data from users who are already authorized to read the library. It was therefore dropped and is not an active requirement. Its technical items (enforcement mechanism, Admin RLS preservation, staged deployment, grant posture, Admin RPC contract, database dry-run and rollback) are withdrawn with it.

**Where the full prior text lives** (it is not reproduced here):

- the uncommitted pre-simplification working copy: git ref `refs/backup/g2-preflight-wip-pre-simplification` (commit `fef51d5`);
- the committed version: `git show cf0a4d3:docs/SPEC-010-G2-SECURITY-DESIGN-PREFLIGHT.md`.

## 3. Reader-facing copy inventory (U2; decision D-E) — verified by grep of `src/` at `main` `cf0a4d3`

Replacement wording is **not** decided: it is a U2 implementation detail needing Spanish copy review. Any wording suggested here is a non-binding example.

**Reader-facing strings or UI that carry institutional-reference terminology, or institution UI removed by D-B/D-C:**

| `file:line` | Current text | Note |
|---|---|---|
| `src/app/app/layout.tsx:66-67` | `Biblioteca curricular compartida de la red Democracia+. Módulos, programas, docentes e instituciones de referencia en un solo lugar.` | The generic copy that originated D-E (shell footer, every authenticated page). Example direction: describe modules, programs, instructors and materials without naming institutions. |
| `src/app/app/library/references/[type]/[id]/page.tsx:14` | `Institución o centro de referencia` | Kind label for the institution detail page; that route returns 404. |
| `src/app/app/library/references/[type]/[id]/page.tsx:55-57` | `Fuente o institución` (label of `sourceOrInstitution`) | Not displayed. |
| `src/app/app/library/page.tsx:148` | `Instituciones` (`Tipo` option, `entity: "institution"`) | Removed. |
| `src/app/app/library/page.tsx:43`, `:215` | `institutions` partition and `Instituciones` section (`referenceSection("Instituciones", "institutions-title", …)`) | Removed. |
| `src/app/app/library/module-detail.tsx:181-194` | `Instituciones` section title (`module-institutions-title`) and `Sin instituciones asociadas.` | Removed. |
| `src/app/app/library/module-detail.tsx:151` | `instructor.institution` joined into the instructor subtitle | Not displayed. |
| `src/lib/curriculum/suggestions.ts:18` | `{ entity: "institution", label: "Instituciones" }` | Removed (search suggestion group). |
| `src/lib/curriculum/library-state.ts:12,28` | `libraryEntities` includes `institution`; `institution: "Instituciones"` chip label | Removed; the chip never renders for a legacy value. |
| `src/components/library/cards.tsx:49,53` | `ReferenceCard` `kind: "material" \| "institution"` | Kind narrowed to material. |

**Generic "referencia(s)" wording on reader surfaces, for Spanish copy review (not necessarily institutional; the reviewer decides):** `src/app/app/page.tsx:14` (`referencias publicadas`), `src/app/app/library/page.tsx:108` (`Módulos y referencias publicados`), `src/app/app/library/references/[type]/[id]/page.tsx:22` (`← Volver a referencias`), `:32` (`Esta referencia no tiene descripción publicada.`), `src/lib/curriculum/library-state.ts:26` (`reference: "Referencias"`, chip label for `entity=reference`, which means materials), `src/components/library/cards.tsx:65,67` (`Explorar referencia`).

**Admin management surfaces (unaffected by D-E; keep their institution wording):** `src/app/app/contributions/contribution-form.tsx`, `src/lib/contributions/types.ts:22` (`Institución o centro`), `src/lib/contributions/families.ts:31,43`, and `src/app/app/contributions/governance-actions.tsx:64` (an Admin archive dialog that names no institution).

**Not copy about institutional references (out of scope):** `Correo institucional` and `dominio institucional` (identity and organization domains: `src/app/app/page.tsx:34`, `src/app/login/**`, `src/app/app/users/page.tsx:55`, `src/app/app/organizations/**`); `Referencia del error:` in error pages.

**Product documents.** `docs/PRODUCT.md` (lines 19, 51, 66, 78, 92) and `docs/CONTENT_MODEL.md` describe the current implemented product, where institutions are still reader-visible, and are already covered by their approved-future-behavior banners. After U2 is implemented and verified, reconcile them with the verified behavior.

## 4. Reader code surfaces and tests affected by U2

Code (see SPEC-010 §5.1 for the change per surface): `src/lib/curriculum/{library-state,library-href,suggestions,queries}.ts`; `src/lib/analytics/library-signals.ts`; `src/app/app/library/{page.tsx,module-detail.tsx,references/[type]/[id]/page.tsx}`; `src/app/app/layout.tsx`; `src/components/library/cards.tsx`; `src/components/shell-search.tsx`; `src/app/api/library/suggestions/route.ts` (no change expected).

Existing tests that assert institution UI or behavior and are updated by U2: `tests/library-suggestions.test.ts`, `tests/library-state.test.ts`, `tests/module-detail-overlay.test.tsx`, `tests/curriculum-queries.test.ts`, `tests/shell-search.test.tsx`, `tests/e2e/library-explorer.spec.ts`, `tests/e2e/module-detail.spec.ts`, `tests/e2e/auth.spec.ts`. Admin management tests are not changed.

Not touched: anything under `supabase/`, the `search_curriculum`, `get_published_module` and `get_published_reference` functions, authentication and authorization code, and Admin management code.
