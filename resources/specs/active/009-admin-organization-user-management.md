# SPEC-009 — Admin Organization & User Management

**Status:** ACTIVE — IMPLEMENTATION READY
**Product:** D+ Base Curricular  
**Primary capability:** Administrative management of organizations and users  
**Depends on:** Existing authentication, authorization, organization model, admin access, audit/history contracts  
**Related:** SPEC-008 — Product Analytics & Pilot Observability  
**Does not depend on:** Billing, licensing, SSO, SCIM, organization self-service, multi-organization membership

---

# 1. Purpose

D+ Base Curricular is preparing to open the platform to users from additional organizations.

The product therefore needs a reliable way for authorized administrators to manage:

- organizations;
- approved organization domains;
- users;
- organization membership;
- user roles;
- active/inactive status.

This SPEC introduces an administrative interface for managing those entities without requiring direct database manipulation or ad-hoc operational procedures.

The capability supports the external pilot while preserving the existing authentication, authorization, audit, and data-governance contracts.

---

# 2. Product Objective

The objective is to allow an authorized platform administrator to perform the core lifecycle operations required to onboard and manage pilot organizations and their users.

The intended administrative model is:

```text
Admin
│
├── Organizations
│   ├── List
│   ├── Create
│   ├── Edit
│   ├── Manage approved domains
│   ├── Activate / deactivate
│   └── View members
│
└── Users
    ├── List
    ├── Create / provision
    ├── Assign organization
    ├── Assign role
    └── Activate / deactivate
```

The feature should remain intentionally small.

It is not intended to become a general-purpose identity-management platform.

---

# 3. Verified Current State

The repository-grounded preflight confirmed the following canonical model.

## Organizations

```text
organizations
  id
  name
  is_active
```

## Approved domains

```text
organization_domains
  domain
  organization_id
```

An organization may have multiple approved domains.

## Memberships

```text
memberships
  user_id          PRIMARY KEY
  organization_id
  role
  is_active
```

Because `user_id` is the primary key, one Auth user currently has at most one canonical organization membership.

## Roles

The persisted product roles are:

```text
Contributor
Admin
```

Under the current D-030 operating model, `Contributor` is the non-Admin governed-content reader.

The current UI represents these roles as:

```text
Contributor → Miembro
Admin       → Administrador
```

## Authentication

Supabase Auth owns the canonical authentication identity and login email.

The application currently does not expose general organization/user lifecycle management through the Admin UI.

Provisioning therefore requires operational intervention outside the normal product workflow.

The current security contract also distinguishes trusted/verified Auth identities from unexplained or unconfirmed pre-existing identities.

An existing Auth identity must not automatically receive membership merely because its email matches the requested user.

---

# 4. Problem / Gap

The external pilot introduces recurring operational needs:

- create a participating organization;
- configure one or more approved domains;
- register or provision its users;
- assign each user to the correct organization;
- define the appropriate role;
- correct membership configuration;
- deactivate users who should no longer access the platform;
- deactivate organizations without destroying historical relationships.

Without an Admin interface, these tasks create avoidable operational and security risks:

- direct database changes;
- inconsistent organization membership;
- accidental authorization mistakes;
- unclear onboarding procedures;
- weak auditability;
- dependency on technical staff for routine administration.

The lack of a stable organization/user management workflow also creates ambiguity for SPEC-008 because product analytics intends to use the canonical organization relationship as the primary organizational segmentation dimension.

---

# 5. Product Decisions

## D-009-01 — Admin-only capability

Organization and user management is an administrative capability.

Only users authorized as platform Admins may access or perform the operations defined in this SPEC.

Existing authorization remains authoritative.

The feature must not create a parallel or weaker permission mechanism.

---

## D-009-02 — Two Admin surfaces

The Admin experience will provide two primary management surfaces:

```text
Organizations
Users
```

Both operate on the same canonical identity, organization, and membership model.

---

## D-009-03 — Explicit organization membership

A user's canonical organization relationship is represented by the existing membership model.

Email domain does not create membership.

Conceptually:

```text
Auth user
    ↓
membership
    ↓
organization
```

Explicit membership remains authoritative.

---

## D-009-04 — Single-organization membership

The current schema already enforces one membership per user because:

```text
memberships.user_id
```

is the primary key.

SPEC-009 preserves this contract.

It does not introduce multi-organization membership.

---

## D-009-05 — Existing roles remain authoritative

The canonical persisted roles remain:

```text
Contributor
Admin
```

The UI may use user-facing Spanish labels:

```text
Contributor → Miembro
Admin       → Administrador
```

SPEC-009 must not introduce a new persisted `User` role or a new permission system.

---

