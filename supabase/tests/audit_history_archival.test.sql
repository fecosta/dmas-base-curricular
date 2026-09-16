begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
select no_plan();

insert into public.organizations(id, name, is_active)
values ('b1000000-0000-4000-8000-000000000001', 'Red de archivo', true);
insert into public.organization_domains(domain, organization_id)
values ('archive.test', 'b1000000-0000-4000-8000-000000000001');
insert into auth.users(id, email, email_confirmed_at) values
  ('b2000000-0000-4000-8000-000000000001', 'admin-a@archive.test', now()),
  ('b2000000-0000-4000-8000-000000000002', 'admin-b@archive.test', now()),
  ('b2000000-0000-4000-8000-000000000003', 'reader@archive.test', now()),
  ('b2000000-0000-4000-8000-000000000004', 'revoked@archive.test', now());
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Admin', true),
  ('b2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'Admin', true),
  ('b2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'Contributor', true),
  ('b2000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000001', 'Admin', true);

-- One complete current-published graph covers every reverse dependency edge.
insert into public.modules(id, created_by) values
  ('b3000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001'),
  ('b3000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001'),
  ('b3000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000001');
insert into public.module_revisions(
  id, module_id, revision_number, status, axis_id, title, description,
  created_by, contributor_organization_id, published_at
) values
  ('b3100000-0000-4000-8000-000000000001', 'b3000000-0000-4000-8000-000000000001', 1, 'Published',
   'a1000000-0000-4000-8000-000000000001', 'Módulo principal', 'Grafo vigente.',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b3100000-0000-4000-8000-000000000002', 'b3000000-0000-4000-8000-000000000002', 1, 'Published',
   'a1000000-0000-4000-8000-000000000001', 'Módulo restaurable', 'Dependencia restaurable.',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b3100000-0000-4000-8000-000000000003', 'b3000000-0000-4000-8000-000000000003', 1, 'Published',
   'a1000000-0000-4000-8000-000000000001', 'Módulo histórico', 'Relación histórica.',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now());
update public.modules identity set current_published_revision_id = revision.id
from public.module_revisions revision where revision.module_id = identity.id;

insert into public.program_topics(id, created_by)
values ('b4000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001');
insert into public.program_topic_revisions(
  id, program_topic_id, revision_number, status, module_id, title,
  created_by, contributor_organization_id, published_at
) values (
  'b4100000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 1, 'Published',
  'b3000000-0000-4000-8000-000000000001', 'Tema vigente',
  'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()
);
update public.program_topics set current_published_revision_id = 'b4100000-0000-4000-8000-000000000001'
where id = 'b4000000-0000-4000-8000-000000000001';

insert into public.instructors(id, created_by) values
  ('b5000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001'),
  ('b5000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001');
insert into public.instructor_revisions(
  id, instructor_id, revision_number, status, name, created_by, contributor_organization_id, published_at
) values
  ('b5100000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000001', 1, 'Published', 'Docente vigente',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b5100000-0000-4000-8000-000000000002', 'b5000000-0000-4000-8000-000000000002', 1, 'Published', 'Docente histórico',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now());
update public.instructors identity set current_published_revision_id = revision.id
from public.instructor_revisions revision where revision.instructor_id = identity.id;

insert into public.materials(id, created_by) values
  ('b6000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001'),
  ('b6000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001'),
  ('b6000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000001'),
  ('b6000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000001'),
  ('b6000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000001'),
  ('b6000000-0000-4000-8000-000000000006', 'b2000000-0000-4000-8000-000000000001');
insert into public.material_revisions(
  id, material_id, revision_number, status, title, material_type,
  created_by, contributor_organization_id, published_at
) values
  ('b6100000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001', 1, 'Published', 'Material vigente', 'Informe',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b6100000-0000-4000-8000-000000000002', 'b6000000-0000-4000-8000-000000000002', 1, 'Published', 'Material adjunto', 'Informe',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b6100000-0000-4000-8000-000000000003', 'b6000000-0000-4000-8000-000000000003', 1, 'Published', 'Material histórico', 'Informe',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b6100000-0000-4000-8000-000000000004', 'b6000000-0000-4000-8000-000000000004', 1, 'Draft', 'Material sin publicar', 'Informe',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', null),
  ('b6100000-0000-4000-8000-000000000005', 'b6000000-0000-4000-8000-000000000005', 1, 'Published', 'Material sólo módulo', 'Informe',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b6100000-0000-4000-8000-000000000006', 'b6000000-0000-4000-8000-000000000006', 1, 'Published', 'Material sólo nota', 'Informe',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now());
update public.materials identity set current_published_revision_id = revision.id
from public.material_revisions revision
where revision.material_id = identity.id and revision.status = 'Published';

insert into public.institutions(id, created_by)
values ('b7000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001');
insert into public.institution_revisions(
  id, institution_id, revision_number, status, name, institution_type,
  created_by, contributor_organization_id, published_at
) values (
  'b7100000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001', 1, 'Published',
  'Institución vigente', 'Centro', 'b2000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000001', now()
);
update public.institutions set current_published_revision_id = 'b7100000-0000-4000-8000-000000000001'
where id = 'b7000000-0000-4000-8000-000000000001';

insert into public.teaching_notes(id, created_by) values
  ('b8000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001'),
  ('b8000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001');
insert into public.teaching_note_revisions(
  id, teaching_note_id, revision_number, status, module_id, program_topic_id,
  title, text, created_by, contributor_organization_id, published_at
) values
  ('b8100000-0000-4000-8000-000000000001', 'b8000000-0000-4000-8000-000000000001', 1, 'Published',
   'b3000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000001', 'Nota vigente', 'Texto.',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now()),
  ('b8100000-0000-4000-8000-000000000002', 'b8000000-0000-4000-8000-000000000002', 1, 'Published',
   'b3000000-0000-4000-8000-000000000002', null, 'Nota restaurable', 'Texto.',
   'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', now());
update public.teaching_notes identity set current_published_revision_id = revision.id
from public.teaching_note_revisions revision where revision.teaching_note_id = identity.id;

set local session_replication_role = replica;
insert into public.module_instructors values
  ('b3100000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000001'),
  ('b3100000-0000-4000-8000-000000000003', 'b5000000-0000-4000-8000-000000000002');
insert into public.module_materials values
  ('b3100000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001'),
  ('b3100000-0000-4000-8000-000000000003', 'b6000000-0000-4000-8000-000000000003'),
  ('b3100000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000005');
insert into public.module_institutions values
  ('b3100000-0000-4000-8000-000000000001', 'b7000000-0000-4000-8000-000000000001');
insert into public.teaching_note_materials values
  ('b8100000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000001'),
  ('b8100000-0000-4000-8000-000000000001', 'b6000000-0000-4000-8000-000000000006');
set local session_replication_role = origin;

-- Only relationships on an active identity's exact current revision block.
update public.modules set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b3000000-0000-4000-8000-000000000003';

set local session_replication_role = replica;
insert into public.curriculum_attachments(
  id, object_name, original_filename, mime_type, size_bytes,
  teaching_note_revision_id, material_revision_id, created_by, contributor_organization_id, state
) values
  ('ba000000-0000-4000-8000-000000000001', 'ba000000-0000-4000-8000-000000000001', 'nota.pdf', 'application/pdf', 100,
   'b8100000-0000-4000-8000-000000000002', null, 'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Ready'),
  ('ba000000-0000-4000-8000-000000000002', 'ba000000-0000-4000-8000-000000000002', 'material.pdf', 'application/pdf', 101,
   null, 'b6100000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Ready');
set local session_replication_role = origin;
insert into storage.objects(id, bucket_id, name, metadata) values
  (gen_random_uuid(), 'governed-attachments', 'ba000000-0000-4000-8000-000000000001', '{"size":100,"mimetype":"application/pdf"}'),
  (gen_random_uuid(), 'governed-attachments', 'ba000000-0000-4000-8000-000000000002', '{"size":101,"mimetype":"application/pdf"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok($$select public.archive_governed_content('material', 'b6000000-0000-4000-8000-000000000002')$$,
  '42501', 'eligible Admin access required', 'non-Admin direct RPC archival is denied');
select throws_ok($$select * from public.list_curriculum_lifecycle_history()$$,
  '42501', 'eligible Admin access required', 'non-Admin history access is denied');
select throws_ok($$select count(*) from public.curriculum_lifecycle_events$$,
  '42501', 'permission denied for table curriculum_lifecycle_events', 'direct lifecycle-table reads are unavailable');

select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.archive_governed_content('material', 'b6000000-0000-4000-8000-000000000004')$$,
  '55000', 'authoritative current-published revision not found', 'identity without a current Published revision cannot archive');
select throws_ok($$select public.archive_governed_content('module', 'b3000000-0000-4000-8000-000000000001')$$,
  '23514', 'active current-published dependents block archival', 'Program Topic and Teaching Note block Module archival');
select throws_ok($$select public.archive_governed_content('program_topic', 'b4000000-0000-4000-8000-000000000001')$$,
  '23514', 'active current-published dependents block archival', 'Teaching Note blocks Program Topic archival');
select throws_ok($$select public.archive_governed_content('instructor', 'b5000000-0000-4000-8000-000000000001')$$,
  '23514', 'active current-published dependents block archival', 'current Module blocks Instructor archival');
select throws_ok($$select public.archive_governed_content('material', 'b6000000-0000-4000-8000-000000000001')$$,
  '23514', 'active current-published dependents block archival', 'current Module and Teaching Note block Material archival');
select throws_ok($$select public.archive_governed_content('material', 'b6000000-0000-4000-8000-000000000005')$$,
  '23514', 'active current-published dependents block archival', 'current Module alone blocks Material archival');
select throws_ok($$select public.archive_governed_content('material', 'b6000000-0000-4000-8000-000000000006')$$,
  '23514', 'active current-published dependents block archival', 'current Teaching Note alone blocks Material archival');
select throws_ok($$select public.archive_governed_content('institution', 'b7000000-0000-4000-8000-000000000001')$$,
  '23514', 'active current-published dependents block archival', 'current Module blocks Institution archival');
select is((select count(*) from public.list_curriculum_lifecycle_history(
  content_id_filter => 'b6000000-0000-4000-8000-000000000001', action_filter => 'content_archived')), 0::bigint,
  'dependency failures append no successful archival event');

select lives_ok($$select public.archive_governed_content('instructor', 'b5000000-0000-4000-8000-000000000002')$$,
  'historical relationships and archived dependents do not falsely block archival');
reset role;
select is((select current_published_revision_id from public.instructors where id = 'b5000000-0000-4000-8000-000000000002'),
  'b5100000-0000-4000-8000-000000000002'::uuid, 'archive preserves the current-published pointer');
select is((select status::text from public.instructor_revisions where id = 'b5100000-0000-4000-8000-000000000002'),
  'Published', 'archive preserves Published revision status');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.list_curriculum_lifecycle_history(
  content_id_filter => 'b5000000-0000-4000-8000-000000000002', action_filter => 'content_archived')
  where actor_user_id = 'b2000000-0000-4000-8000-000000000001'
    and actor_organization_id = 'b1000000-0000-4000-8000-000000000001'
    and revision_id = 'b5100000-0000-4000-8000-000000000002'
    and previous_status is null and resulting_status is null), 1::bigint,
  'archive appends one trusted identity event without a revision transition');
select throws_ok($$select public.archive_governed_content('instructor', 'b5000000-0000-4000-8000-000000000002')$$,
  '55000', 'governed content is already archived', 'already archived content is rejected');

select lives_ok($$select public.create_successor_draft('material', 'b6000000-0000-4000-8000-000000000002')$$,
  'Admin creates an active successor Draft');
select throws_ok($$select public.archive_governed_content('material', 'b6000000-0000-4000-8000-000000000002')$$,
  '55000', 'active Draft blocks archival', 'active Draft blocks archival atomically');
select is((select count(*) from public.material_revisions where material_id = 'b6000000-0000-4000-8000-000000000002' and status = 'Draft'),
  1::bigint, 'failed archive preserves the active Draft');
select is((select count(*) from public.list_curriculum_lifecycle_history(
  content_id_filter => 'b6000000-0000-4000-8000-000000000002', action_filter => 'content_archived')), 0::bigint,
  'active-Draft failure appends no archive event');

-- Cross-Admin archive and restore preserve bytes and govern reader access.
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok($$select public.archive_governed_content('module', 'b3000000-0000-4000-8000-000000000002')$$,
  '23514', 'active current-published dependents block archival', 'current Teaching Note alone blocks Module archival');
select lives_ok($$select public.archive_governed_content('teaching_note', 'b8000000-0000-4000-8000-000000000002')$$,
  'second eligible Admin can archive content created by another Admin');
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments where id = 'ba000000-0000-4000-8000-000000000001'), 0::bigint,
  'reader cannot access archived Teaching Note attachment metadata');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments' and name = 'ba000000-0000-4000-8000-000000000001'), 0::bigint,
  'reader cannot access archived Teaching Note attachment bytes by known path');

