begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
select no_plan();

insert into public.organizations(id, name, is_active) values
  ('91000000-0000-4000-8000-000000000001', 'Red sucesora A', true),
  ('91000000-0000-4000-8000-000000000002', 'Red sucesora B', true);
insert into public.organization_domains(domain, organization_id) values
  ('successor-a.test', '91000000-0000-4000-8000-000000000001'),
  ('successor-b.test', '91000000-0000-4000-8000-000000000002');
insert into auth.users(id, email, email_confirmed_at) values
  ('92000000-0000-4000-8000-000000000001', 'admin-a@successor-a.test', now()),
  ('92000000-0000-4000-8000-000000000002', 'admin-b@successor-b.test', now()),
  ('92000000-0000-4000-8000-000000000003', 'reader@successor-a.test', now());
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001', 'Admin', true),
  ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'Admin', true),
  ('92000000-0000-4000-8000-000000000003', '91000000-0000-4000-8000-000000000001', 'Contributor', true);

insert into public.modules(id, created_by) values
  ('93000000-0000-4000-8000-000000000001', '92000000-0000-4000-8000-000000000002');
insert into public.program_topics(id, created_by) values
  ('93000000-0000-4000-8000-000000000002', '92000000-0000-4000-8000-000000000002');
insert into public.instructors(id, created_by) values
  ('93000000-0000-4000-8000-000000000003', '92000000-0000-4000-8000-000000000002');
insert into public.teaching_notes(id, created_by) values
  ('93000000-0000-4000-8000-000000000004', '92000000-0000-4000-8000-000000000002');
insert into public.materials(id, created_by) values
  ('93000000-0000-4000-8000-000000000005', '92000000-0000-4000-8000-000000000002');
insert into public.institutions(id, created_by) values
  ('93000000-0000-4000-8000-000000000006', '92000000-0000-4000-8000-000000000002');

insert into public.module_revisions(
  id, module_id, revision_number, status, axis_id, title, theme, description,
  learning_outcomes, level, delivery_format, suggested_duration, created_by,
  contributor_organization_id, published_at
) values (
  '94000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000001', 1, 'Published',
  'a1000000-0000-4000-8000-000000000001', 'Módulo v1 sucesor', 'Democracia', 'Descripción v1.',
  array['Comprender', 'Aplicar'], 'Avanzado', 'Presencial', '90 minutos',
  '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', now()
);
insert into public.program_topic_revisions(
  id, program_topic_id, revision_number, status, module_id, title, description,
  position, created_by, contributor_organization_id, published_at
) values (
  '94000000-0000-4000-8000-000000000002', '93000000-0000-4000-8000-000000000002', 1, 'Published',
  '93000000-0000-4000-8000-000000000001', 'Tema v1', 'Detalle del tema.', 3,
  '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', now()
);
insert into public.instructor_revisions(
  id, instructor_id, revision_number, status, name, role_or_title, institution,
  profile, linkedin_url, thematic_axis_or_themes, country, created_by,
  contributor_organization_id, published_at
) values (
  '94000000-0000-4000-8000-000000000003', '93000000-0000-4000-8000-000000000003', 1, 'Published',
  'Docente v1', 'Investigadora', 'Instituto Uno', 'Perfil completo.', 'https://example.test/docente',
  array['Campañas', 'Evidencia'], 'Chile', '92000000-0000-4000-8000-000000000002',
  '91000000-0000-4000-8000-000000000002', now()
);
insert into public.teaching_note_revisions(
  id, teaching_note_id, revision_number, status, module_id, program_topic_id,
  title, text, source_url, created_by, contributor_organization_id, published_at
) values (
  '94000000-0000-4000-8000-000000000004', '93000000-0000-4000-8000-000000000004', 1, 'Published',
  '93000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000002',
  'Nota v1', 'Texto pedagógico.', 'https://example.test/nota', '92000000-0000-4000-8000-000000000002',
  '91000000-0000-4000-8000-000000000002', now()
);
insert into public.material_revisions(
  id, material_id, revision_number, status, title, material_type, description,
  source_or_institution, source_url, country_or_scope, theme, created_by,
  contributor_organization_id, published_at
) values (
  '94000000-0000-4000-8000-000000000005', '93000000-0000-4000-8000-000000000005', 1, 'Published',
  'Material v1', 'Manual', 'Descripción del material.', 'Centro Uno', 'https://example.test/material',
  'Regional', 'Participación', '92000000-0000-4000-8000-000000000002',
  '91000000-0000-4000-8000-000000000002', now()
);
insert into public.institution_revisions(
  id, institution_id, revision_number, status, name, institution_type,
  country_or_scope, description, website_url, themes, created_by,
  contributor_organization_id, published_at
) values (
  '94000000-0000-4000-8000-000000000006', '93000000-0000-4000-8000-000000000006', 1, 'Published',
  'Institución v1', 'Centro', 'Andino', 'Descripción institucional.', 'https://example.test/institucion',
  array['Gobernanza', 'Datos'], '92000000-0000-4000-8000-000000000002',
  '91000000-0000-4000-8000-000000000002', now()
);

