# Base Curricular — Security

**Status:** Product security baseline  
**Last reconciled:** 2026-09-14

## 1. Purpose

Base Curricular contains private network knowledge that may include information about experts, instructors, teaching materials, institutions, and organizational activities.

The security model must protect the data itself, not only the interface used to access it.

The active security contract must preserve:

- private network-only access;
- trustworthy authentication;
- explicit organization membership;
- role-based authorization;
- Admin-only governed-content mutation and publication;
- current-published reader isolation;
- private attachment access;
- revision integrity;
- provenance;
- auditable lifecycle actions.

Historical capabilities implemented by earlier specifications remain documented where relevant, but they do not override the current authorization model.

---

## 2. Security objectives

The baseline security objectives are:

- keep the platform private and network-only;
- allow product access only to eligible users from approved organizations;
- prevent unauthorized data retrieval through APIs, direct database access surfaces, Storage, or client-side inspection;
- restrict governed curriculum content creation, editing, revision creation, attachment mutation, and publication to eligible Admins;
- provide eligible non-Admin users read-only access to current published governed content;
- prevent unpublished Admin Drafts and historical revisions from leaking through reader surfaces;
- preserve current published content while later Draft revisions are being prepared;
- enforce publication and revision transitions at the server/data layer;
- preserve trusted actor and organization attribution;
- preserve an auditable lifecycle for significant content changes;
- preserve historical provenance and lifecycle evidence from earlier governance phases;
- fail closed when authentication, eligibility, role, ownership, or authorization cannot be established.

---

## 3. Access boundary

The platform is not public-facing.

Only users associated with approved Democracia+ network organizations may access the authenticated product.

Institutional identity alone is insufficient.

The authoritative access chain is:

`authenticated identity -> exact approved institutional domain -> active membership -> active organization -> persisted role -> access`

A successful authentication does not automatically grant product access.

A matching email domain does not automatically create:

- membership;
- organization association;
- Contributor authority;
- Admin authority.

Because Supabase email authentication remains enabled for the OTP fallback, operators must not trust or provision an unexplained pre-existing unconfirmed email/password identity.

Such identities must be replaced through the trusted provisioning flow or claimed through the verified Google OAuth flow before membership is granted.

---

## 4. Authentication

**Selected platform: Supabase Auth**

**Implemented MVP strategy:**

- **Primary:** Google OAuth;
- **Fallback:** Email OTP.

See `docs/DECISIONS.md` D-028 and §§19–20.

Hosted Google provider configuration and a real provider round trip have been validated against the deployed Vercel application and intended Supabase Cloud project.

Production authentication must provide a trustworthy user identity used for:

- authorization;
- membership resolution;
- role resolution;
- content provenance;
- revision provenance;
- lifecycle events;
- publication attribution;
- attachment authorization.

The local/offline prototype's browser-local session behavior is demonstration-only and must never be treated as a production security control.

---

## 5. Organization allowlist

The platform maintains a managed set of participating organizations and their approved institutional domains.

Conceptually:

`Organization -> Approved Email Domain(s)`

Requirements:

- an organization may have one or more approved domains;
- the organization must be active;
- membership must be explicit;
- the authenticated user's live email domain must match an approved domain of that same organization;
- domain membership must not grant Admin authority;
- organization/domain configuration must not be writable by ordinary application users;
- changes to organizations, domains, memberships, and roles are trusted administrative operations.

The final production organization/domain list remains operational configuration rather than product source code.

---

## 6. Authorization roles

The persisted role model currently retains `Contributor` and `Admin`.

Under D-030, these persisted role names do not imply that Contributor authoring remains active product behavior.

### Contributor / non-Admin user

For the initial operational phase, an eligible non-Admin user is a **read-only governed-content consumer**.

May:

- access current published curriculum content;
- browse and search current published content;
- use published-content filters and references;
- access published attachments when authorized;
- use separately authorized personal features such as Personal Itinerary.

