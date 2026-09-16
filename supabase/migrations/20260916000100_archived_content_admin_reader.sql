-- SPEC-005 Phase 2A: Admin-only read boundary for archived governed content and
-- organization attribution for lifecycle history.
--
-- Archival is identity-level state. Every reader policy and every Admin
-- Draft/Published management policy deliberately requires `archived_at is null`
-- (see 20260911000100 reader policies and 20260914000100 "Admins see Draft ..."
-- policies), so once an identity is archived it is invisible to every direct
-- table read available to `authenticated`. That is correct for the active
-- management surface but leaves no bounded path to list archived content for
-- restoration. Rather than relaxing those policies, this migration adds one
-- bounded live-Admin operation, mirroring the existing history boundary.
--
-- No table, column, enum, RLS policy, archive/restore semantic, reader semantic
-- or attachment semantic changes here: functions and grants only.

-- Archived identities, resolved through their authoritative current-published
-- revision. Security definer because the whole point is to read rows that
-- `authenticated` RLS intentionally hides; authority is still the live
-- Admin chain (approved domain -> active membership -> active organization ->
-- persisted Admin role) enforced by private.require_admin_content_access().
--
-- The join is a left join on `current_published_revision_id` so an archived
-- identity can never vanish from the restore surface, and so only the
-- authoritative revision — never an arbitrary historical or Draft revision —
-- can supply the display metadata.
create function public.list_archived_governed_content(
  page_size integer default 50,
  before_archived_at timestamptz default null,
  before_content_id uuid default null,
  content_type_filter public.curriculum_content_type default null
)
returns table (
  content_type public.curriculum_content_type,
  content_id uuid,
  current_published_revision_id uuid,
  revision_number integer,
  title text,
  archived_at timestamptz,
  archived_by uuid
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform 1 from private.require_admin_content_access();
  if page_size is null or page_size < 1 or page_size > 100 then
    raise exception 'archived page size must be between 1 and 100' using errcode = '22023';
  end if;
  if (before_archived_at is null) <> (before_content_id is null) then
    raise exception 'archived cursor requires both keyset values' using errcode = '22023';
  end if;

  return query
  with archived(
    content_type, content_id, current_published_revision_id, revision_number, title, archived_at, archived_by
  ) as (
    select 'module'::public.curriculum_content_type, identity.id, identity.current_published_revision_id,
      revision.revision_number, revision.title, identity.archived_at, identity.archived_by
    from public.modules identity
    left join public.module_revisions revision on revision.id = identity.current_published_revision_id
    where identity.archived_at is not null
    union all
    select 'program_topic'::public.curriculum_content_type, identity.id, identity.current_published_revision_id,
      revision.revision_number, revision.title, identity.archived_at, identity.archived_by
    from public.program_topics identity
    left join public.program_topic_revisions revision on revision.id = identity.current_published_revision_id
    where identity.archived_at is not null
    union all
    select 'instructor'::public.curriculum_content_type, identity.id, identity.current_published_revision_id,
      revision.revision_number, revision.name, identity.archived_at, identity.archived_by
    from public.instructors identity
    left join public.instructor_revisions revision on revision.id = identity.current_published_revision_id
    where identity.archived_at is not null
    union all
    select 'teaching_note'::public.curriculum_content_type, identity.id, identity.current_published_revision_id,
      revision.revision_number, revision.title, identity.archived_at, identity.archived_by
    from public.teaching_notes identity
    left join public.teaching_note_revisions revision on revision.id = identity.current_published_revision_id
    where identity.archived_at is not null
    union all
    select 'material'::public.curriculum_content_type, identity.id, identity.current_published_revision_id,
      revision.revision_number, revision.title, identity.archived_at, identity.archived_by
    from public.materials identity
    left join public.material_revisions revision on revision.id = identity.current_published_revision_id
    where identity.archived_at is not null
    union all
    select 'institution'::public.curriculum_content_type, identity.id, identity.current_published_revision_id,
      revision.revision_number, revision.name, identity.archived_at, identity.archived_by
    from public.institutions identity
    left join public.institution_revisions revision on revision.id = identity.current_published_revision_id
    where identity.archived_at is not null
  )
  select entry.content_type, entry.content_id, entry.current_published_revision_id,
    entry.revision_number, entry.title, entry.archived_at, entry.archived_by
  from archived entry
  where (content_type_filter is null or entry.content_type = content_type_filter)
    and (
      before_archived_at is null
      or (entry.archived_at, entry.content_id) < (before_archived_at, before_content_id)
    )
  order by entry.archived_at desc, entry.content_id desc
  limit page_size;
end;
$$;

-- Governance history gains a readable organization name. It is resolved inside
-- the existing bounded Admin-only operation so no organization or membership
-- RLS has to be relaxed for an Admin to read another actor's organization.
-- Only the organization name is added: no actor email, auth metadata or profile
-- information is exposed. The return type changes, so the function is replaced
-- rather than redefined in place.
drop function if exists public.list_curriculum_lifecycle_history(
  integer, bigint, public.curriculum_content_type, uuid, public.curriculum_lifecycle_action
);

create function public.list_curriculum_lifecycle_history(
  page_size integer default 50,
  before_event_id bigint default null,
  content_type_filter public.curriculum_content_type default null,
  content_id_filter uuid default null,
  action_filter public.curriculum_lifecycle_action default null
)
returns table (
  event_id bigint,
  content_type public.curriculum_content_type,
  content_id uuid,
  revision_id uuid,
  actor_user_id uuid,
  actor_organization_id uuid,
  actor_organization_name text,
  action public.curriculum_lifecycle_action,
  previous_status public.curriculum_revision_status,
  resulting_status public.curriculum_revision_status,
  occurred_at timestamptz
)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform 1 from private.require_admin_content_access();
  if page_size is null or page_size < 1 or page_size > 100 then
    raise exception 'history page size must be between 1 and 100' using errcode = '22023';
  end if;
  return query
    select event.id, event.content_type, event.content_id, event.revision_id,
      event.actor_user_id, event.actor_organization_id, organization.name, event.action,
      event.previous_status, event.resulting_status, event.occurred_at
    from public.curriculum_lifecycle_events event
    -- Left join: an append-only governance record must never disappear because
    -- its organization row was later removed.
    left join public.organizations organization on organization.id = event.actor_organization_id
    where (before_event_id is null or event.id < before_event_id)
      and (content_type_filter is null or event.content_type = content_type_filter)
      and (content_id_filter is null or event.content_id = content_id_filter)
      and (action_filter is null or event.action = action_filter)
    order by event.id desc
    limit page_size;
end;
$$;

revoke all on function public.list_archived_governed_content(
  integer, timestamptz, uuid, public.curriculum_content_type
), public.list_curriculum_lifecycle_history(
  integer, bigint, public.curriculum_content_type, uuid, public.curriculum_lifecycle_action
) from public, anon, authenticated, service_role;

grant execute on function public.list_archived_governed_content(
  integer, timestamptz, uuid, public.curriculum_content_type
), public.list_curriculum_lifecycle_history(
  integer, bigint, public.curriculum_content_type, uuid, public.curriculum_lifecycle_action
) to authenticated;
