# SPEC-010 / U5 — G4/G5 Feedback Privacy and Governance Evidence

**Status:** EVIDENCE AND DECISION RECORD — **G5 CLOSED 2026-10-29; G4 SATISFIED — CLOSED 2026-10-29.** Not a legal opinion and not an independent legal review.

**Date:** 2026-10-28 (initial record and publication-readiness update, same day); **2026-10-29 (G4/G5 final verification and activation-readiness record).**

**Production activation:** **FEEDBACK ACTIVATION READY — AWAITING EXPLICIT PRODUCTION AUTHORIZATION** (see §11). The Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` was not set at the 2026-10-28 preflight and was not changed by this 2026-10-29 record.

**Scope of the publication-readiness unit (branch `feat/spec-010-privacy-publication-manual-retention`):** repository changes only: Notice 1.2 and Terms 1.1 text, the `privacyNoticeVersion` constant, a public Privacy Notice route, focused tests and documentation. No live Jotform change, no submission, no Jotform access, no Vercel change, no deployment, no database or migration change, no change to analytics, authentication or the feedback-link feature.

**Referenced by:** `resources/specs/planned/010-platform-readiness-organizational-testing.md` (§6, gates G4/G5) and `docs/DECISIONS.md` (D-035).

**Labels used throughout.**

- **APPROVED DECISION:** decided by the Product Owner; recorded, not independently checked.
- **PUBLISHED DOCUMENTATION:** text or code present in the repository on the unit branch; **not live** until merged and deployed.
- **VERIFIED CONTROL:** observed directly by an agent (public fetch, repository code, local production build).
- **PENDING MANUAL ACTION:** requires a person with Jotform/Vercel/mailbox access; no evidence recorded yet.
- **UNVERIFIED:** not observable without account access.

---

## 1. Approved decisions (Product Owner)

1. **Account ownership and access.** Felipe Costa owns the FVR Jotform organization account. Felipe is the **only** person authorized to access submissions and the **only** recipient of submission notifications. Felipe reviews the feedback and identifies improvements. (APPROVED DECISION; account configuration UNVERIFIED.)
2. **Coordination.** Felipe Costa and Malu coordinate the feedback process. Malu is **not** described as having access to submissions.
3. **Privacy authority.** Felipe Costa confirmed that Democracia+ authorized him to approve privacy decisions for this feature. Feature-specific; not a legal opinion or independent legal review. No written Democracia+ authorization artifact exists in the repository; recorded as communicated by the Product Owner.
4. **Provider.** Jotform; form `https://form.jotform.com/263007291660049` ("Comentarios y sugerencia"), FVR account; data hosted in the United States (confirmed by the Product Owner, not independently verified).
5. **Fields (approved, no additions, no automatic identity or context collection):** feedback type (required), free text (required), section (optional), email (optional; stays available for follow-up).
6. **Retention.** No longer than **12 months** after submission, followed by permanent deletion. Automatic deletion is **unavailable** in the FVR account. **Manual deletion and permanent purging is the approved mechanism** (§3). No automated deletion service is implemented or planned. Test submissions are manually deleted and permanently purged immediately after testing.

## 2. G4 reconciliation

| Item | Approved decision | Evidence | Status |
|---|---|---|---|
| Form URL | `https://form.jotform.com/263007291660049` | Public fetch 2026-10-28; form resolves without authentication | APPROVED DECISION; URL resolution VERIFIED CONTROL |
| Form title | "Comentarios y sugerencia" | Public fetch | VERIFIED CONTROL |
| Form owner | FVR account, owned by Felipe Costa | Product Owner statement | APPROVED DECISION (UNVERIFIED) |
| Feedback coordination | Felipe Costa and Malu | Product Owner statement | APPROVED DECISION |
| Who reads submissions | **Felipe Costa only** | Product Owner statement; attested 2026-10-29 | **PO ATTESTED 2026-10-29** (not independently audited) |
| Notification recipients | **Felipe Costa only** | Product Owner statement; attested 2026-10-29 | **PO ATTESTED 2026-10-29** (not independently audited) |
| Fields | Type (required: Sugerencia / Problema técnico / Contenido / Otro); free text (required); section (optional: Inicio / D+ Base Curricular / Cursos y contenidos / Recursos / Otra sección); email (optional). The approved four fields match; the extra required Jotform "Terms & Conditions" acceptance checkbox was present on 2026-10-29 ~03:40 UTC but is no longer present on 2026-10-29 ~03:57 UTC | Public fetch 2026-10-29; browser reverification 2026-10-29 ~03:57 UTC; see §12 and §13 | **Approved four fields VERIFIED CONTROL**; extra required checkbox **REMOVED — VERIFIED CONTROL 2026-10-29** |
| No page context or identity passed | D3 / AC-08 | SPEC-010 §4 D3 and AC-08; `docs/SECURITY.md` line 456; `src/app/app/layout.tsx` renders a plain anchor; public page shows no identity or context fields beyond the honeypot | VERIFIED CONTROL (code and docs); Jotform-side hidden/prefill settings UNVERIFIED |
| Provider | Jotform | Product Owner statement; URL domain `form.jotform.com` | APPROVED DECISION; VERIFIED CONTROL by URL |
| United States hosting | United States | Product Owner statement only | APPROVED DECISION (UNVERIFIED) |
| Retention period | No longer than 12 months, then permanent deletion | Product Owner decision | APPROVED DECISION |
| Retention enforcement | Manual procedure (§3); automatic deletion unavailable | Procedure approved and commitment recorded 2026-10-29; test-round cleanup reported 2026-10-29 (§3.5); no monthly run recorded yet; first review window 1–7 November 2026 | **Procedure APPROVED**; execution NOT YET APPLICABLE for scheduled review (no submission can be older than 10 months); **test-round cleanup PO-REPORTED/USER-PROVIDED** (§3.5) |
| Form-level privacy text | Final wording in §7 | Independent browser reverification 2026-10-29 ~03:57 UTC observed all 7 lines of the approved §7 text rendered as plain text below the submit button; identical in plain and cache-busted loads — see §13 | **VERIFIED CONTROL 2026-10-29** |
| Form Notice link | Must point to `https://bc.democraciamas.com/privacidad/aviso` | Independent browser reverification 2026-10-29 ~03:57 UTC: the form's only privacy link is `https://bc.democraciamas.com/privacidad/aviso` (`target="_blank"`, `rel="nofollow"`); clicking it opened the public URL without redirect to `/login`; direct anonymous GET also returned HTTP 200 — see §13 | **VERIFIED CONTROL 2026-10-29** |
| Public Notice URL | `https://bc.democraciamas.com/privacidad/aviso` | Route implemented (§6.4) and verified locally; production GET on 2026-10-28 returned 404 (not deployed) — **superseded by 2026-10-29 public fetch: HTTP 200, no redirect, feedback section present** | **VERIFIED CONTROL 2026-10-29** (live production URL) |

