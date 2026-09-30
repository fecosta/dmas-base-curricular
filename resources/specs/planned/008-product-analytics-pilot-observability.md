# SPEC-008 — Product Analytics & Pilot Observability

**Status:** PLANNED — DECISION READY  
**Product:** D+ Base Curricular  
**Primary capability:** Product analytics and pilot observability  
**Proposed analytics platform:** PostHog  
**Depends on:** Existing authentication, organization membership, Library/navigation architecture, and current privacy/security contracts  
**Does not depend on:** Marketing analytics, CRM, experimentation, or production support tooling

---

## 1. Purpose

D+ Base Curricular is entering a new testing stage in which users from additional organizations will access the platform.

The product needs a structured way to understand whether those organizations can successfully discover, navigate, search, explore, and return to the Base Curricular without relying only on qualitative feedback.

This SPEC introduces a bounded **Product Analytics & Pilot Observability** capability.

The purpose of analytics is to answer specific product questions about:

- organizational adoption;
- initial exploration;
- content discovery;
- content interest;
- returning usage;
- UX friction during the pilot.

Analytics exists to improve the product and evaluate pilot adoption.

It must not become an employee-monitoring, individual-performance, or user-surveillance system.

---

# 2. Measurement Principle

Instrumentation must begin from a product question, not from a UI interaction.

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

An interaction must not be tracked merely because the analytics platform makes it possible.

Events without a defined product purpose are out of scope.

The initial analytics implementation should deliberately favor a small number of meaningful events over comprehensive interaction tracking.

---

# 3. Current State

The platform already provides the core Base Curricular experience, including authenticated access, organization-aware users, Library exploration, search/filter interactions, content navigation, and multiple content surfaces.

SPEC-007 established the current navigation and interaction contracts.

The platform is now preparing to expand testing beyond the initial stakeholder/user group to additional organizations.

There is currently no canonical analytics contract defining:

- what questions analytics should answer;
- what interactions should be measured;
- how events should be named;
- which properties may accompany events;
- how organizations should be represented;
- what information must never leave the application;
- how session replay should operate;
- or what constitutes meaningful pilot adoption.

Without such a contract, ad-hoc instrumentation risks producing inconsistent events, excessive collection, unusable metrics, and privacy problems.

---

# 4. Problem / Gap

Opening the platform to external organizations creates a product-learning requirement that cannot be satisfied by application logs or stakeholder feedback alone.

The team needs to distinguish between situations such as:

- an organization being onboarded but never meaningfully using the platform;
- users entering once and never returning;
- users reaching the Library but not exploring content;
- users searching but not selecting results;
- filters being difficult to discover or ineffective;
- certain types of content receiving significantly more exploration than others;
- different organizations finding value through different parts of the Base Curricular;
- UX friction causing users to abandon exploration.

Technical logs indicate system activity but do not adequately explain these product journeys.

Conversely, tracking every interaction would create large amounts of telemetry without a clear product purpose.

The platform therefore requires a deliberately small, privacy-conscious analytics model tied directly to the pilot's learning objectives.

---

# 5. Product Decisions

## D-008-01 — Product analytics

The platform will introduce dedicated product analytics for the external-organization pilot.

Analytics must primarily support:

- adoption analysis;
- product discovery;
- UX investigation;
- funnel/path analysis;
- retention analysis;
- organization-level usage analysis.

Marketing attribution is not the primary objective.

---

## D-008-02 — Measurement before instrumentation

No analytics event may be introduced without a defined analytical purpose.

The canonical measurement plan must identify:

- the product question;
- why it matters;
- the observable signal;
- the supporting event;
- relevant properties;
- how the signal should be interpreted.

The implementation must not expand instrumentation simply because the provider supports additional events.

---

## D-008-03 — Primary analytics platform

**PostHog is the proposed primary analytics platform.**

Technical preflight must validate compatibility with the current application architecture, deployment model, security requirements, and privacy constraints.

If no material blocker is found, PostHog becomes the implementation target.

A material blocker must return this SPEC to:

**BLOCKED / DECISION REQUIRED**

rather than silently replacing PostHog.

---

