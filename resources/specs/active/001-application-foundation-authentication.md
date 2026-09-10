# SPEC-001 — Application Foundation & Authentication

**Status:** IMPLEMENTATION READY  
**Depends on:** Confirmed product baseline and initial stack  
**Authority:** Product and stack decisions confirmed 2026-09-10

## 1. Purpose / Objective

Create the production application foundation and establish secure network-only authentication for D+ Base Curricular.

At the end of this slice, an eligible user must be able to authenticate and reach a protected application shell, while ineligible users are denied access. The application must also establish the initial Contributor/Admin authorization model, Supabase integration, test foundation, and deployable Vercel baseline required by subsequent specs.

## 2. Current State

There is no production application implementation.

Available current evidence consists of:

- the latest static prototype for UX/interaction reference;
- the authoritative product documentation under `docs/`;
- the approved initial stack.

The static prototype's local/session behavior is not a production authentication mechanism.

## 3. Problem / Gap

The product is defined as private and network-only, but no production identity, organization eligibility, authorization boundary, database connection, test foundation, or deployable application shell exists.

All subsequent product features depend on a trustworthy user identity and secure application foundation.

## 4. Decision

The approved foundation is:

- Next.js + TypeScript;
- Tailwind CSS;
- Supabase PostgreSQL;
- Supabase Auth;
- application-level authorization + Supabase Row Level Security;
- Supabase Storage for future private attachments;
- Resend for future governance notifications;
- Vitest;
- Playwright;
- Vercel.

Authentication establishes identity.

Application eligibility requires an authenticated user to belong to an approved active organization/account according to the product's organization/domain rules.

The MVP has two product roles:

- `Contributor`
- `Admin`

All authenticated eligible network users may later read published content.

## 5. Scope

### In Scope

- initialize the production Next.js + TypeScript application;
- establish Tailwind CSS;
- configure Supabase clients using appropriate server/client boundaries;
- implement Supabase Auth;
- establish organization and approved-domain eligibility data;
- establish user membership/profile data;
- establish `Contributor` and `Admin` roles;
- protect the application shell from unauthenticated access;
- deny access to authenticated but ineligible users;
- establish server-side authorization helpers/primitives;
- establish initial RLS policies needed for identity/organization/profile access;
- derive user identity from authenticated session rather than manual identity fields;
- provide a minimal authenticated shell/navigation suitable for later product screens;
- configure environment-variable conventions;
- establish Vitest;
- establish Playwright;
- configure a Vercel-deployable baseline;
- document local setup and required environment variables without committing secrets.

### Out of Scope

- curriculum modules and reference content;
- contribution forms;
- review workflow;
- email notifications;
- content revisions;
- audit lifecycle;
- private file upload;
- personal itinerary;
- production content search;
- organization-specific published-content visibility;
- separate Reviewer/Publisher roles.

## 6. Expected Behavior

### Product language

The authentication experience and protected application shell must be Spanish-first.

User-facing authentication, eligibility, access-denied, navigation, validation, and error copy introduced in this slice must be in Spanish.

### Unauthenticated user

When an unauthenticated user attempts to access a protected product route:

- they cannot access protected application data;
- they are directed into the supported authentication flow.

### Eligible authenticated user

When a user authenticates with an identity that maps to an approved active organization/account:

- the application establishes their user identity;
- their organization is known to the application;
- their product role is known;
- they may access the protected application shell.

### Ineligible authenticated user

When authentication succeeds but the user is not eligible under the approved organization/account policy:

- access to the protected product is denied;
- no protected product data is returned;
- the denial must not rely solely on hiding UI elements.

### Contributor

A Contributor can access the protected shell.

Contributor permissions must not implicitly grant Admin capabilities.

### Admin

An Admin can access the protected shell and can be distinguished authoritatively from a Contributor for later governance features.

### Session-derived identity

Future forms must be able to obtain the user's identity and organization from trusted authentication/application context.

The application must not require users to type their own email or organization merely to establish provenance.

