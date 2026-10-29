# SPEC-010 / U5 — G4/G5 Feedback Privacy and Governance Evidence

**Status:** EVIDENCE AND DECISION RECORD — **G4 PARTIALLY SATISFIED (decisions approved; operational controls unverified) — OPEN. G5 OPEN.** Not a legal opinion and not an independent legal review.

**Date:** 2026-10-28.

**Production activation:** **BLOCKED.** The Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` is not set and nothing was deployed.

**Scope of this unit:** documentation only. No live Jotform form change was made, no submission was made, no Jotform credentials or administration access were used, and no file under `src/`, `tests/` or `supabase/` was changed.

**Referenced by:** `resources/specs/planned/010-platform-readiness-organizational-testing.md` (§6, gates G4/G5) and `docs/DECISIONS.md` (D-035).

**Labels used throughout.**

- **APPROVED-DECISION:** decided by the Product Owner on 2026-10-28; recorded, not independently checked.
- **VERIFIED:** observed directly (public fetch of the form, or repository code/docs).
- **UNVERIFIED:** not observable without Jotform account access; must be confirmed and recorded before gates close.

---

## 1. Approved decisions (Product Owner, 2026-10-28)

1. **Feedback ownership.** Felipe Costa and Malu are both responsible for coordinating the feedback process.
2. **Privacy authority.** Felipe Costa confirmed that Democracia+ authorized him to make privacy decisions for this platform. This is recorded as the project's authorized privacy approval **for this feedback feature only**. It is not a legal opinion and not an independent legal review. No written Democracia+ authorization artifact exists in the repository; the authorization is recorded as communicated by the Product Owner/user.
3. **Provider.** Jotform; form `https://form.jotform.com/263007291660049`, titled "Comentarios y sugerencia", owned by the FVR account; data hosted in the United States (confirmed by the Product Owner, not independently verified).
4. **Fields (approved, no additions, no automatic identity or context collection):** feedback type (required), free-text feedback (required), section (optional), email (optional; stays available for follow-up).
5. **Retention.** 12 months after submission, then deletion. The scope covers Jotform submissions **and** any exports, copies or notification emails under the organization's control. Automatic deletion is **not** verified as configured.

## 2. G4 reconciliation

| Item | Approved decision | Evidence | Status |
|---|---|---|---|
| Form URL | `https://form.jotform.com/263007291660049` | Public fetch 2026-10-28 and again on the same day; form resolves. The form is reachable by anyone who has the URL (no authentication). | APPROVED-DECISION; URL resolution VERIFIED |
| Form title | "Comentarios y sugerencia" | Public fetch | VERIFIED |
| Form owner | FVR account | Product Owner statement; account ownership not observable from the public page | APPROVED-DECISION (ownership UNVERIFIED) |
| Feedback-handling owners | Felipe Costa and Malu, jointly | Product Owner statement | APPROVED-DECISION |
| Fields | Type (required: Sugerencia / Problema técnico / Contenido / Otro); free text (required); section (optional: Inicio / D+ Base Curricular / Cursos y contenidos / Recursos / Otra sección); email (optional); Jotform honeypot "Should be Empty" | Public fetch matches exactly; no other fields | APPROVED-DECISION; field list VERIFIED |
| Form-level privacy text | Required (wording in §7 below) | Public fetch shows only a one-line intro and no privacy notice, consent wording, retention statement or owner text | **NOT IN PLACE** (VERIFIED absent) |
| No page context or identity passed | D3 / AC-08 | `resources/specs/planned/010-platform-readiness-organizational-testing.md` §4 D3 and AC-08; `docs/SECURITY.md` line 456 (feedback link "must not transmit tokens, search queries, private content or user identifiers, append query parameters, or emit analytics events"); `src/app/app/layout.tsx` renders a plain anchor (U5 coherence verified, SPEC-010 §2). The public page shows no identity or context fields beyond the honeypot. | VERIFIED (code and docs); Jotform-side hidden/prefill settings UNVERIFIED |
| Provider | Jotform | Product Owner statement; URL domain `form.jotform.com` | APPROVED-DECISION; VERIFIED by URL |
| United States hosting | Data hosted in the United States | Product Owner statement only | APPROVED-DECISION (UNVERIFIED) |
| Who can access submissions | Target: Felipe Costa and Malu, plus FVR account administrators strictly as account owners (§4) | None | UNVERIFIED |
| Account administrators | Unknown | None | UNVERIFIED |
| Notification-email recipients | Unknown | None | UNVERIFIED |
| Retention: 12 months | 12 months after submission, then deletion | Product Owner decision | APPROVED-DECISION; enforcement UNVERIFIED |
| Deletion procedure | §3 below | Documented here; not executed, not verified on the account | DOCUMENTED, NOT EXECUTED |

