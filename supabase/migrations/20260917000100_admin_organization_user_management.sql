-- SPEC-009 Phase 1: bounded live-Admin operations and separate access audit.

create table public.access_administration_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default clock_timestamp(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  actor_organization_id uuid not null references public.organizations(id) on delete restrict,
  action text not null check (action in (
    'organization_created',
    'organization_updated',
    'organization_activated',
    'organization_deactivated',
    'organization_domain_added',
    'organization_domain_removed',
    'membership_created',
    'membership_organization_changed',
    'membership_role_changed',
    'membership_activated',
    'membership_deactivated'
  )),
  target_user_id uuid,
  target_organization_id uuid,
  previous_state jsonb,
  resulting_state jsonb,
  check (previous_state is null or jsonb_typeof(previous_state) = 'object'),
  check (resulting_state is null or jsonb_typeof(resulting_state) = 'object')
);

create index access_administration_events_occurred_idx
  on public.access_administration_events (occurred_at desc, id desc);
create index access_administration_events_target_user_idx
  on public.access_administration_events (target_user_id, id desc)
  where target_user_id is not null;

alter table public.access_administration_events enable row level security;
revoke all on public.access_administration_events from public, anon, authenticated, service_role;

create function private.reject_access_administration_event_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'access-administration events are append-only' using errcode = '55000';
end;
$$;

create trigger access_administration_events_append_only
  before update or delete on public.access_administration_events
  for each row execute function private.reject_access_administration_event_mutation();

create function private.normalize_organization_domain(requested_domain text)
returns text
language plpgsql immutable
set search_path = ''
as $$
declare normalized_domain text := lower(btrim(requested_domain));
begin
  if normalized_domain is null
     or length(normalized_domain) > 253
     or normalized_domain !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' then
    raise exception 'invalid approved email domain' using errcode = '22023';
  end if;
  return normalized_domain;
end;
$$;

create function private.is_trusted_auth_identity(requested_user_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users identity
    where identity.id = requested_user_id
      and identity.email_confirmed_at is not null
      and identity.email ~ '^[^[:space:]@]+@[^[:space:]@]+$'
      and identity.deleted_at is null
      and not coalesce(identity.is_anonymous, false)
      and (identity.banned_until is null or identity.banned_until <= now())
      and (
        coalesce(identity.raw_app_meta_data->'providers', '[]'::jsonb) ? 'google'
        or identity.raw_app_meta_data->>'spec009_trusted_provisioning' = 'true'
      )
  );
$$;

