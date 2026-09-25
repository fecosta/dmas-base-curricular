# SPEC-006 — UX/UI Navigation & Interaction Remediation

**Status:** ACTIVE — IMPLEMENTATION READY  
**Type:** UX/UI remediation  
**Primary reference:** `resources/ux-ui/Base Curricular - Explorador (offline).html`  
**Depends on:** Existing curriculum explorer, content navigation, contribution workflow, and current published-content model  
**Does not depend on:** Admin UX redesign or changes to content governance  
**Decision status:** Product decisions approved

---

## 1. Purpose

Improve the usability, scalability, responsiveness, and navigation coherence of the Base Curricular interface following stakeholder and senior UX/UI review.

This SPEC addresses concrete interaction issues identified in the current implementation while preserving the existing product structure and content model.

The work covers:

1. responsive global search;
2. scalable entity filters;
3. contextual `Grilla / Programa` behavior;
4. modal and overlay navigation;
5. contribution-form state preservation;
6. favicon integration.

This is a **bounded remediation**, not a redesign of the Base Curricular product.

---

# 2. UX/UI Reference

The primary UX/UI reference for this work is:

`resources/ux-ui/Base Curricular - Explorador (offline).html`

The reference must be evaluated as an interactive product prototype, not merely as a visual reference.

Implementation must consider:

- visible content;
- navigation between content surfaces;
- hidden containers;
- modal states;
- drawers;
- contribution forms;
- global search suggestions;
- itinerary behavior;
- module detail behavior;
- responsive navigation;
- filter states;
- overlay relationships;
- form fields and branches.

Where this SPEC explicitly defines behavior that differs from the HTML prototype, **this SPEC takes precedence**.

The current application implementation remains authoritative evidence for what exists today. The HTML prototype and this SPEC define the intended UX contract for this remediation.

---

# 3. Current State and Identified Gaps

## 3.1 Global search

The reference prototype provides a global search/type-ahead experience capable of surfacing content across multiple entity types, including modules, teachers, and institutions.

The current responsive presentation has a usability problem at constrained widths:

- the placeholder can become truncated;
- the `/` keyboard-shortcut indicator can collide with or obscure search text;
- the search control does not adapt cleanly across intermediate and mobile widths.

This is a responsive defect rather than a change to the search model.

---

## 3.2 Entity filters

The current implementation exposes entity filters such as:

- Docentes;
- Materiales;
- Instituciones.

These are presented as flat checkbox lists inside scrollable containers.

This works with very small datasets but does not scale well as the knowledge base grows.

Users may also select values and subsequently lose visual awareness of those selections because they must rediscover them by scrolling through the list.

The reference prototype uses a simpler filtering model centered around:

- Eje;
- País / ámbito;
- Tema;

combined with global search.

The current application adds useful relationship-based entity filtering beyond that prototype.

The decision is to **retain this additional filtering capability**, but replace the non-scalable interaction pattern.

---

## 3.3 Grilla / Programa

The reference prototype exposes:

- `Grilla`
- `Programa`

as layout options.

However, the control is global and its state can survive navigation between content surfaces.

This permits semantically invalid combinations such as:

`Referencias + Programa`

`Programa` represents curricular/module structure and therefore applies to Módulos, not to the Referencias discovery surface.

---

## 3.4 Overlay and modal navigation

The reference prototype contains multiple interactive layers, including:

- mobile filters;
- module detail;
- itinerary;
- guide;
- compact/mobile navigation;
- global search suggestions;
- contribution form.

Some flows can be nested.

For example:

`Explorer → Module Detail → Contribution`

The current/reference interaction logic does not consistently model these states as an ordered navigation stack.

This creates the possibility that Escape or another close action affects an underlying layer rather than the layer currently visible to the user.

---

## 3.5 Contribution form state

The contribution flow supports the primary contribution types:

- Docente;
- Notas y materiales;
- Referencias.

Referencias additionally distinguishes between:

- Centro o institución de referencia;
- Material, estudio o informe.

The reference prototype resets most form state when switching between the primary contribution tabs.

A user can therefore enter information, temporarily navigate to another contribution type, and lose their previous input without an explicit discard action.

---

## 3.6 Favicon

A D+ favicon asset has been supplied for the application.

The application should expose the correct branded favicon through its application metadata/browser shell.

---

