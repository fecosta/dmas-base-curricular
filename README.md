# D+ Base Curricular

D+ Base Curricular is a private, shared curriculum-content library for organizations in the Democracia+ network.

The product helps network members discover and reuse structured curricular knowledge across two initial axes:

1. **Strategy & Campaign**
2. **Evidence-based Public Policy**

Governed curriculum content is currently managed by authorized Admins. Eligible non-Admin users consume current published content.

It is a library, not a Learning Management System (LMS).

## Project status

**Product state:** baseline confirmed; D-030 establishes the initial Admin-only governed-content model

**Technical state:** SPEC-001 through SPEC-007 are completed. SPEC-009's implementation is delivered in four feature commits, independent implementation review returned `PUSH READY`, migration `20260917000100` is applied to the intended Supabase Cloud project with its RPC/security/grants/RLS and audit protections verified there, the server-only Auth Admin credential is configured in Vercel Production, and the reviewed implementation is deployed with safe hosted validation passing. SPEC-009 remains active pending final coherence closure.

**Delivery state:** SPEC-003 — Content Contribution remains completed historical implementation foundation. SPEC-004 — Admin Content Management & Publication is completed at [`resources/specs/completed/004-admin-content-management-publication.md`](resources/specs/completed/004-admin-content-management-publication.md) after independent phase review, controlled local multi-user acceptance, Cloud migration/security verification, and production deployment verification. SPEC-006 — Explorer UX/UI Fidelity & Interaction Layer is completed at [`resources/specs/completed/006-explorer-ux-ui-fidelity.md`](resources/specs/completed/006-explorer-ux-ui-fidelity.md) after independent phase reviews, Phase 6 validation, and final independent review. SPEC-007 — UX/UI Navigation & Interaction Remediation is completed at [`resources/specs/completed/007-ux-ui-navigation-interaction-remediation.md`](resources/specs/completed/007-ux-ui-navigation-interaction-remediation.md) after independent coherence verification. SPEC-009 — Admin Organization & User Management has passed independent implementation review, Cloud migration/security verification, and safe hosted validation; it remains active only pending final coherence closure. Hosted destructive mutation/provisioning flows were intentionally not exercised because production has no designated safe fixture; that evidence rests on local real-stack validation plus Cloud structural verification. SPEC-008 remains planned and depends on SPEC-009's closure.

**Authentication strategy:** the implemented MVP authentication experience is **Google OAuth through Supabase Auth (primary)**, with **Email OTP through Supabase Auth (fallback)** — see [`docs/DECISIONS.md`](docs/DECISIONS.md) (D-028). All participating organizations currently use Google Workspace. This changes the authentication UX only; the organization/domain/membership/role authorization model remains authoritative.

SPEC-001 introduces the Next.js application, Supabase authentication and identity schema, server authorization, RLS, and test foundation. That foundation passed local validation (real Supabase Auth, database policies, and Chromium journeys against the production build) and independent security/RLS review. The Google OAuth initiation, fixed callback, server-side PKCE exchange, and shared post-authentication access boundary are implemented and were first locally tested at the application/provider-independent layers. The SPEC-001 identity migration has also been applied to the intended Supabase Cloud project, with Cloud RLS/grants/ownership/security-definer posture inspected there. The application is deployed to Vercel at `https://dmas-base-curricular.vercel.app`, and hosted validation has since confirmed: a real Google OAuth round trip (first-time identity creation and eligible Admin access), ineligible-identity denial (redirect to `/access-denied` and `/api/access` 403), live membership revocation taking effect without waiting for token refresh, hosted sign-out, and Email OTP delivery through custom SMTP (Resend, verified domain `auth.democraciamas.com`) converging on the same eligibility model as Google OAuth. A real hosted adversarial test also confirmed that Supabase transitions a pre-created unconfirmed email/password identity to Google on first legitimate Google sign-in, so the previously hypothesized pre-account-takeover mechanism was not reproduced. Long-duration session-expiry/renewal behavior, browser coverage beyond Chromium, an OTP pre-registration variant that authenticates without ever completing Google OAuth first, and operational rate-limit monitoring remain open follow-ups; see the completed spec for detail.

