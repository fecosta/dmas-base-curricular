-- SPEC-002: revision-capable, read-only published curriculum library.
create extension if not exists unaccent with schema extensions;

create type public.curriculum_revision_status as enum (
  'Draft',
  'Submitted',
  'Under Review',
  'Changes Requested',
  'Resubmitted',
  'Approved',
  'Published'
);

create table public.axes (
  id uuid primary key,
  name text not null unique check (length(trim(name)) between 1 and 200),
  description text,
  display_order integer not null check (display_order > 0),
  is_active boolean not null default true
);

insert into public.axes (id, name, display_order) values
  ('a1000000-0000-4000-8000-000000000001', 'Strategy & Campaign', 1),
  ('a1000000-0000-4000-8000-000000000002', 'Evidence-based Public Policy', 2)
on conflict (id) do nothing;

create table public.modules (
  id uuid primary key,
  current_published_revision_id uuid unique,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict
);

create table public.module_revisions (
  id uuid primary key,
  module_id uuid not null references public.modules(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status public.curriculum_revision_status not null,
  axis_id uuid not null references public.axes(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 240),
  theme text check (theme is null or length(trim(theme)) between 1 and 160),
  description text not null check (length(trim(description)) > 0),
  learning_outcomes text[] not null default '{}',
  level text,
  delivery_format text,
  suggested_duration text,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (module_id, revision_number),
  unique (id, module_id),
  check (status <> 'Published' or published_at is not null)
);

alter table public.modules add constraint modules_current_revision_fkey
  foreign key (current_published_revision_id, id)
  references public.module_revisions(id, module_id)
  deferrable initially deferred;

create table public.program_topics (
  id uuid primary key,
  current_published_revision_id uuid unique,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict
);

create table public.program_topic_revisions (
  id uuid primary key,
  program_topic_id uuid not null references public.program_topics(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status public.curriculum_revision_status not null,
  module_id uuid not null references public.modules(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 240),
  description text,
  position integer check (position is null or position > 0),
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (program_topic_id, revision_number),
  unique (id, program_topic_id),
  check (status <> 'Published' or published_at is not null)
);

alter table public.program_topics add constraint program_topics_current_revision_fkey
  foreign key (current_published_revision_id, id)
  references public.program_topic_revisions(id, program_topic_id)
  deferrable initially deferred;

create table public.instructors (
  id uuid primary key,
  current_published_revision_id uuid unique,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict
);

create table public.instructor_revisions (
  id uuid primary key,
  instructor_id uuid not null references public.instructors(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status public.curriculum_revision_status not null,
  name text not null check (length(trim(name)) between 1 and 200),
  role_or_title text,
  institution text,
  profile text,
  linkedin_url text check (linkedin_url is null or linkedin_url ~ '^https://'),
  thematic_axis_or_themes text[] not null default '{}',
  country text,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (instructor_id, revision_number),
  unique (id, instructor_id),
  check (status <> 'Published' or published_at is not null)
);

alter table public.instructors add constraint instructors_current_revision_fkey
  foreign key (current_published_revision_id, id)
  references public.instructor_revisions(id, instructor_id)
  deferrable initially deferred;

create table public.teaching_notes (
  id uuid primary key,
  current_published_revision_id uuid unique,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict
);

create table public.teaching_note_revisions (
  id uuid primary key,
  teaching_note_id uuid not null references public.teaching_notes(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status public.curriculum_revision_status not null,
  module_id uuid not null references public.modules(id) on delete restrict,
  program_topic_id uuid references public.program_topics(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 240),
  text text,
  source_url text check (source_url is null or source_url ~ '^https://'),
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (teaching_note_id, revision_number),
  unique (id, teaching_note_id),
  check (text is not null or source_url is not null),
  check (status <> 'Published' or published_at is not null)
);

alter table public.teaching_notes add constraint teaching_notes_current_revision_fkey
  foreign key (current_published_revision_id, id)
  references public.teaching_note_revisions(id, teaching_note_id)
  deferrable initially deferred;

create table public.materials (
  id uuid primary key,
  current_published_revision_id uuid unique,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict
);

create table public.material_revisions (
  id uuid primary key,
  material_id uuid not null references public.materials(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status public.curriculum_revision_status not null,
  title text not null check (length(trim(title)) between 1 and 240),
  material_type text not null check (length(trim(material_type)) between 1 and 120),
  description text,
  source_or_institution text,
  source_url text check (source_url is null or source_url ~ '^https://'),
  country_or_scope text,
  theme text,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (material_id, revision_number),
  unique (id, material_id),
  check (status <> 'Published' or published_at is not null)
);

alter table public.materials add constraint materials_current_revision_fkey
  foreign key (current_published_revision_id, id)
  references public.material_revisions(id, material_id)
  deferrable initially deferred;

create table public.institutions (
  id uuid primary key,
  current_published_revision_id uuid unique,
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references auth.users(id) on delete restrict
);

create table public.institution_revisions (
  id uuid primary key,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  status public.curriculum_revision_status not null,
  name text not null check (length(trim(name)) between 1 and 200),
  institution_type text not null check (length(trim(institution_type)) between 1 and 120),
  country_or_scope text,
  description text,
  website_url text check (website_url is null or website_url ~ '^https://'),
  themes text[] not null default '{}',
  created_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (institution_id, revision_number),
  unique (id, institution_id),
  check (status <> 'Published' or published_at is not null)
);

alter table public.institutions add constraint institutions_current_revision_fkey
  foreign key (current_published_revision_id, id)
  references public.institution_revisions(id, institution_id)
  deferrable initially deferred;

-- Relationships belong to a module/note revision so a future revision can alter
-- its associations without changing the current published representation.
create table public.module_instructors (
  module_revision_id uuid not null references public.module_revisions(id) on delete restrict,
  instructor_id uuid not null references public.instructors(id) on delete restrict,
  primary key (module_revision_id, instructor_id)
);

create table public.module_materials (
  module_revision_id uuid not null references public.module_revisions(id) on delete restrict,
  material_id uuid not null references public.materials(id) on delete restrict,
  primary key (module_revision_id, material_id)
);

create table public.module_institutions (
  module_revision_id uuid not null references public.module_revisions(id) on delete restrict,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  primary key (module_revision_id, institution_id)
);

create table public.teaching_note_materials (
  teaching_note_revision_id uuid not null references public.teaching_note_revisions(id) on delete restrict,
  material_id uuid not null references public.materials(id) on delete restrict,
  primary key (teaching_note_revision_id, material_id)
);

create index module_revisions_axis_idx on public.module_revisions(axis_id);
create index module_revisions_theme_idx on public.module_revisions(lower(theme));
create index program_topic_revisions_module_idx on public.program_topic_revisions(module_id, position);
create index teaching_note_revisions_module_idx on public.teaching_note_revisions(module_id);
create index teaching_note_revisions_topic_idx on public.teaching_note_revisions(program_topic_id);
create index instructor_revisions_country_idx on public.instructor_revisions(lower(country));
create index material_revisions_country_theme_idx on public.material_revisions(lower(country_or_scope), lower(theme));
create index institution_revisions_country_idx on public.institution_revisions(lower(country_or_scope));

create function private.normalize_curriculum_search(value text)
returns text
language sql immutable strict parallel safe
set search_path = ''
as $$ select lower(extensions.unaccent('extensions.unaccent', value)); $$;

revoke all on function private.normalize_curriculum_search(text) from public, anon, authenticated;
grant execute on function private.normalize_curriculum_search(text) to authenticated;

create function private.normalize_curriculum_search(values_to_join text[])
returns text
language sql immutable strict parallel safe
set search_path = ''
as $$ select private.normalize_curriculum_search(array_to_string(values_to_join, ' ')); $$;

revoke all on function private.normalize_curriculum_search(text[]) from public, anon, authenticated;
grant execute on function private.normalize_curriculum_search(text[]) to authenticated;
grant usage on schema private to service_role;
grant execute on function private.normalize_curriculum_search(text),
  private.normalize_curriculum_search(text[]) to service_role;

create index module_revisions_search_idx on public.module_revisions using gin (
  to_tsvector('spanish', private.normalize_curriculum_search(title || ' ' || description || ' ' || coalesce(theme, '')))
);
create index material_revisions_search_idx on public.material_revisions using gin (
  to_tsvector('spanish', private.normalize_curriculum_search(title || ' ' || coalesce(description, '') || ' ' || coalesce(source_or_institution, '') || ' ' || coalesce(theme, '')))
);
create index institution_revisions_search_idx on public.institution_revisions using gin (
  to_tsvector('spanish', private.normalize_curriculum_search(array_append(themes, name || ' ' || coalesce(description, ''))))
);

create function private.is_eligible_curriculum_reader()
returns boolean
language sql stable security invoker
set search_path = ''
as $$ select exists (select 1 from private.current_access()); $$;

revoke all on function private.is_eligible_curriculum_reader() from public, anon, authenticated;
grant execute on function private.is_eligible_curriculum_reader() to authenticated;

-- A current pointer may only select a Published revision. Draft-only identities
-- remain possible for later contribution work but have no ordinary reader row.
create function private.enforce_current_published_revision()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare
  revision_status public.curriculum_revision_status;
begin
  if new.current_published_revision_id is null then
    return new;
  end if;
  execute format('select status from public.%I where id = $1', tg_argv[0])
    into revision_status using new.current_published_revision_id;
  if revision_status is distinct from 'Published'::public.curriculum_revision_status then
    raise exception 'current revision must be Published' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger modules_current_published_check before insert or update of current_published_revision_id on public.modules
  for each row execute function private.enforce_current_published_revision('module_revisions');
create trigger program_topics_current_published_check before insert or update of current_published_revision_id on public.program_topics
  for each row execute function private.enforce_current_published_revision('program_topic_revisions');
create trigger instructors_current_published_check before insert or update of current_published_revision_id on public.instructors
  for each row execute function private.enforce_current_published_revision('instructor_revisions');
create trigger teaching_notes_current_published_check before insert or update of current_published_revision_id on public.teaching_notes
  for each row execute function private.enforce_current_published_revision('teaching_note_revisions');
create trigger materials_current_published_check before insert or update of current_published_revision_id on public.materials
  for each row execute function private.enforce_current_published_revision('material_revisions');
create trigger institutions_current_published_check before insert or update of current_published_revision_id on public.institutions
  for each row execute function private.enforce_current_published_revision('institution_revisions');

create function private.enforce_teaching_note_topic_module()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
begin
  if new.status = 'Published'::public.curriculum_revision_status
    and new.program_topic_id is not null
    and not exists (
      select 1
      from public.program_topics p
      join public.program_topic_revisions r on r.id = p.current_published_revision_id
      where p.id = new.program_topic_id and r.module_id = new.module_id
    ) then
    raise exception 'published teaching note topic must belong to its module' using errcode = '23514';
  end if;
  return new;
end;
$$;

create constraint trigger teaching_note_topic_module_check
after insert or update of status, module_id, program_topic_id on public.teaching_note_revisions
deferrable initially deferred
for each row execute function private.enforce_teaching_note_topic_module();

create function private.enforce_program_topic_module_references()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare
  topic_module_id uuid;
begin
  if new.current_published_revision_id is null then return new; end if;
  select r.module_id into topic_module_id
  from public.program_topic_revisions r
  where r.id = new.current_published_revision_id;
  if exists (
    select 1
    from public.teaching_notes n
    join public.teaching_note_revisions r on r.id = n.current_published_revision_id
    where r.program_topic_id = new.id and r.module_id <> topic_module_id
  ) then
    raise exception 'published program topic must remain in the module used by teaching notes' using errcode = '23514';
  end if;
  return new;
end;
$$;

create constraint trigger program_topic_module_references_check
after insert or update of current_published_revision_id on public.program_topics
deferrable initially deferred
for each row execute function private.enforce_program_topic_module_references();

-- Once published, a revision is a historical snapshot. Publishing a replacement
-- changes the stable identity pointer rather than mutating this row.
create function private.preserve_published_revision()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
begin
  if old.status = 'Published'::public.curriculum_revision_status then
    raise exception 'published revisions are immutable' using errcode = '55000';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger preserve_published_module_revision before update or delete on public.module_revisions
  for each row execute function private.preserve_published_revision();
create trigger preserve_published_program_topic_revision before update or delete on public.program_topic_revisions
  for each row execute function private.preserve_published_revision();
create trigger preserve_published_instructor_revision before update or delete on public.instructor_revisions
  for each row execute function private.preserve_published_revision();
create trigger preserve_published_teaching_note_revision before update or delete on public.teaching_note_revisions
  for each row execute function private.preserve_published_revision();
create trigger preserve_published_material_revision before update or delete on public.material_revisions
  for each row execute function private.preserve_published_revision();
create trigger preserve_published_institution_revision before update or delete on public.institution_revisions
  for each row execute function private.preserve_published_revision();

-- Initial relationship rows are loaded before the identity receives its current
-- published pointer. Once pointed, the published relationship snapshot freezes.
create function private.preserve_published_relationship()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare
  anchor_revision_id uuid;
  revision_status public.curriculum_revision_status;
  current_revision_id uuid;
begin
  anchor_revision_id := case when tg_op = 'INSERT'
    then (to_jsonb(new)->>tg_argv[3])::uuid
    else (to_jsonb(old)->>tg_argv[3])::uuid end;
  execute format(
    'select r.status, i.current_published_revision_id from public.%I r join public.%I i on i.id = r.%I where r.id = $1',
    tg_argv[0], tg_argv[1], tg_argv[2]
  ) into revision_status, current_revision_id using anchor_revision_id;
  if revision_status = 'Published'::public.curriculum_revision_status and current_revision_id is not null then
    raise exception 'published revision relationships are immutable' using errcode = '55000';
  end if;
  if tg_op = 'UPDATE' and (to_jsonb(new)->>tg_argv[3])::uuid is distinct from anchor_revision_id then
    anchor_revision_id := (to_jsonb(new)->>tg_argv[3])::uuid;
    execute format(
      'select r.status, i.current_published_revision_id from public.%I r join public.%I i on i.id = r.%I where r.id = $1',
      tg_argv[0], tg_argv[1], tg_argv[2]
    ) into revision_status, current_revision_id using anchor_revision_id;
    if revision_status = 'Published'::public.curriculum_revision_status and current_revision_id is not null then
      raise exception 'published revision relationships are immutable' using errcode = '55000';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger preserve_published_module_instructors before insert or update or delete on public.module_instructors
  for each row execute function private.preserve_published_relationship('module_revisions', 'modules', 'module_id', 'module_revision_id');
create trigger preserve_published_module_materials before insert or update or delete on public.module_materials
  for each row execute function private.preserve_published_relationship('module_revisions', 'modules', 'module_id', 'module_revision_id');
create trigger preserve_published_module_institutions before insert or update or delete on public.module_institutions
  for each row execute function private.preserve_published_relationship('module_revisions', 'modules', 'module_id', 'module_revision_id');
create trigger preserve_published_teaching_note_materials before insert or update or delete on public.teaching_note_materials
  for each row execute function private.preserve_published_relationship('teaching_note_revisions', 'teaching_notes', 'teaching_note_id', 'teaching_note_revision_id');

-- Trigger invocation does not require callers to execute trigger functions
-- directly. Keep their ACLs as narrow as the other private helpers.
revoke all on function private.enforce_current_published_revision(),
  private.enforce_teaching_note_topic_module(),
  private.enforce_program_topic_module_references(),
  private.preserve_published_revision(),
  private.preserve_published_relationship()
from public, anon, authenticated, service_role;

alter table public.axes enable row level security;
alter table public.modules enable row level security;
alter table public.module_revisions enable row level security;
alter table public.program_topics enable row level security;
alter table public.program_topic_revisions enable row level security;
alter table public.instructors enable row level security;
alter table public.instructor_revisions enable row level security;
alter table public.teaching_notes enable row level security;
alter table public.teaching_note_revisions enable row level security;
alter table public.materials enable row level security;
alter table public.material_revisions enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_revisions enable row level security;
alter table public.module_instructors enable row level security;
alter table public.module_materials enable row level security;
alter table public.module_institutions enable row level security;
alter table public.teaching_note_materials enable row level security;

revoke all on public.axes, public.modules, public.module_revisions,
  public.program_topics, public.program_topic_revisions,
  public.instructors, public.instructor_revisions,
  public.teaching_notes, public.teaching_note_revisions,
  public.materials, public.material_revisions,
  public.institutions, public.institution_revisions,
  public.module_instructors, public.module_materials,
  public.module_institutions, public.teaching_note_materials
from public, anon, authenticated;

grant select on public.axes, public.modules, public.module_revisions,
  public.program_topics, public.program_topic_revisions,
  public.instructors, public.instructor_revisions,
  public.teaching_notes, public.teaching_note_revisions,
  public.materials, public.material_revisions,
  public.institutions, public.institution_revisions,
  public.module_instructors, public.module_materials,
  public.module_institutions, public.teaching_note_materials
to authenticated;

create policy "Eligible readers see active axes" on public.axes for select to authenticated
  using (is_active and private.is_eligible_curriculum_reader());

create policy "Eligible readers see published modules" on public.modules for select to authenticated
  using (archived_at is null and current_published_revision_id is not null and private.is_eligible_curriculum_reader());
create policy "Eligible readers see current module revisions" on public.module_revisions for select to authenticated
  using (status = 'Published' and exists (
    select 1 from public.modules m where m.id = module_revisions.module_id and m.current_published_revision_id = module_revisions.id
  ));

create policy "Eligible readers see published program topics" on public.program_topics for select to authenticated
  using (archived_at is null and current_published_revision_id is not null and private.is_eligible_curriculum_reader());
create policy "Eligible readers see current program topic revisions" on public.program_topic_revisions for select to authenticated
  using (status = 'Published' and exists (
    select 1 from public.program_topics p where p.id = program_topic_revisions.program_topic_id and p.current_published_revision_id = program_topic_revisions.id
  ) and exists (select 1 from public.modules m where m.id = program_topic_revisions.module_id));

create policy "Eligible readers see published instructors" on public.instructors for select to authenticated
  using (archived_at is null and current_published_revision_id is not null and private.is_eligible_curriculum_reader());
create policy "Eligible readers see current instructor revisions" on public.instructor_revisions for select to authenticated
  using (status = 'Published' and exists (
    select 1 from public.instructors i where i.id = instructor_revisions.instructor_id and i.current_published_revision_id = instructor_revisions.id
  ));

create policy "Eligible readers see published teaching notes" on public.teaching_notes for select to authenticated
  using (archived_at is null and current_published_revision_id is not null and private.is_eligible_curriculum_reader());
create policy "Eligible readers see current teaching note revisions" on public.teaching_note_revisions for select to authenticated
  using (status = 'Published' and exists (
    select 1 from public.teaching_notes n where n.id = teaching_note_revisions.teaching_note_id and n.current_published_revision_id = teaching_note_revisions.id
  ) and exists (select 1 from public.modules m where m.id = teaching_note_revisions.module_id)
    and (program_topic_id is null or exists (select 1 from public.program_topics p where p.id = teaching_note_revisions.program_topic_id)));

create policy "Eligible readers see published materials" on public.materials for select to authenticated
  using (archived_at is null and current_published_revision_id is not null and private.is_eligible_curriculum_reader());
create policy "Eligible readers see current material revisions" on public.material_revisions for select to authenticated
  using (status = 'Published' and exists (
    select 1 from public.materials m where m.id = material_revisions.material_id and m.current_published_revision_id = material_revisions.id
  ));

create policy "Eligible readers see published institutions" on public.institutions for select to authenticated
  using (archived_at is null and current_published_revision_id is not null and private.is_eligible_curriculum_reader());
create policy "Eligible readers see current institution revisions" on public.institution_revisions for select to authenticated
  using (status = 'Published' and exists (
    select 1 from public.institutions i where i.id = institution_revisions.institution_id and i.current_published_revision_id = institution_revisions.id
  ));

create policy "Eligible readers see current module instructors" on public.module_instructors for select to authenticated
  using (exists (select 1 from public.module_revisions r where r.id = module_revision_id)
    and exists (select 1 from public.instructors i where i.id = instructor_id));
create policy "Eligible readers see current module materials" on public.module_materials for select to authenticated
  using (exists (select 1 from public.module_revisions r where r.id = module_revision_id)
    and exists (select 1 from public.materials m where m.id = material_id));
create policy "Eligible readers see current module institutions" on public.module_institutions for select to authenticated
  using (exists (select 1 from public.module_revisions r where r.id = module_revision_id)
    and exists (select 1 from public.institutions i where i.id = institution_id));
create policy "Eligible readers see current teaching note materials" on public.teaching_note_materials for select to authenticated
  using (exists (select 1 from public.teaching_note_revisions r where r.id = teaching_note_revision_id)
    and exists (select 1 from public.materials m where m.id = material_id));

create function public.list_published_modules(
  search_query text default null,
  axis_filter uuid default null,
  theme_filter text default null
)
returns table (
  id uuid,
  revision_id uuid,
  axis_id uuid,
  axis_name text,
  title text,
  theme text,
  description text,
  learning_outcomes text[],
  suggested_duration text
)
language sql stable security invoker
set search_path = ''
as $$
  select m.id, r.id, a.id, a.name, r.title, r.theme, r.description,
    r.learning_outcomes, r.suggested_duration
  from public.modules m
  join public.module_revisions r on r.id = m.current_published_revision_id
  join public.axes a on a.id = r.axis_id
  where (axis_filter is null or a.id = axis_filter)
    and (theme_filter is null or private.normalize_curriculum_search(r.theme) = private.normalize_curriculum_search(theme_filter))
    and (search_query is null or trim(search_query) = '' or
      to_tsvector('spanish', private.normalize_curriculum_search(r.title || ' ' || r.description || ' ' || coalesce(r.theme, '')))
      @@ websearch_to_tsquery('spanish', private.normalize_curriculum_search(search_query)))
  order by a.display_order, r.title;
$$;

create function public.get_published_module(target_id uuid)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'id', m.id,
    'revisionId', r.id,
    'title', r.title,
    'description', r.description,
    'theme', r.theme,
    'learningOutcomes', r.learning_outcomes,
    'suggestedDuration', r.suggested_duration,
    'axis', jsonb_build_object('id', a.id, 'name', a.name),
    'programTopics', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'title', pr.title, 'description', pr.description, 'position', pr.position
    ) order by pr.position nulls last, pr.title)
      from public.program_topics p
      join public.program_topic_revisions pr on pr.id = p.current_published_revision_id
      where pr.module_id = m.id), '[]'::jsonb),
    'instructors', coalesce((select jsonb_agg(jsonb_build_object(
      'id', i.id, 'name', ir.name, 'roleOrTitle', ir.role_or_title,
      'institution', ir.institution, 'profile', ir.profile, 'linkedinUrl', ir.linkedin_url,
      'themes', ir.thematic_axis_or_themes, 'country', ir.country
    ) order by ir.name)
      from public.module_instructors mi
      join public.instructors i on i.id = mi.instructor_id
      join public.instructor_revisions ir on ir.id = i.current_published_revision_id
      where mi.module_revision_id = r.id), '[]'::jsonb),
    'teachingNotes', coalesce((select jsonb_agg(jsonb_build_object(
      'id', n.id, 'title', nr.title, 'text', nr.text, 'sourceUrl', nr.source_url,
      'programTopicId', nr.program_topic_id,
      'materials', coalesce((select jsonb_agg(jsonb_build_object('id', material.id, 'title', mr.title) order by mr.title)
        from public.teaching_note_materials nm
        join public.materials material on material.id = nm.material_id
        join public.material_revisions mr on mr.id = material.current_published_revision_id
        where nm.teaching_note_revision_id = nr.id), '[]'::jsonb)
    ) order by nr.title)
      from public.teaching_notes n
      join public.teaching_note_revisions nr on nr.id = n.current_published_revision_id
      where nr.module_id = m.id), '[]'::jsonb),
    'materials', coalesce((select jsonb_agg(jsonb_build_object(
      'id', material.id, 'title', mr.title, 'materialType', mr.material_type,
      'description', mr.description, 'sourceOrInstitution', mr.source_or_institution,
      'sourceUrl', mr.source_url, 'countryOrScope', mr.country_or_scope, 'theme', mr.theme
    ) order by mr.title)
      from public.module_materials mm
      join public.materials material on material.id = mm.material_id
      join public.material_revisions mr on mr.id = material.current_published_revision_id
      where mm.module_revision_id = r.id), '[]'::jsonb),
    'institutions', coalesce((select jsonb_agg(jsonb_build_object(
      'id', i.id, 'name', ir.name, 'institutionType', ir.institution_type,
      'countryOrScope', ir.country_or_scope, 'description', ir.description,
      'websiteUrl', ir.website_url, 'themes', ir.themes
    ) order by ir.name)
      from public.module_institutions mi
      join public.institutions i on i.id = mi.institution_id
      join public.institution_revisions ir on ir.id = i.current_published_revision_id
      where mi.module_revision_id = r.id), '[]'::jsonb)
  )
  from public.modules m
  join public.module_revisions r on r.id = m.current_published_revision_id
  join public.axes a on a.id = r.axis_id
  where m.id = target_id;
