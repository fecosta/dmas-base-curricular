# AGENTS.md — D+ Base Curricular

## Purpose

This file defines repository-wide instructions for AI coding agents and human contributors working on D+ Base Curricular.

The repository documentation is the durable source of truth for product intent, content semantics, governance, security, architecture, and implementation scope.

Do not use conversation history, assumptions, or implementation convenience to override repository-local documentation.

## 1. Required reading order

Before changing code, read:

1. `README.md`
2. `docs/README.md`
3. `docs/PRODUCT.md`
4. `docs/CONTENT_MODEL.md`
5. `docs/GOVERNANCE.md`
6. `docs/SECURITY.md`
7. `docs/ARCHITECTURE.md`
8. `docs/DECISIONS.md`
9. `resources/specs/README.md`
10. the specification under `resources/specs/active/`

Then inspect the relevant code, schema, migrations, configuration, and tests for the task.

If any required authoritative file referenced above is missing, do not reconstruct it from memory. Report the missing repository baseline before proceeding.

## 2. Product authority

The active documents under `docs/` define the current product contract.

The active specification defines the bounded implementation slice currently authorized.

Implementation must not silently change:

- product purpose or scope;
- content semantics;
- governance lifecycle;
- publication authority;
- authorization boundaries;
- visibility rules;
- revision behavior;
- archival behavior;
- acceptance criteria.

If implementation discovers a constraint that requires changing one of these contracts, stop and report:

`BLOCKED / DECISION REQUIRED`

Explain:

- the verified constraint;
- the product contract affected;
- why implementation cannot preserve both;
- the smallest decision needed to continue.

Do not choose a new product behavior on behalf of the project.

## 3. Approved initial stack

The approved MVP stack is:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security (RLS)
- Supabase Storage for private files
- Resend for workflow email
- PostgreSQL full-text search + SQL filters
- Vitest
- Playwright
- Vercel
- Supabase Cloud

Do not introduce a major parallel platform or infrastructure component without an approved decision.

In particular, do not introduce by default:

- Strapi or another CMS;
- a separate custom backend;
- Prisma or another ORM unless explicitly adopted later;
- Algolia or Elasticsearch;
- microservices;
- background workers;
- a second authentication platform.

Strapi has been evaluated and is not part of the MVP architecture. See `docs/ARCHITECTURE.md` and `docs/DECISIONS.md`.

## 4. Core product invariants

Preserve these confirmed product contracts.

### Product model

D+ Base Curricular is:

- private;
- network-only;
- a shared structured curriculum-content library;
- not an LMS.

The initial curriculum axes are:

1. Strategy & Campaign
2. Evidence-based Public Policy

The personal itinerary is a user-owned content selection, not a learning trail.

### Published visibility

For the MVP, all published content is visible to all authenticated eligible users from approved network organizations.

Do not invent organization-specific or content-specific published visibility tiers.

### Contributor and Admin

The MVP has two product roles:

- `Contributor`
- `Admin`

A Contributor must not obtain Admin authority through client state, form input, email domain, or request manipulation.

An Admin owns MVP governance actions including:

- review;
- change requests;
- approval;
- publication;
- archival;
- restoration.

An Admin may create and directly publish Democracia+ content.

### External contribution governance

Content submitted by users from other organizations requires Admin approval.

The governed lifecycle is:

`Draft -> Submitted -> Under Review -> Approved -> Published`

When adjustments are required:

`Under Review -> Changes Requested -> Resubmitted -> Under Review`

### Published-content changes

Published content must not be destructively edited in place.

Use revision-based editing:

`Published v1 -> Draft Revision v2 -> review -> Published v2`

Until `v2` is approved and published, `v1` remains the current published version.

### Archival

Published governed content is archived rather than permanently deleted as part of the normal product workflow.

Archived content:

- does not appear in normal browse/search;
- preserves history;
- may be restored by an Admin.

### Superseded prototype behavior

Do not reintroduce the module-card completeness percentage as a product requirement.

`level` and `delivery_format` may remain in the data model, but are not required in the current UX.

Use **Program** terminology rather than `Ementa`.

## 5. Product language

**Spanish is the primary language of the product experience.**

Unless an active specification explicitly states otherwise, use Spanish for:

- navigation and page titles;
- buttons and actions;
- forms and field labels;
- validation and error messages shown to users;
- empty states and help text;
- Admin/review workflow copy;
- governance email notifications;
- exports intended for end users;
- default product-facing seeded content.

Technical implementation artifacts may remain in English, including:

- source-code identifiers;
- database/table/column names;
- internal API identifiers;
- code comments;
- technical documentation;
- commit messages.

Do not create an English-first UI with Spanish deferred as later localization work. Spanish is the MVP default product language.

