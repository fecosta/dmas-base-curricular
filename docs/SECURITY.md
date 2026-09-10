# Base Curricular — Security

**Status:** Product security baseline  
**Last reconciled:** 2026-09-10

## 1. Purpose

Base Curricular contains network knowledge that may include sensitive information about experts, instructors, teaching materials, and organizational activities.

The security model must therefore protect the data itself, not only the interface used to access it.

## 2. Security objectives

The baseline security objectives are:

- keep the platform private and network-only;
- allow access only to approved organizations and authorized users;
- prevent unauthorized data retrieval through APIs or client-side inspection;
- ensure external contributions cannot bypass review;
- preserve an auditable lifecycle for content changes;
- enforce publication and content permissions at the server/data layer;
- preserve the identity and organization of contributors, reviewers, approvers, and publishers.

## 3. Access boundary

The platform is not public-facing.

Only users associated with approved Democracia+ network organizations should be able to access the authenticated product.

The initial access mechanism should use institutional email addresses and an allowlist of approved organization domains.

Example concept:

`user@example-partner.org -> domain approved -> authentication may proceed`

A valid email address alone is insufficient; authorization still depends on the user's organization/account status and role.

## 4. Authentication

**Selected platform: Supabase Auth**

The production system must use real authentication.

The local/offline prototype's session behavior is demonstration-only and must not be treated as a production security control.

Production authentication must provide a trustworthy user identity that can be used for:

- authorization;
- contribution provenance;
- audit events;
- review notifications;
- approval attribution;
- publication attribution.

## 5. Organization allowlist

The platform needs a managed list of participating organizations and their approved institutional domains.

Conceptually:

`Organization -> Approved Email Domain(s)`

Requirements:

- an organization may have one or more approved domains;
- only active/approved organizations may authenticate;
- domain membership must not silently grant Admin privileges;
- changes to allowed organizations/domains should be administrative actions.

The final list of partner domains remains operational configuration and is not defined in this document.

## 6. Authorization roles

The baseline requires at least:

### Contributor

May:

- access published content they are permitted to see;
- create contributions;
- edit their permitted drafts/revisions;
- submit and resubmit content;
- view review feedback for their contributions.

Must not:

- publish externally governed content;
- approve their own contribution through ordinary Contributor permissions;
- bypass server-side review state.

### Admin

May:

- review submitted contributions;
- request changes;
- approve revisions;
- publish approved revisions;
- apply publication permissions;
- access governance/audit information required for administration.

The implementation may introduce additional roles if necessary, but must preserve these authority boundaries.

## 7. Server-side enforcement

Security must not rely on:

- hidden buttons;
- disabled controls;
- client-side route guards alone;
- data embedded in JavaScript but visually concealed.

Every sensitive read or write operation must be authorized at the server/API/data layer.

A user who can inspect network requests or application code must not gain access to records they are not authorized to read.

## 8. Content publication enforcement

Content submitted by users from other organizations cannot become published solely through client-side state changes.

The backend must enforce valid lifecycle transitions.

For example, a Contributor must not be able to directly transition:

`Draft -> Published`

or:

`Changes Requested -> Published`

The allowed publication path requires the appropriate Admin authority.

## 9. Revision isolation

When a new revision of published content is under review:

- the current published revision remains readable to its existing audience;
- the pending revision is readable only by authorized workflow participants;
- ordinary users must not receive the unapproved revision through search, API queries, exports, or direct URLs.

This rule applies even if both revisions belong to the same logical content record.

## 10. Data sensitivity

The original stakeholder discussions identified greater concern around:

- instructor/expert information;
- teaching materials;
- information that could create political or reputational exposure if disclosed.

General curriculum/programmatic information may be less sensitive, but the initial platform as a whole remains network-only.

The model should therefore avoid making differentiated access impossible in the future.

For the initial product, however, all **published** content is visible to all authenticated users from approved network organizations. No organization-specific or content-specific visibility tier is required for the MVP.

## 11. Publication permissions

For the initial product, publication makes approved content available to all authenticated users from approved network organizations.

