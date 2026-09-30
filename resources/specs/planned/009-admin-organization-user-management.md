# SPEC-009 — Admin Organization & User Management

**Status:** PLANNED — DECISION READY  
**Product:** D+ Base Curricular  
**Primary capability:** Administrative management of organizations and users  
**Depends on:** Existing authentication, authorization, organization model, admin access, audit/history contracts  
**Related:** SPEC-008 — Product Analytics & Pilot Observability  
**Does not depend on:** Billing, licensing, SSO, SCIM, organization self-service, multi-organization membership

---

# 1. Purpose

D+ Base Curricular is preparing to open the platform to users from additional organizations.

The current operating model must therefore support a reliable way for authorized administrators to manage:

- organizations;
- users;
- organization membership;
- user roles;
- active/inactive status.

This SPEC introduces an administrative interface for managing those entities without requiring direct database manipulation or ad-hoc operational procedures.

The capability should support the external pilot while preserving the existing authentication, authorization, audit, and data-governance contracts.

---

# 2. Product Objective

The objective is to allow an authorized platform administrator to perform the core lifecycle operations needed to onboard and manage pilot organizations and their users.

The intended administrative model is:

```text
Admin
│
├── Organizations
│   ├── List
│   ├── Create
│   ├── Edit
│   ├── Activate / deactivate
│   └── View members
│
└── Users
    ├── List
    ├── Create / invite
    ├── Edit
    ├── Assign organization
    ├── Assign role
    └── Activate / deactivate
```

The feature should remain intentionally small.

It is not intended to become a general-purpose identity-management platform.

---

# 3. Current State

The platform already has concepts related to:

- authenticated users;
- organizations;
- organization membership;
- roles;
- active/inactive state;
- admin authorization.

Previous administrative work established that users can be associated with organizations and promoted to administrative roles.

However, organization and user lifecycle management is not yet exposed as a complete admin product workflow.

Operational tasks such as onboarding new organizations or correcting user membership may therefore require manual intervention outside the normal application interface.

Before implementation, technical preflight must verify the actual current repository state and authoritative schema.

This SPEC must not assume that remembered or historical database structures remain unchanged.

---

# 4. Problem / Gap

The external pilot introduces recurring operational needs:

- create a new participating organization;
- register its users;
- assign each user to the correct organization;
- define the appropriate role;
- correct user information;
- deactivate users who should no longer access the platform;
- deactivate organizations without destroying historical relationships.

Without an admin interface, these tasks create avoidable operational and security risks:

- direct database changes;
- inconsistent organization membership;
- accidental authorization mistakes;
- unclear onboarding procedures;
- weak auditability;
- dependency on technical staff for routine administration.

The lack of a stable organization/user management workflow also creates ambiguity for SPEC-008, because product analytics intends to use the canonical organization relationship as the main organizational segmentation dimension.

---

# 5. Product Decisions

## D-009-01 — Admin-only capability

Organization and user management is an administrative capability.

Only users authorized as platform administrators may access or perform the operations defined in this SPEC.

Existing authorization remains authoritative.

The feature must not create a parallel or weaker permission mechanism.

---

## D-009-02 — Two admin surfaces

The admin experience will provide two primary management surfaces:

```text
Organizations
Users
```

Both should allow administrators to discover and manage the same underlying canonical entities from different operational perspectives.

---

## D-009-03 — Explicit organization membership

A user's canonical organization relationship must be represented by the application's existing organization/membership model.

Email domain must not replace explicit organization membership.

For example:

```text
user
  ↓
organization_id
  ↓
organization
```

remains authoritative where that matches the current model.

Domain may support identification or onboarding logic but is not, by itself, proof of membership.

---

## D-009-04 — Organization-first pilot model

For the initial external pilot, each managed user belongs to at most one canonical organization unless repository evidence demonstrates that the existing product already supports a different authoritative model.

This SPEC does not introduce multi-organization membership.

If current architecture already supports multiple memberships in a way that cannot safely be simplified, the preflight must return:

**DECISION REQUIRED**

rather than silently redefining membership semantics.

---

## D-009-05 — Roles remain simple

This SPEC does not introduce a new custom permission system.

The initial administrative model should preserve existing roles.

Expected product-level roles are conceptually:

```text
Admin
User
```

but the technical preflight must verify the canonical role names and authorization model.

No new role should be created merely to satisfy this UI.

---

## D-009-06 — Deactivation over deletion

The normal removal operation for users and organizations is **deactivation**, not destructive deletion.

Users and organizations may have historical relationships with:

- content;
- audit events;
- publication actions;
- future analytics;
- other domain records.

