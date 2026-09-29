# SPEC-007 — UX/UI Navigation & Interaction Remediation

**Status:** COMPLETED — VALIDATED\
**Type:** UX/UI remediation\
**UX reference:** `resources/ux-ui/Base Curricular - Explorador (offline).html`\
**Depends on:** SPEC-001 through SPEC-006 (completed); the current Library Explorer, application shell and published-content model\
**Does not depend on:** Admin UX redesign or changes to content governance\
**Decision status:** Product decisions approved; reconciled with the current product after technical preflight

---

## 1. Purpose

Improve the responsiveness, layout coherence and navigation robustness of the Base Curricular interface following stakeholder and senior UX/UI review.

This SPEC repairs concrete interaction issues in the current implementation while preserving the existing product structure, content model, governance and security contracts.

The work covers:

1. responsive global search;
2. contextual `Grilla / Programa` views;
3. an overlay and modal navigation regression contract;
4. platform favicon integration.

This is a **bounded remediation**, not a redesign of the Base Curricular product.

### Reconciliation note

An earlier draft of this remediation was added as a second `SPEC-006`. That identifier already belongs to the completed `resources/specs/completed/006-explorer-ux-ui-fidelity.md`, which remains unchanged historical truth. This remediation is `SPEC-007`.

The technical preflight also found that two requirements in the earlier draft described prototype behavior that does not exist in the current product:

- Library relationship filters for Docentes, Materiales and Instituciones, presented as long checkbox lists. The current Library filters by search, `Eje`, `Tipo`, `País o alcance` and `Tema` only.
- A tabbed Docente / Notas y materiales / Referencias contribution modal with per-tab draft preservation. That workflow exists only in the prototype, where it is open to non-Admins, and is superseded by D-030.

Both have been removed as current implementation requirements. See §4 and §10.

---

## 2. Sources and precedence

Where sources disagree, the following order applies:

1. current authoritative product documents and decisions under `docs/`;
2. this SPEC, for the bounded remediation it defines;
3. the current implementation, as evidence of current state;
4. the UX reference `resources/ux-ui/Base Curricular - Explorador (offline).html`, as an interaction and visual reference where it does not conflict with 1–3.

The prototype contains behavior that is historical, prototype-only or superseded, and must not be reintroduced through this SPEC, including:

- non-Admin contribution (the "Colaborar" flow and its Docente / Notas y materiales / Referencias tabs);
- `localStorage` contribution, itinerary or session state;
- the module-card completeness percentage;
- `Ementa` terminology (the product uses **Programa**);
- fake or guest login;
- JSON import/export.

D-030 and the current product documents are authoritative for contribution and governance behavior. SPEC-007 must not reintroduce non-Admin governed-content mutation.

The reference HTML must not be edited to match the implementation.

---

## 3. Current state and identified gaps

### 3.1 Global search

The header carries the Library search on `/app` and `/app/library`. It is a GET form to `/app/library` with grouped, keyboard-operable suggestions for **Módulos**, **Materiales** and **Instituciones**, served by the authenticated suggestions boundary.

At constrained widths:

- the search field is narrow and the current placeholder `Buscar tema, docente o institución…` truncates;
- the visible `/` shortcut hint is always rendered, including at mobile widths where it competes with the field for space;
- the placeholder promises a `docente` result type that current suggestions do not provide.

This is a responsive and wording defect, not a change to the search model.

### 3.2 Grilla / Programa

The Library `Tipo` control offers `Todo`, `Módulos`, `Materiales` and `Instituciones`. The `Vista` control (`Grilla` / `Programa`) is rendered for every `Tipo`, and the `view` URL parameter survives `Tipo` changes.

Reference results already always render as a grid, but on `Materiales` or `Instituciones` the `Vista` control is still shown, and a URL such as `?entity=material&view=programa` presents `Programa` as the active layout of a surface that cannot render it.

`Programa` represents curricular module structure and applies only to module-capable surfaces.

### 3.3 Overlays and modals

Current overlays are:

- the search suggestion popover (non-modal);
- the compact navigation sheet;
- the Library filter drawer;
- the contextual module detail overlay.

The sheet, drawer and module detail are built on native modal `<dialog>` primitives (`useModalDialog`, `Dialog`, `Drawer`). The browser's top layer provides topmost-only Escape, background inertness and focus containment; focus is restored on close; a single `html:has(dialog[open])` rule locks background scroll. The suggestion popover handles Escape only while it is open.