## 3. Retention and deletion operating procedure

**Automatic deletion is NOT verified as configured.** Nothing below is in place until recorded under §8.

**Owners.** Felipe Costa and Malu (a second person must check each run).

**Cadence (PROPOSAL, requires Product Owner confirmation).** Review at least monthly, in the first week of each month.

**Vendor behavior (public Jotform documentation, not account-specific; UNVERIFIED for the FVR account and plan).** Source: https://www.jotform.com/help/how-to-purge-form-submissions-automatically.

- Auto-Delete Submissions can be set per form or at account level.
- It applies only to submissions created **after** it is enabled; older submissions are not deleted automatically.
- Auto-deleted submissions go to Trashed Entries for up to 30 days unless the "Purge" option is used.
- Plan limits may cap stored submissions (free plan: 500 total, oldest removed when full). Availability of Auto-Delete on the FVR account's plan is unverified.

**Worst-case retention.** If Auto-Delete is enabled **without** Purge, deleted entries remain in Trash for up to 30 days, so worst-case retention is about **13 months**. The procedure therefore requires Purge or a manual trash-clearing step. If neither is done, the 12-month commitment is not met and the form wording in §7 must not be published.

**Steps.**

1. **Configuration.** The account owner enables Auto-Delete Submissions with a 12-month period and the Purge option, on this form or at account level, after confirming plan availability. If the plan does not support it, the monthly manual procedure below is the only control and must be recorded as such.
2. **Pre-existing submissions.** Auto-Delete applies only to new submissions. Until Auto-Delete has covered 12 months of submissions, each monthly review manually deletes every submission older than 12 months. Delete any test or owner-created submissions before activation.
3. **Trash.** Each review empties Trashed Entries of submissions past retention.
4. **Copies.** Exports (CSV/PDF/Excel), downloads and notification emails are in the retention scope. They are deleted at the same 12-month point; exports should be avoided unless needed, and any retained export must be listed in the evidence record. Notification emails to the account owner or other recipients must be deleted from mailboxes at the same point.
5. **Evidence per run.** Date, operator, second-person checker, a screenshot or description of the setting (no personal data and no submission content visible), and counts only (deleted, trash cleared).
6. **Rights and deletion requests received at hola@democraciamas.com.** Delete the matching submission(s), the Trash copies and any copies in notification emails or exports on request. Identification is only possible through the optional email entered in the form; a submission without an email cannot be matched to a person and the requester must be told that. Request handling follows the institutional procedure described in the Notice §18; no response time is defined by this record.

## 4. Access-control requirement (REQUIRED TARGET STATE — NOT VERIFIED)

The account owner must answer and record, using names and roles only, never credentials and never submission content:

1. Who has Jotform account or team access on the FVR account?
2. Who receives submission notification emails?
3. Is the form shared with, or does it have, collaborators?
4. Can anyone outside the named responsible people read submissions (including shared links, public submission views, team roles, API keys, integrations)?
5. Which integrations or exports (spreadsheets, email, other apps) copy submissions outside Jotform?

**Minimum-necessary access rule (target state):** only Felipe Costa and Malu, plus FVR account administrators strictly as account owners. Any other access, shared link, integration or recipient must be removed or recorded with a justification. This is the required target; it is **not** a verified fact.

## 5. G5 analysis — SPEC-008 Gate P mapping