Preserve established Spanish terminology such as **Programa**, and use the latest approved prototype/product documentation when choosing user-facing wording.

## 6. Security rules

Security is a product requirement, not a UI feature.

### Authentication versus eligibility

Authentication success does not automatically grant product access.

The intended sequence is:

`authenticated identity -> approved organization/domain -> active account/membership -> role -> access`

### Server/data-boundary enforcement

Do not rely solely on:

- hidden buttons;
- disabled UI;
- client-side route guards;
- browser-local state.

Authorization must be enforced through appropriate server-side logic and Supabase RLS/data-boundary controls.

### Secrets

Never expose server-only credentials to the browser.

Never commit real secrets.

Supabase service-role credentials, if ever needed, must remain server-only and should be used only where justified.

### Private files

Governed attachments must not become public simply because the associated database record is private.

Use private Supabase Storage and authorized/signed access as appropriate.

### Search and exports

Unpublished, unauthorized, pending, historical, or archived content must not leak through:

- search;
- autocomplete;
- filters;
- exports;
- direct URLs;
- client-side preload payloads.

## 7. Specification lifecycle

Specifications live under:

```text
resources/specs/
├── README.md
├── active/
├── planned/
└── completed/
```

Only work authorized by the active specification unless explicitly instructed otherwise.

Do not implement a later planned spec opportunistically.

A spec moves to `completed/` only after implementation and independent verification against its acceptance criteria.

An implementation agent must not mark its own spec complete merely because tests pass.

## 8. Scope discipline

Prefer the smallest coherent change that satisfies the active specification.

Do not mix:

- unrelated refactors;
- cosmetic cleanup;
- dependency upgrades unrelated to the task;
- future-spec features;
- speculative abstractions.

Reuse existing project primitives where they preserve the current contracts.

Before creating a new abstraction, verify that it solves a current need.

## 9. Database and migrations

Use the repository's established Supabase migration workflow once it exists.

Migrations must be:

- reviewable;
- deterministic;
- scoped to the active spec;
- safe for the documented lifecycle and authorization model.

Do not prematurely implement the full conceptual content model when the active spec requires only a subset.

RLS policies are part of the security implementation and require focused validation.

## 10. Testing and validation

Use the repository's actual scripts and commands.

The approved test stack is:

- Vitest for unit/integration tests;
- Playwright for critical end-to-end flows.

For each task:

- add focused tests for changed behavior;
- test authorization boundaries where relevant;
- run the checks supported by the environment;
- never claim a command passed if it was not run.

Where applicable, validate:

- type checking;
- linting;
- unit/integration tests;
- targeted E2E tests;
- production build;
- `git diff --check`.

If an external service or missing credential prevents a check, report exactly what could not be validated and why.

## 11. Documentation updates

Update durable documentation only when verified current state changes.

Potential owner documents:

- `docs/PRODUCT.md` — product contracts;
- `docs/CONTENT_MODEL.md` — content semantics;
- `docs/GOVERNANCE.md` — lifecycle and publication rules;
- `docs/SECURITY.md` — security and authorization contracts;
- `docs/ARCHITECTURE.md` — verified technical structure;
- `docs/DECISIONS.md` — material durable decisions.

Do not create a second source of truth.

Do not rewrite product documents merely to justify an implementation shortcut.

## 12. Git and commit rules

Inspect repository-local Git conventions before committing.

Use Conventional Commits when creating commits:

- `feat:`
- `fix:`
- `chore:`
- `docs:`
- `refactor:`
- `test:`

Use the Git author configured for the repository/local environment as the sole author.

Do not add:

- `Co-Authored-By: Claude`
- `Co-Authored-By: ChatGPT`
- any other AI co-author metadata

Do not:

- force-push;
- rewrite shared history;
- bypass repository protections;
- reset or discard unrelated user changes.

If the working tree contains unrelated modifications, preserve them and keep the task scoped.

## 13. Required final report for implementation work

At the end of an implementation task, report:

1. starting branch and HEAD;
2. relevant repository state found;
3. implementation summary;
4. files created;
5. files modified;
6. migrations/schema changes;
7. security/RLS changes;
8. implementation decisions made within allowed freedom;
9. tests/checks actually run and results;
10. checks not run and why;
11. remaining risks or configuration required;
12. documentation updates;
13. `git status`;
14. `git diff --check`;
15. recommended next action.

Do not claim the next specification is ready until its dependencies and governance gates are actually satisfied.

## Appendix — Next.js tool-managed agent instructions

The following block is generated and maintained by Next.js tooling. It is subordinate to the repository's authoritative rules above, `docs/`, and the active specification. Conflicting generated guidance must not override project governance.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
