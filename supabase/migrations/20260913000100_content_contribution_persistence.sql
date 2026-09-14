-- SPEC-003 persistence phase: owner-authored new drafts, submission, events, and private attachments.

alter table public.module_revisions
  add column contributor_organization_id uuid references public.organizations(id) on delete restrict,
  add column submitted_at timestamptz;
alter table public.program_topic_revisions
  add column contributor_organization_id uuid references public.organizations(id) on delete restrict,
  add column submitted_at timestamptz;
alter table public.instructor_revisions
  add column contributor_organization_id uuid references public.organizations(id) on delete restrict,
  add column submitted_at timestamptz;
alter table public.teaching_note_revisions
  add column contributor_organization_id uuid references public.organizations(id) on delete restrict,
  add column submitted_at timestamptz;
alter table public.material_revisions
  add column contributor_organization_id uuid references public.organizations(id) on delete restrict,
  add column submitted_at timestamptz;
alter table public.institution_revisions
  add column contributor_organization_id uuid references public.organizations(id) on delete restrict,
  add column submitted_at timestamptz;

-- Imported Published rows predate contribution provenance and remain valid. New
-- authored rows receive both provenance fields from the trusted RPCs below.
alter table public.module_revisions add constraint module_revisions_submission_metadata_check check (
  (status = 'Draft' and submitted_at is null) or
  (status = 'Submitted' and submitted_at is not null) or
  status not in ('Draft', 'Submitted')
);
alter table public.program_topic_revisions add constraint program_topic_revisions_submission_metadata_check check (
  (status = 'Draft' and submitted_at is null) or
  (status = 'Submitted' and submitted_at is not null) or
  status not in ('Draft', 'Submitted')
);
alter table public.instructor_revisions add constraint instructor_revisions_submission_metadata_check check (
  (status = 'Draft' and submitted_at is null) or
  (status = 'Submitted' and submitted_at is not null) or
  status not in ('Draft', 'Submitted')
);
alter table public.teaching_note_revisions add constraint teaching_note_revisions_submission_metadata_check check (
  (status = 'Draft' and submitted_at is null) or
  (status = 'Submitted' and submitted_at is not null) or
  status not in ('Draft', 'Submitted')
);
alter table public.material_revisions add constraint material_revisions_submission_metadata_check check (
  (status = 'Draft' and submitted_at is null) or
  (status = 'Submitted' and submitted_at is not null) or
  status not in ('Draft', 'Submitted')
);
alter table public.institution_revisions add constraint institution_revisions_submission_metadata_check check (
  (status = 'Draft' and submitted_at is null) or
  (status = 'Submitted' and submitted_at is not null) or
  status not in ('Draft', 'Submitted')
);

-- SPEC-002 created this unnamed table CHECK first, so PostgreSQL assigned the
-- deterministic name below. Fail if the predecessor schema is not exactly the
-- reviewed shape instead of silently leaving attachment-only notes impossible.
do $$
declare constraint_definition text;
begin
  select pg_get_constraintdef(c.oid) into constraint_definition
  from pg_constraint c
  where c.conrelid = 'public.teaching_note_revisions'::regclass
    and c.contype = 'c'
    and c.conname = 'teaching_note_revisions_check';
  if constraint_definition is distinct from 'CHECK (((text IS NOT NULL) OR (source_url IS NOT NULL)))' then
    raise exception 'unexpected or missing SPEC-002 Teaching Note source constraint: %', coalesce(constraint_definition, '<missing>')
      using errcode = '55000';
  end if;
  alter table public.teaching_note_revisions drop constraint teaching_note_revisions_check;
end;
$$;

create type public.curriculum_content_type as enum (
  'module', 'program_topic', 'instructor', 'teaching_note', 'material', 'institution'
);
create type public.curriculum_lifecycle_action as enum (
  'content_created', 'revision_created', 'revision_edited', 'content_submitted', 'draft_deleted'
);
create type public.curriculum_attachment_state as enum ('Reserved', 'Ready', 'Deleting');

create table public.curriculum_lifecycle_events (
  id bigint generated always as identity primary key,
  content_type public.curriculum_content_type not null,
  content_id uuid not null,
  revision_id uuid,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  actor_organization_id uuid not null references public.organizations(id) on delete restrict,
  action public.curriculum_lifecycle_action not null,
  resulting_status public.curriculum_revision_status,
  occurred_at timestamptz not null default clock_timestamp()
);
create index curriculum_lifecycle_events_content_idx
  on public.curriculum_lifecycle_events(content_type, content_id, occurred_at);
alter table public.curriculum_lifecycle_events enable row level security;
revoke all on public.curriculum_lifecycle_events from public, anon, authenticated;

create table public.curriculum_attachments (
  id uuid primary key default gen_random_uuid(),
  object_name text not null unique,
  original_filename text not null check (
    original_filename = trim(original_filename)
    and length(original_filename) between 1 and 255
    and original_filename !~ '[[:cntrl:]]'
    and position('"' in original_filename) = 0
    and position('/' in original_filename) = 0
    and position(chr(92) in original_filename) = 0
  ),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 3145728),
  teaching_note_revision_id uuid references public.teaching_note_revisions(id) on delete cascade,
  material_revision_id uuid references public.material_revisions(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  contributor_organization_id uuid not null references public.organizations(id) on delete restrict,
  state public.curriculum_attachment_state not null default 'Reserved',
  created_at timestamptz not null default now(),
  constraint curriculum_attachments_one_typed_revision check (
    num_nonnulls(teaching_note_revision_id, material_revision_id) = 1
  ),
  constraint curriculum_attachments_opaque_name check (
    object_name = id::text
  ),
  constraint curriculum_attachments_document_mime check (mime_type in (
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.spreadsheet'
  ))
);
create index curriculum_attachments_teaching_note_idx
  on public.curriculum_attachments(teaching_note_revision_id);
create index curriculum_attachments_material_idx
  on public.curriculum_attachments(material_revision_id);
alter table public.curriculum_attachments enable row level security;
revoke all on public.curriculum_attachments from public, anon, authenticated;
grant select on public.curriculum_attachments to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'governed-attachments', 'governed-attachments', false, 3145728,
  array[
    'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.spreadsheet'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function private.require_contribution_access()
returns table (user_id uuid, organization_id uuid)
language plpgsql stable security definer
set search_path = ''
as $$
begin
  return query select a.user_id, a.organization_id from private.current_access() a;
  if not found then
    raise exception 'eligible authenticated access required' using errcode = '42501';
  end if;
end;
$$;

create function private.assert_payload_keys(payload jsonb, allowed_keys text[])
returns void
language plpgsql stable security invoker
set search_path = ''
as $$
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be an object' using errcode = '22023';
  end if;
  if pg_column_size(payload) > 65536 then
    raise exception 'payload exceeds 64 KiB' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_object_keys(payload) k where not (k = any(allowed_keys))) then
    raise exception 'payload contains an unsupported field' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_each(payload) f where jsonb_typeof(f.value)='string' and length(f.value #>> '{}') > 20000) then
    raise exception 'payload text field is too long' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_each(payload) f where case when jsonb_typeof(f.value)='array' then jsonb_array_length(f.value) > 100 else false end) then
    raise exception 'payload array has too many values' using errcode = '22023';
  end if;
