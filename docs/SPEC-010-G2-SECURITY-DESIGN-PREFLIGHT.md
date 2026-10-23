# SPEC-010 / U2 — G2 security design preflight

**Status:** DESIGN PREFLIGHT — NOT A PRODUCT CONTRACT, NOT AN APPROVAL RECORD OF THE TECHNICAL DESIGN. Nothing here is implemented, selected, sequenced or authorized. The Product Owner approved the G2 product decisions D-A to D-E on 2026-10-22 (recorded in SPEC-010 §6, summarized in §5.1); they approve product behavior only. No mechanism (including Alt 2), deployment sequence, Admin RPC grant posture, Admin RLS predicate or test plan in this file is approved: they remain technical recommendations awaiting verification and independent review. G2 is PARTIALLY RESOLVED (not satisfied). U2 stays BLOCKED and not authorized.

**Referenced by:** `resources/specs/planned/010-platform-readiness-organizational-testing.md` §4 (D1 scope) and §6 (G2 resolution record).

**Date:** 2026-10-22 (revised the same day after an independent review returned CHANGES_REQUIRED, and again after the Product Owner approved G2 product decisions D-A to D-E; the corrections are in §2.7, §4, §5 and §6). **Repository state analyzed:** `main` at `f1e00d3`, working tree clean before the documentation edits.

**Scope:** compares technical mechanisms for the G2 product scope approved by the Product Owner on 2026-10-22. It decides no product behavior. The product contract is the G2 resolution record in the SPEC (scope and decisions D-A to D-E), not this file. "D-A" to "D-E" are G2 sub-decisions, not entries of the `docs/DECISIONS.md` register, and must not be confused with register IDs such as D-030 to D-035.

**Labels:** `[VERIFIED]` = read in the repository (file:line) or observed in a rolled-back probe on the **local** Docker database (PostgreSQL 17.6); nothing was run against Cloud. `[INFERENCE]` = reasoned, not verified. `[RECOMMENDATION]` = analyst proposal.

All `supabase/migrations/` paths below are abbreviated as `M/`; `M/core` = `M/20260911000100_core_curriculum_library.sql`.

---

## 1. What must be enforced (from the G2 record)

1. Institution rows, revisions and module links are not readable or returned to readers (Library, search, suggestions, filters, detail, API, preload, direct Data API).
2. `instructor_revisions.institution` and `material_revisions.source_or_institution` are not displayed, searched or directly readable by an eligible non-Admin.
3. Admin Library views give the same result as non-Admin Library views.
4. Admin management surfaces keep full institution management, including editing the two columns.
5. No data, revision, relationship, audit or provenance change; publication, successor and archival rules unchanged.
6. (D-A) Admin access to those two fields goes through a dedicated, authorization-checked Admin RPC; direct Data API column access may be restricted.
7. (D-B, D-C) Legacy `entity=institution` is ignored and normalized to the default Library view; `reference` stays valid and means materials only.
8. (D-D) The archived-content and lifecycle-history views are management surfaces and keep their existing permissions and behavior.
9. (D-E) Generic institutional-reference wording leaves the reader-facing interface text (inventory §5.2); Admin management copy and technical docs are unaffected.

## 2. Verified facts that constrain the design

### 2.1 One database role for readers and Admins

- **[VERIFIED]** Reader and Admin are both the `authenticated` database role; Admin is distinguished only inside SQL through `private.current_access()` (`role = 'Admin'`), a security-definer function (`M/20260910000100_identity_foundation.sql:39`).
- **[INFERENCE]** Column privileges are granted per database role, so **a column `GRANT`/`REVOKE` cannot distinguish an Admin from a reader**. Any column-level suppression also removes the column from Admin direct Data API reads. Admin management reads of those columns then need a separate security-definer path.
- **[VERIFIED]** RLS is row-level only. A policy can hide whole rows of the three institution tables from readers, but cannot hide a column of a table whose rows readers must still see.

### 2.2 Current grants, policies and exposure

- **[VERIFIED]** RLS is enabled on the content tables (`M/core:473-489`). `REVOKE ALL ... FROM public, anon, authenticated` (`M/core:491-499`) is followed by table-level `GRANT SELECT ... TO authenticated` (`M/core:501-509`); there are no column grants. Reader SELECT policies are at `M/core:511-568`.
- **[VERIFIED]** Writes are revoked from `authenticated` (`M/20260913000100_content_contribution_persistence.sql:1132`); writes happen through definer functions.
- **[VERIFIED]** Admin SELECT policies are permissive and OR with reader policies: `institutions` (`M/20260914000100_admin_publication_foundation.sql:621`), `institution_revisions` (`:623`), `module_institutions` (`:633`).
- **[VERIFIED]** PostgREST exposes only `public` (`supabase/config.toml:3-8`); `private` is not exposed. Any new view or function in `public` is exposed.
- **[VERIFIED]** Default ACLs on the local DB give `anon` and `authenticated` all privileges on new `public` tables and views and EXECUTE on new functions. New objects therefore need an explicit `REVOKE ALL ... FROM public, anon, authenticated`, as the repo already does (same finding as G6 Q17 and `docs/SECURITY.md` §19).

### 2.3 Where the sensitive data lives

- **[VERIFIED]** `instructor_revisions.institution` (`M/core:109`); `material_revisions.source_or_institution` (`M/core:177`); `module_institutions` (`M/core:241-245`); tables `institutions` and `institution_revisions` (name, type, country/scope, description, website, themes).
- **[VERIFIED]** `source_or_institution` is inside the material full-text GIN index (`M/core:286-288`) and the same expression is used by `search_curriculum` (`M/core:708`, `:717`). Instructor `institution` is in no search expression.
- **[VERIFIED]** Cloud facts (G6 evidence): 27 institutions, 54 module links, `source_or_institution` populated on 37/37 current materials, instructor `institution` on 5/6, no column ACLs.

### 2.4 Reader RPCs and other functions