Therefore:

```text
Active
Inactive
```

is the default lifecycle model.

Hard deletion is not required by this SPEC.

---

## D-009-07 — No admin-created passwords

Administrators must not create or manage passwords on behalf of users.

The admin flow should create the necessary application identity/membership state and then rely on the existing authentication mechanism.

The exact invitation or first-login mechanics must follow the current authentication architecture.

---

## D-009-08 — Analytics readiness

Organization identity and membership created through this feature must be suitable for later use by SPEC-008.

The application's canonical organization identifier should remain stable enough to support analytics segmentation.

Analytics requirements must not redefine the domain model.

---

# 6. Scope

## 6.1 Organizations

Administrators must be able to:

- view organizations;
- search organizations;
- create an organization;
- open an organization detail/edit view;
- edit supported organization metadata;
- activate an organization;
- deactivate an organization;
- view users associated with an organization.

Candidate organization fields:

```text
name
domain
status
```

The technical preflight must validate the actual schema and determine whether any additional required fields exist.

---

## 6.2 Users

Administrators must be able to:

- view users;
- search users;
- filter users;
- create or invite a user;
- edit supported user/profile information;
- assign a user to an organization;
- change a user's role within the existing role model;
- activate a user;
- deactivate a user.

Candidate user fields:

```text
name
email
organization
role
status
```

The implementation must use the application's actual canonical identity/profile fields.

---

## 6.3 Organization members

An organization detail surface should show its associated users.

At minimum:

```text
Name
Email
Role
Status
```

where those fields are available and safe to display to administrators.

The organization surface does not need to become a separate membership-management system if the existing user-management workflow can safely handle membership changes.

---

# 7. Admin Navigation

The expected information architecture is:

```text
Admin
│
├── Content / existing admin capabilities
│
├── Organizations
│
└── Users
```

Organization and User management should integrate with the current Admin visual/navigation system rather than creating a separate application shell.

Exact placement may be adjusted during implementation to preserve current navigation conventions.

---

# 8. Organization List

The organization list should allow administrators to quickly understand the current pilot population.

A conceptual view:

```text
Organization        Domain                 Users     Status
VélezReyes+         velezreyesmas.com        8      Active
Democracia+         democraciamas.com        5      Active
Foundation XYZ      foundationxyz.org        3      Active
```

Exact visual presentation is implementation freedom.

Useful fields include:

- organization name;
- domain, where applicable;
- number of associated users;
- active/inactive status.

The user count should be derived from canonical membership data rather than maintained independently.

---

# 9. Organization Creation

Creating an organization should require only information needed by the current product.

Minimum expected input:

```text
Name
Domain
```

plus active status where appropriate.

The implementation must validate:

- required fields;
- duplicate or conflicting organization records;
- domain normalization where domain is used;
- current database constraints.

A domain should normally be normalized before persistence, for example:

```text
Example.org
example.org
```

must not accidentally become distinct domains where the current domain model expects uniqueness.

Exact normalization rules belong to technical implementation if not already defined.

---

# 10. Organization Editing

Administrators may update supported metadata such as:

- name;
- domain;
- status.

Changing an organization's metadata must not change its canonical identifier.

Historical references must continue pointing to the same organization.

---

# 11. Organization Deactivation

Deactivation should:

- prevent the organization from being treated as active according to current platform rules;
- preserve its record;
- preserve historical relationships;
- preserve membership/history needed for audit and analytics continuity.

The preflight must determine whether deactivating an organization should automatically affect the ability of its users to access the platform.

This behavior must not be guessed.

If existing authorization contracts do not answer this question, mark it:

**DECISION REQUIRED**

before implementation.

---

# 12. User List

The user-management surface should support:

- search by available administrative identity information;
- filter by organization;
- filter by role;
- filter by active/inactive status.

Conceptually:

```text
[Search users...]

Organization ▾
Role ▾
Status ▾
```

The UI should remain usable as the pilot grows beyond the first few organizations.

---

# 13. User Creation / Invitation

The administrator should be able to provide the minimum identity information required by the existing authentication model.

Expected inputs may include:

```text
Name
Email
Organization
Role
```

The technical preflight must verify whether the current authentication/profile architecture requires first name/last name separately or another canonical representation.

The admin must not set a password.

After the admin operation, the user's first authentication should follow the platform's existing login/onboarding mechanism.

---

# 14. Existing User Handling

Attempting to create a user whose authentication identity already exists must not silently duplicate the person.

The implementation must determine whether the correct behavior is:

- associate the existing user with an organization;
- complete an existing profile;
- report that the user already exists;
- or another behavior established by current architecture.

