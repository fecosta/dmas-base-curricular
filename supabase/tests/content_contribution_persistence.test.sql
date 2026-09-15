begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into public.organizations(id, name, is_active) values
  ('71000000-0000-4000-8000-000000000001', 'Red administradora', true),
  ('71000000-0000-4000-8000-000000000002', 'Red histórica', true);
insert into public.organization_domains(domain, organization_id) values
  ('admin.test', '71000000-0000-4000-8000-000000000001'),
  ('history.test', '71000000-0000-4000-8000-000000000002');
insert into auth.users(id, email, email_confirmed_at) values
  ('72000000-0000-4000-8000-000000000001', 'admin-a@admin.test', now()),
  ('72000000-0000-4000-8000-000000000002', 'reader@admin.test', now()),
  ('72000000-0000-4000-8000-000000000003', 'admin-b@admin.test', now()),
  ('72000000-0000-4000-8000-000000000004', 'historical@history.test', now());
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'Admin', true),
  ('72000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000001', 'Contributor', true),
  ('72000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000001', 'Admin', true),
  ('72000000-0000-4000-8000-000000000004', '71000000-0000-4000-8000-000000000002', 'Contributor', true);

create temporary table contribution_results(key text primary key, payload jsonb);
grant all on contribution_results to authenticated;

select is((select public from storage.buckets where id = 'governed-attachments'), false, 'governed attachment bucket remains private');
select is((select file_size_limit from storage.buckets where id = 'governed-attachments'), 3145728::bigint, 'bucket retains the 3 MiB limit');
select ok((select 'application/pdf' = any(allowed_mime_types) from storage.buckets where id = 'governed-attachments'), 'bucket retains its document MIME allowlist');
select is((select count(*) from (values
  ('https://example.test'), ('https://sub.example.test:443/path?x=1#section')
) urls(value) where private.is_valid_https_url(value)), 2::bigint, 'valid HTTPS URLs remain accepted');
select is((select count(*) from (values
  ('https://'), ('https://example..test'), ('https://user:pass@example.test/path'), ('https://example.test:0')
) urls(value) where private.is_valid_https_url(value)), 0::bigint, 'malformed HTTPS URLs remain rejected');
select is((select count(*) from pg_constraint where conrelid = 'public.teaching_note_revisions'::regclass
  and contype = 'c' and pg_get_constraintdef(oid) = 'CHECK (((text IS NOT NULL) OR (source_url IS NOT NULL)))'), 0::bigint,
  'attachment-only Teaching Note Drafts remain representable');

set local role anon;
select throws_ok($$select public.create_contribution('instructor', '{"name":"No"}')$$, '42501', 'permission denied for function create_contribution', 'anonymous creation remains denied');
select throws_ok($$select public.publish_content_draft('instructor', gen_random_uuid())$$, '42501', 'permission denied for function publish_content_draft', 'anonymous publication is denied');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok($$select public.create_contribution('instructor', '{"name":"Intrusión"}')$$, '42501', 'eligible Admin access required', 'Contributor cannot create governed content through the legacy RPC');
select throws_ok($$select public.update_contribution('instructor', gen_random_uuid(), '{"name":"Intrusión"}')$$, '42501', 'eligible Admin access required', 'Contributor cannot update a Draft through the legacy RPC');
select throws_ok($$select public.delete_contribution('instructor', gen_random_uuid())$$, '42501', 'eligible Admin access required', 'Contributor cannot delete a Draft through the legacy RPC');
select throws_ok($$select public.reserve_attachment('material', gen_random_uuid(), 'x.pdf', 'application/pdf', 10)$$, '42501', 'eligible Admin access required', 'Contributor cannot reserve governed attachments');
select throws_ok($$select public.finalize_attachment_upload(gen_random_uuid())$$, '42501', 'eligible Admin access required', 'Contributor cannot finalize governed attachments');
select throws_ok($$select public.cancel_attachment_reservation(gen_random_uuid())$$, '42501', 'eligible Admin access required', 'Contributor cannot cancel governed attachment reservations');
select throws_ok($$select public.begin_attachment_deletion(gen_random_uuid())$$, '42501', 'eligible Admin access required', 'Contributor cannot begin governed attachment deletion');
select throws_ok($$select public.cancel_attachment_deletion(gen_random_uuid())$$, '42501', 'eligible Admin access required', 'Contributor cannot cancel governed attachment deletion');
select throws_ok($$select public.finalize_attachment_deletion(gen_random_uuid())$$, '42501', 'eligible Admin access required', 'Contributor cannot finalize governed attachment deletion');
select throws_ok($$select public.submit_contribution('instructor', gen_random_uuid())$$, '42501', 'permission denied for function submit_contribution', 'legacy Draft submission is not executable by application roles');
select throws_ok($$update public.module_revisions set status = 'Published'$$, '42501', 'permission denied for table module_revisions', 'generic revision DML remains denied');
select throws_ok($$insert into public.module_materials values(gen_random_uuid(), gen_random_uuid())$$, '42501', 'permission denied for table module_materials', 'generic relationship DML remains denied');