## D-009-06 — Deactivation over deletion

The normal removal operation for users and organizations is deactivation, not destructive deletion.

The lifecycle remains conceptually:

```text
Active
Inactive
```

Historical relationships must remain intact.

Hard deletion is not part of the normal Admin workflow.

---

## D-009-07 — No Admin-created passwords

Administrators must not create or manage passwords on behalf of users.

User authentication continues through the existing Supabase Auth mechanisms.

---

## D-009-08 — Analytics readiness

Organization identity and membership created through this feature must be suitable for later use by SPEC-008.

The canonical organization identifier remains stable and may later be used for analytics segmentation.

Analytics must not redefine the organization model.

---

## D-009-09 — Multiple approved domains

The existing organization-domain model remains authoritative:

```text
Organization
 ├── approved domain A
 ├── approved domain B
 └── approved domain C
```

Domains are represented by `organization_domains`.

The Admin experience must therefore support multiple approved domains rather than a single `organization.domain` property.

---

## D-009-10 — Canonical user status

Administrative user status is represented by:

```text
memberships.is_active
```

SPEC-009 does not introduce a separate user-status column.

An inactive membership prevents the user from satisfying the normal access contract while preserving the Auth identity and historical membership.

---

## D-009-11 — Organization deactivation blocks access

Current authorization requires both:

```text
membership.is_active
AND
organization.is_active
```

Therefore:

```text
organization.is_active = false
```

makes all memberships belonging to that organization ineligible on the next authoritative access check.

Organization deactivation must not rewrite each member's `membership.is_active` value.

When an organization is reactivated, only memberships that remain individually active become eligible again.

---

## D-009-12 — Login email is read-only

Supabase Auth owns the canonical login email.

Admins may use email for:

- identifying users;
- searching users;
- duplicate detection;
- membership administration.

SPEC-009 does not allow Admins to edit login email.

Email-change workflows requiring Auth-provider verification are outside this SPEC.

---

## D-009-13 — No profile/name model introduced

The current product does not require a separate user profile/name model for this capability.

The initial Admin user-management surface therefore operates on:

```text
Email
Organization
Role
Status
```

SPEC-009 must not introduce a profile table merely to display or edit a user's name.

---

## D-009-14 — Existing Auth identities require trusted reuse

User provisioning must not create duplicate authentication identities.

If an Auth identity already exists for the normalized email, the workflow must determine whether that identity is eligible for trusted reuse.

A confirmed identity created through an established trusted provisioning path, or an identity established or claimed through verified Google OAuth, may be reused.

An unexplained, unconfirmed, or otherwise untrusted pre-existing identity must not receive membership or role authority directly.

Such an identity must first be remediated through the established trusted provisioning process or claimed through verified Google OAuth.

Conceptually:

```text
Existing Auth identity
        ↓
Is identity trusted / verified?
        │
        ├── Yes
        │     ↓
        │   reuse identity
        │     ↓
        │   create/reconcile membership
        │
        └── No
              ↓
          do not grant membership
              ↓
          trusted remediation
          or verified Google OAuth
```

An Auth identity without an eligible membership remains unable to access the product.

---

## D-009-15 — Trusted boundary for domain mutations

Ordinary authenticated sessions, including Admin sessions, must not receive generic direct write privileges on:

```text
organizations
organization_domains
memberships
```

Organization, domain, membership, role, and status mutations must pass through narrowly scoped Admin-authorized operations that re-check live Admin authority at a trusted server/database boundary.

Hardened database RPCs consistent with existing project conventions are the preferred pattern.

Client-side authorization is not sufficient.

---

## D-009-16 — Server-only privileged Auth administration

SPEC-009 may introduce a privileged Supabase server credential only where required for Supabase Auth administrative operations that cannot be performed with normal user credentials.

The privileged credential must:

- exist only in server-side environment configuration;
- never use a `NEXT_PUBLIC_*` variable;
- never be serialized to the browser;
- never be exposed to client components;
- never become a generic authorization bypass;
- only be invoked after live Admin authorization has been established;
- remain bounded to the minimum Auth administration operations required by SPEC-009.

Organization/domain/membership authorization continues through explicit Admin-authorized domain operations rather than a generic privileged database client.

The existing browser/application Supabase client remains publishable-key based.

---

## D-009-17 — Domain-compatible membership

Explicit membership remains authoritative, but the existing authorization model also requires the Auth email domain to be approved for the assigned organization.

Therefore membership eligibility requires:

```text
explicit membership
+
active membership
+
approved Auth email domain
+
active organization
```

Creation and organization reassignment must validate that the user's current Auth email domain is approved for the target organization.

An assignment that would immediately produce an ineligible membership must be rejected with a clear Admin-facing explanation.

