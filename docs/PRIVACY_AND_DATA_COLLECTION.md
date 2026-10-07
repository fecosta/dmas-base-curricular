# Privacy & Data Collection Contract — D+ Base Curricular

**Product:** D+ Base Curricular  
**Public identity:** Democracia+  
**Responsible legal entity:** FVR Ltd  
**Registration:** 378038  
**Jurisdiction of incorporation:** Cayman Islands  
**Privacy contact:** hola@democraciamas.com  
**Status:** DECISION READY — LEGAL REVIEW REQUIRED BEFORE EXTERNAL PILOT  
**Version:** 1.1  
**Updated:** 2026-10-01

---

## 1. Purpose

This document defines the authoritative product contract for privacy, data collection, analytics, and related user controls in D+ Base Curricular.

It exists to ensure that product behavior, analytics implementation, user-facing privacy information, and future specifications remain aligned.

This contract is specific to Base Curricular. It complements the broader privacy framework maintained by Democracia+ but does not automatically inherit every data-processing purpose, technology, provider, or authorization described for other Democracia+ websites, programs, or platforms.

Where Base Curricular adopts a more restrictive privacy rule than the broader institutional framework, the more restrictive Base Curricular rule governs the product behavior described here.

This document is an internal product contract. User-facing privacy information is maintained separately in `docs/PRIVACY_NOTICE.md`.

---

## 2. Responsible organization

D+ Base Curricular is a Democracia+ product operated by:

**FVR Ltd**  
Registration number: **378038**  
Jurisdiction of incorporation: **Cayman Islands**

For Base Curricular, FVR Ltd is the sole responsible legal entity under this product contract.

The broader Democracia+ privacy policy and terms may identify additional organizations as operators or data controllers for other Democracia+ activities. Those relationships must not be interpreted as making those organizations responsible for Base Curricular unless that is separately and explicitly established.

The public privacy contact for Base Curricular is:

**hola@democraciamas.com**

---

## 3. Relationship with Democracia+ institutional policies

Democracia+ maintains broader institutional Terms and Conditions and a Personal Data Processing Policy.

Those documents provide institutional context and may govern aspects of the relationship between Democracia+ and its users.

Base Curricular nevertheless has its own product-specific privacy behavior because its authentication model, organization membership, private curriculum content, infrastructure, and product analytics differ from other Democracia+ activities.

Therefore:

- institutional policies must not be interpreted as evidence that Base Curricular uses every processing purpose or technology described there;
- permissions applicable to other Democracia+ activities do not automatically activate optional Base Curricular analytics;
- Base Curricular may adopt stricter data-minimization and consent requirements;
- product-specific infrastructure and international processing must be described according to actual Base Curricular architecture;
- references to other organizations as institutional operators do not change FVR Ltd's status as the sole responsible entity for Base Curricular.

---

## 4. Privacy principles

Base Curricular must follow these principles:

### 4.1 Data minimization

Collect and transmit only information necessary for a defined product, security, operational, or approved analytics purpose.

### 4.2 Purpose limitation

Information collected for one purpose must not silently be reused for materially different purposes.

### 4.3 Transparency

Users must be able to understand what information Base Curricular collects, why it is collected, and what choices they have.

### 4.4 Privacy by default

Optional analytics must remain disabled until the user makes an affirmative choice to enable it.

### 4.5 Meaningful choice

Accepting analytics and rejecting analytics must both be legitimate and accessible choices.

### 4.6 No access penalty

A user who rejects optional analytics must retain normal access to Base Curricular.

### 4.7 Revocability

Users must be able to change their analytics preference after the initial decision.

### 4.8 Security

Analytics or privacy functionality must not weaken authentication, authorization, RLS, organization isolation, Storage controls, audit controls, or other security boundaries.

### 4.9 No advertising

Base Curricular product analytics must not be used for advertising, advertising audiences, or interest-based advertising.

### 4.10 No individual performance evaluation

Product analytics must not be used to evaluate individual employee, participant, contributor, or user performance.

### 4.11 Organization-first learning

The primary analytical purpose is understanding product adoption and usefulness across participating organizations, not monitoring individual people.

### 4.12 Provider minimization

External providers must receive only the information needed for the approved purpose.

---

## 5. Necessary product processing

Base Curricular may process information necessary to operate and protect the platform.

This includes, where applicable:

- authentication identity;
- login email;
- internal user identifier;
- organization membership;
- organization identifier;
- user role;
- membership and organization status;
- session and authentication information;
- security information;
- administrative records;
- access-administration events;
- audit information;
- information required to provide requested product functionality.

