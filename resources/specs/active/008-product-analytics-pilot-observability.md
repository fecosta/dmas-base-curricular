# SPEC-008 — Product Analytics & Pilot Observability

**Status:** ACTIVE — REVISED CONTRACT (GA4 NAVIGATION ANALYTICS + SUPABASE ORGANIZATIONAL METRICS) DOCUMENTED; NOT IMPLEMENTED; PRIVACY/LEGAL DECISIONS PENDING
**Delivery state:** `main` RUNTIME STILL CONTAINS THE SUPERSEDED POSTHOG DIRECT TRANSPORT, INERT (`NEXT_PUBLIC_POSTHOG_KEY` UNSET); NO GA4 OR ORGANIZATIONAL-METRICS CODE EXISTS
**Gate P — Privacy/Legal decisions:** PENDING
**Gate O — Organizational metrics validation:** PENDING
**Gate G — GA4 controlled validation:** PENDING
**External Pilot Analytics Activation Gate:** CLOSED
**Former Gate B (PostHog):** SUPERSEDED — NOT EXECUTED; MUST NOT BE EXECUTED

Revision 2026-10-21 (D-032) replaces the PostHog architecture with GA4 for navigation analytics, Supabase for organization-level adoption metrics, and a minimal Admin dashboard. The PostHog design is preserved only as a historical record (§18).

Review remediation 2026-10-21 (D-032 amendment): usage recording moved to a trusted server-only execution boundary (§7.3); GA4 data inventory split into application-controlled, request-inherent and provider-derived data (§6.12); all retention values PROVISIONAL with a manual operator-run deletion procedure and a BLOCKED activation item (§7.5); dashboard reduced to five visible columns with one period convention (§7.7); per-content popularity excluded and Admin activity excluded from adoption metrics (§3); Privacy Notice update made a hard activation prerequisite (§10).

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
9. **Per-content popularity is not in the MVP.** No organization-by-content reporting, no content rankings, no individual activity histories. The usage tables MUST NOT store a content, material, institution or attachment identifier (§7.2).
10. **Administrator activity is excluded from adoption metrics** (content opens, downloads, active users). Admins remain counted in registered users. Rule and justification: §4.2.
11. **Usage recording happens only inside trusted server-side application operations.** Clients have no direct permission to increment any metric (§7.3).

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

**Period convention (applies everywhere in this spec and in the privacy docs).** All times and dates are **UTC**. A period is `[period_start, period_end]`: both dates inclusive, each date meaning the whole UTC day `00:00:00`–`23:59:59.999`. `period_end` may be the current UTC date, in which case that day contains only activity recorded so far. Maximum range: 90 days inclusive (`period_end − period_start ≤ 89`). Default: the 30 UTC days ending on the current UTC date (`[today − 29, today]`).

**Qualifying organizational usage (Admin exclusion rule).** An action counts toward adoption metrics only when it is performed by an eligible user whose **live persisted role at the time of the action is `Contributor`**. Any action by a user whose live role is `Admin` is not recorded for usage metrics, on any surface.

Justification: an Admin-only exclusion by surface (count Admin reader-surface views, exclude only Admin management pages) was considered and rejected. During the D-030 operational phase Admins own governed-content management, and their reader-surface opens and downloads are predominantly checks of content they manage or just published; the system cannot distinguish an Admin "reading" from an Admin "verifying" on the same reader route. Counting them would let the small number of Democracia+ operators inflate adoption figures. The live-role rule is deterministic, testable, needs no surface classification, and uses the same live role that already governs Admin authority. Consequences, accepted: an organization whose only active members are Admins shows **0** active users, opens and downloads; genuine reading by an Admin is not counted; a user demoted from Admin to Contributor is counted from the next action, and a user promoted to Admin stops being counted from the next action (history is not rewritten). Admins **are** included in Registered users.

| Metric | Definition |
|---|---|
| Registered organization | A row in `public.organizations` with `is_active = true` at query time. Every registered organization appears in the dashboard, with zero usage if it has none. |
| Registered users (per organization) | Count of `public.memberships` rows for that organization with `is_active = true` at query time, **including Admins**. |
| Qualifying action | One of, performed by an eligible `Contributor` (rule above): (a) a successful server render of the authenticated `/app` shell (presence only), (b) a recorded content open, (c) a recorded download. Failed, unauthenticated, ineligible or Admin requests never qualify. |
| Active users (per organization) | Count of distinct users with a presence marker (§7.2) for that organization on any UTC day in the period. The organization is the one derived from the user's live membership at the time of the action. |
| Content opens | Count of `content_open` events: one per successful **authorized server-side resolution of current published content** (module, material or institution detail, standalone page or Library overlay). It is **not** proof that anyone read the content. Each resolution counts; there is no per-user-per-content deduplication, because that would require storing who opened what. |
| Downloads | Count of `download` events: one per successful **authorized signed-URL issuance** by `GET /api/attachments/[attachmentId]` for a `Ready`, reader-visible attachment of current published content. It is **not** proof that the file transfer started or completed. |