update public.modules set current_published_revision_id = '94000000-0000-4000-8000-000000000001'
where id = '93000000-0000-4000-8000-000000000001';
update public.program_topics set current_published_revision_id = '94000000-0000-4000-8000-000000000002'
where id = '93000000-0000-4000-8000-000000000002';
update public.instructors set current_published_revision_id = '94000000-0000-4000-8000-000000000003'
where id = '93000000-0000-4000-8000-000000000003';
update public.teaching_notes set current_published_revision_id = '94000000-0000-4000-8000-000000000004'
where id = '93000000-0000-4000-8000-000000000004';
update public.materials set current_published_revision_id = '94000000-0000-4000-8000-000000000005'
where id = '93000000-0000-4000-8000-000000000005';
update public.institutions set current_published_revision_id = '94000000-0000-4000-8000-000000000006'
where id = '93000000-0000-4000-8000-000000000006';

set local session_replication_role = replica;
insert into public.module_instructors values
  ('94000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000003');
insert into public.module_materials values
  ('94000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000005');
insert into public.module_institutions values
  ('94000000-0000-4000-8000-000000000001', '93000000-0000-4000-8000-000000000006');
insert into public.teaching_note_materials values
  ('94000000-0000-4000-8000-000000000004', '93000000-0000-4000-8000-000000000005');

insert into public.curriculum_attachments(
  id, object_name, original_filename, mime_type, size_bytes,
  teaching_note_revision_id, created_by, contributor_organization_id, state
) values (
  '95000000-0000-4000-8000-000000000001', '95000000-0000-4000-8000-000000000001',
  'nota-v1.pdf', 'application/pdf', 100, '94000000-0000-4000-8000-000000000004',
  '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'Ready'
);
insert into public.curriculum_attachments(
  id, object_name, original_filename, mime_type, size_bytes,
  material_revision_id, created_by, contributor_organization_id, state
) values (
  '95000000-0000-4000-8000-000000000002', '95000000-0000-4000-8000-000000000002',
  'material-v1.pdf', 'application/pdf', 200, '94000000-0000-4000-8000-000000000005',
  '92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000002', 'Ready'
);
set local session_replication_role = origin;

create temporary table v1_snapshots(content_type text primary key, row_data jsonb);
grant select on v1_snapshots to authenticated;
insert into v1_snapshots values
  ('module', (select to_jsonb(revision) from public.module_revisions revision where id = '94000000-0000-4000-8000-000000000001')),
  ('program_topic', (select to_jsonb(revision) from public.program_topic_revisions revision where id = '94000000-0000-4000-8000-000000000002')),
  ('instructor', (select to_jsonb(revision) from public.instructor_revisions revision where id = '94000000-0000-4000-8000-000000000003')),
  ('teaching_note', (select to_jsonb(revision) from public.teaching_note_revisions revision where id = '94000000-0000-4000-8000-000000000004')),
  ('material', (select to_jsonb(revision) from public.material_revisions revision where id = '94000000-0000-4000-8000-000000000005')),
  ('institution', (select to_jsonb(revision) from public.institution_revisions revision where id = '94000000-0000-4000-8000-000000000006'));

create temporary table successor_results(content_type text primary key, payload jsonb);
grant all on successor_results to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into successor_results values
  ('module', public.create_successor_draft('module', '93000000-0000-4000-8000-000000000001')),
  ('program_topic', public.create_successor_draft('program_topic', '93000000-0000-4000-8000-000000000002')),
  ('instructor', public.create_successor_draft('instructor', '93000000-0000-4000-8000-000000000003')),
  ('teaching_note', public.create_successor_draft('teaching_note', '93000000-0000-4000-8000-000000000004')),
  ('material', public.create_successor_draft('material', '93000000-0000-4000-8000-000000000005')),
  ('institution', public.create_successor_draft('institution', '93000000-0000-4000-8000-000000000006'));

