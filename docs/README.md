# D+ Base Curricular

## Purpose

This documentation set defines the current product and technical baseline for **D+ Base Curricular**: a private, shared curriculum-content library for organizations in the Democracia+ network.

The platform supports discovery, contribution, review, publication, revision, archival, and reuse of structured curricular knowledge while preserving provenance, access control, and content history.

## Product coherence status

**Lifecycle state:** DECISION READY — PRODUCT AND INITIAL STACK CONFIRMED

The product baseline, governance model, security requirements, and initial technical stack are confirmed.

The bounded implementation specifications are under `resources/specs/`; SPEC-001 has been implemented, independently reviewed, and hosted-validated, and has moved to `resources/specs/completed/`. No specification is currently active.

The SPEC-001 application/authentication foundation is implemented, locally tested, deployed to Vercel, and hosted-validated against the intended Supabase Cloud project (real Google OAuth round trip, eligible/ineligible access, live membership revocation, sign-out, and Email OTP delivery through custom SMTP). The static prototype remains UX evidence for later library functionality; repository-local contracts remain authoritative.

## Initial technical stack

- **Application framework:** Next.js + TypeScript
- **UI:** Tailwind CSS
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Authorization:** application-level rules + Supabase Row Level Security (RLS)
- **Private file storage:** Supabase Storage
- **Email notifications:** Resend
- **Search:** PostgreSQL full-text search + SQL filters
- **Unit/integration testing:** Vitest
- **End-to-end testing:** Playwright
- **Hosting:** Vercel
- **Managed backend services:** Supabase Cloud

## Authoritative documentation

- `PRODUCT.md` — product purpose, users, scope, capabilities, boundaries, and UX contracts.
- `CONTENT_MODEL.md` — semantic entities, relationships, revisions, archival state, and knowledge structure.
- `GOVERNANCE.md` — contribution, review, revision, approval, publication, archival, provenance, and lifecycle rules.
- `SECURITY.md` — access-control, privacy, authorization, auditability, and data-protection requirements.
- `ARCHITECTURE.md` — approved initial architecture and technical responsibilities.
- `DECISIONS.md` — durable product and technical decisions.

## Documentation authority

Meeting notes, stakeholder comments, prototypes, and conversation history are evidence.

Once reconciled here, these documents become the durable source of truth for current product intent and accepted decisions.

Implementation must be reconciled with this documentation. Neither code nor future documentation should silently redefine product behavior, governance, data semantics, security boundaries, or technical decisions.

## Governance rule

Avoid duplicate sources of truth.

The former `KNOWLEDGE_GOVERNANCE.md` has been superseded by `GOVERNANCE.md`, which owns the active governance contract.

Historical artifacts may be archived if useful, but they must not remain listed as current authoritative guidance.

## Current documentation state

| Document | State |
|---|---|
| `PRODUCT.md` | Baseline confirmed |
| `CONTENT_MODEL.md` | Baseline confirmed |
| `GOVERNANCE.md` | Governance core confirmed |
| `SECURITY.md` | Product security baseline confirmed |
| `ARCHITECTURE.md` | Initial stack and architecture confirmed |
| `DECISIONS.md` | Reconciled decision register |
