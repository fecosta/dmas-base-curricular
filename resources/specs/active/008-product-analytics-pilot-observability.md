# SPEC-008 — Product Analytics & Pilot Observability

**Status:** ACTIVE — PRODUCT MODEL APPROVED; PRIVACY/LEGAL + TECHNICAL GATES PENDING  
**Delivery state:** DECISION READY — PRIVACY/LEGAL APPROVAL AND TECHNICAL PREFLIGHT REQUIRED  
**External Pilot Analytics Activation Gate:** CLOSED  
**Gate B — Controlled Enabled-State Validation:** NOT AUTHORIZED

---

## 1. Purpose

Introduce optional, privacy-minimized product analytics for Base Curricular so the team can understand:

- platform adoption;
- discovery behavior;
- content interest;
- returning usage;
- UX friction.

Analytics exists to improve the product.

It must not become a mechanism for:

- individual performance evaluation;
- user ranking;
- employee monitoring;
- sensitive inference;
- advertising;
- cross-service tracking.

Analytics is observational and opt-in. It must not be interpreted as a census of all Base Curricular users.

---

## 2. Current State

The analytics foundation has already been implemented and independently reviewed.

Verified implementation includes:

- persisted user-owned analytics preference;
- explicit undecided / rejected / accepted states;
- analytics default OFF;
- Terms acceptance separate from analytics consent;
- no Admin override;
- no client-side preference mutation;
- lazy analytics SDK initialization;
- Production-only environment gating;
- Preview / Development / Test no-op;
- autocapture disabled;
- automatic pageviews disabled;
- Session Replay disabled;
- heatmaps disabled;
- semantic event instrumentation;
- provider failure isolation;
- logout/session isolation;
- stale initialization race protection.

Hosted analytics-disabled validation has passed.

Production currently has no PostHog project key configured.

### 2.1 Current implementation deviation

The existing implementation calls PostHog `identify()` after consent.

That behavior predates the revised product decision in this specification.

The approved target model no longer permits normal `identify()` usage, persistent PostHog Person Profiles, or anonymous-to-identified behavioral linkage.

This is a known implementation gap to be addressed only after technical preflight confirms a coherent profile-free identity design.

### 2.2 Verified PostHog account state

Account-level inspection verified:

- Organization: `VeR+`
- Project: `Default project`
- Project ID: `289698`
- Hosting: PostHog Cloud EU
- Project timezone: UTC
- Plan: Cloud Free
- No active paid subscription
- Session Replay disabled
- raw client IP discard enabled
- GeoIP transformation enabled
- GeoIP is the sole configured transformation
- zero configured destinations
- zero legacy destination configurations
- zero batch exports
- zero external data sources
- PostHog legal-document register empty

The empty legal-document register does not prove that no DPA, Terms, or external agreement applies.

Effective members, roles, MFA and SSO remain unverified because those account areas require fresh authentication.

---

## 3. Problem / Gap

The existing analytics implementation was built around a consent-gated PostHog integration, but subsequent provider/account investigation identified processing surfaces that require a narrower contract.

The principal gaps are:

1. normal `identify()` may introduce `$identify`, Person Profiles and identity linkage beyond the minimum measurement need;
2. GeoIP is currently enabled despite there being no approved measurement requirement for user geolocation;
3. provider defaults and generated properties require explicit minimization;
4. PostHog's one-year event retention/query window does not establish enforceable physical deletion;
5. the existing 12-month retention requirement therefore remains unverified;
6. effective PostHog account access/MFA controls remain unverified;
7. applicable DPA, transfer arrangements and pilot jurisdictions remain unresolved;
8. controlled enabled-state behavior has not yet been validated.

These gaps do not justify expanding processing or weakening the existing privacy contract.

---

## 4. Approved Product Decision

The approved Base Curricular analytics model is the smallest processing model capable of answering the defined product questions.

### 4.1 Consent model

Analytics MUST remain:

- optional;
- default OFF;
- explicit opt-in;
- controlled by the individual user;
- separate from Terms acceptance;
- revocable;
- non-blocking to normal product use.