end;
$$;

create function private.jsonb_text_array(value jsonb)
returns text[]
language plpgsql immutable security invoker
set search_path = ''
as $$
declare result text[];
begin
  if value is null then return '{}'::text[]; end if;
  if jsonb_typeof(value) <> 'array' then
    raise exception 'array field must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(value) > 100 or exists (
    select 1 from jsonb_array_elements_text(value) v where length(trim(v)) not between 1 and 1000
  ) then raise exception 'array field exceeds value limits' using errcode = '22023'; end if;
  select coalesce(array_agg(v), '{}'::text[]) into result from jsonb_array_elements_text(value) v;
  return result;
end;
$$;

create function private.is_valid_https_url(value text)
returns boolean
language plpgsql immutable security invoker
set search_path = ''
as $$
declare
  remainder text;
  authority text;
  host text;
  port_text text;
  label text;
  colon_count integer;
begin
  if value is null or length(value) > 2048 or value ~ '[[:space:]]' or left(value,8) <> 'https://' then
    return false;
  end if;
  remainder := substring(value from 9);
  authority := substring(remainder from '^([^/?#]+)');
  if authority is null or authority='' or authority like '%@%' then return false; end if;
  colon_count := length(authority)-length(replace(authority,':',''));
  if colon_count > 1 then return false; end if;
  if colon_count=1 then
    host := split_part(authority,':',1);
    port_text := split_part(authority,':',2);
    if port_text !~ '^[0-9]{1,5}$' then return false; end if;
    if port_text::integer not between 1 and 65535 then return false; end if;
  else
    host := authority;
  end if;
  if length(host) not between 1 and 253 then return false; end if;
  foreach label in array string_to_array(host,'.') loop
    if length(label) not between 1 and 63
      or label !~ '^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$' then return false;
    end if;
  end loop;
  return true;
end;
$$;

create function private.assert_content_payload_bounds(requested_type public.curriculum_content_type, payload jsonb)
returns void
language plpgsql immutable security invoker
set search_path = ''
as $$
declare valid boolean;
begin
  valid := case requested_type
    when 'module' then coalesce(length(payload->>'description'),0) <= 10000
      and coalesce(length(payload->>'level'),0) <= 240 and coalesce(length(payload->>'delivery_format'),0) <= 240
      and coalesce(length(payload->>'suggested_duration'),0) <= 240
    when 'program_topic' then coalesce(length(payload->>'description'),0) <= 10000
    when 'instructor' then coalesce(length(payload->>'role_or_title'),0) <= 240
      and coalesce(length(payload->>'institution'),0) <= 240 and coalesce(length(payload->>'profile'),0) <= 10000
      and coalesce(length(payload->>'country'),0) <= 240 and coalesce(length(payload->>'linkedin_url'),0) <= 2048
    when 'teaching_note' then coalesce(length(payload->>'text'),0) <= 20000 and coalesce(length(payload->>'source_url'),0) <= 2048
    when 'material' then coalesce(length(payload->>'description'),0) <= 10000
      and coalesce(length(payload->>'source_or_institution'),0) <= 500 and coalesce(length(payload->>'source_url'),0) <= 2048
      and coalesce(length(payload->>'country_or_scope'),0) <= 240 and coalesce(length(payload->>'theme'),0) <= 240
    when 'institution' then coalesce(length(payload->>'country_or_scope'),0) <= 240
      and coalesce(length(payload->>'description'),0) <= 10000 and coalesce(length(payload->>'website_url'),0) <= 2048
  end;
  if not coalesce(valid,false) then raise exception 'payload field exceeds content limits' using errcode='22023'; end if;
end;
$$;

create function private.is_compatible_contribution_identity(
  target_type public.curriculum_content_type,
  target_id uuid,
  actor_id uuid
)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare compatible boolean;
begin
  case target_type
    when 'module' then
      select exists(select 1 from public.modules i where i.id = target_id and i.archived_at is null and (
        i.current_published_revision_id is not null or
        (i.current_published_revision_id is null and i.created_by = actor_id and exists (
          select 1 from public.module_revisions r where r.module_id = i.id and r.created_by = actor_id and r.status in ('Draft','Submitted')
        )))) into compatible;
    when 'program_topic' then
      select exists(select 1 from public.program_topics i where i.id = target_id and i.archived_at is null and (
        i.current_published_revision_id is not null or
        (i.current_published_revision_id is null and i.created_by = actor_id and exists (
          select 1 from public.program_topic_revisions r where r.program_topic_id = i.id and r.created_by = actor_id and r.status in ('Draft','Submitted')
        )))) into compatible;
    when 'instructor' then
      select exists(select 1 from public.instructors i where i.id = target_id and i.archived_at is null and (
        i.current_published_revision_id is not null or
        (i.current_published_revision_id is null and i.created_by = actor_id and exists (
          select 1 from public.instructor_revisions r where r.instructor_id = i.id and r.created_by = actor_id and r.status in ('Draft','Submitted')
        )))) into compatible;
    when 'material' then
      select exists(select 1 from public.materials i where i.id = target_id and i.archived_at is null and (
        i.current_published_revision_id is not null or
        (i.current_published_revision_id is null and i.created_by = actor_id and exists (
          select 1 from public.material_revisions r where r.material_id = i.id and r.created_by = actor_id and r.status in ('Draft','Submitted')
        )))) into compatible;
    when 'institution' then
      select exists(select 1 from public.institutions i where i.id = target_id and i.archived_at is null and (
        i.current_published_revision_id is not null or
        (i.current_published_revision_id is null and i.created_by = actor_id and exists (
          select 1 from public.institution_revisions r where r.institution_id = i.id and r.created_by = actor_id and r.status in ('Draft','Submitted')
        )))) into compatible;
    else compatible := false;
  end case;
  return coalesce(compatible, false);
end;
$$;