$$;

create function public.search_curriculum(
  search_query text default null,
  entity_filter text default null,
  axis_filter uuid default null,
  country_filter text default null,
  theme_filter text default null
)
returns table (
  entity_type text,
  id uuid,
  title text,
  description text,
  classification text,
  country_or_scope text,
  theme text,
  rank real
)
language sql stable security invoker
set search_path = ''
as $$
  with results as (
    select 'module'::text entity_type, m.id, r.title, r.description,
      a.name classification, null::text country_or_scope, r.theme,
      case when search_query is null or trim(search_query) = '' then 0::real else
        ts_rank(to_tsvector('spanish', private.normalize_curriculum_search(r.title || ' ' || r.description || ' ' || coalesce(r.theme, ''))),
          websearch_to_tsquery('spanish', private.normalize_curriculum_search(search_query))) end rank
    from public.modules m
    join public.module_revisions r on r.id = m.current_published_revision_id
    join public.axes a on a.id = r.axis_id
    where (entity_filter is null or entity_filter = 'module')
      and country_filter is null
      and (axis_filter is null or a.id = axis_filter)
      and (theme_filter is null or private.normalize_curriculum_search(r.theme) = private.normalize_curriculum_search(theme_filter))
      and (search_query is null or trim(search_query) = '' or
        to_tsvector('spanish', private.normalize_curriculum_search(r.title || ' ' || r.description || ' ' || coalesce(r.theme, '')))
        @@ websearch_to_tsquery('spanish', private.normalize_curriculum_search(search_query)))
    union all
    select 'material', m.id, r.title, r.description, r.material_type,
      r.country_or_scope, r.theme,
      case when search_query is null or trim(search_query) = '' then 0::real else
        ts_rank(to_tsvector('spanish', private.normalize_curriculum_search(r.title || ' ' || coalesce(r.description, '') || ' ' || coalesce(r.source_or_institution, '') || ' ' || coalesce(r.theme, ''))),
          websearch_to_tsquery('spanish', private.normalize_curriculum_search(search_query))) end
    from public.materials m
    join public.material_revisions r on r.id = m.current_published_revision_id
    where (entity_filter is null or entity_filter in ('reference', 'material'))
      and axis_filter is null
      and (country_filter is null or private.normalize_curriculum_search(r.country_or_scope) = private.normalize_curriculum_search(country_filter))
      and (theme_filter is null or private.normalize_curriculum_search(r.theme) = private.normalize_curriculum_search(theme_filter))
      and (search_query is null or trim(search_query) = '' or
        to_tsvector('spanish', private.normalize_curriculum_search(r.title || ' ' || coalesce(r.description, '') || ' ' || coalesce(r.source_or_institution, '') || ' ' || coalesce(r.theme, '')))
        @@ websearch_to_tsquery('spanish', private.normalize_curriculum_search(search_query)))
    union all
    select 'institution', i.id, r.name, r.description, r.institution_type,
      r.country_or_scope, array_to_string(r.themes, ', '),
      case when search_query is null or trim(search_query) = '' then 0::real else
        ts_rank(to_tsvector('spanish', private.normalize_curriculum_search(array_append(r.themes, r.name || ' ' || coalesce(r.description, '')))),
          websearch_to_tsquery('spanish', private.normalize_curriculum_search(search_query))) end
    from public.institutions i
    join public.institution_revisions r on r.id = i.current_published_revision_id
    where (entity_filter is null or entity_filter in ('reference', 'institution'))
      and axis_filter is null
      and (country_filter is null or private.normalize_curriculum_search(r.country_or_scope) = private.normalize_curriculum_search(country_filter))
      and (theme_filter is null or exists (
        select 1 from unnest(r.themes) value where private.normalize_curriculum_search(value) = private.normalize_curriculum_search(theme_filter)
      ))
      and (search_query is null or trim(search_query) = '' or
        to_tsvector('spanish', private.normalize_curriculum_search(array_append(r.themes, r.name || ' ' || coalesce(r.description, ''))))
        @@ websearch_to_tsquery('spanish', private.normalize_curriculum_search(search_query)))
  )
  select * from results order by rank desc, title;
