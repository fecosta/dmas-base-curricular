# SPEC-008 — Product Analytics & Pilot Observability

**Status:** ACTIVE — REVISED CONTRACT (GA4 NAVIGATION ANALYTICS + SUPABASE ORGANIZATIONAL METRICS) DOCUMENTED; NOT IMPLEMENTED; PRIVACY/LEGAL DECISIONS PENDING
**Delivery state:** `main` RUNTIME STILL CONTAINS THE SUPERSEDED POSTHOG DIRECT TRANSPORT, INERT (`NEXT_PUBLIC_POSTHOG_KEY` UNSET); NO GA4 OR ORGANIZATIONAL-METRICS CODE EXISTS
**Gate P — Privacy/Legal decisions:** PENDING
**Gate O — Organizational metrics validation:** PENDING
**Gate G — GA4 controlled validation:** PENDING
**External Pilot Analytics Activation Gate:** CLOSED
**Former Gate B (PostHog):** SUPERSEDED — NOT EXECUTED; MUST NOT BE EXECUTED

Revision 2026-10-21 (D-032) replaces the PostHog architecture with GA4 for navigation analytics, Supabase for organization-level adoption metrics, and a minimal Admin dashboard. The PostHog design is preserved only as a historical record (§18).

---

## 1. Purpose

The MVP measurement model answers exactly two questions:

1. **Navigation** — how do people navigate and interact with Base Curricular?
2. **Adoption** — which organizations use the platform, and how frequently?

| Question | System | Audience | Where reports live |
|---|---|---|---|
| Navigation | Google Analytics 4 (GA4), optional, consent-gated, default OFF | Authorized Democracia+ personnel with GA4 property access | GA4 UI (external; not built into Base Curricular) |
| Adoption | Supabase (existing authenticated organization model), server-side | Base Curricular Admins only | Minimal Admin dashboard (§7.7) |

Measurement exists to improve the product and understand organizational adoption. It must not become individual performance evaluation, user ranking, employee monitoring, organization scoring or ranking, sensitive inference, advertising or cross-service tracking (`docs/PRIVACY_AND_DATA_COLLECTION.md` §7).

Out of scope: session replay, heatmaps, autocapture, identity journeys, funnels per person, cohorts of individuals, exports/destinations, data warehouse/ETL, streaming, background workers, new services, new roles.

---

## 2. Current State

### 2.1 Repository runtime on `main` (`948abae`)

The runtime still contains the **superseded** PostHog implementation (§18): `src/lib/analytics/*`, `src/components/analytics/*`, the `analytics_preferences` table and RPC (migration `20261001000100`), the privacy UX (`src/components/privacy/*`) and `scripts/check-analytics-client-build.mjs`. `NEXT_PUBLIC_POSTHOG_KEY` is unset in every environment, so the transport is inert and sends nothing.

No GA4 code, no GA4 configuration and no organizational-metrics table, RPC or dashboard exist.

### 2.2 Unmerged branch `fix/spec-008-server-verified-analytics`

Commit `c8076e1` (unmerged; not on `main`) adds `src/app/api/analytics/authorization/route.ts`, a `GET` route that re-derives live eligibility and the user's own persisted preference server-side before the browser boundary activates, returning `{ enabled: false }` for undecided/rejected/unreadable and no identity unless accepted. Its concept is reusable for GA4 gating (§14.3). Its status is: implemented on a branch, not reviewed for merge, not deployed.

### 2.3 Revised contract

This document is the revised contract. It is not implemented and authorizes no implementation by itself (§14).

---

## 3. Approved Product Decisions

1. GA4 replaces PostHog for general navigation and usage trends (D-032).
2. Supabase records organization-level adoption metrics using the existing organization/membership model (D-032).
3. A minimal Admin-only dashboard shows: Organization, Registered users, Active users during selected period, Content opens, Downloads.
4. GA4 is optional, consent-gated, default OFF, Production-only, and receives no personal identifiers or organization identifiers.
5. Supabase metrics prefer aggregate counts over individual histories; the minimum per-user marker needed for distinct active users is defined in §7.2.
6. Internal Supabase metrics are **not** assumed exempt from privacy or consent requirements. Their consent treatment is **REQUIRES PRIVACY/LEGAL APPROVAL** (§7.6).
7. GA4 and Supabase numbers are different metrics and must never be presented as the same metric (§4.3).
8. Existing privacy protections are preserved: default OFF; consent separate from Terms; no Admin override of a user's preference; revocability; fail-closed preference handling; no search-term capture; environment isolation; private-file protection; no leak of unpublished content.