# 4. Product Decisions

The following decisions are authoritative for this SPEC.

## D1 — Preserve entity filters

`Docentes`, `Materiales`, and `Instituciones` remain available as filters.

They are not replaced by global search.

Global search and filters serve different user intents:

**Search**

> Find a known or approximately known entity/content item across the knowledge base.

**Filter**

> Restrict the current result set according to content relationships or attributes.

---

## D2 — Replace flat entity lists with searchable multi-select controls

Docentes, Materiales, and Instituciones must use a scalable searchable/type-ahead multi-select interaction.

Selected entities must remain visible independently of their position in the available-options list.

Selected values are represented as removable chips or an equivalent persistent selected-state treatment.

---

## D3 — Programa belongs only to Módulos

The valid layout states are:

```text
Módulos
├── Grilla
└── Programa

Referencias
└── Grilla
```

`Referencias + Programa` is not a valid application state.

---

## D4 — Layout preference is contextual

When navigating from:

`Módulos → Programa`

to:

`Referencias`

the application must display:

`Referencias → Grilla`

If the user subsequently returns to Módulos during the same application session, the implementation may restore the previously selected Módulos layout.

The application must never render Referencias using Programa.

---

## D5 — Overlay navigation follows the visible hierarchy

When multiple layers are active, close actions must affect the **topmost active layer only**.

Example:

```text
Explorer
   ↓
Module Detail
   ↓
Contribution
```

Escape from Contribution returns to Module Detail.

A subsequent Escape returns to Explorer.

Underlying UI must not be closed while a child overlay remains active.

---

## D6 — Contribution input survives tab navigation

During an open contribution session, each primary contribution type maintains its own temporary form state.

Example:

```text
Docente draft
Notas y materiales draft
Referencias draft
```

Moving between these tabs must not silently erase previously entered values.

This is session-level state only.

This SPEC does **not** introduce persistent database-backed contribution drafts.

---

## D7 — No broader redesign

The objective is to repair identified interaction problems while preserving the current product model.

This SPEC must not be used as justification for redesigning unrelated parts of the product.

---

# 5. Scope

## 5.1 In Scope

### UXR-1 — Responsive Global Search

Improve responsive behavior of the global search control.

Required behavior:

- full search experience remains available on desktop;
- the search control adapts intentionally at intermediate widths;
- the `/` keyboard-shortcut indicator must not collide with text or placeholder content;
- the shortcut indicator may be hidden when insufficient width exists;
- mobile search must remain discoverable and usable;
- mobile may use a shorter placeholder such as:

`Buscar en la base…`

- existing search/type-ahead functionality must remain intact.

This work must not reduce the entities/content currently discoverable through search.

---

### UXR-2 — Searchable Entity Filters

Replace flat scrollable checkbox lists for:

- Docentes;
- Materiales;
- Instituciones;

with searchable multi-select controls.

Each control must support:

1. text input;
2. narrowing available options as the user types;
3. selecting multiple values;
4. clearly displaying selected values;
5. removing an individual selected value without searching for it again;
6. keyboard interaction appropriate to the control;
7. an understandable empty/no-results state;
8. continued operation with substantially larger option sets than exist today.

Selected values should use removable chips or an equivalent persistent representation.

The interaction pattern should be consistent across all three entity filters.

The existing Eje, País/ámbito, Tema, and other applicable filters remain available unless repository evidence shows a specific current filter has already been intentionally removed.

Global search must remain separate from these filters.

---

### UXR-3 — Contextual Grilla / Programa Views

The layout selector must be contextual to the current content surface.

#### Módulos

Display:

- Grilla
- Programa

#### Referencias

Do not expose Programa as an available layout.

Referencias must render using its reference/grid presentation.

Navigation into Referencias must normalize any incompatible Programa state.

Invalid states originating from stale UI state, URL/deep-link state, or another navigation path must not cause Referencias to render using Programa.

The implementation may remember the user's most recent Módulos layout during the current session.

---

### UXR-4 — Overlay & Modal Navigation Contract

Interactive overlays must behave as an ordered navigation hierarchy.

This applies to relevant existing surfaces such as:

- search suggestions;
- mobile navigation;
- filter drawer;
- module detail;
- contribution form;
- itinerary;
- guide;
- other equivalent overlays discovered during implementation.

#### Escape

Escape closes only the topmost dismissible active layer.

