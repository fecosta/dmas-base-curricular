# Base Curricular — Product

**Status:** Product baseline confirmed  
**Methodology state:** DECISION READY — PRODUCT BASELINE CONFIRMED  
**Last reconciled:** 2026-09-14

## 1. Purpose

Base Curricular is a private, shared curriculum-content library for organizations in the Democracia+ network.

It exists to make structured curricular knowledge easier to find, understand, reuse, and enrich across the network.

The platform organizes and connects:

- curriculum modules;
- program topics;
- instructors and experts;
- teaching notes and supporting materials;
- reference institutions and centers;
- studies, reports, manuals, courses, databases, presentations, and publications.

The product is not intended to operate as a traditional Learning Management System (LMS). Content is discoverable as a library rather than as a mandatory learning sequence.

## 2. Intended users

The product is intended for members of approved Democracia+ network organizations.

Access is private and network-only. It is not intended for the general public.

Authentication must rely on institutional identity, initially using approved organization email domains.

The MVP authentication experience is **Google OAuth through Supabase Auth (primary)**, with **Email OTP through Supabase Auth (fallback)**, because all participating organizations currently use Google Workspace. See `docs/DECISIONS.md` (D-028).

Authentication remains strictly separate from product eligibility. Successfully authenticating — through Google OAuth or Email OTP — including the creation of a Supabase Auth identity on a user's first Google sign-in, never by itself grants product access. Product access still requires the existing live eligibility chain:

`authenticated identity -> exact approved institutional domain -> explicit active membership -> active organization -> persisted Contributor/Admin role -> access`

Explicit membership, an active organization, an exact approved domain match, and a persisted Contributor/Admin role remain required regardless of which authentication method was used. See `docs/SECURITY.md` and `docs/ARCHITECTURE.md` for the authorization model.

During the initial operational phase, the persisted `Contributor` role means eligible non-Admin product access; governed-content mutation authority is reserved to `Admin`.

## 3. Product structure

The curriculum is initially organized around two axes:

1. **Strategy & Campaign**
2. **Evidence-based Public Policy**

Modules belong to one of these axes and may be associated with themes and supporting knowledge objects.

The product also distinguishes **References**, including institutions and materials/studies, as a complementary exploration surface.

## 4. Core product capabilities

### 4.1 Explore curriculum content

Users can browse modules and reference content, search across the knowledge base, and narrow results through filters such as axis, country, and theme.

The latest static prototype includes two module views:

- **Grid (`Grilla`)**
- **Program (`Programa`)**

These are alternative ways of exploring the same content, not different learning paths.

### 4.2 View module context

A module may aggregate:

- title and description;
- axis and theme;
- program topics;
- learning outcomes;
- instructors or expert profiles;
- teaching notes;
- related institutions;
- related materials and studies.

### 4.3 Govern curriculum content

During the initial operational phase, governed curriculum content is managed exclusively by authorized Admins.

Admins may create and maintain:

- modules;
- program topics;
- instructors;
- teaching notes;
- materials and studies;
- institutions and reference centers.

Any currently eligible Admin may create, access, and edit any active Admin-managed Draft regardless of which Admin originally created it.

The original creator remains preserved as provenance but does not receive exclusive ownership of the Draft.

Authenticated non-Admin users are readers of current published governed content and do not author or submit curriculum content during this phase.

Collaborative partner contribution remains a future capability rather than current product behavior.

### 4.4 Build a personal itinerary

The itinerary is a **personal content selection**, not a learning trail.

Users may add modules to a personal selection and export that selection for their own use.

The itinerary does not imply:

- required order;
- pedagogical progression;
- prerequisites;
- enrollment;
- certification;
- completion tracking.

## 5. Knowledge participation model

The initial operational phase uses a centralized content-management model.

### Admins

Authorized Admins manage the governed knowledge base.

Any active Admin may:

- create governed content;
- access any active Admin Draft;
- edit any active Admin Draft regardless of original creator;
- create new revisions of published content;
- manage permitted content relationships;
- manage permitted private attachments;
- publish valid Drafts.

### Non-Admin users

Eligible non-Admin users consume current published knowledge.

They may browse, search, filter, open, reuse, and select published content through authorized reader features.

They do not currently:

- create contributions;
- edit governed content;
- create successor revisions;
- mutate governed attachments;
- submit content;
- participate in review;
- approve content;
- publish content.

### Future collaborative model

The architecture preserves the possibility that Democracia+ and partner organizations may later contribute knowledge through a governed submission/review process.

That collaborative model is deferred and requires a later explicit product decision before reactivation.

## 6. Knowledge governance

The active new-content workflow is:

`Draft -> Published`

An Admin:

1. creates governed content;
2. edits the Draft;
3. manages permitted relationships and attachments;
4. explicitly publishes the Draft when valid.

There is no review or approval stage between Draft and publication in the initial operational phase.

Publication remains an explicit Admin-only action.

Any currently eligible Admin may continue editing any active Admin Draft. Draft creator identity is provenance, not an exclusive authorization boundary.

### Published content edits

Published content is never modified destructively in place.

Editing published content creates a new revision:

`Published v1 -> Draft v2 -> Published v2`

Any currently eligible Admin may create or continue editing `Draft v2`.

While `v2` remains Draft:

- `v1` remains the current published revision;
- ordinary users continue to see `v1`;
- `v2` remains Admin-only.

When `v2` is published:

- `v2` becomes current;
- `v1` remains preserved as historical content.

### Deferred collaborative governance

The following workflow is not current product behavior:

`Contributor Draft -> Submitted -> Under Review -> Changes Requested -> Resubmitted -> Under Review -> Approved -> Published`