- **[VERIFIED]** Four reader RPCs exist. All are security **invoker**, `set search_path=''`, granted to `authenticated` only: `list_published_modules` (`M/core:570-600`), `search_curriculum` (`M/core:668-738`), `get_published_module` and `get_published_reference` (latest definitions `M/20260915000100_published_attachment_reader.sql:50-120` and `:122-155`; original definitions `M/core:602-666` and `:740-767`; grants `M/core:942-951`). Three of them expose or search institution data (`search_curriculum`, `get_published_module`, `get_published_reference`). `list_published_modules` does not: it reads only `modules`, `module_revisions` and `axes` (`M/core:570-600`) and references neither `instructor_revisions.institution`, `material_revisions.source_or_institution` nor any institution object.
- **[VERIFIED]** None of the four reader RPCs branches on the caller's role: no `current_access`, `is_admin` or `Admin` reference in `M/core:570-767` or `M/20260915000100_published_attachment_reader.sql:50-155`. Their results can still differ by role through RLS (see §2.7).
- **[VERIFIED]** Institution data leaves in these RPCs: `get_published_module` returns instructor `'institution'` (`M/20260915000100_published_attachment_reader.sql:72`), material `sourceOrInstitution` (`:99`) and an `'institutions'` block (`:106-114`); `get_published_reference` returns `sourceOrInstitution` (`:132`) and an `institution` branch (`:144-152`). `search_curriculum` has an institution branch (`M/core:719-735`) and matches `entity_filter` `'reference'`/`'institution'` for institutions.
- **[VERIFIED]** Definer functions (owner `postgres`) read the columns and keep working under narrowed reader privileges: publish/successor/archive/restore, `validate_publication`, `create_successor_draft` (copies `institution` at `M/20260914000300_successor_revisions.sql:108-113` and `source_or_institution` at `:141-145`), `list_archived_governed_content`, `list_curriculum_lifecycle_history`.
- **[VERIFIED]** The import path (`import_published_curriculum`, `private.import_curriculum_rows`) is invoker but service-role-only; the service role bypasses RLS and is unaffected by `authenticated` privileges.

### 2.5 PostgreSQL behavior (local probes, rolled back)

- **[VERIFIED]** With table SELECT revoked and a column list granted: selecting granted columns and `count(*)` work; `select *`, a revoked column, `WHERE`/`ORDER BY` on it, `to_jsonb(t)` and whole-row `t` fail with `permission denied for table`.
- **[VERIFIED]** A table-level grant makes a later column `REVOKE` a no-op: revoke the table grant first, then grant columns.
- **[VERIFIED]** An invoker function that references an ungranted column fails; a definer function works. An RLS policy subquery on a table lacking privileges fails unless the referenced columns are granted.
- **[VERIFIED]** A `security_invoker=true` view over a fully revoked base fails; over a column-limited base it works. An owner-rights (default) view bypasses base privileges.
- **[VERIFIED]** `GRANT`/`REVOKE` showed no table lock in the probe (catalog-only); `CREATE POLICY` took `AccessExclusive`. Local DB has no `pg_graphql`, no `public` views, and `supabase_realtime` publishes no `public` tables.

### 2.6 Application and test touchpoints

- **[VERIFIED]** Reader code uses only the RPCs plus `axes` and `program_topic_revisions` (`src/lib/curriculum/queries.ts:90`, `:161`). Types and UI that render institution data: `src/lib/curriculum/queries.ts:33,44,47,55,57-62,66,185`; `src/lib/curriculum/library-state.ts:12,58-62`; `src/lib/curriculum/suggestions.ts:18`; `src/app/app/library/page.tsx:43,148,214-215`; `src/app/app/library/module-detail.tsx:151,181-194`; `src/app/app/library/references/[type]/[id]/page.tsx:14,55-57`; `src/app/api/library/suggestions/route.ts`.
- **[VERIFIED]** Admin direct reads (all Admin-only through `requireAccess("Admin")`, same `authenticated` role): `select("*")` on `instructor_revisions`, `material_revisions` and `institution_revisions` in `getContribution` (`src/lib/contributions/queries.ts:134-139`) feeding the edit form; a `module_institutions` select at `:166`. Other reads in that file select ids/titles/names only (`:97-103`, `:223-230`, `:394`).
- **[VERIFIED]** `src/lib/analytics/contract.ts:28` keeps `contentTypes = ["module","material","institution"]`; unchanged by G2.
- **[VERIFIED]** Tests that assert or depend on current behavior: `supabase/tests/curriculum_library_rls.test.sql` (institution assertions near lines 162, 175-178; policy/invoker counts 233-246); `supabase/tests/successor_revisions.test.sql` (`to_jsonb(revision)` snapshots as `authenticated`, lines 136-141 and 275-280 — would fail under column revocation); `tests/e2e/auth.spec.ts`, `library-explorer.spec.ts`, `module-detail.spec.ts`; Vitest `tests/library-suggestions.test.ts`, `tests/module-detail-overlay.test.tsx`. `src/lib/supabase/database.types.ts` is hand-maintained.

### 2.7 Admin read paths that depend on the reader policies (precise)