select is(
  (select jsonb_build_object('axis_id', axis_id, 'title', title, 'theme', theme, 'description', description,
    'learning_outcomes', learning_outcomes, 'level', level, 'delivery_format', delivery_format,
    'suggested_duration', suggested_duration)
   from public.module_revisions where id = (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')),
  (select jsonb_build_object('axis_id', axis_id, 'title', title, 'theme', theme, 'description', description,
    'learning_outcomes', learning_outcomes, 'level', level, 'delivery_format', delivery_format,
    'suggested_duration', suggested_duration)
   from public.module_revisions where id = '94000000-0000-4000-8000-000000000001'),
  'Module successor clones every semantic field');
select is(
  (select jsonb_build_object('module_id', module_id, 'title', title, 'description', description, 'position', position)
   from public.program_topic_revisions where id = (select (payload->>'revision_id')::uuid from successor_results where content_type = 'program_topic')),
  (select jsonb_build_object('module_id', module_id, 'title', title, 'description', description, 'position', position)
   from public.program_topic_revisions where id = '94000000-0000-4000-8000-000000000002'),
  'Program Topic successor clones every semantic field');
select is(
  (select jsonb_build_object('name', name, 'role_or_title', role_or_title, 'institution', institution,
    'profile', profile, 'linkedin_url', linkedin_url, 'thematic_axis_or_themes', thematic_axis_or_themes, 'country', country)
   from public.instructor_revisions where id = (select (payload->>'revision_id')::uuid from successor_results where content_type = 'instructor')),
  (select jsonb_build_object('name', name, 'role_or_title', role_or_title, 'institution', institution,
    'profile', profile, 'linkedin_url', linkedin_url, 'thematic_axis_or_themes', thematic_axis_or_themes, 'country', country)
   from public.instructor_revisions where id = '94000000-0000-4000-8000-000000000003'),
  'Instructor successor clones every semantic field');
select is(
  (select jsonb_build_object('module_id', module_id, 'program_topic_id', program_topic_id, 'title', title,
    'text', text, 'source_url', source_url)
   from public.teaching_note_revisions where id = (select (payload->>'revision_id')::uuid from successor_results where content_type = 'teaching_note')),
  (select jsonb_build_object('module_id', module_id, 'program_topic_id', program_topic_id, 'title', title,
    'text', text, 'source_url', source_url)
   from public.teaching_note_revisions where id = '94000000-0000-4000-8000-000000000004'),
  'Teaching Note successor clones every semantic field');
select is(
  (select jsonb_build_object('title', title, 'material_type', material_type, 'description', description,
    'source_or_institution', source_or_institution, 'source_url', source_url, 'country_or_scope', country_or_scope, 'theme', theme)
   from public.material_revisions where id = (select (payload->>'revision_id')::uuid from successor_results where content_type = 'material')),
  (select jsonb_build_object('title', title, 'material_type', material_type, 'description', description,
    'source_or_institution', source_or_institution, 'source_url', source_url, 'country_or_scope', country_or_scope, 'theme', theme)
   from public.material_revisions where id = '94000000-0000-4000-8000-000000000005'),
  'Material successor clones every semantic field');
select is(
  (select jsonb_build_object('name', name, 'institution_type', institution_type, 'country_or_scope', country_or_scope,
    'description', description, 'website_url', website_url, 'themes', themes)
   from public.institution_revisions where id = (select (payload->>'revision_id')::uuid from successor_results where content_type = 'institution')),
  (select jsonb_build_object('name', name, 'institution_type', institution_type, 'country_or_scope', country_or_scope,
    'description', description, 'website_url', website_url, 'themes', themes)
   from public.institution_revisions where id = '94000000-0000-4000-8000-000000000006'),
  'Institution successor clones every semantic field');

select is((select count(*) from successor_results where payload->>'content_id' = case content_type
  when 'module' then '93000000-0000-4000-8000-000000000001'
  when 'program_topic' then '93000000-0000-4000-8000-000000000002'
  when 'instructor' then '93000000-0000-4000-8000-000000000003'
  when 'teaching_note' then '93000000-0000-4000-8000-000000000004'
  when 'material' then '93000000-0000-4000-8000-000000000005'
  when 'institution' then '93000000-0000-4000-8000-000000000006' end), 6::bigint,
  'all six successors retain their stable identity');
select is((select count(*) from successor_results where payload->>'revision_number' = '2'), 6::bigint,
  'all six successors increment revision number to 2');
select is((select count(*) from successor_results where payload->>'status' = 'Draft'), 6::bigint,
  'all six successors begin in Draft');
select is((select count(*) from public.list_curriculum_lifecycle_history(action_filter => 'revision_created') event
  join successor_results result on (result.payload->>'revision_id')::uuid = event.revision_id
  where event.resulting_status = 'Draft'
    and event.actor_user_id = '92000000-0000-4000-8000-000000000001'
    and event.actor_organization_id = '91000000-0000-4000-8000-000000000001'), 6::bigint,
  'successor creation records trusted revision lifecycle evidence for all six types');
select is((select count(*) from public.list_curriculum_lifecycle_history(action_filter => 'content_created') event
  join successor_results result on (result.payload->>'revision_id')::uuid = event.revision_id
  ), 0::bigint,
  'successor creation does not misreport an existing stable identity as newly created');
select is((select count(*) from (
  select created_by, contributor_organization_id from public.module_revisions where revision_number = 2 and module_id = '93000000-0000-4000-8000-000000000001'
  union all select created_by, contributor_organization_id from public.program_topic_revisions where revision_number = 2 and program_topic_id = '93000000-0000-4000-8000-000000000002'
  union all select created_by, contributor_organization_id from public.instructor_revisions where revision_number = 2 and instructor_id = '93000000-0000-4000-8000-000000000003'
  union all select created_by, contributor_organization_id from public.teaching_note_revisions where revision_number = 2 and teaching_note_id = '93000000-0000-4000-8000-000000000004'
  union all select created_by, contributor_organization_id from public.material_revisions where revision_number = 2 and material_id = '93000000-0000-4000-8000-000000000005'
  union all select created_by, contributor_organization_id from public.institution_revisions where revision_number = 2 and institution_id = '93000000-0000-4000-8000-000000000006'
) revisions where created_by = '92000000-0000-4000-8000-000000000001'
  and contributor_organization_id = '91000000-0000-4000-8000-000000000001'), 6::bigint,
  'all six successors derive new revision creator and organization from trusted live access');
select is((select count(*) from (
  select published_at, submitted_at from public.module_revisions where revision_number = 2 and module_id = '93000000-0000-4000-8000-000000000001'
  union all select published_at, submitted_at from public.program_topic_revisions where revision_number = 2 and program_topic_id = '93000000-0000-4000-8000-000000000002'
  union all select published_at, submitted_at from public.instructor_revisions where revision_number = 2 and instructor_id = '93000000-0000-4000-8000-000000000003'
  union all select published_at, submitted_at from public.teaching_note_revisions where revision_number = 2 and teaching_note_id = '93000000-0000-4000-8000-000000000004'
  union all select published_at, submitted_at from public.material_revisions where revision_number = 2 and material_id = '93000000-0000-4000-8000-000000000005'
  union all select published_at, submitted_at from public.institution_revisions where revision_number = 2 and institution_id = '93000000-0000-4000-8000-000000000006'
) revisions where published_at is null and submitted_at is null), 6::bigint,
  'all six successors carry no inherited publication or submission metadata');
select is((select count(*) from (values
  ((select current_published_revision_id from public.modules where id = '93000000-0000-4000-8000-000000000001'), '94000000-0000-4000-8000-000000000001'::uuid),
  ((select current_published_revision_id from public.program_topics where id = '93000000-0000-4000-8000-000000000002'), '94000000-0000-4000-8000-000000000002'::uuid),
  ((select current_published_revision_id from public.instructors where id = '93000000-0000-4000-8000-000000000003'), '94000000-0000-4000-8000-000000000003'::uuid),
  ((select current_published_revision_id from public.teaching_notes where id = '93000000-0000-4000-8000-000000000004'), '94000000-0000-4000-8000-000000000004'::uuid),
  ((select current_published_revision_id from public.materials where id = '93000000-0000-4000-8000-000000000005'), '94000000-0000-4000-8000-000000000005'::uuid),
  ((select current_published_revision_id from public.institutions where id = '93000000-0000-4000-8000-000000000006'), '94000000-0000-4000-8000-000000000006'::uuid)
) pointers(actual, expected) where actual = expected), 6::bigint,
  'creating all six successors leaves every current-published pointer unchanged');

select is((select count(*) from public.module_instructors where module_revision_id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')), 1::bigint,
  'Module successor separately copies instructor relationships');
select is((select count(*) from public.module_materials where module_revision_id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')), 1::bigint,
  'Module successor separately copies material relationships');
select is((select count(*) from public.module_institutions where module_revision_id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')), 1::bigint,
  'Module successor separately copies institution relationships');
select is((select count(*) from public.teaching_note_materials where teaching_note_revision_id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'teaching_note')), 1::bigint,
  'Teaching Note successor separately copies material relationships');
select is((select count(*) from public.curriculum_attachments where teaching_note_revision_id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'teaching_note')), 0::bigint,
  'published Teaching Note attachment metadata is not copied to its successor');
select is((select count(*) from public.curriculum_attachments where material_revision_id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'material')), 0::bigint,
  'published Material attachment metadata is not copied to its successor');
select is((select count(*) from v1_snapshots snapshot where row_data = case content_type
  when 'module' then (select to_jsonb(revision) from public.module_revisions revision where id = '94000000-0000-4000-8000-000000000001')
  when 'program_topic' then (select to_jsonb(revision) from public.program_topic_revisions revision where id = '94000000-0000-4000-8000-000000000002')
  when 'instructor' then (select to_jsonb(revision) from public.instructor_revisions revision where id = '94000000-0000-4000-8000-000000000003')
  when 'teaching_note' then (select to_jsonb(revision) from public.teaching_note_revisions revision where id = '94000000-0000-4000-8000-000000000004')
  when 'material' then (select to_jsonb(revision) from public.material_revisions revision where id = '94000000-0000-4000-8000-000000000005')
  when 'institution' then (select to_jsonb(revision) from public.institution_revisions revision where id = '94000000-0000-4000-8000-000000000006') end), 6::bigint,
  'all six Published v1 rows remain byte-for-byte unchanged after cloning');

select throws_ok($$select public.create_successor_draft('module', '93000000-0000-4000-8000-000000000001')$$,
  '55000', 'active successor Draft already exists', 'duplicate successor creation is rejected');
select is((select count(*) from pg_index index_record
  join pg_class index_relation on index_relation.oid = index_record.indexrelid
  where index_relation.relname in (
    'module_revisions_one_active_draft', 'program_topic_revisions_one_active_draft',
    'instructor_revisions_one_active_draft', 'teaching_note_revisions_one_active_draft',
    'material_revisions_one_active_draft', 'institution_revisions_one_active_draft'
  ) and index_record.indisunique and pg_get_expr(index_record.indpred, index_record.indrelid) like '%status%Draft%'), 6::bigint,
  'all six active-Draft guards are partial unique indexes');

select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.module_revisions where id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')), 1::bigint,
  'Admin B reads the successor created by Admin A');
select lives_ok(format($sql$select public.update_contribution('module', %L, jsonb_build_object(
  'axis_id', 'a1000000-0000-4000-8000-000000000001', 'title', 'Módulo v2 editado por B',
  'theme', 'Democracia', 'description', 'Descripción v2.', 'learning_outcomes', jsonb_build_array('Comprender', 'Aplicar'),
  'level', 'Avanzado', 'delivery_format', 'Presencial', 'suggested_duration', '90 minutos',
  'instructor_ids', jsonb_build_array('93000000-0000-4000-8000-000000000003'),
  'material_ids', jsonb_build_array('93000000-0000-4000-8000-000000000005'),
  'institution_ids', jsonb_build_array('93000000-0000-4000-8000-000000000006')))$sql$,
  (select payload->>'revision_id' from successor_results where content_type = 'module')),
  'Admin B updates Admin A successor');
select is((select created_by from public.module_revisions where id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')),
  '92000000-0000-4000-8000-000000000001'::uuid, 'cross-Admin successor edit preserves creator provenance');
select is((select contributor_organization_id from public.module_revisions where id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')),
  '91000000-0000-4000-8000-000000000001'::uuid, 'cross-Admin successor edit preserves organization provenance');

select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok($$select public.create_successor_draft('module', '93000000-0000-4000-8000-000000000001')$$,
  '42501', 'eligible Admin access required', 'Contributor cannot create a successor');
select is((select count(*) from public.module_revisions where id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')), 0::bigint,
  'Contributor cannot read a successor Draft');
select throws_ok(format($sql$select public.update_contribution('module', %L, '{}')$sql$,
  (select payload->>'revision_id' from successor_results where content_type = 'module')),
  '42501', 'eligible Admin access required', 'Contributor cannot update a successor Draft');
select throws_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from successor_results where content_type = 'module')),
  '42501', 'eligible Admin access required', 'Contributor cannot publish a successor Draft');
select is((select title from public.list_published_modules() where id = '93000000-0000-4000-8000-000000000001'),
  'Módulo v1 sucesor', 'reader continues to resolve v1 while v2 exists');
select is((select count(*) from public.search_curriculum('Módulo v1 sucesor') where id = '93000000-0000-4000-8000-000000000001'), 1::bigint,
  'reader search continues to find v1 while v2 exists');
select is((select count(*) from public.search_curriculum('editado por B') where id = '93000000-0000-4000-8000-000000000001'), 0::bigint,
  'reader search does not leak v2 while it is Draft');

reset role;
update public.memberships set role = 'Contributor' where user_id = '92000000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.module_revisions where id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')), 0::bigint,
  'role revocation immediately removes successor visibility');
