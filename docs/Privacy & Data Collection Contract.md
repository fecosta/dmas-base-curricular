# Privacy & Data Collection Contract — D+ Base Curricular

**Product:** D+ Base Curricular  
**Responsible organization:** Democracia+  
**Privacy contact:** hola@democraciamas.com  
**Status:** DECISION READY — LEGAL REVIEW REQUIRED BEFORE EXTERNAL PILOT  
**Version:** 1.0  
**Last updated:** 2026-10-01

---

# 1. Purpose

This document defines the product-level privacy and data-collection contract for D+ Base Curricular.

It establishes:

- what personal and usage data the platform may process;
- why that data may be processed;
- which processing is necessary to operate the platform;
- which processing is optional;
- how users are informed and given meaningful choices;
- how product analytics may operate;
- what information must not be intentionally sent to analytics providers;
- how preferences and consent are recorded and changed;
- how third-party processors are governed;
- and which privacy constraints must be preserved by future product and technical changes.

This contract is the product authority for privacy behavior.

Implementation specifications, including SPEC-008 — Product Analytics & Pilot Observability, must conform to this contract.

---

# 2. Responsible organization

The product is operated under the name:

**Democracia+**

Additional legal information:

- Legal entity: **[información a completar: razón social de la entidad responsable]**
- Country of incorporation: **[información a completar: país de constitución]**
- Legal address: **[información a completar: domicilio legal]**
- Registration/tax identifier: **[información a completar: identificador legal o tributario, cuando corresponda]**

Privacy inquiries and requests may be sent to:

**hola@democraciamas.com**

---

# 3. Privacy principles

D+ Base Curricular follows these product principles:

1. **Data minimization** — collect only information necessary for an explicit purpose.
2. **Purpose limitation** — data collected for one purpose must not silently be repurposed.
3. **Transparency** — users must be able to understand what information is processed and why.
4. **Privacy by default** — optional analytics remains disabled until the user makes an affirmative choice.
5. **Meaningful choice** — rejecting optional analytics must be as accessible as accepting it.
6. **No access penalty** — rejecting analytics must not prevent normal use of Base Curricular.
7. **Revocability** — users must be able to change optional analytics preferences later.
8. **Security by design** — authentication, authorization and private-content boundaries remain independent of analytics.
9. **No advertising use** — product analytics is not used for advertising or advertising profiling.
10. **No individual performance evaluation** — analytics must not be used to rank or evaluate individual users.
11. **Organization-first learning** — pilot analysis should primarily help Democracia+ understand whether organizations can successfully use Base Curricular.
12. **Provider minimization** — third-party processors receive only the minimum information required for their approved purpose.

---

# 4. Categories of processing

Data processing is divided into two primary categories.

## 4.1 Necessary processing

Necessary processing supports operation, authentication, authorization, security and delivery of the platform.

It may include:

- authentication identity;
- email address;
- user identifier;
- organization membership;
- organization identifier;
- product role;
- account status;
- authentication/session information;
- security and operational records;
- access-administration audit information;
- curriculum-governance audit information where applicable.

Necessary processing does not depend on optional product-analytics consent where it is required to provide or secure the service under the applicable legal basis.

Rejecting optional analytics must not disable this processing.

---

## 4.2 Optional product analytics

Product analytics exists to help Democracia+ understand and improve the experience of using Base Curricular during and after the pilot.

Initial analytics requires an affirmative user preference before optional analytics telemetry is intentionally sent.

Product analytics must not be required to:

- authenticate;
- access the Library;
- search;
- apply filters;
- open content;
- download authorized resources;
- use Admin functionality;
- or otherwise use the normal product.

---

# 5. Analytics purpose

Product analytics may be used to answer questions such as:

- Are organizations using Base Curricular after receiving access?
- Do users reach and use the Library?
- Is search being used?
- Are filters being used?
- Does search lead to content exploration?
- What types of curriculum content are being explored?
- Are external references being used?
- Are published resources being downloaded?
- Do users return to the product?
- Do organizations continue using the product over time?
- Where do aggregate product journeys indicate possible UX problems?

Analytics must not be used to determine:

- whether a particular employee is performing well;
- whether an individual is sufficiently active;
- political preferences or opinions;
- sensitive personal characteristics;
- advertising profiles;
- commercial advertising audiences;
- or behavioral scores assigned to individual users.

---

# 6. Analytics provider

The approved initial product-analytics provider is:

**PostHog**

Deployment:

**PostHog Cloud EU**

Current project:

**Project 289698**

Project URL:

`https://eu.posthog.com/project/289698`

The production integration must use the European PostHog environment associated with this project.

A Data Processing Agreement or equivalent applicable processing agreement with the provider should be established and retained by Democracia+ before or during production activation as required by organizational/legal review.

