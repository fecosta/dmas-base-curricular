# SPEC-006 — Explorer UX/UI Fidelity & Interaction Layer

**Status:** ACTIVE  
**Methodology state:** IMPLEMENTATION READY  
**Depends on:** SPEC-001, SPEC-002, SPEC-003, SPEC-004, SPEC-005  
**Product language:** Spanish-first

## UX/UI reference

The stakeholder-approved Explorer prototype used for SPEC-006 must be stored under `resources/ux-ui/` before implementation begins.

For the surfaces covered by SPEC-006, that artifact **supersedes the previous Explorer UX/UI baseline** while preserving the previous artifact as historical design evidence.

`resources/ux-ui/README.md` must record:

- the exact filename of the new prototype;
- its relationship to the previous baseline;
- that it is authoritative for visual and interaction direction only;
- that product, governance, security, authorization, data and lifecycle contracts remain controlled by the repository's authoritative product documentation.

---

## 1. Purpose / Objective

Bring the production D+ Base Curricular application substantially closer to the approved Explorer UX/UI direction while preserving the product, governance, security, authorization, content lifecycle, data and publication contracts established by the authoritative repository documentation and SPEC-001 through SPEC-005.

The implementation must improve the experience across:

- application shell and navigation;
- typography and information density;
- curriculum discovery;
- search;
- filters;
- Grid and Program views;
- content cards;
- module detail interaction;
- dialogs and drawers;
- content creation and administration forms;
- responsive behavior;
- keyboard interaction;
- accessibility;
- loading, empty, error and interaction states.

The objective is **UX/UI fidelity**, not a redesign of the product architecture or product behavior.

The Explorer prototype is authoritative for:

- visual direction;
- information hierarchy;
- component language;
- spacing;
- typography intent;
- interaction patterns;
- responsive intent.

It is not authoritative where it conflicts with product, security, governance, authorization, lifecycle, data or architecture contracts.

---

## 2. Current State

The application already contains the functional foundations required for this work.

### 2.1 Application shell

The authenticated application provides:

- D+ Base Curricular branding;
- role-aware primary navigation;
- reader access to the curriculum library;
- Admin access to content administration;
- session context;
- responsive navigation;
- logout;
- permission-aware rendering.

Admin-only destinations must remain absent from unauthorized reader markup.

### 2.2 Curriculum Library

The Library currently provides:

- server-rendered curriculum discovery;
- query-string-driven filtering;
- search;
- country filtering;
- theme filtering;
- entity filtering;
- axis filtering;
- Grid view;
- Program view;
- module cards;
- published reference previews;
- canonical module routes.

The URL is already the durable state contract for applied Library filtering and view selection.

### 2.3 Module detail

Published modules currently have canonical routes under:

`/app/library/modules/[id]`

The page provides module information including:

- axis;
- title;
- description;
- program topics;
- teaching notes;
- learning outcomes;
- instructors;
- materials;
- institutions.

The canonical detail route is an established reader contract.

### 2.4 Content management

The application already supports governed content types including:

- Module;
- Program Topic;
- Instructor;
- Teaching Note;
- Material;
- Institution.

The production content-management system supports:

- typed content creation;
- relationships;
- required-field validation;
- Draft persistence;
- private attachments where permitted;
- provenance;
- successor revisions;
- publication;
- archival;
- restoration;
- lifecycle history.

Under the current operational contract, governed-content mutation is Admin-only.

The active lifecycle is:

`Draft -> Published`

For an existing Published object:

`Published v1 -> Draft v2 -> Published v2`

The historical collaborative Contributor review workflow remains deferred.

### 2.5 Existing design foundation

The production application already incorporates part of the Explorer visual direction through:

- design tokens;
- Inter-based typography;
- application colors;
- border treatments;
- surface treatments;
- radii;
- shadows;
- reusable fields;
- buttons;
- cards;
- segmented controls;
- notices.

The principal remaining gap is therefore not basic theming but:

**interaction fidelity, information hierarchy, density, responsive behavior and composition.**

---

## 3. Problem / Gap

The current implementation correctly represents the product architecture and governance model but does not yet reproduce several important characteristics of the Explorer experience.

The largest gaps are:

1. navigation and header composition;
2. information density and typography hierarchy;
3. search prominence and interaction;
4. filter presentation and mobile behavior;
5. module-card composition;
6. module-detail interaction;
7. dialog and drawer behavior;
8. form presentation;
9. responsive transitions;
10. keyboard shortcuts and micro-interactions.

