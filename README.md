# D+ Base Curricular

D+ Base Curricular is a private, shared curriculum-content library for organizations in the Democracia+ network.

The product is designed to help network members discover, contribute, review, publish, and reuse structured curricular knowledge across two initial axes:

1. **Strategy & Campaign**
2. **Evidence-based Public Policy**

It is a library, not a Learning Management System (LMS).

## Project status

**Product state:** baseline confirmed

**Technical state:** application/authentication foundation implemented, locally tested, and independently reviewed

**Delivery state:** SPEC-001 active for its authentication-strategy delta and remaining hosted validation

**Authentication strategy:** the approved MVP authentication experience is **Google OAuth through Supabase Auth (primary)**, with **Email OTP through Supabase Auth (fallback)** — see [`docs/DECISIONS.md`](docs/DECISIONS.md) (D-028). All participating organizations currently use Google Workspace. This changes the authentication UX only; the organization/domain/membership/role authorization model is unchanged. The **currently implemented** authentication flow is **Email OTP only**; Google OAuth is approved but not yet implemented.

SPEC-001 introduces the Next.js application, Supabase authentication and identity schema, server authorization, RLS, and test foundation. That implementation has passed local validation (real Supabase Auth, database policies, and Chromium journeys against the production build) and independent security/RLS review. The SPEC-001 identity migration has also been applied to the intended Supabase Cloud project, with Cloud RLS/grants/ownership/security-definer posture and baseline email/Auth settings inspected there. Google OAuth provider configuration, Google OAuth implementation, hosted OAuth/OTP validation, institutional email delivery, and Vercel deployment remain unverified. The active specification remains in `active/`.

## Documentation

Start with:

- [`docs/README.md`](docs/README.md) — documentation map and authority model
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — product purpose, capabilities, scope, and boundaries
- [`docs/CONTENT_MODEL.md`](docs/CONTENT_MODEL.md) — semantic content model
- [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md) — contribution, review, publication, revision, and archival lifecycle
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

The current active delivery slice is:

[`resources/specs/active/001-application-foundation-authentication.md`](resources/specs/active/001-application-foundation-authentication.md)

Do not implement planned specifications before their dependencies are satisfied and they are promoted to `active/`.

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

User-facing interface copy, navigation, forms, validation messages, emails, review notifications, exports, and default seeded/product content should be presented in Spanish unless a specific product requirement establishes otherwise.

Repository code, identifiers, comments, commits, and technical documentation may remain in English unless the project later adopts a different convention.

Do not translate canonical product labels away from the Spanish UX terminology established by the prototype and product documentation.

## Core product rules

- The application is private and network-only.
- Authentication and product eligibility are separate.
- Published content is visible to all authenticated eligible network users in the MVP.
- Partner-organization contributions require Admin review before publication.
- Published content is edited through new revisions rather than in place.
- Published content is archived rather than destructively deleted.
- The personal itinerary is a private content selection, not a learning trail.
- Authorization must be enforced beyond the UI, including at the server/data boundary.

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

The application needs **no service-role/secret key**. Never put one in a `NEXT_PUBLIC_*` variable. Local status also prints privileged development credentials; those are not application configuration. `.env.local` is ignored by Git.

```sh
npm run dev
```