The MVP does not require:

- organization-specific content visibility;
- user-specific content visibility;
- multiple content sensitivity tiers in the user experience.

The architecture should avoid making future differentiated scopes impossible, but no additional publication-permission taxonomy should be implemented without a later product decision.

## 12. Auditability

Authentication and content actions must produce enough information to support future audits.

Required identity-sensitive events include:

- authentication/login events as required by operational policy;
- creation of content;
- edits/revisions;
- submission;
- requested changes;
- resubmission;
- approval;
- publication.

Audit records should include, as applicable:

- actor/user;
- organization;
- action;
- target content/revision;
- timestamp;
- resulting status.

Administrative and security logs must not depend on user-entered identity text when authenticated identity is available.

## 13. Data integrity

The system must protect the distinction between:

- current published revision;
- pending/unapproved revision;
- historical revisions.

Publishing a new revision must not destroy the prior published history.

Review comments and approval metadata must remain attributable to the appropriate revision.

## 14. Search and export security

Search, filtering, suggestions, and exports are data-access surfaces.

They must apply the same authorization rules as normal record views.

Unauthorized or unpublished content must not leak through:

- search result titles;
- autocomplete/suggestions;
- result counts where sensitive;
- exported files;
- direct-object URLs;
- client-side preload payloads.

## 15. Attachments and links

Materials may include uploaded files and external links.

Uploaded files must inherit or enforce access controls consistent with the content/revision they belong to.

A private database record pointing to a publicly exposed attachment is not considered secure.

**Selected storage provider: Supabase Storage (private).**

The exact signed/authenticated file-access mechanism remains an implementation detail, but files must preserve the authorization rules of their associated content/revision.

## 16. Email notifications

**Selected provider: Resend**

Review emails may contain direct links to content.

Links must still require authentication and authorization.

Email possession must not itself act as authorization to view or approve a contribution.

Avoid placing sensitive content directly in email notifications when a secure in-product link is sufficient.

## 17. Prototype versus production

The latest static prototype uses browser-local state for demonstration features such as login/session, contributions, itinerary persistence, and import/export.

These behaviors are useful product evidence but are not production security controls.

Production implementation must replace local-only trust boundaries with authenticated, server-enforced persistence and authorization.

## 18. Security decisions still required

The following remain intentionally unresolved:

- session duration and reauthentication policy;
- named Admin assignment approvers/operators and ongoing assignment procedure;
- audit log retention;
- login-log retention;
- administrator notification destination/routing;
- account offboarding behavior.

These require future technical/product decisions before the relevant implementation is considered complete.

## 19. SPEC-001 implemented security boundaries

### Identity and eligibility

The application uses Supabase email-code authentication with pre-provisioned confirmed identities. Public signup and anonymous sign-in are disabled. A trusted operator first verifies the institutional identity and provisions it through Supabase administration; the user subsequently proves mailbox possession with a one-time code. The closed-signup Supabase OTP flow requires a confirmed identity at provisioning. The application never auto-provisions membership or Admin authority from an email suffix.

Authentication and product access remain independent. A real Auth identity may outlive eligibility and then reaches only a denial state. `current_access()` requires all of:

1. A Supabase authenticated subject (`auth.uid()`).
2. A confirmed, non-anonymous, non-deleted Auth user with no current ban.
3. An active persisted membership for that subject.
4. An active organization associated with that membership.
5. An exact case-insensitive match of the live Auth email domain to an approved domain of that same organization.
6. A persisted `Contributor` or `Admin` role.

Unknown domains, implicit subdomains, lookalike suffixes, another organization's approved domain, missing/inactive memberships, inactive organizations, unconfirmed identities, and bans fail closed. Role and organization metadata supplied by the browser or held in `user_metadata` are never authoritative. Live rows are consulted rather than JWT email/role claims, so eligibility and role revocation take effect on the next data request.

### Server and database enforcement

