begin;
create extension if not exists pgtap with schema extensions;
select plan(71);

select is((select count(*) from public.axes), 2::bigint, 'the two approved axes are persisted');

insert into public.organizations (id, name, is_active) values
  ('10000000-0000-0000-0000-000000000011', 'Red curricular', true);
insert into public.organization_domains (domain, organization_id) values
  ('curriculum.test', '10000000-0000-0000-0000-000000000011');
insert into auth.users (id, email, email_confirmed_at) values
  ('20000000-0000-0000-0000-000000000011', 'reader@curriculum.test', now()),
  ('20000000-0000-0000-0000-000000000012', 'admin@curriculum.test', now()),
  ('20000000-0000-0000-0000-000000000013', 'outsider@unknown.test', now());
insert into public.memberships (user_id, organization_id, role, is_active) values
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'Contributor', true),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000011', 'Admin', true),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000011', 'Contributor', true);

insert into public.modules (id) values
  ('30000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000002');
insert into public.module_revisions
  (id, module_id, revision_number, status, axis_id, title, theme, description, learning_outcomes, published_at)
values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 1, 'Published', 'a1000000-0000-4000-8000-000000000001', 'Versión histórica', 'Democracia', 'Representación anterior.', '{}', now()),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 2, 'Published', 'a1000000-0000-4000-8000-000000000001', 'Política pública democrática', 'Democracia', 'Herramientas para campañas y participación.', array['Comprender evidencia'], now()),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 3, 'Draft', 'a1000000-0000-4000-8000-000000000002', 'Secreto pendiente', 'Privado', 'Contenido aún no publicado.', '{}', null),
  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 1, 'Published', 'a1000000-0000-4000-8000-000000000002', 'Módulo archivado', 'Archivo', 'No debe aparecer.', '{}', now()),
  ('31000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000002', 2, 'Published', 'a1000000-0000-4000-8000-000000000002', 'Otra revisión ajena', 'Archivo', 'No debe poder apuntarse desde otra identidad.', '{}', now());
update public.modules set current_published_revision_id = '31000000-0000-4000-8000-000000000004'
where id = '30000000-0000-4000-8000-000000000002';
update public.modules set archived_at = now() where id = '30000000-0000-4000-8000-000000000002';

insert into public.program_topics (id) values ('32000000-0000-4000-8000-000000000001');
insert into public.program_topic_revisions
  (id, program_topic_id, revision_number, status, module_id, title, description, position, published_at)
values ('32100000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', 1, 'Published', '30000000-0000-4000-8000-000000000001', 'Diseño de estrategia', 'Tema de programa.', 1, now());
update public.program_topics set current_published_revision_id = '32100000-0000-4000-8000-000000000001'
where id = '32000000-0000-4000-8000-000000000001';

insert into public.instructors (id) values
  ('33000000-0000-4000-8000-000000000001'),
  ('33000000-0000-4000-8000-000000000002'),
  ('33000000-0000-4000-8000-000000000003');
insert into public.instructor_revisions
  (id, instructor_id, revision_number, status, name, role_or_title, institution, profile, thematic_axis_or_themes, country, published_at)
values
  ('33100000-0000-4000-8000-000000000001', '33000000-0000-4000-8000-000000000001', 1, 'Published', 'Ana Ejemplo', 'Especialista', 'Institución ficticia', 'Perfil representativo para pruebas.', array['Democracia'], 'Perú', now()),
  ('33100000-0000-4000-8000-000000000002', '33000000-0000-4000-8000-000000000002', 1, 'Published', 'Perfil histórico aislado', null, null, null, '{}', null, now()),
  ('33100000-0000-4000-8000-000000000003', '33000000-0000-4000-8000-000000000003', 1, 'Published', 'Perfil de borrador aislado', null, null, null, '{}', null, now());
update public.instructors set current_published_revision_id = '33100000-0000-4000-8000-000000000001'
where id = '33000000-0000-4000-8000-000000000001';
update public.instructors set current_published_revision_id = '33100000-0000-4000-8000-000000000002'
where id = '33000000-0000-4000-8000-000000000002';
update public.instructors set current_published_revision_id = '33100000-0000-4000-8000-000000000003'
where id = '33000000-0000-4000-8000-000000000003';

insert into public.materials (id) values ('35000000-0000-4000-8000-000000000001');
insert into public.material_revisions
  (id, material_id, revision_number, status, title, material_type, description, source_or_institution, source_url, country_or_scope, theme, published_at)