---

## 4. Measurement Definitions

### 4.1 Navigation (GA4)

| Candidate | GA4 source |
|---|---|
| Active users | GA4 standard metric derived from consented `page_view`s |
| Page views | manual `page_view` with sanitised route template (§6.5) |
| Library and module navigation | `page_view` on `/app/library`, `/app/library/modules/:id`, `/app/library/references/:type/:id` templates |
| Content opens | `content_opened` (§6.4) |
| Downloads | `content_downloaded` (§6.4) |
| Search usage | `search_performed` with no text (§6.4) |

GA4 measures only consenting users in Production. It has no organization dimension.

### 4.2 Adoption (Supabase)

All times and dates are **UTC**. A period is an inclusive range of UTC calendar days `[period_start, period_end]`.

| Metric | Definition |
|---|---|
| Registered organization | A row in `public.organizations` with `is_active = true` at query time. |
| Registered users (per organization) | Count of `public.memberships` rows for that organization with `is_active = true` at query time. |
| Active user | An eligible user (per `private.current_access()`) with ≥1 **qualifying action** on any UTC day in the period. Qualifying action: a successful eligible server render of an authenticated `/app` page, a recorded content open, or a recorded download. Failed, unauthenticated or ineligible requests never qualify. |
| Active users (per organization) | Count of distinct users with a presence marker (§7.2) for that organization on any day in the period. The organization is the one resolved by `current_access()` at the time of the action. |
| Active organization | An organization with ≥1 active user in the period. No higher threshold: with small pilot organizations a threshold would hide genuine use; a threshold can be added later without schema change. |
| Content open | One successful server-side resolution of a **current published** module, material or institution detail (standalone page or Library overlay) for an eligible user. Each resolution counts; no per-user-per-content deduplication, because deduplication would require storing which person opened which content. Prefetches and failed/unpublished/archived resolutions do not count. |
| Download | One successful authorized signed-URL issuance by `GET /api/attachments/[attachmentId]` (the existing server-authorized reader path) for a `Ready`, reader-visible attachment. Completion of the byte transfer is not observable and is not claimed. |

### 4.3 Cross-source rule

GA4 numbers are opt-in samples from consenting Production users, processed by Google. Supabase numbers are server-side counts across eligible users, subject to the §7.6 decision. They will not reconcile. Any report, deck or UI must label the source, and must not present GA4 "active users" and Supabase "active users" as the same metric.

---

## 5. Data Categories

The authoritative inventory is `docs/PRIVACY_AND_DATA_COLLECTION.md` §5A. Summary:

| Category | Purpose | Recipient | Consent |
|---|---|---|---|
| 1. Optional GA4 analytics | Aggregate navigation trends | Google (GA4 property) | Explicit opt-in, default OFF; legal basis/transfer **REQUIRES PRIVACY/LEGAL APPROVAL** |
| 2. Necessary operational data | Auth, eligibility, roles, membership, security, audit, private file access | Supabase, Vercel (existing) | Not consent-based; legal basis confirmation pending legal review (existing contract) |
| 3. Organizational usage metrics | Org-level adoption for Admins | Supabase (internal) | **REQUIRES PRIVACY/LEGAL APPROVAL**; per-user-linked recording not activated until approved (§7.6) |

Registered organizations and registered users per organization derive from existing membership data (category 2) and need no new collection.

---

## 6. GA4 Contract

### 6.1 Loading and consent

- `gtag.js` MUST NOT be requested, injected or executed before a persisted `accepted` decision for the **current GA4 consent version** is confirmed server-side (§6.8, §14.3).
- No Consent Mode "default denied" loading and no cookieless pings: the tag is simply not loaded without consent. Using Consent Mode pings without consent requires **PRIVACY/LEGAL APPROVAL**.
- Undecided, rejected, unreadable, superseded-version and failed-save states are all OFF.
- Enabling analytics emits no event by itself. Privacy-choice interactions are never measured.
- Existing PostHog-era acceptances MUST NOT be treated as GA4 consent. The provider and recipient changed, which is a material change under `docs/PRIVACY_UX_CONTRACT.md` §20; users must be asked again unless Privacy/Legal decides otherwise.

