# D+ Base Curricular

## Purpose

This documentation set defines the current product and technical baseline for **D+ Base Curricular**: a private, shared curriculum-content library for organizations in the Democracia+ network.

The platform supports discovery, contribution, review, publication, revision, archival, and reuse of structured curricular knowledge while preserving provenance, access control, and content history.

## Product coherence status

**Lifecycle state:** DECISION READY — PRODUCT AND INITIAL STACK CONFIRMED; SPEC-001–007, 009, 012 COMPLETED; SPEC-008 ACTIVE — REVISED GA4 + SUPABASE METRICS CONTRACT DOCUMENTED, NOT IMPLEMENTED; SPEC-013 COMPLETED — ACCEPTED WITH BASELINE EXCEPTION (D-037), PRODUCTION ACTIVATED 2026-10-27 — STRUCTURALLY VERIFIED; SPEC-010 PLANNED — RECONCILED; ACTIVATION BLOCKED, NOT IMPLEMENTED (U2 COMPLETED VIA SPEC-012, U3 COMPLETED VIA SPEC-013)

The product baseline, governance model, security requirements, and initial technical stack are confirmed.

The bounded implementation specifications are under `resources/specs/`. SPEC-001 through SPEC-007, SPEC-009 and SPEC-012 are completed. SPEC-007 — UX/UI Navigation & Interaction Remediation closed as COHERENCE VERIFIED at `resources/specs/completed/007-ux-ui-navigation-interaction-remediation.md`. SPEC-009 — Admin Organization & User Management closed as COHERENCE VERIFIED at `resources/specs/completed/009-admin-organization-user-management.md` after independent implementation review, Cloud migration/security verification, safe hosted validation, and a final coherence review; hosted destructive mutation/provisioning flows were intentionally not exercised because production has no designated safe fixture, so that evidence rests on local real-stack validation plus Cloud structural verification. SPEC-012 — Library Institutional References Presentation is completed at `resources/specs/completed/012-library-institutional-references-presentation.md` (implemented 2026-10-23, closed 2026-10-25, accepted with baseline exception, D-036). SPEC-008 is active and was revised by D-032: GA4 for optional navigation analytics, Supabase organization-level adoption metrics and a minimal Admin dashboard, documented but not implemented, with Privacy/Legal decisions pending. The superseded PostHog transport remains inert on `main`, its Gate B was never executed, and the external activation gate is closed. SPEC-013 — Material Reach Country Restriction is completed at `resources/specs/completed/013-material-reach-country-restriction.md` (implemented 2026-10-26 in commits `e501f00` and `5387f19`, closed 2026-10-26, accepted with baseline exception, D-037; production activation: migration `20261026000100` applied to Supabase Cloud project `qcxcgwpfgclyebkxawyh` on 2026-10-27; structural verification, authenticated read-only smoke verification, and Product Owner-confirmed database enforcement testing are recorded with evidence limitations in the SPEC-013 activation record). SPEC-010 — Platform Readiness for Organizational Testing is planned at `resources/specs/planned/010-platform-readiness-organizational-testing.md` and reconciled with D-033–D-037 (reader suppression of institutional references, material reach country restriction, Admin-selected content origin country, external feedback link). It is not implemented and its activation as a whole is blocked: `active/` means implementation-ready; G1 is satisfied 2026-10-26 with C1-C3 confirmed and U3 is completed via SPEC-013, G3 is satisfied as a product decision 2026-10-26 (U4 remains inactive pending its own contract; U3 completed 2026-10-26 via SPEC-013), while G4 and G5 remain open (product owner decision, Option A, 2026-10-21). G2 was recorded satisfied on 2026-10-23 and its unit U2 (presentation-layer removal of institutional references from the reader-facing Library) was split out into SPEC-012, which is completed at `resources/specs/completed/012-library-institutional-references-presentation.md` (accepted with baseline exception, D-036); SPEC-010's SPEC-012 dependency is satisfied. SPEC-010 cannot close until its remaining units (U0, U1, U4 and U5) are verified or removed by recorded decision. Gate G6 is satisfied by the reviewed U0 Cloud inventory, `docs/SPEC-010-G6-CLOUD-INVENTORY-EVIDENCE.md`, with formal closure authorized on 2026-10-22. The read-only inventory (U0) and domain/regression verification (U1) are preparatory activities, not activation. SPEC-011 remains planned. SPEC-006's six implementation phases changed no product, governance, security or data contract and introduced no database change. SPEC-004 passed independent phase review, controlled local multi-user acceptance against real Supabase/application/browser boundaries, Cloud preservation and post-migration security verification, and production deployment verification. Its destructive acceptance journeys were intentionally not run against production.

SPEC-005 adds Admin-only identity-level archival/restoration and the bounded lifecycle-history boundary, closed under the same evidence split: production Cloud is authoritative for migration/schema/security posture, while functional Archive/Restore/History acceptance ran on the complete local real stack. See `docs/DECISIONS.md` (G-005).

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
| `DECISIONS.md` | Reconciled decision register (D-033–D-037; D-033 implemented 2026-10-23, reconciled 2026-10-25; D-034 origin semantics decided 2026-10-26; D-035 external feedback link implemented 2026-10-28, production enablement pending G4/G5; D-036 SPEC-012 baseline exception; D-037 SPEC-013 baseline exception) |
