# SPEC-008 — Product Analytics & Pilot Observability

**Status:** ACTIVE — ANALYTICS-DISABLED HOSTED VALIDATED; ENABLED-STATE GATED (see §42)
**Product:** D+ Base Curricular  
**Primary capability:** Product analytics and pilot observability  
**Analytics platform:** PostHog Cloud EU  
**Depends on:** Existing authentication, organization membership, Library/navigation architecture, Admin organization/user management, and authoritative privacy contracts  
**Does not depend on:** Marketing analytics, CRM, experimentation, Session Replay, advertising analytics, or production support tooling  
**Reconciled:** 2026-10-01

---

# 1. Purpose

D+ Base Curricular is preparing for an external-organization pilot.

The product needs a structured way to understand whether participating organizations can successfully discover, navigate, search, explore, and return to Base Curricular without relying only on qualitative stakeholder feedback.

This SPEC introduces a bounded **Product Analytics & Pilot Observability** capability.

The purpose of analytics is to answer specific product questions about:

- organizational adoption;
- initial exploration;
- content discovery;
- content interest;
- returning usage;
- UX friction during the pilot.

Analytics exists to improve the product and understand pilot adoption.

It must not become:

- employee monitoring;
- individual performance evaluation;
- advertising infrastructure;
- behavioral profiling;
- user scoring;
- or generalized surveillance.

---

# 2. Authoritative Product Contracts

This SPEC implements decisions already established in the following product contracts:

```text
docs/PRIVACY_AND_DATA_COLLECTION.md
docs/PRIVACY_NOTICE.md
docs/PRIVACY_UX_CONTRACT.md
docs/TERMS_OF_USE.md
```

These documents are authoritative for privacy, user choice, Terms/analytics separation, legal responsibility, and user-facing behavior.

This SPEC must not redefine those contracts.

If implementation discovers a technical constraint that would require changing them, return:

**BLOCKED / DECISION REQUIRED**

rather than changing product behavior for implementation convenience.

---

# 3. Measurement Principle

Instrumentation begins with a product question, not a UI interaction.

Every tracked event must be traceable through:

```text
Product question
      ↓
Why we care
      ↓
Observable signal
      ↓
Event
      ↓
Properties
      ↓
Interpretation
```

An interaction must not be tracked merely because PostHog makes it possible.

Events without a defined product purpose are out of scope.

The initial implementation deliberately favors a small number of meaningful semantic events over comprehensive interaction tracking.

---

# 4. Current State

Base Curricular already provides:

- authenticated access;
- organization-aware users;
- organization and membership administration;
- Library exploration;
- search;
- filtering;
- content navigation;
- external references;
- downloadable resources;
- established authorization boundaries;
- established privacy and Terms contracts.

SPEC-007 established the current navigation and interaction contracts.

SPEC-009 established the current Admin organization and user-management capability required before external-organization expansion.

The product now has authoritative privacy contracts defining:

- optional analytics;
- affirmative user choice;
- preference persistence;
- data minimization;
- analytics identity;
- PostHog Cloud EU;
- environment isolation;
- Session Replay prohibition for the initial pilot;
- Terms/analytics separation;
- user-facing privacy behavior.

There is not yet an implemented canonical product-analytics capability.

---

# 5. Problem / Gap

Opening Base Curricular to external organizations creates a product-learning requirement that application logs and stakeholder feedback alone cannot satisfy.

The team needs to distinguish between situations such as:

- an organization being onboarded but never exploring the product;
- users entering once and never returning;
- users reaching the Library but not exploring content;
- users searching but not reaching content;
- filters being unused or associated with abandoned exploration;
- some types of content receiving more exploration than others;
- organizations using Base Curricular in different ways;
- UX friction causing exploration to stop.

Technical logs can describe system activity but do not provide a purpose-built model of these product journeys.

Conversely, tracking every interaction would create unnecessary telemetry without a clear product purpose.

The platform therefore requires a deliberately small, privacy-conscious analytics model tied directly to pilot learning objectives.

---

# 6. Product Decisions

## D-008-01 — Product analytics

Base Curricular will introduce dedicated product analytics for the external-organization pilot.

Analytics primarily supports:

- adoption analysis;
- product discovery;
- UX investigation;
- path analysis;
- retention analysis;
- organization-level usage analysis.

Marketing attribution is not part of this capability.

---

## D-008-02 — Measurement before instrumentation

No analytics event may be introduced without a defined analytical purpose.

The measurement plan must identify:

- product question;
- why it matters;
- observable signal;
- supporting event;
- relevant properties;
- interpretation.

Instrumentation must not expand simply because the provider supports additional capture.

---

## D-008-03 — Analytics provider

The approved provider is:

**PostHog Cloud EU**

Approved project:

```text
https://eu.posthog.com/project/289698
```

The technical preflight must verify integration compatibility with the current application architecture.

A material technical incompatibility must return:

**BLOCKED / DECISION REQUIRED**

The implementation agent may not silently replace PostHog or change processing region.

---

## D-008-04 — Organization-first analysis

The primary analytical perspective for the pilot is the **organization**.

Analytics should support questions such as:

- Which organizations have product activity?
- Which organizations progress into meaningful exploration?
- Which organizations return?
- How do discovery patterns differ between organizations?
- Which content types are explored across organizations?

The application remains authoritative for:

- organizations;
- memberships;
- users;
- roles;
- permissions.

PostHog only observes approved product usage.

Organization-first analysis must not become organization ranking.

---

## D-008-05 — Meaningful activity remains observational

The pilot should distinguish:

```text
Organization onboarded
```

from:

```text
Organization demonstrating meaningful product activity
```

This SPEC does not permanently define meaningful activity through an arbitrary threshold such as:

- login count;
- event count;
- number of opened resources;
- time spent;
- search count.

Pilot evidence should first reveal useful patterns.