**Relationship.** The feedback form is separate from analytics consent (D-035). Feedback is voluntary and is not consent-based on analytics. The feedback-specific privacy approval (authority: Felipe Costa on behalf of Democracia+, per the Product Owner) is recorded **for G5 purposes only**. It does not close, satisfy or pre-empt any SPEC-008 Gate P item and does not change SPEC-008 status.

**P1–P10 (SPEC-008 §11.1).** None is closed by this unit.

| Item | Concern | Applies to feedback? | Status |
|---|---|---|---|
| P1, P2 | Organizational usage metrics: legal basis, consent | No | PENDING (unchanged) |
| P3, P4, P5, P6, P10 | GA4 processing, cookies, Consent Mode, analytics retention, GA4 provider-derived data | No | PENDING (unchanged) |
| P7 | Privacy Notice (and Terms) changes and version (§10.1) | **Partly:** the only item with a feedback-specific dimension (Notice/Terms wording for the feedback form). The versioned update stays tied to the SPEC-008 analytics scope. | PENDING (unchanged) |
| P8, P9 | PostHog-era re-consent, PostHog data disposal | No | PENDING (unchanged) |

**Existing Notice (`docs/PRIVACY_NOTICE.md`, version 1.1) and Terms (`docs/TERMS_OF_USE.md`) versus feedback, today.**

| Section | Today | Gap for feedback |
|---|---|---|
| Notice §4 (data) | Account data and optional analytics only | Silent on feedback type, free text, section, optional email |
| Notice §5 (purposes) | Operation, security, optional analytics | Silent on feedback purpose |
| Notice §13 (international processing) | Generic "other jurisdictions"; names only PostHog Cloud EU | Does not mention the United States or Jotform |
| Notice §14 (retention) | "12 meses" is for **analytics events** only; other categories "pueden tener períodos diferentes" | Silent on feedback retention. The 12-month analytics period is a different scope and must not be conflated with the feedback 12 months |
| Notice §16 (sharing/providers) | Hosting, authentication, storage, security, communications, optional analytics | No feedback-form provider category. It also states providers are subject to contractual and security measures; no Jotform contractual arrangement has been verified, so the staged text does not repeat that claim for Jotform |
| Notice §18 (rights) | General rights and hola@democraciamas.com | Accurate, but silent on identification for feedback (optional email only) |
| Notice §22 (changes) | Date/version updated on change | Consistent; publication requires a version bump |
| Notice §23 (contact) | hola@democraciamas.com | Accurate |
| Terms §13 (third-party sites) | Generic external-services text | Does not name the feedback form; adequate in general |
| Terms §14 (privacy) | Lists what the Notice explains (analytics provider, preferences, requests) | Does not list feedback handling |

No existing statement is contradicted by the feedback decisions; the Notice and Terms are incomplete rather than wrong. Notice §7 ("No enviamos intencionalmente para analítica…tu correo") is scoped to analytics and is unaffected.

**Why the Notice and Terms are not edited in this unit.** `privacyNoticeVersion = "1.1"` and `consentVersion = "1.1"` live in `src/lib/privacy/contract.ts`, and `tests/privacy-documents.test.ts` asserts that `docs/PRIVACY_NOTICE.md` contains `**Versión:** 1.1`. Both documents are rendered live in production, and consent decisions are recorded against the Notice version. Editing the live text while keeping version 1.1 would misattribute stored consents. Publishing the text requires a separate bounded unit that bumps the Notice (and Terms) version together with `src/lib/privacy/contract.ts` and the version-alignment test, and that decides explicitly whether feedback-only wording needs re-consent (analytics consent is separate and unaffected; feedback does not depend on analytics consent). That unit is governed by SPEC-008 P7/§10.1 and P8.

## 6. STAGED Spanish text — NOT PUBLISHED, NOT VERSIONED

Prepared for the privacy approver (Felipe Costa) and for the later versioned publication unit. It must not be copied into `docs/PRIVACY_NOTICE.md` or `docs/TERMS_OF_USE.md` outside that unit. Every statement below must be re-checked against §8 evidence before publication (in particular access and retention).

