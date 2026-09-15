# Architecture — D+ Base Curricular

## 1. Status

**Technical state: SPEC-001, SPEC-002, AND SPEC-003 COMPLETED; SPEC-004 ACTIVE WITH LOCAL PHASES 1–4 IMPLEMENTED**

The Next.js application and Supabase identity foundation are implemented, locally tested, and have passed independent security/RLS review. The Google OAuth application flow is hosted-validated against the deployed Vercel application and intended Supabase Cloud project. The SPEC-002 read-only curriculum library is committed at `23564067774ba9ec314fbdace3733f34d096e142`; the SPEC-003 contribution and private-attachment implementation is committed at `e50feabc698e29c7bac6cf8b33e98b2a0cbfce20`. Both slices are independently verified, applied to the intended Supabase Cloud project, and hosted-validated on Vercel.

D-030 defines the active SPEC-004 contract: governed curriculum mutation and publication are Admin-only, while non-Admin users are current-published readers.

SPEC-003 remains valid implementation history, but its Contributor authoring authority is no longer the target authorization model. SPEC-004 Phase 1 reconciles Admin-only, role-wide Draft management and first publication; Phase 2 adds successor Draft creation and successor publication; Phase 3 adapts the existing authoring application into an Admin-only Spanish content-management surface; Phase 4 locally authorizes private attachment reads for authoritative current-published Teaching Note and Material revisions. Independent review, Cloud application, and hosted SPEC-004 validation remain open.

**Current implementation:** `docs/DECISIONS.md` (D-028) is implemented in application code as Google OAuth through Supabase Auth (primary), with Email OTP retained as fallback. §7 describes the authentication architecture and §18 records implementation detail.

This document defines the approved initial architecture for the MVP. These choices support the confirmed product, governance, and security contracts while keeping operational complexity low.

## 2. Initial stack

| Concern | Technology |
|---|---|
| Web application | Next.js + TypeScript |
| UI | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Application rules + Supabase RLS |
| File storage | Supabase Storage (private) |
| Email delivery | Resend |
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
   |-- Reader UI
   |-- Admin Content Management UI
   |-- Route Handlers / Server Actions
   |-- Publication orchestration
   |-- Search orchestration
   |
   v
Supabase
   |-- PostgreSQL
   |-- Auth
   |-- Row Level Security
   `-- Private Storage
```

Resend remains available for authentication/institutional email delivery and future notification needs, but governance workflow email is not required by the active Admin-only phase.

## 4. Required product capabilities

The architecture must support:

- authenticated private access;
- approved-organization eligibility;
- structured knowledge entities and relationships;
- current-published browsing, search, and filtering;
- relationship-driven navigation;
- personal module selection/itinerary;
- Admin-only governed-content creation and editing;
- Admin-wide management of active Admin Drafts;
- Admin-only successor revision authoring;
- Admin-only publication;
- versioned published content;
- provenance and lifecycle metadata;
- private attachment management;
- published attachment reader access;
- access and authorization controls;
- administrative operations;
- archival and restoration;
- durable history sufficient for knowledge governance.

## 5. Application layer

Next.js owns the product experience and application orchestration.

Responsibilities include:

- library exploration and discovery;
- module/reference detail pages;
- personal itinerary interaction;
- Admin content-management surfaces;
- Admin Draft creation and editing;
- successor revision creation;
- publication actions;
- archival/restoration actions where implemented;
- server-side authorization checks;
- integration with Supabase.

The initial operational phase does not require contribution submission, review queues, review comments, approval workflows, or governance workflow notifications.

The MVP should not introduce a separate custom backend service unless a concrete requirement makes it necessary.

## 6. Database and persistence

Supabase PostgreSQL is the canonical structured-data store.

It supports or must support:

- curriculum axes;
- modules;
- program topics;
- instructors;
- teaching notes;
- materials/studies;
- institutions/reference centers;
- organizations and users;
- stable content identities and typed revisions;
- publication state;
- archival state;
- audit/lifecycle events;
- private attachment metadata;
- itinerary selections.

Historical contribution/review-oriented states or metadata may remain for compatibility and provenance, but they are not current product behavior.

Search indexes and other derived representations must not become competing sources of truth.

## 7. Authentication

Supabase Auth is the approved authentication platform.

The product must support institutional identity while preserving product-owned eligibility rules.

Authentication establishes identity; authorization determines whether that identity may access the product.

The application validates:

`authenticated user -> approved email/domain -> active organization/account -> persisted role -> access`

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

Email OTP through Supabase Auth is the fallback authentication method and feeds the same downstream eligibility evaluation as Google OAuth.

Google OAuth may create a Supabase Auth identity on a user's first successful sign-in. Creation of that Auth identity, Google Workspace membership, email domain/suffix alone, or any OAuth/JWT metadata must never by themselves grant product access.

Product access still requires the live eligibility chain: exact approved domain, explicit active membership, active organization, and persisted Contributor/Admin role.

This architecture is implemented in the application and hosted-validated.

## 8. Authorization

Authorization is enforced through two complementary layers:

1. **Application-level rules** in Next.js.
2. **Supabase Row Level Security (RLS) and bounded database functions** at the data boundary.