Temporary analytical definitions may be used for investigation if clearly labeled as exploratory.

No permanent organization engagement score is introduced.

---

## D-008-06 — Optional analytics

Product analytics is optional.

The authoritative privacy UX is defined in:

```text
docs/PRIVACY_UX_CONTRACT.md
```

Analytics is:

```text
OFF by default
```

and remains OFF until the authenticated user affirmatively enables it.

Terms acceptance does not enable analytics.

Rejecting analytics does not reduce normal Base Curricular functionality.

---

## D-008-07 — User-owned preference

The analytics preference belongs to the authenticated user.

An organization or Base Curricular Admin cannot enable optional analytics on behalf of all users.

The product must distinguish:

```text
undecided
rejected
accepted
```

even though both `undecided` and `rejected` result in analytics being OFF.

---

## D-008-08 — Preference persistence

Analytics preference must be persisted in the authoritative application data layer.

At minimum, the model must preserve the semantics of:

```text
user_id
analytics_enabled
analytics_decided_at
privacy_notice_version
consent_version
updated_at
```

The exact schema is implementation freedom provided these semantics remain recoverable.

Browser-local state must not be the sole source of truth.

---

## D-008-09 — Data minimization

Only information necessary for approved product analysis may be sent to PostHog.

Do not intentionally send unnecessary:

- names;
- email addresses;
- organization names;
- organization domains;
- authentication credentials;
- passwords;
- access tokens;
- free-text user input;
- uploaded documents;
- private content text;
- raw search queries;
- original attachment filenames;
- complete external URLs;
- unrelated application data.

Use pseudonymous or canonical internal identifiers where they satisfy the analytical requirement.

---

## D-008-10 — Search privacy

Raw search queries must not be sent to PostHog.

Prohibited properties include:

```text
query
search_text
q
```

or any equivalent property containing search text.

Search analytics should answer whether search is being used and whether it supports exploration without knowing what the person typed.

---

## D-008-11 — Analytics is not operational state

PostHog must not become authoritative for:

- users;
- organizations;
- memberships;
- roles;
- permissions;
- privacy preferences;
- content;
- publication state;
- curriculum relationships;
- authorization;
- audit history.

Analytics consumes observations.

It does not own application state.

---

## D-008-12 — No individual performance monitoring

Analytics must not:

- rank users;
- score users;
- evaluate employee performance;
- evaluate whether an individual is sufficiently active;
- infer political preferences;
- infer sensitive personal characteristics;
- determine eligibility;
- drive consequential automated decisions.

Pseudonymous user identity may be used where necessary for approved:

- journey analysis;
- retention;
- deduplication;
- organization-level analysis.

The purpose remains product learning, not individual evaluation.

---

## D-008-13 — Session Replay disabled

**Session Replay is disabled for the initial pilot.**

It is outside the implementation scope of SPEC-008.

The implementation must not:

- enable replay;
- configure replay sampling;
- record sessions;
- present replay as part of analytics preferences;
- treat analytics acceptance as replay acceptance.

Any future Session Replay proposal requires a separate product/privacy/security decision.

---

## D-008-14 — Semantic capture only

The initial analytics capability uses explicitly defined semantic events.

The implementation must not rely on:

- broad autocapture;
- arbitrary click capture;
- form capture;
- arbitrary text capture;
- unsafe automatic pageviews;
- automatic search capture.

PostHog defaults must be configured so they cannot silently expand collection beyond this SPEC.

---

## D-008-15 — Production-only analytics

Optional product analytics is available only in the intended production environment.

```text
Production
→ available subject to persisted user preference

Preview
→ no-op

Development
→ no-op

Test
→ no-op
```

Non-production environments must never send telemetry to the production PostHog project.

---

## D-008-16 — Fail safely

Analytics is non-critical functionality.

Provider failure must not affect:

- authentication;
- authorization;
- Library navigation;
- search;
- filtering;
- content opening;
- downloads;
- external references;
- Admin functionality;
- normal product use.

Privacy must fail closed.

If the application cannot reliably resolve or persist an affirmative analytics preference, analytics remains OFF.

---

# 7. Measurement Plan

The initial pilot has five primary product questions.

---

## MP-01 — Are organizations adopting Base Curricular?

### Product question

Are invited organizations progressing from onboarding into real product exploration?

### Why we care

Account creation alone does not demonstrate adoption.

We need to distinguish:

```text
Onboarded
    ↓
Library reached
    ↓
Meaningful exploration
    ↓
Returned usage
```

### Signals

- organization has approved product activity;
- organization reaches the Library;
- organization explores content;
- organization returns in a later period.

### Supporting events

```text
library_viewed
content_opened
```

combined where appropriate with approved pseudonymous:

```text
organization_id
user_id
```

### Interpretation

These signals support adoption analysis.

They must not become a permanent automated organization score.

---

## MP-02 — Can users begin exploring Base Curricular?

### Product question

After entering the authenticated product, are users able to reach the main exploration experience and begin interacting with content?

### Why we care

Successful authentication does not necessarily mean successful product exploration.

### Conceptual journey

```text
Authenticated product use
       ↓
Library
       ↓
Search / Filter / Browse
       ↓
Content opened
```

This is not a mandatory linear funnel.

A user may successfully browse directly to useful content without searching or filtering.

### Supporting events

```text
library_viewed
search_performed
filter_applied
content_opened
```

---

## MP-03 — How do users discover content?

### Product question

Which discovery mechanisms are associated with content exploration?

### Why we care

Search, filtering, and direct browsing represent different discovery patterns.

Understanding them may reveal where navigation helps or creates friction.

### Conceptual paths

```text
Library
 ├── Search ───────→ Content
 ├── Filter ───────→ Content
 └── Browse ───────→ Content
```

### Signals

- search performed;
- filter applied;
- content opened;
- event sequence within approved analytics data.

### Supporting events

```text
search_performed
filter_applied
content_opened
```

