-- SPEC-004 Phase 1: Admin-only, role-wide Draft management and publication.

alter type public.curriculum_lifecycle_action add value if not exists 'content_published';

alter table public.curriculum_lifecycle_events
  add column previous_status public.curriculum_revision_status;

create function private.require_admin_content_access()
returns table (user_id uuid, organization_id uuid)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  return query
    select access.user_id, access.organization_id
    from private.current_access() access
    where access.role = 'Admin'::public.product_role;
  if not found then
    raise exception 'eligible Admin access required' using errcode = '42501';
  end if;
end;
$$;

-- Retain the SPEC-003 helper for compatibility, but make its authority match
-- the active Admin-only contract.
create or replace function private.require_contribution_access()
returns table (user_id uuid, organization_id uuid)
language sql stable security definer
set search_path = ''
as $$
  select access.user_id, access.organization_id
  from private.require_admin_content_access() access;
$$;

create function private.is_admin_draft_identity(
  target_type public.curriculum_content_type,
  target_id uuid
)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare compatible boolean;
begin
  case target_type
    when 'module' then
      select exists (
        select 1 from public.modules identity
        where identity.id = target_id and identity.archived_at is null
          and (identity.current_published_revision_id is not null or exists (
            select 1 from public.module_revisions revision
            where revision.module_id = identity.id and revision.status = 'Draft'
          ))
      ) into compatible;
    when 'program_topic' then
      select exists (
        select 1 from public.program_topics identity
        where identity.id = target_id and identity.archived_at is null
          and (identity.current_published_revision_id is not null or exists (
            select 1 from public.program_topic_revisions revision
            where revision.program_topic_id = identity.id and revision.status = 'Draft'
          ))
      ) into compatible;
    when 'instructor' then
      select exists (
        select 1 from public.instructors identity
        where identity.id = target_id and identity.archived_at is null
          and (identity.current_published_revision_id is not null or exists (
            select 1 from public.instructor_revisions revision
            where revision.instructor_id = identity.id and revision.status = 'Draft'
          ))
      ) into compatible;
    when 'material' then
      select exists (
        select 1 from public.materials identity
        where identity.id = target_id and identity.archived_at is null
          and (identity.current_published_revision_id is not null or exists (
            select 1 from public.material_revisions revision
            where revision.material_id = identity.id and revision.status = 'Draft'
          ))
      ) into compatible;
    when 'institution' then
      select exists (
        select 1 from public.institutions identity
        where identity.id = target_id and identity.archived_at is null
          and (identity.current_published_revision_id is not null or exists (
            select 1 from public.institution_revisions revision
            where revision.institution_id = identity.id and revision.status = 'Draft'
          ))
      ) into compatible;
    else
      compatible := false;
  end case;
  return coalesce(compatible, false);
end;
$$;

create or replace function private.is_compatible_contribution_identity(
  target_type public.curriculum_content_type,
  target_id uuid,
  actor_id uuid
)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select private.is_admin_draft_identity(target_type, target_id);
$$;

create or replace function private.assert_relationships(
  content_type public.curriculum_content_type,
  revision_id uuid,
  actor_id uuid
)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  module_id uuid;
  topic_id uuid;
  topic_module_id uuid;
