-- Keep every current-published dependency stable until publication commits.
create or replace function private.is_current_published_identity(
  target_type public.curriculum_content_type,
  target_id uuid
)
returns boolean
language plpgsql volatile security definer
set search_path = ''
as $$
declare published boolean;
begin
  case target_type
    when 'module' then
      select true into published
      from public.modules identity
      join public.module_revisions revision on revision.id = identity.current_published_revision_id
      where identity.id = target_id and identity.archived_at is null and revision.status = 'Published'
      for share of identity;
    when 'program_topic' then
      select true into published
      from public.program_topics identity
      join public.program_topic_revisions revision on revision.id = identity.current_published_revision_id
      where identity.id = target_id and identity.archived_at is null and revision.status = 'Published'
      for share of identity;
    when 'instructor' then
      select true into published
      from public.instructors identity
      join public.instructor_revisions revision on revision.id = identity.current_published_revision_id
      where identity.id = target_id and identity.archived_at is null and revision.status = 'Published'
      for share of identity;
    when 'material' then
      select true into published
      from public.materials identity
      join public.material_revisions revision on revision.id = identity.current_published_revision_id
      where identity.id = target_id and identity.archived_at is null and revision.status = 'Published'
      for share of identity;
    when 'institution' then
      select true into published
      from public.institutions identity
      join public.institution_revisions revision on revision.id = identity.current_published_revision_id
      where identity.id = target_id and identity.archived_at is null and revision.status = 'Published'
      for share of identity;
    else
      published := false;
  end case;
  return coalesce(published, false);
end;
$$;

-- Validation now acquires transaction-scoped row locks and is intentionally
-- volatile even though its semantic checks remain read-only.
alter function private.validate_publication(public.curriculum_content_type, uuid, uuid) volatile;

revoke all on function private.is_current_published_identity(public.curriculum_content_type, uuid)
from public, anon, authenticated, service_role;