create function private.assert_relationships(
  content_type public.curriculum_content_type,
  revision_id uuid,
  actor_id uuid
)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare module_id uuid; topic_id uuid; topic_module_id uuid;
begin
  if content_type = 'program_topic' then
    select r.module_id into module_id from public.program_topic_revisions r where r.id = revision_id;
    if not private.is_compatible_contribution_identity('module', module_id, actor_id) then
      raise exception 'program topic requires an authorized module' using errcode = '23514';
    end if;
  elsif content_type = 'teaching_note' then
    select r.module_id, r.program_topic_id into module_id, topic_id
    from public.teaching_note_revisions r where r.id = revision_id;
    if not private.is_compatible_contribution_identity('module', module_id, actor_id) then
      raise exception 'teaching note requires an authorized module' using errcode = '23514';
    end if;
    if topic_id is not null then
      if not private.is_compatible_contribution_identity('program_topic', topic_id, actor_id) then
        raise exception 'teaching note requires an authorized program topic' using errcode = '23514';
      end if;
      select r.module_id into topic_module_id
      from public.program_topics i
      join public.program_topic_revisions r on r.id = coalesce(i.current_published_revision_id, (
        select d.id from public.program_topic_revisions d
        where d.program_topic_id = i.id and d.created_by = actor_id and d.status in ('Draft','Submitted')
        order by d.revision_number desc limit 1
      )) where i.id = topic_id;
      if topic_module_id is distinct from module_id then
        raise exception 'teaching note topic must belong to its module' using errcode = '23514';
      end if;
    end if;
    if exists (
      select 1 from public.teaching_note_materials x
      where x.teaching_note_revision_id = revision_id
        and not private.is_compatible_contribution_identity('material', x.material_id, actor_id)
    ) then raise exception 'teaching note has an unauthorized material' using errcode = '23514'; end if;
  elsif content_type = 'module' then
    if exists (select 1 from public.module_instructors x where x.module_revision_id = revision_id
      and not private.is_compatible_contribution_identity('instructor', x.instructor_id, actor_id)) then
      raise exception 'module has an unauthorized instructor' using errcode = '23514';
    end if;
    if exists (select 1 from public.module_materials x where x.module_revision_id = revision_id
      and not private.is_compatible_contribution_identity('material', x.material_id, actor_id)) then
      raise exception 'module has an unauthorized material' using errcode = '23514';
    end if;
    if exists (select 1 from public.module_institutions x where x.module_revision_id = revision_id
      and not private.is_compatible_contribution_identity('institution', x.institution_id, actor_id)) then
      raise exception 'module has an unauthorized institution' using errcode = '23514';
    end if;
  end if;
end;
$$;

create function private.replace_contribution_relationships(
  content_type public.curriculum_content_type,
  revision_id uuid,
  actor_id uuid,
  payload jsonb
)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare target_id uuid;
begin
  if content_type = 'module' then
    delete from public.module_instructors where module_revision_id = revision_id;
    for target_id in select value::uuid from jsonb_array_elements_text(coalesce(payload->'instructor_ids', '[]'::jsonb)) loop
      if not private.is_compatible_contribution_identity('instructor', target_id, actor_id) then raise exception 'unauthorized instructor' using errcode = '23514'; end if;
      insert into public.module_instructors values (revision_id, target_id);
    end loop;
    delete from public.module_materials where module_revision_id = revision_id;
    for target_id in select value::uuid from jsonb_array_elements_text(coalesce(payload->'material_ids', '[]'::jsonb)) loop
      if not private.is_compatible_contribution_identity('material', target_id, actor_id) then raise exception 'unauthorized material' using errcode = '23514'; end if;
      insert into public.module_materials values (revision_id, target_id);
    end loop;
    delete from public.module_institutions where module_revision_id = revision_id;
    for target_id in select value::uuid from jsonb_array_elements_text(coalesce(payload->'institution_ids', '[]'::jsonb)) loop
      if not private.is_compatible_contribution_identity('institution', target_id, actor_id) then raise exception 'unauthorized institution' using errcode = '23514'; end if;
      insert into public.module_institutions values (revision_id, target_id);
    end loop;
  elsif content_type = 'teaching_note' then
    delete from public.teaching_note_materials where teaching_note_revision_id = revision_id;
    for target_id in select value::uuid from jsonb_array_elements_text(coalesce(payload->'material_ids', '[]'::jsonb)) loop
      if not private.is_compatible_contribution_identity('material', target_id, actor_id) then raise exception 'unauthorized material' using errcode = '23514'; end if;
      insert into public.teaching_note_materials values (revision_id, target_id);
    end loop;
  end if;
end;
$$;

create function private.protect_contribution_revision()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
begin
  if old.status = 'Submitted' then
    raise exception 'submitted revisions are immutable' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.id is distinct from old.id
    or to_jsonb(new)->>tg_argv[0] is distinct from to_jsonb(old)->>tg_argv[0]
    or new.revision_number is distinct from old.revision_number
    or new.created_by is distinct from old.created_by
    or new.contributor_organization_id is distinct from old.contributor_organization_id
    or new.created_at is distinct from old.created_at then
    raise exception 'revision provenance is immutable' using errcode = '55000';
  end if;
  if old.status = 'Draft' and new.status not in ('Draft', 'Submitted') then
    raise exception 'SPEC-003 only permits Draft to Submitted' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger protect_module_contribution before update or delete on public.module_revisions
  for each row execute function private.protect_contribution_revision('module_id');
create trigger protect_program_topic_contribution before update or delete on public.program_topic_revisions
  for each row execute function private.protect_contribution_revision('program_topic_id');
create trigger protect_instructor_contribution before update or delete on public.instructor_revisions
  for each row execute function private.protect_contribution_revision('instructor_id');
create trigger protect_teaching_note_contribution before update or delete on public.teaching_note_revisions
  for each row execute function private.protect_contribution_revision('teaching_note_id');
create trigger protect_material_contribution before update or delete on public.material_revisions
  for each row execute function private.protect_contribution_revision('material_id');
create trigger protect_institution_contribution before update or delete on public.institution_revisions
  for each row execute function private.protect_contribution_revision('institution_id');

create function private.protect_submitted_relationship()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare old_revision_id uuid; new_revision_id uuid; revision_status public.curriculum_revision_status;
begin
  if tg_op <> 'INSERT' then
    old_revision_id := (to_jsonb(old)->>tg_argv[1])::uuid;
    execute format('select status from public.%I where id=$1',tg_argv[0]) into revision_status using old_revision_id;
    if revision_status='Submitted' then raise exception 'submitted relationships are immutable' using errcode='55000'; end if;
  end if;
  if tg_op <> 'DELETE' then
    new_revision_id := (to_jsonb(new)->>tg_argv[1])::uuid;
    execute format('select status from public.%I where id=$1',tg_argv[0]) into revision_status using new_revision_id;
    if revision_status='Submitted' then raise exception 'submitted relationships are immutable' using errcode='55000'; end if;
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;

create trigger protect_submitted_module_instructors before insert or update or delete on public.module_instructors
  for each row execute function private.protect_submitted_relationship('module_revisions','module_revision_id');
create trigger protect_submitted_module_materials before insert or update or delete on public.module_materials
  for each row execute function private.protect_submitted_relationship('module_revisions','module_revision_id');
create trigger protect_submitted_module_institutions before insert or update or delete on public.module_institutions
  for each row execute function private.protect_submitted_relationship('module_revisions','module_revision_id');
create trigger protect_submitted_teaching_note_materials before insert or update or delete on public.teaching_note_materials
  for each row execute function private.protect_submitted_relationship('teaching_note_revisions','teaching_note_revision_id');

create function private.protect_lifecycle_event()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$ begin raise exception 'lifecycle events are append-only' using errcode='55000'; end; $$;
create trigger protect_lifecycle_event before update or delete on public.curriculum_lifecycle_events
  for each row execute function private.protect_lifecycle_event();

create function private.attachment_revision_state(attachment public.curriculum_attachments)
returns public.curriculum_revision_status
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select status from public.teaching_note_revisions where id=attachment.teaching_note_revision_id),
    (select status from public.material_revisions where id=attachment.material_revision_id)
  );