SPEC-002 provides the current-published curriculum reader and stable identity/revision persistence.

SPEC-005 completes the governance lifecycle with Admin-only, identity-level archival and restoration plus a bounded lifecycle-history boundary. `Archived` is not a revision status: archiving preserves the `Published` revision and its current pointer, blocks on an active Draft or an active current-published dependent, never cascades, and revalidates dependencies on restore. Its two migrations are applied to the intended Supabase Cloud project, where the final RPC signatures, `SECURITY DEFINER`/`search_path`/ownership, grants, unchanged RLS, lifecycle-event protection and the non-archived governed-attachment reader gate were verified. Functional Archive/Restore/History acceptance ran on the complete local real stack — real Supabase Auth, PostgreSQL, RLS, Storage, Next.js and Chromium — and is deliberately not represented as hosted production validation. Production functional mutation was avoided because production holds real organizations and Admin identities and `curriculum_lifecycle_events` is append-oriented governance evidence; manufacturing test archive/restore actions under real actors would write permanent, misleading audit history. See `docs/DECISIONS.md` (G-005).

SPEC-003 provides verified contribution, provenance, pending-revision, lifecycle-event, and private-attachment foundations. D-030 supersedes Contributor authoring as active product behavior but does not erase SPEC-003 implementation history.

SPEC-006 — Explorer UX/UI Fidelity & Interaction Layer is implemented across its six phases and independently reviewed. It brings the interface to the approved Explorer direction without touching product, authorization, governance, data or security contracts: an Explorer-style application shell with compact and mobile navigation and a header Library search; the Library as a filter column beside results, collapsing to an accessible filter drawer at narrow widths, with `Grilla` and `Programa`; grouped, keyboard-operable search suggestions served over an authenticated boundary that returns only current published content; a contextual module overlay that preserves the canonical `/app/library/modules/[id]` URL, so direct visits, reloads, Back and Forward all stay coherent; and the same Explorer language applied to Admin content management. No migration, RLS policy, RPC, Storage rule or role changed, and the production build exposes no development-only route.

## Documentation

Start with:

- [`docs/README.md`](docs/README.md) — documentation map and authority model
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product purpose, capabilities, scope, and boundaries
- [`docs/CONTENT_MODEL.md`](docs/CONTENT_MODEL.md) — semantic content model
- [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) — active Admin publication, revision, and archival governance
- [`docs/SECURITY.md`](docs/SECURITY.md) — access, authorization, RLS, auditability, and data protection
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — approved technical architecture
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — durable decision register

AI coding agents and contributors must also read [`AGENTS.md`](AGENTS.md).

## Specifications

Implementation work is governed by `resources/specs/`.

```text
resources/specs/
├── README.md
├── active/
├── planned/
└── completed/
```

The most recently completed specification is:

[`resources/specs/completed/007-ux-ui-navigation-interaction-remediation.md`](resources/specs/completed/007-ux-ui-navigation-interaction-remediation.md)

SPEC-009 — Admin Organization & User Management is active at [`resources/specs/active/009-admin-organization-user-management.md`](resources/specs/active/009-admin-organization-user-management.md). Independent implementation review, the Cloud migration/security gate, and safe hosted validation have all passed; SPEC-009 remains active only pending final coherence closure. SPEC-008 — Product Analytics & Pilot Observability is planned and follows SPEC-009.

## Initial stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Row Level Security
- Supabase Storage
- Resend
- PostgreSQL full-text search + SQL filters
- Vitest
- Playwright
- Vercel
- Supabase Cloud

Strapi was evaluated as a possible CMS and is not part of the MVP architecture.