values ('35100000-0000-4000-8000-000000000001', '35000000-0000-4000-8000-000000000001', 1, 'Published', 'Guía de participación', 'Manual', 'Recurso ficticio de validación.', 'Centro ficticio', 'https://example.test/guia', 'Perú', 'Democracia', now());
update public.materials set current_published_revision_id = '35100000-0000-4000-8000-000000000001'
where id = '35000000-0000-4000-8000-000000000001';

insert into public.institutions (id) values ('36000000-0000-4000-8000-000000000001');
insert into public.institution_revisions
  (id, institution_id, revision_number, status, name, institution_type, country_or_scope, description, website_url, themes, published_at)
values ('36100000-0000-4000-8000-000000000001', '36000000-0000-4000-8000-000000000001', 1, 'Published', 'Centro Democrático Ficticio', 'Centro de referencia', 'Regional', 'Institución representativa para pruebas.', 'https://example.test/centro', array['Democracia'], now());
update public.institutions set current_published_revision_id = '36100000-0000-4000-8000-000000000001'
where id = '36000000-0000-4000-8000-000000000001';

insert into public.teaching_notes (id) values ('34000000-0000-4000-8000-000000000001');
insert into public.teaching_note_revisions
  (id, teaching_note_id, revision_number, status, module_id, program_topic_id, title, text, published_at)
values ('34100000-0000-4000-8000-000000000001', '34000000-0000-4000-8000-000000000001', 1, 'Published', '30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', 'Nota de facilitación', 'Nota ficticia para pruebas.', now());
insert into public.module_instructors values ('31000000-0000-4000-8000-000000000002', '33000000-0000-4000-8000-000000000001');
insert into public.module_instructors values ('31000000-0000-4000-8000-000000000001', '33000000-0000-4000-8000-000000000002');
insert into public.module_instructors values ('31000000-0000-4000-8000-000000000003', '33000000-0000-4000-8000-000000000003');
insert into public.module_materials values ('31000000-0000-4000-8000-000000000002', '35000000-0000-4000-8000-000000000001');
insert into public.module_institutions values ('31000000-0000-4000-8000-000000000002', '36000000-0000-4000-8000-000000000001');
insert into public.teaching_note_materials values ('34100000-0000-4000-8000-000000000001', '35000000-0000-4000-8000-000000000001');
update public.modules set current_published_revision_id = '31000000-0000-4000-8000-000000000002'
where id = '30000000-0000-4000-8000-000000000001';
update public.teaching_notes set current_published_revision_id = '34100000-0000-4000-8000-000000000001'
where id = '34000000-0000-4000-8000-000000000001';

select is((select count(*) from public.module_revisions where module_id = '30000000-0000-4000-8000-000000000001'), 3::bigint, 'published, historical, and future draft revisions coexist');
select is((select current_published_revision_id from public.modules where id = '30000000-0000-4000-8000-000000000001'), '31000000-0000-4000-8000-000000000002'::uuid, 'stable identity resolves one current published revision');
select throws_ok(
  $$update public.modules set current_published_revision_id = '31000000-0000-4000-8000-000000000003' where id = '30000000-0000-4000-8000-000000000001'$$,
  '23514', 'current revision must be Published', 'draft cannot become the current published pointer'
);
select throws_ok($$
  update public.modules set current_published_revision_id = '31000000-0000-4000-8000-000000000005'
  where id = '30000000-0000-4000-8000-000000000001';
  set constraints modules_current_revision_fkey immediate;
$$, '23503', 'insert or update on table "modules" violates foreign key constraint "modules_current_revision_fkey"', 'identity cannot point to another identity revision');
select throws_ok(
  $$update public.module_revisions set title = 'Mutación' where id = '31000000-0000-4000-8000-000000000002'$$,
  '55000', 'published revisions are immutable', 'published revision cannot be mutated in place'
);
select throws_ok(
  $$delete from public.module_materials where module_revision_id = '31000000-0000-4000-8000-000000000002'$$,
  '55000', 'published revision relationships are immutable', 'published revision relationships cannot be changed in place'
);
select throws_ok(
  $$update public.module_instructors set module_revision_id = '31000000-0000-4000-8000-000000000003' where module_revision_id = '31000000-0000-4000-8000-000000000002'$$,
  '55000', 'published revision relationships are immutable', 'relationship cannot be moved away from a published revision'
);
select throws_ok($$
  insert into public.teaching_notes (id) values ('34000000-0000-4000-8000-000000000099');
  insert into public.teaching_note_revisions
    (id, teaching_note_id, revision_number, status, module_id, program_topic_id, title, text, published_at)
  values ('34100000-0000-4000-8000-000000000099', '34000000-0000-4000-8000-000000000099', 1, 'Published',
    '30000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000001', 'Nota inválida', 'No debe persistir.', now());
  set constraints teaching_note_topic_module_check immediate;
$$, '23514', 'published teaching note topic must belong to its module', 'published teaching note cannot target another module topic');
select throws_ok($$
  insert into public.program_topic_revisions
    (id, program_topic_id, revision_number, status, module_id, title, position, published_at)
  values ('32100000-0000-4000-8000-000000000099', '32000000-0000-4000-8000-000000000001', 2, 'Published',
    '30000000-0000-4000-8000-000000000002', 'Tema trasladado', 1, now());
  update public.program_topics set current_published_revision_id = '32100000-0000-4000-8000-000000000099'
  where id = '32000000-0000-4000-8000-000000000001';
  set constraints program_topic_module_references_check immediate;
$$, '23514', 'published program topic must remain in the module used by teaching notes', 'topic promotion cannot invalidate published teaching-note relationships');