No dedicated `search_result_selected` event is required for the initial pilot.

Where useful, the relationship between search/filter activity and subsequent content opening should be derived from the semantic event sequence rather than additional click instrumentation.

### Interpretation

No discovery method is considered inherently superior.

The pilot should reveal how organizations naturally explore the product.

---

## MP-04 — What content generates interest?

### Product question

Which types of Base Curricular content are being explored?

### Why we care

Different organizations may derive value from different content structures.

### Supporting events

```text
content_opened
external_reference_opened
content_downloaded
```

`content_opened` may include approved properties such as:

```text
content_id
content_type
```

Canonical initial `content_type` values are:

```text
module
material
institution
```

A reference is represented through `external_reference_opened` rather than inventing an additional canonical content type unless repository evidence establishes otherwise.

### Interpretation

Analytics may compare patterns across content types and organizations.

Opening behavior indicates interest or exploration.

It must not be interpreted as proof of educational quality or effectiveness.

---

## MP-05 — Do users and organizations return?

### Product question

Do users and organizations return after initial exploration?

### Why we care

Initial curiosity differs from continued adoption.

Returning usage provides useful pilot evidence about whether Base Curricular continues to provide value.

### Analysis levels

#### Pseudonymous user return

Did a user who enabled analytics return and generate approved product activity in a later period?

#### Organization return

Did an organization generate approved activity in a later period, potentially through different consenting users?

Organization return is particularly important because institutional adoption may involve multiple people.

### Supporting data

Retention should be derived from timestamps and approved semantic events.

Do not create:

```text
session_started
user_returned
```

solely for retention if the same analysis can be derived from approved event history.

### Privacy interpretation

Analytics cannot observe optional product behavior from users who have not enabled analytics.

Reporting must therefore not present PostHog analytics as a complete census of all Base Curricular usage.

---

# 8. Canonical Event Taxonomy

The initial canonical taxonomy is:

```text
library_viewed
search_performed
filter_applied
content_opened
external_reference_opened
content_downloaded
```

This list is intentionally small.

The implementation must not add events merely because an interaction exists.

A future event such as `search_suggestion_selected` requires a defined measurement need and privacy-compatible product decision before addition.

---

# 9. Event Semantics

Events describe product actions, not UI implementation details.

Good:

```text
search_performed
content_opened
filter_applied
```

Do not introduce events such as:

```text
button_clicked
card_clicked
modal_opened
tab_clicked
blue_button_clicked
click_23
```

Instrumentation should survive reasonable UI refactoring without changing analytical meaning.

---

# 10. Approved Properties

Where appropriate, events may include approved properties such as:

```text
organization_id
user_id
user_role
environment

content_id
content_type

filter_type

result_count
has_results

attachment_id
```

Not every event requires every property.

Properties must have a defined measurement purpose.

They must represent authoritative application concepts rather than analytics-specific domain inventions.

---

# 11. Analytics Identity

The approved PostHog identity is pseudonymous.

The Supabase Auth UUID may be used as:

```text
distinct_id
```

Approved identity/context may include:

```text
user_id
organization_id
user_role
environment
```

Do not intentionally identify analytics users using:

```text
name
email
organization_name
organization_domain
```

PostHog identity is not an authorization mechanism.

---

# 12. Search Measurement

`search_performed` may capture:

```text
organization_id
user_id
result_count
has_results
environment
```

where appropriate.

It must not capture:

```text
query
search_text
q
```

or equivalent raw search content.

Initial analysis should support questions such as:

- How often is search used among users who enabled analytics?
- How often does search produce results?
- Is search followed by content exploration?
- Are repeated searches associated with exploration stopping?

The implementation must also prevent search text from leaking through URLs, automatic pageviews, or automatic capture.

---

# 13. Filter Measurement

Approved initial filter dimensions are:

```text
axis
entity
country
theme
```

The Library presentation mode:

```text
view
```

is not a content filter.

Initial analytics should prefer recording the filter dimension rather than unnecessary human-readable selected values.

Any future collection of filter values requires a defined analytical purpose and privacy review where appropriate.

---

# 14. Content Measurement

The canonical initial content types are:

```text
module
material
institution
```

`content_opened` should use stable internal identifiers.

Do not transmit content bodies, descriptions, teaching notes, or other private text where an internal identifier is sufficient.

---

# 15. External Reference Measurement

`external_reference_opened` may include:

```text
organization_id
user_id
content_id
content_type
environment
```

where applicable.

The complete destination URL must not be transmitted during the initial pilot unless separately approved.

---

# 16. Download Measurement

`content_downloaded` may include:

```text
organization_id
user_id
content_id
content_type
attachment_id
environment
```

where applicable.

Original filenames should not be transmitted where `attachment_id` is sufficient.

---

# 17. Privacy Choice Integration

Analytics initialization must follow the authoritative sequence defined in `docs/PRIVACY_UX_CONTRACT.md`.

Conceptually:

```text
Authentication
      ↓
Authorization / organization resolution
      ↓
Load persisted analytics preference
      ↓
Preference = ON?
   ↙             ↘
 No              Yes
 ↓                ↓
No analytics   Initialize PostHog
                  ↓
              Identify pseudonymously
                  ↓
              Approved future events
```

No optional analytics event may be emitted before an affirmative persisted decision.

---

# 18. Initial Privacy Choice

For users without a recorded analytics decision:

```text
Analytics = OFF
```

The product must provide:

```text
Rechazar analítica
Configurar
Aceptar
```

and access to:

```text
Aviso de Privacidad
```

Exact user-facing behavior and copy are governed by:

```text
docs/PRIVACY_UX_CONTRACT.md
docs/PRIVACY_NOTICE.md
```

SPEC-008 must implement those contracts rather than create alternative consent UX.

---

# 19. Data Preferences

The product must provide:

**Preferencias de datos**

with the two conceptual categories defined by the privacy UX contract:

```text
Necesario
Analítica del producto
```

The user must be able to change optional analytics between:

```text
OFF
ON
```

Changing:

```text
OFF → ON
```

enables only future approved analytics.

Changing:

```text
ON → OFF
```

must stop future optional analytics and reset/clear analytics identity as appropriate.

Historical deletion is handled through the privacy-rights process rather than through the analytics toggle.

---

# 20. Logout Isolation

On sign-out:

- analytics identity must be reset or cleared;
- another user must never inherit the previous user's analytics identity;
- the authoritative persisted preference remains associated with the user.

On the next authenticated session, analytics initialization occurs only after identity, authorization, organization, and preference resolution.

---

# 21. Automatic Collection

The initial pilot uses semantic capture only.

The PostHog integration must ensure:

```text
Autocapture                 OFF
Unsafe automatic pageviews  OFF
Automatic form capture      OFF
Arbitrary text capture      OFF
Search text capture         OFF
Session Replay              OFF
```

If the SDK or framework defaults enable any of these behaviors, the implementation must explicitly disable them.

---

# 22. Session Replay

Session Replay is:

**OUT OF SCOPE / DISABLED**

for SPEC-008.

No Session Replay implementation, masking configuration, sampling strategy, testing, or production validation is required because replay must not be enabled.

A future replay capability requires a separate product/privacy/security decision.

---

# 23. Environment Isolation

Environment behavior is authoritative:

| Environment | Optional analytics |
|---|---|
| Production | Available subject to persisted user preference |
| Preview | Disabled / no-op |
| Development | Disabled / no-op |
| Test | Disabled / no-op |

The implementation agent may choose the technical mechanism that enforces this behavior.

It may not choose a strategy that sends Preview, Development, or Test events to the production PostHog project and relies only on later filtering.

Tests must never send real telemetry to production PostHog.

---

# 24. Analytics Failure Behavior

Analytics must fail safely.

If PostHog:

- fails to initialize;
- is unavailable;
- is blocked;
- times out;
- rejects an event;
- or lacks configuration,

normal Base Curricular functionality continues.

Provider availability must not affect the stored user preference.

---

# 25. Preference Failure Behavior

Privacy fails closed.

If an affirmative preference cannot be persisted reliably:

```text
Analytics remains OFF
```

The product must not infer consent from:

- UI state;
- button click alone;
- browser-local state;
- previous unpersisted interaction.

A clear retryable user-facing error should be provided where appropriate.

---

# 26. Pilot Analytics Views

Initial analysis should remain compact and organized around five perspectives.

## 26.1 Pilot Overview

Candidate indicators:

```text
Organizations onboarded
Organizations represented in consenting analytics
Organizations with observed exploration
Organizations with observed returning activity

Observed active users
Observed returning users

Library views
Search usage
Filter usage
Content opened
External references opened
Downloads
```

Analytics-derived counts must not be presented as complete platform-wide usage where non-consenting users are excluded.

---

## 26.2 Journeys

Analyze paths such as:

```text
Library
→ discovery action
→ content
```

and:

```text
Search
→ content opened
```

Journeys must not assume one mandatory successful path.

---

## 26.3 Organizations

Allow analysis of observed patterns by canonical `organization_id`, including:

- presence of analytics activity;
- returning observed activity;
- discovery mechanisms;
- content types explored.

The goal is understanding adoption patterns.

Organizations must not be ranked.

---

## 26.4 Content

Analyze:

- content types explored;
- frequently opened content identifiers;
- external-reference use;
- downloads;
- differences in observed exploration across organizations;
- discovery paths associated with content.

Opening or downloading content indicates observed interest, not educational effectiveness.

---

## 26.5 Retention

Analyze:

- pseudonymous consenting-user return;
- organization return represented through consenting-user activity.

Retention reporting must acknowledge the opt-in nature of the dataset.

---

# 27. Explicitly Out of Scope

SPEC-008 does not introduce:

- Session Replay;
- marketing campaign attribution;
- advertising analytics;
- advertising audiences;
- CRM integration;
- user scoring;
- employee monitoring;
- organization ranking;
- raw search-term analysis;
- names/emails in analytics;
- A/B testing;
- feature flags;
- automated personalization;
- recommendation algorithms;
- behavioral targeting;
- automated decisions based on analytics;
- custom analytics warehouse;
- exhaustive UI interaction tracking;
- every-click capture;
- mouse movement capture;
- scroll-depth tracking;
- arbitrary component telemetry;
- replacement of application logs;
- replacement of security monitoring;
- replacement of error monitoring.

Google Analytics is not part of this SPEC.

Dedicated error observability such as Sentry remains a separate product/technical decision.

---

# 28. Impact Surface

Expected implementation impact includes:

- analytics integration boundary;
- authenticated application shell;
- authentication/logout lifecycle;
- organization context;
- analytics-preference persistence;
- privacy-choice UX;
- Data Preferences UX;
- Library;
- search;
- filters;
- content navigation;
- external references;
- downloads;
- environment configuration;
- tests;
- deployment configuration.

Expected knowledge impact includes review/reconciliation of:

```text
docs/ARCHITECTURE.md
docs/SECURITY.md
docs/DECISIONS.md
docs/PRODUCT.md
docs/PRIVACY_AND_DATA_COLLECTION.md
docs/PRIVACY_NOTICE.md
docs/PRIVACY_UX_CONTRACT.md
docs/TERMS_OF_USE.md
resources/specs/README.md
```

Authoritative privacy contracts should be referenced rather than duplicated.

---

# 29. Expected Behavior

Once implemented:

1. analytics remains OFF until an authenticated user affirmatively enables it;
2. Terms acceptance does not enable analytics;
3. rejection preserves normal product access;
4. analytics preference persists per authenticated user;
5. undecided and rejected states remain distinguishable;
6. users can change their preference later;
7. OFF → ON enables only future approved telemetry;
8. ON → OFF stops future optional telemetry;
9. logout clears analytics identity;
10. production emits only approved semantic events;
11. Preview, Development, and Test emit no production analytics;
12. events use approved pseudonymous identity/context;
13. organizations can be analyzed through canonical identifiers;
14. search behavior can be analyzed without raw search text;
15. content exploration can be analyzed without transmitting private content;
16. Session Replay remains disabled;
17. autocapture and unsafe automatic collection remain disabled;
18. analytics failure does not affect product functionality;
19. preference persistence failure cannot accidentally enable analytics;
20. reporting acknowledges that opt-in analytics is not a complete census of all product usage.

---

# 30. Acceptance Criteria

## AC-01 — Measurement plan

Every canonical event maps to at least one approved product question.

## AC-02 — Centralized integration

The application has one documented analytics integration boundary rather than unrelated PostHog calls distributed throughout the product.

## AC-03 — Canonical taxonomy

Only the approved initial events are emitted:

```text
library_viewed
search_performed
filter_applied
content_opened
external_reference_opened
content_downloaded
```

## AC-04 — Default OFF

A user with no persisted analytics decision emits no optional analytics.

## AC-05 — Separate Terms decision

Accepting Terms does not enable optional analytics.

## AC-06 — Explicit acceptance

Analytics initializes for an authenticated user only after an affirmative preference is successfully persisted.

## AC-07 — Rejection

Rejecting analytics persists the decision and preserves normal product functionality.

## AC-08 — Preference management

The authenticated user can access `Preferencias de datos` and change optional analytics between OFF and ON.

## AC-09 — Revocation

Changing ON → OFF stops future optional analytics and resets/clears analytics identity appropriately.

## AC-10 — Re-enablement

Changing OFF → ON enables only future approved analytics.

No historical disabled-period behavior is retroactively submitted.

## AC-11 — Undecided versus rejected

The application can distinguish no decision from explicit rejection.

## AC-12 — Logout isolation

Signing out prevents another user from inheriting the previous user's analytics identity.

## AC-13 — Organization segmentation

Approved analytics events can be segmented by canonical organization identifier where appropriate.

## AC-14 — No unnecessary PII

Inspection of emitted payloads confirms prohibited personal information is not intentionally transmitted.

## AC-15 — Search privacy

Raw search text is absent from analytics payloads and is not leaked through automatic URL/pageview capture.

## AC-16 — Content privacy

Private content text is not transmitted where canonical identifiers are sufficient.

## AC-17 — Filter semantics

Analytics uses only canonical filter dimensions approved for the initial pilot.

## AC-18 — Environment isolation

Preview, Development, and Test do not send telemetry to the production PostHog project.

## AC-19 — Semantic capture

Autocapture, automatic form/text capture, unsafe pageviews, and equivalent broad collection are disabled.

## AC-20 — Session Replay

Session Replay is disabled.

## AC-21 — Failure isolation

Blocking or disabling PostHog does not break core application behavior.

## AC-22 — Preference failure

Failure to persist a new affirmative preference never enables analytics accidentally.

## AC-23 — Initial exploration

Approved analytics can represent the main observed paths from Library usage into content exploration.

## AC-24 — Discovery analysis

Search, filtering, direct browsing, and content opening can be meaningfully analyzed without dedicated click-level events.

## AC-25 — Content analysis

`content_opened` supports canonical content type and identifier analysis.

External references and downloads are observable through their dedicated approved events.

## AC-26 — Retention

The team can analyze returning observed usage at both pseudonymous-user and organization levels.

## AC-27 — Opt-in interpretation

Pilot reporting does not present PostHog activity as a complete census of all Base Curricular usage.

## AC-28 — Meaningful activity remains exploratory

No permanent user or organization engagement score or arbitrary adoption threshold is introduced.

## AC-29 — Existing authorization preserved

Analytics changes no authorization, organization-access, publication, archive, or governance rule.

## AC-30 — Privacy UX

Implementation satisfies the acceptance criteria in:

```text
docs/PRIVACY_UX_CONTRACT.md
```

## AC-31 — Accessibility and responsive privacy UX

Privacy choice and Data Preferences satisfy the accessibility and responsive requirements established by the privacy UX contract.

## AC-32 — Documentation

Relevant architecture, security, decisions, deployment/configuration, privacy references, and specification indexes reflect the verified implementation after closure.

---

# 31. Testing Requirements

Implementation must include automated tests for the analytics and preference boundaries.

At minimum verify:

- no analytics before affirmative preference;
- affirmative preference persistence before initialization;
- rejection persistence;
- undecided versus rejected behavior;
- OFF → ON;
- ON → OFF;
- logout identity reset;
- expected event emission;
- canonical event names;
- approved property semantics;
- organization association;
- content association;
- absence of prohibited identity properties;
- absence of raw search text;
- absence of private content text where identifiers suffice;
- environment guards;
- PostHog no-op outside production;
- autocapture disabled configuration;
- Session Replay disabled configuration;
- safe behavior when PostHog is unavailable;
- fail-closed behavior when preference persistence fails;
- Terms acceptance does not enable analytics.

Tests must never send real telemetry to the production PostHog project.

Hosted validation must verify actual browser payload behavior before pilot analytics is enabled externally.

---

# 32. Security Requirements

Analytics must not weaken existing security boundaries.

In particular:

- Supabase Auth remains authoritative for authentication;
- live Base Curricular membership remains authoritative for access;
- RLS remains authoritative for database access;
- organization isolation remains enforced by application/database security;
- private content remains protected;
- Storage authorization remains protected;
- audit mechanisms remain independent;
- PostHog is never an authorization source.

Only client-safe PostHog configuration may be exposed to the browser.

Never expose:

- Supabase service-role credentials;
- Auth Admin credentials;
- privileged PostHog credentials;
- server secrets;
- access tokens;
- equivalent privileged configuration.