## Product language

**Spanish is the primary language of the platform.**

User-facing interface copy, navigation, forms, validation messages, Admin content-management surfaces, exports, and default seeded/product content should be presented in Spanish unless a specific product requirement establishes otherwise.

Repository code, identifiers, comments, commits, and technical documentation may remain in English unless the project later adopts a different convention.

Do not translate canonical product labels away from the Spanish UX terminology established by the prototype and product documentation.

## Core product rules

- The application is private and network-only.
- Authentication and product eligibility are separate.
- Current published content is visible to all eligible authenticated network users in the MVP.
- Governed curriculum creation, editing, revision creation, attachment mutation, and publication are Admin-only during the initial operational phase.
- Any currently eligible Admin may manage any active Admin Draft regardless of original creator.
- `created_by` remains provenance, not exclusive Admin ownership.
- Non-Admin users are read-only consumers of governed curriculum content.
- Published content is edited through new revisions rather than in place.
- Published content is archived rather than destructively deleted.
- The personal itinerary is a private content selection, not a learning trail.
- Authorization must be enforced beyond the UI, including at the server/data boundary.
- Collaborative contribution/review is deferred and requires a later explicit product decision.

See `docs/` for the complete contracts.

## Development

### Local setup

Requirements: Node.js 22.12+ (22.x), npm, and a running Docker daemon for local Supabase. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run db:start
cp .env.example .env.local
npx supabase status
```

Set `.env.local` using the local status output:

| Variable | Value | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:55321` locally; the project's HTTPS URL on Cloud | Browser-safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `PUBLISHABLE_KEY` from local status or Cloud project settings (local `ANON_KEY` also supported) | Browser-safe |
| `APP_URL` | `http://127.0.0.1:3000` locally; the exact deployed HTTPS origin on Vercel | Server runtime, not secret |
| `SUPABASE_AUTH_ADMIN_SECRET_KEY` | `SECRET_KEY` from local status or the modern Supabase secret key for the project | Server runtime secret; Auth Admin only |

The ordinary application client remains publishable-key based. The separate `SUPABASE_AUTH_ADMIN_SECRET_KEY` is used only by the `server-only` Auth Admin boundary for identity lookup and creation after live Admin authorization; it does not perform database reads or writes. Never put it in a `NEXT_PUBLIC_*` variable or expose it to a Client Component. Local status also prints privileged development credentials; only the Auth Admin secret belongs in this server-only application variable. `.env.local` is ignored by Git.

Production uses a modern Supabase publishable key for browser-safe application access and a modern `sb_secret_*` key in `SUPABASE_AUTH_ADMIN_SECRET_KEY` for the bounded Auth Admin operations. Privileged operator tasks such as the trusted curriculum importer continue using their separate, uncommitted `SUPABASE_SECRET_KEY` convention. Neither secret is public application configuration. Legacy anon/service-role API keys are disabled on the production project.

```sh
npm run dev
```

Open `http://127.0.0.1:3000`. `/app` is protected; `/login` presents Google OAuth first and email-code (OTP) authentication as fallback. A real local Google round trip requires separate local Google credentials and provider configuration; without them, use the tested OTP fallback. Local Studio is at `http://127.0.0.1:55323`, and the email inbox is at `http://127.0.0.1:55324`. Ports `55320–55324` avoid conflicts with other local Supabase projects.

The committed local configuration allows Auth identity creation but intentionally leaves the Google provider disabled because no Google credentials are committed. To exercise Google locally, create a separate Google Web OAuth client with `http://127.0.0.1:55321/auth/v1/callback` as an authorized redirect URI, put `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` in ignored `supabase/.env`, and add the provider block below to `supabase/config.toml` while testing. Restart Supabase after changing it. Do not commit the real Client ID or Secret.