### 6.2 Environment

- Measurement ID is read from `NEXT_PUBLIC_GA_MEASUREMENT_ID` (documented here; env files are not changed by this revision).
- GA4 loads only when `NEXT_PUBLIC_VERCEL_ENV === "production"` and the Measurement ID is present and well-formed (`G-` prefix). Preview, Development, Test, unset or unknown environments are no-op (fail closed). Test runs are forced inert.

### 6.3 Identity

- No `user_id`, no Supabase UUID, no email, no name, no organization ID or name, no role is ever sent.
- GA4 User-ID, User-Provided Data collection and Google Signals are OFF.
- GA4 sets first-party `_ga` / `_ga_<container>` cookies holding a random client ID. This is a persistent browser identifier, which the superseded PostHog contract avoided. It is accepted only under consent and **REQUIRES PRIVACY/LEGAL APPROVAL**. Proposed `cookie_expires`: 60 days (pending approval; aligned with proposed event retention, §6.9).
- Logout clears `_ga*` cookies so the next user of the browser does not inherit the client ID (§6.8).

### 6.4 Event taxonomy

Manual events only. Automatic and enhanced measurement are off (§6.6).

| Event | Parameters (closed allowlist) | Why |
|---|---|---|
| `page_view` | `page_location` (sanitised, §6.5), `page_title` (= route template), `page_referrer` (sanitised template or empty) | Active users, page views, Library/module navigation |
| `search_performed` | `has_results` (boolean) | Search usage without query text |
| `content_opened` | `content_type` (`module` \| `material` \| `institution`) | Content-open trend |
| `content_downloaded` | `content_type` | Download trend |

Deliberately omitted: `library_viewed` (covered by `page_view`), `filter_applied` and `external_reference_opened` (not MVP candidates), `result_count`, `content_id`, `attachment_id`, filenames, titles, filter values. Adding any event or parameter requires a new Product/Privacy review.

Unknown events or parameters are rejected at runtime, not partially forwarded.

### 6.5 URL, title and referrer sanitisation

Existing reader routes (from `src/app`):

| Route | Sent as |
|---|---|
| `/app` | `/app` |
| `/app/library?q=…&axis=…` | `/app/library` (query string dropped; `q` holds search text) |
| `/app/library/modules/<uuid>` (page or overlay) | `/app/library/modules/:id` |
| `/app/library/references/<type>/<uuid>` | `/app/library/references/:type/:id` |
| `/app/privacidad/aviso`, `/app/privacidad/terminos` | unchanged |
| Admin routes (`/app/organizations/**`, `/app/users`, `/app/contributions/**`) | template with `:id` placeholders |
| any unmatched path | `/app/other` |

Rules: origin + template only; no query string, no fragment, no IDs, no slugs; `page_title` is the template, never `document.title` (content titles must not reach GA4); `page_referrer` is the previous template or empty. The existing `Referrer-Policy: no-referrer` header stays.

### 6.6 Property configuration (verified in Gate G)

Facts about Google behavior below are **to verify in Gate G**; this document does not assert them.

- Enhanced measurement: all toggles OFF (page views on history change, scrolls, outbound clicks, site search, video, file downloads, form interactions). History-change page views would send raw `?q=` URLs.
- Google Signals: OFF. Ads personalization: OFF. No Google Ads, Merchant or other product links. Data sharing settings: all OFF.
- Granular location and device data collection: OFF where the setting exists.
- IP handling: GA4 is documented by Google as not logging/storing IP addresses — to verify; no IP is sent as a parameter.
- User-ID and User-Provided Data: OFF.
- Event data retention: shortest available (expected 2 months — to verify). Proposed; **REQUIRES PRIVACY/LEGAL APPROVAL**.
- Property timezone UTC; no audiences built for cross-service use.

### 6.7 Prohibited data

GA4 MUST NOT receive: names, emails, Supabase UUIDs, organization IDs/names/domains, role, search text or anything derived from it, query strings, fragments, content titles, descriptions, teaching notes, filenames, attachment or content IDs, private document names, external URLs, tokens or headers.

### 6.8 Revocation and logout

On revocation (ON → OFF persisted) or logout the application MUST:

1. set `window['ga-disable-<MEASUREMENT_ID>'] = true` and stop all further `gtag` calls;
2. delete `_ga` and `_ga_<container>` cookies for the site domain;
3. not reload or re-inject the tag until a new persisted acceptance;
4. never send events generated while OFF.