No administrator may enable analytics on behalf of another user.

Failure to determine or persist a valid analytics preference MUST fail closed.

Turning analytics OFF stops future optional analytics collection.

Revocation MUST NOT be represented as automatic historical deletion.

Historical deletion is handled through the applicable retention and privacy-rights mechanisms.

### 4.2 Application event taxonomy

Exactly six application analytics events are approved:

- `library_viewed`
- `search_performed`
- `filter_applied`
- `content_opened`
- `external_reference_opened`
- `content_downloaded`

No additional application behavioral event may be introduced without a new product/privacy review.

### 4.3 Application events vs provider/system events

Application events and provider/system events are separate processing categories.

The six-event taxonomy does NOT implicitly authorize:

- `$identify`;
- `$opt_in`;
- aliases;
- automatic pageviews;
- autocapture events;
- additional provider behavioral/system events.

The target minimal model authorizes no normal `$identify` event.

### 4.4 Identity model

Analytics may operate only for authenticated users who have persisted explicit analytics consent.

The target identity model is:

- stable pseudonymous event identity;
- based on the authenticated Supabase user UUID;
- associated with approved events only;
- no normal PostHog `identify()`;
- no persistent PostHog Person Profiles;
- no aliases;
- no anonymous behavioral history;
- no anonymous-to-identified linkage;
- no additional persistent device-tracking identity.

The Supabase UUID remains personal data for privacy purposes even though it is pseudonymous.

The implementation MUST NOT duplicate the UUID into multiple analytics properties unless technically necessary.

The technical feasibility of this model MUST be established before implementation changes begin.

If PostHog cannot support the approved measurement requirements under these constraints, implementation MUST return:

`BLOCKED / DECISION REQUIRED`

The implementation MUST NOT silently restore `identify()`, Person Profiles, aliases, device identities or anonymous linkage.

### 4.5 Organization context

`organization_id` may be sent as an event property when needed for approved organization-level analysis.

PostHog Groups are not required.

Organization name and organization domain MUST NOT be sent.

Organization-level analytics MUST NOT be used to circumvent the prohibition on individual performance monitoring.

### 4.6 Location processing

Raw IP storage for analytics MUST remain disabled.

Base Curricular analytics has no approved requirement for:

- user country derived from IP;
- city;
- coordinates;
- geographic subdivision;
- IP-derived timezone;
- other IP-derived location enrichment.

GeoIP MUST therefore be disabled before controlled enabled-state validation.

The product's content-country filters describe curricular content and MUST NOT be interpreted as authorization to geolocate users.

Necessary transient network processing of an IP address is distinct from storing the address or enriching analytics with it.

Provider/infrastructure security logging requires separate evidence and purpose limitation.

---

## 5. Data Minimization Contract

Analytics MUST use a closed property allowlist.

### 5.1 Prohibited data

Analytics MUST NOT contain:

- raw search queries;
- normalized search text capable of reconstructing a query;
- query-derived fingerprints;
- names;
- email addresses;
- organization names;
- organization domains;
- private content;
- teaching notes;
- original filenames;
- full external URLs;
- URL query strings;
- URL fragments;
- raw referrer URLs;
- passwords;
- authentication tokens;
- authorization headers;
- advertising identifiers;
- raw IP addresses;
- IP-derived geographic properties;
- additional persistent device identifiers.

### 5.2 Required properties

The minimum model may require:

- event name;
- event timestamp;
- approved pseudonymous `distinct_id`;
- `organization_id`, when applicable;
- role, when required by an approved analysis;
- environment;
- event-specific canonical identifiers or counts explicitly required by the six-event measurement contract.

### 5.3 Provider-generated properties

Provider defaults are not automatically approved.

Classification:

| Property category | Contract |
|---|---|
| Browser family | ACCEPTABLE only for a documented UX-friction question |
| OS family | ACCEPTABLE only when justified |
| Broad device class | ACCEPTABLE for responsive UX analysis |
| Exact screen/viewport dimensions | UNNECESSARY |
| Browser language | UNNECESSARY |
| User timezone | UNNECESSARY |
| Full current URL | PROHIBITED |
| Raw referrer | PROHIBITED |
| UTM parameters | UNNECESSARY |
| Advertising identifiers | PROHIBITED |
| Additional device identifiers | PROHIBITED |
| Anonymous behavioral IDs | UNNECESSARY |
| Session/window IDs | UNNECESSARY unless technical evidence demonstrates necessity |
| SDK name/version | ACCEPTABLE when needed for ingestion diagnostics |
| Event timestamp | REQUIRED |
| Approved pseudonymous distinct ID | REQUIRED |
| Event UUID/deduplication metadata | EVIDENCE REQUIRED |

`ACCEPTABLE` does not mean enabled by default.

Optional acceptable properties SHOULD be omitted unless a concrete measurement question justifies them.

---

## 6. Search Privacy

Search analytics may indicate that a search occurred and may contain explicitly approved aggregate metadata.

They MUST NOT contain:

- search text;
- normalized search text;
- hashes of search text;
- embeddings derived from search text;
- fingerprints capable of distinguishing/reconstructing queries;
- query fragments;
- URLs containing query values.

Search analytics must measure interaction without recording what the user typed.

---

## 7. Auxiliary PostHog Products

The following are OUT OF SCOPE for SPEC-008:

- Session Replay;
- autocapture;
- heatmaps;
- surveys;
- feature-flag analytics;
- experiments;
- error tracking;
- logs;
- AI Observability;
- Replay Vision;
- PostHog AI analysis of Base Curricular analytics data;
- workflows/emails.

Their availability in the PostHog account does not authorize their use.

A future requirement for any of these capabilities requires a separate Product/Privacy review.

---

## 8. Destinations, Exports and Secondary Use

Current account inspection found no configured analytics destinations, batch exports or external data sources.

The durable contract is:

> Base Curricular analytics data MUST NOT be forwarded to a third-party destination without a new Product/Privacy review and applicable Security approval.

This includes:

- realtime destinations;
- batch exports;
- webhooks;
- integrations;
- automated forwarding;
- manual analytics exports subsequently uploaded or shared elsewhere.

Provider subprocessors governed by the applicable processing agreement are a separate legal question and MUST NOT be conflated with customer-configured destinations.

---

## 9. Retention and Deletion

### 9.1 Retention requirement

Optional analytics personal data MUST be deleted within a maximum of 12 months.

This is an enforceable deletion requirement.

A one-year query/visibility window does NOT satisfy this requirement unless Product and Privacy/Legal explicitly approve weakening the contract.

No such weakening is currently approved.

### 9.2 Preferred enforcement

Preferred model:

**A — Provider-native enforceable deletion**

PostHog or the applicable contractual arrangement demonstrates that covered analytics personal data is deleted within the required period.

### 9.3 Conditional fallback

If provider-native enforcement cannot satisfy the requirement:

**B — Operational deletion**

may be considered only after technical, security and privacy feasibility is verified.

Any operational mechanism MUST address:

- age-based event selection;
- event deletion;
- Person Profiles, if any accidentally exist;
- anonymous identifiers, if any exist;
- linked identities, if any exist;
- derived identifiable datasets;
- manual exports/copies;
- recordings, if any unexpectedly exist;
- backup expiry/deletion behavior;
- asynchronous completion;
- completion evidence;
- scheduling margin;
- retries;
- failure alerts;
- accountable ownership;
- least-privileged credentials;
- audit evidence that does not recreate deleted data.

A deletion request being accepted by an API is not sufficient evidence that deletion completed.

### 9.4 Query-retention interpretation

**C — Query-retention interpretation** is NOT approved.

Adopting it would weaken the existing product/privacy contract and requires an explicit:

`PRODUCT + PRIVACY/LEGAL APPROVAL REQUIRED`

decision.

### 9.5 Failure to establish deletion

If neither provider-native nor operational deletion can demonstrably preserve the 12-month requirement, optional analytics MUST remain disabled.

A paid PostHog feature, different provider or different architecture requires a separate authorized decision.

---

## 10. Privacy Rights

The analytics design MUST support applicable privacy-rights operations, including deletion where required.