Submission, review comments, requested changes, approval, resubmission, and governance workflow notifications are deferred.

## 7. Provenance and auditability

The platform must preserve trusted lifecycle attribution for governed knowledge.

The system must be able to determine, where applicable:

- who originally created the stable content identity;
- which organization that creator belonged to at creation time;
- who created each revision;
- who performed significant edits or lifecycle actions;
- who published the revision;
- when significant lifecycle actions occurred.

Creation provenance does not imply exclusive ongoing editing authority.

Any currently eligible Admin may manage active Admin Drafts.

Historical provenance from previously implemented contribution behavior must remain preserved and must not be rewritten merely because the active governance model changed.

Identity and organization metadata should come from trusted authenticated state whenever possible rather than user-entered attribution.

## 8. Security posture

The product must assume that unauthorized disclosure of some information may create organizational, reputational, or political risk.

This applies particularly to information about:

- instructors and experts;
- teaching materials;
- unpublished Admin Drafts;
- sensitive organizational knowledge.

Security must therefore be enforced at the application and data-access layers, not only through hidden UI elements.

The initial product remains network-only even when some types of curriculum information are less sensitive than others.

### Published-content visibility

For the initial product, all current published content is visible to all eligible authenticated users from approved network organizations.

The MVP does not introduce organization-specific or content-specific visibility tiers.

The architecture may preserve room for differentiated access in the future, but such tiers are not part of the current product contract.

## 9. Product language

Spanish is the primary language of the platform.

The MVP must be Spanish-first for user-facing experiences, including:

- navigation;
- library exploration;
- Admin content-management surfaces;
- validation and error states;
- personal itinerary;
- user-facing exports.

English is not the default product language and should not be treated as the first implementation with Spanish deferred to a future localization phase.

Technical implementation artifacts may remain in English where appropriate.

## 10. Current UX contract

The following are part of the current product direction:

- private network access;
- library-oriented exploration;
- two curriculum axes;
- modules and references;
- search and filters;
- program terminology instead of `ementa`;
- Admin-managed creation and revision of governed curriculum content;
- personal itinerary as a non-hierarchical selection.

### Not part of the current UX contract

The following should not be treated as current user-facing requirements:

- collaborative contribution authoring by non-Admins;
- submission/review/approval workflow;
- learning trails;
- LMS-style hierarchy;
- module level labels such as `Intermediate` / `Advanced`;
- delivery-format labels such as `Hybrid` / `Online`;
- module-card completeness percentage.

Level and format metadata remain in the content model for potential future use, but do not need to be displayed in the current interface.

The completeness indicator present in earlier/static prototype behavior is **superseded** and is not part of the approved product baseline.

## 11. Administration and content retirement

### Admin-managed content

Governed curriculum content is managed by authorized Admins during the initial operational phase.

Any currently eligible Admin may:

- create governed content;
- access active Admin Drafts;
- edit active Admin Drafts regardless of original creator;
- create successor revisions;
- publish valid revisions.

No second reviewer or second Admin approval is required.

### Published-content removal

Published content is not permanently deleted as part of the normal product workflow.

When content should no longer be available, an Admin archives it.

Archived content:

- no longer appears in normal discovery, search, or browsing;
- remains preserved for governance and audit history;
- may be restored by an Admin.

Archival and restoration are implemented: an Admin may archive published content, which removes it from reader surfaces while preserving its published revision, history and attachments, and may restore it while its published dependencies remain valid. See `docs/GOVERNANCE.md` for the contract.

## 12. Product boundaries

There is currently no approved requirement for Base Curricular to become:

- an LMS;
- an enrollment system;
- a cohort or class management system;
- an assessment platform;
- a certification system;
- a public curriculum website;
- a course marketplace.

These capabilities are outside the current baseline unless explicitly approved later.

## 13. Product principles

### Structured knowledge, not a file dump

The product should make relationships among curriculum concepts explicit.

### Library before course

Content should remain browsable and reusable without imposing a learning sequence.

### Provenance without exclusive ownership

Creation and revision provenance must remain attributable, but an Admin creator does not receive exclusive ongoing editing authority over active Admin Drafts.

### Admin-only mutation in the initial phase

Only currently eligible Admins may create, revise, attach files to, or publish governed curriculum content.

### Published content is stable

Changes to published information happen through revisions, not destructive in-place edits.

### Future collaboration remains possible

The architecture should preserve a future collaborative contribution/review model without exposing it as current behavior.

## 14. Product north star

A member of the Democracia+ network should be able to find a relevant topic, understand how it relates to the curriculum, access related experts and references, and assemble a personal selection of modules, while authorized Admins keep the governed knowledge base current and the platform preserves provenance, permissions, revision stability, and publication history.

## 15. Technical baseline

The initial product implementation uses:

- Next.js + TypeScript;
- Supabase for PostgreSQL, Auth, RLS, and private Storage;
- Resend as an approved email-delivery provider;
- PostgreSQL full-text search and SQL filters;
- Vitest and Playwright for testing;
- Vercel for application hosting.

These technical choices implement the product contracts defined here; they do not redefine them.

A generic headless CMS such as Strapi is not part of the MVP architecture.

## 16. Source basis

This baseline was reconciled from:

- stakeholder meeting notes — 2026-08-06;
- Platforms D+ meeting notes — 2026-08-12;
- first static-prototype UX assessment — August 2026;
- latest static prototype — `Base Curricular - Explorador (offline)(3).html`;
- product decisions confirmed on 2026-09-10;
- authentication-strategy decision (D-028) confirmed on 2026-09-11;
- D-030 Admin-only initial operational content-management decision — 2026-09-14.