The prototype behaves more like a purpose-built curriculum explorer, while some production surfaces still expose conventional web-application patterns.

The implementation must close this experience gap without replacing production contracts with prototype-only behavior.

---

## 4. Decision

### 4.1 Explorer UX direction

The latest stakeholder-approved Explorer prototype is adopted as the UX/UI fidelity reference for the surfaces covered by SPEC-006.

The production application should move toward its:

- visual hierarchy;
- compact editorial typography;
- spacing;
- card composition;
- filter presentation;
- search treatment;
- modal treatment;
- drawer behavior;
- navigation density;
- responsive transitions;
- interaction patterns.

### 4.2 Production contracts remain authoritative

Where prototype behavior conflicts with an existing product contract, the existing production contract wins.

SPEC-006 must not alter:

- authentication;
- authorization;
- organization membership;
- Admin boundaries;
- provenance;
- revision identity;
- lifecycle;
- publication authority;
- archival behavior;
- restoration behavior;
- audit history;
- private attachment access;
- reader isolation;
- content semantics.

### 4.3 Progressive fidelity

The implementation should reuse and evolve existing production primitives rather than create a second parallel design system.

Existing accessible components and routes should be improved rather than replaced unless technical investigation demonstrates that replacement is necessary.

### 4.4 Canonical routes plus contextual overlays

Canonical module URLs remain authoritative.

When a module is opened from the Library, the application should additionally support an Explorer-style contextual detail overlay where technically appropriate.

Direct navigation to the canonical URL must continue rendering a complete standalone detail experience.

### 4.5 Existing Personal Itinerary contract

Personal Itinerary is an **already-approved product capability** under the authoritative product baseline and D-007.

It is a personal content selection, not a learning trail.

SPEC-006 does **not** implement, redesign, remove, defer or supersede that product contract.

The following remain outside the implementation scope of SPEC-006:

- itinerary implementation;
- itinerary persistence;
- itinerary export;
- itinerary interaction redesign.

Their exclusion from SPEC-006 is a delivery boundary, not a statement that they require a new product decision.

### 4.6 Prototype-only capabilities

Prototype behavior that is not already supported by an authoritative product decision must not automatically enter scope.

In particular, a prototype `Guía` capability or other new navigation/product behavior requires separate product authority before implementation if it is not already part of the product contract.

---

## 5. Scope

### 5.1 In Scope

#### Foundation

- typography scale;
- information density;
- spacing;
- radius refinement;
- overlay treatment;
- elevation;
- interaction motion;
- reusable dialog primitives;
- reusable drawer primitives;
- search primitives;
- filter primitives;
- icon-button treatment;
- focus treatment.

#### Application shell

- header composition;
- brand hierarchy;
- primary navigation presentation;
- compact navigation;
- mobile navigation;
- search placement;
- session/account presentation;
- responsive transitions.

#### Library Explorer

- search;
- search suggestions;
- filter panel;
- filter groups;
- filter chips;
- mobile filter drawer;
- Grid / Program switch;
- axis controls;
- entity controls;
- curriculum cards;
- responsive grid;
- empty states;
- result counts where supported by existing data.

#### Module detail

- contextual detail overlay;
- desktop dialog/panel presentation;
- mobile full-screen presentation;
- canonical-route preservation;
- keyboard dismissal;
- focus management;
- background-scroll management.

#### Content-management UX

- content creation presentation;
- content-type selection;
- modal/sheet presentation where appropriate;
- form hierarchy;
- section composition;
- validation presentation;
- relationship-picker presentation;
- attachment presentation;
- workflow-action presentation.

#### Responsive behavior

- wide desktop;
- compact desktop;
- tablet;
- mobile;
- filter-drawer behavior;
- detail full-screen behavior;
- navigation transitions.

#### Accessibility

- keyboard navigation;
- focus visibility;
- focus trapping;
- focus restoration;
- semantic dialog behavior;
- accessible form labeling;
- Escape behavior;
- reduced-motion compatibility where appropriate.

### 5.2 Out of Scope

SPEC-006 does not implement or authorize:

- Personal Itinerary delivery;
- itinerary persistence;
- itinerary export;
- itinerary UX redesign;
- Guide functionality not otherwise authorized;
- new curriculum entity types;
- new lifecycle states;
- review-workflow reactivation;
- authorization redesign;
- new product roles;
- new organization rules;
- changes to published-reader isolation;
- public unauthenticated access;
- analytics;
- recommendation engines;
- AI search;
- semantic search;
- attachment-privacy changes;
- replacement of canonical module URLs;
- audit-semantic changes;
- archival-semantic changes;
- database-schema changes solely for visual fidelity.

