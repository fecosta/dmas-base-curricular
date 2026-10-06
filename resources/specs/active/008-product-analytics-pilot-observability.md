# SPEC-008 — Product Analytics & Pilot Observability

**Status:** ACTIVE — PRODUCT MODEL APPROVED; PROFILE-FREE TRANSPORT IMPLEMENTATION READY; PRIVACY/LEGAL GATES PENDING  
**Delivery state:** IMPLEMENTATION READY — PROFILE-FREE CAPTURE TRANSPORT VERIFIED  
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
- lazy analytics initialization;
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

The approved target model no longer permits:

- normal `identify()` usage;
- `$identify`;
- persistent PostHog Person Profiles;
- aliases;
- anonymous behavioral history;
- anonymous-to-identified behavioral linkage;
- additional persistent device-tracking identities.

Technical preflight has confirmed that these mechanisms are not required to answer the approved SPEC-008 analytics questions.

The existing implementation therefore requires a bounded transport/identity correction before Gate B.

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

### 2.3 Verified profile-free technical feasibility

Local, non-ingesting technical verification established that the approved analytics questions can be answered without:

- `identify()`;
- Person Profiles;
- aliases;
- anonymous-to-identified linkage;
- persistent device identity;
- PostHog Groups;
- native Lifecycle insights;
- saved Person cohorts.

Verified capabilities include:

- stable Supabase UUID as event-level `distinct_id`;
- cross-session returning-user analysis;
- event-level organization segmentation;
- search interaction analysis;
- content-interest analysis;
- funnels;
- custom-event paths;
- retention calculations;
- semantic journeys.

A stable pseudonymous event identity is therefore technically distinct from a persistent PostHog Person Profile.

### 2.4 Verified transport direction

Technical preflight also established that the existing PostHog JS SDK lifecycle is not the preferred transport for the approved contract.

A failure experiment demonstrated that SDK/network retry machinery may transmit an event after application-level opt-out/shutdown.

The approved implementation direction is therefore a minimal direct browser Capture API transport with:

- no PostHog JS SDK runtime dependency for event delivery;
- no SDK initialization;
- no `identify()`;
- no queue;
- no batching;
- no application retry;
- no SDK retry;
- no analytics persistence;
- no offline event storage;
- no unload flush;
- one immediate application-controlled dispatch per approved event;
- strict runtime event/property validation;
- generation-scoped request cancellation.

Local cross-browser verification confirmed this model is technically viable, subject to the transport semantics defined in this specification.

---

## 3. Problem / Gap

The existing analytics implementation was built around a consent-gated PostHog SDK integration, but subsequent provider/account and transport investigation identified processing surfaces that require a narrower contract.

The principal gaps are:

1. normal `identify()` may introduce `$identify`, Person Profiles and identity linkage beyond the minimum measurement need;
2. the existing SDK introduces unnecessary identity/session/default metadata and retry behavior;
3. GeoIP is currently enabled despite there being no approved measurement requirement for user geolocation;
4. provider defaults and generated properties require explicit minimization;
5. PostHog's one-year event retention/query window does not establish enforceable physical deletion;
6. the existing 12-month retention requirement therefore remains unverified;
7. effective PostHog account access/MFA controls remain unverified;
8. applicable DPA, transfer arrangements and pilot jurisdictions remain unresolved;
9. controlled enabled-state behavior has not yet been validated.

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

Turning analytics OFF stops future optional analytics collection initiated by the application.

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

No additional application behavioral event may be introduced without a new Product/Privacy review.

### 4.3 Application events vs provider/system events

Application events and provider/system events are separate processing categories.

The six-event taxonomy does NOT implicitly authorize:

- `$identify`;
- `$opt_in`;
- `$create_alias`;
- `$merge_dangerously`;
- `$set`;
- `$set_once`;
- automatic pageviews;
- automatic pageleave;
- autocapture events;
- feature-flag events;
- additional provider behavioral/system events.

The target minimal model authorizes no normal `$identify` event.

### 4.4 Identity model

Analytics may operate only for authenticated users who have persisted explicit analytics consent.

The approved identity model is:

- stable pseudonymous event identity;
- based on the authenticated Supabase user UUID;
- associated directly with approved events;
- no normal PostHog `identify()`;
- no persistent PostHog Person Profiles;
- no aliases;
- no anonymous behavioral history;
- no anonymous-to-identified linkage;
- no additional persistent device-tracking identity.