Example:

```text
Explorer
→ Module Detail
→ Contribution
→ Escape
→ Module Detail
→ Escape
→ Explorer
```

Escape must not close a parent while leaving its child visible.

#### Explicit close

Close buttons must follow the same hierarchy.

Closing a child returns the user to its parent context when applicable.

#### Backdrop interaction

Where backdrop-click dismissal is supported, it must follow the same topmost-layer rule.

Backdrop behavior does not need to be introduced for surfaces where it is intentionally absent.

#### Focus

Modal/dialog interactions must:

- move focus into the active dialog where appropriate;
- prevent keyboard interaction with inaccessible background content;
- return focus to a meaningful originating control when the dialog closes.

#### Background

Full-screen/modal overlays must prevent inappropriate background interaction and scrolling while active.

Implementation should avoid conflicting independent overlay states that produce impossible visual/navigation combinations.

---

### UXR-5 — Contribution Form State Preservation

The contribution workflow must preserve temporary input independently for:

- Docente;
- Notas y materiales;
- Referencias.

Within Referencias, existing institution/material branching behavior must continue to function.

Switching between primary contribution types must not silently discard entered data.

Example:

```text
Open Contribution
→ Select Docente
→ Enter Nombre + Rol
→ Select Referencias
→ Enter reference information
→ Return to Docente
```

The previously entered Nombre and Rol must still be present.

Module/context selection shared across contribution types may remain shared where consistent with the existing content model.

Closing or cancelling the complete contribution flow may discard this temporary state.

Persistent recovery after browser refresh, logout, or a later session is not required.

The implementation must not introduce a new database draft lifecycle under this SPEC.

---

### UXR-6 — Favicon

Integrate the supplied D+ favicon into the application's browser/application metadata.

The favicon must:

- load from the deployed application;
- display correctly in supported browsers;
- not rely on the original local/upload path;
- be stored using the repository's appropriate static asset convention.

Conversion of the supplied source asset to a more suitable web favicon format is allowed if necessary.

---

# 6. Content Navigation Contract

This remediation must preserve the intended distinction between the major discovery surfaces.

## Módulos

Módulos represent the curriculum structure.

They may be explored through:

- Grilla;
- Programa;
- search;
- applicable filters.

Module detail remains the primary contextual surface for exploring information associated with a curriculum module.

---

## Referencias

Referencias provide discovery of supporting institutions/materials and related reference content.

Referencias do not inherit the curricular Programa representation.

They remain searchable/filterable according to applicable metadata and relationships.

---

## Entity relationships

This SPEC must not flatten the content model into four equivalent top-level content types.

The reference UX implies contextual relationships approximately of the form:

```text
Curriculum Module
├── Programa
├── Notas didácticas / materiales
├── Docentes
├── Instituciones
└── Materiales
```

while institutions/materials may additionally be discoverable through the Referencias surface.

Implementation may adapt presentation details, but it must not redefine these relationships without a new product decision.

---

# 7. Responsive Behavior

The remediation must be validated at desktop, intermediate/tablet-like widths, and narrow/mobile widths.

At minimum:

### Desktop

- full global search;
- keyboard shortcut indicator where space permits;
- desktop filter presentation;
- desktop modal presentation;
- Grilla/Programa selector visible for Módulos.

### Intermediate width

- search must not collide with adjacent navigation or shortcut UI;
- controls must remain readable and actionable;
- hiding secondary decoration such as the `/` indicator is preferred over truncating essential search affordances.

### Mobile

- global search remains usable;
- mobile navigation and filter drawer must coexist correctly with other overlays;
- contribution/detail surfaces must fit the viewport;
- no horizontal overflow from filter chips or search controls;
- modal hierarchy and Escape/close behavior remain consistent with desktop.

Exact responsive breakpoints are implementation choices unless already standardized in the application.

---

# 8. Accessibility Expectations

Modified interactive components must preserve or improve accessibility.

At minimum:

- controls have accessible names;
- searchable multi-select controls are keyboard operable;
- selected filter values can be removed by keyboard;
- focus state is visible;
- dialogs expose appropriate dialog semantics where applicable;
- modal focus does not escape into inaccessible background content;
- closing a modal restores meaningful focus;
- Escape behavior is predictable;
- selected/unselected states are not communicated solely through color;
- interactive targets remain usable on narrow/mobile layouts.