### 6.1 Aviso de Privacidad — nueva sección "Comentarios y sugerencias"

(Placement: after §16; numbering to be decided at publication.)

> ## Comentarios y sugerencias
>
> Base Curricular incluye la acción **Enviar comentarios**, que abre un formulario externo. El formulario funciona en **Jotform**, mediante una cuenta operada por FVR Ltd, y la información que envíes se almacena en **Estados Unidos**.
>
> **Qué recibimos.** El tipo de comentario, el texto que escribes, la sección de la plataforma (opcional) y, solo si decides indicarlo, tu correo electrónico (opcional). El formulario no recibe automáticamente tu cuenta, tu nombre, tu organización, la página en la que estabas ni el texto de tus búsquedas.
>
> **Para qué.** Para recibir y responder tus comentarios y mejorar Base Curricular. Solo te contactaremos si indicas un correo electrónico.
>
> **Es voluntario.** Enviar comentarios es opcional, no afecta tu acceso a Base Curricular y es independiente de tu decisión sobre la analítica opcional.
>
> **Quién accede.** Los comentarios son gestionados por las personas responsables del proceso de comentarios de Base Curricular y por quienes administran la cuenta del formulario.
>
> **Cuánto tiempo los conservamos.** 12 meses desde el envío; después los eliminamos, incluidas las copias que mantengamos en exportaciones o correos de notificación. Este período es independiente del período de conservación de la analítica descrito en la sección 14.
>
> **Recomendación.** No incluyas datos personales sensibles ni innecesarios, ni datos de otras personas.
>
> **Tus derechos.** Para consultar, corregir o solicitar la eliminación de un comentario, escribe a **hola@democraciamas.com**. Para localizar tu envío podremos pedirte el correo electrónico que indicaste en el formulario; si no indicaste uno, es posible que no podamos identificar tu comentario.

One-line additions to existing Notice lists:

- §16 provider list: `- recepción de comentarios mediante un formulario externo (Jotform);`
- §13: `Los comentarios enviados mediante el formulario externo de Base Curricular se almacenan en Estados Unidos.`
- §14: `Los comentarios enviados mediante el formulario externo se conservan 12 meses desde su envío y después se eliminan; este período es independiente del de la analítica.`

### 6.2 Términos de Uso — adición

In §14, add to the list of what the Notice explains: `- cómo se tratan los comentarios que envías mediante el formulario externo de comentarios;`.

In §13, add after the paragraph that begins "Antes de proporcionar información personal":

> El formulario de comentarios de Base Curricular es un servicio externo y su uso es voluntario. Evita incluir datos personales sensibles o innecesarios; el Aviso de Privacidad de D+ Base Curricular explica cómo se tratan los comentarios que envías.

## 7. Proposed Jotform form-level privacy wording (NOT APPLIED to the live form)

Spanish, for a text/paragraph element near the top or above the submit button:

> Usamos este formulario para recibir y responder tus comentarios y mejorar D+ Base Curricular. Es voluntario y no está relacionado con tu decisión sobre la analítica.
> Tu correo electrónico es opcional: indícalo solo si quieres que te contactemos.
> Este formulario funciona en Jotform, un proveedor externo. Los datos se almacenan en Estados Unidos y los conservamos 12 meses desde el envío; después los eliminamos.
> No incluyas datos personales sensibles ni innecesarios, ni datos de otras personas.
> Más información en el Aviso de Privacidad de D+ Base Curricular, disponible dentro de la plataforma (enlace «Aviso de Privacidad» al pie de página, o en Preferencias de datos → «Leer el Aviso de Privacidad»).
> Para solicitudes sobre tus datos: hola@democraciamas.com

**Placement conditions.**

- Do not publish the 12-month sentence until the §3 deletion procedure is in place and recorded.
- Do not publish the "Más información en el Aviso de Privacidad" line until the Notice section in §6.1 is published; until then the Notice is silent on feedback and the reference would be misleading.
- In-app location verified in code: the authenticated footer link "Aviso de Privacidad" (`src/app/app/layout.tsx`) and the link "Leer el Aviso de Privacidad" inside "Preferencias de datos" (`src/components/privacy/data-preferences.tsx`).