No current flow opens one modal from inside another. The architecture already substantially satisfies the overlay contract; the remaining need is to protect it against regression.

### 3.4 Favicon

A D+ favicon asset has been supplied for the application but is not yet in the repository. The application currently declares no icon.

---

## 4. Product decisions

The following decisions are authoritative for this SPEC.

### D1 — Search wording matches what search returns

The global search placeholder is `Buscar en la base…` at all widths. It must not promise a result type the search does not return. Docente is not added as a search result type by this SPEC.

### D2 — Programa belongs only to module-capable surfaces

```text
Todo / Módulos
├── Grilla
└── Programa

Materiales / Instituciones
└── Grilla
```

A reference surface rendered as `Programa` is not a valid application state.

### D3 — Layout preference is contextual

Moving from `Módulos → Programa` to `Materiales` or `Instituciones` displays `Grilla`. Returning to a module-capable surface may restore the previous module layout.

The URL may keep `view=programa` while a reference surface is shown; the rendered view is what must be valid. No additional client persistence is required for this behavior.

### D4 — Native dialog semantics are the overlay contract

Only the topmost dismissible modal responds to Escape or backdrop dismissal. The native modal `<dialog>` primitives are the mechanism, and no global overlay manager is introduced without a demonstrated need.

### D5 — Relationship filters and contribution tabs are not current scope

Library relationship filters for Docentes, Materiales or Instituciones are not part of the current product and are not introduced by this SPEC.

The prototype's tabbed contribution workflow is superseded by D-030. Governed content is created and edited only by Admins through the current Admin content-management routes, which are outside this SPEC.

### D6 — No broader redesign

This SPEC must not be used as justification for redesigning unrelated parts of the product.

### D7 — Mobile header wordmark yields to search

Approved after implementation as a refinement of UXR-1. Below the Tailwind `sm` breakpoint (640px) the textual `Base Curricular / Democracia+` wordmark is visually hidden so the global search keeps usable width. The D+ visual mark stays visible, the wordmark remains the brand link's accessible name, and search functionality and discoverability are unchanged. This is a responsive adaptation only, not a mobile-header redesign.

---

## 5. Scope

### UXR-1 — Responsive Global Search

Repair the responsive presentation of the header search.

Required behavior:

- the placeholder is `Buscar en la base…` at all widths, unless current product documents establish a better approved Spanish phrase;
- the placeholder, entered text and `/` shortcut hint never overlap;
- the visible `/` hint is hidden where width is insufficient, and shown where space permits;
- the `/` shortcut itself continues to focus the search at all widths, and continues to be ignored while a modal dialog is open or another field has focus;
- the search adapts intentionally at intermediate and mobile widths without colliding with adjacent header controls;
- suggestions, keyboard operation and submission continue to work unchanged;
- the content discoverable through search is not reduced.

Existing tests that assert an always-visible `/` hint are expected to change to match this contract.

### UXR-2 — Contextual Grilla / Programa Views

Make the layout selector contextual to the Library surface.

- `Todo` and `Módulos` expose `Grilla` and `Programa`.
- `Materiales` and `Instituciones` use `Grilla` only; the `Programa` option is not presented.
- If an incompatible URL state such as `entity=material&view=programa` is received, from a deep link, stale navigation or any other path, the **effective rendered view** is `Grilla`, and no control presents `Programa` as active.
- The implementation may leave `view=programa` in the URL so that returning to a module-capable surface restores the prior module layout.
- No additional client persistence is required for this behavior.

The applied-filter URL contract is otherwise unchanged.

### UXR-3 — Overlay & Modal Navigation Regression Contract

Preserve the current overlay behavior as an explicit contract.

For the compact navigation sheet, the Library filter drawer, the module detail overlay, and any modal added later:

- only the topmost dismissible modal responds to Escape or backdrop dismissal;
- background content remains inert and scroll-locked while a modal dialog is active;
- focus enters the active dialog and is restored to a meaningful originating control on close;
- native modal `<dialog>` semantics are preserved.

For the search suggestion popover:

- Escape closes the popover while it is open, and does not affect other layers while it is closed.