---

# 33. Analytics Access

Access to the PostHog project is separate from the Base Curricular `Admin` role.

Being an application Admin does not automatically grant PostHog access.

PostHog access must be restricted to authorized Democracia+ personnel who require it for legitimate:

- product;
- research;
- technical;
- privacy;
- or administrative purposes.

Final operational access membership must be documented before external pilot analytics activation.

---

# 34. Retention

Initial analytics event retention is:

**12 months**

The implementation/operational setup must verify that this retention is configured or otherwise enforced.

Retention should be reviewed after the pilot.

It must not be extended merely because longer provider retention is technically available.

---

# 35. Implementation Freedom

The implementation agent may determine:

- PostHog SDK compatible with the current stack;
- analytics wrapper/module structure;
- client/server boundaries;
- preference table/schema naming;
- API/RPC structure;
- state-management approach;
- initialization mechanics;
- loading/error presentation;
- technical event dispatch mechanism;
- exact privacy component structure;
- exact responsive layout;
- placement of `Preferencias de datos`;
- technical testing strategy.

The implementation agent may not independently change:

- analytics default OFF;
- affirmative opt-in;
- direct rejection;
- Terms/analytics separation;
- user-owned preference;
- persistent preference;
- normal access after rejection;
- canonical event taxonomy;
- approved property constraints;
- raw-search prohibition;
- pseudonymous identity requirements;
- no names/emails in analytics;
- no advertising;
- no individual performance analysis;
- PostHog Cloud EU;
- production-only analytics;
- Session Replay disabled;
- semantic-capture-only requirement;
- 12-month initial retention;
- fail-closed privacy behavior;
- existing authorization semantics.

A technical constraint requiring one of these changes must return:

**BLOCKED / DECISION REQUIRED**

---

# 36. Technical Preflight Refresh

Before moving SPEC-008 from `planned/` to `active/`, perform a repository-grounded technical preflight against the current `main`.

The previous analytics preflight predates:

- completion of SPEC-009;
- final privacy contract;
- Privacy Notice;
- Terms of Use;
- Privacy UX Contract.

The refresh should validate implementation facts, not reopen settled product decisions.

## Architecture

Verify:

- current framework/runtime;
- current application-shell boundaries;
- appropriate centralized PostHog integration point;
- client/server rendering implications;
- authentication lifecycle;
- logout lifecycle;
- current organization-context source;
- current role source;
- current production/environment detection.

## Existing telemetry

Search for:

- analytics dependencies;
- PostHog packages/configuration;
- telemetry utilities;
- monitoring;
- logging;
- existing event tracking;
- analytics environment variables.

Avoid duplicate infrastructure.

## Privacy preference persistence

Determine the smallest safe implementation for the authoritative semantics:

```text
user_id
analytics_enabled
analytics_decided_at
privacy_notice_version
consent_version
updated_at
```

Verify:

- RLS requirements;
- read/write ownership;
- migration requirements;
- server/client boundary;
- behavior for existing users;
- behavior for users without a decision.

## Product journeys

Validate actual instrumentation points for:

```text
library_viewed
search_performed
filter_applied
content_opened
external_reference_opened
content_downloaded
```

Do not introduce events for obsolete or nonexistent behavior.

## Data

Confirm authoritative sources for:

```text
user_id
organization_id
user_role
content_id
content_type
filter_type
attachment_id
```

## Search

Verify:

- where search state is stored;
- whether query text appears in URL parameters;
- whether any analytics initialization could capture those URLs;
- safe instrumentation point for `result_count` and `has_results`.

## Privacy UX

Verify implementation surfaces for:

- first privacy choice;
- `Preferencias de datos`;
- Privacy Notice access;
- preference error state;
- logout reset;
- responsive behavior;
- accessibility.

## PostHog configuration

Verify that the chosen SDK can enforce:

```text
Autocapture OFF
Unsafe automatic pageviews OFF
Session Replay OFF
Production-only initialization
Consent-gated initialization
Identity reset
```

## Deployment

Confirm:

- production-safe public project key handling;
- server/client secret boundaries;
- environment configuration;
- Preview/Development/Test no-op behavior.

## Testing

Identify existing test patterns suitable for:

- preference persistence;
- analytics wrapper behavior;
- privacy UI;
- environment guards;
- emitted payload inspection.

---

# 37. Implementation Activation Gate

SPEC-008 may move from:

```text
resources/specs/planned/
```

to:

```text
resources/specs/active/
```

with status:

**ACTIVE — IMPLEMENTATION READY**

when:

1. this reconciled product contract is in the repository;
2. the technical preflight refresh finds no unresolved architecture/data/security blocker;
3. PostHog Cloud EU integration is technically compatible;
4. preference persistence can be implemented safely;
5. the six canonical events map to real current product behavior;
6. approved identity/context sources are confirmed;
7. production-only/no-op environment behavior is enforceable;
8. privacy UX is implementable without changing its authoritative contract;
9. no implementation question requires inventing product behavior.

Legal review is **not required to begin implementation** provided external optional analytics remains disabled until the external activation gate is satisfied.

---

# 38. External Pilot Analytics Activation Gate

Implementation readiness and external analytics activation are separate gates.

Optional analytics must not be enabled for external-pilot users until:

1. implementation is complete and validated;
2. emitted browser/network payloads have been inspected;
3. zero optional telemetry before opt-in is verified;
4. raw search leakage is ruled out;
5. prohibited PII leakage is ruled out;
6. Session Replay is verified disabled;
7. autocapture/unsafe automatic collection is verified disabled;
8. PostHog Cloud EU destination is verified;
9. 12-month retention is configured or operationally enforced;
10. PostHog access is restricted to authorized personnel;
11. Privacy Notice matches actual behavior;
12. Terms/analytics separation matches actual behavior;
13. privacy-choice UX matches `docs/PRIVACY_UX_CONTRACT.md`;
14. legal review required by `docs/PRIVACY_AND_DATA_COLLECTION.md` has been completed for the intended external pilot.