Limitation: data already received by Google cannot be retracted by the application; it is subject to GA4 retention and Google's deletion tools (user-deletion by client ID or data-deletion requests), handled through the privacy-rights process (§9).

### 6.9 Retention

GA4 event data: shortest available setting (proposed 2 months; to verify). Aggregated standard reports may persist beyond event-data retention — to verify and disclose. **REQUIRES PRIVACY/LEGAL APPROVAL.**

### 6.10 Access

GA4 property access: named human Google accounts, least privilege (Viewer by default), MFA, no shared accounts, accountable offboarding. Base Curricular Admin does not grant GA4 access.

### 6.11 Failure isolation

Blocked, failing or slow GA4 never affects product use. No application retry, queue or replay.

---

## 7. Supabase Organizational Metrics Contract

### 7.1 Principles

Server-side recording only. Organization is always derived from `private.current_access()`; no caller-supplied organization, user or count is accepted. No new service, worker, warehouse, ETL, streaming or role.

### 7.2 Data model (minimum)

Two tables in the `private` schema (no grants to `anon`/`authenticated`):

```text
private.usage_daily_counts
  activity_date   date      -- UTC
  organization_id uuid      references public.organizations(id)
  metric          text      check (metric in ('content_open', 'download'))
  count           bigint    not null default 0
  primary key (activity_date, organization_id, metric)

private.usage_daily_presence
  activity_date   date      -- UTC
  organization_id uuid      references public.organizations(id)
  user_id         uuid      references auth.users(id) on delete cascade
  primary key (activity_date, organization_id, user_id)
```

`usage_daily_counts` holds no user identifier. `usage_daily_presence` is the minimum needed to count distinct active users over a period: one row per user per organization per UTC day, with no content, route, time-of-day or action type. It is personal data (pseudonymous). Hashing `user_id` adds no protection inside a private table and would break cascade deletion, so it is not used.

Alternative considered: count active users only per day (aggregate, no user ID). Rejected because distinct users across a multi-day period cannot be derived from daily counts. If Privacy/Legal rejects the presence marker, the dashboard falls back to "active users per day (max)" — a weaker metric — and must be labelled as such.

### 7.3 Recording

One RPC, `public.record_usage(metric text, subject_id uuid default null)`, `SECURITY DEFINER`, empty `search_path`, executable by `authenticated` only:

- resolves user and organization from `private.current_access()`; ineligible ⇒ no-op;
- `presence`: upserts the day's presence row (`on conflict do nothing`);
- `content_open`: validates `subject_id` is a current published module/material/institution, increments the counter, writes presence;
- `download`: validates `subject_id` is a `Ready` reader-visible attachment, increments the counter, writes presence;
- performs bounded retention purge (§7.5).

Callers: the authenticated `/app` server render (presence), the content detail server paths (content open), and `GET /api/attachments/[attachmentId]` after the signed URL is issued (download). Recording failure never blocks the product response.

Because the RPC is reachable with the user's own session, a user can inflate their own organization's counts only by the equivalent of repeating real views/downloads. They cannot target another organization, invent content, or read anything. Accepted for the MVP (§16).

### 7.4 Authorization and RLS

- Both tables: RLS enabled, no policies, no grants to `anon`/`authenticated`; `service_role` not granted unless a later privacy-rights need is approved.
- Read path: `public.admin_organization_usage(period_start date, period_end date)`, `SECURITY DEFINER`, calls `private.require_admin_content_access()` (live Admin role). Returns one row per organization only: `organization_id, organization_name, is_active, registered_users, active_users, content_opens, downloads`. It never returns user IDs or per-person rows.
- Validation: `period_start ≤ period_end ≤ current UTC date`, range ≤ 90 days; otherwise `22023`.
- Admin role revoked ⇒ `42501` on the next request. Contributors receive `42501`.

### 7.5 Retention (proposed; REQUIRES PRIVACY/LEGAL APPROVAL)

| Data | Proposed retention | Enforcement |
|---|---|---|
| `usage_daily_presence` | 90 days | bounded delete of rows older than 90 days inside `record_usage` |
| `usage_daily_counts` | 24 months | same purge mechanism |
| Account deletion | immediate for presence | `on delete cascade` |