reset role;
select is((select count(*) from public.curriculum_attachments where id = 'ba000000-0000-4000-8000-000000000001'), 1::bigint,
  'archive preserves attachment metadata');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments' and name = 'ba000000-0000-4000-8000-000000000001'), 1::bigint,
  'archive preserves private Storage objects');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.archive_governed_content('module', 'b3000000-0000-4000-8000-000000000002')$$,
  'Module can archive after its only active dependent is archived');
select throws_ok($$select public.restore_governed_content('teaching_note', 'b8000000-0000-4000-8000-000000000002')$$,
  '23514', 'Teaching Note requires a current-published Module', 'restore revalidates current-published dependencies');
select is((select count(*) from public.list_curriculum_lifecycle_history(
  content_id_filter => 'b8000000-0000-4000-8000-000000000002', action_filter => 'content_restored')), 0::bigint,
  'failed restore appends no restoration event');
select lives_ok($$select public.restore_governed_content('module', 'b3000000-0000-4000-8000-000000000002')$$,
  'dependency Module restores');
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select lives_ok($$select public.restore_governed_content('teaching_note', 'b8000000-0000-4000-8000-000000000002')$$,
  'different eligible Admin restores after dependencies become valid');
select is((select count(*) from public.teaching_note_revisions where teaching_note_id = 'b8000000-0000-4000-8000-000000000002'),
  1::bigint, 'restore creates no semantic revision');
