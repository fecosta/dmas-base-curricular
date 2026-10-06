# Architecture — D+ Base Curricular

## 1. Status

**Technical state: SPEC-001 through SPEC-007 and SPEC-009 completed**

The Next.js application and Supabase identity foundation are implemented, locally tested, and have passed independent security/RLS review. The Google OAuth application flow is hosted-validated against the deployed Vercel application and intended Supabase Cloud project. The SPEC-002 read-only curriculum library is committed at `23564067774ba9ec314fbdace3733f34d096e142`; the SPEC-003 contribution and private-attachment implementation is committed at `e50feabc698e29c7bac6cf8b33e98b2a0cbfce20`. Both slices are independently verified, applied to the intended Supabase Cloud project, and hosted-validated on Vercel.

D-030 defines the active SPEC-004 contract: governed curriculum mutation and publication are Admin-only, while non-Admin users are current-published readers.

SPEC-003 remains valid implementation history, but its Contributor authoring authority is no longer the target authorization model. SPEC-004 Phase 1 reconciles Admin-only, role-wide Draft management and first publication; Phase 2 adds successor Draft creation and successor publication; Phase 3 adapts the existing authoring application into an Admin-only Spanish content-management surface; Phase 4 authorizes private attachment reads for authoritative current-published Teaching Note and Material revisions. All four phases are independently reviewed, Cloud-applied, and closed under the validation split recorded below. SPEC-005 completes the lifecycle with Admin-only archival, restoration and governance history over the same identity/revision model.

Security- and data-destructive multi-user acceptance may use the repository's controlled local integration environment when production execution would require fictional authoritative curriculum, unsafe account manipulation, or an unsupported cleanup lifecycle. Such evidence must use real local Supabase Auth, PostgreSQL, RLS, Storage, Next.js, and browser boundaries rather than authorization mocks. Cloud closure remains independently responsible for project identity, migration history, resulting schema/RLS/grants/functions/Storage posture, private-bucket configuration, and deployed application version. For SPEC-004, production lacked two safe Admin accounts plus a reader and a disposable Published-data lifecycle, so multi-user acceptance ran locally while Cloud security and production deployment were verified separately.

SPEC-005 closed under the same split, for a reason specific to governance evidence:

```text
Production Cloud  -> migration ledger, RPC signatures, function ownership,
                     SECURITY DEFINER, search_path, grants/revokes, RLS,
                     lifecycle-event table protection, Storage authorization
                     posture, deployed application commit

Local real stack  -> functional Archive / Restore / History / reader isolation /
                     attachment isolation / dependency guards / active-Draft guard /
                     cross-Admin authority / non-Admin denial / live role revocation /
                     archived keyset pagination
```

Functional mutation of production was deliberately avoided. Production holds real
organizations and real Admin identities, and `curriculum_lifecycle_events` is
append-oriented governance evidence with no delete path and an
`ON DELETE RESTRICT` actor reference. Archiving production content to produce test
evidence would therefore write permanent lifecycle events attributed to real people
and permanently pin the acting identity. That is an operational validation
decision; it changes no archival semantics, authorization boundary or product
contract.

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
| Product analytics | PostHog Cloud EU (optional, consent-gated, production only) |

## 3. Architecture shape

```text
Browser
   |
   v
Next.js
   |
   |-- Reader UI
   |-- Admin Content Management UI
   |-- Admin Organizations and Users
   |-- Route Handlers / Server Actions
   |-- Publication orchestration
   |-- Bounded server-only Auth identity provisioning
   |-- Search orchestration
   |-- Analytics boundary (consent-gated, production only)
   |
   v
Supabase
   |-- PostgreSQL
   |-- Auth
   |-- Row Level Security
   `-- Private Storage

Analytics boundary
   |  (only after an affirmative persisted user preference,
   |   and only in the production environment)
   v