This processing is distinct from optional product analytics.

A user cannot disable processing that is genuinely necessary to authenticate, authorize, secure, or provide the requested service while continuing to use the corresponding authenticated functionality.

The applicable legal basis for necessary processing must be confirmed as part of legal review for the jurisdictions in which the external pilot operates.

---

## 6. Optional product analytics

Base Curricular may collect limited product-usage analytics only after the user affirmatively enables analytics.

Analytics exists to answer product questions such as:

- Are participating organizations adopting Base Curricular?
- Are users successfully exploring the Library?
- Are search and filters helping users discover content?
- What types of content generate interest?
- Are users returning to the product?
- Where does aggregate product behavior suggest UX friction?

Analytics must not become a generalized monitoring system.

---

## 7. Prohibited analytics purposes

Base Curricular analytics must not be used to:

- evaluate individual employee performance;
- evaluate whether an individual is sufficiently active;
- create individual productivity scores;
- create rankings of users;
- infer political opinions or political preferences;
- infer sensitive personal characteristics;
- create advertising profiles;
- create advertising audiences;
- sell user information;
- determine employment, funding, participation, or organizational eligibility;
- or make consequential automated decisions about individuals.

---

## 8. Analytics provider

The approved analytics provider for the initial pilot is:

**PostHog Cloud EU**

Project environment:

`https://eu.posthog.com/project/289698`

The EU PostHog environment is the approved analytics destination for the initial pilot.

Any change of analytics provider or processing region requires product/privacy review.

Appropriate contractual safeguards, including a Data Processing Agreement where applicable, must be established and retained.

**[information to complete: applicable DPA, contractual clauses, or other transfer/processing safeguards]**

---

## 9. Analytics identity

Approved analytics identity information is limited to:

- an internal pseudonymous user identifier;
- the canonical organization identifier;
- environment information.

The Supabase Auth UUID is used as the event-level PostHog `distinct_id`, without a Person Profile, browser analytics identity or duplicate `user_id` property.

Base Curricular must not intentionally send the following as analytics identity properties:

- user name;
- user email;
- organization name;
- organization email domain;
- authentication credentials;
- passwords;
- access tokens.

Analytics identity must not replace Base Curricular's operational identity or authorization systems.

---

## 10. Approved event taxonomy

The initial approved analytics events are:

```text
library_viewed
search_performed
filter_applied
content_opened
external_reference_opened
content_downloaded
```

A future event representing selection of a search suggestion may be added only if it has a defined measurement purpose and respects the same privacy constraints.

Events must be semantic and intentionally instrumented.

Automatic collection must not be used as a substitute for an explicit event model.

---

## 11. Search privacy

Search text is particularly sensitive because users may enter arbitrary information.

Base Curricular must never intentionally send raw search text to PostHog.

The following properties are prohibited in analytics payloads:

```text
query
search_text
q
```

or any equivalent property containing the user's search text.

An approved `search_performed` event may include information such as:

```text
organization_id
user_id
result_count
has_results
environment
```

Search analytics must answer whether search is useful without requiring knowledge of what the person typed.

Analytics configuration must also prevent raw search text from leaking through page URLs or automatically captured pageviews.

---

## 12. Content analytics

The canonical analytics content types are:

```text
module
material
institution
```

A generic `content_opened` event should be used rather than unnecessary event proliferation.

Content analytics should use stable internal identifiers.

Content titles, descriptions, private curriculum text, teaching notes, or other content bodies must not be transmitted when an identifier is sufficient.

---

## 13. Filter analytics

The approved filter dimensions are:

```text
axis
entity
country
theme
```

The Library presentation mode (`view`) is not a content filter.

Initial analytics should prefer recording the filter dimension rather than unnecessary human-readable values.

Any later decision to collect selected filter values must be reviewed for measurement value and privacy impact.

---

## 14. External references

`external_reference_opened` may record the relevant internal content identifier and content type.

The complete external URL should not be sent unless a future measurement need explicitly requires it and the privacy implications have been reviewed.

---

## 15. Downloads

`content_downloaded` may record:

- internal content identifier;
- content type;
- internal attachment identifier.

Original filenames should not be transmitted to analytics when `attachment_id` is sufficient.

---

## 16. Automatic collection

Base Curricular analytics must use explicit semantic events.

For the initial pilot:

- automatic interaction capture must be disabled;
- automatic form capture must be disabled;
- arbitrary text capture must be disabled;
- automatic search-text capture must be disabled;
- automatic pageview collection that could expose URLs or query parameters must be disabled or safely sanitized;
- analytics must not collect private curriculum text from the rendered interface.

PostHog defaults must not override these product decisions.

---

## 17. Session Replay

**Session Replay is disabled for the initial Base Curricular pilot.**

Enabling Session Replay is a separate privacy decision.

It must not be activated merely because the analytics provider supports it.

Any future proposal to enable Session Replay requires:

1. a documented product purpose;
2. privacy review;
3. security review;
4. review of affected product surfaces;
5. masking/blocking configuration;
6. exclusion of sensitive and administrative surfaces;
7. manual verification of actual recordings;
8. assessment of whether renewed user disclosure or choice is required.

---

## 18. User choice and consent model

Optional product analytics is **OFF by default**.

Before optional analytics begins, the user must be given a meaningful opportunity to:

- accept analytics;
- reject analytics;
- or configure their preference.

Rejecting analytics must be as accessible as accepting it.

Silence, inactivity, continued navigation, or merely accepting Base Curricular Terms of Use must not be interpreted as consent to optional analytics.

Acceptance of Terms and acceptance of optional analytics are separate decisions.

The final legal basis for optional analytics must be confirmed during jurisdiction-specific legal review. The product is designed around affirmative opt-in.

---

## 19. Preference persistence

Base Curricular must persist the user's analytics decision.

The durable preference model should support, at minimum:

```text
user_id
analytics_enabled
analytics_decided_at
privacy_notice_version
consent_version
updated_at
```

The exact schema is an implementation decision provided it preserves these semantics.

The preference must be associated with the authenticated user rather than relying exclusively on a browser-local value.

---

## 20. Changing preferences

Base Curricular must provide an accessible **Preferencias de datos** surface.

A user must be able to change optional analytics between:

```text
ON
OFF
```

Disabling analytics must stop future optional analytics collection for that user.

The direct analytics transport must clear its ephemeral application identity and abort in-flight requests where possible when analytics is disabled or the user signs out. Requests already received by the provider cannot be retracted.

Changing the preference does not necessarily delete previously collected analytics events.

Requests concerning historical personal information must be handled through the applicable privacy-rights process.

---

## 21. User-facing privacy information

Base Curricular must provide a user-facing Privacy Notice consistent with this contract.

The notice must explain, in accessible language:

- who is responsible for Base Curricular;
- what information is necessary to operate the platform;
- what optional analytics information is collected;
- the purposes of analytics;
- the analytics provider;
- the processing region;
- retention;
- what Base Curricular intentionally does not collect for analytics;
- how analytics preferences work;
- how preferences can be changed;
- user rights;
- how to contact Democracia+ regarding privacy.

The current product-specific notice is maintained at:

`docs/PRIVACY_NOTICE.md`

The notice complements broader Democracia+ privacy documentation but must describe actual Base Curricular behavior.

---

## 22. Terms of Use relationship

Base Curricular Terms of Use and analytics consent are separate contracts/decisions.

Acceptance of the Terms must not automatically enable optional analytics.

Terms may explain that necessary personal information is processed to provide and protect the service and may reference applicable privacy documentation.

They must not convert optional analytics into mandatory processing merely through acceptance of the Terms.

---

## 23. Privacy choice interface

The initial privacy choice should communicate approximately:

> Ayúdanos a mejorar Base Curricular.
>
> Con tu permiso, recopilamos información limitada sobre cómo se utiliza la plataforma para entender qué funciona y qué podemos mejorar. No utilizamos esta información para publicidad ni para evaluar tu desempeño individual.
>
> Puedes cambiar tu decisión posteriormente en Preferencias de datos.

The interface must provide comparably accessible actions for:

```text
Rechazar analítica
Configurar
Aceptar
```

and access to the Privacy Notice.

Exact UX copy may evolve provided the meaning and choice architecture remain unchanged.

---

## 24. Data preferences interface

The initial preferences model contains two conceptual categories.

### Necessary

Required for authentication, authorization, security, and operation.

Displayed as necessary and not controlled by the optional analytics toggle where genuinely required for service operation.

### Product analytics

Optional.

Used to understand aggregate adoption and product usage.

Controlled by the user.

Session Replay must not appear as enabled in the initial pilot because it is disabled at the product level.

---

## 25. Retention

Initial product analytics event retention is:

**12 months**

This retention period must be configured where supported by the analytics provider and reviewed after the pilot.

