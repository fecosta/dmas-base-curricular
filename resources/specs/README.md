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

1. `SPEC-001` — Application Foundation & Authentication
2. `SPEC-002` — Core Curriculum Library
3. `SPEC-003` — Content Contribution
4. `SPEC-004` — Review, Approval & Publication
5. `SPEC-005` — Revisions, Audit History & Archival
6. `SPEC-006` — Personal Itinerary

## Dependency model

```text
SPEC-001 Foundation & Authentication
          |
          v
SPEC-002 Core Curriculum Library
          |
          v
SPEC-003 Content Contribution
          |
          v
SPEC-004 Review, Approval & Publication
          |
          v
SPEC-005 Revisions, Audit History & Archival

SPEC-002 Core Curriculum Library
          |
          v
SPEC-006 Personal Itinerary
```

`SPEC-006` does not depend on completion of the governance workflow and may be implemented after the core library is stable.

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
6. activate the next spec when its dependencies are satisfied.