These metrics produce no individual browsing history: no table records which content or attachment anyone opened, and no per-content counts exist. The only per-user element is the daily presence marker (§7.2), which records that a user was active on a UTC day for an organization and nothing else.

**What is and is not counted by the Next.js request model.** Recording runs in the server code of the page that resolves the content (not in a layout or link). Default (`auto`) `<Link>` prefetch of a dynamic route only renders down to the nearest `loading.js` boundary (`src/app/app/loading.tsx` exists), so it does not execute the content page and does not count; content links MUST NOT use `prefetch={true}`. A full reload, a direct revisit, `router.refresh()` or any other server re-render of the content page re-resolves the content and **does count again** — stated limitation (§16), consistent with "each resolution counts". Client-initiated beacon or `POST` "record" endpoints are prohibited.

### 4.3 Cross-source rule

GA4 numbers are opt-in samples from consenting Production users, processed by Google, and include Admins who consent. Supabase numbers are server-side counts across eligible Contributors (Admins excluded, §4.2), subject to the §7.6 decision. They will not reconcile. Any report, deck or UI must label the source, and must not present GA4 "active users" and Supabase "active users" as the same metric.

---

## 5. Data Categories

The authoritative inventory is `docs/PRIVACY_AND_DATA_COLLECTION.md` §5A (categories) and §5B (GA4 data inventory, mirroring §6.12 here). Summary:

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
- GA4 sets first-party `_ga` / `_ga_<container>` cookies holding a random client ID. This is a persistent browser identifier, which the superseded PostHog contract avoided. It is accepted only under consent and **REQUIRES PRIVACY/LEGAL APPROVAL**. `cookie_expires`: 60 days — **PROVISIONAL** (§7.5 table).
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
- IP handling: the application sends no IP parameter, but the browser's request necessarily exposes the IP address to Google at the network layer. Google documents that GA4 does not log or store IP addresses — documented/possible; **to verify; REQUIRES PRIVACY/LEGAL APPROVAL**.
- User-ID and User-Provided Data: OFF.
- Event data retention: shortest available (expected 2 months — to verify in the property admin). **PROVISIONAL; REQUIRES PRIVACY/LEGAL APPROVAL**. This setting is provider-controlled: the application cannot enforce it.
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

GA4 event data: shortest available setting (2 months, **PROVISIONAL**; to verify). Retention is configured in the GA4 property and enforced by Google, not by Base Curricular; the value must be verified in the property admin (Gate G) and approved. Aggregated standard reports may persist beyond event-data retention — documented/possible; to verify and disclose. **REQUIRES PRIVACY/LEGAL APPROVAL.** See the consolidated table in §7.5.

### 6.10 Access

GA4 property access: named human Google accounts, least privilege (Viewer by default), MFA, no shared accounts, accountable offboarding. Base Curricular Admin does not grant GA4 access.

### 6.11 Failure isolation

Blocked, failing or slow GA4 never affects product use. No application retry, queue or replay.

### 6.12 GA4 data inventory

The §6.4 allowlist controls only what the **application** passes to `gtag`. It does not control everything Google receives or processes. Three categories apply once the tag loads (consent ON only):

**1. Application-controlled data**

| Item | Control |
|---|---|
| Event names | Closed list, §6.4 |
| Explicit event parameters | Closed list, §6.4 (`page_location`, `page_title`, `page_referrer`, `has_results`, `content_type`) |
| Route templates | Sanitised, §6.5 |
| Configuration | Measurement ID (`NEXT_PUBLIC_GA_MEASUREMENT_ID`), `send_page_view: false`, `cookie_expires`, `ga-disable-*` flag |
| Consent gating | Tag loaded only after server-verified persisted acceptance, §6.1 |

**2. Request-inherent data** — inherent to making the request; not controlled by the application:

- IP address of the client as seen by the destination;
- necessary transport metadata (e.g. TLS/transport-level metadata, destination host, request timing).

**3. Potential provider/browser processing** — may be read, generated, or transmitted depending on GA4 configuration, browser behavior, and provider processing. Requires verification before activation. **REQUIRES PRIVACY/LEGAL APPROVAL** for each item:

- user agent / client hints;
- HTTP headers, including `Referer` subject to browser policy (the site sends `Referrer-Policy: no-referrer`, which governs requests leaving Base Curricular pages; to verify for tag requests);
- browser language;
- screen and viewport size (read by the tag script);
- cookies set for Google domains, if any, and first-party `_ga*` cookies read by the tag;
- client identifier in `_ga` and session identifiers/counters in `_ga_<container>` cookies;
- provider-generated automatic parameters (e.g. session ID, session number, engagement time, session-engaged flag, first-visit/session-start events, page-load/request sequence counters);
- automatically collected events that may remain even with enhanced measurement OFF (e.g. `first_visit`, `session_start`, `user_engagement`);
- device category, browser, OS and version;
- approximate geolocation inferred from IP (country/region/city);
- traffic source/medium/campaign attribution;
- any aggregated or modelled data Google derives in reports.

