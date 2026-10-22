# SPEC-010 / U0 — G6 Cloud Inventory Evidence

**Status:** EVIDENCE RECORD — READ-ONLY INVENTORY, REVIEWED (PASS_WITH_NOTES). Not a product contract and not an approval record.

**Referenced by:** `resources/specs/planned/010-platform-readiness-organizational-testing.md` §6 (gate G6).

**Snapshot date:** 2026-10-22 (taken from the source report's file timestamp; the report body carries no date).

**Preservation note:** the source report is preserved verbatim below, except for two redactions: (1) the local review session identifier is replaced by `[local session id omitted]`; (2) the identifier of a different, non-target Supabase project is replaced by `[other project ref omitted]`. No credentials, personal data or content titles were present in the source. The line "Report lives outside the repo" describes the report's original location, not its current one.

---

# SPEC-010 / U0 — G6 Cloud inventory evidence (Q1–Q17)

Project: qcxcgwpfgclyebkxawyh (MCP get_project_url -> https://qcxcgwpfgclyebkxawyh.supabase.co). Not [other project ref omitted].
Repo: main, working tree clean; no repo files changed. Report lives outside the repo.
Aggregates only; no identifiers, names, titles, or paths collected.

## 1. MCP semantics and permissions (verified)
- Role: supabase_read_only_user (current_user = session_user). Not superuser; rolbypassrls = true (full row visibility). Member of pg_read_all_data, pg_monitor, pg_read_all_settings, pg_read_all_stats, pg_stat_scan_tables. Not member of anon/authenticated/service_role.
- Role config default_transaction_read_only=on. transaction_read_only = on in a bare call and inside explicit BEGIN READ ONLY; ...; ROLLBACK; in one execute_sql call; still on afterwards.
- 0 of 24 public tables grant this role INSERT/UPDATE/DELETE/TRUNCATE. Not in recovery. PostgreSQL 17.6.
- Each approved query submitted verbatim (comments stripped, trailing ; removed) as BEGIN READ ONLY; <query>; ROLLBACK; in its own execute_sql call. No SQL edited.
- MCP result text is wrapped as untrusted data; nothing in it was acted on.

## 2. Preflight
P1 = PASS, no reasons. 12 migrations recorded, none missing/extra. P2: all 18 tables exist, owner postgres, RLS enabled, not forced, SELECT ok, FULL_VISIBILITY_BY_ROLE.

## 3. Results (Q1–Q7 re-run via MCP; not diffed against the earlier manual run)
- Q1: 27 institutions, all active + Published; 0 archived; 0 never-published.
- Q2: institution revisions: 27 current_published, 1 historical_published.
- Q3/Q3b: current 27: 12 blank, 15 non-blank, 6 distinct (EE. UU. x10; Brasil / México / Colombia, Chile, España, Reino Unido, Suecia x1 each). Historical 1 (España).
- Q4: outside illustrative list: EE. UU. x10, multi-country string x1 (current_published).
- Q5/Q5b: 39 material revisions, all country blank (37 current, 1 archived, 1 historical).
- Q6/Q6b: 6 instructor revisions, all country blank.
- Q7: material.source_or_institution non-blank 37/37 current, 0/1 archived, 1/1 historical; instructor.institution non-blank 5/6 current.
- Q8: 27 current-published institutions; 26 names >=4 chars; 1 name <4 (min length 3).
- Q9 (approximate): material.source_or_institution current 16/37 match, historical 0/1; instructor.institution current 3/5; material.title 0 matches (37 current, 1 archived, 1 historical).
- Q10: 54 module_institutions links, 17 module revisions, 27 distinct institutions; all on current-published module revisions (ALL row identical).
- Q11: 0 rows (no links to archived or never-published institutions).
- Q12/Q12b: 33 events (institution 3, material 8, module 7, program_topic 6, teaching_note 9). content_submitted: module 1, program_topic 1, teaching_note 2.
- Q13: 2 attachments, both Ready: 1 on Published material revision, 1 on Submitted teaching-note revision.
- Q14: NULL created_by/contributor org only on Published rows: institution 27/28, instructor 6/6, material 37/39, module 17/18, program_topic 90/90, teaching_note 90/90. Draft (program_topic 1) and Submitted (module 1, program_topic 1, teaching_note 2) rows have provenance set.
- Q15: institutions 27, instructors 6, materials 37 active + 1 archived, modules 18 published + 1 never-published, program_topics 90 + 2 never-published, teaching_notes 90 + 2 never-published.
- Q16: organizations 10 active; organization_domains 10; memberships Admin/active 4, Contributor/active 3; none inactive.
- Q17: 5/5 tables found; RLS enabled, not forced. Explicit ACL: authenticated SELECT; postgres and service_role full. No PUBLIC/anon grants, no column ACLs. Effective: anon none, PUBLIC none, authenticated SELECT. 10 SELECT policies (Admin Draft, eligible reader current) for authenticated; no write policies. Default ACL for future public tables grants anon/authenticated arwdDxtm (note only).

## 4. Consolidated findings
1. 27 institutions, all published, none archived/draft; 54 module links, all to current-published module revisions, none to unpublished/archived institutions. U2 scope on this axis: 27 identities, 54 links.
2. Institution country: 12/27 blank; EE. UU. (10) and one multi-country string need an explicit legacy rule (G1/U3/U4).
3. Material and instructor country: all blank. U4 starts as Sin dato for 39 material and 6 instructor revisions.
4. Free-text institutional references: material.source_or_institution populated on 37/37 current, instructors 5/6; at least 16/37 and 3/5 contain a catalog institution name (approximate lower bound). Titles unaffected.
5. Legacy deferred-workflow residue: 4 Submitted revisions, 1 Draft program topic, 1 Ready attachment on a Submitted teaching note. Not reader-visible. Data-dependent migrations must account for them.
6. Seeded published rows have NULL created_by/contributor org; migrations must not assume non-null provenance.
7. Access boundary: authenticated SELECT via RLS only; anon none.
8. Limits: Q9 approximate; project ref proven only via MCP URL; Q17 not reconciled against migration text by a reviewer.

## 5. Independent review
Verdict: PASS_WITH_NOTES (user-directed manual review; session [local session id omitted]).
- Reviewer: review-openai, 9router/review-openai (alias; underlying model/family unverified). Execution family of the inventory unresolved. Opposite-family independence NOT claimed. No orchestrator checkpoints.
- Limits: MCP URL/transaction/per-query receipts not embedded (executor-asserted); Q12/Q17 summarized, not row-by-row.
- Verified: Q1-Q17 coverage; aggregates consistent; Q11 logic correct (zero result expected given Q1); Q10 vs Q14 consistent (Submitted module has no links); Q17 matches migrations; legacy Draft/Submitted rows not reader-visible; no identifiable data.
- Not a G6 blocker: broader free-text fields and search indexes (G2/U2 scope); default ACL for future public tables (separate security remediation, outside SPEC-010).
- G6: evidence substantively sufficient. Record as satisfied only after this review is recorded in the governance record. SPEC lifecycle not changed here. U2-U4 stay blocked on G1-G3.