select throws_ok(format($sql$select public.update_contribution('module', %L, '{}')$sql$,
  (select payload->>'revision_id' from successor_results where content_type = 'module')),
  '42501', 'eligible Admin access required', 'role revocation removes successor update authority');
select throws_ok($$select public.create_successor_draft('module', '93000000-0000-4000-8000-000000000001')$$,
  '42501', 'eligible Admin access required', 'role revocation removes successor creation authority');
select throws_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from successor_results where content_type = 'module')),
  '42501', 'eligible Admin access required', 'role revocation removes successor publication authority');

reset role;
insert into public.materials(id) values ('93000000-0000-4000-8000-000000000010');
insert into public.instructors(id) values ('93000000-0000-4000-8000-000000000011');
insert into public.instructor_revisions(id, instructor_id, revision_number, status, name, published_at, submitted_at) values
  ('94000000-0000-4000-8000-000000000011', '93000000-0000-4000-8000-000000000011', 1, 'Published', 'Legado publicado', now(), null),
  ('94000000-0000-4000-8000-000000000012', '93000000-0000-4000-8000-000000000011', 2, 'Submitted', 'Legado enviado', null, now());
update public.instructors set current_published_revision_id = '94000000-0000-4000-8000-000000000011'
where id = '93000000-0000-4000-8000-000000000011';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.create_successor_draft('material', '93000000-0000-4000-8000-000000000010')$$,
  '55000', 'eligible current-published identity not found', 'identity without a current publication fails closed');