$$;

create function private.protect_attachment_metadata()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare old_status public.curriculum_revision_status; new_status public.curriculum_revision_status;
begin
  if tg_op <> 'INSERT' then
    old_status := private.attachment_revision_state(old);
    if old_status='Submitted' then raise exception 'submitted attachments are immutable' using errcode='55000'; end if;
    if tg_op='DELETE' and old.state not in ('Reserved','Deleting') then
      raise exception 'Ready attachment metadata requires begin deletion' using errcode='55000';
    end if;
  end if;
  if tg_op <> 'DELETE' then
    new_status := private.attachment_revision_state(new);
    if new_status is distinct from 'Draft' then raise exception 'attachments may only be added to Drafts' using errcode='55000'; end if;
    if tg_op='INSERT' and new.state <> 'Reserved' then
      raise exception 'new attachment metadata must be Reserved' using errcode='55000';
    end if;
    if tg_op='UPDATE' and (new.id is distinct from old.id or new.created_by is distinct from old.created_by
      or new.contributor_organization_id is distinct from old.contributor_organization_id
      or new.created_at is distinct from old.created_at) then
      raise exception 'attachment provenance is immutable' using errcode='55000';
    end if;
    if tg_op='UPDATE' and not (
      (old.state='Reserved' and new.state='Ready') or
      (old.state='Reserved' and new.state='Deleting') or
      (old.state='Ready' and new.state='Deleting') or
      (old.state='Deleting' and new.state='Ready')
    ) then raise exception 'invalid attachment metadata transition' using errcode='55000'; end if;
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
create trigger protect_attachment_metadata before insert or update or delete on public.curriculum_attachments
  for each row execute function private.protect_attachment_metadata();