PostHog Cloud EU
```

The Auth identity provisioning boundary calls only the Supabase Auth Admin API with its server-only credential. Organization, domain, and membership reads/writes continue through the ordinary publishable-key client and bounded live-Admin database RPCs.

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
- archival/restoration actions;
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
- archive and restore content;
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
- archival/restoration.

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
- **Publication write path:** SPEC-004 implements and tests its trusted Admin publication path rather than assuming ordinary reader RLS is sufficient.
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

SPEC-004 reconciled these verified primitives to:

- Admin-only governed-content mutation;
- Admin-wide active Draft visibility/editing;
- direct `Draft -> Published`;
- successor revision creation;
- current-published replacement;
- published attachment reader access;
- legacy non-Admin write denial.

The Phase 1 and Phase 2 database foundation provides those authorization, publication, dependency-locking, and successor-revision primitives. Phase 3 provides role-aware navigation, an Admin-wide Published/Draft management list, six-type creation/editing, Draft attachment management, direct publication, and successor-version application flows. Phase 4 adds a live-eligibility, `Ready`-state, exact-current-pointer predicate to additive attachment metadata and private Storage read policies, reuses the 60-second signed-download route, and presents attachments on published Teaching Note and Material detail surfaces without exposing object names. Draft/historical attachment isolation and existing Admin mutation behavior remain separate. Controlled local acceptance verified cross-Admin editing, publication, successor promotion, reader isolation, attachment currentness, and live revocation through real integrated boundaries; Cloud inspection independently verified the deployed schema and security posture.

This reconciliation should preserve SPEC-003 provenance, event history, attachment architecture, and dormant historical states where safe.

## 21. SPEC-006 implemented structure

SPEC-006 is an interface-fidelity slice. It adds no table, migration, RPC, RLS policy, Storage rule, role or lifecycle state, and it changes no reader or Admin authorization boundary. What it adds to the documented technical structure is presentational and routing composition:

- **Token layer:** the Explorer type scale, surfaces, radii, shadows, overlay motion and two composition breakpoints (`--breakpoint-compact` 1180px, `--breakpoint-explorer` 900px) are Tailwind theme tokens in `src/app/globals.css`. Overlay entrance animation is suppressed under `prefers-reduced-motion`.
- **Overlay primitives:** `Dialog` and `Drawer` are built on the platform's native modal `<dialog>` (`useModalDialog`), so dialog semantics, focus containment, Escape, the top layer and focus restoration come from the browser. Background scroll lock is a single `html:has(dialog[open])` rule. No focus-trap or overlay dependency was added.
- **Application shell:** one sticky header carries brand, permission-filtered destinations, Library search and session controls. Below the compact breakpoint the destinations and sign-out move into a modal navigation sheet. Navigation items are filtered by live role on the server, so a responsive variant never decides whether an Admin destination exists.
- **Library Explorer:** a persistent filter column beside the results at wide widths and the same controls inside a left drawer below the explorer breakpoint. Every filter control is a link to a Library URL; the query string remains the single applied-filter contract, and no client-held applied state exists beside it.
- **Search suggestions:** `GET /api/library/suggestions` is the authenticated server boundary the popover reads. It re-evaluates eligibility from live persisted state per request, calls the same reader-visible published search RPC the Library page uses, and returns only fields the results list already renders. It exists because the curriculum query modules are `server-only` and must stay unreachable from Client Components.
- **Contextual module detail:** `/app/library/@modal/(.)modules/[id]` intercepts the canonical module route when it is reached from inside the Library and presents it as an overlay; a direct visit or reload renders the standalone page unchanged. Both presentations call the same `getModule` reader boundary and render one shared `ModuleDetailBody`, so the overlay cannot show a module the page would refuse. Dismissal is a history navigation, which is what makes Back, Forward and the close control agree with the address bar.
- **Content-management UX:** grouping, section composition and validation presentation only. The field names, required fields, relationship payloads, server actions and Admin authorization are unchanged. A rejected save returns the submitted values so the form can restore them, because React resets an uncontrolled form action once its action returns.
- **Development surfaces:** none. The Phase 1 primitives harness route was removed once its behaviour was covered on real production surfaces; the production build exposes no development-only route.

## 22. SPEC-007 implemented structure

SPEC-007 is a bounded UX/UI remediation. It adds no table, migration, RPC, RLS policy, Storage rule, role, lifecycle state or search parameter, and changes no reader or Admin authorization boundary.

- **Effective Library view:** `readView` in `src/lib/curriculum/library-state.ts` returns the view actually rendered. `supportsProgram` limits `Programa` to module-capable surfaces (no `entity`, or `entity=module`); on reference surfaces the `Vista` control is not rendered and results render as a grid. The `view` URL value is not rewritten, so a stale `view=programa` on a reference surface is normalized at render time rather than rejected, and applies again on a module surface.
- **Responsive header search:** the placeholder is `Buscar en la base…` at every width. The visual `/` hint and the input padding reserved for it apply from the explorer breakpoint up (CSS only, so server and client markup match); the `/` shortcut and `aria-keyshortcuts` work at every width. Below Tailwind's `sm` breakpoint the header wordmark is visually hidden, remaining the brand link's accessible name, so the phone-width field fits its placeholder.
- **Overlay contract:** unchanged implementation. The native modal `<dialog>` primitives remain the mechanism for topmost-only Escape, inert background, focus containment and restoration, with the existing `html:has(dialog[open])` scroll lock. SPEC-007 adds E2E regression coverage for the filter drawer and compact menu sheet (scrim dismissal, focus return, inertness, scroll lock) alongside the existing module-detail coverage. No overlay manager or nested-modal architecture exists.
- **Application icon:** `src/app/icon.svg` is the supplied D+ asset under the Next.js App Router `icon` file convention, emitted as a static `/icon.svg` with a generated `<link rel="icon">`. It is outside the proxy matcher and served without a session.

## 23. SPEC-009 implemented structure — Cloud-applied and verified

SPEC-009 adds Admin organization/domain/user management without changing the existing two-role eligibility model or one-membership-per-Auth-user schema.

- **Database:** migration `20260917000100_admin_organization_user_management.sql` adds `access_administration_events`, a separate append-only audit table, plus bounded live-Admin RPCs for organization summaries/members, filtered/paginated membership reads, organization/domain changes, membership creation/reassignment, canonical role changes, and membership activation/deactivation. Membership remains keyed by `memberships.user_id`; organization and domain identifiers remain canonical.
- **Database authorization:** every Admin read/mutation RPC reuses `private.require_admin_content_access()`, which derives the caller from live `private.current_access()`. The RPCs are `SECURITY DEFINER` with empty `search_path`, qualified relations, and `EXECUTE` only for `authenticated`; they grant no broad table privileges or global direct membership reads. The access audit has RLS enabled, no ordinary table grants/policies, and update/delete rejection; mutation plus event append is transactional. Curriculum lifecycle history remains unchanged.
- **Auth Admin boundary:** `src/lib/supabase/auth-admin.ts` is marked `server-only`; `SUPABASE_AUTH_ADMIN_SECRET_KEY` must be a modern `sb_secret_*` key. The module obtains the key only after live Admin authorization and exposes only bounded Auth Admin lookup/create functions. It does not expose an Admin Supabase client to the rest of the application and does not call database APIs with the privileged key. The normal SSR/data client stays publishable-key based.
- **Trusted identity state:** Auth users created by this Admin provisioning boundary receive the server-controlled Auth `app_metadata.spec009_trusted_provisioning` marker. Reuse also accepts a confirmed, eligible Auth identity established through verified Google OAuth. User metadata/email equality alone never establishes trust. New Auth identities receive no password; membership creation remains a separate database transaction and a failure leaves no product access. Retry resolves the same marked identity before attempting membership again.
- **Application:** `src/lib/admin-management.ts` holds server-only queries and orchestration; `/app/organizations` and `/app/users` Server Actions delegate to it and recheck Admin access. Organization/domain compatibility is checked before Auth creation and again inside the membership RPC. Conflicting existing memberships are not overwritten; an exact successful retry is idempotent. Errors returned to Admins are Spanish-safe and do not expose raw provider/database details.
- **UX:** the existing role-filtered application navigation adds Organizations and Users only for a live Admin. The existing Base Curricular UI primitives render the list, detail/member, provisioning, search/filter and membership-management surfaces responsively; role labels are `Miembro` and `Administrador`, while persistence remains `Contributor` and `Admin`.

**Verification evidence is local only at this stage.** The local migration ledger reports `20260917000100` applied; focused pgTAP coverage (identity RLS, curriculum lifecycle persistence, and SPEC-009: 165 tests) and database lint pass. The full SQL suite was attempted against a pre-populated local database and fails on an archival fixture's current-revision update and two global-search assertions that see existing local curriculum; the database was not reset. The full unit suite (429 passed, 1 optional local integration skipped), typecheck, lint, and production build pass. The local Auth Admin integration passes identity creation/reuse/untrusted rejection. Targeted SPEC-009 plus shell Playwright passes all 11 Chromium journeys in development and production, including responsive widths. The complete Playwright suite was attempted in both modes: 81/82 pass, with the existing archived-keyset E2E expecting 3 rows but seeing 20 pre-existing archived records; no destructive reset was performed. The SPEC-009 E2E retains synthetic Admin actor identities/organization so append-only actor references remain valid; target users and organizations are cleaned up. A production-build bundle scan with a test sentinel found no privileged Auth key/name in `.next/static`. A read-only `supabase migration list --linked` check confirmed `20260917000100` was not yet applied to linked Supabase Cloud at that point.

**Cloud and hosted verification.** Independent review returned `PUSH READY`, after which `20260917000100` was applied to the intended linked project with `npx supabase db push`; the remote ledger now reports it applied with no drift and no warnings. Cloud metadata verification confirms all twelve `public` SPEC-009 RPCs are owned by `postgres`, `SECURITY DEFINER`, carry `search_path=""`, and grant `EXECUTE` only to `authenticated`, with no `anon`, `PUBLIC`, or `service_role` execution; the three `private` helpers (`normalize_organization_domain`, `is_trusted_auth_identity`, `reject_access_administration_event_mutation`) are restricted to `postgres`. `organizations`, `organization_domains`, `memberships`, and `access_administration_events` all have RLS enabled; `authenticated` holds `SELECT` only on the first three and no grant at all on the audit table. Eighteen direct `authenticated` probes and twelve `anon` probes were all refused with `42501`, including every insert/update/delete against the four tables; `authenticated` reaching the Admin RPCs still fails with `eligible Admin access required`, so authority comes from the live row rather than the grant. Forged elevated JWT claims (`user_role`, `app_metadata.role`, `user_metadata.is_admin`) and an Auth identity with no membership were both denied across all twelve RPCs, confirming the fail-closed `current_access()` relationship. The append-only contract was exercised on a temporary clone carrying the real trigger function: row-level `UPDATE` and `DELETE` both raise `55000` even as table owner, while `INSERT` succeeds and `occurred_at` defaults to `clock_timestamp()`; production audit rows were never touched. Both read surfaces were executed under a real production Admin's claims and resolved correctly with coherent domain and member counts, and `list_admin_memberships` rejects `page_size=101` and `page_offset=-1` with `22023`. `SUPABASE_AUTH_ADMIN_SECRET_KEY` is configured in Vercel Production as a server-only secret holding the project's modern `sb_secret_*` key; a scan of the full 980 KB `.next/static` client bundle and of every chunk served by the deployed Admin routes found no occurrence of the key, its variable name, `service_role`, a JWT prefix, the trusted-provisioning marker, or any Auth Admin symbol, and `src/lib/supabase/auth-admin.ts` has a single server-side importer behind `server-only`. The `main @ 80cd776` tree was deployed to production (`dpl_8sjYtHBNGDRfzEQEWLHmwq7PDLzW`, aliased to `https://dmas-base-curricular.vercel.app`) with the SPEC-009 routes present in the deployed build log and no build or runtime errors. Unauthenticated requests to `/app/organizations` and `/app/users` are refused server-side with `NEXT_REDIRECT;replace;/login;307` and leak no Admin content. Hosted destructive mutations were intentionally not exercised: production holds only three Admin memberships, no Contributor identity, and no designated safe test fixture, so mutation and audit-append behaviour rests on the local real-stack functional evidence above plus the Cloud structural verification recorded here. Production inventory is unchanged after the gate (2 organizations, 2 domains, 3 memberships, 27 curriculum lifecycle events, 19 modules, 5 Auth users, 0 access-administration events).