begin
  if content_type = 'program_topic' then
    select revision.module_id into module_id
    from public.program_topic_revisions revision
    where revision.id = revision_id;
    if not private.is_compatible_contribution_identity('module', module_id, actor_id) then
      raise exception 'program topic requires an authorized module' using errcode = '23514';
    end if;
  elsif content_type = 'teaching_note' then
    select revision.module_id, revision.program_topic_id into module_id, topic_id
    from public.teaching_note_revisions revision
    where revision.id = revision_id;
    if not private.is_compatible_contribution_identity('module', module_id, actor_id) then
      raise exception 'teaching note requires an authorized module' using errcode = '23514';
    end if;
    if topic_id is not null then
      if not private.is_compatible_contribution_identity('program_topic', topic_id, actor_id) then
        raise exception 'teaching note requires an authorized program topic' using errcode = '23514';
      end if;
      select topic_revision.module_id into topic_module_id
      from public.program_topics identity
      join public.program_topic_revisions topic_revision on topic_revision.id = coalesce(
        identity.current_published_revision_id,
        (
          select draft.id
          from public.program_topic_revisions draft
          where draft.program_topic_id = identity.id and draft.status = 'Draft'
          order by draft.revision_number desc
          limit 1
        )
      )
      where identity.id = topic_id;
      if topic_module_id is distinct from module_id then
        raise exception 'teaching note topic must belong to its module' using errcode = '23514';
      end if;
    end if;
    if exists (
      select 1 from public.teaching_note_materials relationship
      where relationship.teaching_note_revision_id = revision_id
        and not private.is_compatible_contribution_identity('material', relationship.material_id, actor_id)
    ) then
      raise exception 'teaching note has an unauthorized material' using errcode = '23514';
    end if;
  elsif content_type = 'module' then
    if exists (
      select 1 from public.module_instructors relationship
      where relationship.module_revision_id = revision_id
        and not private.is_compatible_contribution_identity('instructor', relationship.instructor_id, actor_id)
    ) then
      raise exception 'module has an unauthorized instructor' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.module_materials relationship
      where relationship.module_revision_id = revision_id
        and not private.is_compatible_contribution_identity('material', relationship.material_id, actor_id)
    ) then
      raise exception 'module has an unauthorized material' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.module_institutions relationship
      where relationship.module_revision_id = revision_id
        and not private.is_compatible_contribution_identity('institution', relationship.institution_id, actor_id)
    ) then
      raise exception 'module has an unauthorized institution' using errcode = '23514';
    end if;
  end if;
end;
$$;

-- Preserve the old signature because deployed RPCs call it, while removing
-- creator ownership as an authorization boundary between Admins.
create or replace function private.assert_owned_draft(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid,
  actor_id uuid
)
returns uuid
language plpgsql volatile security definer
set search_path = ''
as $$
declare content_id uuid;
begin
  if actor_id is null then
    raise exception 'trusted actor context is required' using errcode = '42501';
  end if;
  case requested_type
    when 'module' then select revision.module_id into content_id from public.module_revisions revision join public.modules identity on identity.id = revision.module_id where revision.id = requested_revision_id and revision.status = 'Draft' and identity.archived_at is null for update of revision;
    when 'program_topic' then select revision.program_topic_id into content_id from public.program_topic_revisions revision join public.program_topics identity on identity.id = revision.program_topic_id where revision.id = requested_revision_id and revision.status = 'Draft' and identity.archived_at is null for update of revision;
    when 'instructor' then select revision.instructor_id into content_id from public.instructor_revisions revision join public.instructors identity on identity.id = revision.instructor_id where revision.id = requested_revision_id and revision.status = 'Draft' and identity.archived_at is null for update of revision;
    when 'teaching_note' then select revision.teaching_note_id into content_id from public.teaching_note_revisions revision join public.teaching_notes identity on identity.id = revision.teaching_note_id where revision.id = requested_revision_id and revision.status = 'Draft' and identity.archived_at is null for update of revision;
    when 'material' then select revision.material_id into content_id from public.material_revisions revision join public.materials identity on identity.id = revision.material_id where revision.id = requested_revision_id and revision.status = 'Draft' and identity.archived_at is null for update of revision;
    when 'institution' then select revision.institution_id into content_id from public.institution_revisions revision join public.institutions identity on identity.id = revision.institution_id where revision.id = requested_revision_id and revision.status = 'Draft' and identity.archived_at is null for update of revision;
  end case;
  if content_id is null then
    raise exception 'active Admin Draft not found' using errcode = '42501';
  end if;
  return content_id;
end;
$$;

create or replace function private.lock_owned_draft_attachment(
  requested_attachment_id uuid,
  actor_id uuid,
  required_state public.curriculum_attachment_state
)
returns public.curriculum_attachments
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  attachment public.curriculum_attachments;
  revision_id uuid;
  requested_type public.curriculum_content_type;
begin
  select * into attachment
  from public.curriculum_attachments candidate
  where candidate.id = requested_attachment_id;
  if attachment.id is null then
    raise exception 'active Admin Draft attachment not found' using errcode = '42501';
  end if;
  if attachment.teaching_note_revision_id is not null then
    requested_type := 'teaching_note';
    revision_id := attachment.teaching_note_revision_id;
  else
    requested_type := 'material';
    revision_id := attachment.material_revision_id;
  end if;
  perform private.assert_owned_draft(requested_type, revision_id, actor_id);
  select * into attachment
  from public.curriculum_attachments candidate
  where candidate.id = requested_attachment_id and candidate.state = required_state
  for update;
  if attachment.id is null then
    raise exception 'attachment is not in the required state' using errcode = '55000';
  end if;
  return attachment;