Must not:

- create governed curriculum content;
- create governed Drafts;
- edit governed content;
- create later governed revisions;
- mutate revision relationships;
- upload, replace, or delete governed attachments;
- submit or resubmit governed content;
- access Admin Drafts;
- review content;
- request changes;
- approve content;
- publish content;
- mutate current-published pointers;
- invoke legacy SPEC-003 contribution capabilities to bypass the active authority model.

### Admin

An eligible Admin may:

- access current published content;
- access any active Admin Draft;
- create governed curriculum content;
- edit any active Admin Draft regardless of original creator;
- manage permitted Draft relationships;
- manage permitted private attachments;
- create later Draft revisions from published content;
- publish valid Drafts;
- access governance/history information required for administration;
- archive and restore published content where separately implemented.

`created_by` and creation-time organization are provenance, not exclusive authorization boundaries between Admins.

Admin authority must derive from the live persisted role.

The application must not infer Admin authority from:

- email domain;
- Google Workspace membership;
- OAuth metadata;
- JWT user metadata;
- client-provided values;
- route visibility;
- hidden or visible UI controls.

---

## 7. Server and data-layer enforcement

Security must not rely on:

- hidden buttons;
- disabled controls;
- client-side route guards alone;
- navigation visibility;
- data embedded in JavaScript but visually concealed;
- client-provided role or organization identifiers.

Every sensitive read or write operation must be authorized at the appropriate server/API/database/Storage boundary.

A caller who can inspect or reproduce application network requests must not gain additional authority.

The browser must never receive a privileged credential capable of bypassing RLS or product authorization.

Where narrow privileged database functions are required, they must:

- derive the caller from trusted authentication context;
- accept no user-controlled actor identity as authority;
- validate live eligibility and role;
- expose only the minimum required operation;
- use hardened grants and function configuration;
- fail closed.

Admin Draft authorization must derive from the caller's current live Admin role.

An implementation must not require the current Admin to equal the Draft's `created_by` value in order to manage an active Admin Draft.

Role revocation must remove Draft-management authority on the next authoritative request, including for Drafts originally created by that user.

---

## 8. Governed-content mutation enforcement

Under the active governance model, only an eligible Admin may mutate governed curriculum content.

A non-Admin user must not be able to perform governed mutations even if legacy SPEC-003 routes, RPCs, database functions, or components still physically exist.

The authoritative boundary must reject non-Admin attempts to:

- create identities;
- create revisions;
- edit revisions;
- modify relationships;
- reserve/upload/finalize/delete governed attachments;
- change lifecycle status;
- create successor Draft revisions;
- publish;
- change current-published pointers.

SPEC-004 must reconcile previously implemented Contributor mutation permissions with this active contract.

Restricting obsolete authority is preferred over destructively removing historical persistence structures or lifecycle evidence.

---

## 9. Publication enforcement

Publication is an Admin-only action.

The active new-content lifecycle is:

`Draft -> Published`

The active published-content revision lifecycle is:

`Published v1 -> Draft v2 -> Published v2`

Publication must not be implemented as an arbitrary client-controlled status update.

A valid publication operation must, at the authoritative boundary:

1. verify live Admin authority;
2. verify the target revision is an eligible Draft;
3. concurrency-protect the target revision and stable identity;
4. validate required semantic content;
5. validate required relationships;
6. validate attachment readiness;
7. resolve required dependencies against authoritative current-published content;
8. set trusted publication metadata;
9. set the revision to Published;
10. update the stable identity's current-published pointer;
11. persist lifecycle evidence.

Status and current-published-pointer changes must remain transactionally consistent.

The system must not expose an intermediate state where:

- a current pointer references a non-Published revision; or
- a publication operation partially changes reader-visible state.

There must be no generic application-level "force status" capability.

---

## 10. Revision isolation

Published content is immutable.

When a later Draft revision exists:

`Published v1 + Draft v2`