- **[VERIFIED]** The Admin SELECT policies are narrower than the Admin's actual reads today. Admins read published institution data only through the permissive **reader** policies, which OR with the Admin ones:
  - `institutions` identities: the reader policy (`M/core:550-551`: `archived_at is null and current_published_revision_id is not null and private.is_eligible_curriculum_reader()`) and the Admin policy `"Admins see Draft institutions"` (`M/20260914000100_admin_publication_foundation.sql:621-622`: `archived_at is null` and live Admin). The Admin policy already covers **every non-archived identity**, Draft-only or published, despite its name.
  - `institution_revisions`: the Admin policy covers **only** `status = 'Draft'` on a non-archived identity (`:623-625`). `Published` rows are visible to an Admin only through the reader policy (`M/core:552-555`: `status = 'Published'` and the identity's `current_published_revision_id` equals the row id; the identity subquery is itself RLS-filtered).
  - `module_institutions`: the Admin policy covers **only** links of `Draft` module revisions (`:633-635`). Links of current-published module revisions are visible through the reader policy (`M/core:563-565`: `exists (select 1 from module_revisions r where r.id = module_revision_id) and exists (select 1 from institutions i where i.id = institution_id)`).
- **[VERIFIED]** The two `exists` subqueries in the `module_institutions` reader policy run under the caller's RLS. For a reader, `module_revisions` shows only the current-published revision of a non-archived module (`M/core:514-518`) and `institutions` shows non-archived identities with a published pointer. For an Admin, `module_revisions` additionally shows Draft revisions (`M/20260914000100_admin_publication_foundation.sql:598-600`) and `institutions` shows every non-archived identity (`:621-622`). Visibility of a link therefore depends on RLS state of two other tables.
- **[VERIFIED]** Consequences today for a live Admin using the Data API: non-archived institution identities (all); `Draft` institution revisions; **current-published** institution revisions; **historical** (non-current) `Published` institution revisions are **not** readable (neither policy matches); links of `Draft` module revisions (no institution-identity condition); links of current-published module revisions whose institution identity is non-archived. Archived identities, and links reachable only through archived identities or archived modules, are excluded from the reader-derived path.
- **[VERIFIED]** The application depends on exactly these reads: `getContribution` reads `institution_revisions` with `managedStatuses = ["Draft","Published"]` (`src/lib/contributions/queries.ts:21`, `:139`), then rejects a `Published` row that is not the identity's current pointer (`:154`, `:158`); `module_institutions` for the opened module revision (`:166`); `findActiveDraftRevision` (`:203-217`); the management selects' option list `institution_revisions` (`:229`, inside `getContributionOptions` at `:220`); the management list (`:99-102`); and `resolveContentTitles` (`:390`, `:394`), which reads the current-published institution name for history display. The edit form therefore needs Admin read access to **published** institution revisions and to links of **published** module revisions, not only Drafts.
- **[VERIFIED]** No other policy or function references the three policies' tables through RLS: the only subqueries on `institutions` are inside the two reader policies above and the Admin `institution_revisions` policy (`M/20260914000100_admin_publication_foundation.sql:625`). Every other reference to `institutions`, `institution_revisions` or `module_institutions` is in a security-definer function owned by the migration role, which does not evaluate RLS (no `FORCE ROW LEVEL SECURITY` exists in `supabase/migrations/`): the publication and validation helpers `private.is_current_published_identity` (`M/20260914000200_lock_publication_dependencies.sql:2-48`), `private.is_admin_draft_identity`, `private.validate_publication`, `public.publish_content_draft`, `public.create_successor_draft`, the archive/restore and history functions (`M/20260915000200_audit_history_archival.sql`) and `list_archived_governed_content` (`M/20260916000200_archived_content_total_keyset.sql`). Replacing the three reader policies therefore does not change them. `[INFERENCE]` for the definer bypass; verify with the existing regression tests.
- **[VERIFIED]** `search_curriculum` and the module/reference RPCs join on `current_published_revision_id` (`M/core:592`, `:663`, `:695`, `:711`, `:726`, `:753`, `:762`), so Admin-only Draft visibility does not add rows to them. Existing tests assert the same Admin and reader result set for the fixtures (`supabase/tests/curriculum_library_rls.test.sql:205-206`) and that a Draft does not leak into reader search (`supabase/tests/successor_revisions.test.sql:329-331`). The only role-dependent effect on the RPCs is the RLS filtering of the tables they read.
- **[INFERENCE]** If the reader policies were replaced by Admin-only policies and the RPCs were **not** rewritten, the invoker RPCs would return institution rows and links to an Admin and none to a reader. Admin Library parity (§1.3) would break. The RPCs must be rewritten to drop the data, not left to RLS, and must not depend on RLS differences between Admin and reader for the suppressed data (§4.3).
- **[VERIFIED]** Existing coverage of these Admin reads is thin: pgTAP `supabase/tests/successor_revisions.test.sql:199-202`, `:233`, `:243`, `:252`, `:262` read, as an Admin through the Data API, the Draft successor and the current-published v1 institution revisions, the institution identity pointer and the links of a Draft module revision; no existing pgTAP, Vitest or e2e test reads **published** module institution links as an Admin or opens the edit form of a published institution (`tests/admin-content-management.test.tsx:324` mocks `getContribution`; `tests/e2e/content-management.spec.ts:134` checks creation cards only). New tests are required (§4.6).

## 3. Alternatives

Impact words: the code/test changes listed are the minimum expected, `[INFERENCE]` unless cited above.

### Alt 1 — RPC-only JSON suppression + RLS tightening on institution tables

Rewrite the three reader RPCs that expose or search institution data (`search_curriculum`, `get_published_module`, `get_published_reference`) to drop institution fields and the institution branch; verify `list_published_modules` against the narrowed privileges (§2.4). Replace the reader SELECT policies on `institutions`, `institution_revisions`, `module_institutions` with live-Admin-gated policies that preserve today's Admin read set (§2.7, §4.2).

- **Closes:** institution tables (row-level, whole-table), all RPC output and search.
- **Does not close:** `instructor_revisions.institution` and `material_revisions.source_or_institution`. Readers can still `select=institution` / `select=source_or_institution` on rows they may see (current published revisions) through the Data API, because RLS cannot restrict columns (§2.1). **Fails the "direct data access" requirement.**
- **Complexity:** low. **Risk:** low, but the residual leak makes it insufficient alone. **Rollback:** re-apply prior function and policy definitions. **Tests:** pgTAP + RPC key-absence; PostgREST column read still succeeds, which is the failure.
- **Use:** as a component of Alt 2 only.

### Alt 2 — Column-level privileges on the two base tables, definer RPC for Admin full reads

`REVOKE SELECT` on `instructor_revisions` and `material_revisions` from `authenticated`, then `GRANT SELECT (all columns except the sensitive one)`. Institution tables handled as in Alt 1 (live-Admin-gated RLS that preserves the Admin read set, §4.2; a table-level revoke would also remove Admin Data API reads and is not proposed). The three reader RPCs that reference the columns are rewritten without them (invoker functions referencing a revoked column fail, §2.5); `list_published_modules` references neither column and is verified, not rewritten. Admin edit-form reads of the two sensitive columns move to a new security-definer RPC gated by `private.require_admin_content_access()`.

- **Closes:** every requirement, including direct Data API reads, `select=*`, filter/order on the column and `to_jsonb(t)`.
- **Consequences:**
  - Admin also loses direct Data API reads of those two columns (§2.1); Admin management gets them through the RPC. D-A (§5.1) permits restricting direct column access, so this is no longer a product question; it does not approve Alt 2. `[INFERENCE]`
  - `getContribution` (`src/lib/contributions/queries.ts:134-139`) must stop using `select("*")` for those two types.
  - Future columns added to those tables are not auto-granted; each migration must grant explicitly. `[INFERENCE]`
  - pgTAP `to_jsonb(revision)` snapshots as `authenticated` (`successor_revisions.test.sql:136-141`, `:275-280`) must run under a privileged role or use column lists.
  - Trigger functions that run SQL as the invoker and read the columns would fail; writes already go through definer functions (`M/20260913000100...:1132`), so this is expected to be a non-issue but **must be verified**. `[INFERENCE]`
  - The material GIN index (`M/core:286-288`) becomes unused by search once the expression drops `source_or_institution`; it can stay (no client access to index contents) so rollback is pure metadata.
- **Complexity:** medium (staged migrations, three function rewrites, one new Admin RPC, policy replacement, app edits to `queries.ts` and the Library, test updates). **Data change:** none. **Risk:** medium — deploy ordering (§4.5). **Rollback:** metadata only: re-apply prior grants, policies and function definitions from a pre-migration snapshot. **Tests:** `has_column_privilege`, `has_table_privilege`, `pg_policies`, JSON key absence, Admin RPC gating, PostgREST negative reads, successor/import/publish regressions.

### Alt 3 — Reader views, base SELECT revoked, Admin definer RPCs/views

Create `public` reader views without the sensitive columns; revoke base-table SELECT; give Admin definer RPCs/views.

- **Consequences:** a `security_invoker` view over a fully revoked base fails (§2.5), so reader views must be owner-rights views that bypass RLS and **re-implement the published-visibility predicates by hand**, a security regression risk. New views inherit `arwdDxtm` for `anon`/`authenticated` until revoked (§2.2). Every reader and Admin query and the hand-maintained types change. Reader RPCs still need rewriting.
- **Complexity:** high. **Risk:** high (hand-copied visibility predicates; larger exposed surface). **Rollback:** drop views, re-grant. **Tests:** everything in Alt 2 plus view-vs-RLS equivalence.
- **Verdict:** more surface than Alt 2 for no extra closure.

### Alt 4 — Move sensitive columns to Admin-only side tables

Create e.g. `instructor_revision_institution` and `material_revision_source_or_institution` (keyed by revision id) with Admin-only RLS; backfill; drop the base columns.

- **Closes:** all requirements at row level, so Admin keeps direct Data API reads and no definer read path is needed.
- **Consequences:** a **data migration** of Cloud-held values (37 materials, 5 instructors per G6) and removal of columns that published revisions hold (G2 requires preserving provenance and non-destructive handling); import, `create_successor_draft` (`M/20260914000300_successor_revisions.sql:108-113`, `:141-145`), `validate_publication`, immutability triggers, the edit form, types and the audit/history snapshots all change. Rollback requires a reverse copy. Needs G6-style dry-run and checksum.
- **Complexity:** highest. **Risk:** highest (touches immutability and provenance). **Rollback:** reverse data copy plus schema restore. **Tests:** Alt 2 plus data-equivalence checksums.
- **Verdict:** over-built for this scope.

### Alt 5 — Other options considered

- **Dedicated unexposed schema for reader objects:** moving the sensitive columns to a `private`-style schema is Alt 4 with the same data migration; no new benefit.
- **Revoke `authenticated` SELECT on all content base tables and serve readers only through RPCs:** strongest boundary, but the Admin `select(...)` reads (`src/lib/contributions/queries.ts:97-103`, `:134-139`, `:166`, `:223-230`, `:394`) and `axes` / `program_topic_revisions` reader reads (`src/lib/curriculum/queries.ts:90`, `:161`) would all need RPCs. Larger than G2 requires; not recommended for U2.
- **Restrictive RLS policy keyed on Admin vs reader:** works for rows only; cannot cover columns (§2.5).

### Comparison

| Alt | Meets all G2 requirements | Data migration | Admin direct column reads | Complexity | Rollback |
|---|---|---|---|---|---|
| 1 RPC + RLS | **No** (two columns stay readable) | No | Unchanged | Low | Metadata |
| 2 Column privileges + Admin RPC | Yes | No | Via RPC only (restriction permitted by D-A) | Medium | Metadata |
| 3 Views | Yes | No | Via RPC/view | High | Metadata |
| 4 Side tables | Yes | **Yes** | Unchanged | Highest | Data copy |
| 5a Revoke all base reads | Yes | No | Via RPC | High | Metadata |

## 4. Recommendation

**[RECOMMENDATION]** Alt 2 is the smallest coherent design that satisfies every G2 requirement without moving data. It is a proposal only: no element below is approved (see §6). Sub-sections 4.1-4.7 follow.

### 4.1 Components

1. Replace the three institution reader policies with live-Admin-gated policies that keep today's Admin read set (§4.2).
2. Revoke table SELECT on `instructor_revisions` and `material_revisions` from `authenticated`; grant every other column explicitly (revoke the table grant first, §2.5).
3. Rewrite the three reader RPCs that expose or search institution data (`search_curriculum`, `get_published_module`, `get_published_reference`) without institution data, without the institution search branch, and without `source_or_institution` in the material search expression. Per D-C the `reference` filter value then selects the material branch only (today `reference` also selects the institution branch, `M/core:712` and `:727`); the handling of a direct `entity_filter = 'institution'` is O-12. Verify `list_published_modules` against the narrowed privileges: it references no institution object and neither sensitive column (§2.4), so it is replaced only if verification shows it breaks. The three rewritten functions follow §4.3.
4. Add one security-definer Admin RPC for the edit form (§4.4), used only for the `instructor` and `material` types in `getContribution`. D-A makes a dedicated authorization-checked Admin RPC a product-level requirement for Admin access to the two fields whenever direct column access is restricted; its name, contract (O-13), grants (O-11) and the mechanism around it (O-1) are not approved.
5. Keep all definer lifecycle functions unchanged, including `list_archived_governed_content` and `list_curriculum_lifecycle_history` (D-D, §5.1). Change application and test code (§2.6, §4.6) accordingly, including the entity normalization (O-12) and the reader-facing copy (§5.2).

Why not Alt 1 alone: it leaves direct Data API reads of two columns. Why not Alt 3/4/5a: more surface, or a data migration, for no extra requirement coverage.

### 4.2 Admin RLS preservation (predicate by predicate)

**[RECOMMENDATION]** Intent: replacing the reader policies must not change what a live Admin can read through the Data API today (§2.7), must not widen it (for example to historical `Published` institution revisions, which are not readable today), and must give a non-Admin no row. Authority comes only from `exists (select 1 from private.current_access() access where access.role = 'Admin')`, the pattern of the existing Admin policies (`M/20260914000100_admin_publication_foundation.sql:621-635`): live persisted role, never client state, form input, OAuth metadata or JWT metadata.

| Table | Reader policy today | Proposed |
|---|---|---|
| `institutions` | `M/core:550-551` | **Drop without replacement.** The Admin policy at `M/20260914000100_admin_publication_foundation.sql:621-622` (`archived_at is null` and live Admin) already returns a superset of the reader policy's rows (`archived_at is null` and a published pointer). The Admin read set is unchanged; a non-Admin gets none. |
| `institution_revisions` | `M/core:552-555` | **Drop and replace** with an Admin policy for `status = 'Published'` rows that are the identity's current pointer on a non-archived identity (the reader predicate plus the live-Admin gate). The existing Draft Admin policy (`:623-625`) stays. Historical `Published` rows stay unreadable. |
| `module_institutions` | `M/core:563-565` | **Drop and replace** with the same predicate plus the live-Admin gate: both `exists` subqueries kept as today, so the Admin result stays identical by construction and keeps depending on RLS visibility of `module_revisions` (Draft and current-published for an Admin) and of `institutions` (non-archived for an Admin). The existing Admin Draft-link policy (`:633-635`) stays. A rewrite with explicit predicates is possible but needs its own equivalence tests. |

Expected resulting Admin read set (to be proven by tests, §4.6): non-archived institution identities; `Draft` institution revisions; current-published institution revisions of non-archived identities; links of `Draft` module revisions; links of current-published module revisions to non-archived institutions. Excluded exactly as today: archived identities, historical `Published` revisions, links reachable only through archived modules or identities.

Effect on other objects (§2.7): no other policy references these tables; the definer lifecycle functions bypass RLS; replacing the three reader policies affects none of them. `[INFERENCE]` for the definer bypass; verify with the existing publication, successor and archival regression tests.

`private.is_eligible_curriculum_reader()` (`M/core:293-297`) is used by other reader policies and stays unchanged.

### 4.3 Shared reader RPC behavior

**[RECOMMENDATION]** `search_curriculum`, `get_published_module`, `get_published_reference` (and any other shared reader function added later) must be role-agnostic. No branching on Admin; no reliance on RLS differences between Admin and reader for suppressed data; output identical for the same inputs whoever calls. Today none of them branches on role and their joins are pointer-based (§2.7). The Admin Library parity requirement (§1.3) is then met by construction and must be tested (§4.6): the same inputs give byte-identical JSON for a reader and an Admin, with a Draft present for the Admin-visible identities.

### 4.4 Admin RPC and execution-grant posture

**[RECOMMENDATION]** One function (name to be chosen at design approval; O-13) following the repository convention for definer RPCs (examples: `public.create_successor_draft`, `M/20260914000300_successor_revisions.sql:16-21`, `:279-282`; `public.list_archived_governed_content`, `M/20260916000200_archived_content_total_keyset.sql:28-53`, `:110-116`; `public.publish_content_draft`, `M/20260914000100_admin_publication_foundation.sql:432-437`, `:652-655`):

- `security definer`, `set search_path = ''`, fully qualified names, no dynamic SQL, `stable`.
- Owner `postgres`: the migrations do not set an owner; the objects are owned by the migration role, and Cloud verification recorded `postgres` ownership for the SPEC-009 Admin RPCs (`docs/SECURITY.md:1093`). `[INFERENCE]` for this new function; verify in the Cloud structural check.
- The first statement is `perform 1 from private.require_admin_content_access();`. **[VERIFIED]** it returns the caller's row only for a live eligible Admin (`private.current_access()` with `role = 'Admin'`) and otherwise raises `eligible Admin access required` with `errcode 42501` (`M/20260914000100_admin_publication_foundation.sql:8-22`). It takes no caller-supplied subject.
- Grants: `revoke all on function ... from public, anon, authenticated, service_role;` then `grant execute on function ... to authenticated;` and nothing for `anon`, `PUBLIC` or `service_role`. This is required, not stylistic: new `public` functions otherwise carry default EXECUTE for `anon`/`authenticated` (§2.2, G6 Q17, `docs/SECURITY.md` §19). The earlier reader RPCs revoke without `service_role` (`M/core:942-946`); the Admin RPCs revoke `service_role` too, which is the later convention.
- Arguments: content type and revision id only (`uuid`); the content type is whitelisted to `instructor` and `material` (anything else raises `22023`); no free-text or table-name argument.
- Result (contract is O-13; this is a proposal): only the revision row for the requested id, shaped like today's `select("*")` row so the edit form is unchanged `[INFERENCE: confirm the form uses no other column]`, or no row if none qualifies. Statuses: today the edit path accepts `Draft` and `Published` (`managedStatuses`, `src/lib/contributions/queries.ts:21`, `:136`, `:138`), and a `Published` row is accepted only when it is the identity's current pointer (`:154`, `:158`). Under RLS today an Admin reads a `Draft` row of a non-archived identity and a current-pointer `Published` row of a non-archived identity (§2.7). The RPC must return exactly that and nothing more: not historical `Published`, not `Submitted`, not archived identities, not other revisions.
- Tests: `throws_ok` with `42501` and `eligible Admin access required` for a Contributor and for an Admin whose role was revoked (the existing pattern, `supabase/tests/admin_content_management_publication.test.sql:109-117`), and permission denied for `anon`; the result for a Draft, a current Published, a historical Published (no row), an archived identity (no row), an unsupported type (`22023`) and a malformed id; and an assertion of the function ACL with `has_function_privilege` for `anon`, `authenticated`, `service_role` and `PUBLIC`.

### 4.5 Staged deployment sequence

**[RECOMMENDATION — NOT APPROVED. The sequence has not been independently reviewed and nothing below is authorized.]** The earlier draft proposed "app first, database second, with the Admin RPC in the same migration"; that was internally inconsistent (the app cannot depend on an RPC that arrives with the migration that is deployed after it) and is withdrawn. Proposed order:

| Stage | Action | State of the system afterwards | Main risk | Rollback |
|---|---|---|---|---|
| 0 | Read-only Cloud snapshot, procedure only (none executed now): ACLs (`pg_class.relacl`, `pg_attribute.attacl`) of the in-scope tables, `pg_policies` for them, `pg_get_functiondef` of the three reader RPCs (and `list_published_modules` for reference), counts and column checksums for the G6 baseline (27 institutions, 54 links, 37/37 and 5/6 populated values). | No change. | The snapshot is the rollback source; a stale or partial snapshot makes B's rollback unsafe. | Not applicable. |
| A | **Migration A, additive only:** create the Admin RPC (§4.4) with hardened grants. No change to any existing grant, policy, table or function. Verify on the local database first (dry-run, pgTAP) and with a Cloud structural check afterwards. | Same behavior as before. Old application unaffected. | An RPC created without the explicit revoke would be exposed by default privileges. | `drop function` of the new RPC (nothing depends on it yet). |
| App | **Deploy application changes:** management paths (`getContribution` for `instructor`/`material`) call the RPC; the Library stops rendering and requesting institution data and the `institution` entity, and legacy `entity=institution` is normalized (D-B, O-12); reader-facing generic institutional-reference copy is replaced (D-E, §5.2); institution detail route returns 404; types and tests updated. Must run correctly against the still-unrestricted database. | The app works against DB state A. **Data-boundary suppression is not in force:** the reader RPCs still return institution keys and the Data API still serves the tables and columns. The UI hides them, which is not an enforcement boundary, so **AC-01 is not met in this intermediate state** and U2 must not be reported as done. | The `institutions` key and `sourceOrInstitution` fields still ride in server payloads; do not treat the UI change as suppression. | Redeploy the prior application. Compatible with DB state A. |
| B | **Migration B, restriction:** replace the three policies (§4.2); revoke table SELECT on `instructor_revisions` and `material_revisions` and grant the non-sensitive columns; rewrite the three reader RPCs (§4.3) including the material search expression; replace `list_published_modules` only if verification showed it breaks. Apply atomically (one transaction; confirm how the migration runner wraps files `[INFERENCE]`). Local dry-run first. | Suppression in force. | See below: version skew, locks and rollback. | Re-apply the stage-0 snapshot (prior grants, policies and function definitions). Metadata only, no data changes. |
| Gate | **Final security verification before closure:** negative direct PostgREST reads as a non-Admin for each in-scope table and column (select, filter, order, `select=*`); Admin management regressions; Admin/non-Admin Library parity; counts and checksums against the G6 baseline unchanged; analytics content-type contract unchanged; anon and ineligible still denied. | Only after this gate may U2 move toward verification under the `resources/specs/README.md` Completion rule. | A passing UI test does not substitute for the direct-read tests. | Per stage above. |

Intermediate-state risks and compatibility, by stage:

- **After A, before the app deploy:** no behavioral change. Safe to stop here indefinitely.
- **After the app deploy, before B:** the app works against the unrestricted database. A rollback to the previous app version is also safe here. Suppression is not enforced; the intermediate state must not be mistaken for completion.
- **During and after B, version skew:** any running application version that still performs `select("*")` on `instructor_revisions`/`material_revisions`, or reads the dropped Library fields, breaks after B (column or table permission denied for the first; for the second see below). The previous production deployment must therefore be fully replaced, and not promotable as a rollback, before B. `[INFERENCE]` that old Vercel deployments stay reachable and share the database until retired; verify the deployment-retention and promotion posture with the owner before B. After B, an application rollback may only go to the post-app-deploy version or later, never to the pre-app version. Also `[INFERENCE]`: the current module detail reads `curriculumModule.institutions.length` without a null check (`src/app/app/library/module-detail.tsx:184`), so a pre-app version receiving a response without the `institutions` key would throw. Whether the rewritten `get_published_module` should keep an empty `institutions: []` key for skew tolerance, or drop the key entirely, is a technical response-shape choice for design review; an empty array contains no institution record, but AC-01 as written needs a decision that it satisfies "no institution record, relationship ... value".
- **During B (locks):** `CREATE POLICY` took `AccessExclusive` on its table in the local probe and `GRANT`/`REVOKE` were catalog-only (§2.5); `DROP POLICY` was not probed and is assumed to behave like `CREATE POLICY` `[INFERENCE]`. Keep it one short transaction so concurrent readers see either the old or the new state. Verify the lock behavior on a Cloud-sized copy if possible. `[INFERENCE]` that there is no window without a policy when in one transaction.
- **Rollback of B:** re-apply the snapshot. Because no data changes, it is reversible, but it is only compatible with the post-app-deploy application as long as that application does not require B-only behavior.

**Fallback:** one coordinated maintenance window with a defined failure boundary (application frozen, A+B applied together, app deployed, gate run, restore from the snapshot on failure). It removes version skew at the cost of downtime and a larger change under one rollback. Staged is preferred. Neither is selected here.

### 4.6 Test requirements (both layers, both required)

**Direct PostgREST/Data API tests** (pgTAP and, for column behavior, a real PostgREST call):

- Non-Admin (Contributor, ineligible, anon): no row from `institutions`, `institution_revisions`, `module_institutions`; `institution` and `source_or_institution` not selectable, filterable or orderable; `select=*`, `to_jsonb(t)` and whole-row references on the two content tables fail or exclude as designed; the non-sensitive columns of `instructor_revisions` and `material_revisions` remain readable to eligible readers under the existing row policies. Anon and ineligible stay denied.
- Admin positive reads preserved, row for row (§4.2): non-archived identities; `Draft` and current-published institution revisions; links of `Draft` and current-published module revisions; archived identities and historical `Published` institution revisions remain excluded exactly as today.
- Role revocation: an Admin demoted or deactivated loses these reads and the Admin RPC on the next authoritative request, and a Contributor never gains them (pattern: `supabase/tests/admin_content_management_publication.test.sql:109-117`).
- Admin RPC tests (§4.4), including its ACL.
- Reader-RPC key absence and role-agnostic parity: identical JSON for the same inputs as Admin and as reader; Draft present for Admin must not change the results of `search_curriculum`, `get_published_module`, `get_published_reference`.
- Material search: no result for a term that exists only in `source_or_institution`; instructor `institution` likewise.
- Definer lifecycle regressions: publish, `create_successor_draft` (including link and column copy), archive/restore blockers, `validate_publication`, lifecycle history and `list_archived_governed_content`, the import path as `service_role`.
- D-D regressions: `list_archived_governed_content` and `list_curriculum_lifecycle_history` keep their result columns, ACLs (`revoke all ... from public, anon, authenticated, service_role`, execute for `authenticated`: `M/20260916000200_archived_content_total_keyset.sql:110-116` and `M/20260916000100_archived_content_admin_reader.sql:161-169`) and Admin-only gate (`42501` for Contributor, ineligible, revoked Admin and `anon`); an archived institution still appears with its current-published `name` for an Admin, and institution lifecycle events still appear in history, exactly as before U2.
- `search_curriculum`: `entity_filter = 'reference'` returns material rows only (no institution row, no institution value); `entity_filter = 'institution'` returns no institution row (D-B, D-C, O-12).
- Admin RPC contract (D-A, O-13): the Admin management edit form reads the two protected fields through the Admin RPC and saves; a direct Data API read of those columns by an Admin is denied or is not relied upon (acceptable under D-A).
- Existing pgTAP that must change: `to_jsonb(revision)` snapshots as `authenticated` (`supabase/tests/successor_revisions.test.sql:136-141`, `:274-280`), the column-select assertions at `:173-193`, the institution assertions in `supabase/tests/curriculum_library_rls.test.sql:162-178`, and the invoker-RPC count at `:245-250`.

**Administrative functionality tests** (Vitest and Playwright against local Supabase):

- Open and save the edit form of a **published** institution, and of a published instructor and material (including editing `institution` and `source_or_institution`) through the management path.
- Management selects and option lists keep listing published and Draft institutions (`src/lib/contributions/queries.ts:229`, `:255`).
- Module relationships: the edit form of a Draft module and of a published module still lists institution links (`:166`, `:171`).
- Publish, create successor, archive and restore (including the archive-block check) for institutions and for modules that link institutions.
- Admin Library parity with a non-Admin Library view; `/app/library/references/institution/{id}` is 404 for both.
- Legacy entity normalization (D-B): `/app/library?entity=institution` and the same URL with other parameters (`q`, `axis`, `country`, `theme`, `view`) render the default Library view, with no error, no empty institutions section, no `Tipo: Instituciones` chip and no active institution option; the other parameters stay applied; links generated by the page (`libraryHref`, `src/lib/curriculum/library-href.ts:20-27`) do not re-emit `entity=institution`; `librarySignals` (`src/lib/analytics/library-signals.ts:52`) does not report it as an applied `entity` filter. `reference` renders materials only (D-C).
- Reader-facing copy (D-E): a Vitest/Playwright scan of reader-facing rendered text (shell footer, Library, module detail, reference page, suggestions) finds none of the inventoried strings of §5.2, while the Admin management surfaces (`/app/contributions/**`) still render their institution wording. Existing tests that assert the institution UI (`tests/e2e/library-explorer.spec.ts:273,461`, `tests/e2e/module-detail.spec.ts:263,296`, `tests/e2e/auth.spec.ts:185`, `tests/library-suggestions.test.ts:24,31,60`, `tests/module-detail-overlay.test.tsx:137,246`) must be updated.
- D-D, Playwright: the archived-content section and the history page still render for an Admin and still deny a Contributor, unchanged.

### 4.7 Rollback

**[RECOMMENDATION]** No data is changed by any stage, so rollback is metadata only, per stage as in §4.5, using the stage-0 snapshot. The material full-text GIN index (`M/core:286-288`) stays in place so rollback of B needs no index rebuild (O-6).

## 5. Product decisions (approved) and remaining technical items

### 5.1 Approved product decisions (Product Owner, 2026-10-22)

These were the questions D-A to D-E of the earlier draft of this section. The Product Owner approved them on 2026-10-22 (decider: Product Owner, explicitly authorized by the user); the authoritative record is SPEC-010 §6, G2 resolution record. They are G2 sub-decisions, not entries of the `docs/DECISIONS.md` register. They approve **product behavior only**: no mechanism, sequence, grant posture or predicate below is approved by them.

| Decision | Approved behavior | How it constrains the design | Closes |
|---|---|---|---|
| **D-A** | Admin access to instructor `institution` and material `source_or_institution` uses a dedicated, authorization-checked Admin RPC. Direct PostgREST column access may be restricted. | Removes the question whether stricter Admin treatment is acceptable: an Admin losing direct Data API column reads is permitted. The RPC itself (name, arguments, return shape, status scope: O-13; grants: O-11) and the mechanism (O-1) stay unapproved. `getContribution` (`src/lib/contributions/queries.ts:134-139`) must stop relying on `select("*")` for the two protected fields if direct access is restricted. | O-2 |
| **D-B** | Legacy `entity=institution` (including stale URLs) is ignored and normalized to the default Library view: no error, no empty institutions section, no `Tipo: Instituciones` chip. | `readEntity` accepts `institution` today (`src/lib/curriculum/library-state.ts:12`, `:31-34`) and `appliedFilters` renders a chip from it (`:100-101`, label at `:28`); `libraryHref` copies the raw `entity` value (`src/lib/curriculum/library-href.ts:22-27`), so a legacy value would be re-emitted by every generated link unless normalized. Where the normalization lives is O-12 (§5.3). | O-3 |
| **D-C** | `reference` remains a valid entity value and represents materials only. | `search_curriculum` currently returns institutions for `reference` (`M/core:727`); the rewritten function composes the `reference` branch from materials only. `libraryEntities` keeps `reference` and drops `institution`. | O-4 |
| **D-D** | The archived-content and lifecycle-history views are administrative management surfaces: not Library surfaces, not subject to the Admin parity suppression rule, existing permissions and behavior retained. | U2 does not change `list_archived_governed_content` or `list_curriculum_lifecycle_history`. Verified today (below). Regression tests must confirm they are unchanged (§4.6). | O-5 |
| **D-E** | Generic institutional-reference terminology is removed from reader-facing interface text only; Admin management surfaces and technical docs unaffected; replacement Spanish wording not decided. | Adds the copy inventory of §5.2 and the rendered-text scan of §4.6. Exact replacement wording is a U2 implementation detail needing Spanish copy review. | O-7 |

**What the D-D views show today.**

- **[VERIFIED]** `list_archived_governed_content` is a security-definer function that begins with `perform 1 from private.require_admin_content_access()` and returns `content_type, content_id, current_published_revision_id, revision_number, title, archived_at, archived_by` (`M/20260916000200_archived_content_total_keyset.sql:28-53`). For an archived institution it returns the institution's current-published `revision.name` as `title` (`:90-93`); it returns no instructor `institution`, no material `source_or_institution` and no institution link. Its grants revoke `public`, `anon`, `authenticated` and `service_role`, then grant execute to `authenticated` (`M/20260916000200_archived_content_total_keyset.sql:110-116`); the history function has the same posture (`M/20260916000100_archived_content_admin_reader.sql:161-169`).
- **[VERIFIED]** `list_curriculum_lifecycle_history` is a security-definer, Admin-gated function returning event metadata only: event id, `content_type`, `content_id`, `revision_id`, actor ids and organization name, action, statuses, timestamp (`M/20260916000100_archived_content_admin_reader.sql:116-154`). It reads `curriculum_lifecycle_events` and `organizations` only; it joins no institution table, so it shows institution events by type and id, not institution data.
- **[VERIFIED]** Both are called only after `requireAccess("Admin")` (`src/lib/contributions/queries.ts:285`, `:332`; pages `src/app/app/contributions/page.tsx:186`, `:238` and `src/app/app/contributions/history/page.tsx:85`, `:97`). The history page labels events with `contributionTypeLabel` (`src/app/app/contributions/history/page.tsx:48`, `:53`); the archived section labels entries with the same helper (`src/app/app/contributions/page.tsx:68`).
- **[INFERENCE]** Neither function reads the two protected columns or the three institution tables through the caller's privileges (definer functions run with the owner's rights), so narrowing `authenticated` privileges or replacing the reader policies does not affect them. Verify with the regression tests of §4.6.