SPEC-009 does not weaken the existing domain-eligibility requirement.

---

## D-009-18 — Dedicated access-administration audit

`curriculum_lifecycle_events` remains the audit/history contract for governed curriculum content.

It must not be overloaded with identity-administration semantics.

SPEC-009 introduces a bounded append-only access-administration audit for security-relevant changes involving:

- organizations;
- approved domains;
- memberships;
- roles;
- activation/deactivation;
- organization reassignment.

The audit must preserve enough information to identify:

```text
actor
action
target
timestamp
relevant before/after state
```

without unnecessarily duplicating PII.

This is a separate audit domain, not a replacement for curriculum lifecycle history.

---

# 6. Organizations Scope

Admins must be able to:

- view organizations;
- search organizations;
- create an organization;
- open an organization detail/edit view;
- edit the organization name;
- view approved domains;
- add approved domains;
- remove approved domains;
- activate an organization;
- deactivate an organization;
- view users associated with an organization.

Canonical organization-management fields are:

```text
Name
Approved domains[]
Status
```

where status maps to:

```text
organizations.is_active
```

---

# 7. Users Scope

Admins must be able to:

- view users;
- search users;
- filter users;
- create/provision a user;
- assign the user to an organization;
- reassign the organization when valid;
- change role;
- activate membership;
- deactivate membership.

Canonical user-management fields are:

```text
Email          read-only
Organization
Role
Status
```

where status maps to:

```text
memberships.is_active
```

---

# 8. Organization Members

An organization detail surface should show its associated users.

At minimum:

```text
Email
Role
Status
```

The user count must be derived from canonical membership data rather than stored independently.

---

# 9. Admin Navigation

The expected information architecture is:

```text
Admin
│
├── Existing content-management capabilities
│
├── Organizations
│
└── Users
```

Organization and User management should integrate with the existing Admin visual/navigation system.

SPEC-009 must not introduce a separate Admin application shell.

---

# 10. Organization List

The organization list should allow administrators to understand the current pilot population.

Conceptually:

```text
Organization        Domains    Users    Status
VélezReyes+            1         8      Active
Democracia+            2         5      Active
Foundation XYZ         1         3      Active
```

Exact presentation is implementation freedom.

Useful information includes:

- organization name;
- approved-domain count or bounded domain summary;
- associated-user count;
- active/inactive status.

---

# 11. Organization Creation

Creating an organization should require:

```text
Name
At least one approved domain
```

plus active status where appropriate.

The implementation must validate:

- required fields;
- duplicate/conflicting organizations where applicable;
- domain normalization;
- global domain uniqueness;
- existing database constraints.

For example:

```text
Example.org
example.org
```

must not become distinct approved domains.

---

# 12. Organization Editing

Admins may update:

- organization name;
- approved-domain set;
- organization status.

Changing organization metadata must not change its canonical identifier.

Historical references continue pointing to the same organization.

---

# 13. Approved Domain Management

Admins may add and remove approved domains.

Domain changes are security-relevant because they affect eligibility.

The interface must make this consequence clear.

Removing a domain may cause users whose Auth email belongs to that domain to become ineligible on their next authoritative access check.

Domain management must preserve normalization and uniqueness constraints.

---

# 14. Organization Deactivation

Deactivation:

```text
organization.is_active = false
```

must:

- make all organization memberships ineligible;
- preserve the organization record;
- preserve individual membership status;
- preserve historical relationships;
- preserve audit and future analytics continuity.

Reactivation must not automatically activate memberships that are individually inactive.

---

# 15. User List

The user-management surface should support:

- search by email;
- filter by organization;
- filter by role;
- filter by active/inactive membership status.

Conceptually:

```text
[Search users...]

Organization ▾
Role ▾
Status ▾
```

The interface should remain usable as the pilot grows beyond the initial organizations.

---

# 16. User Creation / Provisioning

The minimum Admin input is:

```text
Email
Organization
Role
```

No password is collected.

No profile/name field is required.

Before provisioning membership, the workflow must validate:

1. normalized email;
2. selected organization exists;
3. organization is in an appropriate state for provisioning;
4. email domain is an approved domain of the selected organization;
5. requested role is valid;
6. whether an Auth identity already exists;
7. if an identity exists, whether it is eligible for trusted reuse.

The workflow may then create a new trusted Auth identity or reuse an existing trusted/verified identity and establish the explicit membership.

An unexplained or untrusted pre-existing identity must not receive membership merely because the normalized email matches.

---

# 17. Existing User Handling

If the normalized email already belongs to an Auth identity, the workflow must first classify whether that identity is safe to reuse under the existing security contract.

