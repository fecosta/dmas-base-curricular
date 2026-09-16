-- SPEC-005 Phase 2A correction: give the archived-content listing a strict
-- total keyset ordering.
--
-- 20260916000100 ordered and paginated on (archived_at, content_id). A uuid is
-- unique within one identity table, but the six governed identity tables each
-- declare their own independent `id uuid primary key` with client-supplied
-- values (the trusted curriculum import assigns them), so nothing prevents a
-- Material identity and an Institution identity from holding the same uuid. If
-- two such rows also share archived_at, that two-part cursor is not a total
-- order: a page boundary falling between the tied rows skips one of them, and an
-- archived identity becomes unreachable for restoration.
--
-- Adding content_type as the final component makes the ordering strictly total:
-- within a single content_type the primary key already makes content_id unique,
-- so no two rows can share all three components. The ORDER BY and the cursor
-- predicate are exact inverses for descending keyset pagination.
--
-- Forward-only: the committed migration is left untouched. Functions and grants
-- only — no table, column, enum, RLS policy, archive/restore, reader or
-- attachment change.

-- The argument list changes, so the previous overload is removed rather than
-- left behind as an ambiguous second candidate.
drop function if exists public.list_archived_governed_content(
  integer, timestamptz, uuid, public.curriculum_content_type
);

create function public.list_archived_governed_content(
  page_size integer default 50,
  before_archived_at timestamptz default null,
  before_content_id uuid default null,
  before_content_type public.curriculum_content_type default null,
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
  if num_nonnulls(before_archived_at, before_content_id, before_content_type) not in (0, 3) then
    raise exception 'archived cursor requires all keyset values' using errcode = '22023';
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
      or (entry.archived_at, entry.content_id, entry.content_type)
         < (before_archived_at, before_content_id, before_content_type)
    )
  order by entry.archived_at desc, entry.content_id desc, entry.content_type desc
  limit page_size;
end;
$$;

revoke all on function public.list_archived_governed_content(
  integer, timestamptz, uuid, public.curriculum_content_type, public.curriculum_content_type
) from public, anon, authenticated, service_role;

grant execute on function public.list_archived_governed_content(
  integer, timestamptz, uuid, public.curriculum_content_type, public.curriculum_content_type
) to authenticated;
