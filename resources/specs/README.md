# D+ Base Curricular — Specifications

## Purpose

This directory contains bounded implementation specifications for D+ Base Curricular.

The specifications translate the authoritative product contracts in `docs/` into implementable slices without allowing implementation convenience to redefine product behavior, governance, data semantics, or security boundaries.

## Lifecycle

Specifications move through:

`planned -> active -> completed`

Use the following meaning:

- `planned/` — scope is known, but the spec is not yet the active implementation slice.
- `active/` — the spec is implementation-ready and is the current authorized delivery slice.
- `completed/` — implementation has been verified and the spec lifecycle is closed.

Do not move a spec to `completed/` merely because an implementation agent reports success. Verify implementation and required validation first.

## Current sequence

1. `SPEC-001` — Application Foundation & Authentication — completed
2. `SPEC-002` — Core Curriculum Library — completed
3. `SPEC-003` — Content Contribution — completed historical foundation
4. `SPEC-004` — Admin Content Management & Publication — completed
5. `SPEC-005` — Audit History & Archival — completed
6. `SPEC-006` — Explorer UX/UI Fidelity & Interaction Layer — active

`SPEC-006` is the current authorized delivery slice, at [`active/006-explorer-ux-ui-fidelity.md`](active/006-explorer-ux-ui-fidelity.md). None remain planned.

## Dependency model

```text
SPEC-001 Foundation & Authentication
          |
          v
SPEC-002 Core Curriculum Library
          |
          v
SPEC-003 Content Contribution Foundation
          |
          v
SPEC-004 Admin Content Management & Publication
          |
          v
SPEC-005 Audit History & Archival
          |
          v
SPEC-006 Explorer UX/UI Fidelity & Interaction Layer
```

SPEC-004 is completed after independent phase review, controlled local multi-user acceptance through real Supabase/application/browser boundaries, Cloud preservation and post-migration security verification, and production deployment verification. The local destructive journeys are not hosted production validation.

SPEC-005 is completed at [`completed/005-audit-history-archival.md`](completed/005-audit-history-archival.md) after independent phase review of Phase 1, Phase 2A, the deterministic archived-pagination correction, and Phase 2B+C. It closed under the same validation split: production Cloud verified migration, RPC signatures, function hardening, grants, RLS, lifecycle-event protection and the governed-attachment reader gate, while functional Archive/Restore/History acceptance ran on the complete local real stack. Functional mutation of production was deliberately avoided because production holds real actors and lifecycle events are permanent append-oriented governance evidence; see `docs/DECISIONS.md` (G-005). Local real-stack validation is not represented as hosted production validation.

SPEC-003 remains a completed implementation record even though Contributor authoring is inactive under the current product contract.

SPEC-006 depends on SPEC-001 through SPEC-005 because it raises the interface fidelity of surfaces those slices delivered. It is a UX/UI slice: it must not alter product scope, authorization, governance lifecycle, publication, archival, audit, data semantics or security. Personal Itinerary remains an approved product capability delivered separately, and is outside SPEC-006's implementation scope.

## Authoritative product sources

Before implementing any spec, read:

- `docs/PRODUCT.md`
- `docs/CONTENT_MODEL.md`
- `docs/GOVERNANCE.md`
- `docs/SECURITY.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`

If implementation discovers a constraint that would change an established product contract, stop and return:

`BLOCKED / DECISION REQUIRED`

Do not silently change the spec or product behavior.

## Implementation freedom

Implementation agents may make reversible technical choices within the approved stack when those choices do not alter:

- product behavior;
- content semantics;
- governance lifecycle;
- authorization boundaries;
- publication rules;
- acceptance criteria.

Meaningful new architecture decisions should be reconciled with `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.

## Completion rule

After implementation of each spec:

1. verify acceptance criteria;
2. verify relevant tests;
3. compare actual behavior with the spec;
4. update durable documentation if verified current state changed;
5. move the spec to `completed/` only after verification;
6. promote a next spec to `active/` only through a separate preflight and explicit activation after its dependencies are satisfied.