Conceptually:

```text
Existing Auth identity
        ↓
trusted / verified?
        │
        ├── Yes
        │     ↓
        │   Do not duplicate
        │     ↓
        │   Create/reconcile membership
        │
        └── No
              ↓
          Do not grant membership
              ↓
          Require trusted remediation
          or verified Google OAuth
```

A confirmed identity established through an approved provisioning path or verified Google OAuth may be reused.

An unexplained, unconfirmed, or otherwise untrusted identity must not be automatically confirmed, promoted, or assigned membership by this workflow.

The result must be explicit to the administrator.

If a trusted identity already has a membership, the operation must not silently overwrite conflicting organization, role, or status state.

Any requested change must follow the explicit management/reassignment flow.

The exact technical mechanism used to locate an existing Auth identity by normalized email is implementation freedom, provided that it is:

- server-side only;
- deterministic;
- bounded to the required identity lookup;
- minimally exposing;
- unable to provide unrestricted `auth.users` access to ordinary clients.

---

# 18. Partial Provisioning Failure

User provisioning spans:

```text
Supabase Auth
+
application membership
```

These operations may not share one database transaction.

The workflow must therefore fail closed.

For example:

```text
Auth identity created       ✓
Membership creation         ✗
```

must result in:

```text
Auth identity exists
but
no eligible product access
```

The Admin receives a recoverable error.

The implementation must never compensate for partial failure by granting access based only on email/domain.

A later retry must be able to safely resolve the existing identity, verify that it is trusted for reuse, and complete the membership without creating a duplicate identity.

---

# 19. User Editing

Admins may change:

```text
Organization
Role
Status
```

The login email remains visible but read-only.

No profile/name editing is introduced.

---

# 20. Organization Reassignment

An Admin may move a user from one organization to another.

Because the current model supports one membership per user, reassignment updates the canonical membership rather than creating simultaneous memberships.

The operation must:

- preserve the Auth identity;
- preserve historical records;
- validate the target organization;
- validate the current Auth email domain against the target organization's approved domains;
- reject incompatible assignments;
- update the canonical membership safely;
- create audit evidence.

Historical events must not be rewritten merely because current membership changes.

---

# 21. Role Changes

Admins may assign only the canonical roles:

```text
Contributor
Admin
```

The UI may display:

```text
Miembro
Administrador
```

Role enforcement must remain authoritative outside the browser.

The implementation must prevent:

- unauthorized promotion;
- non-Admin mutation;
- client-only authorization;
- invalid role values;
- privilege escalation through direct backend calls.

---

# 22. User Deactivation

User deactivation maps to:

```text
memberships.is_active = false
```

It preserves:

- Auth identity;
- organization relationship;
- historical records;
- authored/published content relationships;
- audit history;
- future analytics continuity.

Deactivation must affect authorization through the existing eligibility contract.

It must not rely merely on hiding the user in the Admin UI.

---

# 23. Hard Delete

Hard deletion of organizations, memberships, or Auth identities is outside the normal Admin workflow.

The UI must not expose routine destructive deletion.

Future privacy/legal erasure requirements require a separate contract because they have different semantics from administrative deactivation.

---

# 24. Domain Semantics

Email domain alone never establishes access.

The current authorization relationship is:

```text
Auth identity
      ↓
explicit membership
      +
active membership
      +
approved current Auth email domain
      +
active organization
      ↓
eligible organization access
```

An organization may have multiple approved domains.

Exceptions for personal or otherwise unapproved domains are outside SPEC-009 because they would require changing the existing authorization contract.

---

# 25. Security Architecture

All management operations must be enforced through trusted authorization boundaries.

At minimum:

- only live Admins may access management operations;
- backend operations must re-check Admin authority;
- organization identifiers must be validated;
- role values must be validated;
- domains must be normalized and validated;
- users cannot self-promote;
- users cannot self-assign organizations;
- inactive memberships cannot bypass access controls;
- inactive organizations cannot bypass access controls;
- untrusted Auth identities cannot receive membership directly;
- client-side hiding is not authorization.

Organization/domain/membership operations should follow existing hardened RPC/server patterns.

---

# 26. Privileged Auth Boundary

Supabase Auth administration is the exceptional privileged operation in this SPEC.

Conceptually:

```text
Browser
   ↓
authenticated request
   ↓
trusted server boundary
   ↓
live Admin authorization
   ↓
bounded Auth Admin operation
```

The privileged credential must never be used directly by browser code.

The privileged Auth client must not become a generic service-role data-access layer for the product.

The existing publishable-key application client remains unchanged for ordinary application access.

A separate server-only client may be introduced for the minimum Auth Admin operations required by this SPEC.