Until this gate is satisfied, the capability may exist technically while external optional analytics remains disabled.

---

# 39. Completion Evidence

SPEC-008 is not complete merely because:

- the PostHog SDK is installed;
- a preference table exists;
- events appear in a development console;
- or an implementation agent reports success.

Closure requires evidence that:

- authoritative privacy UX is implemented;
- analytics remains OFF before affirmative preference;
- Terms acceptance does not enable analytics;
- preference persistence works;
- rejection works without access penalty;
- revocation works;
- logout resets analytics identity;
- six canonical events emit correctly;
- approved properties are correct;
- organization segmentation works;
- search analytics contains no raw query;
- prohibited PII is absent;
- private content is not unnecessarily transmitted;
- Session Replay is disabled;
- autocapture is disabled;
- non-production telemetry is no-op;
- provider failure does not affect product behavior;
- preference failure is fail-closed;
- pilot reporting can answer approved measurement questions within the limitations of opt-in data;
- automated tests pass;
- required real-stack validation passes;
- appropriate hosted validation passes;
- external activation remains gated until legal requirements are satisfied;
- durable documentation is reconciled.

After implementation, an independent review must compare:

```text
authoritative product contracts
        ↓
SPEC-008
        ↓
actual implementation
        ↓
tests
        ↓
hosted behavior
        ↓
durable documentation
```

Only after required implementation and coherence validation should SPEC-008 move to:

**COMPLETED / COHERENCE VERIFIED**

---

# 40. Knowledge Updates Required

After implementation and validation, review and reconcile at minimum:

```text
docs/ARCHITECTURE.md
docs/SECURITY.md
docs/DECISIONS.md
docs/PRODUCT.md
resources/specs/README.md
```

Update privacy contracts only if verified implementation or an approved product decision requires reconciliation.

Do not duplicate the privacy UX contract or event taxonomy unnecessarily across documentation.

The canonical privacy behavior remains in:

```text
docs/PRIVACY_AND_DATA_COLLECTION.md
docs/PRIVACY_UX_CONTRACT.md
docs/PRIVACY_NOTICE.md
docs/TERMS_OF_USE.md
```

The canonical analytics measurement/event implementation contract remains in this SPEC.

---

# 41. Current State Decision

SPEC-008 is currently:

**PLANNED — DECISION READY / PRODUCT CONTRACT RECONCILED**

The product decisions required for implementation are established.

The remaining gate before activation is:

**TECHNICAL PREFLIGHT REFRESH**

That refresh must verify current implementation facts after SPEC-009 and the privacy-contract additions.

If no blocker is found, activate SPEC-008 separately as:

**ACTIVE — IMPLEMENTATION READY**

The external pilot analytics activation remains independently gated by implementation validation and required legal review.

§42 records the current state and supersedes this section's status line.

---

# 42. Hosted Validation Record — Analytics Disabled

**State:** ACTIVE — ANALYTICS-DISABLED HOSTED VALIDATED; ENABLED-STATE GATED

This is not closure, not analytics activation, and does not open the External Pilot Analytics Activation Gate (§38), which remains **CLOSED**.

**Environment.** Production `https://bc.democraciamas.com`, deployment `dpl_2sQCqdu1ysuwZAphQGpDXuScbpj1` built from `dbb40c45012b7f3267beba6b6363d2788f755107` (earlier evidence on `dpl_HPUngLwndvS11MpWN71J7xi2fvvQ`, same commit). `NEXT_PUBLIC_POSTHOG_KEY` is absent from Vercel Production, so the provider is unconfigured. Validation ran 2026-10-02 and 2026-10-06 in a real browser with every request logged, using normal email-code login only. No session was forged, no role was altered and `service_role` was not used as evidence.

**Identities.** Dedicated non-Admin members in two organizations (VélezReyes+ and Democracia+), a third dedicated member provisioned through the normal Admin Users UI with no prior decision, and one existing Admin used only as the caller for the non-override attempts. All three dedicated members end with `analytics_enabled = false`. The Admin's own preference was not changed.

## Cloud

- Migration `20261001000100` is applied to the linked project.
- `public.analytics_preferences` has RLS enabled and a single SELECT policy. Grants are `authenticated: SELECT` and `service_role: SELECT` only.
- `public.set_analytics_preference(boolean, text, text)` is `SECURITY DEFINER` with `search_path=""` and is executable only by `authenticated`.
- Behaviorally, each member reads only their own row. Reading another user's row (cross-user and cross-organization) returns 0 rows.
- Direct insert, update or delete on another user's row, and direct writes on one's own row, are refused with `42501`. Passing a subject argument to the RPC fails with `PGRST202`. Rows were unchanged afterwards.
- An eligible Admin reads 0 rows for other users and is refused every write. Admin has no analytics-preference override.

## Hosted consent and privacy UX

- Undecided, rejected, accepted and revoked states persist correctly in Cloud. `Configurar` records nothing.
- Preferences persist across reload and across a new session, with no re-prompt after a decision.
- Logout leaves no `sb-` cookies or storage, and a subsequent user sees only their own identity and state.
- The Privacy Notice and Terms render at `/app/privacidad/aviso` and `/app/privacidad/terminos`. Neither carries an accept control or analytics switch, so Terms stays independent of analytics consent.
- At 390px, the first-choice prompt for the fresh undecided member renders in normal flow below the header, is not modal and does not make the main content inert. There is no horizontal overflow, clipping or overlap.
  - `Rechazar analítica` comes first in visual and keyboard order. Rejection is not hidden, and acceptance differs only by design-system primary styling.
  - The menu stays reachable and navigation keeps working.