The operational process must establish:

- responsible owner;
- request channel;
- identity verification;
- provider lookup mechanism;
- deletion mechanism;
- completion evidence;
- applicable response deadlines.

Analytics consent revocation and historical data deletion are separate operations.

---

## 11. Controller and Contact

For this product contract:

**Controller:** FVR Ltd  
**Contact:** hola@democraciamas.com

These MUST NOT be replaced by broader institutional entities solely because another Democracia+ document uses different language.

Any contradiction between Base Curricular's approved product contract and institutional Privacy Policy, Terms, DPA or other legal material is:

`LEGAL RECONCILIATION REQUIRED`

---

## 12. Legal Readiness

Before Gate B, Privacy/Legal must determine whether the controlled validation is covered by the applicable legal arrangements.

Before external pilot activation, the following must be established:

- correct controller;
- correct PostHog processor/contracting entity;
- executed DPA or legally applicable equivalent;
- applicable agreement version/effective mechanism;
- actual pilot jurisdictions;
- applicable legal basis;
- applicable consent/storage requirements;
- subprocessors;
- international processing/transfer safeguards;
- privacy-rights process;
- retention/deletion obligations;
- institutional Privacy Policy / Terms reconciliation.

EU Cloud hosting MUST NOT be represented as proof that all processing occurs exclusively within the EU.

The empty PostHog legal-document register is not evidence that no agreement applies.

---

## 13. Access and Security

Gate B requires effective access restriction and accountability.

Minimum outcomes:

- named human accounts;
- no shared human accounts;
- least privilege;
- only personnel with a legitimate analytics purpose receive access;
- bounded administrator access;
- MFA across human access paths;
- controlled privileged credentials;
- named credential owner;
- secure credential storage;
- revocation/rotation procedure;
- accountable offboarding;
- controlled invitations;
- restricted validation evidence and exports.

Base Curricular application Admin status MUST NOT automatically grant PostHog access.

Paid provider capabilities such as SSO, SCIM, granular RBAC or advanced audit tooling are optional mechanisms, not requirements by name.

If available Free-plan controls cannot achieve the required security outcome, Gate B remains blocked.

---

## 14. Environment Isolation

Analytics MUST operate only in the approved Production environment.

Preview, Development and Test MUST remain no-op.

Unknown or missing deployment environment MUST fail closed.

No analytics event may be intentionally sent from Preview, Development or Test.

---

## 15. Provider Failure Isolation

PostHog availability MUST NOT become a dependency for normal Base Curricular use.

Failures involving:

- SDK loading;
- initialization;
- ingestion;
- network access;
- provider outage;
- provider blocking;

MUST NOT prevent normal product interaction.

---

## 16. Consent Lifecycle

Before persisted opt-in:

- analytics SDK MUST remain inert;
- no optional analytics event may be emitted.

After persisted opt-in:

- only the approved processing contract may activate.

After revocation:

- future analytics collection MUST stop;
- analytics identity/session state MUST be invalidated/reset as technically appropriate;
- stale asynchronous initialization MUST NOT resume collection.

After logout:

- analytics state MUST NOT leak into the next authenticated session.

User A analytics identity MUST never become User B's identity.

---

## 17. Analytics Questions

The approved analytics model should answer product-level questions such as:

- Are consenting users returning to Base Curricular?
- Which approved content surfaces are being opened?
- Which modules or content categories receive interest?
- Are users using search?
- Are users using filters?
- Are external references being followed?
- Are downloadable resources being used?
- Are there coarse device-related UX problems where specifically approved?

It must not answer questions such as:

- Which employee is performing best?
- Which individual searches for a particular sensitive subject?
- Where is a particular user physically located?
- What websites did an individual visit before Base Curricular?
- What does an individual's detailed browsing history reveal?

---

## 18. Technical Preflight Required

Before implementation of the revised identity model, Engineering MUST perform a bounded technical preflight.

The preflight must determine whether PostHog can support:

1. stable Supabase UUID as event-level `distinct_id`;
2. no normal `identify()`;
3. no `$identify`;
4. no persistent Person Profiles;
5. no anonymous behavioral history;
6. no anonymous-to-identified linkage;
7. no additional persistent device identity;
8. the approved six events;
9. the approved property allowlist;
10. returning-user analysis;
11. required organization segmentation;
12. applicable content-interest/journey analysis.

The preflight SHOULD use documentation, SDK/source behavior and local/non-ingesting evidence first.

It MUST NOT enable production analytics merely to answer these questions.

If the required analytical questions cannot be answered under the approved privacy model, return:

`BLOCKED / DECISION REQUIRED`

Do not expand processing automatically.

---

## 19. Gate A — Legal & Provider Readiness

Gate A covers:

- provider/account evidence;
- legal readiness;
- retention/deletion evidence;
- access/security evidence;
- privacy-contract reconciliation.

Gate A does not authorize telemetry.

Remaining Gate A requirements include:

- applicable DPA/agreement evidence;
- transfer/subprocessor review;
- pilot jurisdiction determination;
- enforceable deletion evidence;
- effective PostHog roster/roles;
- MFA/access verification;
- technical confirmation of the approved identity model;
- approved GeoIP removal;
- approved property allowlist.

---

## 20. Gate B — Controlled Enabled-State Validation

Gate B is a bounded controlled validation.

It is NOT general production analytics activation.

Gate B remains:

**NOT AUTHORIZED**

until all prerequisites below are satisfied.

### 20.1 Gate B prerequisites

1. Product decisions recorded in durable project knowledge.
2. Required Privacy/Legal approval obtained.
3. Security approval obtained.
4. Technical preflight confirms the profile-free identity model.
5. Revised implementation conforms to that model.
6. GeoIP is disabled.
7. Property allowlist is enforced.
8. Retention/deletion mechanism is evidenced.
9. Applicable processor/legal arrangement covers the validation.
10. PostHog roster, MFA and effective access are verified.
11. Controlled participants are defined.
12. Validation duration and expected interactions are bounded.
13. Production containment prevents accidental general pilot collection.
14. Stop/rollback responsibility is defined.
15. Validation-data deletion/cleanup is defined.

Instructions asking normal users not to opt in are NOT sufficient containment.

### 20.2 Gate B validation

Once separately authorized, Gate B must verify:

- zero collection before persisted opt-in;
- only the six approved application events;
- actual outgoing payloads;
- actual ingested properties;
- no prohibited data;
- no `$identify`;
- no Person Profiles;
- no anonymous linkage;
- no GeoIP/location enrichment;
- no prohibited automatic properties;
- correct stable pseudonymous identity;
- organization segmentation;
- returning-user analysis;
- revocation;
- re-enablement;
- logout/session isolation;
- user-switch isolation;
- Preview/Development/Test no telemetry;
- provider failure isolation.

Gate B evidence must distinguish browser/network behavior from provider-ingested state.

A successful Gate B does NOT authorize external pilot analytics automatically.

---

## 21. External Pilot Analytics Activation Gate

External pilot activation remains:

**CLOSED**

Opening it requires, at minimum:

- successful Gate B;
- applicable legal clearance;
- pilot-jurisdiction review;
- DPA/agreement readiness;
- retention/deletion readiness;
- privacy notice consistency;
- security/access readiness;
- validated provider configuration;
- no unresolved material privacy deviation.

---

## 22. Acceptance Criteria

### AC-01 — Default off
A user who has not explicitly opted in produces no optional analytics telemetry.

### AC-02 — Separate consent
Terms acceptance does not imply analytics consent.

### AC-03 — Six application events
Only the six approved semantic application events are emitted.

### AC-04 — No normal identification
The approved implementation does not call normal PostHog `identify()` and does not generate `$identify`.

### AC-05 — No persistent Person Profiles
The controlled provider state demonstrates that approved analytics does not create persistent PostHog Person Profiles.

### AC-06 — No anonymous linkage
No pre-consent or anonymous behavioral history is linked to the authenticated user.

### AC-07 — Stable pseudonymous identity
Approved events can support returning-user analysis through the approved pseudonymous event identity without profiles or linkage.