---

## 6. UX Reference Contract

The Explorer prototype must be interpreted as **design evidence**, not executable product requirements.

Implementation should reproduce its intent where compatible with production contracts.

### 6.1 Typography

The Explorer uses a compact editorial hierarchy.

Expected direction includes:

- strong display treatment for major Explorer headings;
- high weight contrast;
- compact uppercase metadata;
- small labels;
- dense control typography;
- restrained body sizes;
- reduced unnecessary vertical whitespace.

Representative prototype intent includes approximately:

- 36–56 px responsive display headings;
- 14 px explanatory body copy;
- approximately 13 px form controls;
- approximately 11–12 px compact navigation and controls;
- approximately 9–11 px metadata and badges.

These are reference values rather than immutable CSS requirements.

Production may adjust them for:

- accessibility;
- Spanish copy;
- real content;
- responsive layout;
- browser behavior.

### 6.2 Surface language

Preserve the Explorer visual language:

- light neutral canvas;
- white surfaces;
- subtle cool borders;
- rounded surfaces;
- restrained elevation;
- dark/blue brand emphasis;
- compact controls;
- clear blue selected states.

### 6.3 Density

Production should become materially denser while preserving:

- readability;
- appropriate interactive hit areas;
- focus visibility;
- form validation;
- localization;
- keyboard usability.

---

## 7. Application Shell

### 7.1 Wide desktop

The shell should clearly communicate:

1. D+ / Base Curricular identity;
2. primary navigation;
3. curriculum discovery/search;
4. account/session controls.

Navigation remains permission-aware.

### 7.2 Compact desktop

At approximately the prototype's compact-navigation range around 1180 px, the shell should reduce its footprint without losing existing functionality.

The exact breakpoint is implementation freedom after browser validation.

### 7.3 Mobile

At narrow widths:

- desktop navigation may collapse;
- primary destinations remain discoverable;
- search remains usable;
- account/session actions remain accessible;
- authorization rules remain server-enforced.

Responsive rendering must never expose Admin destinations to non-Admin users.

---

## 8. Library Explorer

### 8.1 Layout

On wide screens, target:

`Filter panel | Results`

The filter region should approximate the prototype's narrow persistent sidebar, around 292 px in visual intent.

### 8.2 Filter panel

Desktop filters should:

- remain visible during exploration where viewport space allows;
- visually group related dimensions;
- clearly indicate selected values;
- provide clear reset behavior;
- preserve query-string state.

Counts may be displayed where existing queries/data support them without introducing new persistence solely for presentation.

### 8.3 Filter chips

Where appropriate, filters should use compact interactive chips.

Selected state must be obvious.

Chips must be keyboard operable and accessible.

### 8.4 Mobile drawer

At narrow widths, filters should move to a drawer inspired by the prototype:

- left side;
- approximately 330 px max-width;
- approximately 88vw maximum;
- full viewport height;
- independent vertical scroll;
- backdrop;
- close control;
- Escape dismissal;
- focus containment;
- focus restoration.

Production must use accessible drawer/dialog semantics.

### 8.5 URL authority

Applied Library discovery state remains URL-driven.

The implementation must not create an independent client-side applied-filter state that diverges from the canonical URL.

Transient UI state may exist for:

- open/closed drawer;
- local search typing;
- focus state;
- suggestion state;
- animation state.

---

## 9. Search

### 9.1 Prominence

Search becomes a primary discovery interaction rather than only an ordinary filter field.

### 9.2 Suggestions

Where existing authorized data can support it, search should display compact suggestions grouped by relevant published entity type, including at minimum where applicable:

- modules;
- materials;
- institutions.

Suggestions must never expose unpublished or unauthorized records.

### 9.3 Interaction

Suggestions should support:

- keyboard navigation;
- visible active state;
- Enter;
- Escape;
- pointer selection;
- accessible naming.

### 9.4 `/` shortcut

When focus is not inside an editable or incompatible interactive context, `/` should focus the primary Library search.

The shortcut must not intercept typing inside:

- input;
- textarea;
- select;
- contenteditable;

and should account for modifier keys and modal contexts where appropriate.

### 9.5 Server boundary

Existing curriculum query modules are server-only.

Interactive search must preserve that boundary through a suitable authenticated server mechanism rather than importing server-only query logic into Client Components.

The specific mechanism is implementation freedom.

---

## 10. Grid and Program Views

The existing `Grilla` and `Programa` views remain product behavior.