Open `http://127.0.0.1:3000`. `/app` is protected; `/login` starts email-code (OTP) authentication — the currently implemented flow. Google OAuth is the approved primary method (see [Project status](#project-status)) and is not yet implemented. Local Studio is at `http://127.0.0.1:55323`, and the email inbox is at `http://127.0.0.1:55324`. Ports `55320–55324` avoid conflicts with other local Supabase projects.

### Provision an eligible account

SPEC-001 uses operator-managed provisioning through trusted Supabase administration. No public signup or membership-management UI is implemented. Provisioning authority and the named people allowed to assign Admin remain operational responsibilities of Democracia+; see [`docs/SECURITY.md`](docs/SECURITY.md#19-spec-001-implemented-security-boundaries).

1. Verify the participating organization and institutional address with the network operator.
2. In Studio/Cloud SQL Editor, create an active organization and its exact approved lowercase domains. An organization may have multiple domains; a domain belongs to one organization. Subdomains require their own explicit entry.

   ```sql
   insert into public.organizations (name, is_active)
   values ('Organización de ejemplo', true)
   returning id;

   insert into public.organization_domains (domain, organization_id)
   values ('example.org', '<organization UUID returned above>');
   ```

3. In **Authentication → Users**, create the institutional Auth identity with **Auto Confirm User** enabled. If the dashboard requires a password, generate a random one and discard it; the application uses email codes. Supabase's closed-signup OTP flow requires an already-confirmed identity. Do not insert directly into `auth.users`.
4. Copy the Auth user's UUID and provision an active membership using trusted SQL:

   ```sql
   insert into public.memberships (user_id, organization_id, is_active)
   values ('<Auth user UUID>', '<organization UUID>', true);
   ```

   The role defaults to `Contributor`. Only for an explicitly authorized Democracia+ administrator, a trusted operator may set `role = 'Admin'`. Email domain and user metadata never make this assignment.
5. Request a code from `/login`, read the local inbox (or the institutional mailbox on Cloud), and enter it. A confirmed Auth identity alone still receives no product access without matching active membership/domain/organization records.

Deactivate a membership with `update public.memberships set is_active = false where user_id = '<UUID>';`. Deactivate an organization to deny all its memberships. Revoking a domain or changing the Auth email also affects eligibility on the next request, without waiting for token renewal.

### Database workflow

Migrations live in `supabase/migrations/`. `npm run db:start` applies them on first initialization. To replay from scratch against this disposable local project:

```sh
npm run db:reset
npm run test:db
npm run db:lint
```

`db:reset` deletes local database contents. The SQL tests run in a rollback transaction. No production organizations or users are seeded. After changing `supabase/config.toml`, restart this project's services with `npx supabase stop` and `npm run db:start`. Schema types in `src/lib/supabase/database.types.ts` can be compared with `npx supabase gen types typescript --local` after migrations.

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
- Playwright provisions isolated local fixtures, receives real Auth codes through Mailpit, tests shell/API access and direct Supabase requests, then removes its fixtures. It requires local Supabase on port 55321 and an unused port 3000. Test-only privileged credentials are obtained from the local CLI and never passed to the app/browser. It refuses a non-local Supabase URL.
- `test:e2e:production` builds and runs the same journeys with `next start`, including production Secure-cookie assertions. Chromium treats loopback as trustworthy; hosted deployment must use HTTPS.
- `npm run build` builds independently; `npm run start` serves the build and requires the public environment configuration at runtime.

### Supabase Cloud and Vercel setup

Hosted validation remains required. After independent migration review, link the intended Supabase project and apply the versioned migration:

```sh
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Configure Cloud Auth to match the verified local flow:

- Enable the email provider; disable public signups and anonymous sign-ins. Locally, global `auth.enable_signup=false` disables registration, while `auth.email.enable_signup=true` keeps the email provider enabled (verified CLI behavior).
- Enable email confirmation and double confirmation for email changes.
- Set the email OTP length to 6 digits, expiry to 600 seconds, and resend interval to at least 60 seconds.
- Set the Magic Link email subject to `Tu código de acceso a D+ Base Curricular` and use `supabase/templates/login-code.html` as its body. It displays `{{ .Token }}` rather than a callback link.
- Configure institutional email delivery through Supabase Auth's SMTP settings. SMTP credentials belong in Supabase, not Vercel/browser variables. Verify delivery and rate limits on the intended project; local Mailpit does not prove external delivery.
- Set Site URL to the deployed HTTPS origin. This OTP flow uses no callback route or arbitrary `next` redirect. Keep provider redirects limited to approved origins if later needed.
- Match the local one-hour access-token lifetime and refresh-token rotation. Longer-term session/offboarding policy remains an operational decision in `docs/SECURITY.md`.
- Expose only the `public` API schema; keep `private` unexposed. Provision approved organizations, memberships, and the authorized initial Admin separately.

In Vercel, import the repository using the **Next.js** preset, repository root, Node.js **22.x**, install command `npm ci`, and build command `npm run build`. Supply both `NEXT_PUBLIC_SUPABASE_*` variables for each deployment environment. Redeploy after changing browser-safe build-time variables. Preview environments should point to the intended test project. No `vercel.json`, custom server, Storage bucket, or Resend application integration is needed for this slice.

Before hosted acceptance, verify Contributor/Admin login, denial for an authenticated ineligible identity, direct API/RLS denial, sign-out, session renewal, and account/domain revocation against the deployed origin. No hosted deployment is claimed by the local test results.

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