select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into contribution_results values
  ('module', public.create_contribution('module', '{"axis_id":"a1000000-0000-4000-8000-000000000001","title":"Módulo Admin","description":"Descripción completa.","learning_outcomes":[]}'::jsonb)),
  ('instructor', public.create_contribution('instructor', '{"name":"Docente Admin","thematic_axis_or_themes":[]}'::jsonb)),
  ('material', public.create_contribution('material', '{"title":"Material Admin","material_type":"Manual"}'::jsonb)),
  ('institution', public.create_contribution('institution', '{"name":"Centro Admin","institution_type":"Centro","themes":[]}'::jsonb));
insert into contribution_results values ('topic', public.create_contribution('program_topic', jsonb_build_object(
  'module_id', (select payload->>'content_id' from contribution_results where key = 'module'), 'title', 'Tema Admin', 'position', 1)));
insert into contribution_results values ('note', public.create_contribution('teaching_note', jsonb_build_object(
  'module_id', (select payload->>'content_id' from contribution_results where key = 'module'),
  'program_topic_id', (select payload->>'content_id' from contribution_results where key = 'topic'),
  'title', 'Nota Admin', 'text', 'Fuente textual.',
  'material_ids', jsonb_build_array((select payload->>'content_id' from contribution_results where key = 'material')))));

select is((select count(*) from contribution_results where payload->>'status' = 'Draft'), 6::bigint, 'Admin creates all six governed Draft types');
select is((select created_by from public.module_revisions where id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')),
  '72000000-0000-4000-8000-000000000001'::uuid, 'database derives original Admin creator');
select is((select contributor_organization_id from public.module_revisions where id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')),
  '71000000-0000-4000-8000-000000000001'::uuid, 'database snapshots original Admin organization');
select is((select current_published_revision_id from public.modules where id = (select (payload->>'content_id')::uuid from contribution_results where key = 'module')),
  null::uuid, 'new Draft identity has no current published pointer');
select throws_ok($$select public.create_contribution('instructor', '{"name":"Spoof","created_by":"72000000-0000-4000-8000-000000000002"}')$$,
  '22023', 'payload contains an unsupported field', 'caller cannot spoof creator provenance');
select throws_ok($$select public.create_contribution('instructor', '{"name":"Spoof","status":"Published"}')$$,
  '22023', 'payload contains an unsupported field', 'caller cannot spoof lifecycle status');

select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.module_revisions where id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')), 1::bigint,
  'Admin B reads Admin A Draft directly through RLS');
select lives_ok(format($sql$select public.update_contribution('module', %L, jsonb_build_object(
  'axis_id', 'a1000000-0000-4000-8000-000000000001', 'title', 'Módulo editado por B',
  'description', 'Descripción editada.', 'learning_outcomes', '[]'::jsonb,
  'instructor_ids', jsonb_build_array(%L), 'material_ids', jsonb_build_array(%L),
  'institution_ids', jsonb_build_array(%L)))$sql$,
  (select payload->>'revision_id' from contribution_results where key = 'module'),
  (select payload->>'content_id' from contribution_results where key = 'instructor'),
  (select payload->>'content_id' from contribution_results where key = 'material'),
  (select payload->>'content_id' from contribution_results where key = 'institution')), 'Admin B edits Admin A Draft and relationships');
select is((select count(*) from public.module_materials where module_revision_id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')), 1::bigint,
  'Admin B relationship mutation is visible');
select lives_ok(format($sql$select public.update_contribution('teaching_note', %L, jsonb_build_object(
  'module_id', %L, 'program_topic_id', %L, 'title', 'Nota editada por B', 'text', 'Fuente actualizada.',
  'material_ids', jsonb_build_array(%L)))$sql$,
  (select payload->>'revision_id' from contribution_results where key = 'note'),
  (select payload->>'content_id' from contribution_results where key = 'module'),
  (select payload->>'content_id' from contribution_results where key = 'topic'),
  (select payload->>'content_id' from contribution_results where key = 'material')),
  'Admin B edits a Teaching Note that references Admin A Draft dependencies');
select is((select created_by from public.module_revisions where id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')),
  '72000000-0000-4000-8000-000000000001'::uuid, 'cross-Admin edit preserves created_by');
select is((select contributor_organization_id from public.module_revisions where id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')),
  '71000000-0000-4000-8000-000000000001'::uuid, 'cross-Admin edit preserves creation-time organization');

select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into contribution_results values ('attachment', public.reserve_attachment('teaching_note',
  (select (payload->>'revision_id')::uuid from contribution_results where key = 'note'), 'programa.pdf', 'application/pdf', 321));
select is((select state::text from public.curriculum_attachments where id = (select (payload->>'id')::uuid from contribution_results where key = 'attachment')), 'Reserved',
  'Admin A attachment metadata starts Reserved');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note', %L, %L, 'application/pdf', 20)$sql$,
  (select payload->>'revision_id' from contribution_results where key = 'note'), E'ruta/archivo.pdf'), '23514', null, 'attachment filename rejects path separators');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note', %L, 'huge.pdf', 'application/pdf', 3145729)$sql$,
  (select payload->>'revision_id' from contribution_results where key = 'note')), '23514', null, 'attachment larger than 3 MiB is rejected');