Base Curricular does not claim that the allowlist governs categories 2 or 3. Gate G (§11.3) observes what the browser actually sends; it cannot verify Google's server-side processing, derivation or retention, which requires review of Google documentation, the property settings and Privacy/Legal approval. GA4 stays disabled until those decisions and configuration checks are complete.

---

## 7. Supabase Organizational Metrics Contract

### 7.1 Principles

Recording happens only inside trusted server-side application operations, after the underlying operation succeeded. No client — browser code, a user's own Supabase session, or any HTTP endpoint a client can call to "report" activity — can increment a metric. Organization is always derived in the database from the user's live membership; no client-supplied organization, user, content or count is accepted or stored. No new service, worker, warehouse, ETL, streaming, scheduler or role.

### 7.2 Data model (minimum)

Two tables in the `private` schema (no grants to any API role, §7.4):

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

Neither table has a content, material, institution, attachment, route or time-of-day column, and none may be added without a new Product/Privacy decision (§3 item 9). `usage_daily_counts` holds no user identifier. `usage_daily_presence` is the minimum needed to count distinct active users over a period: one row per user per organization per UTC day, with no content, route, time-of-day or action type. It is personal data (pseudonymous). Hashing `user_id` adds no protection inside a private table and would break cascade deletion, so it is not used.

Alternative considered: count active users only per day (aggregate, no user ID). Rejected because distinct users across a multi-day period cannot be derived from daily counts. If Privacy/Legal rejects the presence marker, the dashboard falls back to "active users per day (max)" — a weaker metric — and must be labelled as such.

### 7.3 Recording

#### 7.3.1 Why the user's session cannot be the recording credential

The browser holds the user's Supabase access token (SSR session cookie) and the publishable key. Any function executable by `authenticated` is therefore callable directly by the user, with any arguments, without performing the qualifying action. The earlier design (`record_usage` executable by `authenticated`) was rejected for that reason.

#### 7.3.2 Execution boundary (decision)

| Element | Contract |
|---|---|
| Write function | `public.record_usage(target_user_id uuid, metric text)`, `SECURITY DEFINER`, empty `search_path`, owned by `postgres`. `metric ∈ ('presence', 'content_open', 'download')`; anything else ⇒ `22023`. |
| Grants | `revoke all … from public, anon, authenticated`; `grant execute … to service_role` only. Same precedent as `public.import_published_curriculum(jsonb)` (migration `20260911000100`). `authenticated` calls fail with `42501`. Tables keep no grants to any API role (§7.4). |
| Organization and eligibility | Derived inside the function from live rows for `target_user_id` using the **same eligibility predicate as `private.current_access()`** (migration `20260910000100`: active membership, active organization, matching organization domain, confirmed non-anonymous, non-deleted, non-banned Auth user). `current_access()` itself reads `auth.uid()`, which is null under the server credential, so the implementation must either factor its predicate into one private helper used by both, or keep an identical predicate with a pgTAP equivalence test, so they cannot diverge. Not eligible ⇒ no-op. Live role `Admin` ⇒ no-op (§4.2). No organization, content or count parameter exists. |
| Effect | `presence` ⇒ insert presence row (`on conflict do nothing`). `content_open` / `download` ⇒ increment the day's counter and insert presence. No purge (§7.5). |
| Caller credential | A dedicated server-only Supabase secret key (`sb_secret_*`), e.g. `SUPABASE_USAGE_RECORDER_SECRET_KEY` (name is implementation freedom; not configured by this revision). It is **not** `SUPABASE_AUTH_ADMIN_SECRET_KEY`, whose documented contract is "not used for database access" (`docs/SECURITY.md` §27). |
| Caller module | One `server-only` module (e.g. `src/lib/usage/recorder.ts`) exposing exactly one function `recordUsage(metric)` that takes the user ID only from the server-verified `getAccess()` context (`src/lib/auth/access.ts`, which validates the session with `auth.getUser()` and live `current_access`). It creates a non-persisting client, calls only `record_usage`, never exports the client, never reads request input for the user ID, and has no other importer path to the browser. |
| Callers | (1) `/app` layout server render after `requireAccess()` (presence); (2) the module page, Library overlay page and reference page **after** the published read returned data (content open); (3) `GET /api/attachments/[attachmentId]` **after** `createSignedUrl` returned a URL and before the redirect (download). No other caller. No client-initiated record endpoint. |

Justification for using a privileged credential (`AGENTS.md` §6): it is the only option that removes the user's ability to call the write path while keeping the existing stack. Constraints: server-only module behind `import "server-only"`; never a `NEXT_PUBLIC_*` variable; never in the client bundle (build guard asserts absence of the variable name and key prefix, as SPEC-009 does for the Auth Admin key); one narrow function; the database function, not the module, decides eligibility, organization and Admin exclusion; key rotation by revoking the dedicated secret without affecting the Auth Admin key.