The Supabase UUID remains personal data for privacy purposes even though it is pseudonymous.

The UUID SHOULD appear once as the event-level `distinct_id`.

The implementation SHOULD NOT duplicate the same UUID into a separate `user_id` analytics property.

PostHog personless ingestion may derive internal analytical identifiers from the supplied `distinct_id`. Such provider-internal analytical keys do not authorize a new browser/device identity or Person Profile.

If implementation evidence later shows that the approved measurement requirements cannot be satisfied under these constraints, implementation MUST return:

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
- raw IP addresses as analytics properties;
- IP-derived geographic properties;
- additional persistent device identifiers.

### 5.2 Required properties

The minimum model may require:

- event name;
- event timestamp;
- approved pseudonymous `distinct_id`;
- `organization_id`, when applicable;
- environment;
- event-specific canonical identifiers or counts explicitly required by the six-event measurement contract.

`role` SHOULD be omitted unless a concrete approved measurement question requires it.

### 5.3 Approved per-event properties

#### `library_viewed`

No additional event-specific properties.

#### `search_performed`

Allowed:

- `result_count`
- `has_results`

#### `filter_applied`

Allowed:

- `filter_type`

#### `content_opened`

Allowed:

- `content_id`
- `content_type`

#### `external_reference_opened`

Allowed:

- `content_id`
- `content_type`

#### `content_downloaded`

Allowed:

- `attachment_id`
- `content_id`
- `content_type`

Unknown or unsupported properties MUST cause the analytics event to be rejected rather than partially forwarded.

### 5.4 Provider-generated properties

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
| Session/window IDs | UNNECESSARY |
| SDK name/version | ACCEPTABLE when needed for ingestion diagnostics |
| Event timestamp | REQUIRED |
| Approved pseudonymous distinct ID | REQUIRED |
| Event-scoped technical deduplication metadata | ACCEPTABLE only under §15.4 |

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

## 15. Analytics Transport Contract

### 15.1 Application-controlled dispatch

For each valid analytics event, the application MUST initiate at most one analytics dispatch.

The application MUST NOT implement or enable:

- application-level retries;
- SDK-managed retries;
- event queues;
- request batching;
- offline event storage;
- delayed replay;
- unload flushing;
- service-worker analytics delivery;
- behavioral event buffering for later transmission.

Failure to deliver an analytics event is acceptable.

Analytics is optional observational evidence and MUST NOT become a reliable-delivery or transactional system.

Provider/network failure MUST continue to have no effect on normal product use.

### 15.2 Direct transport model

The approved implementation direction is a minimal browser transport to the PostHog EU Capture API.

The transport SHOULD:

- construct the analytics envelope explicitly;
- use the browser-publishable project token;
- send the approved pseudonymous UUID as `distinct_id`;
- send `$process_person_profile: false`;
- send one approved event at a time;
- use a strict runtime event/property allowlist;
- omit credentials/cookies;
- suppress referrer transmission where supported;
- avoid SDK initialization and SDK identity state;
- maintain only ephemeral in-flight request control state.

The application MUST NOT use a personal, management or privileged PostHog API credential in the browser.

### 15.3 Transport-level retransmission

The application-level single-dispatch guarantee does not imply an exactly-once wire-level delivery guarantee.

After the application initiates a single request, the browser, operating system, HTTP implementation, network stack, intermediary, or provider infrastructure MAY internally retransmit or otherwise repeat that request as part of transport recovery.

Local cross-browser verification demonstrated that Chromium may resend an already-dispatched POST under specific transport conditions, including reused-connection failures and HTTP 408 recovery.

Such transport-level retransmission:

- occurs outside the application's behavioral collection logic;
- MUST NOT be intentionally initiated by application code;
- MUST NOT be initiated by an analytics SDK retry mechanism;
- MUST NOT cause previously buffered behavioral events to be replayed;
- MUST NOT change the event's user identity or semantic payload;
- MUST NOT be treated as authorization for application-level retry.

The application MUST NOT claim exactly-once network delivery.

### 15.4 Duplicate-tolerant ingestion

Where practical, analytics processing SHOULD tolerate duplicate delivery of the same semantic event.

Any event-level technical identifier introduced for deduplication MUST:

- identify the event, not the user or device;
- not create an additional persistent behavioral identity;
- not enable anonymous-to-identified linkage;
- not expand the approved analytics purpose;
- be documented as technical ingestion metadata;
- remain subject to the analytics retention/deletion contract.

Provider-generated or application-generated event UUIDs may be used only if they satisfy these constraints.

The feasibility and necessity of provider-side event deduplication MAY be verified during implementation and Gate B without reopening the product decision.

### 15.5 Failure semantics

For analytics transport failures, including:

- HTTP errors;
- network failures;
- timeouts;
- aborted requests;
- malformed responses;
- provider unavailability;

the application MUST fail silently from the product user's perspective and MUST NOT perform an application-controlled retry.

Loss of analytics telemetry is acceptable.

Completeness of analytics data MUST NOT take precedence over:

- consent;
- identity isolation;
- data minimization;
- failure isolation;
- revocation semantics.

### 15.6 Observable guarantee

The application guarantees:

> At most one application-controlled dispatch per valid analytics event, with no application/SDK retry, queue, batching, behavioral buffering, persistence, or replay.

The application does NOT guarantee:

> Exactly one HTTP request will reach the provider at the wire/network level.

This distinction is part of the approved analytics transport contract.

---

## 16. Consent Lifecycle

### 16.1 Before consent

Before persisted opt-in:

- analytics transport MUST remain inert;
- no optional analytics event may be emitted;
- no event may be buffered for later transmission.

A rejected preference MUST produce the same analytics transport behavior as an undecided preference:

- no dispatch;
- no queue;
- no replay.

### 16.2 After consent

After persisted opt-in:

- only future events may be considered for dispatch;
- only the approved processing contract may activate;
- enabling analytics by itself MUST NOT emit an analytics event.

### 16.3 Revocation

When persisted analytics consent is revoked, the application MUST immediately:

1. invalidate the current analytics generation;
2. clear the active application analytics identity;
3. reject all future analytics events while consent remains disabled;
4. abort application-owned in-flight analytics requests where technically possible;
5. prevent application-controlled retries, replay, queue flushing, or delayed transmission.

Revocation guarantees that the application will not initiate new optional analytics collection after the revocation becomes authoritative.

Revocation cannot:

- retract a request already received by the provider;
- guarantee cancellation of bytes already handed to the browser/network stack;
- guarantee that the browser or network stack will not internally retransmit an already-dispatched HTTP request as part of transport recovery.

These limitations MUST NOT be represented as application retries or as permission to initiate additional collection.

Events generated while analytics is disabled MUST never be buffered for later transmission.

### 16.4 Re-enablement

Re-enabling analytics permits only new events generated after the new persisted opt-in state becomes authoritative.

No event generated while analytics was disabled may later be transmitted.

### 16.5 Logout and identity transition

Logout MUST:

- invalidate the current analytics generation;
- clear the authenticated analytics identity;
- abort application-owned in-flight requests where technically possible;
- prevent stale application state from initiating additional dispatches.

A subsequent user session MUST establish its analytics identity exclusively from the newly authenticated user and persisted consent state.

No application-controlled retry, queue, browser analytics persistence, device identifier, or anonymous identifier may bridge User A to User B.

Transport-level retransmission of an already-dispatched User A request does not authorize mutation or reassignment of that request to User B.

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

Returning-user analysis means analysis of repeated approved events associated with the same approved pseudonymous `distinct_id` across time.

It does NOT require:

- PostHog Person Profiles;
- native Lifecycle insights;
- saved Person cohorts;
- aliases;
- persistent device identity.

It must not answer questions such as:

- Which employee is performing best?
- Which individual searches for a particular sensitive subject?
- Where is a particular user physically located?
- What websites did an individual visit before Base Curricular?
- What does an individual's detailed browsing history reveal?

---

## 18. Technical Preflight Result

Engineering completed bounded, non-ingesting technical preflight of the approved profile-free model.

### 18.1 Identity feasibility

Verified:

1. stable Supabase UUID can be used as event-level `distinct_id`;
2. normal `identify()` is not required;
3. `$identify` is not required;
4. persistent Person Profiles are not required;
5. anonymous behavioral history is not required;
6. anonymous-to-identified linkage is not required;
7. persistent device identity is not required;
8. the six approved application events remain sufficient;
9. organization segmentation works via ordinary event properties;
10. returning-user analysis remains possible;
11. funnels/custom-event paths remain possible;
12. retention calculations remain possible.