### 10.1 View control

Use compact segmented-control presentation aligned with the Explorer.

### 10.2 State

Selected view remains URL-representable.

### 10.3 Program semantics

Program ordering and relationships continue to come from production data.

SPEC-006 may change visual hierarchy but must not invent new curriculum ordering or progression semantics.

---

## 11. Curriculum Cards

Cards should become more compact and editorial.

Expected characteristics include:

- subtle borders;
- moderate radius;
- restrained elevation;
- compact padding;
- small metadata;
- strong title hierarchy;
- restrained description length;
- visible axis/context;
- less dominant CTA treatment.

Wide layouts should approximate a fluid minimum-card-width grid, with the prototype's approximately 332 px card width used as visual reference rather than an immutable value.

Where semantics permit, cards should provide a larger interactive target.

Nested controls must remain semantically valid.

Hover and focus states may use subtle elevation, border or translation changes.

Keyboard focus must remain clearly visible.

---

## 12. Module Detail Interaction

### 12.1 Canonical route

`/app/library/modules/[id]`

remains canonical.

Direct visits, reloads and shared URLs must continue to work.

### 12.2 Shared content rendering

The implementation should avoid maintaining two independent versions of module-detail content.

The canonical page and contextual detail experience should reuse the same core rendering/data semantics where practical.

### 12.3 Contextual overlay

Opening a module from the Library should support Explorer-style contextual detail behavior where compatible with App Router architecture.

Framework-native intercepting or parallel routing may be used, but exact routing architecture is implementation freedom.

### 12.4 Desktop

Visual reference:

- large centered panel;
- approximately 1060 px maximum width;
- viewport-constrained height;
- approximately 26 px outer radius;
- elevated shadow;
- backdrop.

### 12.5 Mobile

Narrow screens should provide effectively full-screen detail:

- full width;
- full available height;
- reduced outer radius;
- independent content scrolling;
- discoverable close/back action.

### 12.6 Required behavior

Validate:

- direct canonical URL;
- contextual open from Library;
- Escape;
- focus trap;
- focus restoration;
- scroll lock;
- browser Back;
- refresh;
- mobile full-screen;
- Library-context preservation.

---

## 13. Dialog and Drawer Primitives

SPEC-006 should establish reusable accessible overlay primitives.

Conceptual components may include:

- Dialog;
- DialogOverlay;
- DialogPanel;
- DialogHeader;
- DialogBody;
- DialogFooter;
- Drawer.

Names and component architecture are implementation freedom.

Required behavior:

- appropriate dialog semantics;
- accessible title;
- focus containment;
- initial focus;
- focus restoration;
- Escape;
- background scroll lock;
- nested scrolling;
- responsive sizing.

The implementation should first evaluate the existing stack and native/platform primitives before introducing a broad UI framework dependency.

Introducing an entire parallel design-system framework solely for SPEC-006 should be avoided.

---

## 14. Content Management UX

### 14.1 Preserve current governance

The current Admin-only content-management model remains authoritative.

Do not reintroduce current UI semantics for:

- Contributor submission;
- Under Review;
- Changes Requested;
- approval;
- resubmission;

unless separately authorized by a later product decision/specification.

### 14.2 Creation entry

New-content creation may begin with a visually explicit content-type selection inspired by the Explorer.

### 14.3 Type presentation

Existing types may be presented through:

- cards;
- tabs;
- compact selectors;
- grouped options.

### 14.4 Forms

Existing production fields and server actions remain authoritative.

SPEC-006 may improve:

- grouping;
- layout;
- hierarchy;
- labels;
- help text;
- responsive columns;
- relationship presentation;
- attachment presentation;
- validation presentation;
- action hierarchy.

### 14.5 Validation

Validation errors should:

- appear close to relevant controls where practical;
- provide clear multi-error feedback when useful;
- not depend exclusively on color;
- preserve entered values;
- be accessible.

Dedicated edit, history and governance routes may remain page-based.

SPEC-006 does not require converting all Admin surfaces to dialogs.

---

## 15. Responsive Behavior

Use the prototype's approximately 1180 px and 900 px transitions as behavioral references, not mandatory breakpoints.

### Wide

- full navigation;
- persistent filters;
- multi-column grid;
- centered detail overlay.

### Compact desktop / landscape tablet

- compact navigation;
- preserved search;
- reduced spacing;
- adaptive grid.

### Narrow / portrait tablet / mobile

- collapsed navigation;
- filter drawer;
- reduced-column or single-column content;
- full-screen module detail;
- primarily single-column forms;
- no horizontal-scroll dependence.

