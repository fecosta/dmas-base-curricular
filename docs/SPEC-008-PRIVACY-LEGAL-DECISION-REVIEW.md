# SPEC-008 Privacy and Legal Decision Review Preparation

**Status:** DECISION PREPARATION — NOT AN APPROVAL RECORD

**Prepared for:** Product and Privacy/Legal stakeholders

**Baseline:** `main` @ `523200c63a2a2f3d733d8c8fcd018589b7b25acd`

**Last updated:** 2026-10-21

## How to use this document

This document collects the product, technical, and legal questions that must be answered before the SPEC-008 analytics pilot can be activated. It is a preparation aid, not an approval record. Nothing in this document opens any gate or authorizes implementation, code changes, or data collection. Activation requires recorded decisions in `docs/DECISIONS.md`, completion of the validation gates described in SPEC-008 §11, and an explicit recorded activation decision.

## Legend

| Label | Meaning |
|---|---|
| **Approved product decision** | Decided by the Product Owner and recorded in `docs/DECISIONS.md`. |
| **Existing runtime behavior** | What is currently true on the `main` branch / deployed application. |
| **Proposed decision awaiting approval** | A recommendation for stakeholders to confirm, change, or reject. |
| **Legal question requiring professional assessment** | Requires Privacy/Legal input; no legal position is taken here. |
| **Technical validation still required** | Must be verified through inspection, testing, or provider review. |

---

## A. Executive summary

**What Base Curricular is.** D+ Base Curricular is a private, network-only, shared structured curriculum-content library for approved Democracia+ network organizations. It is a library for discovering and reusing structured curricular knowledge, not a Learning Management System (LMS). Governed content is managed by authorized Admins; eligible non-Admin users consume current published content.

**Why analytics is needed.** The pilot measurement model is designed to answer two product questions (SPEC-008 §1):

1. **Navigation** — how do people navigate and interact with Base Curricular?
2. **Adoption** — which organizations use the platform, and how frequently?

The answers are meant to improve the product, not to evaluate individual performance, rank users or organizations, or support advertising.

**Why the architecture changed.** The previous SPEC-008 design used PostHog Cloud EU as the analytics provider and would have sent the user's Supabase UUID and organization identifier to a third party. The Product Owner approved a revised architecture (D-032, 2026-10-21) that:

- uses **Google Analytics 4 (GA4)** only for optional, consent-gated, default-OFF, Production-only navigation trends; and
- uses the **existing Supabase platform** for organization-level adoption metrics, recorded server-side from the existing organization/membership model.

This split means GA4 receives no Base Curricular user, organization, search, or content identifiers, while organization analysis stays inside Supabase. The superseded PostHog design is preserved only as a historical record (SPEC-008 §18); the PostHog transport remains inert on `main`.

**Key trade-off.** The new design avoids sending internal identifiers to a third-party analytics provider, but it introduces a persistent first-party `_ga` browser identifier set by GA4 and raises US/international-transfer questions that the PostHog EU design addressed differently.

**What GA4 measures.** For users who explicitly opt in, in Production only, GA4 receives manual events with sanitized route templates: `page_view`, `search_performed` (only whether results were returned), `content_opened` (only content type), and `content_downloaded` (only content type). It does not receive names, emails, Supabase UUIDs, organization identifiers, search text, content titles, or attachment identifiers.

**What Supabase measures.** Server-side adoption metrics for Admins only: registered users, active users in a period, content opens, and downloads, aggregated per organization. The only per-user element is a single daily "presence marker" that records a user was active on a given UTC day for a given organization — not what they opened, searched, or downloaded.

**What Admins see.** A minimal dashboard with exactly five columns: Organization, Registered users, Active users, Content opens, Downloads. One row per active organization. No per-person rows, no per-content rows, no rankings.

**Why Privacy/Legal approval is necessary.** Several items remain unresolved and require professional assessment before activation:

- GA4 involves Google as a processor, potential international transfers, cookie/identifier processing, and provider-derived data outside Base Curricular's direct control.
- The Supabase presence marker is personal data; its legal basis and whether it requires consent are unresolved.
- All retention values are provisional; enforceable deletion relies on a manual operator-run procedure whose worst-case exposure must be approved.
- The current Privacy Notice (v1.1) describes the inert PostHog runtime and is not adequate for GA4 or the new organizational metrics.

Until these items are decided and recorded, no production analytics or organizational-metrics recording may be activated.

---

## B. Data collection overview

The table below summarizes the data categories relevant to the SPEC-008 pilot. It uses the authoritative inventory in `docs/PRIVACY_AND_DATA_COLLECTION.md` §5A and §5B and SPEC-008 §5–§7.