select is((select status::text from public.teaching_note_revisions where id = 'b8100000-0000-4000-8000-000000000002'),
  'Published', 'restore does not mutate the Published revision');

select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments where id = 'ba000000-0000-4000-8000-000000000001'), 1::bigint,
  'valid restore makes the Ready current-published attachment readable again');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments' and name = 'ba000000-0000-4000-8000-000000000001'), 1::bigint,
  'valid restore makes the authorized private object readable again');

-- Restore applies every outgoing current-published dependency contract.
reset role;
update public.program_topics set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b4000000-0000-4000-8000-000000000001';
update public.modules set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b3000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.restore_governed_content('program_topic', 'b4000000-0000-4000-8000-000000000001')$$,
  '23514', 'Program Topic requires a current-published Module', 'Program Topic restore revalidates its Module');
reset role;
update public.program_topics set archived_at = null, archived_by = null where id = 'b4000000-0000-4000-8000-000000000001';
update public.modules set archived_at = null, archived_by = null where id = 'b3000000-0000-4000-8000-000000000001';

update public.modules set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b3000000-0000-4000-8000-000000000001';
update public.instructors set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b5000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.restore_governed_content('module', 'b3000000-0000-4000-8000-000000000001')$$,
  '23514', 'Module requires current-published Instructors', 'Module restore revalidates Instructors');