## D-008-04 — Organization-first analysis

The primary analytical unit for the pilot is the **organization**.

The analytics model should support questions such as:

- Which organizations have used the platform?
- Which organizations show meaningful activity?
- Which organizations return?
- How do discovery patterns differ between organizations?

The application remains the source of truth for organizations and memberships.

The analytics platform only observes product usage.

---

## D-008-05 — Meaningful activity remains observational

The pilot must distinguish:

```text
Onboarded organization
```

from:

```text
Organization with meaningful product activity
```

However, this SPEC does **not** permanently define meaningful activity using an arbitrary threshold such as:

- number of logins;
- number of pages;
- number of opened items;
- time spent.

Pilot evidence should first reveal which behaviors correlate with genuine use.

The analytics/reporting layer may support exploratory definitions without turning them into a permanent product contract.

---

## D-008-06 — Data minimization

Only information necessary for approved product analysis may be sent to the analytics provider.

The default rule is:

> Do not send personally identifiable information when a pseudonymous or aggregate identifier can satisfy the analytical requirement.

Analytics must not receive unnecessary:

- names;
- email addresses;
- authentication credentials or tokens;
- free-text user input;
- uploaded documents;
- private content;
- sensitive organization information;
- raw search queries;
- unrelated application data.

---

## D-008-07 — Search privacy

Raw search queries must **not** be sent to the analytics provider in the initial pilot.

The first objective is to understand whether search is being used and whether it leads to content exploration.

If future evidence shows that query-level analysis is necessary, that requires a separate privacy/product decision.

---

## D-008-08 — Analytics is not an operational database

PostHog must not become a source of truth for:

- users;
- organizations;
- roles;
- permissions;
- content;
- publication state;
- curriculum relationships;
- or other domain entities.

Analytics consumes observations about product usage.

It does not own application state.

---

## D-008-09 — Session replay

Session replay may be enabled during the pilot because qualitative observation of navigation behavior can materially improve UX investigation.

Replay is an **investigation tool**, not a KPI.

Aggregate analytics should first identify a problem or unusual journey.

Replay can then help investigate why that behavior occurred.

Replay must operate under privacy-first configuration.

At minimum:

- form inputs must be masked where applicable;
- sensitive text must not be captured;
- authentication information must never be recorded;
- sensitive application surfaces must be excluded or masked;
- replay may be sampled rather than enabled for every session.

Masking must be explicitly verified before production activation.

---

## D-008-10 — No individual performance monitoring

Analytics must not be designed to rank, evaluate, score, or monitor individual users.

Individual/session-level identifiers may exist where technically required for:

- session continuity;
- funnels;
- retention;
- journey analysis;
- replay investigation.

The analytical objective remains product and organization behavior rather than individual performance.

---

# 6. Measurement Plan

The initial pilot has five primary product questions.

---

## MP-01 — Are organizations actually adopting the platform?

### Product question

Are the organizations invited to the pilot progressing from onboarding into real product usage?

### Why we care

Creating accounts or signing in does not demonstrate adoption.

We need to distinguish between:

```text
Onboarded
    ↓
First use
    ↓
Meaningful exploration
    ↓
Returned
```

### Signals

- organization has at least one product session;
- organization reaches the Library;
- organization performs meaningful exploration;
- organization returns in a later usage period.

### Supporting data

Primarily:

```text
session_started
library_viewed
content_opened
```

combined with:

```text
organization_id
user_id
```

where available and appropriate.

### Interpretation

These signals help identify adoption patterns.

They must not yet be converted into a permanent automated organization score.

---

## MP-02 — Can users successfully begin exploring the Base Curricular?

### Product question

After entering the product, are users able to reach the main exploration experience and begin interacting with content?

### Why we care

A user may authenticate successfully while still failing to understand what to do next.

### Conceptual journey

```text
Authenticated session
       ↓
Library
       ↓
Search / Filter / Browse
       ↓
Content opened
```

### Important interpretation rule

This is not a mandatory linear funnel.

A user who directly browses and opens useful content may be succeeding without ever searching or filtering.

The purpose is to observe successful exploration paths, not prescribe one correct journey.