| Data category | Purpose | Collection mechanism | Processing system | Personal data involved? | User can opt out? | Proposed retention | Responsible decision owner |
|---|---|---|---|---|---|---|---|
| 1. Authentication & membership information | Authenticate, authorize, and administer access | Existing Supabase Auth, organization, domain, and membership records | Supabase Auth / PostgreSQL | Yes (email, user UUID, role, membership) | No — necessary for service | Per existing operational/security obligations | Product / Operations |
| 2. Necessary operational information | Sessions, security, audit, private file access, preference record | Existing server-side processing and logging; analytics preference row stored on user acceptance/rejection | Supabase / Vercel | Yes (session, audit, access events; preference row linked to user) | No — not consent-based; legal basis to be confirmed | Per existing operational/security obligations | Product / Privacy/Legal |
| 3. GA4 navigation events (application-controlled) | Aggregate navigation trends: page views, search usage, content opens, downloads | Manual events sent from browser after server-verified persisted consent | Google Analytics 4 | No direct personal identifiers sent by Base Curricular; GA4 client ID is pseudonymous | Yes — opt-in, default OFF | Event data: 2 months (PROVISIONAL, to verify); `_ga*` cookies: 60 days (PROVISIONAL) | Privacy/Legal / Product |
| 4. GA4 browser/provider processing | Request-inherent and provider-derived data required for the tag to function (IP, user agent, approximate geolocation, automatic events, etc.) | Sent automatically by the browser / generated by GA4 when the tag loads | Google Analytics 4 | Yes — pseudonymous/technical data | Yes — by not opting in to GA4 | Provider-controlled; must be verified and disclosed | Privacy/Legal / Engineering |
| 5. Organizational usage counters (`usage_daily_counts`) | Count daily content opens and downloads per organization | Server-side increment after successful authorized operation | Supabase (`private` schema) | No user identifier; organization-level aggregate | Depends on P1/P2 outcome | 24 months (PROVISIONAL, manual deletion) | Privacy/Legal / Product |
| 6. Daily user presence markers (`usage_daily_presence`) | Count distinct active users per organization over a period | Server-side insert of one row per user per organization per UTC day | Supabase (`private` schema) | Yes — pseudonymous (user UUID, organization, date only) | Depends on P1/P2 outcome | 90 days (PROVISIONAL, manual deletion); immediate on account deletion | Privacy/Legal / Product |
| 7. Historical PostHog information | Legacy analytics data and consent records from the superseded PostHog design | Historical events may exist in the PostHog Cloud EU project; consent records exist in `analytics_preferences` | PostHog Cloud EU (historical) / Supabase (consent records) | Yes, if any historical events or person records exist | Current runtime is inert; disposal requires Legal decision | Requires verification and Legal decision | Privacy/Legal / Product |

**What is NOT collected**

The following are intentionally excluded from the SPEC-008 MVP design:

- Raw search text or any property derived from it.
- Content identifiers, attachment identifiers, or private document names sent to GA4.
- Names, emails, Supabase UUIDs, organization names/domains/IDs, or roles sent to GA4.
- Per-content popularity, organization-by-content reporting, or individual browsing histories.
- Filter values, external reference URLs, page titles, or query strings sent to GA4.
- Advertising identifiers, audience building, or individual performance data.
- Session Replay, heatmaps, autocapture, or funnel tracking per person.

---

## C. Decisions required

This section lists the decisions defined in SPEC-008 §11.1 (P1–P10) and §7.5/§11.4 (R1). Each recommendation is the simplest privacy-preserving option consistent with the approved MVP and the safe defaults already in SPEC-008. **No recommendation here is approved.**

### Mapping SPEC-008 §10 legal-readiness items to P1–P10 / R1

SPEC-008 §10 contains 12 legal-readiness items. Gate P passes only when every item has a recorded decision in `docs/DECISIONS.md`. The mapping below shows where each item is addressed in this review.

| SPEC-008 §10 item | Topic | Covered by | Gap note |
|---|---|---|---|
| 1 | GA4 processor terms / DPA acceptance and contracting Google entity | P3 | — |
| 2 | International transfer to the US and safeguards | P3 | — |
| 3 | Pilot jurisdictions and applicable legal basis for GA4 | P3 (as an explicit sub-question) | No dedicated P-ID; requires verification |
| 4 | Cookie/identifier processing (`_ga*`) | P4 | — |
| 5 | GA4 retention setting and aggregate-report persistence disclosure | P6 | No dedicated P-ID; covered under retention values |
| 6 | Legal basis for org metrics; consent for internal usage collection incl. presence marker | P1, P2 | — |
| 7 | Retention values, worst case, custodian, verifier, log location | P6, R1 | R1 captures the enforceable-deletion blocker |
| 8 | Re-consent of PostHog-era acceptances | P8 | — |
| 9 | Privacy Notice (and Terms) changes and version | P7 | — |
| 10 | Disposal of historical PostHog data and closing the PostHog project | P9 | — |
| 11 | Consent Mode behavior | P5 | — |
| 12 | Category 2 and 3 GA4 data (request-inherent and provider-derived) | P10 | — |

---

### P1 — Legal basis for organizational usage metrics