Alternatives rejected:

- **`authenticated`-executable RPC** — forgeable (§7.3.1).
- **Recording as a side effect of the existing published read RPCs** (`get_published_module`, `get_published_reference`) — still triggerable by the user's session, would turn `stable security invoker` reads into volatile writers on every caller (including search/overlay paths), and cannot cover signed-URL issuance, which happens in Storage, not SQL.
- **Reusing `SUPABASE_AUTH_ADMIN_SECRET_KEY`** — contradicts its documented contract and couples Auth Admin and database blast radius and rotation.

Residual: a compromised server or leaked recorder key can forge counts (and, as a `service_role` key, bypass RLS generally). This is the same trust class as the existing Auth Admin secret and is accepted for the MVP.

#### 7.3.3 Ordering and failure handling

- Recording runs only after the underlying operation succeeded; failed authorization, invalid ID, not found, unpublished, Draft, archived or historical content and signed-URL failure record nothing.
- Recording must not block or fail the user's content open or download: it runs after the response is produced (Next.js `after()` or equivalent), with a short timeout and no retry, queue or replay. **Fail open for the user.**
- A recording failure is not counted: the metric is simply missing that event (an undercount, §16). It is logged server-side with the metric name and error code only — no user ID, email, organization, content ID, attachment ID, filename or URL.
- Admin Draft and management surfaces (`/app/contributions/**`, `/app/organizations/**`, `/app/users`) have no recording calls.

### 7.4 Authorization and RLS

- Both tables: RLS enabled, no policies, `revoke all` from `public`, `anon`, `authenticated` and `service_role`. Writes happen only inside `record_usage` (definer); reads only inside `admin_organization_usage` (definer). Manual retention deletion (§7.5) is run by the operator as the database owner, not through an API role.
- Write path: `public.record_usage` — `service_role` execute only (§7.3.2).
- Read path: `public.admin_organization_usage(period_start date, period_end date)`, `SECURITY DEFINER`, empty `search_path`, executable by `authenticated` only, calls `private.require_admin_content_access()` (live Admin role). Returns one row per **currently active** organization (zero usage included), exactly:

  | Field | Purpose |
  |---|---|
  | `organization_id` | Opaque row key for rendering only; not displayed |
  | `organization_name` | **Organización** |
  | `registered_users` | **Usuarios registrados** |
  | `active_users` | **Usuarios activos** |
  | `content_opens` | **Aperturas de contenido** |
  | `downloads` | **Descargas** |

  No totals or summary row, no `is_active` field, no user IDs, no per-person or per-content rows.
- Validation: `period_start ≤ period_end ≤ current UTC date` and `period_end − period_start ≤ 89` (90 days inclusive, §4.2); null or otherwise invalid ⇒ `22023`.
- Admin role revoked ⇒ `42501` on the next request. Contributors receive `42501`.

### 7.5 Retention — ALL VALUES PROVISIONAL; REQUIRES PRIVACY/LEGAL APPROVAL

A **retention target** is the approved maximum age. An **enforceable deletion guarantee** exists only where a mechanism actually deletes data on a bounded schedule. This revision guarantees no automatic deletion.

| Data | Retention target | Enforcement | Status |
|---|---|---|---|
| GA4 event data | 2 months (shortest GA4 setting, to verify) | GA4 property setting, provider-controlled; verify in property admin | PROVISIONAL |
| GA4 aggregated reports | unknown; may outlive event data | provider-controlled; to verify and disclose | PROVISIONAL |
| `_ga` / `_ga_<container>` cookies | 60 days (`cookie_expires`) | browser expiry; deleted by the application on revocation/logout (§6.8) | PROVISIONAL |
| `usage_daily_presence` | 90 days | manual operator-run deletion (below) | PROVISIONAL |
| `usage_daily_counts` | 24 months | manual operator-run deletion (below) | PROVISIONAL |
| Presence rows on account deletion | immediate | `on delete cascade` from `auth.users` | PROVISIONAL |

No purge-on-write is used: it would delete nothing when there is no traffic.

**Minimum operational deletion procedure (required before production activation of org-metrics recording):**

1. **Responsible role:** data custodian for organizational metrics — **TO BE ASSIGNED** by Privacy/Legal (expected: project owner or a designated Admin operator with database-owner access).
2. **Cadence:** at least monthly — **TO BE APPROVED**.
3. **Operation** (run as the database owner via the Supabase SQL editor or `psql`; illustrative documentation, not a migration):

   ```sql
   -- illustrative only; windows per approved values
   begin;
   delete from private.usage_daily_presence
     where activity_date < (now() at time zone 'utc')::date - 90;
   delete from private.usage_daily_counts
     where activity_date < ((now() at time zone 'utc')::date - interval '24 months')::date;
   commit;
   ```