the security boundary must guarantee that:

- v1 remains current and reader-visible;
- v2 remains Admin-only;
- editing v2 does not mutate v1;
- ordinary users cannot retrieve v2;
- search cannot retrieve v2;
- direct URLs cannot expose v2;
- exports cannot expose v2;
- autocomplete/preload payloads cannot expose v2;
- relationships associated only with v2 cannot leak through ordinary reader queries;
- attachments associated only with v2 cannot be accessed by ordinary readers.

When v2 is successfully published, the current pointer moves atomically to v2.

v1 remains preserved as historical content.

Historical revisions are not ordinary reader-visible merely because they once held Published status.

Reader authority follows the identity's authoritative current-published pointer.

---

## 11. Data sensitivity

Stakeholder discussions identified greater sensitivity around:

- instructor/expert information;
- teaching materials;
- organizational information;
- information that could create political or reputational exposure if disclosed.

General curriculum/programmatic information may be less sensitive, but the platform as a whole remains private and network-only.

For the initial product, all **current published content** is visible to eligible authenticated users from approved network organizations.

The MVP does not require:

- organization-specific content visibility;
- user-specific content visibility;
- content-specific sensitivity tiers.

The architecture should avoid making future differentiated access impossible, but such scopes must not be introduced without an explicit product decision.

---

## 12. Publication permissions

For the initial product, successful publication makes the revision available as current published content to eligible authenticated users across approved network organizations.

Publication does not make content public on the Internet.

The MVP does not implement:

- public/anonymous curriculum access;
- organization-specific publication scopes;
- user-specific publication scopes;
- multiple sensitivity tiers;
- approval-derived visibility scopes.

Future differentiated publication authorization requires an explicit product decision.

---

## 13. Auditability

Authentication and governed-content actions must produce enough trusted information to support future audits.

Active identity-sensitive events include, where applicable:

- authentication/login events required by operational policy;
- content creation;
- revision creation;
- Draft edits;
- publication;
- archival/restoration when implemented.

Historical events already created under SPEC-003 remain valid, including submission-related events.

Audit records should include, as applicable:

- actor/user;
- actor organization;
- action;
- stable content identity;
- revision;
- timestamp;
- previous status;
- resulting status.

Actor and organization attribution must derive from trusted authenticated state whenever available.

Administrative and security logs must not use user-entered actor identity as authority.

Historical lifecycle evidence must not be deleted or rewritten merely because the active governance model changed.

---

## 14. Data integrity

The system must preserve the distinction between:

- stable content identity;
- current published revision;
- Admin Draft revision;
- historical revision;
- archived content.

Published revisions must remain immutable.

Creating a new revision must not modify the current published revision.

Publishing a later revision must not destroy the previous revision.

The stable identity must resolve no more than one authoritative current published revision.

The implementation must prevent ambiguous competing active successor Drafts unless a future product decision explicitly allows them.

At most one active Admin Draft successor per stable identity is the expected initial invariant.

Concurrency controls must prevent:

- duplicate ambiguous Draft creation;
- partial publication;
- pointer corruption;
- publication against knowingly stale dependency state.

---

## 15. Search, filtering, export, and reader security

Search, filtering, suggestions, references, exports, and preload operations are data-access surfaces.

They must apply the same authorization rules as normal record views.

Ordinary reader surfaces must resolve only current published content.

Unauthorized, Draft, historical, or archived representations must not leak through:

- library results;
- search result titles;
- search result snippets;
- filters;
- autocomplete/suggestions;
- references;
- result counts where sensitive;
- Grilla;
- Programa;
- detail readers;
- exported files;
- direct-object URLs;
- client-side preload payloads.

A stable identity with Published v1 and Draft v2 must appear to ordinary readers exactly through its authorized current-published representation.

---

## 16. Attachments and links

Materials and Teaching Notes may include uploaded files and external links.

**Selected storage provider: Supabase Storage (private).**

