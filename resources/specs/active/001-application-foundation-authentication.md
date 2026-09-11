# SPEC-001 — Application Foundation & Authentication

**Status:** FOUNDATION IMPLEMENTED AND REVIEWED — AUTHENTICATION-STRATEGY DELTA ACTIVE  
**Depends on:** Confirmed product baseline and initial stack  
**Authority:** Product and stack decisions confirmed 2026-09-10; authentication-strategy decision (D-028) confirmed 2026-09-11

## 1. Purpose / Objective

Create the production application foundation and establish secure network-only authentication for D+ Base Curricular.

At the end of this slice, an eligible user must be able to authenticate and reach a protected application shell, while ineligible users are denied access. The application must also establish the initial Contributor/Admin authorization model, Supabase integration, test foundation, and deployable Vercel baseline required by subsequent specs.

A subsequent product decision (D-028) approved Google OAuth through Supabase Auth as the primary MVP authentication experience, with Email OTP through Supabase Auth retained as fallback. This spec remains active to deliver that narrow authentication-strategy delta on top of the already-implemented and reviewed foundation. See §5.

## 2. Current State

The application foundation described in this specification has been implemented and has passed:

- local implementation validation;
- independent security/RLS review;
- a narrow fix re-review;
- merge/commit review.

The SPEC-001 identity migration has also been applied to the intended Supabase Cloud project. Cloud verification has confirmed RLS enabled on `organizations`, `organization_domains`, and `memberships` with no `FORCE RLS`, postgres ownership, expected `SELECT` policies, `private.current_access()` remaining `SECURITY DEFINER` with an empty `search_path` and the expected execution grants, and `authenticated` table access remaining `SELECT`-only. Relevant Cloud email/Auth baseline settings have also been reviewed.

**Currently implemented authentication flow:** Google OAuth through Supabase Auth as primary, with Email OTP retained as fallback. The application implements secure initiation, a fixed callback, server-side PKCE exchange, generic failure handling, and the unchanged shared eligibility boundary. See `docs/ARCHITECTURE.md` §18 and `docs/SECURITY.md` §19 for implementation detail.

**Approved strategy now implemented in application code:** Google OAuth through Supabase Auth is the primary authentication method, with Email OTP retained as fallback (`docs/DECISIONS.md` D-028), because all participating organizations currently use Google Workspace. This changes the authentication user experience only; it does not weaken or redefine the organization/domain/membership/role authorization model or RLS design already implemented and reviewed under this spec.

Google OAuth provider configuration and hosted validation of both authentication methods under the revised model remain outstanding. This specification does not claim a real Google provider round trip has been completed.

**Still required (hosted validation):**

- Google OAuth provider configuration in Supabase;
- Google OAuth hosted authentication scenarios;
- Email OTP fallback validation under the revised model;
- institutional SMTP delivery for the Email OTP fallback;
- Vercel deployment and hosted access smoke tests.

None of the above are complete; do not treat them as implemented.

## 3. Problem / Gap

The product is defined as private and network-only. The production identity, organization-eligibility, authorization-boundary, database-connection, test-foundation, and deployable-application-shell work described by this spec has been implemented and reviewed (§2), but the authentication strategy approved for the MVP (Google OAuth primary, Email OTP fallback) is not yet fully realized: only the Email OTP fallback exists today.

All subsequent product features depend on a trustworthy user identity and secure application foundation, and on the authentication experience matching the approved strategy before broader institutional rollout.

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

## 5. Authentication-Strategy Delta (Approved Target)

This section records the delta between the implemented foundation (§2) and the authentication strategy approved by `docs/DECISIONS.md` D-028.

### Target authentication flow

```text
Google OAuth
   |
   v
Supabase Auth
   |
   v
authenticated identity
   |
   v
product-owned eligibility evaluation
   |
   v
protected application
```

Email OTP through Supabase Auth uses the same downstream eligibility evaluation as Google OAuth; there is no separate authorization path per provider.

### Delta requirements

- Google OAuth becomes the primary MVP login option; this Email OTP implementation is retained as fallback.
- A first-time valid Google OAuth authentication may create a Supabase Auth identity for that user.
- Creation of that Auth identity — and Google Workspace membership, email suffix/domain alone, OAuth profile metadata, or JWT metadata — must never by themselves create membership, organization association, or role authority, or otherwise grant product access.
- Product access after Google OAuth authentication still requires the same live eligibility chain already implemented: exact approved institutional domain, explicit active membership, active organization, and persisted Contributor/Admin role.
- The Email OTP fallback must remain fail-closed and must continue to use the same eligibility checks; it must not become an unrestricted signup mechanism.
- The existing RLS policies and `private.current_access()` design (§2, `docs/SECURITY.md` §19) are authoritative for both authentication methods and are not altered by this delta.

This delta does not change product scope, the Contributor/Admin authority model, or any acceptance criterion already satisfied in §9; it adds the criteria in §9 items 20–30.

## 6. Scope

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
- document local setup and required environment variables without committing secrets;
- implement Google OAuth through Supabase Auth as the primary authentication method, with the existing Email OTP flow retained as fallback, per the authentication-strategy delta in §5.

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
- separate Reviewer/Publisher roles;
- any change to the organization/domain/membership/role authorization model or RLS design.

## 7. Expected Behavior

### Product language

The authentication experience and protected application shell must be Spanish-first.