UI state alone is never sufficient authorization.

### Non-Admin / Contributor

May:

- access authorized current published content;
- use authorized reader features.

Must not:

- create governed content;
- edit Admin Drafts;
- create successor revisions;
- mutate governed relationships or attachments;
- submit content;
- publish content;
- access Admin Drafts.

### Admin

May:

- access current published content;
- create governed content;
- access any active Admin Draft;
- edit any active Admin Draft regardless of creator;
- manage Draft relationships and attachments;
- create successor Draft revisions;
- publish valid Drafts;
- archive and restore content where implemented;
- access required governance/history information.

`created_by` is provenance, not an exclusive Admin ownership boundary.

Admin authority is based on the caller's current live persisted role. Role revocation removes Admin content-management authority on the next authoritative request, including for Drafts created by that user.

For the initial product, all current published content is visible to all eligible authenticated users from approved network organizations.

## 9. Revisions and publication

The data model preserves stable published content while newer Admin Draft revisions are prepared.

Conceptually:

`Content -> many Content Revisions`

with exactly one current published revision.

The active revision lifecycle is:

`Published v1 -> Draft v2 -> Published v2`

While `v2` is Draft:

- `v1` remains current and published;
- ordinary users continue to read `v1`;
- `v2` is visible only to authorized Admin management surfaces.

Any currently eligible Admin may manage the active Draft successor.

Publication promotes the valid Draft revision without destroying prior history.

**Established starting with SPEC-002** (`docs/DECISIONS.md` D-029): governed curriculum persistence uses stable identities plus typed revisions so current published content can remain stable while a later Draft coexists.

SPEC-004 uses trusted Admin-only database operations for publication and successor creation rather than relying on ordinary reader RLS. Successor creation locks the stable identity, copies the current Published semantic and revision-scoped relationship state into a new Draft, copies no attachment membership, and leaves the current pointer unchanged. Partial unique indexes enforce at most one active Draft per identity. Publication atomically promotes either an initial or successor Draft while retaining dependency locks through transaction commit.

## 10. Search

The MVP uses PostgreSQL full-text search and SQL filters.

This is sufficient for:

- textual search across structured knowledge;
- filters such as axis, country, and theme;
- relationship-driven discovery.

A dedicated external search service should not be introduced until scale or relevance requirements justify it.

Search must respect current-published and authorization rules.

## 11. File storage

Supabase Storage is the approved file-storage layer.

Buckets containing governed materials must be private.

File access must remain consistent with the authorization of the record/revision to which a file belongs.

Admin Draft attachments must remain Admin-only.

Attachments associated with current published content must be readable by eligible readers according to published-content authorization.

A private database row pointing to an unrestricted public file does not satisfy the security contract.

Signed or authenticated access may be used as appropriate.

## 12. Email notifications

Resend remains an approved infrastructure provider.

Governance workflow email notifications are not required during the active Admin-only phase.

Submission, review, requested-change, resubmission, approval, and publication notification workflows are deferred.

Authentication-related email delivery through Supabase/Resend remains independent of this governance decision.

## 13. Testing

### Vitest

Use for unit and integration tests covering:

- domain rules;
- lifecycle transitions;
- authorization helpers;
- validation;
- content/revision logic;
- search/filter behavior where practical.

### PostgreSQL / pgTAP

Use focused real-database tests for:

- role separation;
- Admin-wide Draft access;
- non-Admin mutation denial;
- current-published isolation;
- publication atomicity/integrity;
- Storage metadata authorization;
- role revocation.

### Playwright

Use for critical end-to-end journeys such as:

- authenticated eligible access;
- non-Admin current-published reading;
- non-Admin authoring denial;
- Admin Draft creation/editing;
- one Admin editing a Draft created by another Admin;
- Admin attachment management;
- Admin publication;
- Published v1 remaining visible while Draft v2 exists;
- publication of v2;
- live role revocation;
- archival/restoration when implemented.

## 14. Deployment

The web application is deployed on Vercel.

Supabase Cloud provides managed:

- PostgreSQL;
- Auth;
- Storage.

Resend provides managed email delivery.

Environment secrets must not be exposed to the browser unless explicitly intended for public client use.

## 15. CMS evaluation — Strapi

Strapi was evaluated as a possible headless CMS.

It was **not selected for the MVP**.

The active product has a bounded, product-specific editorial lifecycle:

`Admin Draft -> Publish -> Create successor Draft -> Publish replacement -> Archive`