---

# 27. Admin Global Reads

Current user-facing RLS does not imply that Admins should receive unrestricted direct table access to all users/memberships.

Global Admin views should use narrowly scoped trusted queries/RPCs returning only information required by this feature.

For example:

```text
user_id
email
organization_id
organization_name
role
is_active
```

where required.

The implementation must not expose unrestricted `auth.users` access to ordinary authenticated clients.

Identity lookup required for provisioning must remain server-side and bounded to the minimum required operation.

---

# 28. Access-Administration Audit

Security-relevant Admin mutations must produce append-only audit evidence.

Candidate semantic actions include:

```text
organization_created
organization_updated
organization_activated
organization_deactivated

organization_domain_added
organization_domain_removed

membership_created
membership_organization_changed
membership_role_changed
membership_activated
membership_deactivated
```

Exact persisted enum/string design is implementation freedom provided the semantics remain stable.

The audit should capture:

```text
id
occurred_at

actor_user_id
actor_organization_id

action

target_user_id?
target_organization_id?

previous_state?
resulting_state?
```

Exact schema is implementation freedom.

Audit storage must be protected from ordinary client modification/deletion.

Where the domain mutation and audit append both occur entirely within PostgreSQL, they should be committed atomically.

`curriculum_lifecycle_events` remains unchanged.

---

# 29. Relationship to SPEC-008

SPEC-009 should be implemented and stabilized before production analytics for the external pilot is enabled.

The intended dependency is:

```text
SPEC-009
Admin organization/user management
        ↓
Pilot organizations/users configured
        ↓
SPEC-008
Product analytics instrumentation
        ↓
External pilot measurement
```

SPEC-008 must use canonical organization identifiers rather than reconstructing organizations from email domains.

---

# 30. Out of Scope

SPEC-009 does not introduce:

- multiple organization memberships per user;
- organization hierarchy;
- departments or teams;
- custom roles;
- custom permission builder;
- profile/name management;
- Admin login-email editing;
- bulk user import;
- CSV upload;
- organization self-service;
- organization-admin role;
- organization-admin user management;
- automatic domain-based membership creation;
- SSO;
- SAML;
- SCIM;
- billing;
- subscriptions;
- license seats;
- organization quotas;
- invitation campaigns;
- automated onboarding sequences;
- password administration;
- destructive user deletion;
- destructive organization deletion;
- privacy/legal erasure workflows;
- analytics instrumentation.

These may be evaluated separately if pilot evidence creates a need.

---

# 31. Expected Behavior

Once implemented:

1. an authorized Admin can view organizations;
2. an Admin can create an organization;
3. an Admin can edit organization name and approved domains;
4. an Admin can manage multiple approved domains;
5. an Admin can activate/deactivate an organization;
6. organization deactivation immediately affects eligibility without rewriting individual membership status;
7. an Admin can view users associated with an organization;
8. an Admin can view and search users globally;
9. an Admin can filter users by organization, role, and status;
10. an Admin can provision a user without managing passwords;
11. trusted/verified existing Auth identities are reused rather than duplicated;
12. unexplained or untrusted pre-existing Auth identities cannot receive membership directly;
13. an Admin can assign a user to a domain-compatible organization;
14. an Admin can assign `Contributor` or `Admin`;
15. an Admin can activate/deactivate membership;
16. login email remains read-only;
17. unauthorized users cannot perform management operations through UI or direct application interfaces;
18. historical relationships survive deactivation and reassignment;
19. security-relevant Admin mutations produce append-only audit evidence;
20. organization identity remains suitable for SPEC-008 analytics segmentation.

---

# 32. Acceptance Criteria

## AC-01 — Admin Organizations surface

Authorized Admins can access an Organizations management surface.

## AC-02 — Organization list

The surface shows canonical organizations and their active/inactive status.

## AC-03 — Organization creation

An authorized Admin can create a valid organization using the canonical model.

## AC-04 — Organization editing

An Admin can update supported organization metadata without replacing the canonical organization ID.

## AC-05 — Multiple approved domains

An Admin can view, add, and remove multiple approved domains while normalization and uniqueness constraints remain enforced.

## AC-06 — Organization deactivation

An organization can be deactivated and later reactivated without deleting its historical record.

## AC-07 — Organization deactivation authorization effect

Deactivating an organization denies product eligibility to its members on the next authoritative access check without rewriting individual membership status.

Reactivation does not reactivate memberships that are individually inactive.

## AC-08 — Organization membership visibility

An Admin can view users associated with an organization.

## AC-09 — Admin Users surface

Authorized Admins can access a global Users management surface.

## AC-10 — User discovery

Admins can search by email and filter users by organization, canonical role, and membership status.