4. **Verification:** read-only counts afterwards, both must be `0`:

   ```sql
   select count(*) from private.usage_daily_presence
     where activity_date < (now() at time zone 'utc')::date - 90;
   select count(*) from private.usage_daily_counts
     where activity_date < ((now() at time zone 'utc')::date - interval '24 months')::date;
   ```

   Record date (UTC), operator, rows deleted and verification result in the operations log — location **TO BE DEFINED**. A second person (verifier — **TO BE ASSIGNED**, not the operator) reviews the log entry each cycle.
5. **Missed run:** the next run deletes everything over the window, so overrun is bounded by the cadence. **Worst-case actual retention = window + cadence + operational delay** (e.g. presence: 90 days + ~31 days + delay). Privacy/Legal must approve that worst case, not only the window.
6. If Privacy/Legal rejects a manually enforced bounded window, an automated mechanism (e.g. a scheduled database job) requires a separate approved decision; this revision adds no scheduler, worker, cron or migration.

**Activation item R1 — enforceable retention: BLOCKED** until Privacy/Legal approves the values, the worst case, the named custodian/verifier and the log location (or approves an automated alternative).

### 7.6 Consent treatment — REQUIRES PRIVACY/LEGAL APPROVAL

Unresolved: whether organizational usage metrics (a) are necessary/legitimate-interest processing disclosed in the Privacy Notice, (b) require opt-in under the existing analytics preference, or (c) require a separate opt-in.

Safe default until Gate P decides:

- `record_usage` and both tables MUST NOT be deployed active; no per-user-linked activity is recorded.
- Registered organizations and registered users (from existing membership data) MAY be shown to Admins, as they are existing operational/admin data.
- If (b) or (c) is chosen, only consenting users are counted, and the dashboard must label metrics as "usuarios que aceptaron" counts.
- Bundling org metrics into the GA4 consent is not recommended: different recipient and purpose.

### 7.7 Admin dashboard

- One Admin page, Spanish copy: **Actividad por organización**, under the existing Admin area (proposed `/app/organizations/actividad`; placement is implementation freedom).
- Period selector: start and end UTC dates, both inclusive whole UTC days; default `[today − 29, today]`; max 90 days (§4.2).
- One row per currently active registered organization, including organizations with zero usage. Exactly five visible columns:

  | Column | Meaning |
  |---|---|
  | **Organización** | organization name |
  | **Usuarios registrados** | current active memberships, Admins included |
  | **Usuarios activos** | distinct Contributors with qualifying activity in the period |
  | **Aperturas de contenido** | successful authorized resolutions of current published content in the period |
  | **Descargas** | successful authorized signed-URL issuances in the period |

- No summary or totals row.
- Footnote: "Fechas en UTC, días completos, inicio y fin incluidos. Datos internos de Base Curricular; no incluyen la actividad de administradores; no comparables con Google Analytics. Las aperturas y descargas no confirman lectura ni descarga completa."
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

Gate P must decide, at minimum. This document makes no legal determination on any item.

1. GA4 processor terms / DPA acceptance and the contracting Google entity;
2. international transfer to the US and safeguards;
3. pilot jurisdictions and applicable legal basis for GA4;
4. cookie/identifier processing: the `_ga*` client and session identifiers and the provisional cookie expiry;
5. GA4 retention setting and disclosure of aggregate-report persistence;
6. legal basis for organizational usage metrics, and whether internal usage collection — including the presence marker alone — requires consent (§7.6);
7. retention values of presence markers and counts, the manual-deletion worst case, custodian, verifier and log location (§7.5, item R1);
8. re-consent: whether PostHog-era consents must be re-collected (recommended: yes; unresolved);
9. Privacy Notice (and Terms, if affected) changes, the new `privacyNoticeVersion`/`consentVersion`, and user-facing communication;
10. disposal of any historical PostHog data and closing the PostHog project;
11. Consent Mode behavior (whether any cookieless/denied-state ping is permitted; default: none, §6.1);
12. the category 2 and 3 GA4 data in §6.12 (request-inherent and provider-derived data), including IP handling and approximate geolocation.

### 10.1 Privacy Notice dependency — hard activation prerequisite

`docs/PRIVACY_NOTICE.md` (version 1.1; version 1.2 as of 2026-10-28 adds a feedback-form section only, `privacyNoticeVersion = "1.2"`, `consentVersion` unchanged at "1.1"; no Gate P item is affected) describes the **PostHog** runtime, which is inert. It is **not** an adequate notice for GA4 or for organizational metrics. This revision does not edit it and publishes no new Notice.

Before GA4 activation, and before any per-user-linked organizational-metrics recording (if approved), all of the following are required:

1. Privacy/Legal approval of an updated Privacy Notice, and of the Terms of Use if affected;
2. a new Notice version and corresponding `privacyNoticeVersion`/`consentVersion` update;
3. user-facing communication of the change;
4. the re-consent decision (§10 item 8). Existing PostHog-era consent **MUST NOT** authorize GA4 unless Privacy/Legal explicitly approves it. Default remains OFF.