No scheduled job is introduced. Limitation: purge runs only when recording runs; during zero traffic, expired rows persist until the next request. `pg_cron` is the upgrade path if Privacy/Legal requires time-exact deletion.

### 7.6 Consent treatment — REQUIRES PRIVACY/LEGAL APPROVAL

Unresolved: whether organizational usage metrics (a) are necessary/legitimate-interest processing disclosed in the Privacy Notice, (b) require opt-in under the existing analytics preference, or (c) require a separate opt-in.

Safe default until Gate P decides:

- `record_usage` and both tables MUST NOT be deployed active; no per-user-linked activity is recorded.
- Registered organizations and registered users (from existing membership data) MAY be shown to Admins, as they are existing operational/admin data.
- If (b) or (c) is chosen, only consenting users are counted, and the dashboard must label metrics as "usuarios que aceptaron" counts.
- Bundling org metrics into the GA4 consent is not recommended: different recipient and purpose.

### 7.7 Admin dashboard

- One Admin page, Spanish copy: **Actividad por organización**, under the existing Admin area (proposed `/app/organizations/actividad`; placement is implementation freedom).
- Period selector: start/end UTC dates; default the last 30 complete UTC days ending today; max 90 days.
- Columns: **Organización**, **Usuarios registrados**, **Usuarios activos en el período**, **Aperturas de contenido**, **Descargas**.
- Summary line: active organizations / registered organizations in the period.
- Footnote: "Fechas en UTC. Datos internos de Base Curricular; no comparables con Google Analytics."
- No per-person rows, no drill-down to users, no ranking or scoring labels, no export.
- Server-rendered; non-Admins receive the existing Admin denial; no data in client preload for non-Admins.

---

## 8. Common Minimization Rules

- Search text never leaves the request that executes the search; no hash, fingerprint or token of it is sent to GA4 or stored in metrics tables.
- Unpublished, Draft, archived, historical or unauthorized content never appears in GA4 parameters or metric validation success.
- Private files remain behind private Storage and signed URLs; metrics store no filename or object name.
- Metrics and GA4 are never authorization sources.

---

## 9. Privacy Rights and Controller

Controller: **FVR Ltd**. Contact: **hola@democraciamas.com**. Consent revocation and historical deletion are separate operations. Privacy-rights handling must cover: Supabase presence rows (delete by `user_id`), GA4 (Google user-deletion by client ID where the user can supply it, or property-level deletion request), and the preference row.

---

## 10. Legal Readiness — REQUIRES PRIVACY/LEGAL APPROVAL

Gate P must decide, at minimum:

1. GA4 processor terms / DPA acceptance and the contracting Google entity;
2. international transfer to the US and safeguards;
3. pilot jurisdictions and applicable legal basis for GA4;
4. acceptance of the `_ga` persistent client identifier and proposed cookie expiry;
5. GA4 retention setting and disclosure of aggregate-report persistence;
6. consent treatment for organizational metrics (§7.6);
7. retention of presence markers and counts (§7.5);
8. whether PostHog-era consents must be re-collected (recommended: yes);
9. Privacy Notice changes and new `privacyNoticeVersion`/`consentVersion`;
10. disposal of any PostHog data and closing the PostHog project.

Proposed user-facing Spanish changes for `docs/PRIVACY_NOTICE.md` (not applied; **REQUIRES PRIVACY/LEGAL APPROVAL**; apply only together with implementation and a version bump):

- §12 "¿Qué proveedor utilizamos para analítica?": "Utilizamos **Google Analytics 4**, de Google, como proveedor de la analítica opcional del producto, únicamente si la aceptas."
- §13 "Procesamiento internacional": "La analítica opcional es procesada por Google y puede implicar transferencias a Estados Unidos u otros países."
- §7: replace the event-identifier sentence with: "Google Analytics utiliza una cookie con un identificador aleatorio en tu navegador. No le enviamos tu identificador de cuenta, tu correo, tu nombre ni tu organización."
- §14 retention: replace "12 meses" with the approved GA4 retention and the approved organizational-metrics retention.
- New subsection under §4/§5 describing organization-level usage metrics, per the §7.6 decision.

`docs/TERMS_OF_USE.md` needs no change: it already refers to the Privacy Notice for the provider and keeps analytics separate from Terms.

---

## 11. Gates

### 11.1 Gate P — Privacy/Legal decisions — PENDING

Passes when every item in §10 has a recorded decision in `docs/DECISIONS.md`.