## AC-11 — User provisioning

An Admin can establish a user through the existing identity model without setting or managing a password.

## AC-12 — Duplicate and untrusted identity protection

The workflow does not intentionally create a duplicate Auth identity for the same normalized email.

Trusted/verified existing identities may be reused.

Unexplained, unconfirmed, or otherwise untrusted pre-existing identities cannot receive membership or role authority until the established trusted remediation or verified Google OAuth path makes them safe to reuse.

## AC-13 — Organization assignment

A managed user can be associated with the intended canonical organization.

## AC-14 — Domain-compatible assignment

Provisioning and reassignment reject a target organization when the user's current Auth email domain is not an approved domain of that organization.

## AC-15 — Role management

Admins can assign only:

```text
Contributor
Admin
```

## AC-16 — User deactivation

A membership can be deactivated/reactivated without destructive deletion.

## AC-17 — Email remains read-only

The Admin UI and ordinary Admin-authorized domain operations provide no login-email mutation path.

## AC-18 — Server-side authorization

All mutations enforce live Admin authorization outside the client UI.

## AC-19 — Self-escalation protection

A non-Admin cannot promote themselves or another user through unauthorized direct calls.

## AC-20 — Historical preservation

Deactivation and reassignment do not destroy historical records expected to remain durable.

## AC-21 — Access-administration audit

Security-relevant organization, domain, membership, role, reassignment, and status mutations append durable access-administration audit evidence.

Curriculum lifecycle history remains unchanged.

## AC-22 — Privileged Auth boundary

Any privileged Supabase Auth administration credential is:

- server-only;
- unavailable to browser code;
- invoked only after live Admin authorization;
- bounded to required Auth operations;
- not used as a generic product-authorization bypass.

## AC-23 — Minimal Admin identity exposure

Global Admin user queries expose only identity/membership information required by this feature.

Ordinary authenticated clients do not gain unrestricted reads of `auth.users` or global membership rows.

## AC-24 — Partial provisioning fails closed

If Auth identity creation succeeds but membership creation fails, the identity does not gain product access.

A retry can safely resolve the existing identity, validate whether it is trusted for reuse, and complete provisioning without creating a duplicate.

## AC-25 — Analytics readiness

The canonical organization relationship can later be consumed by SPEC-008 without deriving membership from email domain.

## AC-26 — Existing product behavior preserved

Normal Library/content workflows remain unchanged outside the new Admin-management surfaces.

## AC-27 — Tests

Automated tests cover security-sensitive management behavior and pass before completion.

---

# 33. Testing Requirements

## Organization lifecycle

Test:

- create valid organization;
- reject invalid organization data;
- edit organization;
- add approved domain;
- remove approved domain;
- normalize domains;
- reject duplicate domains;
- deactivate organization;
- reactivate organization;
- preserve canonical ID.

## User lifecycle

Test:

- provision new trusted Auth identity + membership;
- reuse existing trusted/verified Auth identity;
- reject direct membership for untrusted existing Auth identity;
- reject duplicate/conflicting identity state;
- assign organization;
- reject domain-incompatible organization;
- reassign organization;
- assign `Contributor`;
- assign `Admin`;
- deactivate membership;
- reactivate membership;
- preserve read-only login email.

## Authorization

Test:

- Admin may perform allowed mutations;
- Contributor may not;
- unauthenticated users may not;
- direct backend calls remain protected;
- invalid role assignment fails;
- invalid organization assignment fails;
- self-promotion fails;
- client-side manipulation cannot bypass authorization;
- untrusted existing identities cannot gain membership through provisioning shortcuts.

## Organization eligibility

Test:

```text
active membership + active organization
→ eligible
```

```text
active membership + inactive organization
→ denied
```

```text
inactive membership + active organization
→ denied
```

```text
membership + unapproved current email domain
→ denied
```

```text
Auth identity without membership
→ denied
```

## Data integrity

Test:

- deactivation does not cascade-delete historical records;
- organization counts derive from membership;
- membership remains internally consistent;
- organization deactivation does not mutate membership status;
- multiple approved domains remain normalized and unique;
- reassignment does not create a second membership;
- trusted existing Auth identities are reused safely.

## Privileged Auth boundary

Verify:

- privileged Auth administration executes server-side only;
- unauthenticated requests cannot invoke it effectively;
- non-Admin requests cannot invoke it effectively;
- secret credentials are absent from browser bundles;
- secret credentials are absent from serialized payloads;
- secret credentials do not use public environment variables;
- privileged credentials are not used for generic organization/membership authorization.

## Partial failure

Test the equivalent of:

```text
Auth identity creation succeeds
membership creation fails
```