The current architecture already substantially satisfies this requirement. Under SPEC-007, overlay code changes only if tests expose a real regression or inconsistency. A global overlay manager or new nested modal architecture must not be introduced.

Illustrative only, not an existing flow: if a future modal were opened from inside another, Escape would close the child first and leave the parent open.

### UXR-4 — Platform Favicon

Integrate the supplied D+ favicon.

- Use the Next.js application icon file convention for the repository's App Router (for example `src/app/icon.png`, optionally `apple-icon.png` and `favicon.ico`); conversion of the supplied source to a suitable web format is allowed.
- The icon is a public brand asset served without authentication. No authentication, proxy or authorization change is required.
- It must load from the deployed application and not rely on the original local or upload path.

Implementation depends on the asset being made available in the repository. That is an implementation input, not a product decision.

---

## 6. Responsive behavior

Validate at desktop, intermediate/tablet and narrow/mobile widths, using the established composition breakpoints (`--breakpoint-compact` 1180px, `--breakpoint-explorer` 900px) where applicable.

- **Desktop:** full search with the visible `/` hint where space permits; `Grilla / Programa` visible on module-capable surfaces.
- **Intermediate:** search does not collide with navigation or the shortcut hint; hiding the `/` hint is preferred over truncating the search affordance.
- **Mobile:** search remains usable; the navigation sheet and filter drawer behave correctly as modals; no horizontal overflow from search or filter controls.

---

## 7. Accessibility expectations

Modified interactive components must preserve or improve accessibility:

- controls keep accessible names;
- the `/` shortcut remains exposed to assistive technology while its visual hint is hidden;
- hiding the `Vista` control on reference surfaces does not strand keyboard focus;
- dialogs keep native dialog semantics, focus containment and focus restoration;
- Escape behavior is predictable;
- interactive targets remain usable on narrow layouts.

This SPEC does not require an application-wide accessibility audit.

---

## 8. Constraints

Do not change:

- curriculum semantics or content types;
- content governance or publication rules;
- the authorization model or roles;
- archival or audit behavior;
- the database schema, search functions, RLS or Storage;
- the applied-filter URL dimensions.

New or changed controls should feel native to the existing Explorer language rather than introducing a separate design system. No new UI dependency is required.

Existing valid URLs must continue to function. An invalid reference + `Programa` state must be normalized, not produce an error.

---

## 9. Impact surface

Likely affected:

- header search presentation and the shared search input;
- the Library `Vista` control and view-state helpers;
- application icon files under the App Router;
- relevant unit and E2E tests.

Potentially affected but not intended to change semantically:

- Library results and module detail;
- overlay primitives (tests only, unless a regression is found).

Explicitly unaffected:

- database content model, search functions and migrations;
- publication governance and the role model;
- RLS, Storage and authentication;
- archive/restore semantics and audit history;
- Admin content-management workflow and Admin relationship pickers.

Any discovered requirement to change these must return as **BLOCKED / DECISION REQUIRED** rather than being implemented silently.

---

## 10. Out of scope

This SPEC does **not** include:

- new Docentes / Materiales / Instituciones Library relationship filters;
- database search-function changes for such filters;
- new filter URL dimensions;
- changes to the Admin relationship pickers;
- redesign of Admin content management;
- the prototype's non-Admin contribution workflow;
- a new contribution modal;
- persistent contribution-form state across Admin route changes;
- new nested modal architecture;
- a global overlay manager;
- Docente as a new global-search result type;
- schema, RLS, authentication or governance changes;
- itinerary changes;
- Guide restoration;
- completeness-percentage restoration;
- redesign of the overall information architecture or module detail;
- new content types or taxonomy changes;
- replacement of the global search architecture, semantic or AI search;
- major visual-identity redesign;
- unrelated responsive redesign.

### Future consideration (not current scope)

If relationship-based Library filters for Docentes, Materiales or Instituciones are introduced in the future, they should use a searchable/type-ahead multi-select interaction with persistent, removable selected values rather than long flat checkbox lists. Introducing them requires a separate product decision and specification; this note creates no requirement or acceptance criterion under SPEC-007.

Improvements discovered in out-of-scope areas should be documented separately rather than added opportunistically to SPEC-007.

---

## 11. Acceptance criteria

### Responsive search

