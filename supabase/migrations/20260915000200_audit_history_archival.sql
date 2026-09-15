-- SPEC-005 Phase 1: authoritative lifecycle history and identity archival.

alter type public.curriculum_lifecycle_action add value if not exists 'content_archived';
alter type public.curriculum_lifecycle_action add value if not exists 'content_restored';

create function private.lock_governed_identity(
  requested_type public.curriculum_content_type,
  requested_content_id uuid
)
returns table (
  current_revision_id uuid,
  current_archived_at timestamptz
)
language plpgsql volatile security definer
set search_path = ''
as $$
begin
  case requested_type
    when 'module' then
      return query select identity.current_published_revision_id, identity.archived_at
        from public.modules identity where identity.id = requested_content_id for update;
    when 'program_topic' then
      return query select identity.current_published_revision_id, identity.archived_at
        from public.program_topics identity where identity.id = requested_content_id for update;
    when 'instructor' then
      return query select identity.current_published_revision_id, identity.archived_at
        from public.instructors identity where identity.id = requested_content_id for update;
    when 'teaching_note' then
      return query select identity.current_published_revision_id, identity.archived_at
        from public.teaching_notes identity where identity.id = requested_content_id for update;
    when 'material' then
      return query select identity.current_published_revision_id, identity.archived_at
        from public.materials identity where identity.id = requested_content_id for update;
    when 'institution' then
      return query select identity.current_published_revision_id, identity.archived_at
        from public.institutions identity where identity.id = requested_content_id for update;
  end case;
end;
$$;

create function private.is_authoritative_published_revision(
  requested_type public.curriculum_content_type,
  requested_content_id uuid,
  requested_revision_id uuid
)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare authoritative boolean;
begin
  case requested_type
    when 'module' then select exists (select 1 from public.module_revisions where id = requested_revision_id and module_id = requested_content_id and status = 'Published') into authoritative;
    when 'program_topic' then select exists (select 1 from public.program_topic_revisions where id = requested_revision_id and program_topic_id = requested_content_id and status = 'Published') into authoritative;
    when 'instructor' then select exists (select 1 from public.instructor_revisions where id = requested_revision_id and instructor_id = requested_content_id and status = 'Published') into authoritative;
    when 'teaching_note' then select exists (select 1 from public.teaching_note_revisions where id = requested_revision_id and teaching_note_id = requested_content_id and status = 'Published') into authoritative;
    when 'material' then select exists (select 1 from public.material_revisions where id = requested_revision_id and material_id = requested_content_id and status = 'Published') into authoritative;
    when 'institution' then select exists (select 1 from public.institution_revisions where id = requested_revision_id and institution_id = requested_content_id and status = 'Published') into authoritative;
  end case;
  return coalesce(authoritative, false);
end;
$$;

create function private.has_active_governed_draft(
  requested_type public.curriculum_content_type,
  requested_content_id uuid
)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare active_draft boolean;
begin
  case requested_type
    when 'module' then select exists (select 1 from public.module_revisions where module_id = requested_content_id and status = 'Draft') into active_draft;
    when 'program_topic' then select exists (select 1 from public.program_topic_revisions where program_topic_id = requested_content_id and status = 'Draft') into active_draft;
    when 'instructor' then select exists (select 1 from public.instructor_revisions where instructor_id = requested_content_id and status = 'Draft') into active_draft;
    when 'teaching_note' then select exists (select 1 from public.teaching_note_revisions where teaching_note_id = requested_content_id and status = 'Draft') into active_draft;
    when 'material' then select exists (select 1 from public.material_revisions where material_id = requested_content_id and status = 'Draft') into active_draft;
    when 'institution' then select exists (select 1 from public.institution_revisions where institution_id = requested_content_id and status = 'Draft') into active_draft;
  end case;
  return coalesce(active_draft, false);
end;
$$;