Validate at minimum:

- 1440 px;
- 1280 px;
- 1024 px;
- approximately 900 px;
- 768 px;
- 390 px.

---

## 16. Motion

Motion supports orientation rather than decoration.

Applicable interactions may include:

- dialogs;
- drawers;
- cards;
- selected chips;
- search suggestions;
- navigation disclosure.

The prototype's approximately 200 ms overlay behavior is a useful reference.

Respect `prefers-reduced-motion`.

---

## 17. Accessibility

Accessibility takes precedence over literal visual fidelity.

Validate:

- Tab;
- Shift+Tab;
- Enter;
- Space where applicable;
- Escape;
- arrow-key navigation where implemented;
- `/` search shortcut;
- visible focus;
- focus containment;
- focus restoration;
- accessible names;
- form-error associations;
- semantic dialog behavior;
- responsive keyboard access.

Compact typography must not imply unreasonably small interactive targets.

---

## 18. Prototype → Production Fidelity Matrix

| Surface | Prototype Direction | Current Production | Required Change |
|---|---|---|---|
| Colors / surfaces | Established visual language | Already close | Refine |
| Typography | Compact/editorial | Partially aligned | Increase fidelity |
| Header | Integrated Explorer shell | Conventional app header | Recompose |
| Navigation | Compact/adaptive | Accessible but conventional | Refine presentation |
| Search | Prominent + suggestions | Ordinary filter search | Promote + suggestions |
| Filters | Sidebar + mobile drawer | Conventional form | Explorer filter system |
| Filter state | Interactive | URL query parameters | Preserve URL authority |
| Grid | Fluid dense cards | Fixed responsive columns | Increase density/fluidity |
| Program | Explorer mode | Already implemented | Visual refinement |
| Cards | Editorial | Functionally close | Refine hierarchy |
| Module detail | Overlay/full-screen | Canonical page | Add contextual overlay |
| Dialogs | Core pattern | Limited | Add accessible primitives |
| Mobile filters | Drawer | Responsive form | Add drawer |
| Forms | Cards/tabs/modal language | Rich production forms | Apply visual language |
| Validation | Compact contextual | Production validation | Improve presentation |
| Keyboard `/` | Search focus | Missing | Add |
| Escape | Closes overlays | Partial | Standardize |
| Itinerary | Existing approved product capability | Not delivered by SPEC-006 | Preserve contract; out of scope |
| Guide | Prototype capability | No verified current contract | Exclude pending separate authority |

---

## 19. Constraints

### Product

Do not change established product semantics for visual fidelity.

### Security

Preserve:

- server-side authorization;
- role enforcement;
- unpublished-content isolation;
- attachment privacy;
- Admin boundaries;
- provenance protections.

### Data

No new persisted data should be introduced solely for cosmetic fidelity.

### Database / migrations

No database migration is currently expected for SPEC-006.

If implementation concludes that a migration, new table, new RLS policy, new governance RPC or lifecycle change is required, treat this as an architectural/product-risk signal.

Before making such a change, verify whether the requirement can be satisfied without changing the existing data/security contract.

If not:

`BLOCKED / DECISION REQUIRED`

### Architecture

Reuse the current Next.js App Router application.

Do not introduce a parallel SPA routing/state system to imitate the offline prototype.

### Search

Continue using the existing authorized PostgreSQL/search architecture unless a separate decision changes that contract.

### URL state

Applied Library discovery state remains URL-driven.

### Language

User-facing application copy remains Spanish-first.

### Prototype code

Do not copy prototype implementation code blindly into production.

It is design evidence.

---

## 20. Impact Surface

Expected affected areas:

- global UI styles;
- tokens;
- shared UI primitives;
- application layout;
- navigation;
- Library page;
- Library search;
- filters;
- cards;
- Program presentation;
- module detail presentation/routing;
- content-management presentation;
- responsive behavior;
- accessibility tests;
- browser/E2E tests.

Expected unaffected contracts:

- authentication;
- organization eligibility;
- persisted roles;
- content identity;
- revision semantics;
- publication;
- archival;
- restoration;
- lifecycle history;
- attachment authorization.

---

## 21. Implementation Phases

### Phase 1 — UX Foundation

Establish reusable fidelity primitives.

Expected work:

- typography/density review;
- overlay/elevation tokens;
- motion conventions;
- Dialog;
- Drawer;
- SearchInput foundation;
- FilterChip / FilterGroup where useful;
- Button/Card/Field/Segmented review;
- focused primitive tests.