end;
$$;

create or replace function public.begin_attachment_deletion(requested_attachment_id uuid)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  access record;
  attachment public.curriculum_attachments;
  current_state public.curriculum_attachment_state;
  affected integer;
begin
  select * into access from private.require_admin_content_access();
  select state into current_state
  from public.curriculum_attachments
  where id = requested_attachment_id;
  if current_state not in ('Reserved', 'Ready') or current_state is null then
    raise exception 'attachment is not in the required state' using errcode = '55000';
  end if;
  attachment := private.lock_owned_draft_attachment(requested_attachment_id, access.user_id, current_state);
  update public.curriculum_attachments
  set state = 'Deleting'
  where id = attachment.id and state = current_state;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'begin deletion affected an unexpected row count' using errcode = '40001';
  end if;
  perform private.record_attachment_edit(attachment, access.user_id, access.organization_id);
end;
$$;

create or replace function private.protect_contribution_revision()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
begin
  if old.status = 'Submitted' then
    raise exception 'submitted revisions are immutable' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  if new.id is distinct from old.id
    or to_jsonb(new)->>tg_argv[0] is distinct from to_jsonb(old)->>tg_argv[0]
    or new.revision_number is distinct from old.revision_number
    or new.created_by is distinct from old.created_by
    or new.contributor_organization_id is distinct from old.contributor_organization_id
    or new.created_at is distinct from old.created_at then
    raise exception 'revision provenance is immutable' using errcode = '55000';
  end if;
  if new.submitted_at is distinct from old.submitted_at then
    raise exception 'submission is inactive' using errcode = '55000';
  end if;
  if old.status = 'Draft' and new.status not in ('Draft', 'Published') then
    raise exception 'active lifecycle only permits Draft to Published' using errcode = '55000';
  end if;
  if new.status is distinct from old.status and not (old.status = 'Draft' and new.status = 'Published') then
    raise exception 'invalid lifecycle transition' using errcode = '55000';
  end if;
  if new.published_at is distinct from old.published_at
    and not (old.status = 'Draft' and new.status = 'Published' and old.published_at is null and new.published_at is not null) then
    raise exception 'publication metadata is immutable' using errcode = '55000';
  end if;
  return new;
end;
$$;

create function private.is_current_published_identity(
  target_type public.curriculum_content_type,
  target_id uuid
)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare published boolean;
begin
  case target_type
    when 'module' then
      select exists (select 1 from public.modules identity join public.module_revisions revision on revision.id = identity.current_published_revision_id where identity.id = target_id and identity.archived_at is null and revision.status = 'Published') into published;
    when 'program_topic' then
      select exists (select 1 from public.program_topics identity join public.program_topic_revisions revision on revision.id = identity.current_published_revision_id where identity.id = target_id and identity.archived_at is null and revision.status = 'Published') into published;
    when 'instructor' then
      select exists (select 1 from public.instructors identity join public.instructor_revisions revision on revision.id = identity.current_published_revision_id where identity.id = target_id and identity.archived_at is null and revision.status = 'Published') into published;
    when 'material' then
      select exists (select 1 from public.materials identity join public.material_revisions revision on revision.id = identity.current_published_revision_id where identity.id = target_id and identity.archived_at is null and revision.status = 'Published') into published;
    when 'institution' then
      select exists (select 1 from public.institutions identity join public.institution_revisions revision on revision.id = identity.current_published_revision_id where identity.id = target_id and identity.archived_at is null and revision.status = 'Published') into published;
    else
      published := false;
  end case;
  return coalesce(published, false);
end;
$$;

create function private.validate_publication(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid,
  actor_id uuid
)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare
  module_id uuid;
  topic_id uuid;
  topic_module_id uuid;