create function private.current_published_dependents(
  requested_type public.curriculum_content_type,
  requested_content_id uuid
)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare blockers jsonb := '[]'::jsonb;
begin
  case requested_type
    when 'module' then
      select coalesce(jsonb_agg(jsonb_build_object('content_type', dependent_type, 'content_id', dependent_id)
        order by dependent_type, dependent_id), '[]'::jsonb) into blockers
      from (
        select 'program_topic'::text dependent_type, identity.id dependent_id
        from public.program_topics identity
        join public.program_topic_revisions revision on revision.id = identity.current_published_revision_id
        where identity.archived_at is null and revision.status = 'Published' and revision.module_id = requested_content_id
        union all
        select 'teaching_note', identity.id
        from public.teaching_notes identity
        join public.teaching_note_revisions revision on revision.id = identity.current_published_revision_id
        where identity.archived_at is null and revision.status = 'Published' and revision.module_id = requested_content_id
      ) dependent;
    when 'program_topic' then
      select coalesce(jsonb_agg(jsonb_build_object('content_type', 'teaching_note', 'content_id', identity.id)
        order by identity.id), '[]'::jsonb) into blockers
      from public.teaching_notes identity
      join public.teaching_note_revisions revision on revision.id = identity.current_published_revision_id
      where identity.archived_at is null and revision.status = 'Published' and revision.program_topic_id = requested_content_id;
    when 'instructor' then
      select coalesce(jsonb_agg(jsonb_build_object('content_type', 'module', 'content_id', identity.id)
        order by identity.id), '[]'::jsonb) into blockers
      from public.modules identity
      join public.module_revisions revision on revision.id = identity.current_published_revision_id
      join public.module_instructors relationship on relationship.module_revision_id = revision.id
      where identity.archived_at is null and revision.status = 'Published' and relationship.instructor_id = requested_content_id;
    when 'material' then
      select coalesce(jsonb_agg(jsonb_build_object('content_type', dependent_type, 'content_id', dependent_id)
        order by dependent_type, dependent_id), '[]'::jsonb) into blockers
      from (
        select 'module'::text dependent_type, identity.id dependent_id
        from public.modules identity
        join public.module_revisions revision on revision.id = identity.current_published_revision_id
        join public.module_materials relationship on relationship.module_revision_id = revision.id
        where identity.archived_at is null and revision.status = 'Published' and relationship.material_id = requested_content_id
        union all
        select 'teaching_note', identity.id
        from public.teaching_notes identity
        join public.teaching_note_revisions revision on revision.id = identity.current_published_revision_id
        join public.teaching_note_materials relationship on relationship.teaching_note_revision_id = revision.id
        where identity.archived_at is null and revision.status = 'Published' and relationship.material_id = requested_content_id
      ) dependent;
    when 'institution' then
      select coalesce(jsonb_agg(jsonb_build_object('content_type', 'module', 'content_id', identity.id)
        order by identity.id), '[]'::jsonb) into blockers
      from public.modules identity
      join public.module_revisions revision on revision.id = identity.current_published_revision_id
      join public.module_institutions relationship on relationship.module_revision_id = revision.id
      where identity.archived_at is null and revision.status = 'Published' and relationship.institution_id = requested_content_id;
    else
      blockers := '[]'::jsonb;
  end case;
  return blockers;
end;
$$;

