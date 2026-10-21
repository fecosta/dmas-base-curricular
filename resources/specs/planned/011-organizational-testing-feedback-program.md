# SPEC-011 — Organizational Testing & Feedback Program

**Product:** D+ Base Curricular  
**Status:** PLANNED — DECISION READY; PILOT OWNER/COHORT/CHANNEL APPROVAL REQUIRED  
**Depends on:** SPEC-010 readiness acceptance for affected features; existing authentication and SPEC-009 onboarding  
**Related:** SPEC-008 privacy/analytics activation gates; D+ Agora chatbot (separate product)  
**Proposed repository location:** `resources/specs/planned/011-organizational-testing-feedback-program.md`

## 1. Purpose
Run a lightweight three-week, phased pilot with partner organizations to validate whether users can access, discover, review, contribute where authorized, and download curriculum materials, and use structured feedback to improve the first version.

## 2. Current state and problem
The platform has an implemented library, organization/user administration and existing content. The stakeholder plan calls for phased external testing and an email reviewed by Malu. No pilot cohort, schedule, feedback destination or participant access matrix is confirmed in the available evidence. A repeatable onboarding/feedback process is needed to avoid scattered WhatsApp requests and untraceable changes.

## 3. Decisions and guardrails
- Treat the initial release as flexible: findings may change UX, content structure and prioritization.
- Pilot participation is invited, not an obligation to complete every task.
- Use one structured feedback channel; WhatsApp is not the official issue intake.
- Malu reviews the invitation before it is sent to partner organizations.
- Introduce D+ Agora in the invitation and request updated organizational program information through a separately defined, approved submission channel.
- Distinguish **feedback** from **content contributions** and **chatbot knowledge submissions**; do not merge their privacy purposes or permission models.
- Never promise partner upload capability to users who do not have an authorized authoring workflow. The current governance documentation describes Contributor authoring as inactive; any proposed pilot upload needs a separately approved permission/workflow decision, or an Admin-mediated alternative.
- Pilot operation does not authorize SPEC-008 production analytics activation. Consent/revocation remains independent of pilot participation.

## 4. Scope
### In scope
- Identify participating organizations, named pilot contacts and authorized test users using SPEC-009 Admin workflows.
- Prepare a Spanish invitation, access instructions, three-week activity guide and clear support contact.
- Week 1: sign in, navigate library, inspect modules, use search and filters.
- Week 2: review content organization and test material contribution **only via an already authorized workflow**; otherwise collect materials through a controlled Admin intake and log the upload gap.
- Week 3: open/download available materials, assess usefulness, submit structured suggestions.
- Configure feedback intake with fields for organization (optional if privacy-reviewed), week, feature, feedback type, description, severity/impact, reproducible steps and optional attachment (off by default).
- Triage findings, record owner/status/decision and publish a short end-of-pilot findings summary.
- Ask organizations for up-to-date program descriptions for the separate chatbot knowledge process, with an approved collection channel and explicit permission/usage expectations.

### Out of scope
- Automatic deployment of feedback requests; broad redesign; new chatbot ingestion pipeline; unauthorized data sharing between Base Curricular and D+ Agora; compulsory usage tracking; expansion of Admin privileges for testing convenience.

## 5. Pilot journey
**Before launch:** verify SPEC-010 gates, participant roster, organization memberships, login access, availability of downloadable materials, form privacy notice and feedback handling owner. Test the invitation links and mobile experience with an internal non-admin account.

**Week 1 — Explore:** participant signs in, navigates module/library views, searches, filters by country, records friction and missing content.

**Week 2 — Review and contribute:** participant reviews modules and teaching notes visible under their permissions, identifies outdated/missing materials, and uses the approved upload or Admin-mediated contribution route. No implicit privilege elevation.

**Week 3 — Apply and improve:** participant opens/downloads resources, evaluates relevance, submits overall feedback and prioritizes suggested improvements.

**After pilot:** triage issues (blocker, high, medium, low), distinguish bugs from product decisions and content corrections, identify quick fixes vs future specs, share a concise summary with partners, and obtain authorization before changing durable product contracts.

## 6. Communications
Invitation in Spanish should cover: purpose and collaborative nature; first-version flexibility; platform link `https://bc.democraciamas.com`; access/account instructions; suggested weekly activities; feedback form link and support channel; brief D+ Agora introduction; separate request for updated programs (objectives, audience, methodology, modules, materials) and the approved destination; privacy expectations. Send to Malu for review before external distribution. Do not claim the chatbot already contains partner updates or that all pilot features are available until verified.

## 7. Feedback operations and data
Use a controlled register with ID, timestamp, organization if authorized, feature, category, impact, reproducibility, owner, status, disposition and linked change/SPEC. Suggested states: New → Triaged → Planned / Needs decision / Not planned → Resolved → Verified. Access is restricted to the pilot team; minimize personal information and define retention/deletion policy. Feedback form submission is not analytics opt-in. Do not export private content or personal data to third-party forms without appropriate review.

## 8. Acceptance criteria
- **AC-01:** Approved cohort, contacts, schedule, support owner and participation instructions are recorded before invitations.
- **AC-02:** Malu reviews and approves the Spanish invitation before external send.
- **AC-03:** Each invited test user has verified access appropriate to their role and organization; unauthorized actions remain denied.
- **AC-04:** A participant can follow the three weekly journeys, with clear alternative instructions for unavailable/unauthorized upload functionality.
- **AC-05:** All submitted feedback reaches a single approved register with acknowledgment and triage ownership; WhatsApp is not required.
- **AC-06:** The form works for the target devices and does not require analytics consent.
- **AC-07:** Pilot tests do not bypass publication, content visibility, Storage/RLS, archival or Admin boundaries.
- **AC-08:** Chatbot program-update requests use a distinct approved intake with documented intended use and access; no automatic cross-product ingestion.
- **AC-09:** The pilot produces a findings report with participation counts from permitted operational records, issue categories, priorities, decisions and next actions; opt-in analytics is never treated as a complete census.
- **AC-10:** Any proposed product-contract changes are explicitly reviewed, documented and separately authorized; no automatic rollout.

## 9. Readiness gates and open questions
Confirm (1) pilot owner and Malu's approval authority, (2) target organizations and user roster, (3) start dates and whether weeks are fixed or flexible, (4) whether authoring/upload is permitted and for which roles, (5) JotForm ownership, data fields, storage, retention and privacy notice, (6) support contact and response expectation, (7) approved chatbot information intake and rights to reuse materials, (8) treatment of sensitive/third-party program data. Do not activate external testing until essential access, privacy and content permission gates are met.

## 10. Validation, documentation and completion
Dry-run all three journeys with a safe internal pilot account; validate email links, accessibility, form, authorization and download behavior. Track issues without silently editing production data. Reconcile pilot documentation and related decisions. Close this SPEC only after the pilot is actually executed, findings are triaged and stakeholders receive the outcome; creating the invitation or form alone is insufficient. Independent coherence review required. No automatic push, merge or deployment.