### Supporting events

```text
session_started
library_viewed
search_performed
filter_applied
content_opened
```

---

## MP-03 — How do users discover content?

### Product question

Which discovery mechanisms lead users to content?

### Why we care

Search, filtering, and direct browsing represent different discovery patterns.

Understanding them can reveal whether navigation is helping or blocking users.

### Conceptual paths

```text
Library
 ├── Search ───────→ Result → Content
 ├── Filter ───────→ Content
 └── Browse ───────→ Content
```

### Signals

- search used;
- filter used;
- search result selected;
- content opened;
- sequence between discovery actions.

### Supporting events

```text
search_performed
filter_applied
search_result_selected
content_opened
```

### Interpretation

No discovery method should initially be considered inherently superior.

The pilot should reveal how users naturally find content.

---

## MP-04 — What content generates interest?

### Product question

Which types of Base Curricular content are actually being explored?

### Why we care

Different organizations may derive value from different content types.

Understanding this helps evaluate the product structure without assuming beforehand which content category matters most.

### Supporting event

Use one generic semantic event:

```text
content_opened
```

with properties such as:

```text
content_id
content_type
```

Possible `content_type` values should map to real canonical product entities, for example:

```text
module
material
institution
reference
```

where those values match the implemented domain model.

### Interpretation

This should support views such as:

```text
Organization A
→ predominantly modules

Organization B
→ predominantly materials

Organization C
→ references + institutions
```

without creating separate event names for each content type.

---

## MP-05 — Do users find enough value to return?

### Product question

Do users and organizations return after their initial exploration?

### Why we care

Initial curiosity is different from continued adoption.

Returning usage is one of the strongest signals available during the pilot that the platform may be useful beyond a first demonstration.

### Analysis levels

#### User retention

Did a pseudonymous user return after initial meaningful exploration?

#### Organization retention

Did the organization continue using the platform, even if different members returned?

Organization retention is especially important because institutional adoption may involve several users.

### Supporting data

Primarily session and organization identity combined with existing product events.

A separate `user_returned` event should not be created if retention can be derived reliably from normal session/event data.

---

# 7. Canonical Event Taxonomy

The initial event taxonomy should remain intentionally small.

Candidate canonical events:

```text
session_started
library_viewed
search_performed
filter_applied
search_result_selected
content_opened
external_reference_opened
content_downloaded
```

The technical preflight must reconcile this list with actual current application behavior.

Events corresponding to nonexistent functionality must not be invented.

---

# 8. Event Semantics

Events describe product actions, not implementation details.

Good:

```text
search_performed
content_opened
filter_applied
```

Avoid:

```text
button_clicked
card_clicked
modal_opened
blue_button_clicked
click_23
```

Instrumentation should survive reasonable UI refactoring without changing the meaning of the event.

---

# 9. Standard Properties

Where applicable and already authoritative within the application, events may include:

```text
organization_id
user_id
user_role

content_id
content_type

filter_type
environment
```

Additional properties require a clear analytical purpose.

Not every event must carry every property.

Properties must represent existing application concepts rather than analytics-specific domain inventions.

---

# 10. Search Measurement

Search is a critical part of content discovery.

Initial analytics should make it possible to understand:

- how often search is used;
- whether search leads to result selection;
- whether search sessions lead to content opening;
- whether users perform repeated searches during the same journey;
- which result positions are selected, if available without unnecessary complexity.

The initial implementation must not send the raw search query.

A potentially useful investigation signal is:

```text
Search performed
       ↓
No result selected / no content opened
```

This may suggest discovery friction without exposing query text.

---

# 11. Filter Measurement

Filter usage should be captured at the semantic filter-type level.

Examples may include current canonical dimensions such as:

```text
country
topic
axis
content_type
```

only where they exist in the implemented product.

Initial analysis should answer:

- Which filter types are used?
- Does filter usage lead to content exploration?
- Are users repeatedly changing filters?
- Do certain discovery paths depend heavily on filtering?

Analytics must not introduce new filtering semantics.

---

# 12. Session Replay

Session replay should primarily investigate patterns already detected through aggregate analytics.

