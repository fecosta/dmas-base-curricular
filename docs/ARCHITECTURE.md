# Architecture — D+ Base Curricular

## 1. Status

**Technical state: SPEC-001 FOUNDATION IMPLEMENTED AND REVIEWED — AUTHENTICATION-STRATEGY DELTA ACTIVE**

The Next.js application and Supabase identity foundation are implemented, locally tested, and have passed independent security/RLS review. The SPEC-001 identity migration has been applied to the intended Supabase Cloud project and its RLS/grants/ownership posture inspected there; Google OAuth provider configuration, Google OAuth implementation, hosted OAuth/OTP validation, and Vercel deployment remain unverified. Sections describing curriculum, workflow, search, Storage, and Resend remain the approved architecture for later slices, not implemented functionality.

**Current implementation vs. approved target:** the currently implemented authentication flow is Email OTP only. `docs/DECISIONS.md` (D-028) has since approved Google OAuth through Supabase Auth as the primary MVP authentication experience, with Email OTP retained as fallback. §7 below describes the target authentication architecture; §18 describes what is currently implemented. This does not change the authorization model in §8.

This document defines the approved initial architecture for the MVP. These choices are intended to support the confirmed product, governance, and security contracts while keeping operational complexity low.

## 2. Initial stack

| Concern | Technology |
|---|---|
| Web application | Next.js + TypeScript |
| UI | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Application rules + Supabase RLS |
| File storage | Supabase Storage (private) |
| Email notifications | Resend |
| Search | PostgreSQL full-text search + SQL filters |
| Unit/integration tests | Vitest |
| End-to-end tests | Playwright |
| Hosting | Vercel |
| Managed backend | Supabase Cloud |

## 3. Architecture shape

```text
Browser
   |
   v
Next.js
   |
   |-- Product UI
   |-- Contributor UI
   |-- Admin / Review UI
   |-- Route Handlers / Server Actions
   |-- Workflow orchestration
   |-- Search orchestration
   |-- Notification orchestration
   |       |
   |       `-- Resend
   |
   v
Supabase
   |-- PostgreSQL
   |-- Auth
   |-- Row Level Security
   `-- Private Storage
```

## 4. Required product capabilities

The architecture must support:

- authenticated private access;
- approved-organization eligibility;
- structured knowledge entities and relationships;
- search and filtering;
- relationship-driven navigation;
- personal module selection/itinerary;
- contribution/edit workflows;
- governed review/publication workflows;
- versioned published content;
- review comments;
- email notifications for review events;
- provenance and lifecycle metadata;
- access and authorization controls;
- administrative operations;
- archival and restoration;
- durable history sufficient for knowledge governance.

## 5. Application layer

Next.js owns the product experience and application orchestration.

Responsibilities include:

- library exploration and discovery;
- module/reference detail pages;
- contribution forms;
- personal itinerary interaction;
- Admin review queue;
- review comments and change requests;
- approval, publication, and archival actions;
- server-side authorization checks;
- integration with Supabase and Resend.

The MVP should not introduce a separate custom backend service unless a concrete requirement makes it necessary.

## 6. Database and persistence

Supabase PostgreSQL is the canonical structured-data store.

It must support:

- curriculum axes;
- modules;
- program topics;
- instructors;
- teaching notes;
- materials/studies;
- institutions/reference centers;
- organizations and users;
- contributions and revisions;
- review comments;
- publication state;
- archival state;
- audit/lifecycle events;
- itinerary selections.

Search indexes and other derived representations must not become competing sources of truth.

## 7. Authentication

Supabase Auth is the approved authentication platform.

The product must support institutional identity while preserving product-owned eligibility rules.

Authentication establishes identity; authorization determines whether that identity may access the product.

The application must validate:

`authenticated user -> approved email/domain -> active organization/account -> allowed role`

**Approved target authentication architecture** (`docs/DECISIONS.md` D-028):

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

Email OTP through Supabase Auth is the fallback authentication method and feeds the same downstream eligibility evaluation as Google OAuth — there is no separate authorization path per provider.

Google OAuth may create a Supabase Auth identity on a user's first successful sign-in. Creation of that Auth identity, Google Workspace membership, email domain/suffix alone, or any OAuth/JWT metadata must never by themselves grant product access. Product access still requires the live eligibility chain in §8: exact approved domain, explicit active membership, active organization, and persisted Contributor/Admin role. The Email OTP fallback must remain fail-closed under the same eligibility checks and must not become an unrestricted signup mechanism.