insert into successor_results values ('legacy_instructor',
  public.create_successor_draft('instructor', '93000000-0000-4000-8000-000000000011'));
select is((select payload->>'revision_number' from successor_results where content_type = 'legacy_instructor'), '3',
  'successor numbering advances beyond preserved legacy revisions');
reset role;
select is((select status::text from public.instructor_revisions where id = '94000000-0000-4000-8000-000000000012'),
  'Submitted', 'successor creation does not transform dormant historical Submitted state');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select lives_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from successor_results where content_type = 'module')),
  'successor publication succeeds');
select is((select status::text from public.module_revisions where id =
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module')),
  'Published', 'successor publication marks v2 Published');
select is((select current_published_revision_id from public.modules where id = '93000000-0000-4000-8000-000000000001'),
  (select (payload->>'revision_id')::uuid from successor_results where content_type = 'module'),
  'successor publication atomically moves the current pointer to v2');
reset role;
select is((select status::text from public.module_revisions where id = '94000000-0000-4000-8000-000000000001'),
  'Published', 'successor publication preserves v1 as Published history');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from successor_results where content_type = 'module')),
  '42501', 'active Admin Draft not found', 'stale repeated successor publication is rejected');

select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select title from public.list_published_modules() where id = '93000000-0000-4000-8000-000000000001'),
  'Módulo v2 editado por B', 'reader atomically resolves v2 after publication');