Provider changes that materially alter data location, categories of information processed, purposes or privacy behavior require review of this contract.

---

# 7. Approved analytics identity

When analytics is enabled, Base Curricular may associate analytics activity with:

- an internal pseudonymous user identifier;
- the canonical internal organization identifier;
- the user's product role;
- the application environment.

The internal authenticated user UUID may be used as the analytics `distinct_id`.

The canonical Base Curricular organization UUID may be used as `organization_id`.

Analytics should not intentionally send:

- user's name;
- user's email address;
- organization domain;
- organization name where the canonical internal identifier is sufficient.

The analytics provider must not become the source of truth for user or organization identity.

---

# 8. Approved initial events

Initial analytics must use a deliberately small semantic event taxonomy.

Approved initial events are:

```text
library_viewed
search_performed
filter_applied
content_opened
external_reference_opened
content_downloaded
```

A separate event for search-suggestion selection may be introduced only if the implementation/specification establishes a clear analytical purpose.

New events require an explicit analytical purpose and must comply with this contract.

---

# 9. Search privacy

Raw search text must not be intentionally transmitted to PostHog or another analytics provider during the initial pilot.

For example, analytics may record:

```text
search_performed
result_count
has_results
```

It must not record:

```text
query
search_text
q
```

or another property containing the user's raw search input.

Analytics implementation must also prevent raw search queries from leaking indirectly through captured page URLs or automatic tracking.

---

# 10. Approved content analytics

Content interaction may use canonical internal identifiers.

For example:

```text
content_opened

content_id
content_type
```

Approved initial content types are:

```text
module
material
institution
```

Analytics should not require transmitting curriculum titles, descriptions or private content when canonical identifiers are sufficient.

---

# 11. Filter analytics

Initial filter analytics may identify the dimension used.

Approved initial filter types are:

```text
axis
entity
country
theme
```

The Library presentation mode:

```text
grilla
programa
```

is not itself a content filter.

Initial analytics should prefer recording the filter dimension rather than the selected human-readable value unless a future measurement requirement demonstrates a need for the value and privacy review confirms it is appropriate.

---

# 12. External references

Analytics may record that an external reference was opened.

It should use internal context such as:

```text
content_id
content_type
```

The complete external destination URL should not be transmitted unless a later approved measurement requirement specifically requires it.

---

# 13. Downloads

Analytics may record downloads of authorized published resources.

Where needed, the event may contain:

```text
content_id
content_type
attachment_id
```

The original filename should not be transmitted when the internal attachment identifier is sufficient.

---

# 14. Automatic collection

The initial analytics implementation must favor explicit semantic events over broad automatic collection.

Unless separately reviewed and approved:

- automatic interaction capture must be disabled;
- automatic pageview capture that exposes complete URLs or query strings must be disabled or safely sanitized;
- analytics must not automatically capture form contents;
- analytics must not automatically capture search inputs;
- analytics must not automatically capture arbitrary text displayed by the application.

The implementation must be demonstrably incapable of leaking raw Library search queries through automatic URL collection.

---

# 15. Session Replay

Session Replay is **disabled for the initial pilot**.

Enabling Session Replay requires a separate privacy and product review.

Before activation, that review must establish at minimum:

- which application surfaces may be recorded;
- which surfaces are excluded;
- text masking behavior;
- input masking behavior;
- private curriculum-content protection;
- Admin-surface protection;
- authentication-surface protection;
- sampling;
- retention;
- access controls;
- user information/consent requirements;
- and manual production privacy verification.

Session Replay must not be silently activated as part of routine analytics implementation.

---

# 16. Analytics preference

Optional product analytics is **off by default until the user makes an affirmative choice**.

The user must be offered at least:

```text
Reject analytics
Accept analytics
Configure preferences
```

Rejecting optional analytics must be reasonably as accessible as accepting it.

The interface must not use deceptive visual patterns to encourage acceptance.

Absence of a decision must not be interpreted as acceptance.

---

# 17. Preference persistence

The platform should maintain a durable record of the user's analytics preference.

A conceptual record may include:

```text
user_id
analytics_enabled
analytics_decided_at
privacy_notice_version
consent_version
updated_at
```

The exact schema is implementation freedom provided that:

- the preference is attributable to the authenticated user;
- the current decision is determinable;
- the applicable notice/consent version is known;
- and unnecessary personal information is not duplicated.

---

# 18. Changing preferences

Users must be able to revisit their data preferences after the initial decision.

A persistent entry point should be available through an appropriate authenticated product surface, such as:

**Preferencias de datos**

Users must be able to change:

```text
Analytics ON → OFF
Analytics OFF → ON
```

without losing normal product access.

When analytics is disabled, future optional analytics collection must stop.