This SPEC does not require a complete application-wide accessibility audit.

---

# 9. Constraints

## Product constraints

Do not change:

- curriculum semantics;
- content governance;
- publication rules;
- authorization model;
- contribution ownership rules;
- archival behavior;
- existing content types.

## UX constraints

The implementation should preserve the visual language established by the reference prototype unless a change is necessary to satisfy this SPEC.

New controls should feel native to the existing application rather than introducing a separate design system.

## Data constraints

Searchable filtering must operate on the existing entity/content relationships.

No new semantic relationships may be inferred merely to support filtering.

## Compatibility

Existing valid URLs/navigation paths must continue to function where applicable.

Invalid `Referencias + Programa` state must be safely normalized rather than producing an error or semantically incorrect page.

---

# 10. Impact Surface

Likely affected areas include:

- application header;
- global search presentation;
- responsive navigation;
- filter components;
- filter state;
- module/reference view state;
- layout selector;
- modal/dialog components;
- keyboard event handling;
- contribution-form client state;
- application metadata/static assets;
- relevant UX/component tests.

Potentially affected but not intended to change semantically:

- module detail;
- references view;
- itinerary;
- guide;
- mobile drawer;
- contribution workflow.

Explicitly unaffected:

- database content model;
- publication governance;
- role model;
- RLS/security policy;
- archive/restore semantics;
- audit history;
- Admin content-management workflow except where a shared UI component is incidentally reused.

Any discovered requirement to change these unaffected contracts must return as:

**BLOCKED / DECISION REQUIRED**

rather than being implemented silently.

---

# 11. Acceptance Criteria

## AC-1 — Desktop search

Given sufficient desktop width, the global search renders without text/shortcut collision and existing search behavior continues to work.

## AC-2 — Constrained search

At intermediate and mobile widths, search remains usable and no placeholder, input text, or shortcut decoration overlaps.

## AC-3 — Search shortcut

The `/` shortcut indicator is displayed only where sufficient space exists, without reducing the usability of the search input.

## AC-4 — Entity type-ahead

Docentes, Materiales, and Instituciones can each be searched by typing and the available options narrow accordingly.

## AC-5 — Multiple filter selection

Users can select multiple values from each supported entity filter.

## AC-6 — Persistent selected-state visibility

Selected entity filters remain visible as chips or an equivalent representation without requiring users to rediscover them in the option list.

## AC-7 — Individual removal

A selected entity can be removed directly from its visible selected-state representation.

## AC-8 — Filter scalability

The controls remain usable with datasets substantially larger than the current small option lists and do not depend on manually scanning a long checkbox list.

## AC-9 — Módulos layouts

When viewing Módulos, both Grilla and Programa are available.

## AC-10 — Referencias layout

When viewing Referencias, Programa is not presented as an available layout.

## AC-11 — Layout normalization

Navigating from `Módulos → Programa` to Referencias results in Referencias using its valid grid/reference presentation.

## AC-12 — Invalid layout protection

An incompatible Programa state cannot cause Referencias to render as a curriculum Programa.

## AC-13 — Nested modal Escape

Given:

`Module Detail → Contribution`

pressing Escape closes Contribution while Module Detail remains open.

## AC-14 — Parent Escape

After AC-13, a subsequent Escape closes Module Detail and returns to Explorer.

## AC-15 — Topmost overlay

At any supported nested-overlay state, a close/Escape action does not close an underlying parent while leaving its child active.

## AC-16 — Modal focus

Opening and closing modified modal flows results in coherent focus placement and restoration.

## AC-17 — Background interaction

Users cannot accidentally interact with inaccessible background UI while a blocking modal is active.

## AC-18 — Docente draft preservation

Entering Docente data, switching to another contribution type, and returning to Docente preserves the entered values for the duration of the contribution session.

## AC-19 — Notes/materials draft preservation

The same preservation behavior applies to Notas y materiales.

## AC-20 — Referencias draft preservation

The same preservation behavior applies to Referencias.

## AC-21 — No persistent draft requirement

Closing the contribution session does not require preservation of unfinished input across future sessions or page reloads.

## AC-22 — Responsive overlays

Filters, mobile navigation, details, and contribution overlays remain usable at narrow viewport sizes without invalid stacking or horizontal overflow.