**Notice URL (not approved).** The Notice is rendered at the authenticated route `/app/privacidad/aviso`. The candidate URL `https://bc.democraciamas.com/app/privacidad/aviso` was OBSERVED to resolve, but it is login-gated (an unauthenticated request redirects to `/login`). No fully qualified public Notice URL is approved anywhere in the repository, so none is placed on the form. The Product Owner must confirm either a URL to show on the form or an in-app-only reference (the wording above uses the in-app reference).

## 8. Outstanding manual actions

| # | Action | Owner | Evidence to record |
|---|---|---|---|
| 1 | Confirm Jotform account administrators, team members and who can read submissions (§4 questions 1, 3, 4) | FVR account owner | Names/roles, date, operator |
| 2 | Confirm notification-email recipients and integrations/exports (§4 questions 2, 5); remove any not needed | FVR account owner | Recipient roles, date |
| 3 | Confirm plan support, then enable Auto-Delete Submissions (12 months) with Purge, per form or account; otherwise record manual-only control | Felipe Costa / Malu | Setting description or screenshot without personal data, date, second-person check |
| 4 | Review and delete pre-existing and test submissions; clear Trash | Felipe Costa / Malu | Counts only, date, checker |
| 5 | Product Owner decides the Notice reference on the form (public URL or in-app-only) | Product Owner | Recorded decision |
| 6 | Place the §7 wording on the live form (requires explicit authorization to change the live form; respect the placement conditions) | Form owner (FVR account) | Date, screenshot of the live form |
| 7 | Publish the Notice/Terms update (§6) through a separate versioned unit (version bump in `src/lib/privacy/contract.ts`, version-alignment test, decision on re-consent) | Product Owner / privacy approver; bounded implementation unit | Commit, new version number, deployment record |
| 8 | Record all of the above, then update SPEC-010 §6 gate rows G4/G5 and D-035 | Documentation unit | Updated records |
| 9 | Only then set Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` and redeploy. Rollback: unset the variable and redeploy (SPEC-010 §6 record) | Authorized operator | Deployment record |

## 9. Closure criteria

| Criterion | Required for | Status |
|---|---|---|
| Form URL, fields, provider approved | G4 | MET (approved decisions; fields verified) |
| Form owner and feedback-handling owners named | G4 | MET (FVR account; Felipe Costa and Malu) |
| Retention period decided | G4 | MET (12 months) |
| Retention enforced (Auto-Delete + Purge or recorded manual control) | G4 | NOT MET (unverified) |
| Access restricted to the target state, recipients known | G4 | NOT MET (unverified) |
| Form-level privacy wording live on the form | G4 | NOT MET (absent) |
| Notice URL or in-app reference decided | G4 | NOT MET |
| Privacy authority recorded for the feedback feature | G5 | MET (approved decision; no written authorization artifact; not a legal opinion) |
| Notice and Terms updated and published with a version bump, and re-consent decision recorded | G5 | NOT MET (text staged only) |
| SPEC-008 Gate P unaffected | G5 | MET (no Gate P item closed or changed) |

**G4 can be marked SATISFIED** only when every G4 row above is MET and recorded in SPEC-010 §6. **G5 can be marked SATISFIED** only when every G5 row above is MET and recorded.

**Outcome: G4/G5 PARTIALLY VERIFIED — ACTION REQUIRED** (Product Owner decisions approved; operational controls and published privacy text unverified).

## 10. What this record does not do

- It does not close G4 or G5 and does not activate production.
- It does not close SPEC-010, which stays PLANNED; U5 stays COHERENCE VERIFIED; U0, U1 and U4 remain pending.
- It does not change SPEC-008 status or close any Gate P item.
- It does not edit `docs/PRIVACY_NOTICE.md` or `docs/TERMS_OF_USE.md` and publishes no version.
- It does not change the live Jotform form and does not claim automatic deletion, access restriction or form-level privacy wording is in place.
- It is not a legal opinion and makes no GDPR, adequacy, data-processing-agreement or Jotform certification claim.