begin
  perform private.validate_submission(requested_type, requested_revision_id, actor_id);

  if requested_type = 'program_topic' then
    select revision.module_id into module_id
    from public.program_topic_revisions revision
    where revision.id = requested_revision_id;
    if not private.is_current_published_identity('module', module_id) then
      raise exception 'Program Topic requires a current-published Module' using errcode = '23514';
    end if;
  elsif requested_type = 'teaching_note' then
    select revision.module_id, revision.program_topic_id into module_id, topic_id
    from public.teaching_note_revisions revision
    where revision.id = requested_revision_id;
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

create function public.publish_content_draft(
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
  if not found or archived_at is not null or current_revision_id is not null then
    raise exception 'Draft is not eligible for initial publication' using errcode = '55000';
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
    when 'module' then update public.modules set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is null;
    when 'program_topic' then update public.program_topics set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is null;
    when 'instructor' then update public.instructors set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is null;
    when 'teaching_note' then update public.teaching_notes set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is null;
    when 'material' then update public.materials set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is null;
    when 'institution' then update public.institutions set current_published_revision_id = requested_revision_id where id = content_id and current_published_revision_id is null;
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

create or replace function private.can_access_attachment_object(
  requested_name text,
  requested_operation text
)
returns boolean
language plpgsql volatile security definer
set search_path = ''
as $$
declare attachment public.curriculum_attachments;
begin
  if not exists (
    select 1 from private.current_access() access
    where access.role = 'Admin'::public.product_role
  ) then
    return false;
  end if;
  if requested_operation = 'select' then
    return exists (
      select 1 from public.curriculum_attachments candidate
      where candidate.object_name = requested_name
        and private.attachment_revision_state(candidate) = 'Draft'
    );
  end if;
  if requested_operation not in ('insert', 'delete') then
    return false;
  end if;
  select * into attachment
  from public.curriculum_attachments candidate
  where candidate.object_name = requested_name
    and candidate.state = case requested_operation
      when 'insert' then 'Reserved'::public.curriculum_attachment_state
      else 'Deleting'::public.curriculum_attachment_state
    end
  for update;
  return attachment.id is not null
    and private.attachment_revision_state(attachment) = 'Draft';
end;
$$;

drop policy if exists "Owners read pending attachment metadata" on public.curriculum_attachments;
drop policy if exists "Owners read pending attachment objects" on storage.objects;
drop policy if exists "Owners upload Draft attachment objects" on storage.objects;
drop policy if exists "Owners delete Draft attachment objects" on storage.objects;

drop policy if exists "Owners see pending modules" on public.modules;
drop policy if exists "Owners see pending module revisions" on public.module_revisions;
drop policy if exists "Owners see pending program topics" on public.program_topics;
drop policy if exists "Owners see pending program topic revisions" on public.program_topic_revisions;
drop policy if exists "Owners see pending instructors" on public.instructors;
drop policy if exists "Owners see pending instructor revisions" on public.instructor_revisions;
drop policy if exists "Owners see pending teaching notes" on public.teaching_notes;
drop policy if exists "Owners see pending teaching note revisions" on public.teaching_note_revisions;
drop policy if exists "Owners see pending materials" on public.materials;
drop policy if exists "Owners see pending material revisions" on public.material_revisions;
drop policy if exists "Owners see pending institutions" on public.institutions;
drop policy if exists "Owners see pending institution revisions" on public.institution_revisions;
drop policy if exists "Owners see pending module instructors" on public.module_instructors;
drop policy if exists "Owners see pending module materials" on public.module_materials;
drop policy if exists "Owners see pending module institutions" on public.module_institutions;
drop policy if exists "Owners see pending teaching note materials" on public.teaching_note_materials;

create policy "Admins read Draft attachment metadata" on public.curriculum_attachments
for select to authenticated using (
  exists (select 1 from private.current_access() access where access.role = 'Admin')
  and (
    (teaching_note_revision_id is not null and exists (
      select 1 from public.teaching_note_revisions revision
      where revision.id = teaching_note_revision_id and revision.status = 'Draft'
    )) or
    (material_revision_id is not null and exists (
      select 1 from public.material_revisions revision
      where revision.id = material_revision_id and revision.status = 'Draft'
    ))
  )
);
create policy "Admins read Draft attachment objects" on storage.objects
for select to authenticated using (
  bucket_id = 'governed-attachments' and private.can_access_attachment_object(name, 'select')
);
create policy "Admins upload Draft attachment objects" on storage.objects
for insert to authenticated with check (
  bucket_id = 'governed-attachments' and private.can_access_attachment_object(name, 'insert')
);
create policy "Admins delete Draft attachment objects" on storage.objects
for delete to authenticated using (
  bucket_id = 'governed-attachments' and private.can_access_attachment_object(name, 'delete')
);

create policy "Admins see Draft modules" on public.modules for select to authenticated
  using (archived_at is null and exists (select 1 from private.current_access() access where access.role = 'Admin'));
create policy "Admins see Draft module revisions" on public.module_revisions for select to authenticated
  using (status = 'Draft' and exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.modules identity where identity.id = module_id and identity.archived_at is null));