set local role anon;
select throws_ok('select * from public.axes', '42501', 'permission denied for table axes', 'anonymous axis read denied');
select throws_ok('select * from public.modules', '42501', 'permission denied for table modules', 'anonymous module read denied');
select throws_ok('select * from public.list_published_modules()', '42501', 'permission denied for function list_published_modules', 'anonymous listing RPC denied');
select throws_ok($$select * from public.search_curriculum('politica')$$, '42501', 'permission denied for function search_curriculum', 'anonymous search RPC denied');
select throws_ok($$select public.import_published_curriculum('{}')$$, '42501', 'permission denied for function import_published_curriculum', 'anonymous import RPC denied');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
select is((select count(*) from public.axes), 0::bigint, 'ineligible identity reads no axes');
select is((select count(*) from public.modules), 0::bigint, 'ineligible identity reads no module identities');
select is((select count(*) from public.module_revisions), 0::bigint, 'ineligible identity reads no module revisions');
select is((select count(*) from public.list_published_modules()), 0::bigint, 'ineligible identity listing is empty');
select is((select count(*) from public.search_curriculum('politica')), 0::bigint, 'ineligible identity search is empty');
select is(public.get_published_module('30000000-0000-4000-8000-000000000001'), null::jsonb, 'ineligible identity detail is empty');
select throws_ok($$select public.import_published_curriculum('{}')$$, '42501', 'permission denied for function import_published_curriculum', 'authenticated reader cannot invoke trusted import');