select is((select count(*) from public.search_curriculum('editado por B') where id = '93000000-0000-4000-8000-000000000001'), 1::bigint,
  'reader search finds v2 after publication');
select is((select count(*) from public.search_curriculum('Módulo v1 sucesor') where id = '93000000-0000-4000-8000-000000000001'), 0::bigint,
  'reader search no longer exposes historical v1 after publication');

reset role;
select throws_ok($$update public.module_revisions set title = 'Mutación directa' where id = '94000000-0000-4000-8000-000000000001'$$,
  '55000', 'published revisions are immutable', 'direct semantic mutation of v1 is rejected');
select throws_ok($$delete from public.module_instructors where module_revision_id = '94000000-0000-4000-8000-000000000001'$$,
  '55000', 'published revision relationships are immutable', 'direct relationship mutation of historical v1 is rejected');
select throws_ok($$insert into public.curriculum_attachments(
  id, object_name, original_filename, mime_type, size_bytes, material_revision_id,
  created_by, contributor_organization_id
) values (
  '95000000-0000-4000-8000-000000000003', '95000000-0000-4000-8000-000000000003',
  'intruso.pdf', 'application/pdf', 10, '94000000-0000-4000-8000-000000000005',
  '92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000001'
)$$, '55000', 'attachments may only be added to Drafts', 'direct attachment membership mutation of v1 is rejected');
select throws_ok($$update public.material_revisions set published_at = clock_timestamp()
  where id = '94000000-0000-4000-8000-000000000005'$$,
  '55000', 'published revisions are immutable', 'direct publication metadata mutation of v1 is rejected');