## 3. Retention and deletion procedure (manual — APPROVED DECISION)

**This is a manual control. It is not automatic.** Execution is **NOT VERIFIED** until real entries exist in the logs below.

**Vendor background (public Jotform documentation, not account-specific).** Auto-Delete Submissions is **not available** in the FVR account. Deleted submissions stay in Trash for about 30 days unless permanently purged, so every deletion below includes a permanent purge from Trash. Source: https://www.jotform.com/help/how-to-purge-form-submissions-automatically.

**Responsible person.** Felipe Costa. Malu does not access submissions.

### 3.1 Test submissions (after every organizational testing round)

1. Identify the test submissions created during the round.
2. Delete them in Jotform.
3. Permanently purge them from Trash.
4. Delete the corresponding notification emails from the mailbox.
5. Delete any exported or downloaded copies.
6. Record the cleanup date and completion status in the §3.5 test-round table (counts and confirmations only).

### 3.2 Ongoing submissions (monthly review)

- **Cadence.** One review each calendar month, performed in the first 7 days of the month.
- **Rule.** At each review, permanently delete **every submission older than 10 months**.
- **Scope of each review.** (a) Jotform submissions; (b) Trash, permanently purged; (c) notification emails in Felipe's mailbox, by the 10-month rule applied to the email date; (d) exports and downloaded copies; (e) any other confirmed copy under organizational control.
- **Missed review.** Perform it as soon as possible and record the lateness in the log.

**Margin arithmetic.** The worst case on schedule is a submission made on day 8 of a month, just after that month's review window. It is first reviewed in the window ten months later and is still under 10 months old (about 9 months 24–30 days), so it survives. It is deleted at the next window, eleven months after the month of submission, at an age under 11 months (about 10.97 months). On-schedule maximum age at deletion is therefore **under 11 months**, a margin of roughly **one month** against the 12-month limit. That margin is the slippage budget: a review can slip about 30 days past its window before any submission could reach 12 months. The 10-month threshold may be changed only by a recorded decision.

### 3.3 Rights and deletion requests (hola@democraciamas.com)

Felipe locates the submission through the **optional email** the person entered in the form, deletes and permanently purges it, and removes copies in the mailbox, exports and other confirmed copies. **A submission without an email cannot be matched to a person**, and the requester is told so. Request intake follows the Notice section 19; no response time is defined by this record.

### 3.4 Explicit non-claims

- Deletion is **not automatic** and no automated deletion service exists.
- No promise is made about Jotform backups or other provider-controlled systems; the Notice states this limit.
- The 12 months is a **maximum enforced by this manual process**. Compliance depends on the procedure being executed.

### 3.5 Evidence logs — **NO RUN RECORDED YET**

Record counts and confirmations only. **No personal submission content, no emails, no names of submitters.**

**Monthly review log — NO RUN RECORDED YET**

| Review date | Responsible person | Submissions deleted (count) | Permanent purge from Trash confirmed | Notification-email cleanup confirmed | Export/copy cleanup confirmed | Late? (days) |
|---|---|---|---|---|---|---|
| | | | | | | |

**Test-round cleanup log**

| Test round | Cleanup date | Responsible person | Test submissions deleted (count) | Permanent purge confirmed | Notification-email cleanup confirmed | Export/copy cleanup confirmed | Status |
|---|---|---|---|---|---|---|---|
| Pre-verification test submissions | PO-reported 2026-10-29 | Felipe Costa | 2 | Trash empty per user-provided screenshot; permanent purge from Jotform internal backups not independently verified | No notification emails received | None | **PO-REPORTED / USER-PROVIDED** (not independently verified) |