## 24. SPEC-008 implemented structure

SPEC-008 adds optional, consent-gated product analytics. It changes no authorization, organization-access, publication, archival or governance rule, and introduces no server-side analytics. The authoritative privacy behaviour remains in `docs/PRIVACY_AND_DATA_COLLECTION.md`, `docs/PRIVACY_UX_CONTRACT.md`, `docs/PRIVACY_NOTICE.md` and `docs/TERMS_OF_USE.md`; the canonical event/measurement contract remains in the SPEC. This section records only the verified technical structure.

- **Database:** migration `20261001000100_analytics_preference_persistence.sql` adds `public.analytics_preferences`, keyed by `user_id` referencing `auth.users(id)` with `on delete cascade`, holding `analytics_enabled`, `analytics_decided_at`, `privacy_notice_version`, `consent_version` and `updated_at`. Absence of a row is the `undecided` state, so no backfill is performed; `false` is an explicit rejection and `true` acceptance, and the decision timestamp plus recorded versions keep rejection distinguishable from never having been asked.
- **Database authorization:** RLS is enabled and the single SELECT policy restricts the row to its own live eligible owner via `private.current_access()`. The table carries no write grant and no write policy; mutation goes through `public.set_analytics_preference(boolean, text, text)`, which is `SECURITY DEFINER` with empty `search_path` and **takes no subject argument** — the row written is always `auth.uid()`'s. `service_role` holds `SELECT` only, for privacy-rights fulfilment; it has no write privilege, so no operator or Admin path to another user's analytics decision exists structurally rather than merely being unimplemented. A new helper `private.require_eligible_access()` gates the RPC for any eligible product role, because the SPEC-003-era contribution helper now carries Admin-only authority.
- **Preference boundary:** `src/lib/privacy/analytics-preference.ts` is `server-only` and is the sole read/write path. Both directions fail closed: an unreadable row and a rejected write resolve to analytics OFF rather than inferring consent, and the state reported is always the state the database returned, never the state requested.
- **Analytics boundary:** `src/lib/analytics/boundary.ts` is the one integration point; `posthog-js` is a runtime import there and nowhere else. It is inert until `enable` is called with a pseudonymous identity, which the shell does only after authentication, authorization, organization resolution and an affirmative persisted preference. The SDK is loaded lazily on the first approved event, so enabling emits nothing by itself, no historical activity is reconstructed, and users who never opt in never download it. The provider is selected by capability rather than export position, because under this CJS interop the default export is the module namespace rather than the client.
- **Provider configuration:** every automatic collection behaviour is disabled explicitly rather than inherited — autocapture, pageviews, pageleave, performance, surveys, heatmaps (both the current and deprecated keys), external dependency loading and Session Replay. The options object is typed as the SDK's own `Partial<PostHogConfig>`, so a renamed or removed option fails typecheck instead of silently reverting to a collecting default. `opt_out_capturing_by_default` means capturing requires the explicit post-consent opt-in, and the SDK's documented ordering is honoured: reset, then opt in, then identify. A `sanitize_properties` scrub removes the URL, referrer and title properties the SDK adds itself, which on the Library would otherwise carry the reader's raw query.
- **Environment isolation:** `NEXT_PUBLIC_VERCEL_ENV` is the discriminator, because `NODE_ENV` cannot distinguish Production from a Preview deployment, which is also a production build. Only the literal value `production` qualifies; Preview, Development, an unset value and an unrecognised custom environment are all no-ops, and a test run is forced inert regardless. Only a browser-safe publishable project key (`NEXT_PUBLIC_POSTHOG_KEY`) is read, and `phx_`/`phs_` shapes are rejected; no server-side or privileged PostHog credential exists in the implementation.
- **Identity and logout:** the Supabase Auth UUID is the `distinct_id`, with `user_id`, `organization_id`, `user_role` and `environment` as the only context. The identity type carries canonical identifiers only, so the user's email and the organization name are not reachable from analytics code. Sign-out clears the identity explicitly on submit rather than relying on unmount, and revocation stops collection immediately rather than on the next render.
- **Instrumentation:** exactly the six canonical events. The Library's `library_viewed`, `search_performed` and `filter_applied` derive from server-computed signals; the raw query is reduced in `src/lib/analytics/library-signals.ts` to a salted, truncated, non-reversible token used only for change detection, so search text never crosses into client or analytics code. Duplicate suppression is a pure function (`library-events.ts`) because the Library re-renders on every filter and search navigation. `content_opened` is emitted by the content body itself, so the standalone page and the contextual overlay report one identical event with no click handler. `external_reference_opened` is applied only where governed content publishes an outside reference and omits the destination URL; `content_downloaded` reports `attachment_id` with its parent content and omits the author-supplied filename. Teaching-note sources and attachments are attributed to the publishing module, since `teaching_note` is not a canonical content type.
- **Privacy UX:** the authenticated shell hosts the first privacy choice and the single `Preferencias de datos` dialog, reachable at every width and for every role. `/app/privacidad/aviso` and `/app/privacidad/terminos` render `docs/PRIVACY_NOTICE.md` and `docs/TERMS_OF_USE.md` at request time rather than a forked copy, traced into the bundle through `outputFileTracingIncludes`; unsupported Markdown raises rather than leaking syntax into a legal surface.