create function public.list_admin_organizations()
returns table (
  organization_id uuid,
  organization_name text,
  is_active boolean,
  approved_domains text[],
  member_count bigint
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform 1 from private.require_admin_content_access();
  return query
    select organization.id, organization.name, organization.is_active,
      coalesce(domain_set.domains, array[]::text[]), coalesce(member_set.member_count, 0)::bigint
    from public.organizations organization
    left join lateral (
      select array_agg(domain.domain order by domain.domain) as domains
      from public.organization_domains domain
      where domain.organization_id = organization.id
    ) domain_set on true
    left join lateral (
      select count(*) as member_count
      from public.memberships membership
      where membership.organization_id = organization.id
    ) member_set on true
    order by lower(organization.name), organization.id;
end;
$$;

create function public.list_admin_organization_members(requested_organization_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.product_role,
  is_active boolean
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform 1 from private.require_admin_content_access();
  return query
    select membership.user_id, identity.email::text, membership.role, membership.is_active
    from public.memberships membership
    join auth.users identity on identity.id = membership.user_id
    where membership.organization_id = requested_organization_id
    order by lower(identity.email), membership.user_id;
end;
$$;

create function public.list_admin_memberships(
  email_search text default null,
  organization_filter uuid default null,
  role_filter public.product_role default null,
  active_filter boolean default null,
  page_size integer default 100,
  page_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  organization_id uuid,
  organization_name text,
  role public.product_role,
  is_active boolean
)
language plpgsql stable security definer
set search_path = ''
as $$
declare normalized_search text := nullif(lower(btrim(email_search)), '');
begin
  perform 1 from private.require_admin_content_access();
  if page_size is null or page_size < 1 or page_size > 100
     or page_offset is null or page_offset < 0 or page_offset > 100000 then
    raise exception 'membership page bounds are invalid' using errcode = '22023';
  end if;
  if email_search is not null and length(email_search) > 320 then
    raise exception 'email search is too long' using errcode = '22023';
  end if;
  return query
    select membership.user_id, identity.email::text, organization.id, organization.name::text,
      membership.role, membership.is_active
    from public.memberships membership
    join auth.users identity on identity.id = membership.user_id
    join public.organizations organization on organization.id = membership.organization_id
    where (normalized_search is null or lower(coalesce(identity.email, '')) like '%' || normalized_search || '%')
      and (organization_filter is null or organization.id = organization_filter)
      and (role_filter is null or membership.role = role_filter)
      and (active_filter is null or membership.is_active = active_filter)
    order by lower(identity.email), membership.user_id
    limit page_size offset page_offset;
end;
$$;

create function public.admin_create_organization(
  requested_name text,
  requested_domains text[]
)
returns uuid
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  created_id uuid;
  normalized_domains text[];
  domain_name text;
begin
  select * into access from private.require_admin_content_access();
  if requested_name is null or length(btrim(requested_name)) not between 1 and 200 then
    raise exception 'organization name must contain 1 to 200 characters' using errcode = '22023';
  end if;
  if requested_domains is null or cardinality(requested_domains) < 1 then
    raise exception 'at least one approved domain is required' using errcode = '22023';
  end if;

  select array_agg(private.normalize_organization_domain(raw_domain) order by private.normalize_organization_domain(raw_domain))
    into normalized_domains
    from unnest(requested_domains) as requested(raw_domain);
  if cardinality(normalized_domains) <> (
    select count(distinct normalized_domain)::integer
    from unnest(normalized_domains) as requested(normalized_domain)
  ) then
    raise exception 'approved domains contain duplicates after normalization' using errcode = '23505';
  end if;

  insert into public.organizations(name, is_active)
  values (btrim(requested_name), true)
  returning id into created_id;
  foreach domain_name in array normalized_domains loop
    insert into public.organization_domains(domain, organization_id) values (domain_name, created_id);
  end loop;
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_organization_id, resulting_state
  ) values (
    access.user_id, access.organization_id, 'organization_created', created_id,
    jsonb_build_object('name', btrim(requested_name), 'is_active', true, 'domains', to_jsonb(normalized_domains))
  );
  foreach domain_name in array normalized_domains loop
    insert into public.access_administration_events(
      actor_user_id, actor_organization_id, action, target_organization_id, resulting_state
    ) values (
      access.user_id, access.organization_id, 'organization_domain_added', created_id,
      jsonb_build_object('domain', domain_name)
    );
  end loop;
  return created_id;
end;
$$;

create function public.admin_update_organization_name(
  requested_organization_id uuid,
  requested_name text
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  previous_name text;
begin
  select * into access from private.require_admin_content_access();
  if requested_name is null or length(btrim(requested_name)) not between 1 and 200 then
    raise exception 'organization name must contain 1 to 200 characters' using errcode = '22023';
  end if;
  select organization.name into previous_name from public.organizations organization
    where organization.id = requested_organization_id for update;
  if not found then
    raise exception 'organization not found' using errcode = 'P0002';
  end if;
  if previous_name = btrim(requested_name) then
    raise exception 'organization name is unchanged' using errcode = '22023';
  end if;
  update public.organizations set name = btrim(requested_name) where id = requested_organization_id;
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_organization_id, previous_state, resulting_state
  ) values (
    access.user_id, access.organization_id, 'organization_updated', requested_organization_id,
    jsonb_build_object('name', previous_name), jsonb_build_object('name', btrim(requested_name))
  );
end;
$$;

create function public.admin_set_organization_active(
  requested_organization_id uuid,
  requested_is_active boolean
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  previous_is_active boolean;
begin
  select * into access from private.require_admin_content_access();
  if requested_is_active is null then
    raise exception 'organization status is required' using errcode = '22023';
  end if;
  select organization.is_active into previous_is_active from public.organizations organization
    where organization.id = requested_organization_id for update;
  if not found then
    raise exception 'organization not found' using errcode = 'P0002';
  end if;
  if previous_is_active = requested_is_active then
    raise exception 'organization status is unchanged' using errcode = '22023';
  end if;
  update public.organizations set is_active = requested_is_active where id = requested_organization_id;
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_organization_id, previous_state, resulting_state
  ) values (
    access.user_id, access.organization_id,
    case when requested_is_active then 'organization_activated' else 'organization_deactivated' end,
    requested_organization_id, jsonb_build_object('is_active', previous_is_active),
    jsonb_build_object('is_active', requested_is_active)
  );
end;
$$;

create function public.admin_add_organization_domain(
  requested_organization_id uuid,
  requested_domain text
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  normalized_domain text;
begin
  select * into access from private.require_admin_content_access();
  normalized_domain := private.normalize_organization_domain(requested_domain);
  perform 1 from public.organizations organization where organization.id = requested_organization_id for update;
  if not found then
    raise exception 'organization not found' using errcode = 'P0002';
  end if;
  insert into public.organization_domains(domain, organization_id)
    values (normalized_domain, requested_organization_id);
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_organization_id, resulting_state
  ) values (
    access.user_id, access.organization_id, 'organization_domain_added', requested_organization_id,
    jsonb_build_object('domain', normalized_domain)
  );
end;
$$;

create function public.admin_remove_organization_domain(requested_domain text)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  normalized_domain text;
  owning_organization_id uuid;
begin
  select * into access from private.require_admin_content_access();
  normalized_domain := private.normalize_organization_domain(requested_domain);
  select domain.organization_id into owning_organization_id
    from public.organization_domains domain where domain.domain = normalized_domain for update;
  if not found then
    raise exception 'approved domain not found' using errcode = 'P0002';
  end if;
  delete from public.organization_domains where domain = normalized_domain;
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_organization_id, previous_state
  ) values (
    access.user_id, access.organization_id, 'organization_domain_removed', owning_organization_id,
    jsonb_build_object('domain', normalized_domain)
  );