Client-side analytics identity/state should be reset or cleared as appropriate.

Changing the preference does not necessarily imply automatic deletion of legitimately retained historical information. Deletion or data-subject requests follow the applicable privacy-request process.

---

# 19. User-facing privacy notice

Base Curricular must provide an accessible Privacy Notice.

At minimum, it should explain:

- who is responsible for processing;
- privacy contact information;
- categories of information processed;
- purposes;
- necessary product processing;
- optional product analytics;
- PostHog's role;
- international processing/transfers where applicable;
- retention;
- security principles;
- user rights;
- how analytics preferences can be changed;
- how privacy requests can be submitted;
- and how material changes to the notice are handled.

The notice must use understandable language appropriate for the intended users.

---

# 20. Terms of Use

Terms of Use must remain conceptually separate from optional analytics consent.

Acceptance of Terms of Use must not itself be treated as consent to optional product analytics.

Similarly, merely presenting a Privacy Notice must not be treated as analytics consent.

The product must distinguish:

```text
Terms of Use
→ contractual/use conditions

Privacy Notice
→ transparency about data processing

Analytics preference
→ independent user choice regarding optional analytics
```

---

# 21. Privacy banner

When a user has not yet made an applicable analytics choice, the product should present a clear privacy/analytics notice.

The initial user-facing concept is:

```text
Ayúdanos a mejorar Base Curricular

Usamos tecnologías necesarias para que la plataforma
funcione. También nos gustaría recopilar datos limitados
sobre cómo se utiliza Base Curricular para mejorar la
experiencia durante el piloto.

No utilizamos estos datos para publicidad ni para evaluar
el desempeño individual.

[Rechazar analítica] [Configurar] [Aceptar]

Aviso de Privacidad
```

Final Spanish copy is governed by the approved user-facing privacy artifacts.

---

# 22. Data preferences interface

The initial preference model should distinguish:

## Necessary

Always active where required to provide and secure the service.

The interface must make clear that these operations cannot simply be disabled while continuing to use the corresponding authenticated service.

## Product analytics

Optional.

The interface must explain in plain language why analytics is collected and what categories of activity may be recorded.

Session Replay must not appear as an enabled analytics category during the initial pilot because it is globally disabled under this contract.

---

# 23. Retention

Initial product-analytics event retention is:

**12 months**

This period should be reviewed after the external pilot.

Analytics information must not be retained indefinitely merely because the provider technically permits longer retention.

Other categories of data may require different retention periods based on operational, security, governance, contractual or legal requirements.

Those periods are not automatically governed by the 12-month analytics rule.

---

# 24. Environment isolation

Development and automated testing must not send real telemetry into the production PostHog project.

Initial expected behavior:

```text
Production
→ analytics available subject to user preference

Preview
Development
Test
→ analytics disabled/no-op
```

A future change to this model must preserve reliable separation from production pilot metrics.

---

# 25. Analytics availability

Analytics is non-critical infrastructure.

Failure, blocking or unavailability of PostHog must not prevent normal use of Base Curricular.

The application must continue operating if:

- the analytics script fails;
- the provider is unavailable;
- the user blocks analytics;
- browser privacy tools prevent analytics;
- or the user rejects analytics.

---

# 26. Security

Analytics credentials exposed to the browser must be limited to credentials explicitly designed by the provider for client-side use.

Server secrets, privileged credentials and administrative keys must never be serialized into browser code.

Analytics must not weaken existing:

- authentication;
- authorization;
- RLS;
- organization membership;
- content governance;
- audit;
- or private-storage boundaries.

---

# 27. Access to analytics

Access to PostHog and analytics dashboards must be limited to authorized Democracia+ personnel with a legitimate product, research or operational purpose.

Analytics access must not automatically follow Base Curricular Admin role.

Base Curricular product authorization and PostHog administrative authorization are separate concerns.

Authorized analytics roles/process:

**[información a completar: personas, equipos o roles autorizados para acceder a PostHog]**

---

# 28. User rights

Users must be provided information about applicable privacy/data-protection rights and how to exercise them.

Depending on applicable jurisdiction, these may include rights related to:

- access;
- confirmation of processing;
- correction;
- updating;
- deletion or erasure;
- objection;
- revocation of consent;
- information about sharing/processing;
- portability where applicable;
- and review through the applicable supervisory authority.

Requests should be directed initially to:

**hola@democraciamas.com**

The operational procedure, identity-verification requirements and response process are:

**[información a completar: procedimiento interno para atender solicitudes de titulares]**

---

# 29. International processing

Base Curricular may rely on service providers operating infrastructure outside the user's country.

Product analytics uses **PostHog Cloud EU**.

The user-facing Privacy Notice must explain international processing or transfers to the extent required by the applicable legal framework and actual provider/subprocessor architecture.