### 11.2 Gate O — Organizational metrics validation — PENDING

Requires Gate P item 6–7. Evidence: local real-stack pgTAP + Vitest + Playwright for AC-O1…AC-O10; Cloud structural verification of RLS, grants, function hardening; hosted read-only verification of the dashboard with a real Admin and denial for a non-Admin.

### 11.3 Gate G — GA4 controlled validation — PENDING

Requires Gate P items 1–5, 8–9. Protocol:

1. read-only verify property settings in §6.6 and record evidence;
2. controlled Production test with 1–2 named internal accounts, using GA4 DebugView/Realtime and browser network inspection;
3. verify: no `googletagmanager.com`/`google-analytics.com` request before consent; after consent only §6.4 events with §6.4 parameters; sanitised `page_location`/`page_title`/`page_referrer`; no `uid`/`user_id`, no query strings, no titles; revocation/logout stops requests and removes `_ga*`; Preview no-op; blocked GA4 does not break the product;
4. name a stop/rollback owner (unset `NEXT_PUBLIC_GA_MEASUREMENT_ID`, redeploy).

Containment: the Measurement ID is configured in Production only during Gate G; production users other than controlled accounts must be prevented from loading the tag (e.g. server-side allowlist during the window). Instructions alone are insufficient.

### 11.4 External Pilot Analytics Activation Gate — CLOSED

Opens only after Gate P, Gate G (for GA4) and/or Gate O (for org metrics) pass, the Privacy Notice is updated and versioned, and a deliberate activation decision is recorded. GA4 and org metrics may be activated independently.

### 11.5 Former Gate B — SUPERSEDED

The PostHog controlled validation authorized under D-031 was never executed. It is superseded by D-032 and must not be executed.

---

## 12. Acceptance Criteria

### GA4

- **AC-G1 Default OFF.** Undecided, rejected and unreadable preference ⇒ zero requests to Google tag/collect hosts (Playwright network assertion).
- **AC-G2 Separate consent.** Accepting Terms leaves GA4 OFF.
- **AC-G3 Re-consent.** A preference recorded under a PostHog-era `consent_version` is treated as undecided for GA4 (unless Gate P item 8 records a different decision).
- **AC-G4 Server-verified load.** The tag loads only after the server confirms a persisted `accepted` decision for the current consent version.
- **AC-G5 Taxonomy.** Only §6.4 events and parameters are sent; unknown input is rejected (unit test of the wrapper).
- **AC-G6 Sanitisation.** For each §6.5 route, `page_location` has no query/fragment/ID and `page_title` is the template (unit + Playwright).
- **AC-G7 No identifiers.** No request contains `uid`, `user_id`, a UUID, email or organization data (Playwright request inspection).
- **AC-G8 Revocation/logout.** After revocation or logout: no further collect requests; `_ga*` cookies absent.
- **AC-G9 Environment.** Preview/Development/Test/unknown env ⇒ no tag (unit + E2E in non-production).
- **AC-G10 Failure isolation.** Blocked Google hosts ⇒ all core journeys pass.
- **AC-G11 Property settings.** §6.6 settings recorded as verified in Gate G evidence.

### Organizational metrics

- **AC-O1 Server-derived org.** `record_usage` ignores any caller org/user; records under `current_access()` org.
- **AC-O2 Eligibility.** Unauthenticated/ineligible callers record nothing.
- **AC-O3 Content open.** Current published content increments once per resolution; Draft, archived, historical or unknown IDs do not.
- **AC-O4 Download.** Only a successful authorized signed-URL issuance increments; 401/403/404 paths do not.
- **AC-O5 Presence.** Multiple qualifying actions on one UTC day ⇒ one presence row.
- **AC-O6 No direct access.** `authenticated`/`anon` cannot select/insert/update/delete either table (`42501`).
- **AC-O7 Admin read.** Admin gets one row per organization with the five columns; Contributor and revoked Admin get `42501`.
- **AC-O8 Definitions.** Registered users = active memberships; active users = distinct presence in range; active organization = ≥1 active user (pgTAP fixtures across two orgs and UTC day boundaries).
- **AC-O9 Period validation.** Inverted, future or >90-day ranges ⇒ `22023`.
- **AC-O10 Retention purge.** Presence rows older than 90 days and counts older than 24 months are removed by the next `record_usage`.
- **AC-O11 Not activated before Gate P.** No migration activating `record_usage` callers is deployed to Production before Gate P item 6 is decided.
- **AC-O12 Dashboard.** Spanish labels per §7.7; no per-person data; UTC footnote; non-Admin denied server-side.