```toml
[auth.external.google]
enabled = true
client_id = "<local Google Web client ID>"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

### Bootstrap the first eligible Admin account

The first eligible Admin still requires trusted operator bootstrap. After that Admin is established, routine organization/domain and member management is available in the authenticated Admin surfaces at `/app/organizations` and `/app/users`; those surfaces do not set passwords, edit login emails, or create membership from domain alone. Provisioning authority and the people allowed to assign Admin remain operational responsibilities of Democracia+; see [`docs/SECURITY.md`](docs/SECURITY.md).

1. Verify the participating organization and institutional address with the network operator.
2. In Studio/Cloud SQL Editor, create an active organization and its exact approved lowercase domains. An organization may have multiple domains; a domain belongs to one organization. Subdomains require their own explicit entry.

   ```sql
   insert into public.organizations (name, is_active)
   values ('Organización de ejemplo', true)
   returning id;

   insert into public.organization_domains (domain, organization_id)
   values ('example.org', '<organization UUID returned above>');
   ```

3. For OTP-only provisioning, first check whether the institutional email already exists in **Authentication → Users**.

   - If no Auth identity exists, create the institutional Auth identity with **Auto Confirm User** enabled. If the dashboard requires a password, generate a random one and discard it; the application uses email OTP.
   - If an existing identity is unconfirmed or was not created through the expected operator workflow, do **not** confirm or reuse it as-is. Treat it as untrusted and either remove/recreate it through the trusted provisioning flow or have the user authenticate with Google first.
   - Never grant membership or an Admin role to an unexplained pre-existing Auth identity.

   Do not insert directly into `auth.users`.

4. After independently verifying the initial Admin and institutional address, copy the Auth user's UUID and provision the bootstrap Admin membership using trusted SQL:

   ```sql
   insert into public.memberships (user_id, organization_id, is_active)
   values ('<Auth user UUID>', '<organization UUID>', true);
   ```

   The role defaults to `Contributor`. Under D-030 this means eligible non-Admin reader access for governed content. Only for an explicitly authorized Democracia+ administrator may the bootstrap operator set `role = 'Admin'`. Email domain and user metadata never make this assignment.
5. Request a code from `/login`, read the local inbox (or the institutional mailbox on Cloud), and enter it. A confirmed Auth identity alone still receives no product access without matching active membership/domain/organization records.

After the bootstrap Admin can sign in, use **Organizaciones** to create organizations and manage multiple approved domains, and **Usuarios** to provision users, assign domain-compatible organizations, change the two canonical roles, and activate/deactivate memberships. New Auth identities created by this flow receive a server-controlled trusted-provisioning marker, then receive an explicit membership through the Admin-authorized database RPC. Existing confirmed identities are reused only when verified through Google or carrying that trusted marker; unexplained email-only identities must first use the verified Google OAuth path. If Auth identity creation succeeds but membership creation fails, the identity remains without product access and retry reuses it.

Deactivate a membership with `update public.memberships set is_active = false where user_id = '<UUID>';`. Deactivate an organization to deny all its memberships. Revoking a domain, changing the Auth email, or revoking Admin role affects authority on the next authoritative request.

### Database and Storage workflow

Migrations live in `supabase/migrations/`. `npm run db:start` applies them on first initialization. To replay from scratch against this disposable local project:

```sh
npm run db:reset
npm run test:db
npm run db:lint
```

`db:reset` deletes local database and Storage contents. The SQL tests run in a rollback transaction. No production organizations, users, modules, or references are seeded; only the two approved curriculum axes are persisted by migration. Local Storage is enabled and the SPEC-003 migration creates the private `governed-attachments` bucket with a 3 MiB per-file limit and a document MIME allowlist. After changing `supabase/config.toml`, restart this project's services with `npx supabase stop` and `npm run db:start`. Schema types in `src/lib/supabase/database.types.ts` can be compared with `npx supabase gen types typescript --local` after migrations. The trusted curriculum-import workflow is documented in `resources/curriculum/README.md`.

### Validation commands

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
npm run db:lint
npx playwright install chromium
npm run test:e2e
npm run test:e2e:production
git diff --check
```