## AC-23 — Favicon

The D+ favicon is served by the deployed application and appears in the browser tab/application shell where supported.

## AC-24 — Regression protection

Existing curriculum exploration, search, filtering, module detail, contribution submission, itinerary, and reference discovery continue to function after the remediation.

---

# 12. Validation Requirements

Implementation must include validation of the affected interaction contracts.

At minimum validate:

### Automated

Where appropriate to the existing test architecture:

- filter search/narrowing;
- multi-selection;
- filter removal;
- layout-state normalization;
- contribution state preservation;
- overlay close ordering;
- regression of existing relevant behavior.

### Manual / visual

Validate representative viewport sizes for:

- desktop;
- intermediate width;
- mobile.

Manually verify:

- header/search collision;
- filter usability;
- selected chips;
- Grilla/Programa visibility;
- Módulos → Referencias navigation;
- nested Module Detail → Contribution navigation;
- Escape behavior;
- focus restoration;
- mobile drawer/modal stacking;
- contribution tab state;
- favicon.

Implementation must compare the resulting UX against the reference HTML for the relevant interaction flows, not only against screenshots.

---

# 13. Out of Scope

This SPEC does **not** include:

- redesign of the Admin area;
- redesign of the overall application information architecture;
- new content types;
- changes to curriculum taxonomy;
- changes to content governance;
- review/approval workflows;
- changes to authorization or roles;
- persistent contribution drafts;
- contribution autosave;
- database-backed draft recovery;
- redesign of module detail;
- redesign of itinerary;
- redesign of the Guide;
- replacement of the global search architecture;
- semantic search or AI search;
- major visual-identity redesign;
- application-wide accessibility audit;
- unrelated responsive redesign;
- new filtering dimensions beyond those already established.

Potential improvements discovered in these areas should be documented separately rather than added opportunistically to SPEC-006.

---

# 14. Implementation Freedom

The implementation agent may determine:

- component decomposition;
- reusable searchable-select implementation;
- client-state mechanism;
- responsive breakpoints where not already standardized;
- whether the `/` shortcut is hidden through CSS or responsive rendering;
- chip wrapping/layout details;
- internal overlay-stack implementation;
- exact focus-management implementation;
- favicon output format;
- test structure;
- refactoring necessary to remove duplicated interaction logic.

The implementation agent may **not** independently change:

- which entity filters exist;
- the distinction between search and filtering;
- the meaning of Programa;
- the Módulos/Referencias navigation contract;
- contribution content semantics;
- contribution governance;
- persistent draft behavior;
- authorization;
- content relationships;
- the scope boundaries defined above.

If a technical constraint makes one of those decisions impractical, implementation must stop that portion and report:

**BLOCKED / DECISION REQUIRED**

with repository evidence and proposed alternatives.

---

# 15. Knowledge Updates Required

After successful implementation and validation:

1. update this SPEC with implementation/validation evidence;
2. reconcile any UX/UI documentation that describes the old filter behavior;
3. reconcile documentation describing Grilla/Programa as a global layout if such documentation exists;
4. document the overlay/navigation contract in the appropriate durable UX/architecture source if the repository maintains one;
5. update the application/static-asset documentation only if required by existing repository conventions;
6. move SPEC-006 from `active/` to `completed/` only after implementation and validation evidence supports closure.

Do not modify the reference HTML merely to make it match the implementation.

It remains a historical/reference design artifact unless a separate decision establishes it as a maintained executable prototype.

---

# 16. Open Questions / Blockers

None currently identified at the product level.

The approved product decisions are sufficient for implementation.

Repository inspection may still identify technical constraints or existing behavior not visible in the reference prototype. Such findings may be resolved technically when they preserve the contracts in this SPEC.

Any finding that requires changing those contracts must be escalated as:

**BLOCKED / DECISION REQUIRED**

---

# 17. Completion Definition

SPEC-006 is implementation-complete when:

- UXR-1 through UXR-6 are implemented;
- all acceptance criteria applicable to the repository are validated;
- relevant automated tests pass;
- responsive/manual interaction validation passes;
- no known invalid modal/layout state remains in the covered flows;
- existing curriculum exploration behavior has not regressed;
- durable project documentation has been reconciled.

At that point the SPEC may move to:

**COMPLETED — VALIDATED**

and the overall work can proceed to product coherence verification.