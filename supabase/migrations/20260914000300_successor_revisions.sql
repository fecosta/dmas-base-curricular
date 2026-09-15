-- SPEC-004 Phase 2: concurrency-safe successor Draft revisions.

create unique index module_revisions_one_active_draft
  on public.module_revisions (module_id) where status = 'Draft';
create unique index program_topic_revisions_one_active_draft
  on public.program_topic_revisions (program_topic_id) where status = 'Draft';
create unique index instructor_revisions_one_active_draft
  on public.instructor_revisions (instructor_id) where status = 'Draft';
create unique index teaching_note_revisions_one_active_draft
  on public.teaching_note_revisions (teaching_note_id) where status = 'Draft';
create unique index material_revisions_one_active_draft
  on public.material_revisions (material_id) where status = 'Draft';
create unique index institution_revisions_one_active_draft
  on public.institution_revisions (institution_id) where status = 'Draft';

create function public.create_successor_draft(
  requested_type public.curriculum_content_type,
  requested_content_id uuid
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  current_revision_id uuid;
  successor_revision_id uuid := gen_random_uuid();
  next_revision_number integer;
  archived_at timestamptz;
  affected integer;
begin
  select * into access from private.require_admin_content_access();

  -- The identity lock serializes successor creation and revision-number
  -- allocation for this stable identity.
  case requested_type
    when 'module' then
      select current_published_revision_id, modules.archived_at
      into current_revision_id, archived_at
      from public.modules where id = requested_content_id for update;
    when 'program_topic' then
      select current_published_revision_id, program_topics.archived_at
      into current_revision_id, archived_at
      from public.program_topics where id = requested_content_id for update;
    when 'instructor' then
      select current_published_revision_id, instructors.archived_at
      into current_revision_id, archived_at
      from public.instructors where id = requested_content_id for update;
    when 'teaching_note' then
      select current_published_revision_id, teaching_notes.archived_at
      into current_revision_id, archived_at
      from public.teaching_notes where id = requested_content_id for update;
    when 'material' then
      select current_published_revision_id, materials.archived_at
      into current_revision_id, archived_at
      from public.materials where id = requested_content_id for update;
    when 'institution' then
      select current_published_revision_id, institutions.archived_at
      into current_revision_id, archived_at
      from public.institutions where id = requested_content_id for update;
  end case;
  if not found or archived_at is not null or current_revision_id is null then
    raise exception 'eligible current-published identity not found' using errcode = '55000';
  end if;

  case requested_type
    when 'module' then
      if not exists (select 1 from public.module_revisions where id = current_revision_id and module_id = requested_content_id and status = 'Published') then
        raise exception 'eligible current-published identity not found' using errcode = '55000';
      end if;
      if exists (select 1 from public.module_revisions where module_id = requested_content_id and status = 'Draft') then
        raise exception 'active successor Draft already exists' using errcode = '55000';
      end if;
      select max(revision_number) + 1 into next_revision_number from public.module_revisions where module_id = requested_content_id;
      insert into public.module_revisions (
        id, module_id, revision_number, status, axis_id, title, theme, description,
        learning_outcomes, level, delivery_format, suggested_duration, created_by,
        contributor_organization_id
      )
      select successor_revision_id, requested_content_id, next_revision_number, 'Draft', axis_id, title,
        theme, description, learning_outcomes, level, delivery_format, suggested_duration,
        access.user_id, access.organization_id
      from public.module_revisions where id = current_revision_id and status = 'Published';
    when 'program_topic' then
      if not exists (select 1 from public.program_topic_revisions where id = current_revision_id and program_topic_id = requested_content_id and status = 'Published') then
        raise exception 'eligible current-published identity not found' using errcode = '55000';
      end if;
      if exists (select 1 from public.program_topic_revisions where program_topic_id = requested_content_id and status = 'Draft') then
        raise exception 'active successor Draft already exists' using errcode = '55000';
      end if;
      select max(revision_number) + 1 into next_revision_number from public.program_topic_revisions where program_topic_id = requested_content_id;
      insert into public.program_topic_revisions (
        id, program_topic_id, revision_number, status, module_id, title, description,
        position, created_by, contributor_organization_id
      )
      select successor_revision_id, requested_content_id, next_revision_number, 'Draft', module_id,
        title, description, position, access.user_id, access.organization_id
      from public.program_topic_revisions where id = current_revision_id and status = 'Published';
    when 'instructor' then
      if not exists (select 1 from public.instructor_revisions where id = current_revision_id and instructor_id = requested_content_id and status = 'Published') then
        raise exception 'eligible current-published identity not found' using errcode = '55000';
      end if;
      if exists (select 1 from public.instructor_revisions where instructor_id = requested_content_id and status = 'Draft') then
        raise exception 'active successor Draft already exists' using errcode = '55000';
      end if;
      select max(revision_number) + 1 into next_revision_number from public.instructor_revisions where instructor_id = requested_content_id;
      insert into public.instructor_revisions (
        id, instructor_id, revision_number, status, name, role_or_title, institution,
        profile, linkedin_url, thematic_axis_or_themes, country, created_by,
        contributor_organization_id
      )
      select successor_revision_id, requested_content_id, next_revision_number, 'Draft', name,
        role_or_title, institution, profile, linkedin_url, thematic_axis_or_themes, country,
        access.user_id, access.organization_id
      from public.instructor_revisions where id = current_revision_id and status = 'Published';
    when 'teaching_note' then
      if not exists (select 1 from public.teaching_note_revisions where id = current_revision_id and teaching_note_id = requested_content_id and status = 'Published') then
        raise exception 'eligible current-published identity not found' using errcode = '55000';
      end if;
      if exists (select 1 from public.teaching_note_revisions where teaching_note_id = requested_content_id and status = 'Draft') then
        raise exception 'active successor Draft already exists' using errcode = '55000';
      end if;
      select max(revision_number) + 1 into next_revision_number from public.teaching_note_revisions where teaching_note_id = requested_content_id;
      insert into public.teaching_note_revisions (
        id, teaching_note_id, revision_number, status, module_id, program_topic_id,
        title, text, source_url, created_by, contributor_organization_id
      )
      select successor_revision_id, requested_content_id, next_revision_number, 'Draft', module_id,
        program_topic_id, title, text, source_url, access.user_id, access.organization_id
      from public.teaching_note_revisions where id = current_revision_id and status = 'Published';
    when 'material' then
      if not exists (select 1 from public.material_revisions where id = current_revision_id and material_id = requested_content_id and status = 'Published') then
        raise exception 'eligible current-published identity not found' using errcode = '55000';
      end if;
      if exists (select 1 from public.material_revisions where material_id = requested_content_id and status = 'Draft') then
        raise exception 'active successor Draft already exists' using errcode = '55000';
      end if;
      select max(revision_number) + 1 into next_revision_number from public.material_revisions where material_id = requested_content_id;
      insert into public.material_revisions (
        id, material_id, revision_number, status, title, material_type, description,
        source_or_institution, source_url, country_or_scope, theme, created_by,
        contributor_organization_id
      )
      select successor_revision_id, requested_content_id, next_revision_number, 'Draft', title,
        material_type, description, source_or_institution, source_url, country_or_scope, theme,
        access.user_id, access.organization_id
      from public.material_revisions where id = current_revision_id and status = 'Published';
    when 'institution' then
      if not exists (select 1 from public.institution_revisions where id = current_revision_id and institution_id = requested_content_id and status = 'Published') then
        raise exception 'eligible current-published identity not found' using errcode = '55000';
      end if;
      if exists (select 1 from public.institution_revisions where institution_id = requested_content_id and status = 'Draft') then
        raise exception 'active successor Draft already exists' using errcode = '55000';
      end if;
      select max(revision_number) + 1 into next_revision_number from public.institution_revisions where institution_id = requested_content_id;
      insert into public.institution_revisions (
        id, institution_id, revision_number, status, name, institution_type,
        country_or_scope, description, website_url, themes, created_by,
        contributor_organization_id
      )
      select successor_revision_id, requested_content_id, next_revision_number, 'Draft', name,
        institution_type, country_or_scope, description, website_url, themes,
        access.user_id, access.organization_id
      from public.institution_revisions where id = current_revision_id and status = 'Published';
  end case;

  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'successor creation lost the current revision race' using errcode = '40001';
  end if;

  if requested_type = 'module' then
    insert into public.module_instructors(module_revision_id, instructor_id)
      select successor_revision_id, instructor_id from public.module_instructors where module_revision_id = current_revision_id;
    insert into public.module_materials(module_revision_id, material_id)
      select successor_revision_id, material_id from public.module_materials where module_revision_id = current_revision_id;
    insert into public.module_institutions(module_revision_id, institution_id)
      select successor_revision_id, institution_id from public.module_institutions where module_revision_id = current_revision_id;
  elsif requested_type = 'teaching_note' then
    insert into public.teaching_note_materials(teaching_note_revision_id, material_id)
      select successor_revision_id, material_id from public.teaching_note_materials where teaching_note_revision_id = current_revision_id;
  end if;

  insert into public.curriculum_lifecycle_events (
    content_type, content_id, revision_id, actor_user_id, actor_organization_id,
    action, resulting_status
  ) values (
    requested_type, requested_content_id, successor_revision_id, access.user_id,
    access.organization_id, 'revision_created', 'Draft'
  );

  return jsonb_build_object(
    'content_id', requested_content_id,
    'revision_id', successor_revision_id,
    'revision_number', next_revision_number,
    'status', 'Draft'
  );
end;
$$;

-- Reconcile the Phase 1 publication operation with both initial and successor
-- publication while preserving dependency locks acquired by validation.
create or replace function public.publish_content_draft(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  content_id uuid;
  published timestamptz := clock_timestamp();
  current_revision_id uuid;
  archived_at timestamptz;
  affected integer;
begin
  select * into access from private.require_admin_content_access();
  content_id := private.assert_owned_draft(requested_type, requested_revision_id, access.user_id);

  case requested_type
    when 'module' then select current_published_revision_id, modules.archived_at into current_revision_id, archived_at from public.modules where id = content_id for update;
    when 'program_topic' then select current_published_revision_id, program_topics.archived_at into current_revision_id, archived_at from public.program_topics where id = content_id for update;
    when 'instructor' then select current_published_revision_id, instructors.archived_at into current_revision_id, archived_at from public.instructors where id = content_id for update;
    when 'teaching_note' then select current_published_revision_id, teaching_notes.archived_at into current_revision_id, archived_at from public.teaching_notes where id = content_id for update;
    when 'material' then select current_published_revision_id, materials.archived_at into current_revision_id, archived_at from public.materials where id = content_id for update;
    when 'institution' then select current_published_revision_id, institutions.archived_at into current_revision_id, archived_at from public.institutions where id = content_id for update;
  end case;
  if not found or archived_at is not null then
    raise exception 'Draft is not eligible for publication' using errcode = '55000';
  end if;

  perform private.validate_publication(requested_type, requested_revision_id, access.user_id);

  case requested_type
    when 'module' then update public.module_revisions set status = 'Published', published_at = published where id = requested_revision_id and status = 'Draft';
    when 'program_topic' then update public.program_topic_revisions set status = 'Published', published_at = published where id = requested_revision_id and status = 'Draft';
    when 'instructor' then update public.instructor_revisions set status = 'Published', published_at = published where id = requested_revision_id and status = 'Draft';
    when 'teaching_note' then update public.teaching_note_revisions set status = 'Published', published_at = published where id = requested_revision_id and status = 'Draft';
    when 'material' then update public.material_revisions set status = 'Published', published_at = published where id = requested_revision_id and status = 'Draft';
    when 'institution' then update public.institution_revisions set status = 'Published', published_at = published where id = requested_revision_id and status = 'Draft';
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'publication lost the Draft race' using errcode = '40001';
  end if;

  case requested_type
    when 'module' then update public.modules set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is not distinct from current_revision_id;
    when 'program_topic' then update public.program_topics set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is not distinct from current_revision_id;
    when 'instructor' then update public.instructors set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is not distinct from current_revision_id;
    when 'teaching_note' then update public.teaching_notes set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is not distinct from current_revision_id;
    when 'material' then update public.materials set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is not distinct from current_revision_id;
    when 'institution' then update public.institutions set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is not distinct from current_revision_id;
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'publication could not set the current pointer' using errcode = '40001';
  end if;

  insert into public.curriculum_lifecycle_events (
    content_type, content_id, revision_id, actor_user_id, actor_organization_id,
    action, previous_status, resulting_status, occurred_at
  ) values (
    requested_type, content_id, requested_revision_id, access.user_id, access.organization_id,
    'content_published', 'Draft', 'Published', published
  );

  return jsonb_build_object(
    'content_id', content_id,
    'revision_id', requested_revision_id,
    'status', 'Published',
    'published_at', published
  );
end;
$$;

revoke all on function public.create_successor_draft(public.curriculum_content_type, uuid)
from public, anon, authenticated, service_role;
grant execute on function public.create_successor_draft(public.curriculum_content_type, uuid)
to authenticated;