- Vitest covers server authorization orchestration, form validation, manipulated inputs, and configuration boundaries.
- pgTAP tests exercise real SQL grants, RLS, eligibility, role separation, and revocation with `anon`/`authenticated` roles.
- Playwright provisions local fixtures, receives real Auth codes through Mailpit, and tests shell/API access and direct Supabase requests. Each Admin organization/user E2E run creates a unique local Admin actor in a shared fixture organization. These actors are retained because append-only access-administration audit rows reference them (`ON DELETE RESTRICT`); target users and organizations are cleaned up. Repeated local runs therefore leave additional synthetic Admin identities and audit rows. The suite requires local Supabase on port 55321 and an unused application port (3000 by default; override with `E2E_PORT`). Test-only privileged credentials are obtained from the local CLI and never passed to browser code. It refuses a non-local Supabase URL.
- `test:e2e:production` builds and runs the same journeys with `next start`, including production Secure-cookie assertions. Chromium treats loopback as trustworthy; hosted deployment must use HTTPS.
- `npm run build` builds independently; `npm run start` serves the build and requires the public environment configuration at runtime.

### Supabase Cloud and Vercel setup

Hosted validation has been completed against the intended Supabase Cloud project and the deployed Vercel application. After independent migration review, link the intended Supabase project and apply the versioned migration:

```sh
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Configure Cloud Auth for the implemented provider strategy:

- Enable new Auth-user creation, which is required for a first-time Google OAuth identity, and keep anonymous sign-ins disabled. Auth identity creation is not product signup: no membership, organization association, or role is created, and `current_access()` still denies product access by default.
- Enable Google in **Authentication → Providers → Google** and enter the Google Web OAuth Client ID and Secret there. These credentials belong in Supabase, never in Vercel or browser code.
- In Google Auth Platform, configure the Web client and use the Supabase callback shown by the provider screen as an authorized redirect URI, normally `https://<project-ref>.supabase.co/auth/v1/callback`. Add the deployed application origin as an authorized JavaScript origin.
- Set the Supabase Site URL to the exact deployed HTTPS origin and add `https://<application-origin>/auth/callback` to the redirect allow list. The application always supplies this fixed callback and always returns successful exchanges to `/app`; it accepts no caller-selected destination.
- Enable the email provider for fallback. The application calls `signInWithOtp` with `shouldCreateUser: false`, so its OTP request does not create an unknown identity even though Auth identity creation is enabled for Google.
- Enable email confirmation and double confirmation for email changes.
- Set the email OTP length to 6 digits, expiry to 600 seconds, and resend interval to at least 60 seconds.
- Set the Magic Link email subject to `Tu código de acceso a D+ Base Curricular` and use `supabase/templates/login-code.html` as its body. It displays `{{ .Token }}` rather than a callback link.
- Configure institutional email delivery through Supabase Auth's SMTP settings. SMTP credentials belong in Supabase, not Vercel/browser variables. Verify delivery and rate limits on the intended project; local Mailpit does not prove external delivery.
- Match the local one-hour access-token lifetime and refresh-token rotation. Longer-term session/offboarding policy remains an operational decision in `docs/SECURITY.md`.
- Expose only the `public` API schema; keep `private` unexposed. Provision approved organizations, memberships, and the authorized initial Admin separately.

In Vercel, import the repository using the **Next.js** preset, repository root, Node.js **22.x**, install command `npm ci`, and build command `npm run build`. Supply both `NEXT_PUBLIC_SUPABASE_*` variables, the exact HTTPS `APP_URL` origin, and `SUPABASE_AUTH_ADMIN_SECRET_KEY` as a server-only environment variable for each application environment. Redeploy after changing browser-safe build-time variables. Every preview origin used for OAuth needs its own exact `APP_URL` and Supabase redirect-allow-list entry; do not use an arbitrary redirect wildcard. Preview environments should point to the intended test project. The Auth Admin secret is never a database client credential in application code; ordinary database access continues through the publishable-key SSR client and the narrow Admin RPCs.