## 4. Access and notification target state (PO ATTESTED 2026-10-29 — NOT INDEPENDENTLY AUDITED)

**Approved target state.** Felipe Costa is the only person with access to submissions and the only recipient of submission notifications. Malu coordinates the feedback process without access to submissions.

**Attestation by Felipe Costa (date and statements only; no credentials, no personal data, no submission content).** Felipe attests, with a date, that:

1. there are no other Jotform users, collaborators or teams with access to the account or the form;
2. there are no shared links or public submission views;
3. there are no integrations, auto-forwarding or notification recipients other than Felipe;
4. no API keys are in use.

**2026-10-29 update.** All four statements are PO ATTESTED 2026-10-29. They are not independently audited (the verifying agent had no Jotform account access).

| Statement | Attested? | Date |
|---|---|---|
| No other Jotform users, collaborators or teams | **PO ATTESTED 2026-10-29** | 2026-10-29 |
| No shared links or public submission views | **PO ATTESTED 2026-10-29** | 2026-10-29 |
| No integrations, auto-forwarding or other notification recipients | **PO ATTESTED 2026-10-29** | 2026-10-29 |
| No API keys in use | **PO ATTESTED 2026-10-29** | 2026-10-29 |

The access and notification target state is **PO ATTESTED 2026-10-29, NOT INDEPENDENTLY AUDITED**. An attestation by the account owner is the strongest evidence available without independent account access.

## 5. G5 analysis — SPEC-008 Gate P mapping

**Relationship.** The feedback form is separate from analytics consent (D-035). Feedback is voluntary and not consent-based on analytics. The feedback-specific privacy approval (Felipe Costa on behalf of Democracia+, per the Product Owner) is recorded for G5 purposes only. It does not close, satisfy or pre-empt any SPEC-008 Gate P item and does not change SPEC-008 status.

| Item | Concern | Status |
|---|---|---|
| P1, P2 | Organizational usage metrics: legal basis, consent | PENDING (untouched) |
| P3, P4, P5, P6, P10 | GA4 processing, cookies, Consent Mode, analytics retention, provider-derived data | PENDING (untouched) |
| P7 | Notice and Terms changes and version for the SPEC-008 analytics scope (§10.1) | **PENDING for GA4 scope.** Notice 1.2 is a **feedback-only** addition, approved by the feedback-feature privacy approver. It describes the inert PostHog runtime exactly as 1.1 did and is still not adequate for GA4 or organizational metrics. |
| P8, P9 | PostHog-era re-consent, PostHog data disposal | PENDING (untouched). No re-consent decision is made for GA4. |

Notice §7 ("No enviamos intencionalmente para analítica…") is scoped to analytics and was not edited.

## 6. Published privacy text, versioning and consent decision

### 6.1 Notice 1.2 — PUBLISHED DOCUMENTATION (merged to `main` via PR #8 at `9571399` and deployed; public URL verified live 2026-10-29)

`docs/PRIVACY_NOTICE.md`, version **1.2**, last updated 28 October 2026. Changes:

- New section **17. Comentarios y sugerencias**: voluntary feedback via the external form; Jotform, account operated by FVR Ltd; storage in the United States; what is received (type, text, optional section, optional email; not account, name, organization, page or searches); purposes; access limited to the person responsible for reviewing feedback (no individual named); retention of up to 12 months with permanent deletion through a manual review process; honest limit (deletion covers the Jotform account and copies under our control; backups and provider-held systems are not controlled); recommendation not to include sensitive or unnecessary data or third parties' data; rights and contact `hola@democraciamas.com`, with the optional email used to locate a submission; independent of analytics consent.
- One-line additions in §4 (data), §5 (purposes), §13 (United States), §14 (feedback retention distinct from the analytics 12 months), and a summary line in §25. Section 16 no longer lists Jotform in the umbrella provider list; instead, a separate paragraph discloses Jotform as the recipient of feedback and states that no specific contractual arrangement is claimed.
- Former sections 17–24 are now 18–25. Cross-references ("sección 14", "sección 17") were verified and a test checks them.
- The "contractual measures" sentence in §16 was left unchanged and does not cover Jotform; no Jotform contractual arrangement has been verified.
- No GDPR, adequacy, data-processing-agreement or certification claim; no automatic-deletion or backup-deletion promise; no response-time commitment.

### 6.2 Terms 1.1 — PUBLISHED DOCUMENTATION

`docs/TERMS_OF_USE.md`, version **1.1**, last updated 28 October 2026. Added: a §13 paragraph saying the feedback form is an external, voluntary service, and a §14 list item that the Notice explains feedback handling. Nothing else changed. The Terms stay authenticated-only.

### 6.3 Versioning and consent decision (APPROVED DECISION basis: PRIVACY_UX_CONTRACT §20 and the feature-specific privacy approval; not legal advice)