This target architecture describes the approved direction, not an implemented OAuth callback. §18 records what is currently implemented (Email OTP only).

## 8. Authorization

Authorization is enforced through two complementary layers:

1. **Application-level rules** in Next.js.
2. **Supabase Row Level Security (RLS)** at the data boundary.

UI state alone is never sufficient authorization.

The MVP must preserve at least these boundaries:

### Contributor

May:

- access published content;
- create and edit permitted drafts/revisions;
- submit and resubmit contributions;
- view review feedback for their own contributions.

Must not:

- approve or publish external contributions;
- bypass valid lifecycle transitions;
- read pending revisions they are not authorized to access.

### Admin

May:

- review submitted content;
- request changes;
- approve revisions;
- publish content;
- archive and restore content;
- access required governance/audit information;
- create and publish Democracia+ content directly.

For the initial product, all published content is visible to all authenticated users from approved network organizations.

## 9. Revisions and publication

The data model must preserve stable published content while newer revisions are reviewed.

Conceptually:

`Content -> many Content Revisions`

with one revision identified as the current published revision.

While `v2` is under review:

- `v1` remains published;
- ordinary users continue to read `v1`;
- `v2` remains restricted to permitted workflow participants.

Publication promotes the approved revision without destroying historical revisions.

## 10. Search

The MVP uses PostgreSQL full-text search and SQL filters.

This is sufficient for the initial requirements:

- textual search across structured knowledge;
- filters such as axis, country, and theme;
- relationship-driven discovery.

A dedicated external search service should not be introduced until scale or relevance requirements justify it.

Search must respect publication and authorization rules.

## 11. File storage

Supabase Storage is the approved file-storage layer.

Buckets containing governed materials must be private.

File access must remain consistent with the authorization of the record/revision to which a file belongs.

A private database row pointing to an unrestricted public file does not satisfy the security contract.

Signed or authenticated access may be used as appropriate during implementation.

## 12. Email notifications

Resend is the approved provider for workflow email notifications.

Required initial events:

- external contributor submits content -> Admin notification;
- contributor resubmits content -> Admin notification;
- Admin requests changes -> Contributor notification.

Email messages should contain secure application links rather than unnecessary sensitive content.

Receiving an email link never replaces authentication or authorization.

## 13. Testing

### Vitest

Use for unit and integration tests covering:

- domain rules;
- lifecycle transitions;
- authorization helpers;
- validation;
- content/revision logic;
- search/filter behavior where practical.

### Playwright

Use for critical end-to-end journeys such as:

- authenticated access;
- contribution submission;
- Admin review;
- change request and resubmission;
- approval and publication;
- published-content revision;
- archival;
- authorization boundaries.

## 14. Deployment

The web application will be deployed on Vercel.

Supabase Cloud provides managed:

- PostgreSQL;
- Auth;
- Storage.

Resend provides managed email delivery.

Environment secrets must not be exposed to the browser unless explicitly intended for public client use.

## 15. CMS evaluation — Strapi

Strapi was evaluated as a possible headless CMS.

It was **not selected for the MVP**.

The current product has a relatively bounded, product-specific editorial workflow:

`contribute -> review -> request changes -> resubmit -> approve -> publish -> archive`

Using Strapi would introduce an additional backend/CMS layer while the product would still need custom authentication, authorization, contributor UX, review UX, and product-specific workflow integration.

The selected Next.js + Supabase architecture provides:

- direct control over the product-specific workflow;
- integrated Auth, PostgreSQL, RLS, and private Storage;
- fewer operational components;
- a simpler security model for the MVP.

### Reconsideration trigger

A generic headless CMS may be reconsidered later if editorial-management complexity grows materially, for example:

- many content types with generic editorial operations;
- complex multi-stage editorial teams;
- extensive bulk editing;
- localization workflows;
- release scheduling;
- editorial preview/version management beyond the current product-specific workflow.

Until such needs are demonstrated, Strapi is not part of the approved architecture.

## 16. Architecture principles