create function private.validate_current_published_dependencies(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  module_id uuid;
  topic_id uuid;
  topic_module_id uuid;
begin
  if requested_type = 'program_topic' then
    select revision.module_id into module_id from public.program_topic_revisions revision where revision.id = requested_revision_id;
    if not private.is_current_published_identity('module', module_id) then
      raise exception 'Program Topic requires a current-published Module' using errcode = '23514';
    end if;
  elsif requested_type = 'teaching_note' then
    select revision.module_id, revision.program_topic_id into module_id, topic_id
    from public.teaching_note_revisions revision where revision.id = requested_revision_id;
    if not private.is_current_published_identity('module', module_id) then
      raise exception 'Teaching Note requires a current-published Module' using errcode = '23514';
    end if;
    if topic_id is not null then
      if not private.is_current_published_identity('program_topic', topic_id) then
        raise exception 'Teaching Note requires a current-published Program Topic' using errcode = '23514';
      end if;
      select revision.module_id into topic_module_id
      from public.program_topics identity
      join public.program_topic_revisions revision on revision.id = identity.current_published_revision_id
      where identity.id = topic_id;
      if topic_module_id is distinct from module_id then
        raise exception 'Teaching Note topic must belong to its Module' using errcode = '23514';
      end if;
    end if;
    if exists (
      select 1 from public.teaching_note_materials relationship
      where relationship.teaching_note_revision_id = requested_revision_id
        and not private.is_current_published_identity('material', relationship.material_id)
    ) then
      raise exception 'Teaching Note requires current-published Materials' using errcode = '23514';
    end if;
  elsif requested_type = 'module' then
    if exists (
      select 1 from public.module_instructors relationship
      where relationship.module_revision_id = requested_revision_id
        and not private.is_current_published_identity('instructor', relationship.instructor_id)
    ) then
      raise exception 'Module requires current-published Instructors' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.module_materials relationship
      where relationship.module_revision_id = requested_revision_id
        and not private.is_current_published_identity('material', relationship.material_id)
    ) then
      raise exception 'Module requires current-published Materials' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.module_institutions relationship
      where relationship.module_revision_id = requested_revision_id
        and not private.is_current_published_identity('institution', relationship.institution_id)
    ) then
      raise exception 'Module requires current-published Institutions' using errcode = '23514';
    end if;
  end if;
end;
$$;