**Notice changes required** (statements in the current Notice that would be inaccurate under the new architecture; wording **REQUIRES PRIVACY/LEGAL APPROVAL**, to be applied only with implementation and a version bump):

- §4 "Información opcional sobre el uso del producto": lists filters and external-reference clicks, which GA4 MVP does not measure; does not describe organization-level usage metrics.
- §5: "si las organizaciones están utilizando Base Curricular" is attributed to optional analytics; under D-032 organizational adoption comes from Supabase metrics whose consent treatment is unresolved.
- §7: states that an internal user identifier, an internal organization identifier and internal content identifiers are sent, and that no additional analytics identifier is created in the browser — all false under GA4 (no Base Curricular IDs; GA4 sets `_ga*` cookies). Request-inherent and provider-derived data (§6.12) is not described.
- §12: names PostHog / PostHog Cloud EU as provider.
- §13: states analytics is processed in the EU region; GA4 may involve transfer to the US.
- §14: "12 meses" retention; must reflect the approved GA4 and organizational-metrics values.
- §16: provider list must reflect Google as analytics recipient.
- §18 rights: must cover deletion of presence markers and GA4 data.

Candidate wording recorded for Privacy/Legal (not applied): §12 "Utilizamos **Google Analytics 4**, de Google, como proveedor de la analítica opcional del producto, únicamente si la aceptas."; §13 "La analítica opcional es procesada por Google y puede implicar transferencias a Estados Unidos u otros países."; §7 "Google Analytics utiliza una cookie con un identificador aleatorio en tu navegador. No le enviamos tu identificador de cuenta, tu correo, tu nombre ni tu organización."

`docs/TERMS_OF_USE.md`: it refers to the Privacy Notice for the provider and keeps analytics separate from Terms; whether it needs changes is part of §10 item 9.

---

## 11. Gates

### 11.1 Gate P — Privacy/Legal decisions — PENDING

Passes when every item in §10 (1–12) has a recorded decision in `docs/DECISIONS.md`. Unresolved, visible here:

| # | Decision | State |
|---|---|---|
| P1 | Legal basis for organizational usage metrics | PENDING |
| P2 | Consent requirement for internal usage collection, incl. whether the presence marker alone needs consent | PENDING |
| P3 | GA4 processing arrangements (DPA, contracting Google entity) and international transfers | PENDING |
| P4 | Cookie/identifier processing (`_ga*`) | PENDING |
| P5 | Consent Mode behavior | PENDING |
| P6 | Retention values (all PROVISIONAL) and the manual-deletion worst case (§7.5) | PENDING |
| P7 | Privacy Notice (and Terms) changes and version (§10.1) | PENDING |
| P8 | Re-consent of PostHog-era acceptances | PENDING |
| P9 | Disposal of historical PostHog data | PENDING |
| P10 | GA4 request-inherent and provider-derived data (§6.12) | PENDING |

### 11.2 Gate O — Organizational metrics validation — PENDING

Requires P1, P2, P6. Evidence: local real-stack pgTAP + Vitest + Playwright for AC-O1…AC-O14; Cloud structural verification of RLS, grants (incl. `record_usage` not executable by `authenticated`/`anon`/`PUBLIC`), function hardening; client-bundle scan for the recorder secret; hosted read-only verification of the dashboard with a real Admin and denial for a non-Admin; one recorded dry run of the §7.5 deletion procedure on a non-production database.

### 11.3 Gate G — GA4 controlled validation — PENDING

Requires P3, P4, P5, P6, P7, P8, P10. Protocol:

1. read-only verify property settings in §6.6 (incl. event-data retention) in the GA4 property admin and record evidence;
2. controlled Production test with 1–2 named internal accounts, in a real browser, using DevTools network/storage inspection plus GA4 DebugView/Realtime;
3. for each scenario, capture actual requests and storage and **enumerate every parameter observed** in requests to Google domains, flagging any parameter or event not in §6.4 (including provider-generated ones, §6.12 category 3):
   - **consent OFF** (undecided, rejected): no `gtag.js` request, no request to any Google domain, no `_ga*` cookie, no Google-related local/session storage;
   - **consent ON**: tag loads only after server confirmation; only expected requests;
   - **consent revocation**: requests stop; `_ga*` cookies cleared; `ga-disable-*` set;
   - **logout**: same as revocation;
   - **page navigation** across every §6.5 route: sanitised `page_location`/`page_title`/`page_referrer`;
   - **search interactions**: no search text anywhere — parameters, URLs, `page_location`, title, referrer, headers;
   - **content opens**: only `content_type`; no IDs or titles;
   - **downloads**: no file names, attachment IDs, object names or signed URLs;
   - **browser storage and cookies** after each step;
   - **automatic events**: enhanced measurement off; record any automatic event observed (e.g. `first_visit`, `session_start`, `user_engagement`) as a finding for P10;
   - Preview no-op; blocked GA4 does not break the product;
