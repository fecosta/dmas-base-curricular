# SPEC-010 — Platform Readiness for Organizational Testing

**Product:** D+ Base Curricular  
**Status:** PLANNED — DECISION READY; TECHNICAL PREFLIGHT AND SCOPE CONFIRMATION REQUIRED  
**Dependencies:** SPEC-001–007 and SPEC-009; coordinate with active SPEC-008 without activating analytics  
**Proposed repository location:** `resources/specs/planned/010-platform-readiness-organizational-testing.md`

## 1. Purpose
Prepare the existing platform for phased testing with Latin American partner organizations, without destroying curriculum content, weakening access controls, or changing the established governance model.

## 2. Grounded baseline and gap
SPEC-009 provides canonical organizations, domains, memberships and Admin management. A membership links a user to one organization; normal removal is deactivation, not hard deletion. SPEC-008 implements opt-in analytics, but production activation remains gated. The library and content model already exist. The current extent of institution references, country options, country provenance fields, and feedback UI must be inspected in a repository preflight; none is assumed to be absent or present.

## 3. Stakeholder intent and decisions
- Start the *public-facing institutional references* from zero while retaining existing materials, modules and teaching notes.
- Offer only Latin American countries in the **reach/alcance** country selector.
- Enable searching/filtering/classification by the country associated with the organization responsible for uploading content.
- Provide an accessible, structured feedback entry point, preferably a JotForm modal.
- Use `bc.democraciamas.com` as the approved public subdomain; DNS/deployment changes are not presumed necessary.
- Preserve existing analytics opt-in, default-off behavior and revocation; no new tracking or analytics activation is authorized.

**Decision requiring confirmation:** “Remove all referenced institutions” means remove public content references/seed examples, **not** delete canonical `organizations`, `memberships`, Auth users, ownership relationships, audit records, or historical provenance. If stakeholders intend to remove actual organizations, return `BLOCKED / DECISION REQUIRED` for an explicit safe migration plan.

## 4. Scope
### In scope
1. Inventory institutional references across seeded/demo data, UI labels, filters, relationships and content metadata; distinguish fictional/example references from real provenance.
2. Remove or suppress the agreed references from public discovery and display while preserving all curriculum content, files, teaching notes, canonical ownership and auditability.
3. Restrict the *reach* selector to a reviewed LATAM country set, using existing country identifiers where possible; validate on client and server. Existing non-LATAM records must be inventoried and handled non-destructively rather than silently rewritten.
4. Expose a **country of upload / contributing organization country** dimension for filtering and classification; ensure search and filter combinations work consistently in list/grid/program views, with empty and unknown-country states.
5. Add a visible `Comentarios / Feedback` action and structured form integration (JotForm is preferred, subject to privacy/security review). Form must allow free text and optionally contextual category; provide a fallback link if embedded form fails.
6. Verify approved subdomain, navigation, mobile usability, accessibility and regression behavior.

### Out of scope
- Deleting organizations, users, memberships, content, attachments, audit history or analytics data.
- Changing publication/archival authorization or reviving contributor authoring without an approved decision.
- Building a custom ticketing system, public feedback board or notification engine.
- Expanding optional analytics events, adding session replay or enabling PostHog.
- Redesigning the whole content taxonomy or translating the entire application.

## 5. Required semantics
**Reach country** describes geographic scope of a program/material. **Upload-country** describes the country attributed to the contributing organization at the time the content was uploaded. These are distinct dimensions and must not overwrite one another. A user's current IP/location is never a substitute for upload-country. The preflight must identify the authoritative source, whether organizations have a country field, and whether historical upload-country can be reliably reconstructed. If no trustworthy source exists, do not infer country from email domain or current user location; return a proposed minimal schema/provenance decision for approval. Preserve historical provenance if an organization's country changes later.

The upload-country filter must never bypass existing publication, membership, organization isolation, Storage or RLS constraints. Unknown provenance must be represented explicitly rather than guessed. Decide whether the new filter applies to materials only or all content types after checking the actual model; do not silently invent inheritance rules.

## 6. Feedback and privacy
Feedback submission is voluntary and separate from analytics consent. Before connecting JotForm, confirm approved form owner, destination, access, retention, privacy notice, required fields, and whether identifiers or page context may be sent. Do not transmit access tokens, private curriculum text, raw search terms or personal data by default. Avoid embedding a third-party tracker before any required privacy authorization. Provide a clear success/error state and a usable non-embedded fallback.

## 7. Acceptance criteria
- **AC-01:** Approved institutional references no longer appear in public content surfaces, while retained materials and teaching notes remain accessible under existing permissions.
- **AC-02:** Canonical organization/user/membership records and historical audit/provenance remain intact; migration has a documented dry-run, backup/rollback strategy and zero unintended destructive changes.
- **AC-03:** Reach selector offers exactly the approved LATAM set; server validation rejects unsupported new values, and existing values are handled by an explicit non-destructive rule.
- **AC-04:** Country-of-upload is distinct from reach, sourced from verifiable provenance, and displayed/filtered consistently wherever approved.
- **AC-05:** Search + country + other filters combine correctly; unknown-country and zero-result states are understandable.
- **AC-06:** No unpublished/private content is exposed through country filters or query endpoints; existing Admin permissions remain enforced.
- **AC-07:** Feedback action works on desktop/mobile and keyboard; form can be submitted and fallback works when embedding is unavailable.
- **AC-08:** Feedback integration does not send unauthorized PII, tokens or private content, and does not activate optional analytics.
- **AC-09:** Existing consent/revocation behavior and SPEC-008 activation gates are unchanged.
- **AC-10:** Existing upload, viewing, downloading, publication and archival regressions pass; deployed domain is verified without assuming DNS changes.

## 8. Preflight and blockers
Before implementation, inspect `docs/PRODUCT.md`, `CONTENT_MODEL.md`, `GOVERNANCE.md`, `SECURITY.md`, `ARCHITECTURE.md`, `DECISIONS.md`, current schema/migrations, content seed records, relevant UI, and SPEC-008/009. Produce a reference inventory and impact map. Resolve: exact meaning of institutional removal; approved LATAM country list (including territories/edge cases); source/time semantics for upload-country; treatment of legacy records; scope of country filter across content types; JotForm governance/privacy. Any unresolved contract-changing item blocks activation, not necessarily documentation drafting.

## 9. Validation and documentation
Use unit/integration tests, RLS/database checks, browser journeys and an independent review; verify destructive-risk changes on safe local/test fixtures, not real production records. Reconcile product/content/security/architecture/decision documentation and the SPEC index. Do not push, merge, deploy, or activate automatically; request explicit authorization for each gated action.

## 10. Implementation freedom
Implementation may choose component structure, query mechanics and modal library consistent with existing stack. It may not redefine country semantics, erase provenance, expand data collection, alter permissions, or reinterpret removal as destructive deletion.