Do not redesign Library composition in this phase.

Do not change product or data contracts.

### Phase 2 — Application Shell

Implement:

- header;
- brand hierarchy;
- wide navigation;
- compact navigation;
- mobile navigation;
- search placement;
- session/account presentation.

Validate Admin and non-Admin independently.

### Phase 3 — Library Explorer

Implement:

- filter sidebar;
- filter drawer;
- search;
- search suggestions;
- selected-filter presentation;
- Grid/Program controls;
- card density;
- responsive grid;
- relevant empty states.

Preserve query-string authority.

### Phase 4 — Module Detail Interaction

Implement contextual detail while retaining canonical routes.

Validate:

- direct URL;
- Library open;
- Back;
- reload;
- close;
- Escape;
- focus restoration;
- mobile full-screen;
- scroll lock.

### Phase 5 — Content Management UX

Apply Explorer interaction language to relevant Admin creation/management surfaces.

Preserve:

- Admin-only mutation;
- fields;
- server actions;
- relationships;
- attachments;
- validation;
- revision semantics;
- publication semantics.

### Phase 6 — Validation and Polish

Complete:

- responsive validation;
- keyboard validation;
- accessibility;
- long-content scenarios;
- empty/error states;
- Member/Admin regression;
- browser journeys;
- documentation reconciliation.

Each phase should be implemented and validated as a bounded unit before starting the next substantial phase.

---

## 22. Acceptance Criteria

### Foundation

- [ ] Reusable accessible Dialog behavior exists.
- [ ] Reusable accessible Drawer behavior exists.
- [ ] Typography materially reflects Explorer hierarchy.
- [ ] Existing primitives remain coherent.
- [ ] Focus remains clearly visible.
- [ ] Reduced-motion behavior is respected where applicable.

### Shell

- [ ] Header reflects Explorer direction.
- [ ] Wide, compact and mobile states work.
- [ ] Search remains discoverable.
- [ ] Admin navigation is absent for unauthorized users.
- [ ] Logout/session behavior is unchanged.

### Library

- [ ] Wide Library uses Explorer-style filter/results composition.
- [ ] Narrow Library uses accessible filter drawer.
- [ ] Existing filters remain canonical URL parameters.
- [ ] Applied state survives reload/link sharing.
- [ ] Grid and Program remain functional.
- [ ] Cards materially reflect Explorer density.
- [ ] Required validation widths are usable.

### Search

- [ ] Search is visually prominent.
- [ ] `/` focuses search where safe.
- [ ] Suggestions include authorized Published content only.
- [ ] Suggestions are keyboard operable.
- [ ] Escape closes suggestions.
- [ ] Search preserves the production query/security contract.

### Module detail

- [ ] Canonical URLs work directly.
- [ ] Library may open contextual overlay.
- [ ] Desktop overlay follows Explorer direction.
- [ ] Mobile detail is full-screen or functionally equivalent.
- [ ] Escape works.
- [ ] Focus is contained.
- [ ] Focus returns after close.
- [ ] Background scrolling is controlled.
- [ ] Back behavior is coherent.
- [ ] Library context is preserved where supported by canonical URL state.

### Content management

- [ ] Existing authorized content types remain available.
- [ ] Existing required fields remain authoritative.
- [ ] Relationships retain semantics.
- [ ] Attachment security remains unchanged.
- [ ] Draft/publication behavior remains unchanged.
- [ ] Deferred collaborative workflow is not reintroduced.
- [ ] Validation is clearer and accessible.

### Security/governance

- [ ] No unpublished content appears through search or overlays.
- [ ] No Admin action becomes available to non-Admins.
- [ ] No attachment-privacy rule is weakened.
- [ ] No provenance rule changes.
- [ ] No revision/publication semantics change.
- [ ] No archival/history semantics change.

### Regression

- [ ] Relevant existing tests pass.
- [ ] New interaction behavior has focused tests.
- [ ] Keyboard behavior is explicitly validated.
- [ ] Admin and non-Admin are validated independently.
- [ ] Direct module URLs are validated.
- [ ] Filter/query URLs are validated.
- [ ] Mobile Dialog/Drawer behavior is validated.

---

## 23. Implementation Freedom

The implementation agent may choose:

- component names;
- component boundaries;
- exact Tailwind utilities;
- CSS custom properties;
- exact responsive breakpoints;
- animation implementation;
- native dialog versus a small focused dependency;
- App Router overlay implementation;
- search suggestion boundary;
- internal responsive composition;
- test organization.

The agent may make small visual deviations for:

- accessibility;
- real Spanish content;
- responsive constraints;
- browser behavior;
- maintainability.

The agent must not silently change:

- product behavior;
- authorization;
- lifecycle;
- publication;
- content semantics;
- data ownership;
- provenance;
- canonical routes;
- attachment privacy;
- archival;
- lifecycle history.

If preserving the requested UX requires one of those changes:

`BLOCKED / DECISION REQUIRED`

---

## 24. Validation Strategy

### Automated

Run applicable:

- unit/integration tests;
- UI/component behavior tests;
- authorization regression tests;
- route tests;
- filter/query tests;
- keyboard tests;
- Dialog/Drawer tests;
- lifecycle regression tests;
- typecheck;
- lint;
- production build.

Do not claim checks that were not actually run.

### Browser

Validate at minimum:

- 1440;
- 1280;
- 1024;
- ~900;
- 768;
- 390 px.

Validate both:

- non-Admin reader;
- Admin.

Representative journeys:

1. Library default;
2. multiple filters;
3. search;
4. suggestions;
5. Grid → Program;
6. module open;
7. module close;
8. browser Back;
9. canonical module URL;
10. mobile filters;
11. mobile detail;
12. keyboard-only Library;
13. Admin content creation;
14. validation errors;
15. long content;
16. empty result;
17. recoverable error state.

---

## 25. Knowledge Updates Required

Before implementation begins:

### `resources/ux-ui/`

resources/ux-ui/Base Curricular - Explorador (offline).html is the authoritative UX/UI reference for SPEC-006. It remains the same stakeholder-approved Explorer baseline already tracked by the repository. SPEC-006 extends production fidelity to that baseline; it does not depend on a newer or superseding prototype artifact.

### `resources/ux-ui/README.md`

Record that the new prototype supersedes the previous baseline for SPEC-006-covered surfaces while preserving older references as historical evidence.

### `resources/specs/README.md`

Register:

`SPEC-006 — Explorer UX/UI Fidelity & Interaction Layer — active`

and update the current sequence/dependency state.

### `docs/DECISIONS.md`

Update Current Delivery State to indicate that SPEC-006 is the active delivery slice.

This activation update is governance bookkeeping, not a new product decision.

After implementation:

- reconcile architecture documentation if contextual routing or shared overlay primitives materially alter documented architecture;
- reconcile UX reference status;
- move SPEC-006 to `completed/` only after implementation and required validation are independently verified.

---

## 26. Open Questions / Blockers

No known product blocker prevents contract-preserving SPEC-006 implementation once the new reference artifact and active specification are committed to the repository.

Personal Itinerary is not a blocker. It has an existing approved product contract and is simply outside this implementation slice.

Guide or another prototype-only capability remains excluded unless separately authorized.

If implementation discovers that a requested fidelity behavior requires changing:

- authorization;
- lifecycle;
- data semantics;
- security;
- publication;
- archival;
- audit;
- canonical product behavior;

return:

`BLOCKED / DECISION REQUIRED`

without blocking unrelated contract-preserving work.

---

## 27. Definition of Done

SPEC-006 reaches implementation completion when:

1. the application materially reflects the approved Explorer direction;
2. the Library behaves as a purpose-built curriculum explorer across desktop and mobile;
3. search, filters, cards, navigation, overlays, forms and responsive behavior satisfy the acceptance criteria;
4. canonical routing remains intact;
5. authorization and governance contracts remain intact;
6. accessibility requirements are satisfied;
7. relevant automated regression checks pass;
8. browser validation passes across the defined viewport matrix;
9. Admin and non-Admin experiences are independently validated;
10. Personal Itinerary remains preserved as an approved but separately delivered capability;
11. prototype-only behavior has not entered scope without authority;
12. durable UX/current-state documentation is reconciled.

Only after implementation, independent verification and knowledge reconciliation may SPEC-006 move to:

**COHERENCE VERIFIED**

and then be closed under repository governance.

---

# Deferred / Separately Delivered Product Capabilities

The following capability already belongs to the approved Base Curricular product but is not delivered by SPEC-006:

## Personal Itinerary

Users may maintain a personal selection of modules.

It is not:

- a mandatory sequence;
- a pedagogical progression;
- enrollment;
- completion tracking;
- certification.

Its implementation, persistence, export and detailed UX require a separate delivery slice, not a new decision that the capability exists.

Prototype concepts without equivalent authoritative product approval, such as a standalone Guide capability, remain future candidates requiring separate authority before implementation.
---

# Phase 6 Validation Evidence