Using Strapi would introduce an additional backend/CMS layer while the product would still need custom authentication, authorization, Admin UX, revision semantics, private Storage integration, and product-specific publication rules.

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
- Admin content-management transitions are explicit and testable.
- Published revisions remain stable while newer Admin Draft revisions are prepared.
- Any currently eligible Admin may manage any active Admin Draft.
- Creation provenance does not create exclusive Draft ownership.
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
- non-Admin users as current-published governed-content readers;
- Admin-only governed-content mutation and publication;
- Admin-wide management of active Admin Drafts regardless of creator;
- `created_by` as provenance rather than exclusive authorization;
- all current published content visible to all eligible authenticated users from approved network organizations;
- published-content edits create a new revision;
- prior published revision remains active until replacement is published;
- lifecycle auditability;
- collaborative contribution/review remains deferred;
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
- **RLS:** a restricted, read-only `private.current_access()` security-definer function joins live membership, organization, approved domain, and Auth identity. Qualified names and an empty search path prevent name substitution; avoiding policy-mediated recursive reads prevents RLS recursion. Public wrappers are security-invoker. Policies allow eligible users to read only their own membership and organization/domain configuration.
- **Database workflow:** versioned migration in `supabase/migrations`, local PostgreSQL 17 and CLI configuration in `supabase/config.toml`, rollback-only pgTAP tests under `supabase/tests`, schema types under `src/lib/supabase`.
- **Testing:** Vitest validates Google initiation/callback orchestration, fixed redirects, server authorization, and deterministic inputs; SQL tests exercise real privileges/RLS; Playwright uses local Supabase Auth and Mailpit to test the shared provider-independent access boundary.
- **Hosting:** conventional Vercel Next.js deployment with public project variables supplied through environment configuration, deployed at `https://dmas-base-curricular.vercel.app`.

The root `README.md` owns setup commands, provisioning mechanics, local port conventions, and deployment configuration. `SECURITY.md` owns implemented security boundaries and their operational limitations. SPEC-001 is completed.

## 19. SPEC-002 implemented structure

- **Persistence:** each governed curriculum type uses a normalized stable-identity table and typed revision table. Composite foreign keys constrain each current pointer to its own identity, and triggers require current status `Published`. Published revision fields and revision-scoped relationships are immutable. Archive state lives on stable identities.
- **Relationships:** Program Topic and Teaching Note revisions target stable Module/Program Topic identities; module-to-instructor/material/institution and teaching-note-to-material joins are anchored to the owning revision. Target knowledge objects resolve through their own current published pointers.
- **Reader data boundary:** all curriculum/relationship tables have RLS and `authenticated` receives `SELECT` only. Policies require current-published, non-archived resolution. Contributor and Admin use identical reader policies.
- **Read model:** public reader RPCs compose reader representations inside PostgreSQL while retaining RLS. Next.js server-only query functions call `requireAccess()` at each protected data entry point.
- **Search and filters:** PostgreSQL full-text search and SQL filters operate under the same reader boundary.
- **Rendering:** protected routes are dynamically rendered and protected responses remain private/no-store.
- **Trusted import:** the operator import path inserts identities, revisions, and revision-scoped relationships before setting current pointers.
- **Future publication write path:** SPEC-004 must explicitly implement and test its trusted Admin publication path rather than assuming ordinary reader RLS is sufficient.
- **Validation:** SPEC-002 is independently verified and completed.

Production currently contains the two approved axes and no governed module/reference rows from the trusted real-content importer.

## 20. SPEC-003 implemented structure

- **Writes:** authenticated Server Actions currently call bounded `create_contribution`, `update_contribution`, `submit_contribution`, and `delete_contribution` RPCs. These operations derive actor and organization from live access, use owner-scoped Draft semantics, and do not provide publication authority.
- **Pending reads:** additive owner-only RLS currently exposes the caller's Draft and Submitted identities, typed revisions, relationships, and attachment metadata. Admin currently receives no cross-user pending visibility.
- **Provenance and events:** contribution revisions snapshot creation-time organization and persist lifecycle evidence.
- **Relationships:** SPEC-003 Draft forms resolve current-published targets and caller-owned compatible pending identities.
- **Storage:** `governed-attachments` is private, document-only, and limited to 3 MiB. Typed metadata supports Teaching Notes and Materials only. Upload/deletion use compensating metadata states.
- **Application:** `/app/contributions` provides the historical SPEC-003 Spanish contribution flow.
- **Deployment boundary:** downloads authorize current access and metadata before issuing a short-lived signed Storage redirect.
- **Verification:** the SPEC-003 migration and hosted behavior are independently verified.

SPEC-003 is completed historical implementation evidence.

Under D-030, its Contributor authoring, owner-only Draft management, and submission path are no longer the active target authorization model.

SPEC-004 is reconciling these verified primitives to:

- Admin-only governed-content mutation;
- Admin-wide active Draft visibility/editing;
- direct `Draft -> Published`;
- successor revision creation;
- current-published replacement;
- published attachment reader access;
- legacy non-Admin write denial.

The locally implemented Phase 1 and Phase 2 database foundation provides those authorization, publication, dependency-locking, and successor-revision primitives. Phase 3 provides role-aware navigation, an Admin-wide Published/Draft management list, six-type creation/editing, Draft attachment management, direct publication, and successor-version application flows. Phase 4 adds a live-eligibility, `Ready`-state, exact-current-pointer predicate to additive attachment metadata and private Storage read policies, reuses the 60-second signed-download route, and presents attachments on published Teaching Note and Material detail surfaces without exposing object names. Draft/historical attachment isolation and existing Admin mutation behavior remain separate. Independent review and Cloud/hosted closure gates are not complete.

This reconciliation should preserve SPEC-003 provenance, event history, attachment architecture, and dormant historical states where safe.