select is(extensions.dblink_connect(
  'successor_setup',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'
), 'OK', 'successor race fixture connection opens');
select is(extensions.dblink_connect(
  'successor_race_a',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'
), 'OK', 'first successor race connection opens');
select is(extensions.dblink_connect(
  'successor_race_b',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'
), 'OK', 'second successor race connection opens');

select is(extensions.dblink_exec('successor_setup', $setup$
  insert into public.organizations(id, name, is_active)
  values ('99000000-0000-4000-8000-000000000001', 'Red carrera sucesora', true);
  insert into public.organization_domains(domain, organization_id)
  values ('successor-race.test', '99000000-0000-4000-8000-000000000001');
  insert into auth.users(id, email, email_confirmed_at) values
    ('99010000-0000-4000-8000-000000000001', 'admin-a@successor-race.test', now()),
    ('99010000-0000-4000-8000-000000000002', 'admin-b@successor-race.test', now());
  insert into public.memberships(user_id, organization_id, role, is_active) values
    ('99010000-0000-4000-8000-000000000001', '99000000-0000-4000-8000-000000000001', 'Admin', true),
    ('99010000-0000-4000-8000-000000000002', '99000000-0000-4000-8000-000000000001', 'Admin', true);
  insert into public.modules(id, created_by)
  values ('99020000-0000-4000-8000-000000000001', '99010000-0000-4000-8000-000000000001');
  insert into public.module_revisions(
    id, module_id, revision_number, status, axis_id, title, description,
    created_by, contributor_organization_id, published_at
  ) values (
    '99030000-0000-4000-8000-000000000001', '99020000-0000-4000-8000-000000000001', 1, 'Published',
    'a1000000-0000-4000-8000-000000000001', 'Módulo carrera', 'Versión comprometida.',
    '99010000-0000-4000-8000-000000000001', '99000000-0000-4000-8000-000000000001', now()
  );
  update public.modules set current_published_revision_id = '99030000-0000-4000-8000-000000000001'
  where id = '99020000-0000-4000-8000-000000000001';
$setup$), 'UPDATE 1', 'committed successor race fixture is created');
select is(extensions.dblink_exec('successor_race_a', 'set role authenticated'), 'SET', 'first race session uses authenticated role');
select is(extensions.dblink_exec('successor_race_b', 'set role authenticated'), 'SET', 'second race session uses authenticated role');
select is(extensions.dblink_exec('successor_race_a',
  $claims$set request.jwt.claims = '{"sub":"99010000-0000-4000-8000-000000000001","role":"authenticated"}'$claims$),
  'SET', 'first race session receives claims');
select is(extensions.dblink_exec('successor_race_b',
  $claims$set request.jwt.claims = '{"sub":"99010000-0000-4000-8000-000000000002","role":"authenticated"}'$claims$),
  'SET', 'second race session receives claims');

create temporary table successor_race_sessions(name text primary key, pid integer);
insert into successor_race_sessions
select 'race_a', remote.pid from extensions.dblink('successor_race_a', 'select pg_backend_pid()') as remote(pid integer);
insert into successor_race_sessions
select 'race_b', remote.pid from extensions.dblink('successor_race_b', 'select pg_backend_pid()') as remote(pid integer);

savepoint successor_race_barrier;
lock table public.curriculum_lifecycle_events in access exclusive mode;
select is(extensions.dblink_send_query('successor_race_a',
  $$select public.create_successor_draft('module', '99020000-0000-4000-8000-000000000001')$$),
  1, 'first Admin session starts successor creation');