A private database record pointing to a publicly exposed attachment is not considered secure.

Governed attachments must inherit or enforce authorization consistent with their associated revision.

### Admin Draft attachments

Only an eligible Admin may create or mutate governed attachments during the active Admin-only phase.

Where supported, an Admin may:

- reserve/upload;
- finalize;
- read;
- replace;
- delete

attachments associated with an authorized Draft.

### Published attachments

Once associated content becomes current published content:

- eligible readers may access its published attachments;
- access must remain authenticated/authorized;
- bucket privacy remains enforced;
- access must not depend on historical Draft ownership;
- possession of an object path must not grant authority.

### Draft isolation

Attachments belonging only to an Admin Draft must not be available to ordinary users.

Signed URLs, if used, are temporary delivery mechanisms rather than durable authorization credentials.

---

## 17. Email and notification security

**Approved provider:** Resend.

Governance workflow notifications are not required during the active Admin-only operational phase.

Submission, resubmission, change-request, approval, and publication emails are therefore not current security dependencies.

If notification capabilities are introduced or reactivated later:

- email possession must not grant application authority;
- links must require normal authentication and authorization;
- sensitive content should not be embedded in email when a secure application link is sufficient;
- recipient resolution must derive from authoritative application data rather than hardcoded personal addresses.

Resend may continue to support authentication email delivery independently of governance workflow notifications.

---

## 18. Prototype versus production

The static prototype used browser-local state for demonstration features such as:

- login/session;
- contributions;
- itinerary persistence;
- import/export.

These behaviors are product evidence, not production security controls.

Production behavior must use:

- real authentication;
- server-enforced authorization;
- RLS;
- trusted persistence;
- private Storage;
- authenticated lifecycle operations.

No browser-local role, ownership, workflow status, or content state may be treated as authoritative.

---

## 19. Security decisions still required

The following remain intentionally unresolved:

- session duration and reauthentication policy;
- named Admin assignment operators and ongoing assignment procedure;
- audit-log retention;
- login-log retention;
- account offboarding behavior;
- future collaborative-contribution security model if that capability is reactivated;
- future differentiated publication scopes if required.

Administrator workflow-notification routing is no longer a blocker for the active Admin-only governance phase because those notifications are deferred.

These unresolved items must be addressed before any future feature depending on them is considered complete.

---

## 20. SPEC-001 implemented security boundaries

### Identity and eligibility

The application uses Supabase Google OAuth as its primary authentication action and email-code authentication as fallback.

Social Auth identity creation is enabled so a first Google sign-in may create an identity; anonymous sign-in remains disabled.

The application OTP request always sets `shouldCreateUser: false`, so the fallback does not create an unknown identity.

A trusted operator separately verifies institutional identity and provisions membership through trusted administration.

The application never auto-provisions membership or Admin authority from:

- authentication provider;
- email suffix;
- Auth metadata;
- OAuth metadata.

Authentication and product access remain independent.

A real Auth identity may outlive eligibility and then reaches only a denial state.

`current_access()` requires all of:

1. a Supabase authenticated subject (`auth.uid()`);
2. a confirmed, non-anonymous, non-deleted Auth user with no current ban;
3. an active persisted membership for that subject;
4. an active organization associated with that membership;
5. an exact case-insensitive match of the live Auth email domain to an approved domain of that same organization;
6. a persisted `Contributor` or `Admin` role.

Unknown domains, implicit subdomains, lookalike suffixes, another organization's approved domain, missing/inactive memberships, inactive organizations, unconfirmed identities, and bans fail closed.

Role and organization metadata supplied by the browser or held in `user_metadata` are never authoritative.

Live rows are consulted rather than JWT email/role claims, so eligibility and role revocation take effect on the next authoritative data request.

Under D-030, a persisted `Contributor` role establishes eligible non-Admin product access but does not grant governed-content mutation authority.

### Server and database enforcement

