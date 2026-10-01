# Privacy UX Contract — D+ Base Curricular

**Product:** D+ Base Curricular  
**Public identity:** Democracia+  
**Responsible legal entity:** FVR Ltd  
**Status:** DECISION READY  
**Version:** 1.0  
**Updated:** 2026-10-01

---

# 1. Purpose

This document defines the authoritative user experience for privacy choices related to optional product analytics in D+ Base Curricular.

It translates the privacy decisions established in:

- `docs/PRIVACY_AND_DATA_COLLECTION.md`
- `docs/PRIVACY_NOTICE.md`
- `docs/TERMS_OF_USE.md`

into observable product behavior.

This document defines:

- when privacy choice is presented;
- what the user can choose;
- what happens before a decision;
- what happens after acceptance or rejection;
- how preferences are persisted;
- how users change their decision;
- how Terms acceptance and analytics choice remain separate;
- and how the application behaves when analytics is unavailable.

This document does not define new categories of data collection.

---

# 2. Core UX principle

Optional product analytics must be based on a meaningful and reversible user choice.

The UX must preserve:

```text
No decision
     ↓
Analytics OFF
     ↓
User chooses
  ↙       ↘
Reject    Accept
  ↓         ↓
OFF         ON
  ↘         ↙
Preferences
     ↓
Can change later
```

At no point may continued navigation, silence, inactivity, Terms acceptance, or use of Base Curricular be interpreted as analytics acceptance.

---

# 3. Necessary processing versus optional analytics

The product distinguishes two categories.

## Necessary

Required to provide and protect Base Curricular, including authentication, authorization, organization membership, security, administration, and related operational functionality.

Necessary processing is not controlled by the analytics preference.

## Product analytics

Optional processing used to understand aggregate product adoption, discovery, content interest, return behavior, and UX friction.

Product analytics is:

**OFF by default.**

The user controls whether it is enabled.

---

# 4. First authenticated experience

Privacy choice is presented only after the application can identify the authenticated Base Curricular user.

Analytics must not identify the user or emit optional product events before the user's persisted preference has been resolved.

The expected sequence is:

```text
Authentication
      ↓
Authorization / organization resolution
      ↓
Load analytics preference
      ↓
 ┌─────────────────────┐
 │ Preference exists?  │
 └─────────────────────┘
      ↓             ↓
     Yes            No
      ↓             ↓
Respect choice   Analytics OFF
                    ↓
              Show privacy choice
```

The privacy choice must not prevent necessary authentication or authorization processing.

---

# 5. No existing preference

When an authenticated user has no recorded analytics decision:

```text
analytics_enabled = false
decision_state = undecided
```

Conceptually, `undecided` and `rejected` are different states even though analytics is disabled in both.

The product must preserve that distinction.

This allows Base Curricular to know whether:

- the user has never been asked;
- or the user explicitly rejected analytics.

---

# 6. Initial privacy choice

For a user with no recorded decision, Base Curricular presents a privacy choice using approximately the following Spanish copy:

> **Ayúdanos a mejorar Base Curricular**
>
> Con tu permiso, recopilamos información limitada sobre cómo se utiliza la plataforma para entender qué funciona y qué podemos mejorar.
>
> No utilizamos esta información para publicidad ni para evaluar tu desempeño individual.
>
> Puedes cambiar tu decisión posteriormente en Preferencias de datos.

The interface provides three actions:

```text
Rechazar analítica
Configurar
Aceptar
```

It must also provide access to:

```text
Aviso de Privacidad
```

---

# 7. Choice architecture

`Rechazar analítica` and `Aceptar` must have comparable accessibility.

The interface must not:

- visually hide rejection;
- require substantially more steps to reject than to accept;
- use guilt-based or misleading language;
- preselect analytics acceptance;
- interpret closing the interface as acceptance;
- block normal product access until analytics is accepted;
- repeatedly pressure a user who has already rejected analytics.

The visual hierarchy may follow the Base Curricular design system, but it must preserve meaningful choice.

---

# 8. Behavior before a decision

Before an affirmative analytics decision:

```text
Optional analytics = OFF
PostHog identified user = NOT INITIALIZED
Optional product events = NOT SENT
Session Replay = OFF
```

Necessary application behavior continues normally.

If the user dismisses or leaves the choice without deciding, analytics remains disabled.

The product may present the choice again at an appropriate future moment because no decision has been recorded, but it must not create a disruptive loop that prevents normal use.

---

# 9. Accept analytics

When the user selects:

**Aceptar**

Base Curricular must:

1. persist the affirmative analytics preference;
2. record the applicable privacy/consent version;
3. initialize the approved analytics integration;
4. identify the user using only the approved pseudonymous identifier;
5. associate approved organization context;
6. begin collecting only approved events from that point forward.

Acceptance must not retroactively generate analytics events for activity that occurred before consent.

Conceptually:

```text
User accepts
     ↓
Persist preference
     ↓
Initialize analytics
     ↓
Identify pseudonymously
     ↓
Future approved events enabled
```

---

# 10. Reject analytics

When the user selects:

**Rechazar analítica**

Base Curricular must:

1. persist the negative analytics preference;
2. record the applicable privacy/consent version;
3. keep optional analytics disabled;
4. ensure no identified PostHog analytics session remains active;
5. continue normal product operation.

Conceptually:

```text
User rejects
     ↓
Persist preference
     ↓
Analytics remains OFF
     ↓
Normal Base Curricular use
```

Rejection must not reduce the user's product permissions or functionality.

---

# 11. Configure

Selecting:

**Configurar**

opens the Data Preferences experience.

It must not itself enable analytics.

The user must make an explicit choice within the preferences interface.

---

# 12. Data Preferences

Base Curricular must provide a persistent user-accessible surface named:

**Preferencias de datos**

It should be accessible from the authenticated user/account area.

The initial interface contains two conceptual categories.

---

## 12.1 Necesario

Example presentation:

**Necesario**

> Utilizamos estas funciones para autenticar tu cuenta, aplicar tus permisos, mantener la seguridad y operar Base Curricular.

State:

```text
Siempre activo
```

This is informational rather than an analytics toggle.

---

## 12.2 Analítica del producto

Example presentation:

**Analítica del producto**

> Nos ayuda a entender cómo se utiliza Base Curricular para mejorar la navegación, la búsqueda y el acceso al contenido.
>
> No utilizamos esta información para publicidad ni para evaluar tu desempeño individual.

Control:

```text
OFF / ON
```

The current persisted state must be shown accurately.

The interface should provide access to the Privacy Notice.

---

# 13. Changing from OFF to ON

When an authenticated user changes:

```text
Analytics
OFF → ON
```

the application must:

1. persist the new preference;
2. update decision/version metadata;
3. initialize analytics;
4. identify the user pseudonymously;
5. collect only future approved events.

No previous user behavior should be reconstructed and submitted as analytics.

---

# 14. Changing from ON to OFF

When an authenticated user changes:

```text
Analytics
ON → OFF
```

the application must:

1. persist the new preference;
2. immediately stop future optional event collection;
3. reset or clear the analytics client identity as appropriate;
4. prevent further optional analytics initialization while the preference remains OFF.

Changing the preference does not automatically delete historical events already processed.

The interface should make that distinction understandable where relevant.

Requests concerning previously collected personal information are handled through the privacy-rights process.

---

# 15. Sign out

When the user signs out:

- the analytics identity must be reset or cleared;
- the next authenticated user's identity must never inherit the previous user's analytics identity;
- the persisted preference remains associated with the user in the authoritative application data store.

A local browser state must not become the sole source of truth for the user's preference.

---

# 16. Returning users

For a returning authenticated user:

### Existing preference = ON

Initialize approved analytics after identity, authorization, organization, and preference resolution.

### Existing preference = OFF

Do not initialize identified optional analytics.

Do not show the initial privacy choice again merely because the user started a new session.

### No recorded decision

Keep analytics OFF and present the privacy choice according to the first-choice behavior.

---

# 17. Terms acceptance

Terms acceptance and analytics preference are independent decisions.

The UX must never represent:

```text
Accept Terms
     =
Accept Analytics
```

If Terms acceptance is required, the flow must preserve the distinction:

```text
Terms decision
      ↓
Product access eligibility
      ↓
Privacy analytics choice
      ↓
Independent analytics preference
```

A user who accepts the Terms and rejects analytics retains normal Base Curricular access.

---

# 18. Privacy Notice

The privacy-choice interface and Data Preferences must provide access to:

`docs/PRIVACY_NOTICE.md`

through the corresponding user-facing Privacy Notice surface.

Opening the Privacy Notice must not change the analytics preference.

---

# 19. Versioning

The application must preserve enough information to understand which privacy information applied when the user made the analytics decision.

At minimum, the durable preference semantics include:

```text
user_id
analytics_enabled
analytics_decided_at
privacy_notice_version
consent_version
updated_at
```

The implementation may use a different schema provided these semantics remain recoverable.

---

# 20. Material privacy changes

A new version of the Privacy Notice does not automatically invalidate every existing analytics preference.

A new affirmative decision is required when a material change alters the nature of the optional processing sufficiently that the previous choice no longer represents the new processing.

Examples requiring privacy/product review include:

- new analytics purposes;
- new categories of personal information;
- raw search collection;
- names or emails in analytics;
- enabling Session Replay;
- advertising use;
- individual performance analysis;
- a materially different analytics provider or processing model.

The implementation must not independently decide that renewed consent is unnecessary for a material privacy change.

Return:

**BLOCKED / DECISION REQUIRED**

---

# 21. Session Replay

Session Replay is:

```text
DISABLED
```

for the initial external pilot.

It is not a user-configurable preference in the initial Data Preferences interface because the product does not enable the capability.

The interface must not imply that accepting product analytics also accepts Session Replay.

---

# 22. Analytics unavailable

Analytics is non-critical functionality.

If PostHog:

- fails to load;
- is blocked;
- times out;
- is unavailable;
- or is misconfigured,

Base Curricular must continue functioning normally.

The user's stored preference remains their declared preference even if the provider is temporarily unavailable.

Provider availability and user consent are different states.

---

# 23. Production versus non-production

Optional analytics is enabled only for the intended production environment.

Expected behavior:

```text
Production
→ analytics available subject to user preference

Preview
→ analytics no-op

Development
→ analytics no-op

Test
→ analytics no-op
```

Non-production environments must never send telemetry to the production PostHog project.

---

# 24. Administrative users

Base Curricular Admin status does not change the privacy-choice model.

An Admin:

- may accept analytics;
- may reject analytics;
- may change their preference.

Being a Base Curricular Admin does not grant access to PostHog.

Analytics administration is a separate authorization concern.

---

# 25. Organization relationship

Analytics preference belongs to the authenticated user.

An organization cannot enable optional analytics on behalf of all its users through ordinary Base Curricular administration.

Organization membership determines application access and analytics segmentation where approved.

It does not replace individual analytics choice.

---

# 26. Accessibility

Privacy controls must follow the accessibility expectations of the rest of Base Curricular.

At minimum:

- actions must be keyboard accessible;
- controls must have accessible names;
- state must not depend on color alone;
- focus behavior must be predictable;
- toggle state must be programmatically exposed;
- the Privacy Notice link must be accessible;
- acceptance and rejection must remain understandable without relying on visual prominence alone.

---

# 27. Responsive behavior

The privacy choice and Data Preferences must work on supported desktop and mobile layouts.

On smaller screens:

- all choices remain visible or clearly reachable;
- rejection must not become harder to find than acceptance;
- content must remain readable without horizontal scrolling;
- the user must not be forced to accept analytics to dismiss an unusable overlay.

---

# 28. Analytics events and the privacy UX

Privacy-choice actions themselves must not create optional PostHog events before analytics is enabled.

In particular, Base Curricular must not use optional analytics to record that a user:

- viewed the consent interface;
- rejected analytics;
- configured privacy;
- or opened the Privacy Notice

before the user has enabled optional analytics.

Necessary operational persistence of the user's preference is separate from optional product analytics.