**AC-1 — No collision.** At desktop, intermediate and mobile widths, the placeholder, entered text and `/` hint never overlap, and the search does not collide with adjacent header controls.

**AC-2 — Placeholder.** The search placeholder reads `Buscar en la base…` and displays without truncation of its meaning at supported widths.

**AC-3 — Search behavior.** Search submission, grouped suggestions and suggestion keyboard operation continue to work at all widths.

**AC-4 — Shortcut.** The `/` shortcut focuses the search at all widths and remains suppressed while a modal dialog is open or another field has focus.

**AC-5 — Shortcut hint.** The visible `/` hint is shown where space permits and hidden where width is insufficient.

### Contextual layout

**AC-6 — Module-capable surfaces.** On `Todo` and `Módulos`, both `Grilla` and `Programa` are available.

**AC-7 — Reference surfaces.** On `Materiales` and `Instituciones`, `Programa` is not presented as an available or active layout.

**AC-8 — Normalization.** An incompatible state such as `entity=material&view=programa`, from a deep link or navigation, renders `Grilla` without error.

**AC-9 — Restoration.** Returning from a reference surface to a module-capable surface may restore `Programa` when it was the prior module layout.

### Overlay regression contract

**AC-10 — Topmost Escape.** Escape, and backdrop dismissal where supported, closes only the topmost open modal dialog (navigation sheet, filter drawer, module detail).

**AC-11 — Focus.** Opening and closing those dialogs places and restores focus coherently.

**AC-12 — Background.** Background content is inert and scroll-locked while a modal dialog is open.

**AC-13 — Suggestion Escape.** Escape closes an open suggestion popover and does not regress to affecting other layers.

### Favicon

**AC-14 — Favicon.** The D+ favicon is served by the deployed application through the Next.js icon convention and appears in the browser tab where supported.

### Regression

**AC-15 — Library regression.** Curriculum browsing, search, filtering, reference discovery and module detail (overlay, direct visit, Back/Forward) continue to function.

**AC-16 — No contract change.** No authorization, governance, schema, RLS or role change is introduced, and no unpublished, historical or archived content is exposed through any changed surface.

---

## 12. Validation requirements

### Automated

Where appropriate to the existing test architecture:

- search hint visibility and placeholder;
- `/` shortcut behavior;
- effective-view normalization for each `Tipo`;
- `Vista` control presence per surface;
- overlay Escape, focus and scroll-lock regression;
- favicon availability;
- regression of existing Library behavior.

Run unit/integration tests, typecheck, lint, production build, targeted E2E journeys and `git diff --check`.

### Manual / visual

At representative desktop, intermediate and mobile widths, verify:

- header search collision and hint visibility;
- `Grilla / Programa` visibility and `Módulos → Materiales/Instituciones → Módulos` navigation;
- Escape behavior and focus restoration for each modal;
- navigation sheet and filter drawer stacking;
- favicon in a real browser tab.

---

## 13. Implementation freedom

The implementation agent may determine:

- whether the `/` hint is hidden through CSS or responsive rendering, and at which established breakpoint;
- how the effective view is derived and where the normalization lives;
- whether the `view` URL value is preserved or dropped on reference surfaces, within D3;
- favicon output formats and sizes within the Next.js convention;
- test structure.

The implementation agent may **not** independently change:

- which filters exist;
- the distinction between search and filtering;
- the meaning of Programa;
- the search result types;
- contribution content semantics or governance;
- authorization;
- content relationships;
- the scope boundaries defined above.

If a technical constraint makes one of those decisions impractical, stop that portion and report **BLOCKED / DECISION REQUIRED** with repository evidence and proposed alternatives.

---

## 14. Knowledge updates required after implementation

After successful implementation and validation:

1. update this SPEC with implementation and validation evidence;
2. `docs/PRODUCT.md` §4.1 — note that the chosen view applies to module-capable surfaces and reference surfaces render as a grid;
3. `docs/ARCHITECTURE.md` §21 or a new SPEC-007 section — record the effective-view normalization, the responsive search hint, the overlay regression contract and the application icon convention;
4. reconcile repository indexes and `docs/DECISIONS.md` delivery state;
5. move SPEC-007 from `active/` to `completed/` only after implementation and independent validation evidence supports closure.

Do not modify the reference HTML to match the implementation.

---

## 15. Open questions / blockers