### 18.2 Personless provider semantics

For clean identifiers not already associated with a PostHog Person:

- personless events can retain a stable analytical identity;
- event properties remain queryable;
- persistent Person properties are unnecessary;
- PostHog Groups are unnecessary for current organization segmentation.

Before Gate B, controlled validation identities MUST be verified not to have pre-existing Person/alias mappings that would invalidate the profile-free assumption.

### 18.3 SDK feasibility

The PostHog JS SDK can be configured to reduce identity/default metadata, but local testing found its retry/teardown behavior incompatible with the strongest approved no-buffering lifecycle guarantee.

The SDK is therefore not the preferred runtime transport for the revised SPEC-008 model.

### 18.4 Direct Capture API feasibility

A local cross-browser direct-transport prototype verified:

- undecided → zero dispatches;
- rejected → zero dispatches;
- persisted acceptance → future events only;
- revocation → future events dropped;
- re-enable → no replay;
- strict six-event taxonomy;
- strict property schemas;
- stable UUID identity;
- A→B user isolation;
- same-user later-session identity;
- no browser analytics persistence;
- no application retry;
- no queue;
- no batching;
- no unload flush;
- failure isolation;
- generation-scoped request ownership;
- in-flight abort on revocation/logout where possible.

Chromium may retransmit an already-issued HTTP request below application control. Section 15 defines the approved semantics for this limitation.

### 18.5 Technical readiness decision

Current technical state:

**IMPLEMENTATION READY — PROFILE-FREE CAPTURE TRANSPORT VERIFIED**

The technical transport decision includes the documented transport-level retransmission caveat.

This technical readiness does not authorize Gate B or external pilot activation.

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
- approved GeoIP removal;
- read-only verification of final provider configuration before Gate B.

The profile-free technical identity model and transport feasibility are no longer open Gate A questions.

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
4. Revised implementation conforms to the approved profile-free direct-transport model.
5. GeoIP is disabled.
6. Property allowlist is enforced.
7. Retention/deletion mechanism is evidenced.
8. Applicable processor/legal arrangement covers the validation.
9. PostHog roster, MFA and effective access are verified.
10. Controlled participants are defined.
11. Validation duration and expected interactions are bounded.
12. Production containment prevents accidental general pilot collection.
13. Stop/rollback responsibility is defined.
14. Validation-data deletion/cleanup is defined.
15. Intended test UUIDs are verified not to have existing PostHog Person/alias mappings that would invalidate profile-free validation.

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
- provider failure isolation;
- no application/SDK retry;
- duplicate behavior/deduplication where transport-level retransmission is observed.

Gate B evidence must distinguish:

- application dispatch;
- browser/network behavior;
- provider-ingested state.

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

Only the six approved semantic application events are initiated by the application.

### AC-04 — No normal identification

The approved implementation does not call normal PostHog `identify()` and does not generate `$identify`.

### AC-05 — No persistent Person Profiles

The controlled provider state demonstrates that approved analytics does not create persistent PostHog Person Profiles.

### AC-06 — No anonymous linkage

No pre-consent or anonymous behavioral history is linked to the authenticated user.

### AC-07 — Stable pseudonymous identity

Approved events support returning-user analysis through the approved pseudonymous event identity without profiles or linkage.

### AC-08 — Search privacy

No raw query, normalized query, hash, fingerprint or reconstructable search value reaches analytics.

### AC-09 — Property minimization

Actual outgoing and ingested payloads conform to the approved allowlist.

### AC-10 — No raw IP analytics storage

Raw client IP is not retained as an analytics event/property value.

Necessary transport-layer handling remains a separate infrastructure-processing question.

### AC-11 — No GeoIP

No user-location enrichment derived from IP is present.

### AC-12 — Auxiliary products excluded

No Session Replay, autocapture, heatmap or other out-of-scope PostHog product processes Base Curricular analytics under SPEC-008.

### AC-13 — No unapproved forwarding

No configured or manual analytics forwarding occurs without the required review.

### AC-14 — Environment isolation

Preview, Development and Test emit no analytics.

### AC-15 — Revocation

Once revocation becomes authoritative:

- no new analytics dispatch is initiated;
- future events are dropped;
- application-owned in-flight requests are aborted where technically possible;
- no application-controlled retry, replay, flush or delayed transmission occurs.

The application does not claim it can retract a request already received by the provider or suppress transport-level retransmission performed internally by the browser/network stack.

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

### AC-22 — Single application dispatch

Each valid analytics event causes at most one application-controlled transport dispatch.

No application or analytics SDK retry, batching, queueing, persistence, delayed replay or unload flush occurs.

Browser/network-stack retransmission of an already-dispatched request does not constitute an application retry.

### AC-23 — Failure without retry

HTTP errors, network failures, timeouts, aborts, malformed responses and provider failures do not trigger another application-controlled analytics dispatch.

Telemetry loss is acceptable.

### AC-24 — Re-enable without replay

Re-enabling analytics permits collection only for events generated after the new persisted opt-in becomes authoritative.

Events generated while analytics was disabled are never transmitted later.

### AC-25 — Cross-user transport isolation

Logout and user switching invalidate the previous analytics generation.

Application state from User A cannot initiate analytics dispatches using User B's identity, and no application-managed persistent analytics identity links the two users.

### AC-26 — Runtime taxonomy enforcement

Unknown event names, unsupported properties, malformed identifiers, invalid enums/counts, inherited-object tricks, accessors or malformed payload objects are rejected at runtime before dispatch.

TypeScript typing alone is not sufficient enforcement.

### AC-27 — Duplicate-tolerant ingestion

If transport-level retransmission produces duplicate delivery, any deduplication mechanism introduced by the implementation must use event-scoped technical metadata rather than an additional user/device identity and must remain within the approved privacy and retention contract.

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

The approved implementation direction is the profile-free direct Capture API transport established by technical preflight.

Engineering may choose internal abstractions and validation structure consistent with that model.

Engineering MAY introduce event-scoped technical metadata for deduplication only if it satisfies §15.4.

Engineering MUST NOT introduce:

- `identify()`;
- Person Profiles;
- aliases;
- additional persistent user/device identities;
- analytics queues;
- retries;
- behavioral buffering;
- broader property collection;

without returning:

`BLOCKED / DECISION REQUIRED`

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

Existing documentation describing normal `identify()`/SDK identity behavior must be reconciled after implementation.

---

## 25. Open Blockers

The following remain unresolved and materially block Gate B or external activation.

### Implementation

- existing SDK/`identify()` analytics boundary has not yet been replaced by the approved profile-free direct transport;
- strict runtime event/property allowlist is not yet the deployed implementation;
- GeoIP remains enabled in the provider account until an authorized configuration change;
- intended controlled-validation UUIDs must be checked for pre-existing Person/alias mappings.

These are implementation/configuration tasks under the approved contract, not open product decisions.

### Retention

- enforceable ≤12-month deletion mechanism remains unresolved;
- physical deletion, backup treatment, derived-data treatment and completion evidence remain unresolved.

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

They determine whether the implemented model can proceed to controlled enabled-state validation.

---

## 26. Current Lifecycle State

Current state:

**ACTIVE — PRODUCT MODEL APPROVED; PROFILE-FREE TRANSPORT IMPLEMENTATION READY; PRIVACY/LEGAL GATES PENDING**

Product direction is approved.

Technical preflight has confirmed:

- profile-free event identity is feasible;
- `identify()` is unnecessary;
- Person Profiles are unnecessary;
- anonymous linkage is unnecessary;
- device identity is unnecessary;
- organization segmentation is feasible without Groups;
- returning-user analysis is feasible;
- semantic funnels/paths/retention are feasible;
- direct Capture API transport satisfies the approved application-controlled lifecycle;
- exactly-once wire delivery is not a product requirement.

The current deployed implementation still uses the older SDK/`identify()` model and therefore requires bounded correction.

Gate B is not authorized.

External Pilot Analytics Activation Gate is CLOSED.

The next engineering activity is:

**Implement the approved profile-free direct Capture API transport and its strict runtime contract.**

The next Privacy/Legal activity is resolution of:

- applicable agreement;
- jurisdiction;
- transfer/subprocessor;
- privacy-rights;
- retention/deletion requirements.

The next Security activity is verification of:

- PostHog account roster;
- effective roles;
- MFA;
- privileged credential ownership.

No production analytics activation is authorized by this specification revision.