| Item | Before | After | Reason |
|---|---|---|---|
| `privacyNoticeVersion` (`src/lib/privacy/contract.ts`) | 1.1 | **1.2** | New analytics decisions are recorded against the Notice text actually shown. `tests/privacy-documents.test.ts` already requires the Notice header to equal this constant. |
| Terms version | 1.0 | **1.1** | Document-only. No Terms constant exists in code and none was added. |
| `consentVersion` | 1.1 | **1.1 (unchanged)** | The optional analytics processing (purposes, data categories, provider) is unchanged. `docs/PRIVACY_AND_DATA_COLLECTION.md` stays at 1.1. |
| Re-consent for existing users | — | **None** | See evidence below. |

**Repository evidence checked before applying:**

- `src/lib/privacy/analytics-preference.ts`: the two versions are only **written** by `setAnalyticsPreference` when a user records a decision, and read back into the preference object. No code compares stored versions to the constants or treats an older version as "undecided".
- `supabase/migrations/20261001000100_analytics_preference_persistence.sql`: both columns are non-empty text (1–40 characters). The database does not pin them to a value.
- `docs/PRIVACY_UX_CONTRACT.md` §19: versions exist so it is recoverable which information applied when the user decided. §20: a new Notice version does not automatically invalidate existing preferences; a new affirmative decision is required only when a material change alters the nature of the **optional** processing.
- The feedback form is not analytics and is not consent-based on analytics (D-035). Notice 1.2 adds no analytics purpose, data category or provider. The §20 triggers (new purposes, new categories, raw search, names or emails in analytics, Session Replay, advertising, performance analysis, a materially different provider or model) are not met.
- Nothing contradicted the expected outcome, so no BLOCKED / DECISION REQUIRED was raised.

**Consent impact.** Existing preferences recorded under Notice 1.1 remain valid. Analytics behavior is unchanged. Stored rows keep `privacy_notice_version = "1.1"`; rows written after deployment carry `"1.2"`. This decision is **not** a SPEC-008 decision: the GA4 re-consent question (P8) stays PENDING.

### 6.4 Public Privacy Notice route — PUBLISHED DOCUMENTATION; locally VERIFIED; live production URL VERIFIED CONTROL 2026-10-29

- **Route:** `src/app/privacidad/aviso/page.tsx` at `/privacidad/aviso`, outside `/app`. It reuses `getPrivacyDocument("notice")`, `PrivacyDocumentBody` and `Page`; the text is not copied. `next.config.ts` traces `./docs/PRIVACY_NOTICE.md` for the new route.
- **Why no auth change is needed.** The app layout's `requireAccess()` applies only under `/app`. The `src/proxy.ts` matcher is `["/", "/login", "/auth/callback", "/access-denied", "/app/:path*", "/api/:path*"]`, which does not cover `/privacidad/aviso`. `proxy.ts` and auth code are untouched. The root layout already sets `robots: noindex`.
- **Boundary.** The page imports only the document reader, the document body and the page primitive. It reads no cookie, session, Supabase, preference or analytics module and shows no personal or curriculum data. `tests/privacy-public-notice.test.ts` enforces the import list, the absence of those modules, Notice-only rendering and the tracing entry. The Terms remain authenticated.
- **Rendering.** `next build` lists `/privacidad/aviso` as static (○). It is prerendered at build time, so the Notice text is baked in per deployment.
- **Local anonymous verification (VERIFIED CONTROL, 2026-10-28, `next build` then `next start -p 3917`, no cookies, local server only):**
  - `GET /privacidad/aviso` → `HTTP/1.1 200 OK`, no redirect, no `Set-Cookie`, `Cache-Control: s-maxage=31536000`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`; the body contains "Aviso de Privacidad", "Comentarios y sugerencias", "Jotform", "Estados Unidos" and `noindex`.
  - `GET /app/privacidad/aviso`, `/app/privacidad/terminos` and `/app/library` (no cookies) returned `HTTP/1.1 200 OK` with `cache-control: private, no-store`. The response is streamed: the body carries `NEXT_REDIRECT;replace;/login;307;` and `<meta http-equiv="refresh" content="1;url=/login"/>`, so the browser is sent to `/login` but the HTTP status line is 200, not 307. The `/app/library` body was only the loading shell ("Cargando…") plus the redirect marker; no curriculum content appeared (the local database was not checked for seeded data, so this is not proof of absence of leakage for populated content).
  - **Observation, unchanged code path, not introduced by this unit:** the streamed bodies of `/app/privacidad/aviso` and `/app/privacidad/terminos` also contained the document text itself (the Notice section "Comentarios y sugerencias"; the Terms text "Bienvenido a"). The Terms text is therefore retrievable without authentication from the streamed response of the existing authenticated route, in spite of the redirect. This is not personal or curriculum data, and it was not tested against `main`, but it means "Terms remain authenticated" holds for the browser flow, not for a raw HTTP client. Decision needed only if the Terms must be non-public at the byte level; no action was taken (fixing it needs a change to the authenticated layout/streaming behavior, outside this unit).
  - Raw headers saved at `/tmp/opencode/public-headers.txt` (not committed).
- **Production history.**
  - `GET https://bc.democraciamas.com/privacidad/aviso` returned `404` on 2026-10-28 (read-only), as expected before deployment. The public URL was **not live** at that time.
  - **2026-10-29 public fetch (VERIFIED CONTROL):** `GET https://bc.democraciamas.com/privacidad/aviso` → HTTP/2 200, 0 redirects, `x-matched-path: /privacidad/aviso`, `x-nextjs-prerender: 1`, `Cache-Control: public, max-age=0, must-revalidate`, security headers present (`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`); the body contains "Versión: 1.2", "Última actualización: 28 de octubre de 2026", section "17. Comentarios y sugerencias", mentions Jotform, Estados Unidos, 12 meses, hola@democraciamas.com. Only the Notice text rendered; no application/curriculum/personal content observed.