### 5.2 D-E copy inventory (U2; reader-facing interface text) — [VERIFIED] by grep of `src/` at `main` `f1e00d3`

No code is changed by this record. Replacement wording is **not** decided: it is a U2 implementation detail needing Spanish copy review. Any wording suggested here is a **non-binding example** and is not approved.

**Reader-facing strings that carry generic institutional-reference terminology, or institution UI that D-B/D-C remove (to be handled in U2):**

| `file:line` | Current text | Note |
|---|---|---|
| `src/app/app/layout.tsx:66-67` | `Biblioteca curricular compartida de la red Democracia+. Módulos, programas, docentes e instituciones de referencia en un solo lugar.` | The generic copy that originated D-E (shell footer, every authenticated page). Non-binding example direction: describe modules, programs, instructors and materials without naming institutions. |
| `src/app/app/library/references/[type]/[id]/page.tsx:14` | `Institución o centro de referencia` | Kind label for the institution detail page; that route returns 404 under the approved scope. |
| `src/app/app/library/references/[type]/[id]/page.tsx:56` | `Fuente o institución` (label of `sourceOrInstitution`) | Reader display of the protected material field; suppressed by the approved scope. |
| `src/app/app/library/page.tsx:148` | `Instituciones` (Tipo segmented option, `entity: "institution"`) | Reader Library control. |
| `src/app/app/library/page.tsx:215` | `Instituciones` section (`referenceSection("Instituciones", "institutions-title", institutions, "institution", "instituciones")`) | Reader Library results section. |
| `src/app/app/library/page.tsx:43` | `institutions` results filter | Not copy; removed with the section above. |
| `src/app/app/library/module-detail.tsx:182` | `Instituciones` (section title) | Reader module detail. |
| `src/app/app/library/module-detail.tsx:194` | `Sin instituciones asociadas.` | Reader module detail empty note. |
| `src/app/app/library/module-detail.tsx:151` | `instructor.institution` joined into the instructor subtitle | Not a literal label; reader display of the protected instructor field. |
| `src/lib/curriculum/suggestions.ts:18` | `{ entity: "institution", label: "Instituciones" }` | Search suggestion group (reader). |
| `src/lib/curriculum/library-state.ts:28` | `institution: "Instituciones"` | `Tipo` chip label for an institution entity filter; D-B removes the chip. |
| `src/components/library/cards.tsx:53` | `ReferenceCard` `kind: "material" \| "institution"` (aria-label `Explorar referencia: …`) | Card type; the `institution` kind is dropped. The `referencia` wording on material cards (`:65`, `:67`) is a copy-review item, not an institutional-reference term. |