### Common

- **AC-C1 No search text** in GA4 requests or metrics tables.
- **AC-C2 No unpublished-content leak** via GA4 parameters, metric validation or dashboard.
- **AC-C3 Documentation.** Privacy Notice, data inventory and decisions match the implemented behavior before activation.

---

## 13. Testing Strategy

- **pgTAP:** tables' RLS/grants; `record_usage` validation and org derivation; `admin_organization_usage` authorization, definitions, period validation, purge.
- **Vitest:** GA4 wrapper (env gating, consent-version gating, allowlist, sanitiser for every §6.5 route, revocation cookie clearing); dashboard page server authorization; attachment route records only on success.
- **Playwright:** non-production network assertions (no Google hosts in any state); privacy UX journeys (re-consent for legacy acceptances); dashboard as Admin vs Contributor.
- **Build guard:** replace `scripts/check-analytics-client-build.mjs` with an equivalent check for the GA4 Measurement ID inlining and absence of PostHog symbols.
- **Hosted:** Gate G and Gate O protocols (§11). No destructive production mutation.

---

## 14. Implementation Transition (future plan; NOT authorized by this revision)

Implementation requires a separate authorized task per phase.

### 14.1 Code to remove or replace

| Item | Action |
|---|---|
| `src/lib/analytics/boundary.ts`, `config.ts` | replace with a GA4 loader/wrapper (Measurement ID, env gate, allowlist, sanitiser, revocation) |
| `src/lib/analytics/contract.ts` | reduce to the §6.4 taxonomy |
| `src/lib/analytics/library-signals.ts`, `library-events.ts` | keep only what `search_performed { has_results }` needs; drop the salted query token if no longer needed |
| `src/components/analytics/*` | `analytics-boundary.tsx` → GA4 loader; `content-opened.tsx`, `download-link.tsx` keep with new params; `external-reference-link.tsx` → plain link; `library-activity.tsx` → page_view/search only |
| `package.json` `test:analytics-build`, `scripts/check-analytics-client-build.mjs` | replace for GA4 |
| `.env.example` | replace `NEXT_PUBLIC_POSTHOG_KEY` with `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| Vercel env | remove `NEXT_PUBLIC_POSTHOG_KEY` if ever set |

### 14.2 Tests

Update/remove: `tests/analytics-boundary.test.ts`, `analytics-config.test.ts`, `analytics-events.test.tsx`, `analytics-instrumentation.test.ts`, `analytics-privacy-negative.test.ts`, `analytics-provider-contract.test.ts`, `privacy-ux.test.tsx`, `tests/e2e/analytics-boundary.spec.ts`, `tests/e2e/analytics-events.spec.ts`. Add: org-metrics pgTAP, dashboard tests, GA4 wrapper tests (§13). `tests/privacy-documents.test.ts` stays and enforces the Notice version constant.

### 14.3 Reuse

- **Preference storage:** `public.analytics_preferences` and `public.set_analytics_preference` (user-owned, no Admin override, fail-closed) fit GA4 unchanged. Re-consent uses the existing `consent_version` column: bump `consentVersion`/`privacyNoticeVersion` in `src/lib/privacy/contract.ts` and treat older versions as undecided. No migration needed for this.
- **Privacy UX:** `src/components/privacy/privacy-choice.tsx`, `data-preferences.tsx` reused; copy updated to name GA4 per approved Notice.
- **Server verification:** the `GET /api/analytics/authorization` concept from unmerged `c8076e1` is reusable as the GA4 load gate, with the response reduced to `{ enabled: boolean }` (GA4 needs no user/org identity). The branch must be reviewed and adapted, not merged as-is.

### 14.4 Database changes (minimal)

One migration: two `private` tables (§7.2), `public.record_usage`, `public.admin_organization_usage`, grants/RLS. No change to existing tables.

### 14.5 Phases

0. **Privacy/Legal decisions** (Gate P).
1. **Org metrics + Admin dashboard** (registered counts may ship before Gate P; recording only after §7.6 decision) → Gate O.
2. **GA4 swap** (loader, wrapper, re-consent, Notice update with version bump) → Gate G.
3. **PostHog removal** (code, tests, env, scripts, PostHog project closure/data disposal per Gate P item 10).
4. **Activation decision** (External Pilot Analytics Activation Gate) and doc reconciliation.

Phases 2 and 3 may be combined in one change.

---

## 15. Implementation Freedom

Engineering may choose component structure, route placement of the dashboard, SQL shape, and wrapper internals. It may not change: consent semantics, default OFF, event/parameter allowlists, sanitisation rules, metric definitions, authorization, retention values once approved, environment isolation, or gates. A conflicting constraint returns `BLOCKED / DECISION REQUIRED`.

---

## 16. Known Limitations

- GA4 and Supabase numbers never reconcile (§4.3).
- GA4 relies on a persistent first-party client ID cookie; cookie clearing on logout does not affect data already sent.
- Already-sent GA4 data cannot be retracted; deletion relies on GA4 retention/deletion tools.
- Content opens are not deduplicated; reloads and repeated views inflate counts.
- A user can inflate their own organization's counts by repeating real actions or calling `record_usage` directly with their session.
- Downloads count authorized URL issuance, not completed transfer.
- Small organizations: an Admin seeing "1 active user" may infer who it is. Admins already manage memberships; no per-person data is shown.
- Retention purge is traffic-driven, not time-exact (§7.5).
- Organization attribution follows the user's organization at the time of action; reassignment does not move history.

---

## 17. Open Questions

1. §7.6 consent treatment for organizational metrics — **REQUIRES PRIVACY/LEGAL APPROVAL**.
2. §7.5 retention values — **REQUIRES PRIVACY/LEGAL APPROVAL**.
3. GA4 DPA, transfer, jurisdictions, legal basis, cookie identifier — **REQUIRES PRIVACY/LEGAL APPROVAL**.
4. Is per-content popularity (which content is opened most) an MVP need? Currently omitted from both systems. **PRODUCT DECISION.**
5. Should Admin/Democracia+ staff activity be excluded from the dashboard? Currently included under their own organization. **PRODUCT DECISION.**
6. Disposal of the PostHog project and any data in it. **PRIVACY/LEGAL + PRODUCT.**

---

## 18. Superseded PostHog Design — Historical Record

**SUPERSEDED by D-032 (2026-10-21). Not current or approved behavior.** Kept for rationale and evidence; full text at `948abae:resources/specs/active/008-product-analytics-pilot-observability.md`.

- **Implementation history:** first SDK implementation with `identify()` (`913ea86`, `03fdf93`, `dbb40c4`), hosted-validated with analytics disabled (record at `b3321fd`, §42 there; G-008). Replaced by a profile-free direct Capture API transport (`807b702`, `e2c4145`, `57b03da`): six events (`library_viewed`, `search_performed`, `filter_applied`, `content_opened`, `external_reference_opened`, `content_downloaded`), Supabase UUID as event-level `distinct_id`, `$process_person_profile: false`, no SDK/retry/queue, Production-only, closed property allowlist.
- **Provider evidence (2026-10-07, account-level, not repository):** PostHog Cloud EU project `289698`, Free plan; raw-IP discard ON, GeoIP PAUSED, autocapture/Web Vitals/heatmaps/Session Replay OFF; one human Owner with MFA; no destinations/exports; investigation-time WebMCP OAuth grants revoked.
- **Rationale that carries forward:** search text must never reach analytics; URLs/referrers must be sanitised; SDK retry/teardown can transmit after opt-out, so loading must be gated rather than "disabled after load"; revocation cannot retract delivered data; environment isolation must use `NEXT_PUBLIC_VERCEL_ENV`, not `NODE_ENV`.
- **D-031** (PostHog one-year query-retention boundary) and **Privacy/Legal decision A** (controlled Gate B only) are superseded with this design.
- **Gate B** was authorized but never executed.

---

## 19. Current Lifecycle State

- Revised contract documented (D-032); not implemented.
- Gate P, Gate O, Gate G: PENDING.
- External Pilot Analytics Activation Gate: CLOSED.
- Former PostHog Gate B: SUPERSEDED, not executed.
- `main` runtime: superseded PostHog transport present and inert; `NEXT_PUBLIC_POSTHOG_KEY` unset.

No production analytics or organizational-metrics activation is authorized by this revision. SPEC-008 remains active and MUST NOT move to `completed/` until the applicable gates pass and independent verification against §12 is complete.