## 7. Final Jotform form-level disclosure (VERIFIED CONTROL 2026-10-29)

**The live form was NOT modified by this unit.** Jotform UI labels may differ from those used below.

**2026-10-29 update.** Felipe Costa attests that the approved disclosure text (below) was added to the live Jotform form on 2026-10-29 and that the Notice link on the form works. An independent browser reverification of `https://form.jotform.com/263007291660049` on 2026-10-29 ~03:57 UTC (Playwright Chromium, JS-rendered, anonymous, no cookies, locale es-ES; two loads: plain and cache-busted query) observed all 7 lines of the approved text rendered as plain text below the submit button, with the last line hyperlinked to the public Notice URL `https://bc.democraciamas.com/privacidad/aviso`. The extra required "Terms & Conditions" acceptance checkbox observed at ~03:40 UTC is gone. Full method and results: §13.

**Final text (Spanish, plain text; ~7 short lines):**

```text
Usamos este formulario para recibir y responder tus comentarios y mejorar D+ Base Curricular. Es voluntario.
Tu correo electrónico es opcional: indícalo solo si quieres que te contactemos.
Este formulario funciona en Jotform, un proveedor externo, y los datos se almacenan en Estados Unidos.
Conservamos los comentarios hasta 12 meses desde el envío y después los eliminamos de forma permanente mediante una revisión manual.
No incluyas datos personales sensibles ni innecesarios, ni datos de otras personas.
Para ejercer tus derechos de privacidad, escribe a hola@democraciamas.com.
Aviso de Privacidad completo: https://bc.democraciamas.com/privacidad/aviso
```

**Placement.**

- Add one Text / paragraph element (not a question field) either between the intro heading and the first question, or directly above the Submit button.
- Plain text. The last line may be a hyperlink to the URL shown. Do not change, add or remove any question, option, required flag, email field or hidden field.
- Performed by Felipe Costa in the FVR Jotform account.

**Preconditions (all four before the change):**