4. name a stop/rollback owner (unset `NEXT_PUBLIC_GA_MEASUREMENT_ID`, redeploy).

Browser traffic inspection cannot verify provider-side processing, derivation or retention. Gate G is **necessary but not sufficient**: that remainder needs Google documentation and property-settings review plus Privacy/Legal approval (P3, P10). Nothing here is validated yet.

Containment: the Measurement ID is configured in Production only during Gate G; production users other than controlled accounts must be prevented from loading the tag (e.g. server-side allowlist during the window). Instructions alone are insufficient.

### 11.4 External Pilot Analytics Activation Gate — CLOSED

Opens only when all of the following hold for the capability being activated (GA4 and org metrics may be activated independently):

| Item | GA4 | Org metrics | State |
|---|---|---|---|
| Gate P decisions (§11.1) | required | required | PENDING |
| Gate G | required | — | PENDING |
| Gate O | — | required | PENDING |
| §10.1 Privacy Notice dependency (approved Notice, version bump, communication, re-consent decision) | required | required (if per-user-linked recording approved) | PENDING |
| R1 enforceable retention (§7.5) | GA4 property setting verified | manual procedure approved, custodian assigned | **BLOCKED** |
| Recorded activation decision in `docs/DECISIONS.md` | required | required | PENDING |

### 11.5 Former Gate B — SUPERSEDED

The PostHog controlled validation authorized under D-031 was never executed. It is superseded by D-032 and must not be executed.

---

## 12. Acceptance Criteria

### GA4

- **AC-G1 Default OFF.** Undecided, rejected and unreadable preference ⇒ zero requests to Google tag/collect hosts (Playwright network assertion).
- **AC-G2 Separate consent.** Accepting Terms leaves GA4 OFF.
- **AC-G3 Re-consent.** A preference recorded under a PostHog-era `consent_version` is treated as undecided for GA4 (unless Gate P item 8 records a different decision).
- **AC-G4 Server-verified load.** The tag loads only after the server confirms a persisted `accepted` decision for the current consent version.
- **AC-G5 Application taxonomy.** The application's own `gtag` configuration and calls pass only §6.4 event names and parameters; unknown input is rejected before any `gtag` call (unit test of the wrapper). This does not assert what the GA4 library adds on its own (§6.12); that is observed in Gate G.
- **AC-G6 Sanitisation.** For each §6.5 route, `page_location` has no query/fragment/ID and `page_title` is the template (unit + Playwright).
- **AC-G7 No identifiers.** No request contains `uid`, `user_id`, a UUID, email or organization data (Playwright request inspection).
- **AC-G8 Revocation/logout.** After revocation or logout: no further collect requests; `_ga*` cookies absent.
- **AC-G9 Environment.** Preview/Development/Test/unknown env ⇒ no tag (unit + E2E in non-production).
- **AC-G10 Failure isolation.** Blocked Google hosts ⇒ all core journeys pass.
- **AC-G11 Property settings.** §6.6 settings recorded as verified in Gate G evidence.
- **AC-G12 Observed parameters.** Gate G evidence enumerates every parameter and event observed per §11.3 scenario; any parameter or event not in §6.4 is listed as a finding for P10 rather than silently accepted.

### Organizational metrics

- **AC-O1 No direct write.** An `authenticated` or `anon` client calling `record_usage` receives a permission error (`42501`); direct `select`/`insert`/`update`/`delete` on either table by `anon`, `authenticated` or `service_role` API access is refused (`42501`).
- **AC-O2 Server-derived org.** `record_usage` has no organization parameter; for a user whose membership is in org A, a recorded event lands under org A only. No route, form or header value can change it (Vitest: the recorder takes the user ID only from `getAccess()`).
- **AC-O3 Eligibility.** A `target_user_id` with no eligible membership (inactive membership/organization, domain mismatch, unconfirmed/banned/deleted user) records nothing.
- **AC-O4 Admin exclusion.** A user whose live role is `Admin` records nothing for presence, content open or download; the same user after demotion to `Contributor` records from the next action; Admins are counted in Registered users.
- **AC-O5 Content open.** A successful resolution of current published content by a Contributor increments `content_open` by one; failed authorization, invalid ID, not found, unpublished, Draft, archived or historical content records nothing; Admin Draft and management pages record nothing.
- **AC-O6 Download.** Only a successful signed-URL issuance increments `download`; 401/403/404/503 paths and `createSignedUrl` failure record nothing.
- **AC-O7 Fail open.** A forced recorder failure leaves the content page / download redirect unchanged for the user, increments nothing, and logs no user, organization, content or attachment identifier.
- **AC-O8 Presence.** Multiple qualifying actions on one UTC day ⇒ one presence row; no table contains a content/attachment identifier (schema assertion).
- **AC-O9 Admin read.** Admin gets exactly one row per currently active organization (zero-usage orgs included) with exactly the six §7.4 fields; inactive organizations are absent; no summary row; Contributor and revoked Admin get `42501`.
- **AC-O10 Definitions.** Registered users = active memberships incl. Admins; active users = distinct Contributor presence in range; inclusive start and end UTC days (pgTAP fixtures across two orgs and `23:59`/`00:00` UTC boundaries).
- **AC-O11 Period validation.** Inverted, future, null or > 90-day ranges ⇒ `22023`; exactly 90 days inclusive accepted.
- **AC-O12 Recorder secret isolation.** The client bundle contains neither the recorder secret variable name nor an `sb_secret_` value; the recorder module has `server-only` and only the §7.3.2 callers.
- **AC-O13 Not activated before Gate P.** No `record_usage` caller is active in Production before P1, P2 and P6 are decided and R1 is unblocked.
- **AC-O14 Dashboard.** Spanish labels and five columns per §7.7; period convention per §4.2; no per-person data; footnote; non-Admin denied server-side.