Democracia+ must not make unsupported claims that information never leaves a particular country or jurisdiction.

Applicable contractual safeguards:

**[información a completar: DPA, cláusulas contractuales u otros mecanismos aplicables]**

---

# 30. Legal basis

This product contract distinguishes necessary service processing from optional analytics, but it does not independently establish the final legal basis for every processing operation in every country.

The applicable legal basis or authorization model must be confirmed during legal review.

For optional analytics, the initial product design intentionally uses an affirmative opt-in preference so the product does not rely on passive or implied acceptance.

Final jurisdiction-specific legal basis:

**[información a completar: base legal confirmada después de revisión jurídica]**

---

# 31. Regional approach

Base Curricular is intended for use across Latin America.

There is no single Latin American data-protection regime.

The product therefore adopts a common privacy-first baseline rather than intentionally weakening privacy behavior based on the user's country.

Country-specific requirements may require additional notices, rights, consent mechanisms, contractual safeguards or operational procedures.

Those requirements may extend this contract but must not silently reduce its established privacy protections.

---

# 32. Changes to this contract

Changes require product/privacy review when they affect:

- categories of data collected;
- analytics purposes;
- analytics identity;
- analytics provider;
- provider region;
- retention;
- Session Replay;
- automatic collection;
- search-query collection;
- advertising use;
- profiling;
- individual monitoring;
- data-subject rights;
- consent/preference behavior;
- or international processing.

A purely technical implementation change that preserves these contracts does not require a new product decision.

---

# 33. SPEC-008 relationship

SPEC-008 — Product Analytics & Pilot Observability must be reconciled against this contract before activation.

At minimum, SPEC-008 must preserve:

- opt-in analytics;
- no access penalty for rejection;
- semantic custom events;
- no raw search queries;
- no unnecessary names/emails;
- pseudonymous internal identifiers;
- canonical `organization_id`;
- PostHog Cloud EU;
- production environment isolation;
- 12-month analytics retention;
- Session Replay disabled for the initial pilot;
- preference persistence and revocation;
- analytics failure isolation;
- and user-facing privacy transparency.

Where SPEC-008 conflicts with this contract, the conflict must be resolved before implementation rather than allowing the implementation agent to choose.

---

# 34. Validation requirements

Before external pilot activation, verify:

1. users can reject analytics;
2. users can accept analytics;
3. no analytics telemetry is intentionally sent before opt-in;
4. rejection does not affect product access;
5. preferences persist correctly;
6. preferences can be changed later;
7. disabling analytics stops future optional collection;
8. PostHog identity is reset appropriately;
9. raw search text is not emitted;
10. names and emails are not intentionally emitted;
11. automatic page URL/query capture does not leak search text;
12. Session Replay is disabled;
13. development/test telemetry does not reach production analytics;
14. PostHog failure does not affect the application;
15. the Privacy Notice is accessible;
16. privacy contact information is correct;
17. PostHog EU configuration is verified;
18. retention configuration is consistent with the approved 12-month policy;
19. access to the PostHog project is appropriately restricted;
20. user-facing copy matches actual implemented behavior.

---

# 35. Required user-facing artifacts

Before the external pilot, this contract must be represented through:

1. **Aviso de Privacidad**
2. **Términos de Uso**
3. **Banner de privacidad y analítica**
4. **Preferencias de datos**

These artifacts must describe the same product behavior defined here.

---

# 36. Remaining decisions / placeholders

Before final legal approval, complete or validate:

- `[información a completar: razón social de la entidad responsable]`
- `[información a completar: país de constitución]`
- `[información a completar: domicilio legal]`
- `[información a completar: identificador legal o tributario, cuando corresponda]`
- `[información a completar: personas, equipos o roles autorizados para acceder a PostHog]`
- `[información a completar: procedimiento interno para atender solicitudes de titulares]`
- `[información a completar: DPA, cláusulas contractuales u otros mecanismos aplicables]`
- `[información a completar: base legal confirmada después de revisión jurídica]`

---

# 37. Current product decision

The current approved product direction is:

```text
Necessary product processing
→ available as required to operate and secure Base Curricular

Optional product analytics
→ explicit opt-in
→ PostHog Cloud EU
→ semantic events only
→ minimal identifiers
→ no raw search text
→ no advertising
→ no individual performance evaluation
→ 12-month initial retention

Session Replay
→ disabled

Analytics rejected
→ Base Curricular continues to work normally

Analytics preference
→ persistent
→ reviewable
→ changeable

External pilot
→ requires user-facing privacy artifacts
→ requires implementation verification
→ requires legal review of applicable regional/jurisdictional requirements
```

**Product state:** `DECISION READY — LEGAL REVIEW REQUIRED BEFORE EXTERNAL PILOT`