Example:

```text
Analytics finding:
Many Library sessions do not reach content_opened.

        ↓

Replay investigation:
Inspect a small sample of those sessions to understand navigation behavior.
```

Potential investigation areas include:

- users repeatedly opening/closing navigation;
- difficulty discovering filters;
- navigation loops;
- unexpected backtracking;
- abandoned search journeys;
- confusion between content types;
- mobile/responsive interaction problems.

Replay is not itself a success metric.

---

# 13. Explicitly Out-of-Scope Measurements

The initial pilot should **not** track by default:

- every click;
- mouse movement;
- scroll depth;
- every modal open/close;
- every component interaction;
- raw search text;
- user names;
- email addresses;
- arbitrary time-on-component metrics;
- behavioral engagement scores;
- individual user rankings;
- employee/user performance measures.

Broad page-view collection should also not replace the semantic product events defined in this SPEC.

The goal is useful evidence, not maximum telemetry.

---

# 14. Pilot Analytics Views

The initial reporting model should remain compact.

Rather than creating one large dashboard, analysis should be organized around four perspectives.

---

## 14.1 Pilot Overview

Candidate indicators:

```text
Organizations onboarded
Organizations with usage
Organizations with meaningful activity
Organizations returning

Active users
Returning users

Library sessions
Search usage
Filter usage
Content opened
```

"Meaningful activity" remains exploratory during the pilot and must be clearly labeled if a temporary reporting definition is used.

---

## 14.2 Journeys

Analyze product paths such as:

```text
Authenticated session
→ Library
→ discovery action
→ content
```

and:

```text
Search
→ result selected
→ content opened
```

Journeys must not assume that there is only one successful navigation path.

---

## 14.3 Organizations

Allow comparison of usage patterns by organization, including:

- presence of activity;
- returning activity;
- discovery mechanisms;
- content types explored.

The goal is to understand adoption patterns, not rank organizations.

---

## 14.4 Content

Analyze:

- content types explored;
- frequently opened content;
- differences in exploration across organizations;
- discovery paths leading to content.

Analytics should measure interest, not infer educational quality or effectiveness from opening behavior alone.

---

## 14.5 Retention

Analyze both:

- pseudonymous user return;
- organization return.

Organization retention should receive particular attention during the external pilot.

---

# 15. Privacy and Security Constraints

Analytics is an external data-processing boundary.

Before production activation, implementation must verify:

1. exactly which data leaves the application;
2. PostHog deployment/environment/region;
3. session replay masking;
4. data-retention configuration;
5. access permissions to analytics;
6. environment separation;
7. whether existing privacy notices or Terms require changes;
8. whether cookie/consent requirements apply to target jurisdictions.

Secrets or privileged credentials must never be exposed in client code.

Only credentials specifically designed for client-side analytics may be exposed to the browser.

---

# 16. Environment Separation

Development and test activity must not contaminate production pilot metrics.

The implementation must provide a clear isolation strategy.

Possible approaches include:

- separate PostHog projects;
- environment properties plus reliable filtering;
- another provider-supported isolation mechanism.

The implementation agent may select the smallest reliable option compatible with current deployment architecture.

Production reporting must exclude development/test telemetry.

---

# 17. Analytics Failure Behavior

Analytics is non-critical infrastructure.

Failure of the provider must not prevent users from:

- authenticating;
- navigating;
- searching;
- filtering;
- opening content;
- or otherwise using the Base Curricular.

Analytics must fail safely.

Core product functionality must never depend on successful telemetry delivery.

---

# 18. Impact Surface

Expected impact includes:

- analytics initialization/application shell;
- authentication/session lifecycle;
- organization context;
- Library;
- search;
- filters;
- content navigation;
- environment configuration;
- security/privacy documentation;
- deployment configuration;
- tests.

Potentially affected documentation includes:

```text
docs/ARCHITECTURE.md
docs/SECURITY.md
docs/DECISIONS.md
docs/PRODUCT_DEFINITION.md
resources/specs/README.md
```

Technical preflight must determine the actual authoritative files.

---

# 19. Out of Scope

This SPEC does not introduce:

- marketing campaign attribution;
- advertising analytics;
- CRM integration;
- user scoring;
- employee monitoring;
- organization ranking;
- A/B testing;
- feature flags;
- automated personalization;
- recommendation algorithms;
- behavioral targeting;
- automated decisions based on analytics;
- custom analytics warehouse;
- replacement of application logs;
- replacement of security monitoring;
- replacement of error monitoring;
- exhaustive UI interaction tracking.

Google Analytics is not part of this SPEC.

Dedicated error monitoring such as Sentry may be considered separately.

---

# 20. Expected Behavior

Once implemented:

1. production usage generates only approved canonical analytics events;
2. every event maps to an explicit measurement purpose;
3. events use consistent semantic definitions;
4. events can be segmented by organization where appropriate;
5. the team can analyze organizational adoption;
6. initial exploration paths are observable;
7. search/filter/content discovery behavior can be analyzed;
8. content interest can be compared by content type;
9. user and organization return behavior can be measured;
10. replay can assist UX investigation without becoming the primary analytical mechanism;
11. development telemetry does not contaminate pilot reporting;
12. analytics failure does not affect product behavior;
13. unnecessary PII and raw search text are not intentionally sent.

---

# 21. Acceptance Criteria

## AC-01 — Measurement plan

Every canonical event is documented against at least one approved product question.

## AC-02 — Centralized integration

The application has one documented analytics integration boundary rather than unrelated provider calls distributed throughout the product.

## AC-03 — Bounded taxonomy

Tracked events conform to the intentionally small canonical taxonomy.

## AC-04 — Organization segmentation

Authenticated organization usage can be analyzed using the canonical organization identifier where appropriate.

## AC-05 — No unnecessary PII

Inspection of emitted payloads confirms that prohibited personal information is not intentionally transmitted.

## AC-06 — Search privacy

Raw search text is not transmitted.

## AC-07 — Initial exploration

Analytics can represent the main paths from authenticated usage into meaningful content exploration.

## AC-08 — Discovery analysis

Search, filtering, direct browsing, result selection, and content opening can be meaningfully distinguished where the implemented product supports them.

## AC-09 — Content analysis

`content_opened` can be segmented using canonical content type and identifier properties without requiring separate event names per content type.

## AC-10 — Retention

The team can distinguish first-time and returning usage at both user and organization levels sufficiently for pilot analysis.

## AC-11 — Session replay privacy

Replay is configured so identified sensitive inputs/content are masked or excluded.

The configuration is manually verified before production enablement.

## AC-12 — Environment isolation

Development/test activity can be reliably excluded from production reporting.

## AC-13 — Failure isolation

Blocking or disabling analytics does not break core application behavior.

## AC-14 — Pilot reporting

The analytics configuration can support:

- Pilot Overview;
- Journeys;
- Organizations;
- Content;
- Retention.

## AC-15 — Meaningful activity remains non-permanent

No permanent organization engagement score or arbitrary adoption threshold is introduced as part of this implementation.

## AC-16 — Existing authorization preserved

Analytics introduces no change to application authorization or organization-access rules.

## AC-17 — Documentation

Relevant architecture, security/privacy, decisions, measurement-plan, and specification indexes reflect the capability after implementation.

---

# 22. Testing Requirements

Implementation must include appropriate tests for the analytics abstraction.

Tests should verify at minimum:

- expected event emission;
- event/property semantics;
- organization association where applicable;
- content property association;
- absence of known prohibited properties;
- raw search queries are not emitted;
- safe behavior when analytics is unavailable;
- environment/configuration guards.

Tests must not send real telemetry to the production analytics environment.

Where session replay privacy cannot be sufficiently verified automatically, closure evidence must include manual verification.

---

# 23. Implementation Freedom

The implementation agent may determine:

- the exact PostHog SDK compatible with the application;
- analytics wrapper/module structure;
- client/server event boundaries;
- initialization strategy;
- environment isolation;
- batching/provider configuration;
- replay sampling percentage;
- dashboard implementation details;
- technical test strategy.

The implementation agent may reconcile candidate event names where repository evidence demonstrates that a different semantic name more accurately describes current product behavior.