Migration `20260917000100_admin_organization_user_management.sql` is applied to Supabase Cloud. The remote ledger reports it applied with no drift. Cloud verification confirmed the twelve Admin RPC signatures/owners/`SECURITY DEFINER`/empty `search_path`/`authenticated`-only `EXECUTE`, `postgres`-only `private` helpers, RLS plus `SELECT`-only client grants on `organizations`/`organization_domains`/`memberships`, no client grant on `access_administration_events`, `42501` refusal of every direct `authenticated`/`anon` table mutation and of non-Admin RPC calls (including forged elevated JWT claims), and `55000` append-only rejection of audit `UPDATE`/`DELETE`. `SUPABASE_AUTH_ADMIN_SECRET_KEY` is configured in Vercel Production as a server-only secret holding the project's modern `sb_secret_*` key and is absent from the full `.next/static` client bundle and from every chunk served by the deployed Admin routes. `main @ 80cd776` is deployed and aliased to the production origin with clean build and runtime logs, and unauthenticated `/app/organizations` and `/app/users` requests are refused server-side with a `307` redirect to `/login`.

Hosted destructive mutation was intentionally **not** exercised. Production holds three Admin memberships, no Contributor identity, and no designated safe test organization or user, so mutation, provisioning, partial-failure, and audit-append behaviour rests on the local real-stack evidence plus the Cloud structural verification above. The production inventory is unchanged after the gate, including zero access-administration events. Exercising those journeys against hosted infrastructure requires a designated safe staging fixture. `SUPABASE_AUTH_ADMIN_SECRET_KEY` is set for Production only; add it to Preview before using Admin provisioning from a preview deployment.

Hosted acceptance has exercised, against the deployed origin (`https://dmas-base-curricular.vercel.app`): a real first-time Google sign-in, approved-domain/no-membership denial (redirect to `/access-denied` and `/api/access` 403), eligible Admin access with persisted user/organization/role context, the Email OTP fallback (including institutional SMTP delivery via Resend), live membership revocation without waiting for token refresh (and restoration), and hosted sign-out. A real hosted adversarial pre-account-takeover test was also performed and did not reproduce the previously hypothesized Google-linking vulnerability. Long-duration session-expiry/renewal behavior, browser coverage beyond Chromium, an OTP pre-registration variant that never completes Google OAuth first, and operational rate-limit monitoring were not part of this validation pass and remain open follow-ups.

SPEC-004 is Cloud-applied and closed. Multi-user and disposable-content acceptance was completed against the real local Supabase/application/browser stack because production lacked two safe Admin accounts plus a reader and had no supported cleanup lifecycle for fictional Published curriculum. The intended Cloud project separately passed preservation inventory, migration, schema/RLS/grant/function/Storage verification, and private-bucket inspection; production deployment of the corresponding application commit and safe anonymous smoke behavior were also verified. This controlled local acceptance is not represented as hosted production validation.

## Git

Use the repository's configured Git author as the sole author.

Use Conventional Commits:

- `feat:`
- `fix:`
- `chore:`
- `docs:`
- `refactor:`
- `test:`

Do not add AI `Co-Authored-By` metadata.

## Implementation workflow

For each active specification:

1. read `AGENTS.md`, the authoritative `docs/`, and the active spec;
2. inspect current repository state;
3. implement only the active bounded scope;
4. run relevant validation;
5. report actual results;
6. independently review implementation against the spec;
7. reconcile durable documentation;
8. move the spec to `completed/` only after verification.

If implementation requires changing an established product contract, stop and return:

`BLOCKED / DECISION REQUIRED`
