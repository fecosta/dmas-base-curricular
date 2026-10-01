-- SPEC-008 Phase 1: user-owned optional-analytics preference.
--
-- Absence of a row is the `undecided` state, so no backfill is required or
-- wanted: writing rows for existing users would fabricate decisions nobody
-- made. `analytics_enabled = false` is `rejected` and `true` is `accepted`.
--
-- The preference belongs to the authenticated user. There is deliberately no
-- Admin surface over this table: an Admin must not be able to read or change
-- another user's analytics choice, so no SECURITY DEFINER function here accepts
-- a subject argument. Every operation derives its subject from auth.uid().
create table public.analytics_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  analytics_enabled boolean not null,
  analytics_decided_at timestamptz not null default clock_timestamp(),
  privacy_notice_version text not null check (length(btrim(privacy_notice_version)) between 1 and 40),
  consent_version text not null check (length(btrim(consent_version)) between 1 and 40),
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.analytics_preferences enable row level security;

-- Mutation goes through the RPC below, as everywhere else in this schema. No
-- ordinary write policy and no write grant exists, so a compromised browser
-- session cannot reach the row directly.
--
-- service_role keeps SELECT but deliberately no write privilege. Read access
-- supports operator fulfilment of a privacy-rights request; a write path would
-- be exactly the "organization or Admin enables analytics on another user's
-- behalf" that the product forbids, so it stays structurally absent rather than
-- merely unimplemented. Only the row's own live owner can record a decision.
revoke all on public.analytics_preferences from public, anon, authenticated, service_role;
grant select on public.analytics_preferences to authenticated, service_role;

-- Mirrors the identity policies: own row, and only while the identity is still
-- live and eligible. An Admin session resolves to its own user_id like any other.
create policy "Eligible user reads own analytics preference"
on public.analytics_preferences for select to authenticated
using (user_id = (select auth.uid()) and user_id in (select a.user_id from private.current_access() a));

-- Eligible-authenticated access of any product role. The SPEC-003-era
-- require_contribution_access() helper now carries Admin-only authority, so it
-- cannot gate a preference every eligible reader owns.
create function private.require_eligible_access()
returns table (user_id uuid, organization_id uuid)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  return query select access.user_id, access.organization_id from private.current_access() access;
  if not found then
    raise exception 'eligible authenticated access required' using errcode = '42501';
  end if;
end;
$$;

-- Records the caller's own analytics decision. Takes no subject: the row
-- written is always auth.uid()'s, which is what makes Admin override
-- impossible rather than merely unimplemented.
create function public.set_analytics_preference(
  requested_analytics_enabled boolean,
  requested_privacy_notice_version text,
  requested_consent_version text
)
returns table (
  analytics_enabled boolean,
  analytics_decided_at timestamptz,
  privacy_notice_version text,
  consent_version text,
  updated_at timestamptz
)
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  notice_version text := btrim(requested_privacy_notice_version);
  consent text := btrim(requested_consent_version);
begin
  select * into access from private.require_eligible_access();
  if requested_analytics_enabled is null then
    raise exception 'an explicit analytics decision is required' using errcode = '22023';
  end if;
  if notice_version is null or length(notice_version) not between 1 and 40
     or consent is null or length(consent) not between 1 and 40 then
    raise exception 'privacy and consent versions are required' using errcode = '22023';
  end if;

  return query
  insert into public.analytics_preferences as preference (
    user_id, analytics_enabled, privacy_notice_version, consent_version
  ) values (
    access.user_id, requested_analytics_enabled, notice_version, consent
  )
  on conflict (user_id) do update set
    analytics_enabled = excluded.analytics_enabled,
    analytics_decided_at = clock_timestamp(),
    privacy_notice_version = excluded.privacy_notice_version,
    consent_version = excluded.consent_version,
    updated_at = clock_timestamp()
  returning
    preference.analytics_enabled, preference.analytics_decided_at,
    preference.privacy_notice_version, preference.consent_version, preference.updated_at;
end;
$$;

revoke all on function private.require_eligible_access() from public, anon, authenticated, service_role;
revoke all on function public.set_analytics_preference(boolean, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.set_analytics_preference(boolean, text, text) to authenticated;