User-facing authentication, eligibility, access-denied, navigation, validation, and error copy introduced in this slice must be in Spanish.

### Unauthenticated user

When an unauthenticated user attempts to access a protected product route:

- they cannot access protected application data;
- they are directed into the supported authentication flow(s), which present Google OAuth as the primary option and Email OTP as fallback.

### Eligible authenticated user

When a user authenticates — through Google OAuth or Email OTP — with an identity that maps to an approved active organization/account:

- the application establishes their user identity;
- their organization is known to the application;
- their product role is known;
- they may access the protected application shell.

### Ineligible authenticated user

When authentication succeeds — through Google OAuth or Email OTP — but the user is not eligible under the approved organization/account policy:

- access to the protected product is denied;
- no protected product data is returned;
- the denial must not rely solely on hiding UI elements;
- this holds even when Google OAuth has created a Supabase Auth identity for that user: identity creation alone never grants access.

### Contributor

A Contributor can access the protected shell.

Contributor permissions must not implicitly grant Admin capabilities.

### Admin

An Admin can access the protected shell and can be distinguished authoritatively from a Contributor for later governance features.

### Session-derived identity

Future forms must be able to obtain the user's identity and organization from trusted authentication/application context.

The application must not require users to type their own email or organization merely to establish provenance.

## 8. Constraints

- Supabase Auth is the approved identity platform.
- The approved MVP provider mix is Google OAuth (primary) and Email OTP (fallback) through Supabase Auth, per `docs/DECISIONS.md` D-028. This provider mix is a fixed product decision, not implementation freedom.
- Authorization must be enforced server-side and/or at the data boundary.
- RLS must be enabled for tables containing protected identity/organization data as appropriate.
- Public/client-safe Supabase configuration must remain separate from privileged server credentials.
- Service-role credentials, if used, must never be exposed to the browser.
- Domain allowlisting alone must not grant Admin privileges.
- Google OAuth identity creation alone must not grant Admin or Contributor privileges, membership, or organization association.
- The application is network-only.
- Do not introduce Strapi, another CMS, a separate custom backend, external search infrastructure, or microservices in this slice.
- Do not implement future permission tiers that are not part of the MVP.
- Spanish is the primary product language; do not build an English-first shell with localization deferred.

## 9. Impact Surface

### Affected

- application foundation;
- route protection;
- authentication (login UI and provider configuration, per §5);
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
- itinerary semantics;
- the organization/domain/membership/role authorization model and RLS design.

## 10. Acceptance Criteria

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

### Authentication-strategy delta (added 2026-09-11, per D-028)

20. Google OAuth is the primary login option presented to users.
21. A first-time valid Google OAuth authentication can create/authenticate a Supabase Auth identity.
22. Auth identity creation alone (via Google OAuth) grants no protected access.
23. A Google OAuth user from an approved domain but without membership is denied protected access.
24. A Google OAuth user from a non-approved domain is denied protected access.
25. An eligible Google OAuth user with an active membership, active organization, and persisted role receives access to the protected shell.
26. The Contributor/Admin distinction remains persisted and trusted for users authenticated through Google OAuth, exactly as for Email OTP.
27. Email OTP remains available as a fallback authentication method.
28. Email OTP uses the same eligibility rules as Google OAuth.
29. Email OTP does not become an unrestricted signup mechanism.
30. Existing RLS policies and `private.current_access()` authorization remain effective and unmodified for both authentication methods.

## 11. Implementation Freedom

Implementation may choose:

- App Router file organization;
- component structure;
- exact Supabase helper organization;
- exact schema/table names for organization membership/profile data;
- middleware versus server-layout/route enforcement patterns;
- validation library;
- test organization;
- local development scripts;
- Google OAuth UI composition, callback route naming, and session-handling implementation details consistent with the approved Google OAuth primary + Email OTP fallback provider mix (`docs/DECISIONS.md` D-028), where not already established by repository convention.

Implementation may not silently change:

- network-only access;
- organization/account eligibility requirement;
- Contributor/Admin authority separation;
- Supabase as the approved Auth/Postgres platform;
- server/data-layer enforcement requirement;
- the rule that authentication success does not by itself imply product eligibility;
- the approved Google OAuth primary + Email OTP fallback provider mix (this is now a fixed product decision, not implementation freedom).

## 12. Knowledge Updates Required

Completed in the authentication-strategy implementation pass:

- `README.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/DECISIONS.md` record the implemented Google OAuth application flow, retained Email OTP fallback, unchanged authorization boundary, operator configuration, and remaining hosted validation.

Still required after hosted Google OAuth is independently verified:

- reconcile the hosted provider and deployment validation results in the current-state documentation;
- record any new meaningful architecture decision only if it materially exceeds the implementation freedom in §11;
- move this spec from `active/` to `completed/` only after the authentication-strategy delta (§5, §9 items 20–30) is implemented and independently verified, and hosted validation (§2) is complete.

## 13. Open Questions / Blockers

No known product blocker prevents implementation of the authentication-strategy delta.

Exact Google OAuth implementation details (callback route naming, UI composition) not already established by repository convention remain implementation freedom, provided the institutional eligibility contract and the approved provider mix are preserved.

If Google Workspace/OAuth provider constraints require changing who may access the product, or require weakening the eligibility chain in §5, return `BLOCKED / DECISION REQUIRED`.
