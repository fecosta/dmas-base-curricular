# Base Curricular — Product

**Status:** Product baseline confirmed  
**Methodology state:** DECISION READY — PRODUCT BASELINE CONFIRMED  
**Last reconciled:** 2026-09-10

## 1. Purpose

Base Curricular is a private, shared curriculum-content library for organizations in the Democracia+ network.

It exists to make knowledge contributed by Democracia+ and partner organizations easier to find, understand, reuse, and enrich across the network.

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

### 4.3 Contribute knowledge

Authorized users may propose or add:

- instructors;
- teaching notes and supporting materials;
- institutions or reference centers;
- studies, reports, manuals, courses, databases, presentations, and publications;
- new modules when content does not fit the existing structure.

When adding notes or materials to an existing module, users may associate them with an existing program topic or introduce a new topic.

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

## 5. Collaboration model

The knowledge base is fed by both:

- Democracia+;
- participating partner organizations.

Partner organizations may contribute their own experts, materials, links, institutional references, and other relevant knowledge.

Democracia+ may also create, enrich, or suggest content.

## 6. Knowledge governance

Content submitted by users from other organizations must not become published content automatically.

The baseline workflow is:

`Draft -> Submitted -> Under Review -> Changes Requested / Approved -> Published`

When a user submits content:

1. an Admin receives an email notification containing a link to the content;
2. the Admin validates the contribution;
3. the Admin either approves it or requests adjustments;
4. if adjustments are required, review notes are attached to the revision and the contributor is notified by email;
5. the contributor edits and resubmits;
6. the Admin reviews again;
7. when valid, the Admin approves and publishes the content with the appropriate permissions.

### Published content edits

Published content is never modified in place.

Editing published content creates a new revision that must pass through review again:

`Published v1 -> Draft Revision v2 -> Submitted -> Under Review -> Approved -> Published v2`

Until the new revision is approved and published, the previously published revision remains the active version.

## 7. Provenance and auditability

The platform must preserve the lifecycle of contributed knowledge.

The system must be able to determine, at minimum:

- who created the content;
- which organization they belong to;
- when the content was created;
- who edited it;
- when it was submitted;
- who reviewed it;
- review outcome and review notes;
- when it was resubmitted;
- who approved it;
- when it was approved;
- who published it;
- when it was published.

Identity metadata should come from the authenticated session whenever possible rather than requiring contributors to enter their own identity manually.

## 8. Security posture

The product must assume that unauthorized disclosure of some information may create organizational, reputational, or political risk.

This applies particularly to information about:

- instructors and experts;
- teaching materials;
- internal contributions;
- sensitive organizational knowledge.

Security must therefore be enforced at the application and data-access layers, not only through hidden UI elements.

The initial product remains network-only even when some types of curriculum information are less sensitive than others.

### Published-content visibility

For the initial product, all published content is visible to all authenticated users from approved network organizations.

The MVP does not introduce organization-specific or content-specific visibility tiers.

The architecture may preserve room for differentiated access in the future, but such tiers are not part of the current product contract.

## 9. Product language

Spanish is the primary language of the platform.

The MVP must be Spanish-first for user-facing experiences, including:

- navigation;
- library exploration;
- contribution forms;
- Admin review flows;
- validation and error states;
- workflow email notifications;
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
- ability to add new program topics;
- direct contribution of institutions and materials;
- personal itinerary as a non-hierarchical selection.

### Not part of the current UX contract

The following should not be treated as current user-facing requirements:

- learning trails;
- LMS-style hierarchy;
- module level labels such as `Intermediate` / `Advanced`;
- delivery-format labels such as `Hybrid` / `Online`;
- module-card completeness percentage.

Level and format metadata remain in the content model for potential future use, but do not need to be displayed in the current interface.

The completeness indicator present in earlier/static prototype behavior is **superseded** and is not part of the approved product baseline.

## 11. Administration and content retirement

### Democracia+ / Admin-authored content

An Admin may create, approve, and publish Democracia+ content directly without requiring a second reviewer.

The mandatory review workflow applies to content submitted by users from other organizations.

### Published-content removal

Published content is not permanently deleted as part of the normal product workflow.

When content should no longer be available, an Admin archives it.

Archived content:

- no longer appears in normal discovery, search, or browsing;
- remains preserved for governance and audit history;
- may be restored by an Admin.

A Contributor may delete their own unsubmitted draft when no governed history needs to be preserved.

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

### Collaboration with provenance
Every contribution should preserve its source, authoring organization, and lifecycle.

### Review before publication
Content submitted by users from other organizations requires administrative review before publication.

### Published content is stable
Changes to published information happen through revisions, not destructive in-place edits.

### Governance without blocking contribution
Users should be able to propose useful knowledge while the platform retains review and publication controls.

## 14. Product north star

A member of the Democracia+ network should be able to find a relevant topic, understand how it relates to the curriculum, access related experts and references, contribute new knowledge, and assemble a personal selection of modules — while the platform preserves provenance, review, permissions, and publication history.

## 15. Technical baseline

The initial product implementation will use:

- Next.js + TypeScript;
- Supabase for PostgreSQL, Auth, RLS, and private Storage;
- Resend for workflow email;
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
- product decisions confirmed on 2026-09-10.