create function public.create_contribution(
  requested_type public.curriculum_content_type,
  payload jsonb
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare access record; content_id uuid := gen_random_uuid(); revision_id uuid := gen_random_uuid(); affected integer;
begin
  select * into access from private.require_contribution_access();
  perform private.assert_content_payload_bounds(requested_type,payload);
  case requested_type
    when 'module' then
      perform private.assert_payload_keys(payload, array['axis_id','title','theme','description','learning_outcomes','level','delivery_format','suggested_duration','instructor_ids','material_ids','institution_ids']);
      insert into public.modules(id, created_by) values (content_id, access.user_id);
      insert into public.module_revisions(id,module_id,revision_number,status,axis_id,title,theme,description,learning_outcomes,level,delivery_format,suggested_duration,created_by,contributor_organization_id)
      values(revision_id,content_id,1,'Draft',(payload->>'axis_id')::uuid,payload->>'title',payload->>'theme',payload->>'description',private.jsonb_text_array(payload->'learning_outcomes'),payload->>'level',payload->>'delivery_format',payload->>'suggested_duration',access.user_id,access.organization_id);
    when 'program_topic' then
      perform private.assert_payload_keys(payload, array['module_id','title','description','position']);
      insert into public.program_topics(id, created_by) values (content_id, access.user_id);
      insert into public.program_topic_revisions(id,program_topic_id,revision_number,status,module_id,title,description,position,created_by,contributor_organization_id)
      values(revision_id,content_id,1,'Draft',(payload->>'module_id')::uuid,payload->>'title',payload->>'description',(payload->>'position')::integer,access.user_id,access.organization_id);
    when 'instructor' then
      perform private.assert_payload_keys(payload, array['name','role_or_title','institution','profile','linkedin_url','thematic_axis_or_themes','country']);
      insert into public.instructors(id, created_by) values (content_id, access.user_id);
      insert into public.instructor_revisions(id,instructor_id,revision_number,status,name,role_or_title,institution,profile,linkedin_url,thematic_axis_or_themes,country,created_by,contributor_organization_id)
      values(revision_id,content_id,1,'Draft',payload->>'name',payload->>'role_or_title',payload->>'institution',payload->>'profile',payload->>'linkedin_url',private.jsonb_text_array(payload->'thematic_axis_or_themes'),payload->>'country',access.user_id,access.organization_id);
    when 'teaching_note' then
      perform private.assert_payload_keys(payload, array['module_id','program_topic_id','title','text','source_url','material_ids']);
      insert into public.teaching_notes(id, created_by) values (content_id, access.user_id);
      insert into public.teaching_note_revisions(id,teaching_note_id,revision_number,status,module_id,program_topic_id,title,text,source_url,created_by,contributor_organization_id)
      values(revision_id,content_id,1,'Draft',(payload->>'module_id')::uuid,(payload->>'program_topic_id')::uuid,payload->>'title',payload->>'text',payload->>'source_url',access.user_id,access.organization_id);
    when 'material' then
      perform private.assert_payload_keys(payload, array['title','material_type','description','source_or_institution','source_url','country_or_scope','theme']);
      insert into public.materials(id, created_by) values (content_id, access.user_id);
      insert into public.material_revisions(id,material_id,revision_number,status,title,material_type,description,source_or_institution,source_url,country_or_scope,theme,created_by,contributor_organization_id)
      values(revision_id,content_id,1,'Draft',payload->>'title',payload->>'material_type',payload->>'description',payload->>'source_or_institution',payload->>'source_url',payload->>'country_or_scope',payload->>'theme',access.user_id,access.organization_id);
    when 'institution' then
      perform private.assert_payload_keys(payload, array['name','institution_type','country_or_scope','description','website_url','themes']);
      insert into public.institutions(id, created_by) values (content_id, access.user_id);
      insert into public.institution_revisions(id,institution_id,revision_number,status,name,institution_type,country_or_scope,description,website_url,themes,created_by,contributor_organization_id)
      values(revision_id,content_id,1,'Draft',payload->>'name',payload->>'institution_type',payload->>'country_or_scope',payload->>'description',payload->>'website_url',private.jsonb_text_array(payload->'themes'),access.user_id,access.organization_id);
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Draft creation affected an unexpected row count' using errcode='40001'; end if;
  perform private.replace_contribution_relationships(requested_type, revision_id, access.user_id, payload);
  perform private.assert_relationships(requested_type, revision_id, access.user_id);
  insert into public.curriculum_lifecycle_events(content_type,content_id,revision_id,actor_user_id,actor_organization_id,action,resulting_status)
  values
    (requested_type,content_id,revision_id,access.user_id,access.organization_id,'content_created','Draft'),
    (requested_type,content_id,revision_id,access.user_id,access.organization_id,'revision_created','Draft');
  return jsonb_build_object('content_id',content_id,'revision_id',revision_id,'status','Draft');
end;
$$;

create function private.assert_owned_draft(
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
  case requested_type
    when 'module' then select module_id into content_id from public.module_revisions where id=requested_revision_id and created_by=actor_id and status='Draft' for update;
    when 'program_topic' then select program_topic_id into content_id from public.program_topic_revisions where id=requested_revision_id and created_by=actor_id and status='Draft' for update;
    when 'instructor' then select instructor_id into content_id from public.instructor_revisions where id=requested_revision_id and created_by=actor_id and status='Draft' for update;
    when 'teaching_note' then select teaching_note_id into content_id from public.teaching_note_revisions where id=requested_revision_id and created_by=actor_id and status='Draft' for update;
    when 'material' then select material_id into content_id from public.material_revisions where id=requested_revision_id and created_by=actor_id and status='Draft' for update;
    when 'institution' then select institution_id into content_id from public.institution_revisions where id=requested_revision_id and created_by=actor_id and status='Draft' for update;
  end case;
  if content_id is null then raise exception 'owned Draft not found' using errcode='42501'; end if;
  return content_id;
end;
$$;

create function public.update_contribution(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid,
  payload jsonb
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare access record; content_id uuid; affected integer;
begin
  select * into access from private.require_contribution_access();
  content_id := private.assert_owned_draft(requested_type, requested_revision_id, access.user_id);
  perform private.assert_content_payload_bounds(requested_type,payload);
  case requested_type
    when 'module' then
      perform private.assert_payload_keys(payload, array['axis_id','title','theme','description','learning_outcomes','level','delivery_format','suggested_duration','instructor_ids','material_ids','institution_ids']);
      update public.module_revisions set axis_id=(payload->>'axis_id')::uuid,title=payload->>'title',theme=payload->>'theme',description=payload->>'description',learning_outcomes=private.jsonb_text_array(payload->'learning_outcomes'),level=payload->>'level',delivery_format=payload->>'delivery_format',suggested_duration=payload->>'suggested_duration' where id=requested_revision_id;
    when 'program_topic' then
      perform private.assert_payload_keys(payload, array['module_id','title','description','position']);
      update public.program_topic_revisions set module_id=(payload->>'module_id')::uuid,title=payload->>'title',description=payload->>'description',position=(payload->>'position')::integer where id=requested_revision_id;
    when 'instructor' then
      perform private.assert_payload_keys(payload, array['name','role_or_title','institution','profile','linkedin_url','thematic_axis_or_themes','country']);
      update public.instructor_revisions set name=payload->>'name',role_or_title=payload->>'role_or_title',institution=payload->>'institution',profile=payload->>'profile',linkedin_url=payload->>'linkedin_url',thematic_axis_or_themes=private.jsonb_text_array(payload->'thematic_axis_or_themes'),country=payload->>'country' where id=requested_revision_id;
    when 'teaching_note' then
      perform private.assert_payload_keys(payload, array['module_id','program_topic_id','title','text','source_url','material_ids']);
      update public.teaching_note_revisions set module_id=(payload->>'module_id')::uuid,program_topic_id=(payload->>'program_topic_id')::uuid,title=payload->>'title',text=payload->>'text',source_url=payload->>'source_url' where id=requested_revision_id;
    when 'material' then
      perform private.assert_payload_keys(payload, array['title','material_type','description','source_or_institution','source_url','country_or_scope','theme']);
      update public.material_revisions set title=payload->>'title',material_type=payload->>'material_type',description=payload->>'description',source_or_institution=payload->>'source_or_institution',source_url=payload->>'source_url',country_or_scope=payload->>'country_or_scope',theme=payload->>'theme' where id=requested_revision_id;
    when 'institution' then
      perform private.assert_payload_keys(payload, array['name','institution_type','country_or_scope','description','website_url','themes']);
      update public.institution_revisions set name=payload->>'name',institution_type=payload->>'institution_type',country_or_scope=payload->>'country_or_scope',description=payload->>'description',website_url=payload->>'website_url',themes=private.jsonb_text_array(payload->'themes') where id=requested_revision_id;
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Draft mutation affected an unexpected row count' using errcode='40001'; end if;
  perform private.replace_contribution_relationships(requested_type, requested_revision_id, access.user_id, payload);
  perform private.assert_relationships(requested_type, requested_revision_id, access.user_id);
  insert into public.curriculum_lifecycle_events(content_type,content_id,revision_id,actor_user_id,actor_organization_id,action,resulting_status)
  values(requested_type,content_id,requested_revision_id,access.user_id,access.organization_id,'revision_edited','Draft');
  return jsonb_build_object('content_id',content_id,'revision_id',requested_revision_id,'status','Draft');
end;
$$;

create function private.validate_submission(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid,
  actor_id uuid
)
returns void
language plpgsql stable security definer
set search_path = ''
as $$
declare valid boolean; attachment_count integer;
begin
  perform private.assert_relationships(requested_type, requested_revision_id, actor_id);
  if exists (
    select 1 from public.curriculum_attachments a
    where (a.teaching_note_revision_id=requested_revision_id or a.material_revision_id=requested_revision_id)
      and a.state <> 'Ready'
  ) then raise exception 'attachment metadata is not Ready' using errcode='23514'; end if;
  case requested_type
    when 'module' then
      select a.is_active and length(trim(r.title)) between 1 and 240 and length(trim(r.description)) between 1 and 10000
        and coalesce(length(r.level),0) <= 240 and coalesce(length(r.delivery_format),0) <= 240
        and coalesce(length(r.suggested_duration),0) <= 240
      into valid from public.module_revisions r join public.axes a on a.id=r.axis_id where r.id=requested_revision_id;
    when 'program_topic' then
      select length(trim(r.title)) between 1 and 240 and coalesce(length(r.description),0) <= 10000
      into valid from public.program_topic_revisions r where r.id=requested_revision_id;
    when 'instructor' then
      select length(trim(r.name)) between 1 and 200
        and coalesce(length(r.role_or_title),0) <= 240 and coalesce(length(r.institution),0) <= 240
        and coalesce(length(r.profile),0) <= 10000 and coalesce(length(r.country),0) <= 240
        and (r.linkedin_url is null or private.is_valid_https_url(r.linkedin_url))
      into valid from public.instructor_revisions r where r.id=requested_revision_id;
    when 'teaching_note' then
      select count(*) into attachment_count
      from public.curriculum_attachments a
      join storage.objects o on o.bucket_id='governed-attachments' and o.name=a.object_name
      where a.teaching_note_revision_id=requested_revision_id
        and a.state='Ready'
        and (o.metadata->>'size')::bigint=a.size_bytes
        and o.metadata->>'mimetype'=a.mime_type
        and a.size_bytes between 1 and 3145728;
      select length(trim(r.title)) between 1 and 240 and coalesce(length(r.text),0) <= 20000
        and (r.source_url is null or private.is_valid_https_url(r.source_url)) and (
        nullif(trim(r.text),'') is not null or private.is_valid_https_url(r.source_url) or attachment_count > 0
      ) into valid from public.teaching_note_revisions r where r.id=requested_revision_id;
    when 'material' then
      select length(trim(r.title)) between 1 and 240 and length(trim(r.material_type)) between 1 and 120
        and coalesce(length(r.description),0) <= 10000 and coalesce(length(r.source_or_institution),0) <= 500
        and coalesce(length(r.country_or_scope),0) <= 240 and coalesce(length(r.theme),0) <= 240
        and (r.source_url is null or private.is_valid_https_url(r.source_url))
      into valid from public.material_revisions r where r.id=requested_revision_id;
    when 'institution' then
      select length(trim(r.name)) between 1 and 200 and length(trim(r.institution_type)) between 1 and 120
        and coalesce(length(r.country_or_scope),0) <= 240 and coalesce(length(r.description),0) <= 10000
        and (r.website_url is null or private.is_valid_https_url(r.website_url))
      into valid from public.institution_revisions r where r.id=requested_revision_id;
  end case;
  if not coalesce(valid,false) then raise exception 'Draft is not valid for submission' using errcode='23514'; end if;
  if exists (
    select 1 from public.curriculum_attachments a
    left join storage.objects o on o.bucket_id='governed-attachments' and o.name=a.object_name
    where (a.teaching_note_revision_id=requested_revision_id or a.material_revision_id=requested_revision_id)
      and (a.state <> 'Ready' or o.id is null or (o.metadata->>'size')::bigint is distinct from a.size_bytes or o.metadata->>'mimetype' is distinct from a.mime_type)
  ) then raise exception 'attachment object metadata is missing or invalid' using errcode='23514'; end if;
end;
$$;

create function public.submit_contribution(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare access record; content_id uuid; submitted timestamptz := clock_timestamp(); affected integer;
begin
  select * into access from private.require_contribution_access();
  content_id := private.assert_owned_draft(requested_type, requested_revision_id, access.user_id);
  perform private.validate_submission(requested_type, requested_revision_id, access.user_id);
  case requested_type
    when 'module' then update public.module_revisions set status='Submitted',submitted_at=submitted where id=requested_revision_id;
    when 'program_topic' then update public.program_topic_revisions set status='Submitted',submitted_at=submitted where id=requested_revision_id;
    when 'instructor' then update public.instructor_revisions set status='Submitted',submitted_at=submitted where id=requested_revision_id;
    when 'teaching_note' then update public.teaching_note_revisions set status='Submitted',submitted_at=submitted where id=requested_revision_id;
    when 'material' then update public.material_revisions set status='Submitted',submitted_at=submitted where id=requested_revision_id;
    when 'institution' then update public.institution_revisions set status='Submitted',submitted_at=submitted where id=requested_revision_id;
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'submission affected an unexpected row count' using errcode='40001'; end if;
  insert into public.curriculum_lifecycle_events(content_type,content_id,revision_id,actor_user_id,actor_organization_id,action,resulting_status,occurred_at)
  values(requested_type,content_id,requested_revision_id,access.user_id,access.organization_id,'content_submitted','Submitted',submitted);
  return jsonb_build_object('content_id',content_id,'revision_id',requested_revision_id,'status','Submitted','submitted_at',submitted);
end;
$$;

create function public.delete_contribution(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid
)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare access record; content_id uuid; affected integer;
begin
  select * into access from private.require_contribution_access();
  content_id := private.assert_owned_draft(requested_type, requested_revision_id, access.user_id);
  if exists(select 1 from public.curriculum_attachments a
    where a.teaching_note_revision_id=requested_revision_id or a.material_revision_id=requested_revision_id) then
    raise exception 'delete all attachment metadata before deleting the Draft' using errcode='55000';
  end if;
  insert into public.curriculum_lifecycle_events(content_type,content_id,revision_id,actor_user_id,actor_organization_id,action,resulting_status)
  values(requested_type,content_id,requested_revision_id,access.user_id,access.organization_id,'draft_deleted',null);
  case requested_type
    when 'module' then
      delete from public.module_instructors where module_revision_id=requested_revision_id;
      delete from public.module_materials where module_revision_id=requested_revision_id;
      delete from public.module_institutions where module_revision_id=requested_revision_id;
      delete from public.module_revisions where id=requested_revision_id; delete from public.modules where id=content_id;
    when 'program_topic' then delete from public.program_topic_revisions where id=requested_revision_id; delete from public.program_topics where id=content_id;
    when 'instructor' then delete from public.instructor_revisions where id=requested_revision_id; delete from public.instructors where id=content_id;
    when 'teaching_note' then
      delete from public.teaching_note_materials where teaching_note_revision_id=requested_revision_id;
      delete from public.teaching_note_revisions where id=requested_revision_id; delete from public.teaching_notes where id=content_id;
    when 'material' then delete from public.material_revisions where id=requested_revision_id; delete from public.materials where id=content_id;
    when 'institution' then delete from public.institution_revisions where id=requested_revision_id; delete from public.institutions where id=content_id;
  end case;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Draft deletion affected an unexpected row count' using errcode='40001'; end if;
end;
$$;

create function public.reserve_attachment(
  requested_type public.curriculum_content_type,
  requested_revision_id uuid,
  requested_filename text,
  requested_mime_type text,
  requested_size_bytes bigint
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare access record; attachment_id uuid := gen_random_uuid(); content_id uuid; affected integer;
begin
  if requested_type not in ('teaching_note','material') then raise exception 'attachments are limited to Teaching Notes and Materials' using errcode='22023'; end if;
  select * into access from private.require_contribution_access();
  content_id := private.assert_owned_draft(requested_type, requested_revision_id, access.user_id);
  insert into public.curriculum_attachments(id,object_name,original_filename,mime_type,size_bytes,teaching_note_revision_id,material_revision_id,created_by,contributor_organization_id)
  values(attachment_id,attachment_id::text,requested_filename,requested_mime_type,requested_size_bytes,
    case when requested_type='teaching_note' then requested_revision_id end,
    case when requested_type='material' then requested_revision_id end,
    access.user_id,access.organization_id);
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'attachment reservation affected an unexpected row count' using errcode='40001'; end if;
  insert into public.curriculum_lifecycle_events(content_type,content_id,revision_id,actor_user_id,actor_organization_id,action,resulting_status)
  values(requested_type,content_id,requested_revision_id,access.user_id,access.organization_id,'revision_edited','Draft');
  return jsonb_build_object('id',attachment_id,'bucket_id','governed-attachments','object_name',attachment_id::text,'original_filename',requested_filename,'mime_type',requested_mime_type,'size_bytes',requested_size_bytes,'state','Reserved');
end;
$$;

create function private.lock_owned_draft_attachment(
  requested_attachment_id uuid,
  actor_id uuid,
  required_state public.curriculum_attachment_state
)
returns public.curriculum_attachments
language plpgsql volatile security definer
set search_path = ''
as $$
declare attachment public.curriculum_attachments; revision_id uuid; requested_type public.curriculum_content_type;
begin
  select * into attachment from public.curriculum_attachments a
  where a.id=requested_attachment_id and a.created_by=actor_id;
  if attachment.id is null then raise exception 'owned Draft attachment not found' using errcode='42501'; end if;
  if attachment.teaching_note_revision_id is not null then
    requested_type := 'teaching_note';
    revision_id := attachment.teaching_note_revision_id;
  else
    requested_type := 'material';
    revision_id := attachment.material_revision_id;
  end if;
  perform private.assert_owned_draft(requested_type,revision_id,actor_id);
  select * into attachment from public.curriculum_attachments a
  where a.id=requested_attachment_id and a.created_by=actor_id and a.state=required_state
  for update;
  if attachment.id is null then raise exception 'attachment is not in the required state' using errcode='55000'; end if;
  return attachment;
end;
$$;

create function private.record_attachment_edit(attachment public.curriculum_attachments, actor_id uuid, organization_id uuid)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare requested_type public.curriculum_content_type; content_id uuid; revision_id uuid;
begin
  if attachment.teaching_note_revision_id is not null then
    requested_type := 'teaching_note'; revision_id := attachment.teaching_note_revision_id;
    select teaching_note_id into content_id from public.teaching_note_revisions where id=revision_id;
  else
    requested_type := 'material'; revision_id := attachment.material_revision_id;
    select material_id into content_id from public.material_revisions where id=revision_id;
  end if;
  insert into public.curriculum_lifecycle_events(content_type,content_id,revision_id,actor_user_id,actor_organization_id,action,resulting_status)
  values(requested_type,content_id,revision_id,actor_id,organization_id,'revision_edited','Draft');
end;
$$;

create function public.finalize_attachment_upload(requested_attachment_id uuid)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare access record; attachment public.curriculum_attachments; affected integer;
begin
  select * into access from private.require_contribution_access();
  attachment := private.lock_owned_draft_attachment(requested_attachment_id,access.user_id,'Reserved');
  if not exists(select 1 from storage.objects o where o.bucket_id='governed-attachments' and o.name=attachment.object_name
    and (o.metadata->>'size')::bigint=attachment.size_bytes and o.metadata->>'mimetype'=attachment.mime_type) then
    raise exception 'matching attachment object not found' using errcode='23514';
  end if;
  update public.curriculum_attachments set state='Ready' where id=attachment.id and state='Reserved';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'attachment finalization affected an unexpected row count' using errcode='40001'; end if;
  perform private.record_attachment_edit(attachment,access.user_id,access.organization_id);
end;
$$;

create function public.cancel_attachment_reservation(requested_attachment_id uuid)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare access record; attachment public.curriculum_attachments; affected integer;
begin
  select * into access from private.require_contribution_access();
  attachment := private.lock_owned_draft_attachment(requested_attachment_id,access.user_id,'Reserved');
  if exists(select 1 from storage.objects o where o.bucket_id='governed-attachments' and o.name=attachment.object_name) then
    raise exception 'cannot cancel a reservation with uploaded bytes' using errcode='55000';
  end if;
  delete from public.curriculum_attachments where id=attachment.id and state='Reserved';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'reservation cancellation affected an unexpected row count' using errcode='40001'; end if;
  perform private.record_attachment_edit(attachment,access.user_id,access.organization_id);
end;
$$;

create function public.begin_attachment_deletion(requested_attachment_id uuid)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare access record; attachment public.curriculum_attachments; current_state public.curriculum_attachment_state; affected integer;
begin
  select * into access from private.require_contribution_access();
  select state into current_state from public.curriculum_attachments
  where id=requested_attachment_id and created_by=access.user_id;
  if current_state not in ('Reserved','Ready') or current_state is null then
    raise exception 'attachment is not in the required state' using errcode='55000';
  end if;
  attachment := private.lock_owned_draft_attachment(requested_attachment_id,access.user_id,current_state);
  update public.curriculum_attachments set state='Deleting' where id=attachment.id and state=current_state;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'begin deletion affected an unexpected row count' using errcode='40001'; end if;
  perform private.record_attachment_edit(attachment,access.user_id,access.organization_id);
end;
$$;

create function public.cancel_attachment_deletion(requested_attachment_id uuid)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare access record; attachment public.curriculum_attachments; affected integer;
begin
  select * into access from private.require_contribution_access();
  attachment := private.lock_owned_draft_attachment(requested_attachment_id,access.user_id,'Deleting');
  if not exists(select 1 from storage.objects o where o.bucket_id='governed-attachments' and o.name=attachment.object_name
    and (o.metadata->>'size')::bigint=attachment.size_bytes and o.metadata->>'mimetype'=attachment.mime_type) then
    raise exception 'matching attachment object not found' using errcode='23514';
  end if;
  update public.curriculum_attachments set state='Ready' where id=attachment.id and state='Deleting';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'cancel deletion affected an unexpected row count' using errcode='40001'; end if;
  perform private.record_attachment_edit(attachment,access.user_id,access.organization_id);
end;
$$;

create function public.finalize_attachment_deletion(requested_attachment_id uuid)
returns void language plpgsql volatile security definer set search_path=''
as $$
declare access record; attachment public.curriculum_attachments; affected integer;
begin
  select * into access from private.require_contribution_access();
  attachment := private.lock_owned_draft_attachment(requested_attachment_id,access.user_id,'Deleting');
  if exists(select 1 from storage.objects o where o.bucket_id='governed-attachments' and o.name=attachment.object_name) then
    raise exception 'attachment object still exists' using errcode='55000';
  end if;
  delete from public.curriculum_attachments where id=attachment.id and state='Deleting';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'finalize deletion affected an unexpected row count' using errcode='40001'; end if;
  perform private.record_attachment_edit(attachment,access.user_id,access.organization_id);
end;
$$;

create function private.can_access_attachment_object(
  requested_name text,
  requested_operation text
)
returns boolean
language plpgsql volatile security definer
set search_path = ''
as $$
declare attachment public.curriculum_attachments;
begin
  if requested_operation='select' then
    return exists (
      select 1 from public.curriculum_attachments a
      join private.current_access() access on access.user_id=a.created_by
      where a.object_name=requested_name and (
        private.attachment_revision_state(a)='Draft' or
        (private.attachment_revision_state(a)='Submitted' and a.state='Ready')
      )
    );
  end if;
  if requested_operation not in ('insert','delete') then return false; end if;
  select a.* into attachment
  from public.curriculum_attachments a
  where a.object_name=requested_name
    and a.created_by=(select access.user_id from private.current_access() access)
    and a.state=case requested_operation when 'insert' then 'Reserved'::public.curriculum_attachment_state else 'Deleting'::public.curriculum_attachment_state end
  for update;
  if attachment.id is null or private.attachment_revision_state(attachment) <> 'Draft' then return false; end if;
  return true;
end;
$$;

create policy "Owners read pending attachment metadata" on public.curriculum_attachments
for select to authenticated using (
  created_by=(select auth.uid())
  and private.is_eligible_curriculum_reader()
  and (
    (teaching_note_revision_id is not null and exists (
      select 1 from public.teaching_note_revisions r
      where r.id=teaching_note_revision_id and r.status in ('Draft','Submitted')
    )) or
    (material_revision_id is not null and exists (
      select 1 from public.material_revisions r
      where r.id=material_revision_id and r.status in ('Draft','Submitted')
    ))
  )
);

create policy "Owners read pending attachment objects" on storage.objects
for select to authenticated using (
  bucket_id='governed-attachments' and private.can_access_attachment_object(name,'select')
);
create policy "Owners upload Draft attachment objects" on storage.objects
for insert to authenticated with check (
  bucket_id='governed-attachments'
  and private.can_access_attachment_object(name,'insert')
);
create policy "Owners delete Draft attachment objects" on storage.objects
for delete to authenticated using (
  bucket_id='governed-attachments' and private.can_access_attachment_object(name,'delete')
);

-- Owner-only pending visibility is additive to the unchanged SPEC-002 policies.
create policy "Owners see pending modules" on public.modules for select to authenticated
  using (current_published_revision_id is null and archived_at is null and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader());
create policy "Owners see pending module revisions" on public.module_revisions for select to authenticated
  using (status in ('Draft','Submitted') and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader()
    and exists(select 1 from public.modules i where i.id=module_id and i.current_published_revision_id is null));
create policy "Owners see pending program topics" on public.program_topics for select to authenticated
  using (current_published_revision_id is null and archived_at is null and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader());
create policy "Owners see pending program topic revisions" on public.program_topic_revisions for select to authenticated
  using (status in ('Draft','Submitted') and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader()
    and exists(select 1 from public.program_topics i where i.id=program_topic_id and i.current_published_revision_id is null));
create policy "Owners see pending instructors" on public.instructors for select to authenticated
  using (current_published_revision_id is null and archived_at is null and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader());
create policy "Owners see pending instructor revisions" on public.instructor_revisions for select to authenticated
  using (status in ('Draft','Submitted') and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader()
    and exists(select 1 from public.instructors i where i.id=instructor_id and i.current_published_revision_id is null));
create policy "Owners see pending teaching notes" on public.teaching_notes for select to authenticated
  using (current_published_revision_id is null and archived_at is null and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader());
create policy "Owners see pending teaching note revisions" on public.teaching_note_revisions for select to authenticated
  using (status in ('Draft','Submitted') and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader()
    and exists(select 1 from public.teaching_notes i where i.id=teaching_note_id and i.current_published_revision_id is null));
create policy "Owners see pending materials" on public.materials for select to authenticated
  using (current_published_revision_id is null and archived_at is null and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader());
create policy "Owners see pending material revisions" on public.material_revisions for select to authenticated
  using (status in ('Draft','Submitted') and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader()
    and exists(select 1 from public.materials i where i.id=material_id and i.current_published_revision_id is null));
create policy "Owners see pending institutions" on public.institutions for select to authenticated
  using (current_published_revision_id is null and archived_at is null and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader());
create policy "Owners see pending institution revisions" on public.institution_revisions for select to authenticated
  using (status in ('Draft','Submitted') and created_by=(select auth.uid()) and private.is_eligible_curriculum_reader()
    and exists(select 1 from public.institutions i where i.id=institution_id and i.current_published_revision_id is null));

create policy "Owners see pending module instructors" on public.module_instructors for select to authenticated
  using (exists(select 1 from public.module_revisions r where r.id=module_revision_id and r.created_by=(select auth.uid()) and r.status in ('Draft','Submitted'))
    and exists(select 1 from public.instructors i where i.id=instructor_id));
create policy "Owners see pending module materials" on public.module_materials for select to authenticated
  using (exists(select 1 from public.module_revisions r where r.id=module_revision_id and r.created_by=(select auth.uid()) and r.status in ('Draft','Submitted'))
    and exists(select 1 from public.materials i where i.id=material_id));
create policy "Owners see pending module institutions" on public.module_institutions for select to authenticated
  using (exists(select 1 from public.module_revisions r where r.id=module_revision_id and r.created_by=(select auth.uid()) and r.status in ('Draft','Submitted'))
    and exists(select 1 from public.institutions i where i.id=institution_id));
create policy "Owners see pending teaching note materials" on public.teaching_note_materials for select to authenticated
  using (exists(select 1 from public.teaching_note_revisions r where r.id=teaching_note_revision_id and r.created_by=(select auth.uid()) and r.status in ('Draft','Submitted'))
    and exists(select 1 from public.materials i where i.id=material_id));

revoke all on function private.require_contribution_access(),
  private.assert_payload_keys(jsonb,text[]), private.jsonb_text_array(jsonb), private.is_valid_https_url(text),
  private.assert_content_payload_bounds(public.curriculum_content_type,jsonb),
  private.is_compatible_contribution_identity(public.curriculum_content_type,uuid,uuid),
  private.assert_relationships(public.curriculum_content_type,uuid,uuid),
  private.replace_contribution_relationships(public.curriculum_content_type,uuid,uuid,jsonb),
  private.protect_contribution_revision(),
  private.protect_submitted_relationship(), private.protect_lifecycle_event(),
  private.protect_attachment_metadata(),
  private.assert_owned_draft(public.curriculum_content_type,uuid,uuid),
  private.validate_submission(public.curriculum_content_type,uuid,uuid),
  private.attachment_revision_state(public.curriculum_attachments),
  private.lock_owned_draft_attachment(uuid,uuid,public.curriculum_attachment_state),
  private.record_attachment_edit(public.curriculum_attachments,uuid,uuid),
  private.can_access_attachment_object(text,text)
from public, anon, authenticated, service_role;

revoke all on function public.create_contribution(public.curriculum_content_type,jsonb),
  public.update_contribution(public.curriculum_content_type,uuid,jsonb),
  public.submit_contribution(public.curriculum_content_type,uuid),
  public.delete_contribution(public.curriculum_content_type,uuid),
  public.reserve_attachment(public.curriculum_content_type,uuid,text,text,bigint),
  public.finalize_attachment_upload(uuid),
  public.cancel_attachment_reservation(uuid),
  public.begin_attachment_deletion(uuid),
  public.cancel_attachment_deletion(uuid),
  public.finalize_attachment_deletion(uuid)
from public, anon, authenticated, service_role;
grant execute on function public.create_contribution(public.curriculum_content_type,jsonb),
  public.update_contribution(public.curriculum_content_type,uuid,jsonb),
  public.submit_contribution(public.curriculum_content_type,uuid),
  public.delete_contribution(public.curriculum_content_type,uuid),
  public.reserve_attachment(public.curriculum_content_type,uuid,text,text,bigint),
  public.finalize_attachment_upload(uuid),
  public.cancel_attachment_reservation(uuid),
  public.begin_attachment_deletion(uuid),
  public.cancel_attachment_deletion(uuid),
  public.finalize_attachment_deletion(uuid)
to authenticated;

-- Storage policy expressions execute this narrowly scoped helper as authenticated.
grant execute on function private.can_access_attachment_object(text,text) to authenticated;

-- Keep generic table mutation denied. The existing authenticated SELECT grants
-- and the SPEC-002 published reader functions are intentionally unchanged.
revoke insert, update, delete on public.modules, public.module_revisions,
  public.program_topics, public.program_topic_revisions,
  public.instructors, public.instructor_revisions,
  public.teaching_notes, public.teaching_note_revisions,
  public.materials, public.material_revisions,
  public.institutions, public.institution_revisions,
  public.module_instructors, public.module_materials,
  public.module_institutions, public.teaching_note_materials,
  public.curriculum_attachments, public.curriculum_lifecycle_events
from authenticated;
