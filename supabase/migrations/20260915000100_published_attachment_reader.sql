-- SPEC-004 Phase 4: current-published attachment reads through private Storage.

create function private.can_read_current_published_attachment(requested_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.curriculum_attachments attachment
    where attachment.object_name = requested_name
      and attachment.state = 'Ready'
      and exists (select 1 from private.current_access())
      and (
        (attachment.teaching_note_revision_id is not null and exists (
          select 1
          from public.teaching_note_revisions revision
          join public.teaching_notes identity on identity.id = revision.teaching_note_id
          where revision.id = attachment.teaching_note_revision_id
            and revision.status = 'Published'
            and identity.archived_at is null
            and identity.current_published_revision_id = revision.id
        )) or
        (attachment.material_revision_id is not null and exists (
          select 1
          from public.material_revisions revision
          join public.materials identity on identity.id = revision.material_id
          where revision.id = attachment.material_revision_id
            and revision.status = 'Published'
            and identity.archived_at is null
            and identity.current_published_revision_id = revision.id
        ))
      )
  );
$$;

create policy "Readers read current Published attachment metadata"
on public.curriculum_attachments
for select to authenticated
using (private.can_read_current_published_attachment(object_name));

create policy "Readers read current Published attachment objects"
on storage.objects
for select to authenticated
using (
  bucket_id = 'governed-attachments'
  and private.can_read_current_published_attachment(name)
);

create or replace function public.get_published_module(target_id uuid)
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
        where nm.teaching_note_revision_id = nr.id), '[]'::jsonb),
      'attachments', coalesce((select jsonb_agg(jsonb_build_object(
        'id', attachment.id, 'originalFilename', attachment.original_filename,
        'mimeType', attachment.mime_type, 'sizeBytes', attachment.size_bytes
      ) order by attachment.created_at)
        from public.curriculum_attachments attachment
        where attachment.teaching_note_revision_id = nr.id and attachment.state = 'Ready'), '[]'::jsonb)
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

create or replace function public.get_published_reference(reference_type text, target_id uuid)
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
          case when r.theme is null then '[]'::jsonb else jsonb_build_array(r.theme) end,
        'attachments', coalesce((select jsonb_agg(jsonb_build_object(
          'id', attachment.id, 'originalFilename', attachment.original_filename,
          'mimeType', attachment.mime_type, 'sizeBytes', attachment.size_bytes
        ) order by attachment.created_at)
          from public.curriculum_attachments attachment
          where attachment.material_revision_id = r.id and attachment.state = 'Ready'), '[]'::jsonb)
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

revoke all on function private.can_read_current_published_attachment(text)
from public, anon, authenticated, service_role;
grant execute on function private.can_read_current_published_attachment(text) to authenticated;