select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select lives_ok(format($sql$insert into storage.objects(id, bucket_id, name, metadata)
  values(gen_random_uuid(), 'governed-attachments', %L, '{"size":321,"mimetype":"application/pdf"}')$sql$,
  (select payload->>'object_name' from contribution_results where key = 'attachment')), 'Admin B uploads bytes for Admin A reservation');
select lives_ok(format($sql$select public.finalize_attachment_upload(%L)$sql$,
  (select payload->>'id' from contribution_results where key = 'attachment')), 'Admin B finalizes Admin A attachment');
select is((select state::text from public.curriculum_attachments where id = (select (payload->>'id')::uuid from contribution_results where key = 'attachment')), 'Ready',
  'cross-Admin finalization makes metadata Ready');
select is((select created_by from public.curriculum_attachments where id = (select (payload->>'id')::uuid from contribution_results where key = 'attachment')),
  '72000000-0000-4000-8000-000000000001'::uuid, 'cross-Admin attachment management preserves creator provenance');
select lives_ok(format($sql$select public.begin_attachment_deletion(%L)$sql$,
  (select payload->>'id' from contribution_results where key = 'attachment')), 'Admin B can begin deletion of Admin A attachment');
select lives_ok(format($sql$select public.cancel_attachment_deletion(%L)$sql$,
  (select payload->>'id' from contribution_results where key = 'attachment')), 'Admin B can recover Admin A attachment metadata');

select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.module_revisions where id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')), 0::bigint,
  'Contributor cannot read an Admin Draft revision');
select is((select count(*) from public.curriculum_attachments
  where id = (select (payload->>'id')::uuid from contribution_results where key = 'attachment')), 0::bigint,
  'Contributor cannot read Draft attachment metadata');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments'
  and name = (select payload->>'object_name' from contribution_results where key = 'attachment')), 0::bigint,
  'Contributor cannot read Draft attachment objects');
select throws_ok(format($sql$insert into storage.objects(id, bucket_id, name, metadata)
  values(gen_random_uuid(), 'governed-attachments', %L, '{"size":321,"mimetype":"application/pdf"}')$sql$,
  (select payload->>'object_name' from contribution_results where key = 'attachment')), '42501', null, 'Contributor cannot upload governed attachment bytes');
select is((select count(*) from public.curriculum_lifecycle_events), 0::bigint, 'Contributor cannot read Admin lifecycle events');