reset role;
update public.instructors set archived_at = null, archived_by = null where id = 'b5000000-0000-4000-8000-000000000001';
update public.materials set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b6000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.restore_governed_content('module', 'b3000000-0000-4000-8000-000000000001')$$,
  '23514', 'Module requires current-published Materials', 'Module restore revalidates Materials');
reset role;
update public.materials set archived_at = null, archived_by = null where id = 'b6000000-0000-4000-8000-000000000001';
update public.institutions set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b7000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.restore_governed_content('module', 'b3000000-0000-4000-8000-000000000001')$$,
  '23514', 'Module requires current-published Institutions', 'Module restore revalidates Institutions');
reset role;
update public.institutions set archived_at = null, archived_by = null where id = 'b7000000-0000-4000-8000-000000000001';
update public.modules set archived_at = null, archived_by = null where id = 'b3000000-0000-4000-8000-000000000001';

update public.teaching_notes set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b8000000-0000-4000-8000-000000000001';
update public.program_topics set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b4000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.restore_governed_content('teaching_note', 'b8000000-0000-4000-8000-000000000001')$$,
  '23514', 'Teaching Note requires a current-published Program Topic', 'Teaching Note restore revalidates Program Topic');
reset role;
update public.program_topics set archived_at = null, archived_by = null where id = 'b4000000-0000-4000-8000-000000000001';
update public.materials set archived_at = now(), archived_by = 'b2000000-0000-4000-8000-000000000001'
where id = 'b6000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.restore_governed_content('teaching_note', 'b8000000-0000-4000-8000-000000000001')$$,
  '23514', 'Teaching Note requires current-published Materials', 'Teaching Note restore revalidates Materials');
reset role;
update public.materials set archived_at = null, archived_by = null where id = 'b6000000-0000-4000-8000-000000000001';
update public.teaching_notes set archived_at = null, archived_by = null where id = 'b8000000-0000-4000-8000-000000000001';

reset role;
update public.memberships set role = 'Contributor' where user_id = 'b2000000-0000-4000-8000-000000000004';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select throws_ok($$select public.archive_governed_content('material', 'b6000000-0000-4000-8000-000000000003')$$,
  '42501', 'eligible Admin access required', 'live role revocation removes archive authority');
select throws_ok($$select * from public.list_curriculum_lifecycle_history()$$,
  '42501', 'eligible Admin access required', 'live role revocation removes history authority');

reset role;