$$;

create function public.get_published_reference(reference_type text, target_id uuid)
returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  select case reference_type
    when 'material' then (
      select jsonb_build_object(
        'entityType', 'material', 'id', m.id, 'title', r.title,
        'description', r.description, 'classification', r.material_type,
        'sourceOrInstitution', r.source_or_institution, 'sourceUrl', r.source_url,
        'countryOrScope', r.country_or_scope, 'themes',
          case when r.theme is null then '[]'::jsonb else jsonb_build_array(r.theme) end
      ) from public.materials m join public.material_revisions r on r.id = m.current_published_revision_id
      where m.id = target_id
    )
    when 'institution' then (
      select jsonb_build_object(
        'entityType', 'institution', 'id', i.id, 'title', r.name,
        'description', r.description, 'classification', r.institution_type,
        'websiteUrl', r.website_url, 'countryOrScope', r.country_or_scope,
        'themes', to_jsonb(r.themes)
      ) from public.institutions i join public.institution_revisions r on r.id = i.current_published_revision_id
      where i.id = target_id
    )
    else null
  end;
$$;

-- One PostgREST RPC provides transactionality for trusted initial imports.
-- The caller still needs service_role and the operator script confirms the target.
create function private.import_curriculum_rows(
  records jsonb,
  target_table text,
  key_names text[],
  strip_current_pointer boolean default false
)
returns table (inserted integer, unchanged integer)
language plpgsql security invoker
set search_path = ''
as $$
declare
  source_record jsonb;
  record_to_write jsonb;
  existing_record jsonb;
  key_name text;
  field record;
  where_clause text;
  column_list text;
  value_list text;