create policy "Admins see Draft program topics" on public.program_topics for select to authenticated
  using (archived_at is null and exists (select 1 from private.current_access() access where access.role = 'Admin'));
create policy "Admins see Draft program topic revisions" on public.program_topic_revisions for select to authenticated
  using (status = 'Draft' and exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.program_topics identity where identity.id = program_topic_id and identity.archived_at is null));
create policy "Admins see Draft instructors" on public.instructors for select to authenticated
  using (archived_at is null and exists (select 1 from private.current_access() access where access.role = 'Admin'));
create policy "Admins see Draft instructor revisions" on public.instructor_revisions for select to authenticated
  using (status = 'Draft' and exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.instructors identity where identity.id = instructor_id and identity.archived_at is null));
create policy "Admins see Draft teaching notes" on public.teaching_notes for select to authenticated
  using (archived_at is null and exists (select 1 from private.current_access() access where access.role = 'Admin'));
create policy "Admins see Draft teaching note revisions" on public.teaching_note_revisions for select to authenticated
  using (status = 'Draft' and exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.teaching_notes identity where identity.id = teaching_note_id and identity.archived_at is null));
create policy "Admins see Draft materials" on public.materials for select to authenticated
  using (archived_at is null and exists (select 1 from private.current_access() access where access.role = 'Admin'));
create policy "Admins see Draft material revisions" on public.material_revisions for select to authenticated
  using (status = 'Draft' and exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.materials identity where identity.id = material_id and identity.archived_at is null));
create policy "Admins see Draft institutions" on public.institutions for select to authenticated
  using (archived_at is null and exists (select 1 from private.current_access() access where access.role = 'Admin'));
create policy "Admins see Draft institution revisions" on public.institution_revisions for select to authenticated
  using (status = 'Draft' and exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.institutions identity where identity.id = institution_id and identity.archived_at is null));

create policy "Admins see Draft module instructors" on public.module_instructors for select to authenticated
  using (exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.module_revisions revision where revision.id = module_revision_id and revision.status = 'Draft'));
create policy "Admins see Draft module materials" on public.module_materials for select to authenticated
  using (exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.module_revisions revision where revision.id = module_revision_id and revision.status = 'Draft'));
create policy "Admins see Draft module institutions" on public.module_institutions for select to authenticated
  using (exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.module_revisions revision where revision.id = module_revision_id and revision.status = 'Draft'));
create policy "Admins see Draft teaching note materials" on public.teaching_note_materials for select to authenticated
  using (exists (select 1 from private.current_access() access where access.role = 'Admin')
    and exists (select 1 from public.teaching_note_revisions revision where revision.id = teaching_note_revision_id and revision.status = 'Draft'));

grant select on public.curriculum_lifecycle_events to authenticated;
create policy "Admins read lifecycle events" on public.curriculum_lifecycle_events
for select to authenticated using (
  exists (select 1 from private.current_access() access where access.role = 'Admin')
);

revoke all on function private.require_admin_content_access(),
  private.is_admin_draft_identity(public.curriculum_content_type, uuid),
  private.is_current_published_identity(public.curriculum_content_type, uuid),
  private.validate_publication(public.curriculum_content_type, uuid, uuid)
from public, anon, authenticated, service_role;

revoke all on function public.publish_content_draft(public.curriculum_content_type, uuid)
from public, anon, authenticated, service_role;
grant execute on function public.publish_content_draft(public.curriculum_content_type, uuid)
to authenticated;

-- Submission remains physically representable for history but is not executable
-- by any ordinary application role during D-030.
revoke all on function public.submit_contribution(public.curriculum_content_type, uuid)
from public, anon, authenticated, service_role;