**Verification evidence is local only at this stage.** On a reset local database the full pgTAP suite passes (575 tests, including 41 new analytics-preference tests covering RLS, cross-user denial, Admin non-authority, the absent/false/true states, version metadata, validation, revoked eligibility and cascade delete) and `supabase db lint` reports no errors. The hand-maintained `database.types.ts` matches `supabase gen types typescript --local`. The unit suite passes 618 tests across 47 files (1 optional local integration skipped), verified deterministic across repeated runs; typecheck, lint and production build pass. The complete Playwright suite passes 104 Chromium journeys on a reset database, including 12 privacy-UX journeys that read the persisted row back directly, 6 analytics-boundary journeys and 4 event journeys. Browser evidence confirms zero requests to any analytics host and no collector script fetched while undecided, after rejection, and — decisively for environment isolation — with consent granted in this non-production environment; that a blocked provider leaves every core journey and the privacy surfaces working; and that no request leaving the application carries the reader's query. Build inspection confirms the SDK is a separate lazily-loaded chunk and not an eager asset of any route.

**Cloud and hosted verification (analytics disabled).** Migration `20261001000100` is applied to Cloud with the structure above confirmed: RLS on, a single SELECT policy, `authenticated`/`service_role` SELECT only, and the RPC `SECURITY DEFINER` with empty `search_path`, executable by `authenticated` only. Production runs `dbb40c4` without `NEXT_PUBLIC_POSTHOG_KEY`. Hosted browser evidence shows zero analytics-provider requests and no SDK chunk fetched with the preference OFF or ON, across Library, search, filters, content, external references and a published-attachment download. Record: SPEC-008 §42.

**Not yet verified.** No hosted validation of enabled analytics has been performed. Payload shape for the enabled state is proven by unit-level evidence against a production-like environment with a provider double, not by observed production traffic. The **External Pilot Analytics Activation Gate in SPEC-008 §38 remains closed**, including the legal review required by `docs/PRIVACY_AND_DATA_COLLECTION.md`, PostHog project access restriction, and 12-month retention configuration. `NEXT_PUBLIC_POSTHOG_KEY` is intentionally unset, so analytics is inert everywhere until that gate is satisfied.