begin
  inserted := 0;
  unchanged := 0;
  if records is null then records := '[]'::jsonb; end if;
  if jsonb_typeof(records) <> 'array' then
    raise exception '% must be an array', target_table using errcode = '22023';
  end if;
  for source_record in select value from jsonb_array_elements(records)
  loop
    record_to_write := case when strip_current_pointer then source_record - 'current_published_revision_id' else source_record end;
    where_clause := '';
    foreach key_name in array key_names
    loop
      if source_record->>key_name is null then
        raise exception '% is missing stable key %', target_table, key_name using errcode = '22023';
      end if;
      where_clause := where_clause || case when where_clause = '' then '' else ' and ' end
        || format('%I = %L', key_name, source_record->>key_name);
    end loop;
    execute format('select to_jsonb(t) from public.%I t where %s', target_table, where_clause)
      into existing_record;
    if existing_record is not null then
      for field in select * from jsonb_each(record_to_write)
      loop
        if field.key like '%\_at' escape '\' and field.value <> 'null'::jsonb and existing_record->field.key <> 'null'::jsonb then
          if (existing_record->>field.key)::timestamptz is distinct from (field.value #>> '{}')::timestamptz then
            raise exception '% stable row has different %', target_table, field.key using errcode = '23505';
          end if;
        elsif existing_record->field.key is distinct from field.value then
          raise exception '% stable row has different %', target_table, field.key using errcode = '23505';
        end if;
      end loop;
      unchanged := unchanged + 1;
    else
      select string_agg(format('%I', value), ', '),
        string_agg(format('(jsonb_populate_record(null::public.%I, $1)).%I', target_table, value), ', ')
      into column_list, value_list
      from jsonb_object_keys(record_to_write) as keys(value);
      execute format('insert into public.%I (%s) select %s', target_table, column_list, value_list)
        using record_to_write;
      inserted := inserted + 1;
    end if;
  end loop;
  return next;
end;
$$;

create function public.import_published_curriculum(payload jsonb)
returns jsonb
language plpgsql security invoker
set search_path = ''
as $$
declare
  config record;
  source_record jsonb;
  stats record;
  total_inserted integer := 0;
  total_unchanged integer := 0;
  current_pointer uuid;
  expected_pointer uuid;
begin
  if payload->>'version' <> '1' then
    raise exception 'curriculum import version must be 1' using errcode = '22023';
  end if;
  if payload->'axes' is null or payload->'identities' is null or payload->'revisions' is null or payload->'relationships' is null then
    raise exception 'curriculum import groups are required' using errcode = '22023';
  end if;

  for config in select * from (values
    ('modules'), ('program_topics'), ('instructors'), ('teaching_notes'), ('materials'), ('institutions')
  ) as identities(table_name)
  loop
    for source_record in select value from jsonb_array_elements(coalesce(payload->'identities'->config.table_name, '[]'::jsonb))
    loop
      if source_record->>'current_published_revision_id' is null then
        raise exception '% identity requires current published revision', config.table_name using errcode = '22023';
      end if;
      if source_record->'archived_at' is not null and source_record->'archived_at' <> 'null'::jsonb then
        raise exception 'initial import cannot archive %', config.table_name using errcode = '22023';
      end if;
    end loop;
  end loop;

  for config in select * from (values
    ('module_revisions'), ('program_topic_revisions'), ('instructor_revisions'),
    ('teaching_note_revisions'), ('material_revisions'), ('institution_revisions')
  ) as revisions(table_name)
  loop
    for source_record in select value from jsonb_array_elements(coalesce(payload->'revisions'->config.table_name, '[]'::jsonb))
    loop
      if source_record->>'status' <> 'Published' or source_record->>'published_at' is null then
        raise exception '% only accepts Published revisions with published_at', config.table_name using errcode = '22023';
      end if;
    end loop;
  end loop;

  for config in select * from (values
    ('axes', 'axes', array['id']::text[], false),
    ('identities', 'modules', array['id']::text[], true),
    ('identities', 'program_topics', array['id']::text[], true),
    ('identities', 'instructors', array['id']::text[], true),
    ('identities', 'teaching_notes', array['id']::text[], true),
    ('identities', 'materials', array['id']::text[], true),
    ('identities', 'institutions', array['id']::text[], true),
    ('revisions', 'module_revisions', array['id']::text[], false),
    ('revisions', 'program_topic_revisions', array['id']::text[], false),
    ('revisions', 'instructor_revisions', array['id']::text[], false),
    ('revisions', 'teaching_note_revisions', array['id']::text[], false),
    ('revisions', 'material_revisions', array['id']::text[], false),
    ('revisions', 'institution_revisions', array['id']::text[], false),
    ('relationships', 'module_instructors', array['module_revision_id', 'instructor_id']::text[], false),
    ('relationships', 'module_materials', array['module_revision_id', 'material_id']::text[], false),
    ('relationships', 'module_institutions', array['module_revision_id', 'institution_id']::text[], false),
    ('relationships', 'teaching_note_materials', array['teaching_note_revision_id', 'material_id']::text[], false)
  ) as imports(group_name, table_name, stable_keys, strip_pointer)
  loop
    select * into stats from private.import_curriculum_rows(
      case when config.group_name = 'axes' then payload->'axes' else payload->config.group_name->config.table_name end,
      config.table_name, config.stable_keys, config.strip_pointer
    );
    total_inserted := total_inserted + stats.inserted;
    total_unchanged := total_unchanged + stats.unchanged;
  end loop;

  for config in select * from (values
    ('modules'), ('program_topics'), ('instructors'), ('teaching_notes'), ('materials'), ('institutions')
  ) as identities(table_name)
  loop
    for source_record in select value from jsonb_array_elements(coalesce(payload->'identities'->config.table_name, '[]'::jsonb))
    loop
      expected_pointer := (source_record->>'current_published_revision_id')::uuid;
      execute format('select current_published_revision_id from public.%I where id = $1', config.table_name)
        into current_pointer using (source_record->>'id')::uuid;
      if current_pointer is not null and current_pointer <> expected_pointer then
        raise exception '% identity already points to another published revision', config.table_name using errcode = '23505';
      end if;
      if current_pointer is null then
        execute format('update public.%I set current_published_revision_id = $1 where id = $2', config.table_name)
          using expected_pointer, (source_record->>'id')::uuid;
      end if;
    end loop;
  end loop;

  return jsonb_build_object('inserted', total_inserted, 'unchanged', total_unchanged);
end;
$$;

revoke all on function private.import_curriculum_rows(jsonb, text, text[], boolean),
  public.import_published_curriculum(jsonb) from public, anon, authenticated;
grant execute on function private.import_curriculum_rows(jsonb, text, text[], boolean),
  public.import_published_curriculum(jsonb) to service_role;

revoke all on function public.list_published_modules(text, uuid, text),
  public.get_published_module(uuid),
  public.search_curriculum(text, text, uuid, text, text),
  public.get_published_reference(text, uuid)
from public, anon, authenticated;
grant execute on function public.list_published_modules(text, uuid, text),
  public.get_published_module(uuid),
  public.search_curriculum(text, text, uuid, text, text),
  public.get_published_reference(text, uuid)
to authenticated;
