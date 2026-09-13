# Architecture — D+ Base Curricular

## 1. Status

**Technical state: SPEC-001 AND SPEC-002 COMPLETED; SPEC-003 ACTIVE**

The Next.js application and Supabase identity foundation are implemented, locally tested, and have passed independent security/RLS review. The Google OAuth application flow is hosted-validated against the deployed Vercel application and intended Supabase Cloud project. The SPEC-002 read-only curriculum library, revision-capable persistence, reader RLS, PostgreSQL search, import foundation, and Spanish reader UI are committed at `23564067774ba9ec314fbdace3733f34d096e142`, independently verified, applied to the intended Supabase Cloud project, and hosted-validated on Vercel. SPEC-003 is active but not implemented. Review/publication, audit/archival, and itinerary functionality remain later slices.

**Current implementation:** `docs/DECISIONS.md` (D-028) is implemented in application code as Google OAuth through Supabase Auth (primary), with Email OTP retained as fallback. §7 describes the authentication architecture and §18 records implementation detail. Hosted Google provider configuration and end-to-end validation have been completed. This does not change the authorization model in §8.

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

This architecture is implemented in the application. Hosted Google provider configuration and a real provider round trip have been validated against the deployed Vercel application and the intended Supabase Cloud project.

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

**Established starting with SPEC-002** (`docs/DECISIONS.md` D-029): governed curriculum persistence (Module, Program Topic, Instructor, Teaching Note, Material/Study, Institution/Reference Center) must support this Content/Content Revision distinction from its initial implementation, even though SPEC-002 itself creates and exposes only already-published, single revisions and implements no contribution/review/approval/revision-authoring workflow. This avoids a destructive schema redesign when SPEC-003–005 introduce draft, review, and archival revisions for the same identities. The physical schema shape (normalization, join structure, revision-payload storage) remains SPEC-002 implementation freedom, provided the invariant holds.

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
- **UI:** `src/app/login` presents Spanish Google OAuth as the primary action and email code request/verification as fallback; `src/app/app` is the protected account shell, with `src/app/access-denied` and Spanish loading/error/not-found states.
- **Auth:** a Server Action initiates Supabase Google OAuth with a configured application-owned callback and validates the returned authorization endpoint against the configured Supabase origin. `src/app/auth/callback` exchanges the PKCE code server-side, writes the Supabase session through the existing SSR cookie client, and redirects only to `/app`; missing/invalid exchanges return to a generic login error. `/app` then applies the same `requireAccess()` used after OTP. Email OTP remains available for confirmed identities, with `shouldCreateUser: false`; sign-out behavior is unchanged. Auth identity creation is enabled to permit first-time Google identities, but neither auth path creates membership or role authority.
- **Client boundaries:** `src/lib/supabase/server.ts` is marked `server-only` and uses request cookies with the public project key; the proxy creates its own request-scoped server client for session refresh. Production code currently uses no browser Supabase client or privileged application client.
- **Session refresh:** `src/proxy.ts` refreshes Supabase cookies with `getClaims()`, propagates cookies and cache-prevention headers, and sets `Cache-Control: private, no-store`. It is not the eligibility boundary.
- **Server authorization:** `src/lib/auth/access.ts` calls Auth `getUser()` and the no-argument `current_access()` RPC. `requireAccess()` protects the page; `/api/access` independently returns the caller's minimal context or 401/403/503. An optional exact-role check and SQL `is_admin()` distinguish Admin authority without introducing governance features.
- **Persistence:** `organizations`, `organization_domains`, `memberships`, and the two-value `product_role` enum. Membership is one organization per Auth user. Email remains canonical in `auth.users`. Tables have no ordinary client write privileges.
- **RLS:** a restricted, read-only `private.current_access()` security-definer function joins live membership, organization, approved domain, and Auth identity. Qualified names and an empty search path prevent name substitution; avoiding policy-mediated recursive reads prevents RLS recursion. Public wrappers are security-invoker. Policies allow eligible users to read only their own membership and organization/domain configuration. This is identity-data minimization, not a published-content visibility tier.
- **Database workflow:** versioned migration in `supabase/migrations`, local PostgreSQL 17 and CLI configuration in `supabase/config.toml`, rollback-only pgTAP tests under `supabase/tests`, schema types under `src/lib/supabase`.
- **Testing:** Vitest validates Google initiation/callback orchestration, fixed redirects, server authorization, and deterministic inputs; SQL tests exercise real privileges/RLS; Playwright uses local Supabase Auth and Mailpit to test the shared provider-independent access boundary, ordinary user credentials for authorization checks, and local-only privileged setup/cleanup. Browser tests run against both development and production Next.js servers. A real Google provider round trip has been hosted-validated against the deployed Vercel application; browser coverage beyond Chromium remains a follow-up.
- **Hosting:** conventional Vercel Next.js deployment with public project variables supplied through environment configuration, deployed at `https://dmas-base-curricular.vercel.app`. Local production builds and the hosted deployment are both verified.