**Generic "referencia(s)" wording on reader surfaces to submit to Spanish copy review (not necessarily institutional; the reviewer decides):** `src/app/app/page.tsx:14` (`referencias publicadas`), `src/app/app/library/page.tsx:108` (`Módulos y referencias publicados`), `src/app/app/library/references/[type]/[id]/page.tsx:22` (`← Volver a referencias`), `:32` (`Esta referencia no tiene descripción publicada.`), `src/lib/curriculum/library-state.ts:26` (`reference: "Referencias"`, chip label for `entity=reference`, which now means materials only). These are listed so the reviewer can decide; this record does not decide them.

**Admin management surfaces (unaffected by D-E; keep their institution wording):** `src/app/app/contributions/contribution-form.tsx:134`, `:137`, `:160`, `:162`, `:206`, `:218`; `src/lib/contributions/types.ts:22` (`Institución o centro`); `src/lib/contributions/families.ts:31` (`Materiales, estudios e instituciones de referencia que acompañan al currículo.`, rendered in the Admin management and creation pages, which are `/app/contributions/**`) and `:43`; `src/app/app/contributions/governance-actions.tsx:64` (`Dejará de aparecer en la biblioteca, la búsqueda y las referencias para las personas lectoras.`, an Admin archive dialog; it names no institution and is left to the copy reviewer).