1. This branch is merged and deployed. **DONE 2026-10-28 (PR #8 `9571399`)**.
2. An anonymous `GET https://bc.democraciamas.com/privacidad/aviso` returns 200 with the "Comentarios y sugerencias" section. **DONE — VERIFIED CONTROL 2026-10-29**.
3. Explicit authorization for the live-form change. **DONE 2026-10-29**.
4. The retention procedure (§3) and Felipe's access/notification attestation (§4) are recorded. **DONE 2026-10-29**.

**After the change, recorded:** the live form was corrected 2026-10-29; independent browser reverification on 2026-10-29 ~03:57 UTC confirmed the approved §7 text is shown and the approved four fields are unchanged — see §13.

## 8. Outstanding manual actions

| # | Action | Owner | Evidence to record |
|---|---|---|---|
| 1 | Review, merge and deploy the privacy-publication branch | Repository owner | **DONE 2026-10-28 — PR #8 merged at `9571399`; public Notice URL verified live 2026-10-29** |
| 2 | Verify the public Notice URL anonymously after deployment (200, feedback section present) | Authorized operator | **DONE 2026-10-29 — HTTP/2 200, no redirect, version 1.2, feedback section present** |
| 3 | Fix the live Jotform form and re-verify in a browser | Felipe Costa | **DONE 2026-10-29** — approved §7 disclosure text is rendered; Notice link points to the public URL; extra required acceptance checkbox removed; independent browser reverification recorded in §13 |
| 4 | Complete the §4 access/notification attestation (API keys; Jotform users/teams/public submission views) | Felipe Costa | **DONE 2026-10-29 — all four statements PO ATTESTED (not independently audited)** |
| 5 | Confirm any pre-existing/test submissions made while setting up the form were deleted and purged (count only) | Felipe Costa | **DONE 2026-10-29 on PO-reported/user-provided evidence** — 2 submissions, Trash empty per user-provided screenshot, no notification emails, no exports (§3.5); not independently verified |
| 6 | Test-round cleanup after each organizational testing round (§3.1) | Felipe Costa | §3.5 test-round log entries |
| 7 | Perform and record the first monthly review (§3.2); next window 1–7 November 2026 per commitment | Felipe Costa | §3.5 monthly log entry |
| 8 | Set Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` and redeploy — **only after explicit production authorization**. Rollback: unset the variable and redeploy | Authorized operator | **READY — AWAITING EXPLICIT PRODUCTION AUTHORIZATION**; no deployment record yet |

## 9. Closure criteria

| Criterion | Required for | Status |
|---|---|---|
| Form URL, fields, provider approved | G4 | **APPROVED DECISION**; fields + URL **VERIFIED CONTROL** (re-observed 2026-10-29) |
| Owner, access and notification decisions | G4 | **APPROVED DECISION** + **PO ATTESTED 2026-10-29** (not audited) |
| Retention period decided and manual procedure approved | G4 | **APPROVED DECISION**; Felipe's responsibility commitment recorded 2026-10-29 |
| Felipe's configuration attestation recorded (§4) | G4 | **PO ATTESTED 2026-10-29** for all four statements (not independently audited) |
| Retention procedure executed (test-round cleanup recorded; first monthly review scheduled) | G4 | **NOT YET APPLICABLE** for scheduled monthly review (no submission can yet be older than 10 months); test-round cleanup for pre-verification submissions **PO-REPORTED/USER-PROVIDED** (§3.5) |
| Form-level privacy wording live on the form | G4 | **VERIFIED CONTROL 2026-10-29** — all 7 lines of approved §7 text observed below the submit button (§13) |
| Form Notice link points to public URL | G4 | **VERIFIED CONTROL 2026-10-29** — link target is `https://bc.democraciamas.com/privacidad/aviso`; direct GET returned HTTP 200 with no redirect (§13) |
| Additional required acceptance checkbox | G4 | **REMOVED — VERIFIED CONTROL 2026-10-29** — no iframe widget, checkbox or widget text observed (§13) |
| Public Notice URL working in production | G4 | **VERIFIED CONTROL 2026-10-29** (HTTP/2 200, no redirect, version 1.2, feedback section present) |
| Privacy authority recorded for the feedback feature | G5 | **APPROVED DECISION** (no written artifact; not a legal opinion) |
| Notice 1.2 and Terms 1.1 published in the repository | G5 | **PUBLISHED DOCUMENTATION** (merged via PR #8 at `9571399`) |
| Publication deployed and verified | G5 | **VERIFIED CONTROL** for the public Notice URL 2026-10-29; Terms 1.1 on the authenticated route were **not independently observed live** (present in the same deployed commit) |
| Versioning and consent decision recorded | G5 | **APPROVED DECISION** (§6.3) |
| SPEC-008 Gate P unaffected | G5 | **VERIFIED CONTROL** (no Gate P item closed or changed; P7 stays PENDING for GA4 scope) |

**G4 is CLOSED** 2026-10-29. Its three previous blockers are resolved and recorded: (1) the approved form-level disclosure wording (§7) is independently verified on the public form; (2) the form's Notice link points to the public URL `https://bc.democraciamas.com/privacidad/aviso`; (3) the additional required acceptance checkbox is removed (not accepted). Resolved by attestation and no longer blockers: §4 access/notification attestation (PO ATTESTED 2026-10-29, not audited); pre-existing/test submission cleanup (PO-reported/user-provided, §3.5). **G5 is CLOSED** 2026-10-29.

**Outcome: G5 CLOSED 2026-10-29; G4 SATISFIED — CLOSED 2026-10-29.**

## 10. What this record does not do

- This 2026-10-29 record does not set the Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` variable, does not trigger a Vercel deployment, does not access the Jotform account, does not submit the form, and does not change the live Jotform form. It records Product Owner attestations and independent browser reverification.
- It closes G4 but does not activate production; G5 is closed as of 2026-10-29.
- It does not close SPEC-010, which stays PLANNED; U5 stays COHERENCE VERIFIED; U0, U1 and U4 remain pending.
- It does not change SPEC-008 status or close any Gate P item, and makes no GA4 re-consent decision.
- It independently verifies the live Jotform form disclosure and field set only to the extent stated in §13; it does not audit the Jotform account configuration, integrations, notification recipients, API keys, users/teams, submission views or backups.
- The Notice and Terms are live as of the PR #8 deployment; the public Notice URL was independently verified on 2026-10-29.
- It is not a legal opinion and makes no GDPR, adequacy, data-processing-agreement or Jotform certification claim.

## 11. Production activation assessment (2026-10-29)

**Prerequisites checked.**

| Prerequisite | Status | Notes |
|---|---|---|
| G4 | **SATISFIED — CLOSED** 2026-10-29 | Three previous blockers resolved and recorded; see §9 table and §13 |
| G5 | **CLOSED** 2026-10-29 | Notice 1.2 live, versioning/consent decision recorded, SPEC-008 Gate P unaffected |
| U5 code coherence | **COHERENCE VERIFIED** (2026-10-28) | External-link action delivered; no code change in this record |
| Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` | **NOT SET** at 2026-10-28 preflight; not re-checked today | Vercel API observed no variable on 2026-10-28; this record did not query Vercel again |
| SPEC-008 analytics activation | **NOT AUTHORIZED** | Separate gate; P7 stays PENDING for GA4 scope |
| Rebuild required after setting variable | Yes | `NEXT_PUBLIC_` is inlined at build time; see `.env.example` and D-035 |
| Rollback procedure | Documented | Unset `NEXT_PUBLIC_FEEDBACK_FORM_URL` and redeploy |
| SPEC-010 other units | U0, U1, U4 pending | Per the §6 table in `resources/specs/planned/010-platform-readiness-organizational-testing.md`, U5 production enablement is gated by G4 and G5 only; U0/U1/U4 do not gate U5 enablement |

**Outcome label:** **FEEDBACK ACTIVATION READY — AWAITING EXPLICIT PRODUCTION AUTHORIZATION.**

**Prerequisites resolved (recorded):**

1. The approved form-level privacy disclosure wording (§7) is independently verified on the public form (§13).
2. The form's Notice link points to the public URL `https://bc.democraciamas.com/privacidad/aviso` (§13).
3. The additional required Jotform "Terms & Conditions" acceptance checkbox is removed (§13).

**Resolved by attestation and no longer blockers (recorded):**

- §4 access/notification attestation completed (PO ATTESTED 2026-10-29, not independently audited).
- Pre-existing/test submission cleanup completed on PO-reported/user-provided evidence (2 submissions, §3.5).

**Future operational obligations that do not block initial activation:**

- First monthly review window: 1–7 November 2026 per the recorded commitment. No submission can yet be older than 10 months, so the first review has nothing to delete; this is a future operational obligation, not an activation blocker.
- Test-round cleanup after each organizational testing round, recorded in §3.5.
- Any change to the 10-month deletion threshold requires a recorded decision.
- Periodic re-check that the form disclosure remains consistent with the Notice.

**Ready when:** The outcome is now **FEEDBACK ACTIVATION READY — AWAITING EXPLICIT PRODUCTION AUTHORIZATION**. A separate explicit authorization is still required to set the Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` variable and redeploy.

---

## 12. G4 final browser verification (2026-10-29)

**Date and time:** 2026-10-29, ~03:40 UTC.

**Agent:** verifying agent, read-only, no submission, no Jotform account access.

**Method.** Playwright Chromium (JS-rendered, anonymous, no cookies, locale es-ES). Three loads of `https://form.jotform.com/263007291660049`: plain, cache-busted query, and `eu.jotform.com` host variant. Inspection of the Jotform widget iframe DOM. `curl`/Playwright of the Notice URLs. Viewport screenshot saved at `/tmp/opencode` (not committed).

**Results against the seven G4 criteria.**

| # | Criterion | Result | Label |
|---|---|---|---|
| 1 | Form loads anonymously without authentication | HTTP 200, title "Comentarios y sugerencia" | VERIFIED CONTROL |
| 2 | Disclosure text visibly rendered ("Usamos este formulario", "proveedor externo", "Estados Unidos", "12 meses", `hola@democraciamas.com`) | Approved §7 wording not observed in rendered DOM or page HTML on any of the three loads | BLOCKER |
| 3 | Provider identified as external (Jotform) | Not disclosed in form-level text; provider inferred only from URL/domain and the Jotform Terms widget | BLOCKER |
| 4 | US storage and 12-month maximum retention disclosed | Not disclosed in form-level text | BLOCKER |
| 5 | Notice link points to `https://bc.democraciamas.com/privacidad/aviso` | Form's only privacy link points to `https://bc.democraciamas.com/app/privacidad/aviso` (authenticated route); public URL itself is accessible (HTTP 200, version 1.2) but is not the link target | BLOCKER |
| 6 | Existing fields and required/optional settings unchanged | Approved four fields match; an additional required Jotform "Terms & Conditions" acceptance checkbox is present and is not in the approved field list | BLOCKER |
| 7 | Approved public Notice URL accessible anonymously | `GET https://bc.democraciamas.com/privacidad/aviso` → HTTP 200, no redirect, "Aviso de Privacidad — D+ Base Curricular", Versión 1.2, updated 28 October 2026 | VERIFIED CONTROL |

**Additional observations.**

- The only privacy element observed on the rendered form was a Jotform "Terms & Conditions" widget (iframe `www.jotform.com/form-widgets/terms-conditions`), rendered in English, with a required checkbox and text "I agree to Aviso de Privacidad. * REQUIRED". Its link target was `https://bc.democraciamas.com/app/privacidad/aviso` (`target="_blank"`). That authenticated route redirects an anonymous browser to `/login` (HTTP status line 200 because of streaming; final page is the login page).
- Field rendering: feedback type as checkboxes (Sugerencia / Problema técnico / Contenido / Otro), free text "Cuéntanos más sobre tu experiencia", section dropdown, optional email. The Jotform honeypot "Should be Empty" recorded 2026-10-28 was not observed in the visible/rendered field list on this run.
- Widget text is rendered by Jotform in English; the verifying agent did not control or configure that.

**Limitations.** No Jotform account access, so hidden/prefill settings, integrations, notifications, API keys, users/teams, submission views and backups were not observable. One rendering browser/locale. The PO attestation of 2026-10-29 (that the approved disclosure is visible and the Notice link works) is recorded in §7 and §4; the independent browser verification above governs the open G4 status.

**Conclusion.** G4 remains **PARTIALLY SATISFIED — OPEN**. U5 is **not ready for production-activation authorization** until the three blockers in §11 are resolved and an agent re-verifies the public form in a browser.

> **Superseded in conclusion by §13.** This §12 record is retained as history. The independent browser reverification performed on 2026-10-29 ~03:57 UTC (§13) found the three blockers resolved and concluded **G4 SATISFIED — CLOSED 2026-10-29**.

---

## 13. G4 browser reverification and closure (2026-10-29)

**Date and time:** 2026-10-29, ~03:57 UTC.

**Agent:** verifying agent, read-only, no submission, no Jotform account access.

**Trigger.** Product Owner confirmation 2026-10-29 that the live form was corrected (disclosure text added, Notice link repointed, extra required checkbox removed). This confirmation is recorded as the trigger for reverification, not as evidence.

**Method.** Playwright Chromium (JS-rendered, anonymous, no cookies, locale es-ES). Two loads of `https://form.jotform.com/263007291660049`: plain and cache-busted query (`?nocache=1`). No cookies; no form submission; no field input. The only click was the Notice link, which opened the public page in a new tab. Direct anonymous `GET` of the public Notice URL was also performed. No Jotform account access.

**Results against the seven G4 criteria.**

| # | Criterion | Result | Label |
|---|---|---|---|
| 1 | Form loads anonymously without authentication | HTTP 200, title "Comentarios y sugerencia" | VERIFIED CONTROL |
| 2 | Disclosure text visibly rendered and matches approved §7 text | All 7 lines of the §7 "Final text" block observed below the submit button; programmatic line-by-line comparison of rendered visible text against the §7 text in this document: 7/7 MATCH; identical in plain and cache-busted loads | VERIFIED CONTROL |
| 3 | Provider identified as external (Jotform) and US storage disclosed | Line 3 of the rendered disclosure states "Este formulario funciona en Jotform, un proveedor externo, y los datos se almacenan en Estados Unidos." | VERIFIED CONTROL |
| 4 | 12-month maximum retention and manual deletion disclosed | Line 4 states "Conservamos los comentarios hasta 12 meses desde el envío y después los eliminamos de forma permanente mediante una revisión manual." | VERIFIED CONTROL |
| 5 | Notice link points to `https://bc.democraciamas.com/privacidad/aviso` | The form's only privacy link is `https://bc.democraciamas.com/privacidad/aviso` (`target="_blank"`, `rel="nofollow"`, visible). Clicking it opened the public URL with no redirect to `/login`. Direct anonymous GET returned HTTP 200, "Aviso de Privacidad — D+ Base Curricular", Versión 1.2, updated 28 October 2026, includes the "Comentarios y sugerencias" section. | VERIFIED CONTROL |
| 6 | Existing fields and required/optional settings unchanged; no extra required acceptance checkbox | Feedback type required (4 checkboxes: Sugerencia / Problema técnico / Contenido / Otro); free text "Cuéntanos más sobre tu experiencia" required; section dropdown optional; email optional. The extra required Jotform "Terms & Conditions" checkbox observed at ~03:40 UTC is gone: no iframe widget, no checkbox outside the four feedback-type options, no widget text. A hidden honeypot input (`name="website"`, `display:none`, 0×0) is present. | VERIFIED CONTROL |
| 7 | Approved public Notice URL accessible anonymously | `GET https://bc.democraciamas.com/privacidad/aviso` → HTTP 200, no redirect, version 1.2, feedback section present | VERIFIED CONTROL |

**Additional observations.**

- Disclosure placement: plain text rendered below the submit button; the last line contains the public Notice URL as a hyperlink.
- Field rendering matches the 2026-10-28/2026-10-29 records: feedback type as four checkboxes, required free-text area, optional section dropdown, optional email input. The honeypot is hidden and 0×0.
- No cache discrepancy: plain load and cache-busted query produced identical visible disclosure text.

**Limitations.** No Jotform account access, so integrations, notification recipients, API keys, users/teams, submission views and backups were not observable. One rendering browser/locale (Playwright Chromium, es-ES). A rendered public page does not prove future edits will not change it; periodic re-check that the form disclosure matches the Notice remains a future obligation. The retention and US-storage claims rest on Product Owner decision/attestation, not independent confirmation of Jotform account configuration. No form submission was performed. This is not a legal opinion.

**Closure assessment.** The three previous G4 blockers are resolved: (1) disclosure wording — independently verified; (2) Notice link — independently verified as the public URL; (3) extra mandatory checkbox — independently verified removed (so the Product Owner decision on it is moot; it was removed, not accepted). Previously resolved on Product Owner attestation or user-provided evidence: access/notification attestation (§4: PO ATTESTED 2026-10-29, not audited) and test-submission cleanup (2 test submissions deleted per Product Owner; user-provided screenshot of empty Trash view; not proof of backup deletion; no IDs/timestamps). The future operational obligations listed below do not block activation.

**Future operational obligations that do NOT block activation.**

- First monthly review window 1–7 November 2026 (no submission can yet be older than 10 months).
- Test-round cleanup after each organizational testing round, recorded in §3.5.
- The §3.5 monthly log remains **NO RUN RECORDED YET**; the test-round entry for the 2 pre-verification submissions already exists and is left as is.
- Periodic re-check that the form disclosure still matches the Notice.
- Any change to the 10-month deletion threshold requires a recorded decision.

**Rollback for activation.** Unset Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` and redeploy; a rebuild is required after setting it because `NEXT_PUBLIC_` variables are inlined at build time.

**Outcome.** **G4 SATISFIED — CLOSED 2026-10-29.** Feedback activation is **READY — AWAITING EXPLICIT PRODUCTION AUTHORIZATION**. The Production `NEXT_PUBLIC_FEEDBACK_FORM_URL` variable was not set and no deployment was performed in this record.