and verify:

- product access remains denied;
- retry can resolve and safely reuse the identity when trusted;
- no duplicate identity is created;
- failure does not silently grant membership or role.

## Existing identity trust

Test:

```text
trusted confirmed identity
→ may be reused
```

```text
verified Google OAuth identity
→ may be reused
```

```text
unexplained/unconfirmed identity
→ no direct membership
```

and verify that remediation requirements remain consistent with the existing security contract.

## Audit

Verify:

- relevant mutations append access-administration events;
- actor is captured;
- action is captured;
- target is captured;
- timestamp is captured;
- bounded before/after state is preserved where relevant;
- ordinary clients cannot rewrite/delete audit history;
- curriculum lifecycle history is unaffected.

## Regression

Existing:

- authentication;
- authorization;
- Admin content management;
- Library navigation;
- curriculum lifecycle;
- archival/history

tests must continue to pass.

---

# 34. UX Requirements

The feature should use the current Base Curricular design system and existing Admin patterns.

Key UX principles:

- clear separation between Organizations and Users;
- easy search;
- useful filtering;
- status visible without requiring unnecessary detail navigation;
- approved domains clearly visible on organization detail;
- security-sensitive domain removal clearly communicated;
- untrusted existing-identity conflicts clearly explained to the Admin;
- destructive-looking actions avoided for routine deactivation;
- confirmation for role, reassignment, domain-removal, and status changes where appropriate;
- responsive behavior consistent with the existing product;
- Spanish labels consistent with the rest of the application.

Suggested role labels:

```text
Contributor → Miembro
Admin       → Administrador
```

The implementation must not introduce a parallel Admin visual language.

---

# 35. Impact Surface

Expected impact includes:

- Admin navigation;
- Supabase Auth integration;
- organization model operations;
- organization-domain operations;
- membership operations;
- authorization;
- RLS/RPC/server operations;
- privileged server-only Auth boundary;
- access-administration audit;
- Admin UI;
- tests;
- environment configuration;
- security documentation;
- architecture documentation;
- product documentation.

Potentially affected durable knowledge includes:

```text
README.md
docs/ARCHITECTURE.md
docs/SECURITY.md
docs/DECISIONS.md
docs/PRODUCT_DEFINITION.md
resources/specs/README.md
```

The existing documentation statement that the application requires no privileged server credential must be reconciled if implementation introduces the bounded Auth Admin credential defined by this SPEC.

The existing operator `SUPABASE_SECRET_KEY` convention may be reused or adapted if technically appropriate, but the application runtime boundary must remain explicit and server-only.

---

# 36. Implementation Freedom

The implementation agent may determine:

- page versus modal patterns;
- exact route structure;
- table/card layout;
- exact RPC boundaries;
- exact Server Action/route-handler organization;
- query strategy;
- pagination;
- search mechanics;
- server-side mechanism for bounded Auth identity lookup;
- validation library;
- organization-member presentation;
- confirmation-dialog implementation;
- exact schema of the bounded access-administration audit;
- exact server-only Supabase Auth Admin client structure;
- recoverable partial-failure mechanics;
- technical provisioning details consistent with this SPEC.

The implementation agent may not silently change:

- Admin-only authority;
- single-organization membership;
- canonical `Contributor | Admin` roles;
- approved-domain eligibility;
- multiple-domain organization semantics;
- deactivation-over-deletion;
- `membership.is_active` as user administrative status;
- login email being read-only;
- prohibition on Admin-managed passwords;
- explicit membership being required;
- trusted/verified identity requirement for reuse;
- server-only bounded privileged Auth administration;
- append-only access-administration audit;
- existing authorization/security contracts.

A material conflict requires:

**BLOCKED / DECISION REQUIRED**

before implementation continues.

---

# 37. Preflight Decisions Resolved

The repository-grounded preflight resolved the previous open questions.

## Q-009-01 — Organization deactivation

**RESOLVED**

Existing eligibility requires `organizations.is_active`.

Deactivation therefore blocks organization members without rewriting individual membership status.

---

## Q-009-02 — Email editing

**RESOLVED**

Admin login-email editing is outside SPEC-009.

Email is visible but read-only.

---

## Q-009-03 — Existing identity onboarding

**RESOLVED — RECONCILED WITH SECURITY CONTRACT**

Existing Auth identities are not reused solely because the normalized email matches.

A trusted/verified identity may be reused.

An unexplained, unconfirmed, or otherwise untrusted pre-existing identity must not receive membership or role authority directly.

It must first pass the established trusted remediation path or be established/claimed through verified Google OAuth.

The workflow must never intentionally create a duplicate Auth identity for the same normalized email.

---