### Common

- **AC-C1 No search text** in GA4 requests or metrics tables.
- **AC-C2 No unpublished-content leak** via GA4 parameters, metric validation or dashboard.
- **AC-C3 Documentation.** Privacy Notice, data inventory and decisions match the implemented behavior before activation.

---

## 13. Testing Strategy

- **pgTAP:** tables' RLS/grants; `record_usage` grants (`service_role` only), eligibility, org derivation and Admin exclusion; `admin_organization_usage` authorization, fields, definitions, period validation. The §7.5 deletion SQL is exercised once against a fixture (documentation check; not a migration).
- **Vitest:** GA4 wrapper (env gating, consent-version gating, allowlist, sanitiser for every §6.5 route, revocation cookie clearing); recorder module (user ID only from `getAccess()`, fail-open, PII-free logging); content pages and attachment route record only on success; dashboard page server authorization.
- **Playwright:** non-production network assertions (no Google hosts in any state); privacy UX journeys (re-consent for legacy acceptances); dashboard as Admin vs Contributor.
- **Build guard:** replace `scripts/check-analytics-client-build.mjs` with an equivalent check for the GA4 Measurement ID inlining, absence of PostHog symbols, and absence of the recorder secret.
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

One migration: two `private` tables (§7.2), the eligibility predicate for `record_usage` (§7.3.2), `public.record_usage` (`service_role` only), `public.admin_organization_usage`, grants/RLS. No change to existing tables. Configuration (not done by this revision): one server-only recorder secret in Vercel Production and `.env.example` placeholder.

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
- Content opens are not deduplicated; reloads, revisits and server re-renders (`router.refresh()`) of a content page count again (§4.2). A user can raise counts only by actually repeating the authorized operation, never by calling the write path (§7.3).
- Content opens do not prove reading; downloads count authorized signed-URL issuance, not a started or completed transfer.
- Recording failures are undercounts, not errors shown to users (§7.3.3).
- Admin activity is excluded (§4.2): organizations whose only active members are Admins show zero usage; genuine Admin reading is not counted.
- Small organizations: an Admin seeing "1 active user" may infer who it is. Admins already manage memberships; no per-person data is shown.
- Retention is manually enforced; actual worst-case retention = window + cadence + delay (§7.5). A compromised server or leaked recorder secret can forge counts (§7.3.2).
- Organization attribution follows the user's organization at the time of action; reassignment does not move history.

---

## 17. Open Questions

1. §7.6 consent treatment and legal basis for organizational metrics — **REQUIRES PRIVACY/LEGAL APPROVAL** (P1, P2).
2. §7.5 retention values, worst case, custodian, verifier, log location — **REQUIRES PRIVACY/LEGAL APPROVAL** (P6).
3. GA4 DPA, transfer, jurisdictions, legal basis, cookie identifier, Consent Mode, provider-derived data — **REQUIRES PRIVACY/LEGAL APPROVAL** (P3–P5, P10).
4. ~~Per-content popularity in the MVP~~ — **CLOSED (Product, 2026-10-21):** not in the MVP (§3 item 9).
5. ~~Exclusion of Admin activity~~ — **CLOSED (Product, 2026-10-21):** excluded by live role (§4.2).
6. Disposal of the PostHog project and any data in it. **PRIVACY/LEGAL + PRODUCT** (P9).
7. Re-consent of PostHog-era acceptances (P8) and Privacy Notice update (P7, §10.1).

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

- Revised contract documented (D-032, amended by review remediation); not implemented. Nothing in it is validated.
- Gate P, Gate O, Gate G: PENDING. Activation item R1 (enforceable retention): BLOCKED.
- External Pilot Analytics Activation Gate: CLOSED.
- Former PostHog Gate B: SUPERSEDED, not executed.
- `main` runtime: superseded PostHog transport present and inert; `NEXT_PUBLIC_POSTHOG_KEY` unset.

No production analytics or organizational-metrics activation is authorized by this revision. SPEC-008 remains active and MUST NOT move to `completed/` until the applicable gates pass and independent verification against §12 is complete.
