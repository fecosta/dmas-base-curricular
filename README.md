# D+ Base Curricular

D+ Base Curricular is a private, shared curriculum-content library for organizations in the Democracia+ network.

The product is designed to help network members discover, contribute, review, publish, and reuse structured curricular knowledge across two initial axes:

1. **Strategy & Campaign**
2. **Evidence-based Public Policy**

It is a library, not a Learning Management System (LMS).

## Project status

**Product state:** baseline confirmed  
**Technical state:** initial stack confirmed  
**Delivery state:** SPEC-001 ready for implementation

There is currently no production product implementation. The latest static prototype is the primary UX reference, while the repository documentation defines the authoritative product, governance, security, and architecture contracts.

## Documentation

Start with:

- [`docs/README.md`](docs/README.md) — documentation map and authority model
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product purpose, capabilities, scope, and boundaries
- [`docs/CONTENT_MODEL.md`](docs/CONTENT_MODEL.md) — semantic content model
- [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) — contribution, review, publication, revision, and archival lifecycle
- [`docs/SECURITY.md`](docs/SECURITY.md) — access, authorization, RLS, auditability, and data protection
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — approved technical architecture
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — durable decision register

AI coding agents and contributors must also read [`AGENTS.md`](AGENTS.md).

## Specifications

Implementation work is governed by `specs/`.

```text
specs/
├── README.md
├── active/
├── planned/
└── completed/
```

The current active delivery slice is:

[`specs/active/001-application-foundation-authentication.md`](specs/active/001-application-foundation-authentication.md)

Do not implement planned specifications before their dependencies are satisfied and they are promoted to `active/`.

## Initial stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security
- Supabase Storage
- Resend
- PostgreSQL full-text search + SQL filters
- Vitest
- Playwright
- Vercel
- Supabase Cloud

Strapi was evaluated as a possible CMS and is not part of the MVP architecture.

## Product language

**Spanish is the primary language of the platform.**

User-facing interface copy, navigation, forms, validation messages, emails, review notifications, exports, and default seeded/product content should be presented in Spanish unless a specific product requirement establishes otherwise.

Repository code, identifiers, comments, commits, and technical documentation may remain in English unless the project later adopts a different convention.

Do not translate canonical product labels away from the Spanish UX terminology established by the prototype and product documentation.

## Core product rules

- The application is private and network-only.
- Authentication and product eligibility are separate.
- Published content is visible to all authenticated eligible network users in the MVP.
- Partner-organization contributions require Admin review before publication.
- Published content is edited through new revisions rather than in place.
- Published content is archived rather than destructively deleted.
- The personal itinerary is a private content selection, not a learning trail.
- Authorization must be enforced beyond the UI, including at the server/data boundary.

See `docs/` for the complete contracts.

## Development

Project bootstrap and development commands will be documented here once SPEC-001 establishes the production Next.js application.

Until then, do not infer package-manager commands, Supabase local-development commands, or environment-variable names that have not yet been established by the implementation.

## Git

Use the repository's configured Git author as the sole author.

Use Conventional Commits:

- `feat:`
- `fix:`
- `chore:`
- `docs:`
- `refactor:`
- `test:`

Do not add AI `Co-Authored-By` metadata.

## Implementation workflow

For each active specification:

1. read `AGENTS.md`, the authoritative `docs/`, and the active spec;
2. inspect current repository state;
3. implement only the active bounded scope;
4. run relevant validation;
5. report actual results;
6. independently review implementation against the spec;
7. reconcile durable documentation;
8. move the spec to `completed/` only after verification.

If implementation requires changing an established product contract, stop and return:

`BLOCKED / DECISION REQUIRED`