## Q-009-04 — Audit coverage

**RESOLVED**

Security-relevant organization, approved-domain, membership, role, status, and reassignment changes are recorded in the bounded append-only access-administration audit.

`curriculum_lifecycle_events` remains curriculum-only.

---

## D-009-A — Auth administration boundary

**RESOLVED**

A server-only privileged Supabase credential may be introduced only for the minimum Auth Admin operations required by SPEC-009 and only after live Admin authorization.

It must not become a generic authorization bypass.

The normal application Supabase client remains publishable-key based.

---

## D-009-B — Access administration audit

**RESOLVED**

SPEC-009 introduces a dedicated append-only access-administration audit rather than overloading curriculum lifecycle history.

---

## D-009-C — Existing identity trust boundary

**RESOLVED DURING FINAL PREFLIGHT**

The repository security contract is authoritative for pre-existing Auth identities.

Email equality alone is insufficient evidence that an identity is safe to receive membership.

Provisioning must preserve the established distinction between trusted/verified identities and unexplained or unconfirmed identities.

No new product decision is required.

---

# 38. Final Pre-Implementation Gate

The final repository-grounded technical preflight verified:

1. the canonical organization/membership schema remains compatible;
2. canonical roles remain `Contributor | Admin`;
3. multiple approved-domain semantics remain compatible;
4. existing live authorization supports organization and membership deactivation;
5. existing hardened `SECURITY DEFINER` RPC patterns can support Admin management operations;
6. a bounded server-only Supabase Auth Admin client is technically compatible with the current Next.js/Supabase architecture;
7. the privileged credential can remain isolated from client bundles;
8. access-administration audit persistence can be introduced separately from curriculum history;
9. partial provisioning can fail closed because Auth identity alone does not establish product access;
10. bounded server-side Auth identity lookup is technically feasible;
11. the existing security contract defines how trusted versus untrusted pre-existing identities must be handled;
12. no new product behavior needs to be invented for implementation.

The only reconciliation identified by the final preflight was the overly broad existing-identity reuse language.

That conflict is resolved in this revision by D-009-14, AC-12, the Existing User Handling section, and D-009-C.

Before activation, perform a short repository verification that the committed SPEC contains these reconciliations and that no new contradiction was introduced.

If verified, move SPEC-009 to:

**ACTIVE — IMPLEMENTATION READY**

and reconcile the specification indexes/current-delivery documentation.

If a material contradiction appears:

**BLOCKED / DECISION REQUIRED**

---

# 39. Knowledge Updates Required

At activation and after implementation, reconcile durable project knowledge as appropriate.

At minimum review:

- `README.md`;
- specification index;
- architecture;
- security;
- authorization documentation;
- identity/organization model documentation;
- Admin UX documentation;
- decisions;
- environment configuration;
- operational onboarding documentation.

Activation must remove stale statements that no specification is planned or active.

Implementation must reconcile the current statement that no privileged application credential exists if the bounded Auth Admin server credential is introduced.

Documentation must distinguish:

```text
current behavior
historical decisions
planned behavior
future identity-management possibilities
```

Do not create competing sources of truth.

---

# 40. Completion Evidence

SPEC-009 is not complete merely because Admin pages exist.

Closure requires evidence that:

- organization lifecycle management works;
- multiple approved domains work;
- user provisioning works;
- trusted/verified existing identities are reused safely;
- untrusted pre-existing identities cannot receive membership directly;
- duplicate Auth identities are not intentionally created;
- canonical membership is preserved;
- domain compatibility is enforced;
- role changes are safely authorized;
- non-Admin access is denied;
- privileged Auth administration remains server-only;
- partial provisioning failures fail closed;
- login email remains read-only;
- deactivated records preserve expected history;
- organization deactivation behaves according to the eligibility contract;
- access-administration audit works;
- curriculum lifecycle audit remains intact;
- existing application behavior remains intact;
- relevant automated tests pass;
- hosted behavior is validated where required;
- durable project documentation is reconciled.

Only then should SPEC-009 move to:

**COMPLETED / COHERENCE VERIFIED**

---

# Future Vision

The following are deliberately deferred:

- organization administrators;
- organizations managing their own users;
- multiple organization memberships;
- user profile/name management;
- Admin email-change workflow;
- departments/teams;
- bulk imports;
- SCIM provisioning;
- SAML/enterprise SSO;
- automatic membership creation by domain;
- exceptions for users with non-approved email domains;
- seat/license management;
- subscription/billing relationships;
- organization usage limits;
- custom roles and permission matrices;
- legal/privacy deletion workflows;
- self-service organization onboarding.

These capabilities should be driven by evidence from actual pilot operations rather than introduced preemptively.
