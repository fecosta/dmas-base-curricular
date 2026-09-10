# SPEC-002 — Core Curriculum Library

**Status:** PLANNED  
**Depends on:** SPEC-001

## 1. Purpose / Objective

Implement the read-oriented Base Curricular library so authenticated network users can explore the approved curriculum structure and references using the latest static prototype as the UX reference and the canonical content model as the semantic authority.

## 2. Current State

No production curriculum library exists.

The latest static prototype demonstrates intended exploration patterns, while `docs/PRODUCT.md` and `docs/CONTENT_MODEL.md` define the approved semantics.

## 3. Problem / Gap

Authenticated access alone does not provide the central product value: discovering modules, program topics, instructors, institutions, materials, and their relationships.

## 4. Decision

The product is a library, not an LMS.

The initial top-level curriculum axes are:

1. Strategy & Campaign
2. Evidence-based Public Policy

The module is the primary curriculum unit.

References such as institutions and materials are first-class discoverable knowledge objects.

The current UX must not introduce learning trails, completion tracking, required order, or module completeness percentages.

`level` and `delivery_format` may remain as stored metadata but are not part of the current UX contract.

## 5. Scope

### In Scope

- persistence schema for core published curriculum entities;
- axes;
- modules;
- program topics;
- instructors;
- teaching notes;
- materials/studies;
- institutions/reference centers;
- relationships required by the content model;
- read-only exploration of published content;
- module detail experience;
- reference exploration;
- search using PostgreSQL full-text search;
- filters such as axis, country, and theme where applicable;
- Grid (`Grilla`) and Program (`Programa`) module views when supported by the reference prototype;
- seed/import mechanism for initial approved content;
- RLS/read policies for authenticated network-wide published content;
- archive-aware discovery so archived content is excluded from ordinary browsing/search.

### Out of Scope

- external contribution forms;
- review queue;
- change requests;
- approval and publication UI;
- revision authoring workflow;
- email notifications;
- audit UI;
- itinerary persistence;
- organization-specific published-content visibility.

## 6. Expected Behavior

- authenticated eligible users can explore all published non-archived content;
- users can navigate from modules to associated instructors, notes, institutions, and materials as defined by available relationships;
- users can search relevant published content;
- users can filter discovery without changing content semantics;
- module detail pages use `Program` terminology;
- archived content is not returned through ordinary browse/search flows;
- unpublished/pending content is not exposed to ordinary readers;
- no UI implies mandatory curriculum sequence or completion.

## 7. Constraints

- PostgreSQL is the canonical source of truth;
- PostgreSQL FTS + SQL filters are the approved MVP search approach;
- search results must honor publication and authorization state;
- do not implement completeness percentage;
- do not surface `level` / `delivery_format` as required module-card metadata;
- the latest static prototype is a UX reference, not authority over contradictory product decisions.

## 8. Impact Surface

- database schema;
- seed/import;
- library UI;
- search/filtering;
- RLS/read policies;
- module/reference navigation.

## 9. Acceptance Criteria

1. The two approved curriculum axes exist in persisted data.
2. Published modules can be listed and opened by authenticated eligible users.
3. Module details can represent program topics and associated knowledge objects defined in the content model.
4. Institutions and materials are discoverable as first-class reference objects.
5. Search returns only published, non-archived content the user is authorized to read.
6. Filters operate against persisted structured fields rather than hard-coded UI-only data.
7. `Program` terminology is used in the user experience.
8. No mandatory learning path/order is introduced.
9. No module completeness percentage is displayed or required.
10. `level` and `delivery_format` are not required in the current user-facing cards/details.
11. Archived records are excluded from normal browse/search results.
12. Tests cover core read authorization and representative search/filter behavior.
13. The feature works from production persistence, not browser-local prototype state.

## 10. Implementation Freedom

Implementation may choose normalized relational details, query composition, component decomposition, and indexing mechanics as long as the canonical semantics and visibility contracts remain unchanged.

## 11. Knowledge Updates Required

After verification:

- reconcile the physical schema with `docs/CONTENT_MODEL.md`;
- update `docs/ARCHITECTURE.md` with verified search/data implementation details;
- move the spec to `completed/`.

## 12. Open Questions / Blockers

Exact initial seed content source and migration/import procedure may be defined during implementation without altering product behavior.