The root `README.md` owns setup commands, provisioning mechanics, local port conventions, and deployment configuration. `SECURITY.md` owns implemented security boundaries and their operational limitations. SPEC-001 delivered its authentication-strategy delta (Google OAuth primary + Email OTP fallback, per `docs/DECISIONS.md` D-028) and is completed.

## 19. SPEC-002 implemented structure

- **Persistence:** each governed curriculum type uses a normalized stable-identity table and typed revision table. Composite foreign keys constrain each current pointer to its own identity, and triggers require current status `Published`. Published revision fields and revision-scoped relationships are immutable. Relationship rows for a newly prepared published revision must be established before that revision is assigned as the identity's `current_published_revision_id`; after pointer assignment, the relationship snapshot is immutable. Archive state lives on stable identities. Axis is direct structural data, with the two approved axes inserted idempotently.
- **Relationships:** Program Topic and Teaching Note revisions target stable Module/Program Topic identities; module-to-instructor/material/institution and teaching-note-to-material joins are anchored to the owning revision. Target knowledge objects resolve through their own current published pointers.
- **Reader data boundary:** all 17 curriculum/relationship tables have RLS and `authenticated` receives `SELECT` only. Policies call a narrow eligibility predicate backed by the unchanged `private.current_access()`, then require current-published, non-archived resolution. Contributor and Admin use identical reader policies. Public reader RPCs are security-invoker and executable only by `authenticated`.
- **Read model:** `list_published_modules`, `get_published_module`, `search_curriculum`, and `get_published_reference` compose reader representations inside PostgreSQL while retaining RLS. Next.js server-only query functions also call `requireAccess()` at each protected data entry point.
- **Search and filters:** GIN expression indexes use Spanish PostgreSQL text search over accent-normalized Module, Material/Study, and Institution fields. `search_curriculum` composes FTS with persisted axis, country/scope, and free-text/array theme filters. It returns only rows admitted by the same reader RLS as detail and browse.
- **Rendering:** `/app` is forced dynamic and uses cookie-backed request APIs. Protected links disable prefetch, the proxy emits `Cache-Control: private, no-store`, and no ISR/shared application cache is used. Grilla and Programa render the same server result set as presentation alternatives.
- **Trusted import:** `scripts/import-curriculum.mjs` accepts stable-ID versioned JSON with an administrative Supabase credential and exact target confirmation. One restricted security-invoker RPC transaction inserts identities, revisions, and revision-scoped relationships before setting current pointers, preserving the required relationship-before-pointer ordering. Repeated identical input is unchanged; invalid relationships, stable-ID drift, or pointer replacement roll back the complete import. Only the approved axes are committed as authoritative data.
- **Future publication write path:** `private.enforce_current_published_revision()` intentionally runs as invoker under the SPEC-002 read-only model. Independent review verified that ordinary reader RLS does not make a non-current Published revision visible to a future RLS-bound Admin update. SPEC-004 must therefore explicitly design and test its publication write path, such as through an appropriately secured trusted function or workflow-aware policies, rather than assuming ordinary reader RLS is sufficient. This is a future write-path constraint, not a SPEC-002 reader defect or a decision about the final SPEC-004 mechanism.
- **Cloud and hosted validation:** migration `20260911000100_core_curriculum_library.sql` was the sole Cloud dry-run delta and is recorded in remote history on project `qcxcgwpfgclyebkxawyh`. The resulting tables, D-029 constraints/triggers, RLS, grants, functions, FTS indexes, two axes, and private-schema boundary were verified. Vercel serves commit `2356406`; eligible Google OAuth and Email OTP sessions reach `/app/library`, a controlled authenticated-but-ineligible identity is denied, and tested protected responses remain private/no-store.
- **Validation:** migration replay, 108 pgTAP assertions, DB lint, 43 Vitest tests, typecheck, lint, production build, and 9 development plus 9 production Chromium E2E journeys passed. Independent adversarial review found all 22 acceptance criteria satisfied, and its narrow correction pass passed independent re-review.

SPEC-002 is completed. Production currently contains the two approved axes and no governed module/reference rows; real-content search/filter validation remains an operational follow-up after content owners provide an approved payload.