**Not product copy about institutional references (out of scope):** `institucional` in `Correo institucional` and `dominio institucional` (identity and organization domains: `src/app/app/page.tsx:34`, `src/app/login/**`, `src/app/app/users/page.tsx:55`, `src/app/app/organizations/**`); `Referencia del error:` in error pages (`src/app/error.tsx:14`, `src/app/app/error.tsx:14`, `src/app/app/contributions/error.tsx:14`).

**Documentation reconciliation (decided minimally).** `docs/PRODUCT.md` uses "reference institutions" terminology at line 19 (`reference institutions and centers;`), line 51 (`References, including institutions and materials/studies`), line 66 (`Reference surfaces (Materiales, Instituciones)`), line 78 (`related institutions;`) and line 92 (`institutions and reference centers.`). These describe the **current implemented** product, which is still true today because nothing is implemented. The existing approved-future-behavior banner at `docs/PRODUCT.md:300` already states that institutional references will be suppressed from reader surfaces, so the document does not contradict the approved behavior. It is therefore **not edited now**. After U2 is implemented and verified, a post-implementation documentation reconciliation is required: update `docs/PRODUCT.md` (lines above), `docs/CONTENT_MODEL.md` and any other product document that describes institutions as reader-visible, so the durable docs match the verified behavior. D-E is reader-facing interface text only and does not require editing technical documentation.