reset role;
update public.memberships set role = 'Contributor' where user_id = '72000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.module_revisions where id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')), 0::bigint,
  'Admin role revocation immediately removes Draft visibility');
select throws_ok(format($sql$select public.update_contribution('module', %L, '{}')$sql$,
  (select payload->>'revision_id' from contribution_results where key = 'module')), '42501', 'eligible Admin access required', 'Admin role revocation immediately removes Draft mutation');
select throws_ok(format($sql$select public.begin_attachment_deletion(%L)$sql$,
  (select payload->>'id' from contribution_results where key = 'attachment')), '42501', 'eligible Admin access required', 'Admin role revocation immediately removes attachment mutation');

reset role;
update public.memberships set role = 'Admin' where user_id = '72000000-0000-4000-8000-000000000003';
insert into public.instructors(id, created_by) values
  ('73000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000004');
insert into public.instructor_revisions(
  id, instructor_id, revision_number, status, name, created_by,
  contributor_organization_id, submitted_at
) values (
  '73100000-0000-4000-8000-000000000001', '73000000-0000-4000-8000-000000000001', 1,
  'Submitted', 'Registro histórico', '72000000-0000-4000-8000-000000000004',
  '71000000-0000-4000-8000-000000000002', now()
);
select is((select status::text from public.instructor_revisions where id = '73100000-0000-4000-8000-000000000001'), 'Submitted',
  'existing Submitted status remains representable and unchanged');
select is((select contributor_organization_id from public.instructor_revisions where id = '73100000-0000-4000-8000-000000000001'),
  '71000000-0000-4000-8000-000000000002'::uuid, 'historical Submitted provenance remains unchanged');
select throws_ok($$update public.instructor_revisions set name = 'Alterado' where id = '73100000-0000-4000-8000-000000000001'$$,
  '55000', 'submitted revisions are immutable', 'historical Submitted revisions remain immutable');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"72000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
insert into contribution_results values ('deletable', public.create_contribution('instructor', '{"name":"Borrador eliminable"}'::jsonb));
select lives_ok(format($sql$select public.delete_contribution('instructor', %L)$sql$,
  (select payload->>'revision_id' from contribution_results where key = 'deletable')), 'an eligible Admin can delete an active Draft');

reset role;
select is((select count(*) from public.curriculum_lifecycle_events where action = 'draft_deleted'
  and revision_id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'deletable')), 1::bigint,
  'Draft deletion evidence survives deletion');
select is((select count(*) from public.curriculum_lifecycle_events where action = 'revision_edited'
  and actor_user_id = '72000000-0000-4000-8000-000000000003'
  and revision_id = (select (payload->>'revision_id')::uuid from contribution_results where key = 'module')), 1::bigint,
  'cross-Admin edit event records the actual Admin actor');
select throws_ok($$update public.curriculum_lifecycle_events set action = 'revision_edited'$$,
  '55000', 'lifecycle events are append-only', 'lifecycle events cannot be rewritten');
select throws_ok($$delete from public.curriculum_lifecycle_events$$,
  '55000', 'lifecycle events are append-only', 'lifecycle events cannot be deleted');
select ok(not has_function_privilege('authenticated', 'public.submit_contribution(public.curriculum_content_type,uuid)', 'EXECUTE'),
  'authenticated has no legacy submission EXECUTE grant');
select ok(has_function_privilege('authenticated', 'public.create_contribution(public.curriculum_content_type,jsonb)', 'EXECUTE'),
  'authenticated may invoke the Admin-gated creation RPC');
select ok(has_function_privilege('authenticated', 'public.publish_content_draft(public.curriculum_content_type,uuid)', 'EXECUTE'),
  'authenticated may invoke the Admin-gated publication RPC');
select is((select count(*) from pg_policies where schemaname = 'public' and policyname like 'Owners see pending%'), 0::bigint,
  'owner-only pending RLS policies are removed');
select is((select count(*) from pg_policies where schemaname = 'storage' and policyname like 'Owners %Draft attachment objects'), 0::bigint,
  'owner-only Draft Storage policies are removed');
select is((select count(*) from public.search_curriculum('Módulo editado por B')), 0::bigint,
  'Admin Draft remains absent from published search');

select * from finish();
rollback;