do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when exists (
      select 1 from pg_stat_activity activity
      where activity.pid = (select pid from successor_race_sessions where name = 'race_a')
        and activity.wait_event_type = 'Lock'
    );
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select ok(exists (
  select 1 from pg_stat_activity activity
  where activity.pid = (select pid from successor_race_sessions where name = 'race_a')
    and activity.wait_event_type = 'Lock'
), 'first session holds the identity lock before its transaction completes');
select is(extensions.dblink_send_query('successor_race_b',
  $$select public.create_successor_draft('module', '99020000-0000-4000-8000-000000000001')$$),
  1, 'second Admin session races successor creation');
do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when (select pid from successor_race_sessions where name = 'race_a') = any (
      pg_blocking_pids((select pid from successor_race_sessions where name = 'race_b'))
    );
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select ok(
  (select pid from successor_race_sessions where name = 'race_a') = any (
    pg_blocking_pids((select pid from successor_race_sessions where name = 'race_b'))
  ), 'second session blocks behind the first session identity lock');
select is(extensions.dblink_is_busy('successor_race_a'), 1, 'first race remains open at the test barrier');
select is(extensions.dblink_is_busy('successor_race_b'), 1, 'second race remains blocked behind the first');

rollback to savepoint successor_race_barrier;
select is(
  (select result->>'status' from extensions.dblink_get_result('successor_race_a') as remote(result jsonb)),
  'Draft', 'first concurrent successor creation commits successfully');
select is(
  (select count(*) from extensions.dblink_get_result('successor_race_b', false) as remote(result jsonb)),
  0::bigint, 'losing concurrent successor creation returns no Draft');
select ok(extensions.dblink_error_message('successor_race_b') like '%active successor Draft already exists%',
  'losing concurrent successor creation fails after the winner commits');
select is((select draft_count from extensions.dblink('successor_setup',
  $$select count(*) from public.module_revisions
    where module_id = '99020000-0000-4000-8000-000000000001' and status = 'Draft'$$
) as remote(draft_count bigint)), 1::bigint, 'the concurrent race leaves exactly one active Draft');
select is((select revision_number from extensions.dblink('successor_setup',
  $$select revision_number from public.module_revisions
    where module_id = '99020000-0000-4000-8000-000000000001' and status = 'Draft'$$
) as remote(revision_number integer)), 2, 'the concurrent winner receives revision number 2');

select is(extensions.dblink_exec('successor_setup', $cleanup$
  set session_replication_role = replica;
  delete from public.curriculum_lifecycle_events where content_id = '99020000-0000-4000-8000-000000000001';
  delete from public.module_revisions where module_id = '99020000-0000-4000-8000-000000000001';
  delete from public.modules where id = '99020000-0000-4000-8000-000000000001';
  delete from public.memberships where user_id in (
    '99010000-0000-4000-8000-000000000001', '99010000-0000-4000-8000-000000000002'
  );
  delete from public.organization_domains where domain = 'successor-race.test';
  delete from auth.users where id in (
    '99010000-0000-4000-8000-000000000001', '99010000-0000-4000-8000-000000000002'
  );
  delete from public.organizations where id = '99000000-0000-4000-8000-000000000001';
  set session_replication_role = origin;
$cleanup$), 'SET', 'committed successor race fixtures are removed');
select is(extensions.dblink_disconnect('successor_race_b'), 'OK', 'second successor race connection closes');
select is(extensions.dblink_disconnect('successor_race_a'), 'OK', 'first successor race connection closes');
select is(extensions.dblink_disconnect('successor_setup'), 'OK', 'successor race fixture connection closes');

select ok(has_function_privilege('authenticated',
  'public.create_successor_draft(public.curriculum_content_type,uuid)', 'EXECUTE'),
  'authenticated may invoke the live-Admin-gated successor operation');
select ok(not has_function_privilege('anon',
  'public.create_successor_draft(public.curriculum_content_type,uuid)', 'EXECUTE'),
  'anonymous callers cannot execute successor creation');
select is((select count(*) from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public' and procedure.proname = 'create_successor_draft'
    and procedure.prosecdef and array_to_string(procedure.proconfig, ',') like 'search_path=%'), 1::bigint,
  'successor creation is one bounded security-definer operation with an empty search path');

select * from finish();
rollback;