## 7. Constraints

- Supabase Auth is the approved identity platform.
- Authorization must be enforced server-side and/or at the data boundary.
- RLS must be enabled for tables containing protected identity/organization data as appropriate.
- Public/client-safe Supabase configuration must remain separate from privileged server credentials.
- Service-role credentials, if used, must never be exposed to the browser.
- Domain allowlisting alone must not grant Admin privileges.
- The application is network-only.
- Do not introduce Strapi, another CMS, a separate custom backend, external search infrastructure, or microservices in this slice.
- Do not implement future permission tiers that are not part of the MVP.
- Spanish is the primary product language; do not build an English-first shell with localization deferred.
- Exact login provider mix may be selected within Supabase Auth as long as institutional eligibility remains product-enforced and does not alter the access contract.

## 8. Impact Surface

### Affected

- application foundation;
- route protection;
- authentication;
- organization eligibility;
- user/profile persistence;
- role authorization;
- RLS foundation;
- testing;
- environment configuration;
- deployment foundation.

### Explicitly Unaffected

- curriculum semantics;
- module/reference UX;
- contribution workflow;
- editorial lifecycle;
- publication visibility rules;
- itinerary semantics.

## 9. Acceptance Criteria

1. A Next.js + TypeScript application runs locally using documented setup instructions.
2. Tailwind CSS is configured and usable.
3. The application connects successfully to the intended Supabase project using documented environment configuration.
4. An unauthenticated user cannot access protected application routes or protected application data.
5. A supported Supabase Auth flow can create/authenticate a user identity.
6. Eligibility is evaluated independently from successful authentication.
7. An authenticated eligible user associated with an active approved organization can access the protected shell.
8. An authenticated but ineligible user cannot access the protected shell or protected application data.
9. The application can determine the authenticated user's organization from trusted persisted/session-backed data.
10. The application can distinguish `Contributor` from `Admin` using trusted server/data-backed authorization state.
11. A Contributor cannot obtain Admin authorization merely by manipulating client state or request payloads.
12. Relevant identity/organization/profile tables use RLS or an equivalently enforced Supabase data-boundary policy appropriate to their exposure.
13. No privileged Supabase service credential is exposed to browser code or committed files.
14. Unit/integration test execution is configured with Vitest.
15. End-to-end test execution is configured with Playwright.
16. Automated tests cover at minimum unauthenticated denial, eligible access, ineligible denial, and Contributor/Admin role separation at the appropriate test layer.
17. The application can be deployed to Vercel with secrets supplied through environment configuration rather than source control.
18. All user-facing authentication, eligibility, protected-shell, validation, and error copy introduced by this spec is in Spanish.
19. Existing product documentation is not contradicted by implementation decisions introduced in this slice.

## 10. Implementation Freedom

Implementation may choose:

- App Router file organization;
- component structure;
- exact Supabase helper organization;
- exact schema/table names for organization membership/profile data;
- supported Supabase login provider(s) for the first implementation;
- middleware versus server-layout/route enforcement patterns;
- validation library;
- test organization;
- local development scripts.

Implementation may not silently change:

- network-only access;
- organization/account eligibility requirement;
- Contributor/Admin authority separation;
- Supabase as the approved Auth/Postgres platform;
- server/data-layer enforcement requirement;
- the rule that authentication success does not by itself imply product eligibility.

## 11. Knowledge Updates Required

After verified implementation:

- update `docs/ARCHITECTURE.md` with verified application structure and auth implementation details that became current state;
- update `docs/SECURITY.md` if concrete session/authentication behavior becomes an authoritative operational contract;
- record new meaningful architecture decisions only if they materially exceed the implementation freedom above;
- move this spec from `active/` to `completed/` after verification.

## 12. Open Questions / Blockers

No known product blocker prevents implementation.

The exact first Supabase Auth login method is implementation freedom provided the institutional eligibility contract is preserved.

If account provisioning or provider constraints require changing who may access the product, return `BLOCKED / DECISION REQUIRED`.