It may not silently change:

- the approved measurement questions;
- organization-first analysis;
- data-minimization requirements;
- search-query privacy;
- replay privacy requirements;
- the non-critical nature of analytics;
- existing authorization semantics;
- or navigation behavior merely to simplify instrumentation.

New events not covered by the measurement plan require justification before being added.

A conflict requiring material product changes must return:

**BLOCKED / DECISION REQUIRED**

---

# 24. Knowledge Updates Required

After implementation and validation, reconcile durable project knowledge.

At minimum review:

- architecture documentation;
- security/privacy documentation;
- decisions;
- environment/configuration documentation;
- specification index;
- deployment/setup documentation.

The canonical measurement plan/event taxonomy must have one authoritative location.

Avoid creating duplicate analytics dictionaries across multiple documents.

---

# 25. Pre-Implementation Gate

Before moving this SPEC to **ACTIVE / IMPLEMENTATION READY**, perform a repository-grounded technical preflight.

The preflight must verify:

### Architecture

- current framework/runtime;
- appropriate PostHog integration boundary;
- client/server rendering implications;
- organization-context availability;
- authentication/session lifecycle;
- navigation instrumentation points.

### Existing telemetry

Search for:

- analytics dependencies;
- telemetry utilities;
- monitoring;
- logging;
- existing event tracking;
- environment variables.

Avoid duplicate capabilities.

### Product journeys

Validate the measurement plan against the actual implemented UX.

Confirm whether:

```text
session_started
library_viewed
search_performed
filter_applied
search_result_selected
content_opened
external_reference_opened
content_downloaded
```

map cleanly to current behavior.

Remove or adjust events that do not.

Do not instrument obsolete prototype behavior.

### Data

Confirm authoritative sources for:

- organization ID;
- pseudonymous user identity;
- roles;
- content identifiers;
- content types;
- filter types.

### Privacy/security

Determine:

- exactly what data would leave the platform;
- replay masking requirements;
- hosting/data-region implications;
- retention requirements;
- analytics access controls;
- whether Privacy Policy or Terms updates are required;
- whether consent/cookie requirements apply.

---

# 26. Activation Gate

SPEC-008 may move to:

**ACTIVE — IMPLEMENTATION READY**

when:

1. the measurement plan remains coherent with the implemented product;
2. technical preflight finds no unresolved architectural blocker;
3. PostHog is confirmed compatible with deployment architecture;
4. organization context can be associated safely;
5. final canonical event taxonomy has been reconciled with real behavior;
6. privacy/replay requirements are implementable;
7. no unresolved consent/privacy issue blocks pilot deployment.

If any requirement would materially change the product or privacy contract, return:

**DECISION READY — STAKEHOLDER APPROVAL REQUIRED**

or:

**BLOCKED / DECISION REQUIRED**

as appropriate.

---

# 27. Completion Evidence

SPEC-008 is not complete because an SDK was installed.

Closure requires evidence that:

- approved product questions can be answered;
- production-compatible initialization works;
- canonical events are emitted correctly;
- events map to the measurement plan;
- organization segmentation works;
- discovery journeys can be analyzed;
- content interest can be segmented;
- user and organization retention can be analyzed;
- replay privacy has been manually verified;
- prohibited data and raw search queries are not intentionally emitted;
- analytics failure does not affect application behavior;
- automated tests pass;
- relevant hosted behavior has been validated;
- durable project documentation has been reconciled.

Only after those checks should SPEC-008 move to:

**COMPLETED / COHERENCE VERIFIED**

---

# Future Vision

The following may become useful after the pilot produces evidence but are not part of SPEC-008:

- durable definition of organizational activation;
- longitudinal organization adoption models;
- deeper cohort analysis;
- structured product-health metrics;
- privacy-reviewed search-term analysis;
- experimentation/A-B testing;
- feature flags;
- contextual feedback prompts;
- analytics warehouse/export;
- correlation between stakeholder feedback and observed behavior;
- dedicated error observability such as Sentry;
- public-site marketing analytics.

These require separate decisions based on evidence gathered during the pilot.