end;
$$;

create function public.admin_create_membership(
  requested_user_id uuid,
  requested_organization_id uuid,
  requested_role public.product_role,
  requested_is_active boolean default true
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  identity_email text;
  identity_domain text;
begin
  select * into access from private.require_admin_content_access();
  if requested_role is null or requested_is_active is null then
    raise exception 'membership role and status are required' using errcode = '22023';
  end if;
  select identity.email, lower(split_part(identity.email, '@', 2))
    into identity_email, identity_domain
    from auth.users identity where identity.id = requested_user_id;
  if not found or identity_email is null or identity_email !~ '^[^[:space:]@]+@[^[:space:]@]+$' then
    raise exception 'Auth identity with a valid email not found' using errcode = 'P0002';
  end if;
  if not private.is_trusted_auth_identity(requested_user_id) then
    raise exception 'Auth identity is not trusted for membership' using errcode = '42501';
  end if;
  perform 1 from public.organizations organization
    where organization.id = requested_organization_id and organization.is_active;
  if not found then
    raise exception 'active target organization not found' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.organization_domains domain
    where domain.organization_id = requested_organization_id and domain.domain = identity_domain
  ) then
    raise exception 'Auth email domain is not approved for the target organization' using errcode = '23514';
  end if;
  insert into public.memberships(user_id, organization_id, role, is_active)
    values (requested_user_id, requested_organization_id, requested_role, requested_is_active);
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_user_id, target_organization_id, resulting_state
  ) values (
    access.user_id, access.organization_id, 'membership_created', requested_user_id,
    requested_organization_id,
    jsonb_build_object('organization_id', requested_organization_id, 'role', requested_role, 'is_active', requested_is_active)
  );
end;
$$;

create function public.admin_reassign_membership(
  requested_user_id uuid,
  requested_organization_id uuid
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  identity_email text;
  identity_domain text;
  previous_organization_id uuid;
begin
  select * into access from private.require_admin_content_access();
  select membership.organization_id into previous_organization_id
    from public.memberships membership where membership.user_id = requested_user_id for update;
  if not found then
    raise exception 'membership not found' using errcode = 'P0002';
  end if;
  if previous_organization_id = requested_organization_id then
    raise exception 'membership organization is unchanged' using errcode = '22023';
  end if;
  select identity.email, lower(split_part(identity.email, '@', 2))
    into identity_email, identity_domain from auth.users identity where identity.id = requested_user_id;
  if not found or identity_email is null or identity_email !~ '^[^[:space:]@]+@[^[:space:]@]+$' then
    raise exception 'Auth identity with a valid email not found' using errcode = 'P0002';
  end if;
  if not private.is_trusted_auth_identity(requested_user_id) then
    raise exception 'Auth identity is not trusted for membership' using errcode = '42501';
  end if;
  perform 1 from public.organizations organization
    where organization.id = requested_organization_id and organization.is_active;
  if not found then
    raise exception 'active target organization not found' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.organization_domains domain
    where domain.organization_id = requested_organization_id and domain.domain = identity_domain
  ) then
    raise exception 'Auth email domain is not approved for the target organization' using errcode = '23514';
  end if;
  update public.memberships set organization_id = requested_organization_id where user_id = requested_user_id;
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_user_id, target_organization_id,
    previous_state, resulting_state
  ) values (
    access.user_id, access.organization_id, 'membership_organization_changed', requested_user_id,
    requested_organization_id, jsonb_build_object('organization_id', previous_organization_id),
    jsonb_build_object('organization_id', requested_organization_id)
  );
