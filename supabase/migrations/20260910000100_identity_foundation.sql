-- SPEC-001: operator-managed organizations and memberships, no curriculum data.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.product_role as enum ('Contributor', 'Admin');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  is_active boolean not null default false
);

create table public.organization_domains (
  domain text primary key check (
    length(domain) <= 253 and
    domain = lower(domain) and
    domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'
  ),
  organization_id uuid not null references public.organizations(id) on delete restrict
);
create index organization_domains_organization_idx on public.organization_domains(organization_id);

create table public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  role public.product_role not null default 'Contributor',
  is_active boolean not null default false
);
create index memberships_organization_idx on public.memberships(organization_id);

alter table public.organizations enable row level security;
alter table public.organization_domains enable row level security;
alter table public.memberships enable row level security;

-- Bypasses only these identity-table RLS reads to avoid recursive policies.
-- No caller-supplied subject, dynamic SQL, metadata roles, or JWT email claims.
-- Empty search_path and qualified names prevent object substitution.
create function private.current_access()
returns table (
  user_id uuid,
  organization_id uuid,
  organization_name text,
  role public.product_role
)
language sql stable security definer
set search_path = ''
as $$
  select m.user_id, o.id, o.name, m.role
  from public.memberships m
  join public.organizations o on o.id = m.organization_id
  join auth.users u on u.id = m.user_id
  join public.organization_domains d on d.organization_id = o.id
    and d.domain = lower(split_part(u.email, '@', 2))
  where m.user_id = (select auth.uid())
    and m.is_active and o.is_active
    and u.email_confirmed_at is not null
    and u.email ~ '^[^[:space:]@]+@[^[:space:]@]+$'
    and u.deleted_at is null
    and not coalesce(u.is_anonymous, false)
    and (u.banned_until is null or u.banned_until <= now());
$$;
revoke all on function private.current_access() from public, anon, authenticated;
grant execute on function private.current_access() to authenticated;

-- The public RPC is invoker-security and exposes only the caller's eligible context.
create function public.current_access()
returns table (
  user_id uuid,
  organization_id uuid,
  organization_name text,
  role public.product_role
)
language sql stable security invoker
set search_path = ''
as $$ select * from private.current_access(); $$;
revoke all on function public.current_access() from public, anon, authenticated;
grant execute on function public.current_access() to authenticated;

create function public.is_admin()
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select exists (select 1 from private.current_access() where role = 'Admin');
$$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- Even Admin has no client write authority over identity/eligibility configuration.
-- Managed through trusted SQL/operational provisioning in this foundation slice.
revoke all on public.organizations, public.organization_domains, public.memberships
  from public, anon, authenticated;
grant select on public.organizations, public.organization_domains, public.memberships to authenticated;

create policy "Eligible user reads own membership"
on public.memberships for select to authenticated
using (user_id = (select auth.uid()) and user_id in (select a.user_id from private.current_access() a));

create policy "Eligible user reads own organization"
on public.organizations for select to authenticated
using (id in (select a.organization_id from private.current_access() a));

create policy "Eligible user reads own approved domains"
on public.organization_domains for select to authenticated
using (organization_id in (select a.organization_id from private.current_access() a));