### AC-08 — Search privacy
No raw query, normalized query, hash, fingerprint or reconstructable search value reaches analytics.

### AC-09 — Property minimization
Actual outgoing and ingested payloads conform to the approved allowlist.

### AC-10 — No raw IP analytics storage
Raw client IP is not retained as analytics data.

### AC-11 — No GeoIP
No user-location enrichment derived from IP is present.

### AC-12 — Auxiliary products excluded
No Session Replay, autocapture, heatmap or other out-of-scope PostHog product processes Base Curricular analytics under SPEC-008.

### AC-13 — No unapproved forwarding
No configured or manual analytics forwarding occurs without the required review.

### AC-14 — Environment isolation
Preview, Development and Test emit no analytics.

### AC-15 — Revocation
Revoking consent prevents future optional analytics collection.

### AC-16 — Session isolation
Logout and user switching do not leak analytics identity.

### AC-17 — Failure isolation
Blocking or failing PostHog does not break normal product use.

### AC-18 — Retention
A verified mechanism enforces deletion of applicable optional analytics personal data within 12 months.

### AC-19 — Access controls
Effective PostHog access, MFA and credential handling meet the approved security outcomes.

### AC-20 — Legal readiness
Applicable processor agreement, jurisdiction, transfer and privacy-rights requirements are resolved before external activation.

### AC-21 — Controlled validation
Gate B passes under a separately authorized, bounded protocol before external pilot activation.

---

## 23. Implementation Freedom

Engineering may choose reversible technical details necessary to implement the approved contract, provided they do not alter:

- consent semantics;
- event taxonomy;
- identity semantics;
- data minimization;
- prohibited data;
- GeoIP prohibition;
- retention requirement;
- environment isolation;
- access authority;
- external activation gates.

Engineering may select the safest supported SDK configuration, event transport mechanism and internal abstractions.

Engineering MUST return:

`BLOCKED / DECISION REQUIRED`

if technical feasibility requires changing an approved product/privacy contract.

Implementation convenience must not redefine the contract.

---

## 24. Knowledge Reconciliation Required

Once the revised model is implemented and validated, reconcile the existing project sources of truth rather than creating competing documentation.

Expected reconciliation surfaces include:

- this SPEC;
- `docs/PRIVACY_AND_DATA_COLLECTION.md`;
- `docs/PRIVACY_UX_CONTRACT.md`;
- `docs/PRIVACY_NOTICE.md`;
- `docs/SECURITY.md`;
- `docs/ARCHITECTURE.md`;
- `docs/DECISIONS.md`;
- relevant repository lifecycle/status indexes.

Historical implementation and validation evidence must be preserved.

Stale statements describing SPEC-008 as merely planned must be corrected.

Proposed behavior must not be documented as deployed until implementation and validation prove it.

---

## 25. Open Blockers

The following remain unresolved and materially block Gate B or external activation:

### Technical

- profile-free PostHog identity feasibility;
- effective provider-generated metadata;
- effective client persistence;
- retention/deletion mechanism.

### Security

- effective account roster;
- roles/privileges;
- MFA coverage;
- authentication paths;
- invitations;
- privileged credential ownership.

### Privacy / Legal

- applicable DPA/agreement;
- correct processor/contracting entity;
- pilot jurisdictions;
- subprocessors/transfers;
- privacy-rights operational process;
- retention/deletion legal sufficiency;
- institutional legal-document reconciliation.

These blockers do not reopen the approved product direction.

They determine whether that direction can proceed to controlled validation.

---

## 26. Current Lifecycle State

Current state:

**ACTIVE — PRODUCT MODEL APPROVED; PRIVACY/LEGAL + TECHNICAL GATES PENDING**

Product direction is approved.

The revised identity/location/minimization model is not yet implemented.

Gate B is not authorized.

External Pilot Analytics Activation Gate is CLOSED.

The next engineering activity is a bounded technical preflight of the profile-free identity model.

The next privacy/legal activity is resolution of the outstanding agreement, jurisdiction, transfer and retention/deletion requirements.

No production analytics activation is authorized by this specification revision.