- Canonical structured content remains the source of truth.
- Authorization is enforced at the application and data layers.
- Governance transitions are explicit and testable.
- Published revisions remain stable while new revisions are reviewed.
- Search and exports cannot leak unpublished or unauthorized content.
- Uploaded files follow the access policy of their parent content/revision.
- Keep the MVP operationally simple.
- Do not introduce microservices, workers, external search infrastructure, or a generic CMS without a demonstrated requirement.
- Technical abstractions must not silently redefine product semantics.
- AI features, if introduced later, must preserve provenance and publication authority.

## 17. Product contracts architecture must preserve

- network-only private access;
- library-oriented experience, not LMS behavior;
- two initial curriculum axes;
- personal itinerary as non-hierarchical content selection;
- contribution by Democracia+ and partner organizations;
- Admin review required for content submitted by users from other organizations;
- Admin may create and publish Democracia+ content directly;
- a single Admin role owns review, approval, publication, archival, and restoration in the MVP;
- all published content is visible to all authenticated users from approved network organizations;
- email notification on submit/resubmit and when changes are requested;
- published-content edits create a new revision;
- prior published revision remains active until replacement is approved and republished;
- lifecycle auditability;
- `level` and `delivery_format` may remain as data but are not required in current UX;
- completeness percentage is not part of the approved product contract;
- published content is archived rather than destructively deleted as part of the normal workflow.

## 18. SPEC-001 implemented structure

- **Runtime:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Node.js 22.x, npm lockfile.
- **UI:** `src/app/login` (Spanish code request/verification), `src/app/app` (protected account shell), `src/app/access-denied`, and Spanish loading/error/not-found states.
- **Auth (currently implemented):** Supabase email OTP for operationally provisioned, confirmed Auth identities; public signup is disabled. Server Actions request and verify codes and sign out the current session. **Approved target (not yet implemented):** Google OAuth through Supabase Auth as the primary method, with this Email OTP flow retained as fallback (`docs/DECISIONS.md` D-028). The provider mix itself is a fixed product decision, not implementation freedom; remaining OAuth implementation details (e.g. exact callback route naming) are implementation freedom within SPEC-001's active authentication-strategy delta.
- **Client boundaries:** `src/lib/supabase/server.ts` is marked `server-only` and uses request cookies with the public project key; the proxy creates its own request-scoped server client for session refresh. Production code currently uses no browser Supabase client or privileged application client.
- **Session refresh:** `src/proxy.ts` refreshes Supabase cookies with `getClaims()`, propagates cookies and cache-prevention headers, and sets `Cache-Control: private, no-store`. It is not the eligibility boundary.
- **Server authorization:** `src/lib/auth/access.ts` calls Auth `getUser()` and the no-argument `current_access()` RPC. `requireAccess()` protects the page; `/api/access` independently returns the caller's minimal context or 401/403/503. An optional exact-role check and SQL `is_admin()` distinguish Admin authority without introducing governance features.
- **Persistence:** `organizations`, `organization_domains`, `memberships`, and the two-value `product_role` enum. Membership is one organization per Auth user. Email remains canonical in `auth.users`. Tables have no ordinary client write privileges.
- **RLS:** a restricted, read-only `private.current_access()` security-definer function joins live membership, organization, approved domain, and Auth identity. Qualified names and an empty search path prevent name substitution; avoiding policy-mediated recursive reads prevents RLS recursion. Public wrappers are security-invoker. Policies allow eligible users to read only their own membership and organization/domain configuration. This is identity-data minimization, not a published-content visibility tier.
- **Database workflow:** versioned migration in `supabase/migrations`, local PostgreSQL 17 and CLI configuration in `supabase/config.toml`, rollback-only pgTAP tests under `supabase/tests`, schema types under `src/lib/supabase`.
- **Testing:** Vitest validates server orchestration and deterministic inputs; SQL tests exercise real privileges/RLS; Playwright uses local Supabase Auth and Mailpit, ordinary user credentials for authorization checks, and local-only privileged setup/cleanup. Browser tests run against both development and production Next.js servers.
- **Hosting:** conventional Vercel Next.js deployment with public project variables supplied through environment configuration. Local production builds are verified; hosted deployment is pending.

The root `README.md` owns setup commands, provisioning mechanics, local port conventions, and deployment configuration. `SECURITY.md` owns implemented security boundaries and their operational limitations. SPEC-001 remains active to deliver its authentication-strategy delta (Google OAuth primary + Email OTP fallback, per `docs/DECISIONS.md` D-028); later slices have not been implemented.