- Keyboard smoke test at 390px:
  - Focus order is skip link, header, `Aviso de Privacidad`, `Rechazar analítica`, `Configurar`, `Aceptar`, with a visible 2px focus ring on each.
  - `Configurar` opens `Preferencias de datos` with the switch off and returns focus on Escape. Shift+Tab leaves the prompt, so there is no trap.
  - Accessible names equal the visible labels.
  - Rejection by keyboard (Enter) persisted `false`.
- Preferences, Notice and Terms were also checked at 390px. Desktop keyboard, focus, `role=switch`/`aria-checked` and skip-link smoke checks passed.
- This is smoke validation, not a WCAG audit.

## Analytics-disabled network

- Preference OFF and preference ON both produced zero PostHog or collector requests (`posthog`, `/capture`, `/batch`, `/decide`, `/flags`, `/e/`, `session_recording`, `eu.i.posthog.com`).
- The SDK chunk was never fetched. Only the app's lazy boundary module loaded. `window.posthog` was undefined and there were no `ph_*` cookies or storage.
- Library, search, header search, filter, content open and an external reference all worked without errors.
- Raw search text appeared only in first-party Library requests.
- Download test fixture:
  - A dedicated, obviously synthetic material ("SPEC-008 Hosted Download Test" with a tiny plain-text file) was created, published and later archived through the normal Admin UI.
  - A member found it through Library search and downloaded it with the visible `Descargar …` control. `/api/attachments/{id}` redirected to a signed private-Storage URL and the file content matched exactly.
  - The same member received 404 for an unpublished attachment.
  - After archival, the fixture is gone from Library results, its detail page has no content, and its download returns 404.
  - The download produced zero analytics traffic. The filename appeared only in the first-party Storage request.

## Preference failure

- Aborting the preference save in the browser left Cloud unchanged. After reload the UI did not represent consent, analytics remained unavailable, and retry recovered.
- The hosted UI currently shows the application's general retryable error screen rather than the intended inline preference error.
- Disposition: **ACCEPTED FOR SPEC-008 PRIVACY CORRECTNESS; NON-BLOCKING UX REFINEMENT.** It is not a privacy defect.

## Acceptance-criteria status

| AC | Status |
|---|---|
| AC-01, AC-02, AC-03, AC-13, AC-16, AC-17, AC-19, AC-20 | LOCAL PASS; PENDING ENABLED-STATE VALIDATION |
| AC-04 Default OFF | LOCAL PASS; HOSTED ANALYTICS-DISABLED PASS; PENDING ENABLED-STATE VALIDATION |
| AC-05 Separate Terms decision | HOSTED ANALYTICS-DISABLED PASS |
| AC-06 Explicit acceptance | CLOUD PASS (persistence); provider initialization PENDING ENABLED-STATE VALIDATION |
| AC-07 Rejection | CLOUD PASS; HOSTED ANALYTICS-DISABLED PASS |
| AC-08 Preference management | HOSTED ANALYTICS-DISABLED PASS |
| AC-09 Revocation | Persistence HOSTED PASS; identity reset after SDK initialization PENDING ENABLED-STATE VALIDATION |
| AC-10 Re-enablement | Persistence HOSTED PASS; future-only emission PENDING ENABLED-STATE VALIDATION |
| AC-11 Undecided vs rejected | CLOUD PASS; HOSTED ANALYTICS-DISABLED PASS (fresh identity: row absent, then `false`) |
| AC-12 Logout isolation | Session separation HOSTED PASS; provider identity PENDING ENABLED-STATE VALIDATION |
| AC-14 No unnecessary PII | LOCAL PASS; payload inspection PENDING ENABLED-STATE VALIDATION |
| AC-15 Search privacy | HOSTED ANALYTICS-DISABLED PASS; payload inspection PENDING ENABLED-STATE VALIDATION |
| AC-18 Environment isolation | LOCAL PASS; Preview no-telemetry PENDING ENABLED-STATE VALIDATION |
| AC-21 Failure isolation | HOSTED ANALYTICS-DISABLED PASS (provider unconfigured); blocked configured provider PENDING ENABLED-STATE VALIDATION |
| AC-22 Preference failure | HOSTED ANALYTICS-DISABLED PASS (fail-closed; UX refinement above) |
| AC-23 – AC-28 | PENDING ENABLED-STATE VALIDATION (require real event data) |
| AC-29 Existing authorization preserved | CLOUD PASS; HOSTED PASS (preference ownership, Admin surfaces, unpublished/archived attachment denial) |
| AC-30 Privacy UX | HOSTED ANALYTICS-DISABLED PASS (UX refinement above) |
| AC-31 Accessibility and responsive | HOSTED SMOKE PASS, including the 390px first-choice prompt |
| AC-32 Documentation | Reconciled for the analytics-disabled state; final reconciliation at closure |

## Remaining before external activation (§38) — all PENDING LEGAL/PROVIDER GATE

1. Legal/privacy approval for the intended pilot.
2. DPA and processing safeguards.
3. PostHog Cloud EU project and ingestion verification.
4. 12-month retention verification and enforcement.
5. PostHog provider access-control verification.
6. Controlled provider-enabled validation.
7. Actual event and payload inspection.
8. Consent initialization with the provider configured.
9. Revocation and identity reset with the provider configured.
10. Logout identity isolation with the provider configured.
11. Preview no-telemetry validation.
12. Blocked-provider failure validation.

---

# Future Vision

The following may become useful after the pilot produces evidence but are not part of SPEC-008:

- durable organizational activation definitions;
- longitudinal organization adoption models;
- deeper cohort analysis;
- structured product-health metrics;
- privacy-reviewed search-term analysis;
- Session Replay;
- experimentation / A-B testing;
- feature flags;
- contextual feedback prompts;
- analytics warehouse/export;
- correlation between stakeholder feedback and observed behavior;
- dedicated error observability such as Sentry;
- public-site marketing analytics.

These capabilities require separate decisions based on evidence gathered during the pilot.