select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000011","role":"authenticated","user_metadata":{"role":"Admin"}}', true);
select is((select count(*) from public.axes), 2::bigint, 'eligible Contributor reads both axes');
select is((select count(*) from public.modules where id in ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002')), 1::bigint, 'eligible Contributor sees only non-archived fixture module identity');
select is((select count(*) from public.module_revisions where module_id = '30000000-0000-4000-8000-000000000001'), 1::bigint, 'eligible Contributor sees only current fixture module revision');
select is((select count(*) from public.module_revisions where id = '31000000-0000-4000-8000-000000000001'), 0::bigint, 'non-current published revision is hidden');
select is((select count(*) from public.module_revisions where id = '31000000-0000-4000-8000-000000000003'), 0::bigint, 'draft revision is hidden');
select is((select count(*) from public.modules where id = '30000000-0000-4000-8000-000000000002'), 0::bigint, 'archived module is hidden');
select is((select count(*) from public.module_revisions where id = '31000000-0000-4000-8000-000000000004'), 0::bigint, 'archived identity current revision is hidden from direct table reads');
select is(public.get_published_module('30000000-0000-4000-8000-000000000002'), null::jsonb, 'archived identity current revision is hidden from detail RPC');
select is((select count(*) from public.list_published_modules() where id = '30000000-0000-4000-8000-000000000001'), 1::bigint, 'reader listing returns the current published fixture module');
select is(public.get_published_module('30000000-0000-4000-8000-000000000001')->>'title', 'Política pública democrática', 'module detail resolves current title');
select is(jsonb_array_length(public.get_published_module('30000000-0000-4000-8000-000000000001')->'programTopics'), 1, 'module detail resolves Program Topics');
select is(jsonb_array_length(public.get_published_module('30000000-0000-4000-8000-000000000001')->'instructors'), 1, 'module detail resolves instructors');
select is(jsonb_array_length(public.get_published_module('30000000-0000-4000-8000-000000000001')->'teachingNotes'), 1, 'module detail resolves teaching notes');
select is(jsonb_array_length(public.get_published_module('30000000-0000-4000-8000-000000000001')->'teachingNotes'->0->'materials'), 1, 'teaching-note material relationship resolves in module detail');
select is(jsonb_array_length(public.get_published_module('30000000-0000-4000-8000-000000000001')->'materials'), 1, 'module detail resolves materials');
select is(jsonb_array_length(public.get_published_module('30000000-0000-4000-8000-000000000001')->'institutions'), 1, 'module detail resolves institutions');
select is((select count(*) from public.module_instructors where module_revision_id = '31000000-0000-4000-8000-000000000002'), 1::bigint, 'direct relationship read resolves only visible fixture targets');
select is((select count(*) from public.module_instructors where module_revision_id = '31000000-0000-4000-8000-000000000001'), 0::bigint, 'historical revision relationship is hidden');
select is((select count(*) from public.module_instructors where module_revision_id = '31000000-0000-4000-8000-000000000003'), 0::bigint, 'draft revision relationship is hidden');
select is((select count(*) from public.search_curriculum('politica') where entity_type = 'module'), 1::bigint, 'accentless query finds accented Spanish module text');
select is((select count(*) from public.search_curriculum('política') where entity_type = 'module'), 1::bigint, 'accented query finds accented Spanish module text');
select is((select count(*) from public.search_curriculum('secreto')), 0::bigint, 'search excludes draft text');
select is((select count(*) from public.search_curriculum('historica')), 0::bigint, 'search excludes non-current revision text');
select is((select count(*) from public.search_curriculum('archivado')), 0::bigint, 'search excludes archived content');
select is((select count(*) from public.list_published_modules(axis_filter => 'a1000000-0000-4000-8000-000000000001') where id = '30000000-0000-4000-8000-000000000001'), 1::bigint, 'axis filter uses persisted module axis');
select is((select count(*) from public.list_published_modules(axis_filter => 'a1000000-0000-4000-8000-000000000002')), 0::bigint, 'different persisted axis filters module out');
select is((select count(*) from public.list_published_modules(theme_filter => 'democracia')), 1::bigint, 'module theme filter uses persisted theme');
select is((select count(*) from public.search_curriculum(entity_filter => 'material', country_filter => 'peru')), 1::bigint, 'material country filter is accent insensitive');
select is((select count(*) from public.search_curriculum(entity_filter => 'institution', theme_filter => 'democracia')), 1::bigint, 'institution theme filter uses persisted themes');
select is((select count(*) from public.search_curriculum(entity_filter => 'reference') where id in ('35000000-0000-4000-8000-000000000001', '36000000-0000-4000-8000-000000000001')), 2::bigint, 'fixture materials and institutions are first-class references');
select is(public.get_published_reference('material', '35000000-0000-4000-8000-000000000001')->>'title', 'Guía de participación', 'reference detail resolves a published material');
select is(public.get_published_reference('institution', '36000000-0000-4000-8000-000000000001')->>'title', 'Centro Democrático Ficticio', 'reference detail resolves a published institution');
select throws_ok(
  $$insert into public.modules (id) values ('30000000-0000-4000-8000-000000000099')$$,
  '42501', 'permission denied for table modules', 'Contributor cannot write curriculum through direct access'
);

reset role;
update public.memberships set is_active = false where user_id = '20000000-0000-0000-0000-000000000011';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select is((select count(*) from public.list_published_modules()), 0::bigint, 'membership deactivation immediately revokes curriculum visibility');
reset role;
update public.memberships set is_active = true where user_id = '20000000-0000-0000-0000-000000000011';
update public.organizations set is_active = false where id = '10000000-0000-0000-0000-000000000011';
set local role authenticated;
select is((select count(*) from public.list_published_modules()), 0::bigint, 'organization deactivation immediately revokes curriculum visibility');
reset role;
update public.organizations set is_active = true where id = '10000000-0000-0000-0000-000000000011';
delete from public.organization_domains where domain = 'curriculum.test';
set local role authenticated;
select is((select count(*) from public.list_published_modules()), 0::bigint, 'approved domain revocation immediately revokes curriculum visibility');
reset role;
insert into public.organization_domains (domain, organization_id)
values ('curriculum.test', '10000000-0000-0000-0000-000000000011');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select is((select count(*) from public.modules where id in ('30000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002')), 1::bigint, 'eligible Admin sees the same published fixture module count');
select is((select count(*) from public.search_curriculum() where id in ('30000000-0000-4000-8000-000000000001', '35000000-0000-4000-8000-000000000001', '36000000-0000-4000-8000-000000000001')), 3::bigint, 'eligible Admin sees the same fixture module and reference search set');
select is((select count(*) from public.module_revisions where id = '31000000-0000-4000-8000-000000000003'), 0::bigint, 'Admin receives no draft visibility in SPEC-002');
select is((select count(*) from public.modules where id = '30000000-0000-4000-8000-000000000002'), 0::bigint, 'Admin receives no archived visibility in SPEC-002');
select is((select count(*) from public.module_materials where module_revision_id = '31000000-0000-4000-8000-000000000002'), 1::bigint, 'Admin and Contributor have equivalent fixture relationship visibility');

reset role;
select is((select count(*) from (values
  ('anon'), ('authenticated'), ('service_role')
) denied(role_name) cross join unnest(array[
  'private.enforce_current_published_revision()'::regprocedure,
  'private.enforce_teaching_note_topic_module()'::regprocedure,
  'private.enforce_program_topic_module_references()'::regprocedure,
  'private.preserve_published_revision()'::regprocedure,
  'private.preserve_published_relationship()'::regprocedure
]) as functions(function_oid) where has_function_privilege(denied.role_name, functions.function_oid, 'EXECUTE')), 0::bigint, 'private trigger functions are not directly executable by API roles');
set local role service_role;
select is(
  (public.import_published_curriculum('{"version":1,"axes":[{"id":"a1000000-0000-4000-8000-000000000001","name":"Strategy & Campaign","display_order":1,"is_active":true},{"id":"a1000000-0000-4000-8000-000000000002","name":"Evidence-based Public Policy","display_order":2,"is_active":true}],"identities":{"modules":[],"program_topics":[],"instructors":[],"teaching_notes":[],"materials":[],"institutions":[]},"revisions":{"module_revisions":[],"program_topic_revisions":[],"instructor_revisions":[],"teaching_note_revisions":[],"material_revisions":[],"institution_revisions":[]},"relationships":{"module_instructors":[],"module_materials":[],"module_institutions":[],"teaching_note_materials":[]}}'))->>'unchanged',
  '2', 'trusted import is idempotent for approved axes'
);
select throws_ok(
  $$select public.import_published_curriculum('{"version":1,"axes":[{"id":"a1000000-0000-4000-8000-000000000099","name":"Temporary axis","display_order":99,"is_active":true},{"id":"a1000000-0000-4000-8000-000000000001","name":"Drifted axis","display_order":1,"is_active":true}],"identities":{"modules":[],"program_topics":[],"instructors":[],"teaching_notes":[],"materials":[],"institutions":[]},"revisions":{"module_revisions":[],"program_topic_revisions":[],"instructor_revisions":[],"teaching_note_revisions":[],"material_revisions":[],"institution_revisions":[]},"relationships":{"module_instructors":[],"module_materials":[],"module_institutions":[],"teaching_note_materials":[]}}')$$,
  '23505', 'axes stable row has different name', 'trusted import rejects stable-ID drift'
);
reset role;
select is((select count(*) from public.axes where id = 'a1000000-0000-4000-8000-000000000099'), 0::bigint, 'failed import rolls back earlier rows atomically');
select is((select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in (
    'axes', 'modules', 'module_revisions', 'program_topics', 'program_topic_revisions',
    'instructors', 'instructor_revisions', 'teaching_notes', 'teaching_note_revisions',
    'materials', 'material_revisions', 'institutions', 'institution_revisions',
    'module_instructors', 'module_materials', 'module_institutions', 'teaching_note_materials'
  ) and c.relrowsecurity), 17::bigint, 'all curriculum and relationship tables have RLS enabled');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename in (
  'axes', 'modules', 'module_revisions', 'program_topics', 'program_topic_revisions',
  'instructors', 'instructor_revisions', 'teaching_notes', 'teaching_note_revisions',
  'materials', 'material_revisions', 'institutions', 'institution_revisions',
  'module_instructors', 'module_materials', 'module_institutions', 'teaching_note_materials'
) and cmd <> 'SELECT'), 0::bigint, 'curriculum has no ordinary write policies');
select is((select count(*) from pg_proc where oid in (
  'public.list_published_modules(text,uuid,text)'::regprocedure,
  'public.get_published_module(uuid)'::regprocedure,
  'public.search_curriculum(text,text,uuid,text,text)'::regprocedure,
  'public.get_published_reference(text,uuid)'::regprocedure
) and not prosecdef), 4::bigint, 'all reader RPCs use invoker security');
select is((select count(*) from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public' and table_name = 'modules'), 0::bigint, 'anonymous role has no curriculum table grant');

select * from finish();
rollback;