None at the product level.

The favicon asset must be added to the repository before UXR-4 can be implemented; this is a technical input, not a product decision.

Any finding that requires changing a contract listed in §8 or §9 must be escalated as **BLOCKED / DECISION REQUIRED**.

---

## 16. Completion definition

SPEC-007 is implementation-complete when:

- UXR-1 through UXR-4 are implemented;
- AC-1 through AC-16 are validated;
- relevant automated tests pass;
- responsive and manual interaction validation passes;
- no invalid reference + `Programa` or overlay state remains in the covered flows;
- existing curriculum exploration behavior has not regressed;
- durable project documentation has been reconciled.

At that point the SPEC may move to:

**COMPLETED — VALIDATED**

---

## 17. Implementation evidence

Implemented on branch `feat/spec-007-ux-remediation` from `main @ cab16d91f27e86339978a8e5ff509c415075283f`. Completion requires independent review against AC-1 to AC-16; this section is implementation evidence, not closure.

### What changed

- **UXR-1:** placeholder `Buscar en la base…` at every width; the visual `/` hint and its reserved padding apply from `--breakpoint-explorer` (900px) up, via CSS only; `/` and `aria-keyshortcuts` unchanged at every width. At 390px the placeholder still did not fit with the hint hidden (87px of text room for a 148px placeholder), because the brand wordmark took the width. Below Tailwind `sm` (640px, already used in the repository) the wordmark is visually hidden and remains the brand link's accessible name; this was approved after implementation as D7. Search data, result types and suggestions are unchanged.
- **UXR-2:** `readView` returns the effective view; `supportsProgram` limits `Programa` to `Todo`/`Módulos`. Reference surfaces (including the URL-only `entity=reference`) render no `Vista` control and render as a grid. `view=programa` is preserved in the URL (D3).
- **UXR-3:** no code change. Existing native `<dialog>` behavior satisfied the contract under test; regression coverage was added for the filter drawer and compact menu sheet.
- **UXR-4:** the supplied `D+SHAREDFAV.svg`, byte-identical (sha1 `5825b41c5d2bc0c89e18a1f7f0172408d28dfe25`), moved to `src/app/icon.svg` (Next.js 16.3.4 `icon` convention; `.svg` is supported). No derived raster files.

No migration, schema, search-function, RLS, Storage, authentication, role or governance change.

### Automated validation

- Vitest: 35 files, 389 tests passed.
- `npm run lint`, `npm run typecheck`, `npm run build`: passed.
- Production-mode Playwright (`E2E_PRODUCTION=1`), full suite: 78 passed, 3 failed. `archival.spec.ts:184` passed on rerun. `archival-governance.spec.ts:216` and `contributions.spec.ts:62` fail identically on unmodified `cab16d9`, so they are pre-existing and unrelated to this slice (accumulated local archived data; an Admin form-fill race).
- Development-mode Playwright was not run: a separate `next dev` server was already running in the repository and was left untouched.

New coverage: effective-view unit tests; Vista presence per `Tipo`, stale reference `view=programa` deep links, `Módulos → Materiales → Instituciones → Módulos` restoration with Back/Forward; header search collision, placeholder fit, hint visibility and `/` shortcut at 1440/1280/1180/1024/900/768/390px; drawer and menu-sheet inertness, scroll lock, scrim dismissal and focus return; `/icon.svg` declared and served without a session.

### Known limits

- At 320px (outside the validated matrix) the placeholder is still clipped by about 10px.
- The icon is SVG only. Browsers without SVG favicon support show no tab icon. An `apple-icon.png` is not included.
- Visual checks were Playwright Chromium screenshots of the header at each validated width and of the rendered icon. A real browser tab, Safari and Firefox were not checked.

## 18. Independent verification and closure

Independent coherence verification of `909f62887b8897b3f9a3ada0407e6827520b54d2` against `cab16d9`: the diff was reviewed directly against this SPEC, D-030 and the `docs/` contracts, and every check below was run during verification rather than taken from §17.

### Validation run