`getAccess()` is server-only, validates identity through Supabase Auth `getUser()`, and obtains eligibility using a no-argument RPC.

Protected page rendering and the access-context Route Handler each enforce it at their own data-access point.

No private context is serialized before eligibility succeeds.

Authenticated ineligible requests receive a protected-page redirect or API 403; anonymous API requests receive 401; eligibility lookup failures return no protected data.

All three identity tables have RLS enabled.

`anon` has no table/RPC access.

Eligible authenticated users can read only:

- their own membership;
- their organization;
- its approved domains.

Ineligible users read no rows.

Both Contributor and Admin sessions lack insert/update/delete privileges and write policies on these configuration tables.

Role assignment, activation, organization association, and allowlist maintenance use trusted operational administration rather than request payloads or ordinary product credentials.

`private.current_access()` is a read-only security-definer function owned by the migration's trusted database role.

It intentionally bypasses identity-table RLS for the caller's eligibility join, avoiding recursive policies.

It:

- uses `auth.uid()`;
- accepts no subject/role arguments;
- has an empty `search_path`;
- qualifies every relation.

Execute is revoked from PUBLIC/anon and granted only to authenticated users.

The `private` schema is not exposed through PostgREST.

Public `current_access()` and `is_admin()` wrappers are security-invoker and restricted to authenticated callers.

### Sessions, secrets, and operational configuration

- The app uses the public Supabase URL and publishable key only. No service-role credential is present in the application. Test fixture administration uses locally obtained privileged keys in Node-only test code and refuses non-local projects.
- Supabase SSR stores/refreshes sessions in cookies through the server client and proxy. Cookies use `SameSite=Lax`, path `/`, and `Secure` in production.
- Cookies remain JavaScript-readable because the implementation retains Supabase SSR's default `httpOnly: false`; no production browser Supabase client is currently used. Tokens are not accepted as identity based on cookie contents alone.
- Evaluating HttpOnly cookie hardening remains a separate follow-up requiring compatibility validation of the SSR/session-refresh flow.
- Proxy refresh propagates request/response cookies and non-cacheable headers.
- Protected data is fetched per request; authenticated responses must not be placed in shared CDN/ISR caches.
- Local Auth uses one-hour access tokens, refresh-token rotation, six-digit email codes with a ten-minute expiry, and a one-minute resend interval.
- Sign-out revokes the current refresh session and clears its cookies.
- Supabase access JWTs may remain usable until expiry; sign-out is therefore not an immediate offboarding mechanism for copied bearer tokens.
- Membership/domain/organization deactivation is enforced against live rows even with an existing token.
- Supabase Auth owns OTP verification/rate limiting and login logs.
- OTPs, credentials, and private context must not be added to application logs.
- The app returns Spanish validation and generic authentication errors rather than raw provider errors.
- Code-request responses avoid disclosing whether an account exists. This does not claim to eliminate account enumeration through Supabase's externally accessible Auth API.
- Provisioning and Cloud configuration instructions are maintained in the root README.
- Production domain lists, approved Admin identities, SMTP configuration, session/offboarding policy, and operational log retention remain deployment/operator configuration.
- Google OAuth starts in a Server Action using the cookie-backed Supabase SSR client.
- `APP_URL` must be an exact HTTPS origin; HTTP is accepted only for loopback.
- The OAuth callback is fixed to `/auth/callback`.
- The returned authorization URL is accepted only at the configured Supabase origin and `/auth/v1/authorize` path.
- The OAuth callback exchanges the PKCE authorization code server-side.
- It accepts no `next` or arbitrary redirect destination.
- Success returns to `/app`, where `requireAccess()` enforces live eligibility.
- Failure returns to a generic login error.
- No protected context is read or returned by the callback itself.

### Verification scope

Vitest exercises:

- Google OAuth initiation/callback orchestration;
- fixed redirect behavior;
- server guards;
- input manipulation;
- input validation;
- configuration checks.