### 5.3 Technical items (implementer and independent reviewer, after design approval; none is a product decision)

- **T-1.** Choose and approve the mechanism (O-1; recommendation §4).
- **T-2.** Verify no invoker trigger body or RLS policy subquery reads the two columns under the narrowed privileges; the policies that subquery `material_revisions`/`instructor_revisions` reference only `id` and `status` (for example `M/20260914000100_admin_publication_foundation.sql:569-581`), which remain granted. `[INFERENCE]`
- **T-3.** Keep or drop the now-unused material index expression (O-6).
- **T-4.** Pre-migration Cloud ACL/DDL snapshot and the documented rollback (O-8).
- **T-5.** Test and fixture updates listed in §2.6 and §4.6, including `database.types.ts`.
- **T-6.** The default-ACL issue (G6 Q17, `docs/SECURITY.md` §19) is a separate security follow-up; new objects in U2 must still be explicitly revoked.
- **T-7.** Admin RLS preservation predicates, specified and reviewed (§4.2). (O-9)
- **T-8.** Staged deployment sequence, reviewed and approved (§4.5), including the retirement of the previous application deployment before Migration B and the response-shape choice for the rewritten module detail. (O-10)
- **T-9.** Admin RPC execution-grant posture reviewed (§4.4). (O-11)
- **T-10 (new, O-12).** Legacy entity normalization (D-B): choose where it lives. `[INFERENCE]` options: (a) server-side in `readEntity` (`src/lib/curriculum/library-state.ts:31-34`), which makes `libraryHref` (`src/lib/curriculum/library-href.ts:22-27`, copies the raw value) still re-emit a stale value unless it also reads through the normalized value, so the generated links need the same treatment; (b) a redirect to a URL without `entity=institution` that keeps `q`, `axis`, `country`, `theme` and `view`; (c) both. Also decide what `search_curriculum` returns for a direct `entity_filter = 'institution'` (it must never return institution rows), and make `librarySignals` (`src/lib/analytics/library-signals.ts:52`, which counts any non-empty `entity` parameter as an applied filter) ignore a normalized legacy value. A redirect must not add an analytics event.
- **T-11 (new, O-13).** Admin RPC contract: name, arguments, return shape (shaped like today's `select("*")` row or only the fields the form needs), status scope (Draft and current-pointer Published only, §4.4) and how `getContribution` consumes it. Grants are O-11.

## 6. What must be true before U2 is implementation-ready (technical items only)

The product decisions D-A to D-E are approved and are no longer prerequisites. G6 is satisfied. What remains is technical and unreviewed:

1. **Approved mechanism** (O-1), chosen from the alternatives above or a better one.
2. **Admin RLS preservation design** (O-9), specified predicate by predicate as in §4.2 and independently reviewed.
3. **Test plan** (§4.6) requiring both layers: direct PostgREST positive and negative access tests (non-Admin denied for every in-scope table and column; Admin management reads preserved through the Admin RPC; role revocation) and administrative functionality tests (edit form, option lists, module relationships, publish, successor, archive check), plus the D-B to D-E tests (legacy entity normalization, `reference` materials-only, archived/history unchanged, reader-facing copy scan).
4. **Staged deployment sequence** (O-10, §4.5) reviewed and approved, with rollback requirements per stage and the version-skew handling.
5. **Admin RPC execution-grant posture** (O-11, §4.4) reviewed, and its contract (O-13) reviewed.
6. **Legacy entity normalization design** (O-12) reviewed.
7. **Disposition of the unused material full-text index expression** (O-6).
8. A written rollback plan with the stage-0 snapshot procedure and a dry-run on local data (counts and column checksums against the G6 baseline) (O-8).
9. An activation request under the `resources/specs/README.md` Completion rule, with G1, G3, G4 and G5 remaining open unless they block U2 (they do not; they gate U3-U5).
10. Independent review of the migrations before Cloud application.

This preflight satisfies none of the above. No mechanism, sequence, grant posture, predicate or test plan in it is approved. G2 remains PARTIALLY RESOLVED and U2 remains BLOCKED.
