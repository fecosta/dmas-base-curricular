# Architecture — D+ Base Curricular

## 1. Status

**Technical state: INITIAL STACK CONFIRMED**

There is currently no production implementation.

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

Provider-specific login methods may include Google, Microsoft, or email-based authentication as supported by the implementation plan. The authoritative access rule remains the organization's approved-domain/account policy.

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

## 18. Next architecture step

The next step is not another broad architecture exercise.

The confirmed stack should now be translated into the first bounded implementation specification.

Recommended first slice:

**SPEC-001 — Application Foundation & Authentication**

That specification should define observable behavior for:

- project foundation;
- Supabase connection;
- institutional authentication;
- organization/domain eligibility;
- Contributor/Admin roles;
- initial RLS boundaries;
- protected application shell;
- test foundation;
- Vercel deployment baseline.