---

# 29. Error handling

If saving the user's analytics preference fails:

- the application must not assume acceptance;
- analytics must remain OFF unless a previously persisted affirmative preference already exists;
- the user should receive a clear, non-technical error;
- the product should allow retrying the preference change;
- core Base Curricular functionality must remain available.

Privacy must fail closed.

---

# 30. Acceptance criteria

The privacy UX is coherent when all of the following are true:

### PUX-01 — Default state

A user with no persisted analytics decision generates no optional analytics.

### PUX-02 — Separate decisions

Terms acceptance does not enable analytics.

### PUX-03 — Equal choice

Rejecting analytics is directly available and does not require substantially more effort than accepting.

### PUX-04 — Rejection

Rejecting analytics persists the decision and preserves normal product access.

### PUX-05 — Acceptance

Accepting analytics persists the decision before optional analytics begins.

### PUX-06 — Configuration

`Configurar` opens Data Preferences without enabling analytics.

### PUX-07 — Persistent preferences

The user can access `Preferencias de datos` after the initial decision.

### PUX-08 — Revocation

Changing ON → OFF stops future optional analytics and resets the analytics identity appropriately.

### PUX-09 — Re-enablement

Changing OFF → ON enables only future approved analytics.

### PUX-10 — No retroactive telemetry

Activity performed while analytics was disabled is not later submitted as optional analytics.

### PUX-11 — Logout isolation

Signing out clears analytics identity so another user cannot inherit it.

### PUX-12 — Undecided versus rejected

The product can distinguish no decision from explicit rejection.

### PUX-13 — Privacy Notice

The user can access the Privacy Notice from the privacy-choice and preferences experiences.

### PUX-14 — Session Replay

Session Replay remains disabled and is not presented as an active preference.

### PUX-15 — Environment isolation

Preview, Development, and Test send no telemetry to the production PostHog project.

### PUX-16 — Failure isolation

Provider failure does not affect core product use.

### PUX-17 — Preference failure

Failure to persist a new preference never causes analytics to become enabled accidentally.

### PUX-18 — Accessibility

Privacy controls remain usable through keyboard and assistive technologies.

### PUX-19 — Responsive behavior

Accept, reject, configure, notice access, and preference controls remain usable on supported viewport sizes.

### PUX-20 — No pre-consent analytics

Optional analytics is not used to measure the privacy-choice interaction itself before affirmative consent.

---

# 31. Implementation freedom

The implementation agent may determine:

- exact component structure;
- modal, banner, sheet, or comparable presentation pattern;
- database table naming;
- API/RPC structure;
- local state-management approach;
- loading states;
- exact responsive layout;
- exact placement within the account/user menu;
- technical PostHog initialization mechanics.

The implementation may not independently change:

- analytics default OFF;
- explicit acceptance;
- direct rejection;
- Terms/analytics separation;
- normal access after rejection;
- persistent authenticated-user preference;
- revocability;
- no retroactive telemetry;
- Session Replay disabled;
- production-only analytics;
- fail-closed privacy behavior.

A technical constraint requiring any of these changes must return:

**BLOCKED / DECISION REQUIRED**

---

# 32. Relationship to SPEC-008

SPEC-008 — Product Analytics & Pilot Observability must implement this UX contract.

SPEC-008 must not duplicate this document as a second privacy UX source of truth.

Instead, SPEC-008 should reference this contract and define the engineering work necessary to satisfy it.

Where the current planned SPEC-008 conflicts with this document or the authoritative privacy contract, SPEC-008 must be reconciled before activation.

---

# 33. Current decision

For the initial external pilot:

```text
Analytics default        OFF
No decision              OFF
Reject                    OFF + persist
Accept                    ON + persist
Configure                 Open preferences
Preference owner          Authenticated user
Terms acceptance          Separate
Privacy Notice            Accessible
Session Replay            OFF
Non-production analytics  OFF / no-op
Analytics failure         Core product unaffected
Preference failure        Fail closed
Historical deletion       Separate privacy-rights process
```

This is the authoritative privacy-choice UX contract for the initial Base Curricular external pilot.