Recorded by the Phase 6 implementation/validation pass. **Status remains ACTIVE**: this is implementation evidence, not independent verification. Closure follows a separate review.

## Surfaces exercised

Application shell (wide, compact, mobile sheet, header search, account/organization/role, Admin-only navigation, sign-out); Library Explorer (search, suggestions, filter panel, filter chips, active-filter removal, mobile drawer, Grilla, Programa, empty states, cards, Material/Institution references, URL persistence); module detail (contextual overlay, canonical route, direct entry, reload, Back, Forward, Escape, close control, scrim, focus entry/containment/restoration, scroll lock, mobile full-screen, navigation out to references); content management (landing, filters, creation picker, all six governed types, create forms, Draft edit, Published read-only, successor Draft, relationships, attachments, publication, archive disclosure, restore, history, validation errors, mobile composition).

## Responsive

Validated at 1440, 1280, 1180, 1024, 900, 768 and 390 px for reader and Admin across the Library (Grilla, Programa, filtered, empty), the standalone module, a reference page, the application home, the management landing, the archived view, the creation picker, two create forms, a Draft detail, a Published detail and the governance history. No horizontal overflow, clipped content, inaccessible control or broken sticky behaviour was found at any width. The compact navigation boundary behaves as intended: inline destinations through 1180 px, the modal sheet below it, never both, and the Admin destination never reaches non-Admin markup at any width.

## Keyboard

Exercised: the `/` shortcut on the Library (focuses the header search, does not type the character, stays a character inside a field, and does not pull focus out of an open modal); suggestion arrow navigation with wrap, `aria-activedescendant`, Enter to open, Escape to dismiss without clearing the query; the mobile navigation sheet and the Library filter drawer (open by Enter, focus contained, Escape, focus restored to the trigger); the module overlay (initial focus on the named panel, Tab and Shift+Tab containment, Escape returning to the exact Library URL with focus back on the originating card); management filters, creation cards, every form control, relationship search, relationship checkboxes, removal chips, lifecycle actions and the archive disclosure.

## Accessibility

One `h1` per surface across fifteen surfaces; no duplicate element ids, including while the module overlay shares a document with the Library; every `aria-labelledby` and `aria-describedby` resolves; every form control, link and button carries an accessible name; navigation, dialogs and drawers are named; a visible 2 px focus outline on every sampled control; the skip link resolves to its target; state is communicated in words as well as colour; overlay motion is suppressed under `prefers-reduced-motion` while the overlays still open and dismiss. One defect was found and fixed: the archived management cards skipped from `h2` to `h4`.

## Corrections made in Phase 6

1. **A rejected save discarded the Admin's work.** React resets an uncontrolled `<form action={…}>` once its action returns, so a validation failure cleared every entered value — and on an existing Draft silently restored the persisted values under an error message. The relationship picker was worse: its checkboxes were reset in the DOM while the chips and count still showed the selection, so the next save would have dropped the relationship. `saveContribution` now returns the submitted values with the error and the fieldset is keyed on the attempt, so the form restores exactly what was entered. Required by §14.5.
2. **Focus was dropped to the document after a rejected save,** because the submit control is disabled while the action runs. It is now returned to that control; the error `role="alert"` already announced the failure.
3. **Archived management cards used `h4` directly under an `h2`.** They are now `h3`.

## `/app/ui-primitives`

Removed. Every behaviour the Phase 1 harness covered — dialog semantics and naming, initial focus, focus containment, scroll lock, Escape, focus restoration, close control, scrim dismissal, full-screen sizing, drawer geometry from both edges — is now asserted on real production surfaces by `module-detail.spec.ts`, `library-explorer.spec.ts` and `shell.spec.ts`, in most cases more meaningfully than the harness did. The only coverage without a production equivalent was the `/` shortcut; it was migrated to `library-explorer.spec.ts` against the Library's own header search before the route was deleted. The production build exposes no development-only route.

## Contracts re-verified

Admin-only governed-content mutation; non-Admin published-reader boundary (every management route redirects a reader to `/access-denied`, and no Admin destination appears in reader markup at any width); `Draft -> Published`; successor Draft leaving the published version current and reader-visible; published revisions read-only; archival and restoration semantics including the active-Draft blocker; suggestions returning no Draft or archived content. No migration, RLS policy, governance RPC, Storage rule, auth change, role or lifecycle state was added or modified. Personal Itinerary remains an approved capability outside this delivery slice; a prototype `Guía` capability remains excluded; no review-workflow state was reintroduced.
