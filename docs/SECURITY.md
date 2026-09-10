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
- exact Admin assignment process;
- audit log retention;
- login-log retention;
- administrator notification destination/routing;
- account offboarding behavior.

These require future technical/product decisions before the relevant implementation is considered complete.

## 19. Source basis

This security baseline was derived from:

- stakeholder meeting notes — 2026-08-06;
- Platforms D+ meeting notes — 2026-08-12;
- first static-prototype UX assessment — August 2026;
- latest static prototype — `Base Curricular - Explorador (offline)(3).html`;
- product and governance decisions confirmed on 2026-09-10.