| Field | Content |
|---|---|
| **Decision ID** | P1 |
| **Question** | What is the legal basis for recording and showing organization-level usage metrics to Base Curricular Admins? |
| **Context** | The metrics are derived from existing membership/organization data, but the presence marker is linked to a user UUID. The dashboard shows aggregate counts, not individual histories. This is not assumed exempt from privacy requirements (SPEC-008 §7.6). |
| **Recommended option** | **Proposed — not approved:** Privacy/Legal selects and documents a legal basis before activation. The safest product default is to treat the presence marker as personal data, disclose it in the updated Privacy Notice, and keep per-user-linked recording OFF until Privacy/Legal approves a basis. |
| **Alternative** | Privacy/Legal determines that org metrics are necessary/legitimate-interest operational data disclosed in the Notice, with no separate consent required. This would allow broader recording but requires a recorded Legal decision. |
| **Trade-offs** | Treating the marker as personal data and consent-based reduces legal risk and aligns with the product's opt-in analytics model, but it means active-user counts reflect only consenting users and must be labelled. A legitimate-interest path may simplify operations but needs a defensible legal basis and transparency. |
| **Owner** | Privacy/Legal (with Product input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate O, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §5 item 3; §7.6; §10 item 6; §11.1 P1 |

---

### P2 — Consent requirement for internal usage collection

| Field | Content |
|---|---|
| **Decision ID** | P2 |
| **Question** | Does the collection of internal usage information — including the daily presence marker alone — require user consent? |
| **Context** | The presence marker records only user ID + organization + UTC day. It is the minimum data needed to count distinct active users over a multi-day period. It is personal data (pseudonymous). SPEC-008 §7.6 lists four possible treatments: (a) necessary/legitimate interest disclosed, (b) opt-in under existing analytics preference, (c) separate opt-in, or (d) fallback to a weaker aggregate metric with no user ID. |
| **Recommended option** | **Proposed — not approved:** Treat the presence marker as personal data and require a documented Legal decision before recording it. Until decided, keep per-user-linked recording OFF. If consent is chosen, prefer option (b) or (c) with a clear dashboard label such as "usuarios que aceptaron." Bundling org metrics into GA4 consent is not recommended because the recipient and purpose differ (SPEC-008 §7.6). |
| **Alternative** | Privacy/Legal decides that the presence marker is not consent-requiring (e.g., necessary or legitimate interest with adequate transparency). This would allow recording for all eligible Contributors but must be recorded in `docs/DECISIONS.md`. |
| **Trade-offs** | Requiring consent minimizes legal risk but means metrics are partial and must be labelled. A non-consent path may give more complete adoption data but needs a solid legal basis and clear Notice disclosure. |
| **Owner** | Privacy/Legal (with Product input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate O, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §5 item 3; §7.6; §10 item 6; §11.1 P2 |

---

### P3 — GA4 processing arrangements and international transfers

| Field | Content |
|---|---|
| **Decision ID** | P3 |
| **Question** | Are the GA4 processor terms, Data Processing Agreement (DPA), contracting Google entity, and international-transfer safeguards acceptable for Base Curricular? |
| **Context** | GA4 is a third-party processor. Processing may involve transfer to the United States. `docs/PRIVACY_AND_DATA_COLLECTION.md` §8 and §32 mark the DPA, contractual clauses, and transfer safeguards as "[information to complete]." The applicable contracting Google entity and transfer mechanism must be confirmed before activation. |
| **Recommended option** | **Proposed — not approved:** Privacy/Legal confirms acceptance of the applicable Google DPA/terms and the contracting Google entity, and documents the transfer safeguards, before Gate G. Gate G cannot validate Google-side contracts; it only observes browser traffic. This must be a recorded Legal decision. |
| **Alternative** | Do not activate GA4 and rely on Supabase organizational metrics only. This would change the approved product architecture and would itself require a new Product decision. |
| **Trade-offs** | Confirming a DPA and transfer mechanism enables GA4 navigation analytics. Deferring GA4 avoids third-party transfer risk but removes the navigation-trend capability approved in D-032. |
| **Owner** | Privacy/Legal (with Product input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate G, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §5 item 1; §6.1; §6.12; §10 items 1–3; §11.1 P3 |

**Sub-question — pilot jurisdictions and applicable legal basis for GA4:** SPEC-008 §10 item 3 has no dedicated P-ID. Privacy/Legal should confirm the pilot jurisdictions and the applicable legal basis for GA4 processing in each. This is covered here under P3 but is a separate recorded decision.

---

### P4 — Cookie and identifier processing (`_ga*`)

| Field | Content |
|---|---|
| **Decision ID** | P4 |
| **Question** | How should Base Curricular treat the `_ga` and `_ga_<container>` cookies and other GA4 identifiers? |
| **Context** | GA4 sets first-party cookies holding a random client ID and session identifiers. The provisional expiry is 60 days. The application deletes these cookies on revocation/logout. This is a persistent browser identifier that the superseded PostHog design avoided. |
| **Recommended option** | **Proposed — not approved:** Process the `_ga*` identifiers only under explicit GA4 consent, with a 60-day provisional expiry. Disclose the identifier, its purpose, and its duration in the updated Privacy Notice. Consider whether a shorter expiry materially reduces risk without harming measurement utility. |
| **Alternative** | Use a shorter cookie expiry (e.g., 30 days) if Privacy/Legal prefers. This would require updating the provisional value and re-evaluating dashboard usability. |
| **Trade-offs** | A longer expiry improves trend continuity but increases identifier persistence. A shorter expiry reduces persistence but may fragment user counts and requires retesting. |
| **Owner** | Privacy/Legal (with Product / Engineering input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate G, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §6.3; §6.8; §6.12; §10 item 4; §11.1 P4 |

---

### P5 — Consent Mode behavior

| Field | Content |
|---|---|
| **Decision ID** | P5 |
| **Question** | Should Base Curricular use Google Consent Mode, and if so, in what configuration? |
| **Context** | SPEC-008 §6.1 establishes the default: the GA4 tag is simply not loaded without consent, and no Consent Mode "default denied" pings or cookieless pings are sent. Using Consent Mode pings without consent requires explicit Privacy/Legal approval. |
| **Recommended option** | **Proposed — not approved:** Maintain the SPEC-008 default — no Consent Mode pings, no tag load without consent. This is the simplest privacy-preserving option and matches the existing fail-closed design. |
| **Alternative** | Implement Consent Mode with "denied" default and cookieless pings. This would require explicit Privacy/Legal approval and additional disclosure in the Notice. SPEC-008 does not recommend this by default. |
| **Trade-offs** | The no-ping default avoids any data transmission before consent but may provide less measurement modeling. Consent Mode pings may improve measurement but require legal justification and user disclosure. |
| **Owner** | Privacy/Legal (with Product / Engineering input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate G, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §6.1; §10 item 11; §11.1 P5 |

---

### P6 — Retention values and manual-deletion worst case

| Field | Content |
|---|---|
| **Decision ID** | P6 |
| **Question** | What retention windows and operational worst-case exposure are acceptable for GA4 event data, `_ga*` cookies, presence markers, and aggregate counts? |
| **Context** | All values are provisional. No automatic deletion is guaranteed for organizational metrics; deletion is a manual operator-run procedure. The worst-case actual retention equals the approved window plus the deletion cadence plus operational delay (SPEC-008 §7.5). Privacy/Legal must approve the values and the worst case, not only the target window. |
| **Recommended option** | **Proposed — not approved:** Privacy/Legal approves or changes each provisional value and approves the worst-case exposure. Proposed provisional values (all from SPEC-008 §7.5): GA4 event data 2 months; `_ga*` cookies 60 days; `usage_daily_presence` 90 days; `usage_daily_counts` 24 months. The deletion cadence is proposed as at least monthly; custodian, verifier, and operations log location must be assigned and approved before activation. |
| **Alternative** | Shorter retention windows (e.g., 30 days for presence markers) or an automated scheduled job. Automated deletion would require a separate approved decision and would add infrastructure that SPEC-008 currently excludes. |
| **Trade-offs** | Shorter windows reduce exposure but may limit trend analysis. Manual deletion is operationally simple but depends on people and process; automated deletion is more reliable but adds complexity and must be built and secured. |
| **Owner** | Privacy/Legal (with Product / Engineering input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate O, Gate G, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §6.9; §7.5; §10 items 5, 7; §11.1 P6 |

**Sub-question — GA4 retention setting and aggregate-report persistence:** SPEC-008 §10 item 5 has no dedicated P-ID. Privacy/Legal should verify the shortest available GA4 event-data retention setting in the property admin, confirm how long aggregated reports may persist, and approve the user-facing disclosure. This is covered here under P6.

---

### P7 — Privacy Notice and Terms changes

| Field | Content |
|---|---|
| **Decision ID** | P7 |
| **Question** | What changes to the Privacy Notice and Terms of Use are required, what should the new version be, and how should users be informed? |
| **Context** | `docs/PRIVACY_NOTICE.md` v1.1 describes the inert PostHog runtime and is not adequate for GA4 or organizational metrics. SPEC-008 §10.1 lists sections that become inaccurate under the new architecture: §4, §5, §7, §12, §13, §14, §16, and §18. Candidate wording exists in SPEC-008 §10.1 but is not approved. `docs/TERMS_OF_USE.md` §14–15 refer to the Privacy Notice and keep analytics separate; whether changes are needed is for Privacy/Legal. |
| **Recommended option** | **Proposed — not approved:** Privacy/Legal approves updated Notice text (and Terms if affected), a new `privacyNoticeVersion`/`consentVersion`, and a user-communication plan. Implementation applies the update with a version bump and re-consent handling (P8). Candidate wording in SPEC-008 §10.1 may be used as a starting point but must be reviewed by Legal. |
| **Alternative** | Delay GA4 and org-metrics activation until the Notice and Terms are finalized. This is the default if P7 is not approved. |
| **Trade-offs** | Updating the Notice is a hard prerequisite for activation; without it, users cannot make an informed choice. The trade-off is timing and review effort, not whether to disclose. |
| **Owner** | Privacy/Legal (with Product input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §6.1; §10 item 9; §10.1; §11.1 P7 |

---

### P8 — Re-consent of PostHog-era acceptances

| Field | Content |
|---|---|
| **Decision ID** | P8 |
| **Question** | Must users who accepted analytics under the PostHog-era consent version be asked again before GA4 or per-user-linked organizational metrics are activated? |
| **Context** | The change from PostHog to GA4 is a material change under `docs/PRIVACY_UX_CONTRACT.md` §20: the provider, recipient, and processing model changed. Existing PostHog-era acceptances must not be treated as GA4 consent unless Privacy/Legal decides otherwise. The current `consentVersion`/`privacyNoticeVersion` is "1.1". |
| **Recommended option** | **Proposed — not approved:** Re-collect consent. Treat PostHog-era acceptances as `undecided` for GA4. Bump `consentVersion`/`privacyNoticeVersion` so the application prompts users again. This is the safest option and aligns with the material-change principle. |
| **Alternative** | Privacy/Legal records a decision that prior acceptances remain valid. This would avoid a re-consent campaign but requires an explicit recorded Legal decision and clear reasoning. |
| **Trade-offs** | Re-consent maximizes transparency and reduces legal risk but requires UX copy updates and user communication. Treating prior acceptances as valid reduces friction but may not reflect the material provider change. |
| **Owner** | Privacy/Legal (with Product / UX input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate G, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §6.1; §6.8; §10 item 8; §10.1; §11.1 P8 |

---

### P9 — Disposal of historical PostHog data

| Field | Content |
|---|---|
| **Decision ID** | P9 |
| **Question** | Should any historical PostHog data or project be retained, and if not, how should it be disposed of? |
| **Context** | The PostHog design is superseded; the transport on `main` is inert. Whether any actual event/person data exists in PostHog Cloud EU project `289698` is not established by repository evidence and must be verified by an authorized person. The `analytics_preferences` table contains PostHog-era consent records, not PostHog event data; its retention/disposal also requires a Legal decision. |
| **Recommended option** | **Proposed — not approved:** First verify whether any PostHog event/person data exists. If it exists, dispose of it promptly per Legal guidance and close or decommission the PostHog project. If retention for a limited period is legally required, define the period and disposal date. For `analytics_preferences` rows, decide whether to retain the consent history, anonymize it, or delete it after a defined period. |
| **Alternative** | Retain historical PostHog data for a defined, approved period (e.g., for audit or comparison) and then delete. This requires a recorded retention justification and end date. |
| **Trade-offs** | Prompt disposal reduces data exposure and operational overhead. Retention preserves historical evidence but extends third-party data presence and requires continued oversight. |
| **Owner** | Privacy/Legal (with Product input) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §10 item 10; §11.1 P9; §14.5 |

---

### P10 — GA4 request-inherent and provider-derived data

| Field | Content |
|---|---|
| **Decision ID** | P10 |
| **Question** | Which request-inherent and provider-derived data items sent or generated by GA4 are acceptable, and how should they be disclosed? |
| **Context** | SPEC-008 §6.12 splits GA4 data into three categories: application-controlled, request-inherent (e.g., IP address), and potential provider/browser processing (e.g., user agent, approximate geolocation, automatic events like `first_visit`, `session_start`, `user_engagement`, aggregated reports). Base Curricular does not control categories 2 and 3. Gate G can observe browser traffic but cannot verify Google-side processing. |
| **Recommended option** | **Proposed — not approved:** Privacy/Legal reviews and approves each category 2 and 3 item item-by-item, based on the SPEC-008 §6.12 inventory, Gate G observations, and current Google documentation. IP handling and approximate geolocation should be explicitly decided. The approved list and any residual risks must be disclosed in the Privacy Notice. |
| **Alternative** | Do not activate GA4. This avoids all category 2 and 3 processing but removes navigation analytics. |
| **Trade-offs** | Approving provider-derived data enables navigation analytics with full transparency. Rejecting GA4 eliminates transfer and provider-derived risks but loses the approved navigation-trend capability. |
| **Owner** | Privacy/Legal (with Engineering input for Gate G observation) |
| **Decision status** | PENDING |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate G, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §6.6; §6.12; §10 item 12; §11.1 P10; §11.3 Gate G protocol |

---

### R1 — Enforceable retention for organizational metrics

| Field | Content |
|---|---|
| **Decision ID** | R1 |
| **Question** | Can Base Curricular enforce the approved retention limits for organizational metrics? |
| **Context** | SPEC-008 §7.5 guarantees no automatic deletion. Retention relies on a manual operator-run deletion procedure. For activation, Privacy/Legal must approve not only the target windows but also the worst-case exposure, the named data custodian, the cadence, the verifier, and the operations log location. |
| **Recommended option** | **Proposed — not approved:** Privacy/Legal approves the provisional values, the worst-case exposure (window + cadence + delay), and the manual procedure, including named custodian, at-least-monthly cadence, verifier, and log location. Only then is R1 unblocked. |
| **Alternative** | Privacy/Legal rejects manual enforcement and approves an automated deletion mechanism. This would require a separate approved decision to build and operate a scheduler or equivalent infrastructure, which SPEC-008 currently excludes. |
| **Trade-offs** | Manual deletion is simple to implement but depends on operational discipline. Automated deletion is more reliable but requires engineering work and ongoing maintenance. Without either, enforceable retention cannot be guaranteed and activation remains blocked. |
| **Owner** | Privacy/Legal (with Product / Engineering input) |
| **Decision status** | BLOCKED |
| **Approval record** | Approved option: ____________________  Approver: ____________________  Date: ____________________  Conditions or restrictions: ____________________ |
| **Gate(s) affected** | Gate P, Gate O, External Pilot Analytics Activation Gate |
| **SPEC-008 reference** | §7.5; §10 item 7; §11.4 |

**What unblocks R1:** Privacy/Legal approves the retention values, the worst-case exposure, the named custodian, the deletion cadence, the verifier, and the log location — or approves an automated alternative.

---

## D. Recommended MVP privacy model

The table below consolidates the privacy posture recommended for the MVP. It distinguishes what is already approved from what is proposed.

| Recommendation | Status | Requires Legal approval? | P / R ID |
|---|---|---|---|
| GA4 is optional, consent-gated, default OFF, Production-only | Approved (D-032) | No | D-032 |
| GA4 receives no Base Curricular personal/org identifiers | Approved (D-032) | No | D-032 |
| No advertising, no individual performance monitoring, no organization ranking | Approved (D-032 / PRIVACY_AND_DATA_COLLECTION.md §4) | No | D-032 |
| Search text never reaches analytics or metrics tables | Approved (D-032) | No | D-032 |
| Per-content popularity is not in the MVP | Approved (D-032) | No | D-032 |
| Admin activity excluded from adoption metrics | Approved (D-032) | No | D-032 |
| Org metrics recorded server-side only, no client-executable write path | Approved (D-032) | No | D-032 |
| Dashboard shows only five columns, one row per organization, no per-person data | Approved (D-032) | No | D-032 |
| Legal basis for organizational usage metrics | Proposed | Yes — choose and document basis | P1 |
| Treat presence marker as personal data; keep recording OFF until decided | Proposed | Yes — confirm or reject this treatment | P2 |
| Confirm GA4 DPA, contracting Google entity, and transfer safeguards before Gate G | Proposed | Yes — all of P3 | P3 |
| Process `_ga*` cookies only under GA4 consent, 60 days provisional | Proposed | Yes — approve or change expiry | P4 |
| No Consent Mode pings without explicit approval; default = no tag load without consent | Proposed | Yes — approve if changed | P5 |
| Approve provisional retention values and worst-case manual-deletion exposure | Proposed | Yes — all of P6 / R1 | P6 / R1 |
| Update Privacy Notice and Terms if affected, bump version, communicate to users | Proposed | Yes — approve wording and version | P7 |
| Re-collect consent from PostHog-era acceptances for GA4 | Proposed | Yes — confirm or override | P8 |
| Verify and dispose of historical PostHog data per Legal guidance | Proposed | Yes — decide retention/disposal | P9 |
| Approve GA4 request-inherent and provider-derived data item-by-item after Gate G | Proposed | Yes — item-by-item review | P10 |
| Assign custodian, verifier, cadence, and log location for manual deletion | Proposed | Yes — unblocks R1 | R1 |

**Material privacy risks to acknowledge**

- **Persistent `_ga` identifier.** GA4 sets a first-party cookie that persists up to the approved expiry and can link activity within the GA4 property. This is different from the superseded PostHog design.
- **Presence marker is pseudonymous personal data.** The `usage_daily_presence` table links a user UUID to an organization and a day. Its legal basis and consent treatment are unresolved.
- **Small-org inference.** In a small organization, an Admin seeing "1 active user" may be able to infer who it is. Admins already manage memberships, and no per-person data is shown, but the risk remains.
- **Manual retention reliance.** Without an automated mechanism, actual retention depends on people following a recurring manual procedure. Worst-case exposure equals the window plus the cadence plus any operational delay.
- **US transfer and provider-derived data.** GA4 processing may involve international transfer and collection of request-inherent/provider-derived data that Base Curricular does not directly control.
- **Compromised recorder key.** A leaked server-side recorder secret could forge counts; this is a security residual accepted for the MVP and comparable to the existing Auth Admin secret trust class.

---

## E. Consent and user experience

**Overview.** The privacy-choice model remains the one defined in `docs/PRIVACY_UX_CONTRACT.md`: analytics is OFF by default; users must make an affirmative choice; rejection preserves full product access; preferences persist and can be changed later.

**GA4 consent vs. organizational-metrics consent.** These are separate:

| Aspect | GA4 navigation analytics | Supabase organizational usage metrics |
|---|---|---|
| Default state | OFF | OFF (per-user-linked recording not active until Gate P decides) |
| User choice | Explicit opt-in | Depends on P1/P2 outcome |
| If user opts in | GA4 tag loads in Production; manual events sent | Presence markers and counts recorded server-side |
| If user rejects or is undecided | No GA4 tag, no Google requests | No per-user-linked recording (safe default) |
| Revocation | Stops future collection; clears `_ga*` cookies; cannot retract data already sent | Stops future per-user-linked recording; cannot delete historical markers automatically |

**First access flow.** After authentication and eligibility resolution, the application loads the persisted analytics preference.

| Preference state | Behavior |
|---|---|
| No recorded decision (`undecided`) | Analytics OFF; first-choice prompt shown; user can accept, reject, or open Data Preferences |
| Previously rejected | Analytics OFF; no prompt; user can change preference in **Preferencias de datos** |
| Previously accepted (current consent version) | Analytics ON in Production; user can change preference |
| PostHog-era acceptance (older `consent_version`) | Treated as `undecided` for GA4 unless P8 records a different decision |

**What each action does.**

| User action | Result |
|---|---|
| **Aceptar** | Persist acceptance, record consent/Notice version, enable future GA4 events only |
| **Rechazar analítica** | Persist rejection, record version, keep analytics OFF, preserve full product access |
| **Configurar** | Open **Preferencias de datos** without enabling analytics |
| Open **Aviso de Privacidad** | Show notice; does not change preference |
| Change preference later | ON → OFF stops future collection and clears identity; OFF → ON enables only future events |
| Sign out | Clears analytics identity so the next user does not inherit it; preference remains stored |

**Withdrawal.** Turning analytics OFF stops future collection and deletes application/browser identifiers (e.g., `_ga*` cookies). It does not retract data already received by Google or delete historical presence markers. Those requests must go through the privacy-rights process at `hola@democraciamas.com`.

**Org-metrics outcomes under P2.** The visible dashboard depends on the P1/P2 decision:

| P2 outcome | What is recorded | Dashboard label implication |
|---|---|---|
| (a) Necessary / legitimate interest, no consent | All qualifying Contributor activity | Standard active-user count |
| (b) Opt-in under existing analytics preference | Only consenting users | Label as "usuarios que aceptaron" |
| (c) Separate opt-in | Only users who separately consent | Label as "usuarios que aceptaron" |
| (d) Presence marker rejected | Use weaker "active users per day (max)" metric with no user ID | Label as weaker/aggregate metric |

**Terms acceptance never equals analytics consent.** Accepting `docs/TERMS_OF_USE.md` does not enable analytics. The two decisions remain independent.

**Current implementation status.** The intended contract above is not fully implemented for GA4. The existing runtime still shows PostHog-era UX and copy; it must be updated to name GA4 and reflect the approved Notice before activation (SPEC-008 §14.3).

---

## F. Retention and deletion

**Provisional retention policy.** All values below are provisional and require Privacy/Legal approval. No automatic deletion is currently guaranteed.

| Data | Proposed retention target | Enforcement | Status |
|---|---|---|---|
| GA4 event data | 2 months (shortest GA4 setting, to verify) | GA4 property setting; provider-controlled | PROVISIONAL |
| GA4 aggregated reports | Unknown; may outlive event data | Provider-controlled; must be verified and disclosed | PROVISIONAL |
| `_ga*` cookies | 60 days | Browser expiry; deleted by application on revocation/logout | PROVISIONAL |
| `usage_daily_presence` | 90 days | Manual operator-run deletion | PROVISIONAL |
| `usage_daily_counts` | 24 months | Manual operator-run deletion | PROVISIONAL |
| Presence rows on account deletion | Immediate | `on delete cascade` from `auth.users` | PROVISIONAL |

**Current status.** All retention values are PROVISIONAL. No deletion job, scheduler, or automatic purge exists. R1 is BLOCKED until Privacy/Legal approves the values, the worst-case exposure, and the manual procedure (or an automated alternative).

**Manual deletion procedure (summary).** The procedure in SPEC-008 §7.5 is the minimum operational plan. It is not a migration and is not executed automatically.

| Element | Status |
|---|---|
| Responsible data custodian | TO BE ASSIGNED |
| Cadence | TO BE APPROVED (proposed: at least monthly) |
| Operation | Database owner runs deletion SQL for rows older than the approved window |
| Verification | Read-only zero-count query after deletion; record date, operator, rows deleted, and result |
| Operations log location | TO BE DEFINED |
| Second-person verifier | TO BE ASSIGNED |

**Worst-case retention exposure.** Because deletion is manual and periodic, the longest any row can remain is the approved window plus the deletion cadence plus operational delay. Using the SPEC-008 example for presence markers: 90 days + approximately 31 days + any additional delay. The actual worst-case number depends on the approved window and cadence; it is not an approved maximum until Privacy/Legal confirms it.

**Account deletion.** If a user's Auth identity is deleted, the `usage_daily_presence` rows for that user are deleted automatically through `on delete cascade`. This does not delete GA4 data held by Google.

**Privacy-rights handling.** Requests to delete or access historical data are handled through the privacy-rights process (SPEC-008 §9). For Supabase presence rows, the operator can delete by `user_id`. For GA4, deletion relies on Google's tools (user-deletion by client ID or property-level deletion request) and the user may need to supply the client ID.

**Conditions to satisfy R1.**

- [ ] Privacy/Legal approves the retention values.
- [ ] Privacy/Legal approves the worst-case exposure (window + cadence + delay).
- [ ] A data custodian is named and authorized.
- [ ] A deletion cadence is approved.
- [ ] A verifier is named.
- [ ] An operations log location is defined.
- [ ] A dry run of the deletion procedure is completed and recorded on a non-production database (Gate O evidence).

If the manual procedure cannot meet an approved retention limit, that is an unresolved blocker. An automated mechanism would require a separate approved decision.

---

## G. International data processing

**Controller and contact.** Base Curricular is operated by **FVR Ltd** (Cayman Islands; registration 378038). The public privacy contact is **hola@democraciamas.com**.

**Providers and processing locations.**

| Provider / system | Role | Processing location / transfer note |
|---|---|---|
| Google Analytics 4 | Optional navigation analytics processor | Potential transfer to the United States; DPA and transfer safeguards **REQUIRES PRIVACY/LEGAL APPROVAL** |
| Supabase Cloud | Database, Auth, Storage | Existing platform; actual project region **requires verification** in deployment documentation |
| Vercel | Application hosting | Existing platform; actual hosting regions **requires verification** |
| FVR Ltd | Controller | Cayman Islands |

**Supabase region note.** `docs/ARCHITECTURE.md` describes Supabase Cloud as the managed backend but does not state the production project region. The actual region must be verified against the deployed Supabase project before the Privacy Notice is finalized.

**User jurisdictions.** Base Curricular may serve users in multiple Latin American jurisdictions. There is no assumption that a single privacy law governs every user (`docs/PRIVACY_AND_DATA_COLLECTION.md` §34).

**Privacy Notice inaccuracy.** Notice §13 currently states that analytics is processed in the EU region (PostHog Cloud EU). That will be inaccurate for GA4 and must be updated.

**Legal questions for Privacy/Legal (not answers).**

- What is the applicable legal basis for GA4 in each pilot jurisdiction?
- What is the applicable legal basis for organizational usage metrics in each pilot jurisdiction?
- Does the GA4 DPA and contracting Google entity cover Base Curricular's processing?
- What transfer safeguard applies to GA4 data (e.g., Standard Contractual Clauses, adequacy decision, other)?
- Is the current Privacy Notice wording on international processing adequate for GA4?
- What, if any, additional user disclosures or consents are required by the jurisdictions involved?

No claim of adequacy or compliance is made here.

---

## H. Historical PostHog handling

**Superseded design.** The original SPEC-008 design used PostHog Cloud EU (project `289698`) for optional analytics with six events and a direct Capture API transport. That design was implemented on `main` but is now superseded by D-032. The PostHog transport remains inert because `NEXT_PUBLIC_POSTHOG_KEY` is unset in every environment.

**Why PostHog-era consent does not automatically apply.** Under `docs/PRIVACY_UX_CONTRACT.md` §20, the change from PostHog to GA4 is a material change: the analytics provider, recipient, processing region, and browser-identifier model all changed. Therefore, PostHog-era acceptances must not be treated as GA4 consent unless Privacy/Legal records a different decision (P8).

**Whether PostHog data exists.** This is **not established** by repository evidence. The repository records historical provider/account evidence for PostHog project `289698`, but it does not contain evidence of stored events or persons. The Gate B reconfirmation was never executed.

**Suggested verification steps (not executed by this task).**

1. An authorized person logs into the PostHog Cloud EU project `289698` and checks for any stored events, persons, recordings, or exports.
2. Check the Vercel environment history for whether `NEXT_PUBLIC_POSTHOG_KEY` was ever set in Production.
3. Run a read-only query against `analytics_preferences` to confirm the number of rows and the recorded `consent_version` values. These rows are consent records, not PostHog event data; their retention or disposal also requires a Legal decision.

**Decisions needed under P9.**

- Whether any PostHog event/person data exists.
- Whether to delete it promptly, retain it for a defined approved period, or take another action.
- Whether to close the PostHog project.
- What to do with the `analytics_preferences` rows that record PostHog-era consent (this question is not addressed explicitly in SPEC-008 and must be confirmed by Privacy/Legal).

**Code removal.** Removing the superseded PostHog code, tests, scripts, and environment variables is part of SPEC-008 phase 3 (§14.5). It is not part of this document and must be authorized separately.

---

## I. Activation checklist

**All gates are currently not satisfied. This document does not change that. None of the boxes below should be ticked by this document.**

### Gate P — Privacy/Legal decisions

- [ ] P1 recorded in `docs/DECISIONS.md`.
- [ ] P2 recorded in `docs/DECISIONS.md`.
- [ ] P3 recorded in `docs/DECISIONS.md` (including DPA, contracting Google entity, transfer safeguards, and pilot jurisdictions/legal basis).
- [ ] P4 recorded in `docs/DECISIONS.md`.
- [ ] P5 recorded in `docs/DECISIONS.md`.
- [ ] P6 recorded in `docs/DECISIONS.md` (including all provisional retention values and worst-case exposure).
- [ ] P7 recorded in `docs/DECISIONS.md` (Privacy Notice and Terms changes, new version, user communication).
- [ ] P8 recorded in `docs/DECISIONS.md`.
- [ ] P9 recorded in `docs/DECISIONS.md`.
- [ ] P10 recorded in `docs/DECISIONS.md`.
- [ ] Every SPEC-008 §10 item (1–12) has a recorded decision.

**Status:** PENDING

### Gate O — Organizational metrics validation

- [ ] P1, P2, and P6 decided and recorded.
- [ ] R1 unblocked.
- [ ] Local real-stack tests pass (pgTAP, Vitest, Playwright for AC-O1–AC-O14).
- [ ] Cloud structural verification of RLS/grants confirms `record_usage` is not executable by `authenticated`/`anon`/`PUBLIC`.
- [ ] Client-bundle scan confirms the recorder secret is absent.
- [ ] Hosted read-only dashboard verification with a real Admin and Contributor denial.
- [ ] Dry run of the §7.5 deletion procedure recorded on a non-production database.

**Status:** PENDING

### Gate G — GA4 controlled validation

- [ ] P3, P4, P5, P6, P7, P8, and P10 decided and recorded.
- [ ] Property settings in §6.6 verified in the GA4 property admin.
- [ ] Controlled Production test with 1–2 named internal accounts completed.
- [ ] Browser traffic/storage inspection enumerates every parameter observed, including provider-generated automatic events.
- [ ] Scenarios completed: consent OFF, consent ON, revocation, logout, page navigation, search, content opens, downloads.
- [ ] Stop/rollback owner named (unset Measurement ID, redeploy).

**Status:** PENDING

### External Pilot Analytics Activation Gate

- [ ] Gate P decisions recorded for the capability being activated.
- [ ] Gate G passed (for GA4) or Gate O passed (for org metrics).
- [ ] §10.1 Privacy Notice dependency satisfied: approved updated Notice, version bump, user communication, re-consent decision.
- [ ] R1 enforceable retention unblocked: values, worst case, custodian, cadence, verifier, log location approved (or automated alternative approved).
- [ ] Recorded activation decision in `docs/DECISIONS.md`.

**Status:** CLOSED

**Activation independence.** GA4 and organizational metrics may be activated independently. Registered-organization and registered-user counts may be shown to Admins before Gate P is satisfied because they derive from existing operational/admin data (SPEC-008 §7.6, §14.5). Per-user-linked recording requires the relevant Gate P decisions and R1.

---

## J. Decision summary

| ID | Decision | Recommended option | Owner | Status |
|---|---|---|---|---|
| P1 | Legal basis for organizational usage metrics | Proposed: treat presence marker as personal data and keep recording OFF until Legal confirms basis | Privacy/Legal | PENDING |
| P2 | Consent requirement for internal usage collection | Proposed: treat presence marker as personal-data consent-requiring; if consent chosen, label dashboard counts | Privacy/Legal | PENDING |
| P3 | GA4 processing arrangements and international transfers | Proposed: confirm DPA, contracting Google entity, transfer safeguards, and pilot jurisdictions before Gate G | Privacy/Legal | PENDING |
| P4 | Cookie/identifier processing (`_ga*`) | Proposed: process only under GA4 consent, 60 days provisional, disclose in Notice | Privacy/Legal | PENDING |
| P5 | Consent Mode behavior | Proposed: no Consent Mode pings; tag not loaded without consent | Privacy/Legal | PENDING |
| P6 | Retention values and manual-deletion worst case | Proposed: approve provisional values and worst-case exposure (window + cadence + delay) | Privacy/Legal | PENDING |
| P7 | Privacy Notice and Terms changes | Proposed: approve updated Notice/Terms, version bump, and user communication | Privacy/Legal | PENDING |
| P8 | Re-consent of PostHog-era acceptances | Proposed: re-collect consent; treat prior acceptances as undecided for GA4 | Privacy/Legal | PENDING |
| P9 | Disposal of historical PostHog data | Proposed: verify existence first, then dispose/close per Legal guidance | Privacy/Legal / Product | PENDING |
| P10 | GA4 request-inherent and provider-derived data | Proposed: approve category 2 and 3 items item-by-item after Gate G + Google docs review | Privacy/Legal | PENDING |
| R1 | Enforceable retention for organizational metrics | Proposed: approve values, worst case, custodian, cadence, verifier, log location (or automated alternative) | Privacy/Legal | BLOCKED |

**Open items not covered by a P-ID**

- **Pilot jurisdictions and applicable legal basis for GA4 (SPEC-008 §10 item 3).** Covered as a sub-question under P3; no dedicated P-ID exists.
- **GA4 retention setting and aggregate-report persistence disclosure (SPEC-008 §10 item 5).** Covered under P6; no dedicated P-ID exists.
- **GA4 access custodian.** `docs/PRIVACY_AND_DATA_COLLECTION.md` §29 lists "[information to complete: people, teams, or roles authorized to access GA4]." This must be assigned before activation.
- **DPA / transfer safeguards placeholders.** `docs/PRIVACY_AND_DATA_COLLECTION.md` §8 and §32 contain "[information to complete]" placeholders that must be filled.
- **`analytics_preferences` row disposition.** The PostHog-era consent records in Supabase are not PostHog event data. SPEC-008 does not explicitly address whether to retain, anonymize, or delete them; Privacy/Legal must confirm.
- **Supabase Cloud production region.** Not stated in the repository documentation reviewed; requires verification for the Privacy Notice.