end;
$$;

create function public.admin_set_membership_role(
  requested_user_id uuid,
  requested_role public.product_role
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  membership record;
begin
  select * into access from private.require_admin_content_access();
  if requested_role is null then
    raise exception 'membership role is required' using errcode = '22023';
  end if;
  select current.organization_id, current.role into membership
    from public.memberships current where current.user_id = requested_user_id for update;
  if not found then
    raise exception 'membership not found' using errcode = 'P0002';
  end if;
  if membership.role = requested_role then
    raise exception 'membership role is unchanged' using errcode = '22023';
  end if;
  if not private.is_trusted_auth_identity(requested_user_id) then
    raise exception 'Auth identity is not trusted for membership' using errcode = '42501';
  end if;
  update public.memberships set role = requested_role where user_id = requested_user_id;
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_user_id, target_organization_id,
    previous_state, resulting_state
  ) values (
    access.user_id, access.organization_id, 'membership_role_changed', requested_user_id,
    membership.organization_id, jsonb_build_object('role', membership.role), jsonb_build_object('role', requested_role)
  );
end;
$$;

create function public.admin_set_membership_active(
  requested_user_id uuid,
  requested_is_active boolean
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  membership record;
begin
  select * into access from private.require_admin_content_access();
  if requested_is_active is null then
    raise exception 'membership status is required' using errcode = '22023';
  end if;
  select current.organization_id, current.is_active into membership
    from public.memberships current where current.user_id = requested_user_id for update;
  if not found then
    raise exception 'membership not found' using errcode = 'P0002';
  end if;
  if membership.is_active = requested_is_active then
    raise exception 'membership status is unchanged' using errcode = '22023';
  end if;
  if requested_is_active and not private.is_trusted_auth_identity(requested_user_id) then
    raise exception 'Auth identity is not trusted for membership' using errcode = '42501';
  end if;
  update public.memberships set is_active = requested_is_active where user_id = requested_user_id;
  insert into public.access_administration_events(
    actor_user_id, actor_organization_id, action, target_user_id, target_organization_id,
    previous_state, resulting_state
  ) values (
    access.user_id, access.organization_id,
    case when requested_is_active then 'membership_activated' else 'membership_deactivated' end,
    requested_user_id, membership.organization_id, jsonb_build_object('is_active', membership.is_active),
    jsonb_build_object('is_active', requested_is_active)
  );
end;
$$;

revoke all on function private.reject_access_administration_event_mutation(),
  private.normalize_organization_domain(text),
  private.is_trusted_auth_identity(uuid)
from public, anon, authenticated, service_role;

revoke all on function public.list_admin_organizations(),
  public.list_admin_organization_members(uuid),
  public.list_admin_memberships(text, uuid, public.product_role, boolean, integer, integer),
  public.admin_create_organization(text, text[]),
  public.admin_update_organization_name(uuid, text),
  public.admin_set_organization_active(uuid, boolean),
  public.admin_add_organization_domain(uuid, text),
  public.admin_remove_organization_domain(text),
  public.admin_create_membership(uuid, uuid, public.product_role, boolean),
  public.admin_reassign_membership(uuid, uuid),
  public.admin_set_membership_role(uuid, public.product_role),
  public.admin_set_membership_active(uuid, boolean)
from public, anon, authenticated, service_role;

grant execute on function public.list_admin_organizations(),
  public.list_admin_organization_members(uuid),
  public.list_admin_memberships(text, uuid, public.product_role, boolean, integer, integer),
  public.admin_create_organization(text, text[]),
  public.admin_update_organization_name(uuid, text),
  public.admin_set_organization_active(uuid, boolean),
  public.admin_add_organization_domain(uuid, text),
  public.admin_remove_organization_domain(text),
  public.admin_create_membership(uuid, uuid, public.product_role, boolean),
  public.admin_reassign_membership(uuid, uuid),
  public.admin_set_membership_role(uuid, public.product_role),
  public.admin_set_membership_active(uuid, boolean)
to authenticated;