Retention must not be extended merely because longer storage is technically available.

**MVP posture (D-031, 2026-10-07).** For the MVP/pilot, the 12-month initial retention is satisfied by PostHog's one-year Product Analytics query-retention boundary, accepted as a known limitation. This is a query/visibility boundary, not physical deletion: Base Curricular does not claim deletion within 12 months from provider storage, cold storage or backups, a provider-enforced TTL, or a deletion SLA, and must not describe it that way. Enforceable physical deletion is deferred and must be reassessed before analytics is materially expanded or becomes a long-term capability (SPEC-008 §9.3). Privacy/Legal acknowledgement of this posture is pending; this contract's version is unchanged pending that review.

Operational, security, audit, authentication, and organization-management records may follow different retention requirements according to their purpose and applicable obligations.

---

## 26. Environment isolation

Optional product analytics is allowed only in the intended production environment.

Expected behavior:

| Environment | Product analytics |
|---|---|
| Production | Available, subject to user preference |
| Preview | Disabled / no-op |
| Development | Disabled / no-op |
| Test | Disabled / no-op |

Tests must never send real telemetry to the production PostHog project.

---

## 27. Failure isolation

Analytics is non-critical functionality.

The following must not prevent normal Base Curricular operation:

- PostHog unavailable;
- PostHog blocked by the browser or network;
- analytics initialization failure;
- analytics request failure;
- user rejection of analytics;
- missing analytics configuration outside production.

Core product functionality must remain independent of analytics availability.

---

## 28. Security requirements

Analytics implementation must not weaken existing Base Curricular security.

In particular:

- authentication remains authoritative in Supabase Auth;
- authorization remains based on live Base Curricular access state;
- organization membership remains authoritative in Base Curricular;
- RLS remains authoritative for database access;
- private content remains protected;
- Storage authorization remains protected;
- audit mechanisms remain independent of analytics;
- analytics is never an authorization source.

Only client-safe analytics configuration may be exposed to the browser.

Privileged provider credentials, server secrets, Supabase service-role credentials, Auth Admin credentials, or equivalent secrets must never be exposed in client bundles or analytics payloads.

---

## 29. Access to analytics

Access to the PostHog project must be limited to authorized Democracia+ personnel who require analytics access for legitimate product, research, technical, privacy, or administrative purposes.

Analytics access is separate from the Base Curricular `Admin` role.

Being a Base Curricular Admin must not automatically grant access to PostHog.

**[information to complete: people, teams, or roles authorized to access PostHog]**

---

## 30. User rights

Users may have rights concerning their personal information under applicable law, including rights related to access, correction, information about processing, deletion or suppression, revocation of consent, and complaints to competent authorities.

The broader Democracia+ Personal Data Processing Policy defines institutional rights and procedures.

Base Curricular must provide a clear entry point for privacy requests:

**hola@democraciamas.com**

FVR Ltd must ensure that requests received through this address are routed into the applicable institutional rights-management process.

A Base Curricular user must not need to understand internal organizational responsibilities in order to submit a privacy request.

---

## 31. Minors

The broader Democracia+ privacy framework allows products and services to involve adults or minors and requires minors to interact through their legal representatives.

Base Curricular does not establish a different rule through this contract.

If Base Curricular later intentionally targets minors, introduces direct minor registration, or materially changes how minors interact with the platform, a dedicated privacy and consent review is required before that behavior is enabled.

---

## 32. International processing

Base Curricular uses technology providers that may process information in jurisdictions different from the user's country.

For product analytics, the approved environment is **PostHog Cloud EU**.

Other Base Curricular infrastructure must be described according to its actual deployment and provider architecture.

Base Curricular must not claim that all information is stored or processed in the Cayman Islands unless current technical evidence supports that statement.

User-facing information must explain relevant international processing or transfers as required by applicable law.

Applicable safeguards:

**[information to complete: DPA, contractual clauses, or other applicable mechanisms]**

---

## 33. Legal basis

The final legal basis for each category of processing may depend on jurisdiction, processing purpose, and the relationship between FVR Ltd, participating organizations, and users.

The product must not invent a universal legal basis before legal review.

Optional product analytics is designed around affirmative user opt-in.

Necessary processing must use the applicable legal basis identified through legal review and must not be misrepresented as optional consent when it is genuinely necessary to provide or secure the service.

**[information to complete: legal basis confirmed after legal review]**

---

## 34. Regional approach

Base Curricular may serve users in multiple Latin American jurisdictions.