create or replace function private.validate_publication(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid,
  actor_id uuid
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
begin
  perform private.validate_submission(requested_type, requested_revision_id, actor_id);
  perform private.validate_current_published_dependencies(requested_type, requested_revision_id);
end;
$$;

create function public.archive_governed_content(
  requested_type public.curriculum_content_type,
  requested_content_id uuid
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  identity_state record;
  archived timestamptz := clock_timestamp();
  blockers jsonb;
  affected integer;
begin
  select * into access from private.require_admin_content_access();
  select * into identity_state from private.lock_governed_identity(requested_type, requested_content_id);
  if not found then
    raise exception 'governed content identity not found' using errcode = '55000';
  end if;
  if identity_state.current_archived_at is not null then
    raise exception 'governed content is already archived' using errcode = '55000';
  end if;
  if identity_state.current_revision_id is null or not private.is_authoritative_published_revision(
    requested_type, requested_content_id, identity_state.current_revision_id
  ) then
    raise exception 'authoritative current-published revision not found' using errcode = '55000';
  end if;
  if private.has_active_governed_draft(requested_type, requested_content_id) then
    raise exception 'active Draft blocks archival' using errcode = '55000';
  end if;

  blockers := private.current_published_dependents(requested_type, requested_content_id);
  if jsonb_array_length(blockers) > 0 then
    raise exception 'active current-published dependents block archival'
      using errcode = '23514', detail = jsonb_build_object('blockers', blockers)::text;
  end if;

  case requested_type
    when 'module' then update public.modules set archived_at = archived, archived_by = access.user_id where id = requested_content_id and archived_at is null;
    when 'program_topic' then update public.program_topics set archived_at = archived, archived_by = access.user_id where id = requested_content_id and archived_at is null;
    when 'instructor' then update public.instructors set archived_at = archived, archived_by = access.user_id where id = requested_content_id and archived_at is null;
    when 'teaching_note' then update public.teaching_notes set archived_at = archived, archived_by = access.user_id where id = requested_content_id and archived_at is null;
    when 'material' then update public.materials set archived_at = archived, archived_by = access.user_id where id = requested_content_id and archived_at is null;
    when 'institution' then update public.institutions set archived_at = archived, archived_by = access.user_id where id = requested_content_id and archived_at is null;
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'archival lost the identity race' using errcode = '40001';
  end if;

  insert into public.curriculum_lifecycle_events (
    content_type, content_id, revision_id, actor_user_id, actor_organization_id, action, occurred_at
  ) values (
    requested_type, requested_content_id, identity_state.current_revision_id,
    access.user_id, access.organization_id, 'content_archived', archived
  );

  return jsonb_build_object(
    'content_id', requested_content_id,
    'revision_id', identity_state.current_revision_id,
    'archived_at', archived
  );
end;
$$;

create function public.restore_governed_content(
  requested_type public.curriculum_content_type,
  requested_content_id uuid
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  identity_state record;
  restored timestamptz := clock_timestamp();
  affected integer;
begin
  select * into access from private.require_admin_content_access();
  select * into identity_state from private.lock_governed_identity(requested_type, requested_content_id);
  if not found then
    raise exception 'governed content identity not found' using errcode = '55000';
  end if;
  if identity_state.current_archived_at is null then
    raise exception 'governed content is not archived' using errcode = '55000';
  end if;
  if identity_state.current_revision_id is null or not private.is_authoritative_published_revision(
    requested_type, requested_content_id, identity_state.current_revision_id
  ) then
    raise exception 'authoritative current-published revision not found' using errcode = '55000';
  end if;

  -- Dependency share locks are retained until commit, preventing restore from
  -- racing an archive that would invalidate the reactivated representation.
  perform private.validate_current_published_dependencies(requested_type, identity_state.current_revision_id);

  case requested_type
    when 'module' then update public.modules set archived_at = null, archived_by = null where id = requested_content_id and archived_at is not null;
    when 'program_topic' then update public.program_topics set archived_at = null, archived_by = null where id = requested_content_id and archived_at is not null;
    when 'instructor' then update public.instructors set archived_at = null, archived_by = null where id = requested_content_id and archived_at is not null;
    when 'teaching_note' then update public.teaching_notes set archived_at = null, archived_by = null where id = requested_content_id and archived_at is not null;
    when 'material' then update public.materials set archived_at = null, archived_by = null where id = requested_content_id and archived_at is not null;
    when 'institution' then update public.institutions set archived_at = null, archived_by = null where id = requested_content_id and archived_at is not null;
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'restoration lost the identity race' using errcode = '40001';
  end if;

  insert into public.curriculum_lifecycle_events (
    content_type, content_id, revision_id, actor_user_id, actor_organization_id, action, occurred_at
  ) values (
    requested_type, requested_content_id, identity_state.current_revision_id,
    access.user_id, access.organization_id, 'content_restored', restored
  );

  return jsonb_build_object(
    'content_id', requested_content_id,
    'revision_id', identity_state.current_revision_id,
    'restored_at', restored
  );
end;
$$;

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
      event.actor_user_id, event.actor_organization_id, event.action,
      event.previous_status, event.resulting_status, event.occurred_at
    from public.curriculum_lifecycle_events event
    where (before_event_id is null or event.id < before_event_id)
      and (content_type_filter is null or event.content_type = content_type_filter)
      and (content_id_filter is null or event.content_id = content_id_filter)
      and (action_filter is null or event.action = action_filter)
    order by event.id desc
    limit page_size;
end;
$$;

-- History is available only through the bounded live-Admin operation.
revoke select on public.curriculum_lifecycle_events from authenticated;
drop policy if exists "Admins read lifecycle events" on public.curriculum_lifecycle_events;

revoke all on function private.lock_governed_identity(public.curriculum_content_type, uuid),
  private.is_authoritative_published_revision(public.curriculum_content_type, uuid, uuid),
  private.has_active_governed_draft(public.curriculum_content_type, uuid),
  private.current_published_dependents(public.curriculum_content_type, uuid),
  private.validate_current_published_dependencies(public.curriculum_content_type, uuid)
from public, anon, authenticated, service_role;

revoke all on function public.archive_governed_content(public.curriculum_content_type, uuid),
  public.restore_governed_content(public.curriculum_content_type, uuid),
  public.list_curriculum_lifecycle_history(integer, bigint, public.curriculum_content_type, uuid, public.curriculum_lifecycle_action)
from public, anon, authenticated, service_role;

grant execute on function public.archive_governed_content(public.curriculum_content_type, uuid),
  public.restore_governed_content(public.curriculum_content_type, uuid),
  public.list_curriculum_lifecycle_history(integer, bigint, public.curriculum_content_type, uuid, public.curriculum_lifecycle_action)
to authenticated;