Real PostgreSQL/pgTAP tests exercise RLS and grants, including:

- role escalation;
- organization transfer;
- cross-user reads;
- exact domains;
- stale JWT claims;
- revocation.

Playwright uses actual local Auth email-code sessions to verify the provider-independent boundary, including:

- approved-domain identities without membership;
- edited user metadata;
- disallowed membership writes.

A real Google provider round trip was completed as hosted validation against the deployed Vercel application and intended Supabase Cloud project.

It confirmed:

- first-time Google identity creation;
- approved-domain/no-membership denial;
- eligible Admin access with persisted role context;
- live membership revocation without waiting for token refresh;
- hosted sign-out;
- Email OTP delivery through custom SMTP using Resend and verified domain `auth.democraciamas.com`.

A hosted adversarial test also confirmed Supabase transitions a pre-created unconfirmed email/password identity to Google on first legitimate Google sign-in, so the previously hypothesized pre-account-takeover mechanism was not reproduced.

Long-duration session-expiry/renewal behavior, browser coverage beyond Chromium, an OTP pre-registration variant that never completes Google OAuth first, and operational rate-limit monitoring remain external validation work.

---

## 21. Approved authentication strategy — Google OAuth primary, Email OTP fallback

`docs/DECISIONS.md` D-028 approves Google OAuth through Supabase Auth as the primary MVP authentication method, with Email OTP retained as fallback.

This is an authentication-experience decision.

It does not weaken the authorization model.

Explicit requirements are:

- **OAuth identity creation is allowed without product access.** A Google OAuth sign-in may create a Supabase Auth identity, but identity existence is never sufficient for application access.
- **OAuth/JWT metadata is not authorization state.** Google Workspace membership, email suffix, OAuth metadata, profile metadata, and JWT metadata are not authoritative membership, organization, or role state.
- **Exact approved domain remains required.**
- **Explicit active membership remains required.**
- **Active organization remains required.**
- **Persisted role remains authoritative.**
- **Email OTP must not create an authorization bypass.**
- **Existing RLS and `current_access()` authorization remain authoritative for both authentication methods.**

Under D-030, the persisted role additionally determines governed-content authority:

- `Contributor` -> eligible published-content reader;
- `Admin` -> eligible published-content reader plus governed-content administration authority.

Google OAuth and Email OTP must converge on this same authorization model.

---

## 22. SPEC-002 curriculum reader boundary

SPEC-002 leaves `private.current_access()` unchanged and reuses it through `private.is_eligible_curriculum_reader()`.

Every curriculum identity, revision, and relationship table has RLS enabled.

`authenticated` has `SELECT` only through the established reader boundary; `anon` has no table or reader-RPC privilege.

Eligible Contributor and Admin sessions evaluate the same network-wide current-published reader policies.

Identity policies require:

- a non-archived stable identity;
- a current published pointer.

Revision policies require:

- `Published` status;
- that exact revision to be the identity's current pointer.

Relationship policies require both:

- the owning current revision;
- target stable identity

to remain reader-visible.

The public listing, search, module-detail, and reference-detail RPCs are security-invoker and restricted to `authenticated`, so direct PostgREST calls cannot bypass these policies.

Published typed revision rows and their revision-scoped relationships are immutable after initial published-pointer resolution.

A later Draft revision may coexist but receives no ordinary reader visibility.

Search executes under the same invoker/RLS boundary and cannot return Draft, historical, or archived representations.

At the application boundary, each server-only curriculum query calls `requireAccess()` before the RLS-protected RPC.

Protected curriculum routes are dynamically rendered per request, prefetch is disabled on protected navigation, and proxy responses remain `private, no-store`.

No service-role credential is present in application code.

The trusted import script requires an operator credential and exact target confirmation outside the browser.

These controls passed local pgTAP and real Auth/PostgREST browser journeys, independent adversarial review, and verification on Supabase Cloud project `qcxcgwpfgclyebkxawyh`.