There is no assumption that a single privacy law governs every user.

The product therefore adopts a common privacy-first baseline centered on:

- minimization;
- transparency;
- purpose limitation;
- meaningful user choice;
- revocability;
- security;
- accessible rights channels;
- conservative analytics behavior.

Country-specific legal requirements may extend these protections.

They must not silently reduce the product-level protections established in this contract.

---

## 35. Changes requiring privacy review

The following changes require explicit product/privacy review before implementation:

- new categories of personal information;
- new analytics purposes;
- new analytics provider;
- change of processing region;
- retention extension;
- enabling Session Replay;
- enabling automatic interaction capture;
- collection of raw search queries;
- collection of content text;
- collection of names or emails in analytics;
- advertising or advertising audiences;
- profiling beyond approved product analytics;
- individual monitoring or performance evaluation;
- material changes to user rights;
- material changes to consent behavior;
- new international-processing arrangements.

These changes must not be introduced as implementation details.

---

## 36. SPEC-008 contract

SPEC-008 — Product Analytics & Pilot Observability must conform to this document.

At minimum, SPEC-008 must preserve:

- analytics opt-in;
- no access penalty for rejection;
- explicit semantic events;
- no raw search queries;
- no names or emails in analytics;
- pseudonymous user identifiers;
- canonical organization identifier;
- PostHog Cloud EU;
- production-only analytics;
- 12-month initial retention, under the MVP query-retention posture in §25;
- Session Replay disabled;
- persistent and revocable preferences;
- analytics failure isolation;
- user-facing transparency;
- separation between Terms acceptance and analytics consent.

If SPEC-008 conflicts with this contract, the spec must be reconciled before activation.

---

## 37. Validation requirements

Before optional analytics is enabled for the external pilot, verify:

1. analytics is OFF before affirmative user choice;
2. rejection leaves normal product access intact;
3. analytics acceptance is separate from Terms acceptance;
4. preferences persist for the authenticated user;
5. preferences can be changed later;
6. disabling analytics stops future optional collection;
7. raw search text is absent from analytics payloads;
8. names and emails are absent from analytics payloads;
9. organization names and domains are absent where internal IDs suffice;
10. automatic interaction capture is disabled;
11. unsafe automatic pageview capture is disabled or sanitized;
12. Session Replay is disabled;
13. Preview, Development, and Test do not send production telemetry;
14. analytics failure does not break the product;
15. PostHog EU destination is verified;
16. 12-month retention is in place under the MVP posture in §25 (provider query-retention boundary, without any physical-deletion claim);
17. PostHog access is restricted;
18. client bundles contain no privileged analytics or infrastructure secrets;
19. user-facing privacy copy matches actual behavior;
20. the privacy choice interface does not use dark patterns;
21. FVR Ltd is consistently identified as the responsible legal entity for Base Curricular;
22. broader Democracia+ documents are not used to imply unimplemented Base Curricular processing behavior.

---

## 38. Required user-facing artifacts

Before the external pilot, Base Curricular must provide:

1. **Aviso de Privacidad** — `docs/PRIVACY_NOTICE.md`
2. **Términos de Uso**
3. **Banner de privacidad y analítica**
4. **Preferencias de datos**

These artifacts must be consistent with this contract and with actual implementation.

---

## 39. Current product decision

For the initial Base Curricular external pilot:

### Responsible entity
- FVR Ltd is the sole responsible legal entity for Base Curricular.
- Democracia+ is the public product/institutional identity.

### Necessary processing
- Allowed as required to operate, authorize, secure, and administer the product.
- Subject to applicable legal requirements.

### Optional analytics
- Explicit opt-in.
- PostHog Cloud EU.
- Semantic events only.
- Minimal identifiers.
- No raw search text.
- No advertising.
- No individual performance evaluation.
- 12-month initial retention (MVP: provider query-retention boundary; see §25).

### Session Replay
- Disabled.

### User choice
- Rejecting analytics does not impair normal product use.
- Preferences persist.
- Preferences are reviewable and changeable.

### Institutional relationship
- Base Curricular may reference broader Democracia+ privacy documentation.
- Broader institutional permissions do not automatically expand Base Curricular processing.
- Terms acceptance does not constitute acceptance of optional Base Curricular analytics.

### External pilot gate
External pilot analytics requires:

- user-facing privacy artifacts;
- verified implementation behavior;
- completed provider/privacy configuration;
- and legal review appropriate to the pilot jurisdictions.