`getAccess()` is server-only, validates identity through Supabase Auth `getUser()`, and obtains eligibility using a no-argument RPC. Protected page rendering and the access-context Route Handler each enforce it at their own data access point. No private context is serialized before eligibility succeeds. Authenticated ineligible requests get a protected-page redirect or an API 403; anonymous API requests get 401; eligibility lookup failures return no protected data.

All three identity tables have RLS enabled. `anon` has no table/RPC access. Eligible `authenticated` users can read only their own membership, their organization, and its approved domains. Ineligible users read no rows. Both Contributor and Admin sessions lack insert/update/delete privileges and write policies on these configuration tables. Role assignment, activation, organization association, and allowlist maintenance use trusted operational administration, never request payloads or ordinary product credentials. The specific people authorized to perform provisioning must be designated operationally.

`private.current_access()` is a read-only security-definer function owned by the migration's trusted database role. It intentionally bypasses identity-table RLS for the caller's eligibility join, avoiding recursive policies. It uses `auth.uid()`, accepts no subject/role arguments, has an empty `search_path`, and qualifies every relation. Execute is revoked from PUBLIC/anon and granted only to authenticated users. The `private` schema is not exposed through PostgREST. Public `current_access()` and `is_admin()` wrappers are security-invoker and also restricted to authenticated callers. No content-read visibility tiers are introduced by these identity policies.

### Sessions, secrets, and operational configuration

- The app uses the public Supabase URL and publishable key only. No service-role credential is present in the application. Test fixture administration uses locally obtained privileged keys in Node-only test code and refuses non-local projects.
- Supabase SSR stores/refreshes sessions in cookies through the server client and proxy. Cookies use `SameSite=Lax`, path `/`, and `Secure` in production. They remain JavaScript-readable because the implementation retains Supabase SSR's default `httpOnly: false`; no production browser Supabase client is currently used. Tokens are not accepted as identity based on cookie contents alone. Evaluating HttpOnly cookie hardening is a separate follow-up that requires compatibility validation of the current SSR/session-refresh flow before changing behavior.
- Proxy refresh propagates request/response cookies and non-cacheable headers. Protected data is fetched per request; authenticated responses must not be placed in shared CDN/ISR caches.
- Local Auth uses one-hour access tokens, refresh-token rotation, six-digit email codes with a ten-minute expiry, and a one-minute resend interval. These are initial technical settings; the outstanding session-duration/reauthentication policy above is not closed by local configuration.
- Sign-out revokes the current refresh session and clears its cookies. Supabase access JWTs can remain usable until expiry; sign-out is not an immediate offboarding mechanism for copied bearer tokens. Membership/domain/organization deactivation is enforced against live rows even with an existing token.
- Supabase Auth owns OTP verification/rate limiting and login logs. Server-side requests may share an outbound IP; production rate limits and institutional SMTP delivery need verification on the intended project. OTPs, credentials, and private context must not be added to application logs.
- The app returns Spanish validation and generic authentication errors rather than raw provider errors. Code-request responses avoid disclosing whether an account exists. This does not claim to eliminate account enumeration in Supabase's own externally accessible Auth API.
- Provisioning and Cloud configuration instructions are in the root README. Production domain lists, approved initial Admin identities, SMTP configuration, session/offboarding policy, and operational log retention still require deployment/operator configuration.

### Verification scope

Vitest exercises the server guard, input manipulation, input validation, and configuration checks. Real PostgreSQL/pgTAP tests exercise RLS and grants, including role escalation, organization transfer, cross-user reads, exact domains, stale JWT claims, and revocation. Playwright uses actual local Auth email-code sessions and directly calls Supabase with ordinary credentials, including edited user metadata and disallowed membership writes. Local development and production-build browser journeys are verified. Supabase Cloud, institutional email delivery, Vercel hosting, and long-duration session renewal remain external validation work.

## 20. Source basis

This security baseline was derived from:

- stakeholder meeting notes — 2026-08-06;
- Platforms D+ meeting notes — 2026-08-12;
- first static-prototype UX assessment — August 2026;
- latest static prototype — `Base Curricular - Explorador (offline)(3).html`;
- product and governance decisions confirmed on 2026-09-10.