Cloud inspection confirmed:

- RLS on all curriculum/relationship tables;
- no unintended FORCE RLS;
- intended SELECT/reader-RPC grants only for authenticated readers;
- hardened trigger-function ACLs;
- preserved `private.current_access()`;
- no ordinary PostgREST exposure of `private`.

Hosted validation confirmed eligible access, authenticated-ineligible denial, and private/no-store protected responses.

The deployed application uses a modern Supabase publishable key and no privileged Vercel credential.

The trusted operator/import path uses the `SUPABASE_SECRET_KEY` convention with an `sb_secret_*` key.

During Cloud validation, an exposed legacy privileged API credential was treated as compromised.

Inventory found no deployed application, Edge Function, webhook, cron, CI, or known external automation dependent on legacy privileged access.

The legacy anon/service-role key family was disabled, both legacy keys subsequently returned HTTP 401, and Google OAuth, Email OTP, `/app`, and `/app/library` remained functional.

JWT signing keys were not rotated.

Only the two approved axes are present as authoritative production curriculum data.

No real module/reference import has occurred, and test fixtures remain local/test-only.

---

## 23. SPEC-003 historical contribution and Storage boundary

SPEC-003 is a completed and verified implementation record.

It introduced:

- owner-only pending visibility;
- Contributor Draft creation/editing;
- `Draft -> Submitted`;
- immutable creation-time organization provenance;
- revision-scoped pending relationships;
- private governed attachments;
- lifecycle-event persistence;
- Submitted immutability;
- published-reader isolation.

At the time SPEC-003 was completed, every pending read/write required a currently eligible authenticated identity.

Ownership followed the authenticated user while the revision preserved the immutable creation-time organization snapshot.

Narrow security-definer RPCs derived provenance and timestamps, locked owned Drafts, permitted only authorized contribution operations, and could not set review/publication states or current-published pointers.

Submitted revisions, relationships, and attachment metadata were immutable.

Lifecycle events had no ordinary write grant and rejected update/delete.

### Historical Storage implementation

The private `governed-attachments` bucket accepts only an opaque reserved object name tied by typed foreign-key metadata to an owned Draft Teaching Note or Material.

Original filenames are display metadata.

The database rejects controls, quotes, backslashes, and path separators before they can reach download disposition.

The bucket has:

- a 3 MiB limit;
- a document MIME allowlist.

The application checks supported file signatures as defense-in-depth, forces database finalization against actual object size/MIME, and blocks submission during incomplete upload/deletion states.

Direct authenticated Storage clients remain constrained by bucket MIME/size metadata rather than content scanning.

Files are forced to download and must not be treated as malware-scanned.

Downloads require a fresh authorization check before a 60-second signed redirect.

Object paths and signed URLs are not durable authority.

The Storage/database consistency model is compensating rather than transactional:

- failed pre-object reservations are cancellable;
- uploaded but unfinalized objects remain `Reserved` and can be finalized or discarded;
- deletion marks metadata `Deleting` before byte removal;
- failed byte removal can restore metadata only while matching bytes still exist;
- successful byte removal followed by metadata-finalization failure leaves `Deleting` state for idempotent retry.

No cleanup worker or privileged browser/server credential was introduced.

These controls passed local and independent adversarial validation.

Migration `20260913000100` is applied to Supabase Cloud project `qcxcgwpfgclyebkxawyh`.

Cloud inspection confirmed the intended:

- RLS;
- grants;
- SECURITY DEFINER posture;
- private bucket;
- Storage policies.

Hosted validation confirmed contribution, attachment, dependency-ordering, cross-user, revocation, Submitted-immutability, and published-isolation boundaries.

### Current authority after D-030

The security properties above remain valid evidence of what SPEC-003 implemented.

They do **not** define the active mutation authority after D-030.

Under the current operational model:

- non-Admin Contributor authoring is inactive;
- non-Admin Draft mutation is inactive;
- non-Admin governed attachment mutation is inactive;
- submission/resubmission is inactive;
- Admin-only governed-content management becomes authoritative.

SPEC-004 must therefore restrict any previously implemented SPEC-003 Contributor mutation capability that would conflict with D-030.

Existing database structures, lifecycle events, provenance, attachments, and historical records must not be destructively removed merely to enforce the new authority boundary.

If real pending Contributor records exist in Supabase Cloud, they must remain protected from ordinary readers and must not be silently published or destroyed.

Their treatment must be preservation-first unless a separate explicit migration/operational decision authorizes otherwise.

---

## 24. SPEC-004 target Admin-management security boundary

SPEC-004 establishes the active governed-content mutation boundary.

Only a caller whose live access resolves to Admin may perform Admin content-management operations.

The implementation must ensure:

### Creation

- only Admin may create governed identities/Drafts;
- actor and organization come from trusted live access;
- non-Admin direct invocation fails.

### Draft editing

- Admin Drafts remain inaccessible to ordinary readers;
- published revisions remain immutable;
- Draft relationships and attachments inherit Admin authorization.

### Later revisions

Creating a later revision from published content must preserve:

`Published v1 -> current`

while creating:

`Draft v2 -> Admin-only`

The operation must not mutate v1 or move the current-published pointer.

At most one active editable Admin successor Draft should exist for a stable identity unless later explicitly changed.

### Publication

Publication must:

- require live Admin authority;
- validate the complete Draft;
- validate required relationships;
- validate attachment readiness;
- validate dependencies against current-published identities;
- concurrency-protect the operation;
- atomically set Published status and current-published pointer;
- persist trusted lifecycle evidence.

### Legacy-path denial

SPEC-004 validation must include adversarial attempts by non-Admin users against legacy SPEC-003 mutation surfaces.

A legacy endpoint or RPC remaining physically deployed must not imply continuing authority.

### Role revocation

Removing Admin authority must remove content-management authority on the next authoritative request according to the existing live-access design.

No cached client role may extend Admin privileges.

The local Phase 3 application now rechecks `requireAccess("Admin")` in management pages and Server Actions, requires live Admin context in Draft attachment mutation handlers, and continues to rely on the bounded database RPC/RLS boundary. Non-Admin navigation exposes no authoring entry point. Published attachment reader authorization remains incomplete and is not claimed by this application phase.

---

## 25. Deferred collaborative-governance security

The previously planned workflow:

`Contributor Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

is not active product behavior.

Therefore the current security baseline does not require:

- cross-user Admin review visibility;
- review-comment authorization;
- reviewer assignment;
- change-request authorization;
- resubmission authorization;
- approval authorization;
- workflow-email recipient resolution.

Technical structures supporting these concepts may remain dormant.

They must not be interpreted as authorization.

Reactivating collaborative governance requires an explicit product decision/specification and a new security review covering at least:

- Contributor mutation authority;
- pending-content ownership;
- cross-user Admin visibility;
- review-comment integrity;
- lifecycle transition authorization;
- approval/publication separation;
- notification routing;
- attachment access across workflow states.

---

## 26. Source basis

This security baseline was derived from:

- stakeholder meeting notes — 2026-08-06;
- Platforms D+ meeting notes — 2026-08-12;
- first static-prototype UX assessment — August 2026;
- latest static prototype — `Base Curricular - Explorador (offline)(3).html`;
- product and governance decisions confirmed on 2026-09-10;
- authentication-strategy decision D-028 confirmed on 2026-09-11;
- verified SPEC-001 authentication and authorization implementation;
- verified SPEC-002 current-published curriculum reader boundary;
- verified SPEC-003 contribution and private Storage implementation;
- D-030 Admin-only initial operational content-management decision — 2026-09-14;
- revised SPEC-004 Admin Content Management & Publication contract.
