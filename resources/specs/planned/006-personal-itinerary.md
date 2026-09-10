# SPEC-006 — Personal Itinerary

**Status:** PLANNED  
**Depends on:** SPEC-002

## 1. Purpose / Objective

Implement the personal itinerary as a private user-owned selection of curriculum modules that can be managed and exported without turning the product into an LMS or learning-trail system.

## 2. Current State

The static prototype demonstrates adding modules to an itinerary and exporting the selection, but persistence is browser-local.

## 3. Problem / Gap

Users need a durable way to collect relevant modules for their own use across sessions.

## 4. Decision

The itinerary is a **personal content selection**.

It is not:

- a mandatory learning path;
- a recommended sequence;
- enrollment;
- progress tracking;
- certification;
- completion tracking.

## 5. Scope

### In Scope

- create or initialize a personal itinerary for an authenticated user;
- add published modules;
- remove selected modules;
- persist the selection across sessions;
- display the current selection;
- calculate/display aggregate information already justified by selected module metadata, such as total suggested duration when available;
- export the selected itinerary in a practical format consistent with the prototype intent;
- user ownership/privacy of personal itinerary data;
- handling modules that later become archived.

### Out of Scope

- shared/team itineraries;
- Admin-created assigned learning paths;
- pedagogical ordering;
- prerequisites;
- progress;
- completion;
- certification;
- course enrollment;
- recommendations/AI sequencing.

## 6. Expected Behavior

- an authenticated user can add a published module to their itinerary;
- the same module is not unintentionally duplicated;
- the user can remove modules;
- selections persist across login sessions;
- one user cannot read or modify another user's personal itinerary unless a later sharing feature is explicitly approved;
- archived modules are not newly selectable and are handled gracefully if previously selected;
- export reflects the user's selection without implying required pedagogical order.

## 7. Constraints

- itinerary is user-owned private application data;
- RLS/authorization must prevent cross-user access;
- only currently published content is normally selectable;
- itinerary semantics must remain separate from curriculum governance;
- do not introduce LMS concepts.

## 8. Impact Surface

- itinerary tables;
- RLS;
- module UI actions;
- personal selection UI;
- export behavior.

## 9. Acceptance Criteria

1. An authenticated user can add a published module to their itinerary.
2. Selection persists across sessions/devices for the same account.
3. The user can remove a selected module.
4. Duplicate selections are prevented or normalized.
5. A user cannot access another user's itinerary through UI or direct data access.
6. Unpublished modules cannot be added through ordinary product behavior.
7. Archived modules are not offered for new selection.
8. Previously selected modules that become archived do not expose restricted content and are handled without breaking the itinerary.
9. The user can export their selection.
10. Export does not describe the selection as a mandatory learning path or course progression.
11. Tests cover ownership, add/remove, persistence, and archived/unpublished module handling.

## 10. Implementation Freedom

Implementation may choose whether the MVP supports exactly one implicit itinerary per user or an explicitly named single itinerary, provided the product remains a personal selection and no multi-itinerary product behavior is invented without approval.

## 11. Knowledge Updates Required

- reconcile verified itinerary persistence with `docs/CONTENT_MODEL.md`;
- update architecture if material;
- move spec after verification.

## 12. Open Questions / Blockers

No known blocker for a single personal selection.