The result must be explicit to the administrator.

Duplicate authentication identities are not acceptable.

---

# 15. User Editing

Administrators may update supported administrative properties including:

- profile name fields;
- organization assignment;
- role;
- active/inactive status.

Email changes must follow the security and authentication constraints of the current identity provider.

The admin UI must not directly mutate authentication-sensitive identity fields if doing so would bypass required verification.

Technical preflight must determine the correct supported behavior for email changes.

---

# 16. Organization Reassignment

Where allowed by the canonical membership model, an administrator may move a user from one organization to another.

The operation must:

- update the canonical membership safely;
- preserve the user's identity;
- preserve relevant historical records;
- avoid creating simultaneous memberships if the product remains single-organization;
- respect authorization and audit requirements.

Existing historical events should not be rewritten merely because current organization membership changes.

---

# 17. Role Changes

Administrators may change a user's role within the established role system.

The implementation must protect against authorization errors such as:

- unauthorized users promoting themselves;
- non-admin users invoking admin mutations directly;
- client-side-only authorization;
- invalid role values.

Role enforcement must remain server/database authoritative according to existing architecture.

---

# 18. User Deactivation

User deactivation is the standard mechanism for removing access.

Deactivation should preserve:

- user identity;
- organization relationship where appropriate;
- audit history;
- authored/published content relationships;
- other historical references.

The exact authorization effect must follow existing application rules.

The implementation must not depend solely on hiding the user in the UI.

---

# 19. Hard Delete

Hard deletion of organizations or users is outside the normal admin workflow defined by this SPEC.

The UI should not expose destructive deletion unless technical preflight identifies an already-established and safe domain contract requiring it.

Future deletion requirements related to privacy/legal erasure should be handled separately because they have different semantics from routine administration.

---

# 20. Domain Semantics

Organization domain is useful metadata but must not be treated as the sole membership rule.

Valid cases may include:

- consultants using personal email;
- invited external collaborators;
- organizations sharing infrastructure;
- users whose email domain differs from their organization.

Therefore:

```text
email domain ≠ canonical organization membership
```

unless a separate explicit rule establishes otherwise.

---

# 21. Status Semantics

Organizations and users should expose understandable administrative status.

Conceptually:

```text
Active
Inactive
```

If the existing data model includes additional lifecycle states such as:

```text
Invited
Pending
Suspended
```

the preflight must determine whether those states are canonical product states or authentication-provider implementation details.

Do not expose infrastructure states as product concepts without justification.

---

# 22. Security Requirements

All organization and user mutations must be enforced through trusted authorization boundaries.

At minimum:

- only admins may access management operations;
- direct API/database calls must enforce the same rule;
- role values must be validated;
- organization identifiers must be validated;
- users must not self-promote;
- users must not assign themselves to arbitrary organizations;
- inactive users must not bypass access rules;
- client-side hiding is not sufficient authorization.

Existing RLS, RPC, server-action, API, or other security conventions should be reused where appropriate.

---

# 23. Auditability

Administrative mutations are security- and governance-relevant.

Where the existing audit/history model supports these entity types, actions should be auditable.

Relevant actions include:

```text
organization_created
organization_updated
organization_deactivated
organization_activated

user_created_or_invited
user_updated
user_organization_changed
user_role_changed
user_deactivated
user_activated
```

This list describes semantic actions, not mandatory event names.

The preflight must determine how these actions fit the existing audit architecture.

Do not create a second audit system solely for this SPEC.

---

# 24. Relationship to SPEC-008

SPEC-009 should be implemented and stabilized before production analytics for the external pilot is enabled.

SPEC-008 should rely on the canonical organization/user relationships established by the application.

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

Analytics must use canonical organization identifiers rather than reconstructing organizations from email domains.

---

# 25. Out of Scope

This SPEC does not introduce:

- multiple organization memberships per user;
- organization hierarchy;
- departments or teams;
- custom roles;
- custom permission builder;
- bulk user import;
- CSV upload;
- organization self-service;
- organization-admin role;
- organization-admin user management;
- automatic domain-based enrollment;
- SSO;
- SAML;
- SCIM;
- billing;
- subscriptions;
- license seats;
- organization quotas;
- user invitation campaigns;
- automated onboarding sequences;
- password administration;
- destructive user deletion;
- destructive organization deletion;
- analytics instrumentation.

These may be evaluated separately if pilot evidence creates a need.

---

# 26. Expected Behavior

Once implemented:

1. an authorized admin can view organizations;
2. an admin can create an organization;
3. an admin can edit supported organization information;
4. an admin can activate/deactivate an organization;
5. an admin can view the users associated with an organization;
6. an admin can view and search users;
7. an admin can filter users by relevant administrative dimensions;
8. an admin can create/invite a user without managing passwords;
9. an admin can assign the user to the correct organization;
10. an admin can assign an existing valid role;
11. an admin can edit supported user information;
12. an admin can activate/deactivate a user;
13. unauthorized users cannot perform those actions through UI or direct application interfaces;
14. historical entity relationships survive deactivation;
15. organization identity remains suitable for later analytics segmentation.

---

# 27. Acceptance Criteria

## AC-01 — Admin organizations surface

Authorized admins can access an Organizations management surface.

## AC-02 — Organization list

The surface shows canonical organization records and their current active/inactive status.

## AC-03 — Organization creation

An authorized admin can create a valid organization using the canonical data model.

## AC-04 — Organization editing

An authorized admin can update supported organization metadata without replacing the canonical organization identity.

## AC-05 — Organization deactivation

An organization can be deactivated and later reactivated without deleting its historical record.

## AC-06 — Organization membership visibility

An admin can view users associated with an organization.

## AC-07 — Admin users surface

Authorized admins can access a global Users management surface.

## AC-08 — User discovery

Admins can search users and filter them by relevant available dimensions including organization, role, and status where supported.

## AC-09 — User creation/invitation

An admin can establish a new user through the current identity model without setting a password.

## AC-10 — Duplicate protection

Attempting to create an identity that already exists produces a safe, deterministic result rather than creating a duplicate identity.

## AC-11 — Organization assignment

A managed user can be associated with the intended canonical organization according to the approved membership model.

## AC-12 — Role management

Admins can assign only valid existing roles.

## AC-13 — User deactivation

A user can be deactivated/reactivated without destructive deletion.

## AC-14 — Server-side authorization

All mutations enforce admin authorization outside the client UI.

## AC-15 — Self-escalation protection

A non-admin cannot promote themselves or another user through unauthorized direct calls.

## AC-16 — Historical preservation

Deactivation and reassignment do not destroy historical records that are expected to remain durable.

## AC-17 — Audit coherence

Administrative actions integrate with the existing audit/history contract where applicable, without creating a duplicate audit system.

## AC-18 — Analytics readiness

The canonical organization relationship can later be consumed by SPEC-008 without deriving membership from email domain.

## AC-19 — Existing product behavior preserved

Normal Library/content workflows remain unchanged for users outside the new admin-management surfaces.

## AC-20 — Tests

Automated tests cover security-sensitive management behavior and pass before completion.

---

# 28. Testing Requirements

Testing should cover at minimum:

### Organization lifecycle

- create valid organization;
- reject invalid organization data;
- edit organization;
- deactivate organization;
- reactivate organization;
- preserve canonical ID.

### User lifecycle

- create/invite user;
- handle duplicate identity;
- assign organization;
- change organization where supported;
- assign role;
- deactivate user;
- reactivate user.

### Authorization

- admin may perform mutations;
- non-admin may not;
- unauthenticated users may not;
- direct backend calls remain protected;
- invalid role assignments fail;
- invalid organization assignments fail.

### Data integrity

- deactivation does not cascade-delete historical records unexpectedly;
- organization counts derive from canonical membership;
- membership remains internally consistent.

### Regression

Existing authentication, admin content management, Library navigation, and authorization tests must continue to pass.

---

# 29. UX Requirements

The feature should use the current Base Curricular design system and established Admin patterns.

Key UX principles:

- clear separation between Organizations and Users;
- easy search;
- useful filtering;
- status visible without requiring detail navigation;
- destructive-looking actions avoided for routine deactivation;
- clear confirmation for security-sensitive role or status changes;
- responsive enough for normal administrative use;
- understandable Spanish labels consistent with the rest of the product.

The implementation should not introduce a parallel visual language for admin management.

---

# 30. Impact Surface

Expected impact may include:

- Admin navigation;
- user/profile model;
- organization model;
- membership model;
- authentication integration;
- authorization;
- RLS/RPC/server operations;
- audit history;
- admin UI;
- tests;
- security documentation;
- architecture documentation;
- product documentation.

Potentially relevant files/docs include:

```text
docs/ARCHITECTURE.md
docs/SECURITY.md
docs/DECISIONS.md
docs/PRODUCT_DEFINITION.md
resources/specs/README.md
```

The technical preflight must identify the actual authoritative locations.

---

# 31. Implementation Freedom

The implementation agent may determine:

- page versus modal patterns;
- exact route structure;
- table/card layout;
- server action/API/RPC implementation;
- query strategy;
- pagination implementation;
- search mechanics;
- validation library;
- exact organization-member presentation;
- confirmation-dialog implementation;
- technical audit integration;
- technical invitation flow consistent with current auth.

The implementation agent may not silently change:

- admin-only authority;
- canonical organization semantics;
- role semantics;
- single-organization pilot assumption;
- deactivation-over-deletion decision;
- prohibition on admin-managed passwords;
- domain not being authoritative membership;
- existing authorization/security contracts.

If repository evidence conflicts with one of these product decisions in a material way, return:

**BLOCKED / DECISION REQUIRED**

before implementation.

---

# 32. Pre-Implementation Technical Preflight

Before moving SPEC-009 to:

**ACTIVE — IMPLEMENTATION READY**

perform a repository-grounded technical preflight.

At minimum verify:

## Identity

- current auth provider;
- canonical user identifier;
- profile model;
- email normalization;
- first-login/onboarding flow;
- existing invitation behavior;
- whether admin-created auth identities are supported.

## Organizations

- canonical organization table/model;
- domain semantics;
- active/inactive fields;
- uniqueness rules;
- foreign-key relationships.

## Membership

- whether membership is represented directly on the user/profile or through a join table;
- whether multiple memberships are currently possible;
- how current organization is resolved;
- whether membership changes affect existing authorization.

## Roles

- canonical role values;
- where roles are stored;
- how admin status is evaluated;
- whether role assignment has existing RPC/API support.

## Security

- RLS policies;
- privileged operations;
- service-role usage;
- server-side authorization;
- current admin-management patterns.

## Audit

- current audit/history tables or lifecycle events;
- whether organization/user changes already have an established audit pathway.

## UX

- existing Admin routes;
- existing tables/forms/modals;
- admin visual system;
- responsive conventions;
- Spanish terminology.

## Data safety

Evaluate the consequences of:

- organization deactivation;
- user deactivation;
- organization reassignment;
- role changes;
- attempted duplicate users;
- email changes.

Do not implement until these behaviors are understood.

---

# 33. Required Decisions During Preflight

If repository evidence does not already establish these behaviors, the preflight must explicitly surface them rather than guess.

## Q-009-01 — Organization deactivation

Does deactivating an organization automatically block all members from accessing the platform?

## Q-009-02 — Email editing

Can admins edit a user's login email, or must email changes use the authentication provider's verification flow?

## Q-009-03 — Existing identity onboarding

If an authentication identity already exists but has no organization membership, should the admin operation attach that identity rather than create a new one?

## Q-009-04 — Audit coverage

Which organization/user administrative mutations must be represented in the existing audit history?

These questions are implementation blockers only if the current architecture does not already provide authoritative answers.

---

# 34. Activation Gate

SPEC-009 may move to:

**ACTIVE — IMPLEMENTATION READY**

when:

1. current identity and organization models are verified;
2. canonical membership semantics are verified;
3. admin authorization mechanics are verified;
4. user creation/invitation behavior is defined;
5. organization/user deactivation behavior is defined;
6. email-update behavior is defined;
7. audit integration is understood;
8. no unresolved data-integrity or authorization issue remains;
9. acceptance criteria can be implemented without inventing new product behavior.

If material uncertainty remains:

**BLOCKED / DECISION REQUIRED**

---

# 35. Knowledge Updates Required

After implementation, reconcile durable project knowledge.

At minimum review:

- architecture;
- security;
- authorization documentation;
- organization/user model documentation;
- admin UX documentation;
- decisions;
- specification index;
- operational onboarding documentation.

Documentation must distinguish:

- current behavior;
- historical decisions;
- future identity-management possibilities.

Do not duplicate identity/organization rules across multiple competing sources of truth.

---

# 36. Completion Evidence

SPEC-009 is not complete merely because Admin pages exist.

Closure requires evidence that:

- organization CRUD-equivalent lifecycle works using deactivation rather than routine deletion;
- user management works;
- canonical membership is preserved;
- role changes are safely authorized;
- non-admin access is denied;
- duplicate identity behavior is deterministic;
- deactivated records preserve expected history;
- audit behavior is coherent;
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
- multiple organization membership;
- departments/teams;
- bulk imports;
- SCIM provisioning;
- SAML/enterprise SSO;
- automatic enrollment by domain;
- seat/license management;
- subscription/billing relationships;
- organization usage limits;
- custom roles and permission matrices;
- legal/privacy deletion workflows;
- self-service organization onboarding.

These should be driven by evidence from actual pilot operations rather than introduced preemptively.