- Vitest: 35 files, 389 tests passed. `npm run lint`, `npm run typecheck`, `npm run build` passed; the build emits static `/icon.svg`.
- Production-mode Playwright, full suite: 79 passed, 2 failed (`archival-governance.spec.ts:216`, `archival.spec.ts:184`). Every SPEC-007 journey passed.
- Development-mode Playwright, full suite (first run for this SPEC; the process §17 took for a repository `next dev` server was an unrelated application on another port): 80 passed, 1 failed (`archival-governance.spec.ts:216`).
- Unrelated failures: `archival-governance.spec.ts:216` fails deterministically (expects 3 entries on the archived page, receives the page size of 20 because earlier local runs left archived content) and fails identically on unmodified `cab16d9`. `archival.spec.ts:184` and `contributions.spec.ts:62` are intermittent: each passed twice on rerun at HEAD, and `contributions.spec.ts:62` also failed on `cab16d9`. None touches a surface this SPEC changed.
- WebKit (Playwright WebKit, development mode; production-mode `Secure` session cookies are not kept over plain-HTTP loopback in WebKit): 24 of 29 SPEC-007-related journeys passed. The 5 failures are pointer-opened focus-restoration assertions (filter drawer, menu sheet, module detail): macOS WebKit does not focus a button or link on mouse click, so there is no invoker to restore. Keyboard-opened drawer and sheet restore focus in WebKit. Those tests and the overlay code predate this SPEC, and browser coverage beyond Chromium is an existing open follow-up.
- Manual/visual: Chromium and WebKit screenshots of the header at 1440/1180/900/768/640/639/390/320px, `Todo` with `view=programa`, `entity=material&view=programa`, and the rendered `/icon.svg`. The wordmark is visible from 640px and hidden below it with the D+ mark kept; the `/` hint appears from 900px up, clear of the placeholder; no collision or horizontal overflow at any width. Firefox has no Playwright build installed and was not checked. A real browser tab's favicon was not visually inspected; the declared `<link rel="icon">`, unauthenticated `200 image/svg+xml` response and rendered artwork were.
- `git diff --check` clean.

### Acceptance

| AC | Result | Evidence |
|---|---|---|
| AC-1 | PASS | `header search adapts` E2E (collision geometry at 1440–390px), prod + dev; screenshots |
| AC-2 | PASS | same E2E (placeholder fits text room), `shell-search` unit; 320px clipping is outside the validated matrix |
| AC-3 | PASS | `search suggestions` E2E group, prod + dev + WebKit |
| AC-4 | PASS | `/` focus at every width; suppression with drawer/sheet open (overlay contract E2E); `search-input.tsx` field/dialog guards |
| AC-5 | PASS | `ui-search-input` unit; E2E hint visibility at ≥900 / hidden below |
| AC-6 | PASS | `Programa is offered only on module-capable surfaces` E2E; `library-state` unit |
| AC-7 | PASS | same E2E; screenshot of `Materiales` with no `Vista` |
| AC-8 | PASS | `stale reference deep link` E2E (200, grid); unit `readView` |
| AC-9 | PASS | restoration and Back/Forward in the same E2E |
| AC-10 | PASS | drawer, sheet, module-detail Escape/scrim E2E |
| AC-11 | PASS | focus entry/return E2E in Chromium; WebKit keyboard path; WebKit pointer path recorded above |
| AC-12 | PASS | overlay contract E2E (inert focus attempt, `overflow: hidden`) |
| AC-13 | PASS | `Escape dismisses the list without clearing what was typed` E2E |
| AC-14 | PASS | `src/app/icon.svg`; `application icon` E2E; build route; rendered in Chromium and WebKit |
| AC-15 | PASS | full Library, module-detail and shell suites pass in both modes |
| AC-16 | PASS | diff touches no `supabase/`, proxy, auth, RLS, Storage or governance code; draft/archived suggestion E2E passes |

Effective-view ownership is single: `readView`/`supportsProgram` in `library-state.ts`, consumed by the Library page. The approved D7 wordmark behavior matches the implementation.

### Follow-up candidates (outside SPEC-007)

- Archival E2E isolation: `archival-governance.spec.ts:216` depends on no pre-existing local archived content; `archival.spec.ts:184` is intermittent.
- Admin form-fill race in `contributions.spec.ts:62`.
- Header search placeholder clipping at 320px.
- WebKit pointer-opened focus restoration for native dialogs, and broader browser/favicon coverage (Firefox, raster icons).

**Result:** COHERENCE VERIFIED — COMPLETED — VALIDATED.