-- Archive and successor creation serialize on the same stable identity lock.
select is(extensions.dblink_connect('archive_setup',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'),
  'OK', 'archive race fixture connection opens');
select is(extensions.dblink_connect('archive_race',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'),
  'OK', 'archive race connection opens');
select is(extensions.dblink_connect('successor_race',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'),
  'OK', 'successor race connection opens');
select is(extensions.dblink_exec('archive_setup', $setup$
  insert into public.organizations(id, name, is_active)
  values ('c1000000-0000-4000-8000-000000000001', 'Red carrera archivo', true);
  insert into public.organization_domains(domain, organization_id)
  values ('archive-race.test', 'c1000000-0000-4000-8000-000000000001');
  insert into auth.users(id, email, email_confirmed_at)
  values ('c2000000-0000-4000-8000-000000000001', 'admin@archive-race.test', now());
  insert into public.memberships(user_id, organization_id, role, is_active)
  values ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Admin', true);
  insert into public.instructors(id, created_by)
  values ('c4000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001');
  insert into public.instructor_revisions(
    id, instructor_id, revision_number, status, name, created_by, contributor_organization_id, published_at
  ) values (
    'c4100000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', 1, 'Published',
    'Docente carrera restauración', 'c2000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001', now()
  );
  update public.instructors set current_published_revision_id = 'c4100000-0000-4000-8000-000000000001'
  where id = 'c4000000-0000-4000-8000-000000000001';
  insert into public.modules(id, created_by)
  values ('c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001');
  insert into public.module_revisions(
    id, module_id, revision_number, status, axis_id, title, description,
    created_by, contributor_organization_id, published_at
  ) values (
    'c3100000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 1, 'Published',
    'a1000000-0000-4000-8000-000000000001', 'Módulo carrera archivo', 'Prueba concurrente.',
    'c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', now()
  );
  update public.modules set current_published_revision_id = 'c3100000-0000-4000-8000-000000000001'
  where id = 'c3000000-0000-4000-8000-000000000001';
  set session_replication_role = replica;
  insert into public.module_instructors(module_revision_id, instructor_id)
  values ('c3100000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001');
  set session_replication_role = origin;
$setup$), 'SET', 'committed archive race fixture is created');
select is(extensions.dblink_exec('archive_race', 'set role authenticated'), 'SET',
  'archive race session uses authenticated role');
select is(extensions.dblink_exec('successor_race', 'set role authenticated'), 'SET',
  'successor race session uses authenticated role');
select is(extensions.dblink_exec('archive_race',
  $claims$set request.jwt.claims = '{"sub":"c2000000-0000-4000-8000-000000000001","role":"authenticated"}'$claims$),
  'SET', 'archive race session receives claims');
select is(extensions.dblink_exec('successor_race',
  $claims$set request.jwt.claims = '{"sub":"c2000000-0000-4000-8000-000000000001","role":"authenticated"}'$claims$),
  'SET', 'successor race session receives claims');

create temporary table archive_race_sessions(name text primary key, pid integer);
insert into archive_race_sessions
select 'archive', remote.pid from extensions.dblink('archive_race', 'select pg_backend_pid()') as remote(pid integer);
insert into archive_race_sessions
select 'successor', remote.pid from extensions.dblink('successor_race', 'select pg_backend_pid()') as remote(pid integer);

savepoint archive_successor_barrier;
lock table public.curriculum_lifecycle_events in access exclusive mode;
select is(extensions.dblink_send_query('archive_race',
  $$select public.archive_governed_content('module', 'c3000000-0000-4000-8000-000000000001')$$),
  1, 'archive starts in a separate transaction');
do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when exists (select 1 from pg_stat_activity
      where pid = (select pid from archive_race_sessions where name = 'archive') and wait_event_type = 'Lock');
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select ok(exists (select 1 from pg_stat_activity
  where pid = (select pid from archive_race_sessions where name = 'archive') and wait_event_type = 'Lock'),
  'archive holds the identity lock before its event write completes');
select is(extensions.dblink_send_query('successor_race',
  $$select public.create_successor_draft('module', 'c3000000-0000-4000-8000-000000000001')$$),
  1, 'successor creation races archival');
do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when (select pid from archive_race_sessions where name = 'archive') = any (
      pg_blocking_pids((select pid from archive_race_sessions where name = 'successor')));
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select ok((select pid from archive_race_sessions where name = 'archive') = any (
  pg_blocking_pids((select pid from archive_race_sessions where name = 'successor'))),
  'successor creation blocks behind archival on the identity row');
rollback to savepoint archive_successor_barrier;
select is((select result->>'content_id' from extensions.dblink_get_result('archive_race') as remote(result jsonb)),
  'c3000000-0000-4000-8000-000000000001', 'concurrent archive commits');
select is((select count(*) from extensions.dblink_get_result('successor_race', false) as remote(result jsonb)),
  0::bigint, 'successor creation cannot strand a Draft after archival');
select ok(extensions.dblink_error_message('successor_race') like '%eligible current-published identity not found%',
  'serialized successor creation observes archived identity state');
select ok((select archived_at is not null from extensions.dblink('archive_setup',
  $$select archived_at from public.modules where id = 'c3000000-0000-4000-8000-000000000001'$$
  ) as remote(archived_at timestamptz)), 'archive race leaves the stable identity archived');
select is((select draft_count from extensions.dblink('archive_setup',
  $$select count(*) from public.module_revisions
    where module_id = 'c3000000-0000-4000-8000-000000000001' and status = 'Draft'$$
  ) as remote(draft_count bigint)), 0::bigint, 'archive race leaves no active Draft');

select is(extensions.dblink_disconnect('successor_race'), 'OK',
  'completed successor race connection closes before the restore race');
select is(extensions.dblink_disconnect('archive_race'), 'OK',
  'completed archive race connection closes before the restore race');
select is(extensions.dblink_connect('archive_race',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'),
  'OK', 'restore race connection opens');
select is(extensions.dblink_connect('successor_race',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'),
  'OK', 'dependency archive race connection opens');
select is(extensions.dblink_exec('archive_race', 'set role authenticated'), 'SET',
  'restore race session uses authenticated role');
select is(extensions.dblink_exec('successor_race', 'set role authenticated'), 'SET',
  'dependency archive session uses authenticated role');
select is(extensions.dblink_exec('archive_race',
  $claims$set request.jwt.claims = '{"sub":"c2000000-0000-4000-8000-000000000001","role":"authenticated"}'$claims$),
  'SET', 'restore race session receives claims');
select is(extensions.dblink_exec('successor_race',
  $claims$set request.jwt.claims = '{"sub":"c2000000-0000-4000-8000-000000000001","role":"authenticated"}'$claims$),
  'SET', 'dependency archive session receives claims');
update archive_race_sessions set pid = remote.pid
from extensions.dblink('archive_race', 'select pg_backend_pid()') as remote(pid integer)
where name = 'archive';
update archive_race_sessions set pid = remote.pid
from extensions.dblink('successor_race', 'select pg_backend_pid()') as remote(pid integer)
where name = 'successor';

savepoint restore_dependency_barrier;
lock table public.curriculum_lifecycle_events in access exclusive mode;
select is(extensions.dblink_send_query('archive_race',
  $$select public.restore_governed_content('module', 'c3000000-0000-4000-8000-000000000001')$$),
  1, 'restore starts in a separate transaction');
do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when exists (select 1 from pg_stat_activity
      where pid = (select pid from archive_race_sessions where name = 'archive') and wait_event_type = 'Lock');
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select is(extensions.dblink_is_busy('archive_race'), 1,
  'restore remains open while retaining its dependency share lock');
select is(extensions.dblink_send_query('successor_race',
  $$select public.archive_governed_content('instructor', 'c4000000-0000-4000-8000-000000000001')$$),
  1, 'dependency archival races restoration');
do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when (select pid from archive_race_sessions where name = 'archive') = any (
      pg_blocking_pids((select pid from archive_race_sessions where name = 'successor')));
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select ok((select pid from archive_race_sessions where name = 'archive') = any (
  pg_blocking_pids((select pid from archive_race_sessions where name = 'successor'))),
  'dependency archival blocks behind restore dependency validation');
rollback to savepoint restore_dependency_barrier;
select is((select result->>'content_id' from extensions.dblink_get_result('archive_race') as remote(result jsonb)),
  'c3000000-0000-4000-8000-000000000001', 'concurrent restore commits');
select is((select count(*) from extensions.dblink_get_result('successor_race', false) as remote(result jsonb)),
  0::bigint, 'dependency archival cannot invalidate the restored representation');
select ok(extensions.dblink_error_message('successor_race') like '%active current-published dependents block archival%',
  'serialized dependency archival observes the restored Module');
select ok((select archived_at is null from extensions.dblink('archive_setup',
  $$select archived_at from public.modules where id = 'c3000000-0000-4000-8000-000000000001'$$
  ) as remote(archived_at timestamptz)), 'restore race leaves the Module active');
select ok((select archived_at is null from extensions.dblink('archive_setup',
  $$select archived_at from public.instructors where id = 'c4000000-0000-4000-8000-000000000001'$$
  ) as remote(archived_at timestamptz)), 'restore race leaves its dependency active');
select is(extensions.dblink_exec('archive_setup', $cleanup$
  set session_replication_role = replica;
  delete from public.curriculum_lifecycle_events where content_id = 'c3000000-0000-4000-8000-000000000001';
  delete from public.module_instructors where module_revision_id = 'c3100000-0000-4000-8000-000000000001';
  delete from public.module_revisions where module_id = 'c3000000-0000-4000-8000-000000000001';
  delete from public.modules where id = 'c3000000-0000-4000-8000-000000000001';
  delete from public.instructor_revisions where instructor_id = 'c4000000-0000-4000-8000-000000000001';
  delete from public.instructors where id = 'c4000000-0000-4000-8000-000000000001';
  delete from public.memberships where user_id = 'c2000000-0000-4000-8000-000000000001';
  delete from public.organization_domains where domain = 'archive-race.test';
  delete from auth.users where id = 'c2000000-0000-4000-8000-000000000001';
  delete from public.organizations where id = 'c1000000-0000-4000-8000-000000000001';
  set session_replication_role = origin;
$cleanup$), 'SET', 'committed archive race fixtures are removed');
select is(extensions.dblink_disconnect('successor_race'), 'OK', 'successor race connection closes');
select is(extensions.dblink_disconnect('archive_race'), 'OK', 'archive race connection closes');
select is(extensions.dblink_disconnect('archive_setup'), 'OK', 'archive fixture connection closes');

select throws_ok($$update public.curriculum_lifecycle_events set action = 'revision_edited'$$,
  '55000', 'lifecycle events are append-only', 'lifecycle history remains update-proof');
select throws_ok($$delete from public.curriculum_lifecycle_events$$,
  '55000', 'lifecycle events are append-only', 'lifecycle history remains delete-proof');
select ok(not has_table_privilege('authenticated', 'public.curriculum_lifecycle_events', 'SELECT'),
  'authenticated has no broad lifecycle-table read grant');
select ok(has_function_privilege('authenticated',
  'public.list_curriculum_lifecycle_history(integer,bigint,public.curriculum_content_type,uuid,public.curriculum_lifecycle_action)', 'EXECUTE'),
  'authenticated may invoke the live-Admin-gated bounded history RPC');
select ok(not has_function_privilege('anon',
  'public.archive_governed_content(public.curriculum_content_type,uuid)', 'EXECUTE'),
  'anonymous callers cannot execute archival');
select ok(not has_function_privilege('anon',
  'public.restore_governed_content(public.curriculum_content_type,uuid)', 'EXECUTE'),
  'anonymous callers cannot execute restoration');
select ok(not has_function_privilege('anon',
  'public.list_curriculum_lifecycle_history(integer,bigint,public.curriculum_content_type,uuid,public.curriculum_lifecycle_action)', 'EXECUTE'),
  'anonymous callers cannot execute history retrieval');
select ok(not has_table_privilege('authenticated', 'public.curriculum_lifecycle_events', 'INSERT,UPDATE,DELETE'),
  'authenticated receives no lifecycle mutation privileges');
select ok((select relrowsecurity from pg_class where oid = 'public.curriculum_lifecycle_events'::regclass),
  'lifecycle-event RLS remains enabled');
select is((select count(*) from pg_proc procedure join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public' and procedure.proname in (
    'archive_governed_content', 'restore_governed_content', 'list_curriculum_lifecycle_history',
    'list_archived_governed_content'
  ) and procedure.prosecdef and array_to_string(procedure.proconfig, ',') like 'search_path=%'), 4::bigint,
  'archive, restore, history, and archived listing are hardened bounded security-definer operations');
select is((select count(*) from pg_proc procedure join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public' and procedure.proname in (
    'archive_governed_content', 'restore_governed_content', 'list_curriculum_lifecycle_history',
    'list_archived_governed_content'
  ) and pg_get_userbyid(procedure.proowner) = 'postgres'), 4::bigint,
  'archive, restore, history, and archived listing remain owned by the trusted migration role');

-- SPEC-005 Phase 2A: Admin-only archived read boundary and history attribution.
-- Reuses this file's fixtures. At this point instructor ...0002 and module ...0003
-- are archived; every other identity is active.
reset role;
-- A Draft on an archived identity proves the listing resolves only the
-- authoritative current-published revision.
insert into public.module_revisions(
  id, module_id, revision_number, status, axis_id, title, description,
  created_by, contributor_organization_id
) values (
  'b3100000-0000-4000-8000-000000000093', 'b3000000-0000-4000-8000-000000000003', 2, 'Draft',
  'a1000000-0000-4000-8000-000000000001', 'Borrador que no debe filtrarse', 'Borrador sobre identidad archivada.',
  'b2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select bag_eq(
  $$select content_type::text, content_id::text from public.list_archived_governed_content()$$,
  $$values ('instructor', 'b5000000-0000-4000-8000-000000000002'),
           ('module', 'b3000000-0000-4000-8000-000000000003')$$,
  'eligible Admin lists exactly the archived governed identities');

select is((select count(*) from public.list_archived_governed_content()
  where content_id = 'b3000000-0000-4000-8000-000000000001'), 0::bigint,
  'active non-archived identities are absent from the archived listing');

select is((select count(*) from public.list_archived_governed_content()
  where archived_at is null), 0::bigint,
  'every archived listing row carries identity-level archival state');

select is(
  (select current_published_revision_id::text from public.list_archived_governed_content()
    where content_id = 'b3000000-0000-4000-8000-000000000003'),
  'b3100000-0000-4000-8000-000000000003',
  'archived listing resolves the authoritative current-published revision');

select is(
  (select title from public.list_archived_governed_content()
    where content_id = 'b3000000-0000-4000-8000-000000000003'),
  'Módulo histórico',
  'archived listing reports the current-published title, never a Draft title');

select is((select count(*) from public.list_archived_governed_content()
  where title = 'Borrador que no debe filtrarse'), 0::bigint,
  'Draft revisions on an archived identity are not leaked by the archived listing');

select is(
  (select revision_number from public.list_archived_governed_content()
    where content_id = 'b3000000-0000-4000-8000-000000000003'), 1,
  'archived listing reports the current-published revision number');

select is(
  (select archived_by::text from public.list_archived_governed_content()
    where content_id = 'b3000000-0000-4000-8000-000000000003'),
  'b2000000-0000-4000-8000-000000000001',
  'archived listing preserves archival attribution');

select bag_eq(
  $$select content_type::text from public.list_archived_governed_content(50, null, null, 'instructor')$$,
  $$values ('instructor')$$,
  'archived listing honours the content-type filter');

select is((select count(*) from public.list_archived_governed_content(1)), 1::bigint,
  'archived listing honours a bounded page size');

select throws_ok($$select * from public.list_archived_governed_content(0)$$,
  '22023', 'archived page size must be between 1 and 100', 'archived listing rejects a page size below the bound');
select throws_ok($$select * from public.list_archived_governed_content(101)$$,
  '22023', 'archived page size must be between 1 and 100', 'archived listing rejects a page size above the bound');
select throws_ok($$select * from public.list_archived_governed_content(null)$$,
  '22023', 'archived page size must be between 1 and 100', 'archived listing rejects a null page size');
select throws_ok($$select * from public.list_archived_governed_content(50, now())$$,
  '22023', 'archived cursor requires both keyset values', 'archived listing rejects a partial keyset cursor');

-- Keyset pagination walks the whole archived set without repeating a row.
select is((select count(distinct content_id) from (
    select content_id from public.list_archived_governed_content(1)
    union all
    select page.content_id from public.list_archived_governed_content(1) first
    cross join lateral public.list_archived_governed_content(1, first.archived_at, first.content_id) page
  ) walked), 2::bigint,
  'archived keyset pagination reaches every archived identity exactly once');

-- The archived identity is reachable only through the bounded Admin boundary.
select is((select count(*) from public.modules where id = 'b3000000-0000-4000-8000-000000000003'), 0::bigint,
  'an archived identity stays invisible to direct Admin table reads');

select is(
  (select actor_organization_id::text from public.list_curriculum_lifecycle_history(1)),
  'b1000000-0000-4000-8000-000000000001',
  'lifecycle history reports the actor organization id');
select is(
  (select actor_organization_name from public.list_curriculum_lifecycle_history(1)),
  'Red de archivo',
  'lifecycle history resolves the actor organization name through the Admin boundary');

select is((select count(*) from public.list_curriculum_lifecycle_history(100)
  where action in ('content_archived', 'content_restored')
    and (previous_status is not null or resulting_status is not null)), 0::bigint,
  'archive and restore remain identity-level events without invented revision transitions');

-- Ordinary readers keep no path to archived content or to governance history.
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok($$select * from public.list_archived_governed_content()$$,
  '42501', 'eligible Admin access required', 'Contributors cannot use the archived read boundary');
select is((select count(*) from public.modules where id = 'b3000000-0000-4000-8000-000000000003'), 0::bigint,
  'archived content remains invisible to ordinary readers');

-- Live role revocation removes archived-read authority immediately.
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select throws_ok($$select * from public.list_archived_governed_content()$$,
  '42501', 'eligible Admin access required', 'live role revocation removes archived-read authority');

reset role;
select ok(has_function_privilege('authenticated',
  'public.list_archived_governed_content(integer,timestamptz,uuid,public.curriculum_content_type)', 'EXECUTE'),
  'authenticated may invoke the live-Admin-gated archived listing');
select ok(not has_function_privilege('anon',
  'public.list_archived_governed_content(integer,timestamptz,uuid,public.curriculum_content_type)', 'EXECUTE'),
  'anonymous callers cannot list archived content');
select is((select count(*) from pg_proc procedure join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public' and procedure.proname in (
    'list_archived_governed_content', 'list_curriculum_lifecycle_history'
  ) and procedure.provolatile = 's'), 2::bigint,
  'the archived and history read boundaries remain non-mutating');
select ok(not has_table_privilege('authenticated', 'public.organizations', 'INSERT,UPDATE,DELETE'),
  'organization attribution adds no organization mutation privilege');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select * from public.list_curriculum_lifecycle_history(101)$$,
  '22023', 'history page size must be between 1 and 100', 'history retrieval is bounded');

select * from finish();
rollback;
