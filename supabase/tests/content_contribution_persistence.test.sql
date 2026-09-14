begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into public.organizations(id,name,is_active) values
  ('71000000-0000-4000-8000-000000000001','Red de contribución',true),
  ('71000000-0000-4000-8000-000000000002','Red de transferencia',true);
insert into public.organization_domains(domain,organization_id) values
  ('contribution.test','71000000-0000-4000-8000-000000000001'),
  ('transfer.test','71000000-0000-4000-8000-000000000002');
insert into auth.users(id,email,email_confirmed_at) values
  ('72000000-0000-4000-8000-000000000001','owner@contribution.test',now()),
  ('72000000-0000-4000-8000-000000000002','other@contribution.test',now()),
  ('72000000-0000-4000-8000-000000000003','admin@contribution.test',now());
insert into public.memberships(user_id,organization_id,role,is_active) values
  ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001','Contributor',true),
  ('72000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000001','Contributor',true),
  ('72000000-0000-4000-8000-000000000003','71000000-0000-4000-8000-000000000001','Admin',true);

create temporary table contribution_results(key text primary key,payload jsonb);
grant all on contribution_results to authenticated;

select is((select public from storage.buckets where id='governed-attachments'),false,'governed attachment bucket is private');
select is((select file_size_limit from storage.buckets where id='governed-attachments'),3145728::bigint,'bucket enforces the 3 MiB limit');
select ok((select 'application/pdf'=any(allowed_mime_types) from storage.buckets where id='governed-attachments'),'bucket has a document MIME allowlist');
select is((select count(*) from (values
  ('https://example.test'),('https://sub.example.test:443/path/to/file?x=1#section')
) urls(value) where private.is_valid_https_url(value)),2::bigint,'normal HTTPS domains and valid optional ports/paths are accepted');
select is((select count(*) from (values
  ('https://example.test:0'),('https://example.test:65536'),('https://example.test:abc')
) urls(value) where private.is_valid_https_url(value)),0::bigint,'zero, out-of-range, and nonnumeric HTTPS ports are rejected');
select is((select count(*) from (values
  ('https://example..test'),('https://.example.test'),('https://example-.test'),('https://exa_mple.test')
) urls(value) where private.is_valid_https_url(value)),0::bigint,'empty and malformed DNS labels are rejected');
select is((select count(*) from (values
  ('https://'),('https://user:pass@example.test/path'),('https://example.test /path')
) urls(value) where private.is_valid_https_url(value)),0::bigint,'empty hosts, credentials, and whitespace are rejected');
select is((select count(*) from pg_constraint where conrelid='public.teaching_note_revisions'::regclass
  and conname='teaching_note_revisions_check'),0::bigint,'the incompatible SPEC-002 Teaching Note source CHECK is deterministically removed');
select is((select count(*) from pg_constraint where conrelid='public.teaching_note_revisions'::regclass
  and contype='c' and pg_get_constraintdef(oid)='CHECK (((text IS NOT NULL) OR (source_url IS NOT NULL)))'),0::bigint,
  'post-migration constraint state does not retain the row-only Teaching Note source rule');

set local role anon;
select throws_ok($$select public.create_contribution('instructor','{"name":"No"}')$$,'42501','permission denied for function create_contribution','anonymous creation is denied');
select throws_ok($$select public.reserve_attachment('material',gen_random_uuid(),'x.pdf','application/pdf',10)$$,'42501','permission denied for function reserve_attachment','anonymous reservation is denied');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into contribution_results values
  ('module',public.create_contribution('module',jsonb_build_object(
    'axis_id','a1000000-0000-4000-8000-000000000001','title','Módulo pendiente secreto','description','Descripción completa.','learning_outcomes',jsonb_build_array('Resultado')))),
  ('instructor',public.create_contribution('instructor','{"name":"Docente de prueba","thematic_axis_or_themes":[]}'::jsonb)),
  ('material',public.create_contribution('material','{"title":"Material de prueba","material_type":"Manual"}'::jsonb)),
  ('institution',public.create_contribution('institution','{"name":"Centro de prueba","institution_type":"Centro"}'::jsonb));
insert into contribution_results values ('topic',public.create_contribution('program_topic',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='module'),'title','Tema propio','position',1)));
insert into contribution_results values ('note',public.create_contribution('teaching_note',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='module'),
  'program_topic_id',(select payload->>'content_id' from contribution_results where key='topic'),
  'title','Nota propia','text','Contenido de facilitación.','material_ids',jsonb_build_array((select payload->>'content_id' from contribution_results where key='material')))));

select is((select count(*) from contribution_results where payload->>'status'='Draft'),6::bigint,'all six governed types create Draft revision one');
select is((select revision_number from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),1,'new contribution is revision one');
select is((select status::text from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),'Draft','database derives Draft status');
select is((select created_by from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),'72000000-0000-4000-8000-000000000001'::uuid,'database derives contributor identity');
select is((select contributor_organization_id from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),'71000000-0000-4000-8000-000000000001'::uuid,'database snapshots contributor organization');
select is((select current_published_revision_id from public.modules where id=(select (payload->>'content_id')::uuid from contribution_results where key='module')),null::uuid,'new identity current pointer remains null');
select throws_ok($$select count(*) from public.curriculum_lifecycle_events$$,'42501','permission denied for table curriculum_lifecycle_events','ordinary owner cannot read event store directly');
select throws_ok($$insert into public.curriculum_lifecycle_events(content_type,content_id,actor_user_id,actor_organization_id,action) values('module',gen_random_uuid(),auth.uid(),'71000000-0000-4000-8000-000000000001','content_created')$$,'42501','permission denied for table curriculum_lifecycle_events','ordinary users cannot forge events');
select throws_ok($$update public.module_revisions set status='Published'$$,'42501','permission denied for table module_revisions','generic revision DML remains denied');
select throws_ok($$update public.modules set current_published_revision_id=gen_random_uuid()$$,'42501','permission denied for table modules','generic current-pointer DML remains denied');
select throws_ok($$insert into public.module_materials values(gen_random_uuid(),gen_random_uuid())$$,'42501','permission denied for table module_materials','generic relationship DML remains denied');
select throws_ok($$select public.create_contribution('instructor','{"name":"Spoof","created_by":"72000000-0000-4000-8000-000000000002"}')$$,'22023','payload contains an unsupported field','actor spoofing input is rejected');
select throws_ok($$select public.create_contribution('instructor','{"name":"Spoof","contributor_organization_id":"71000000-0000-4000-8000-000000000001"}')$$,'22023','payload contains an unsupported field','contributor organization spoofing input is rejected');
select throws_ok($$select public.create_contribution('instructor','{"name":"Spoof","status":"Published"}')$$,'22023','payload contains an unsupported field','status spoofing input is rejected');
select throws_ok($$select public.create_contribution('instructor','{"name":"Spoof","submitted_at":"2026-01-01T00:00:00Z"}')$$,'22023','payload contains an unsupported field','submitted_at spoofing input is rejected');
select throws_ok($$select public.create_contribution('instructor','{"name":"Spoof","published_at":"2026-01-01T00:00:00Z"}')$$,'22023','payload contains an unsupported field','published_at spoofing input is rejected');
select throws_ok($$select public.create_contribution('instructor','{"name":"Spoof","current_published_revision_id":"73000000-0000-4000-8000-000000000001"}')$$,'22023','payload contains an unsupported field','current pointer spoofing input is rejected');
select throws_ok($$select public.create_contribution('module',jsonb_build_object('axis_id','a1000000-0000-4000-8000-000000000001','title','Grande','description',repeat('x',10001)))$$,'22023','payload field exceeds content limits','direct RPC field bounds reject oversized content');
select throws_ok($$select public.create_contribution('instructor',jsonb_build_object('name','Arreglo grande','thematic_axis_or_themes',(select jsonb_agg('tema'::text) from generate_series(1,101))))$$,'22023','payload array has too many values','direct RPC array bounds reject oversized arrays');
select throws_ok($$select public.update_contribution('instructor','70000000-0000-4000-8000-000000000099','{"name":"Ausente"}')$$,'42501','owned Draft not found','update cannot report success for a missing Draft');
select throws_ok($$select public.submit_contribution('instructor','70000000-0000-4000-8000-000000000099')$$,'42501','owned Draft not found','submit cannot report success for a missing Draft');
select throws_ok($$select public.delete_contribution('instructor','70000000-0000-4000-8000-000000000099')$$,'42501','owned Draft not found','delete cannot report success for a missing Draft');
select throws_ok($$select public.reserve_attachment('material','70000000-0000-4000-8000-000000000099','missing.pdf','application/pdf',10)$$,'42501','owned Draft not found','reservation cannot report success for a missing Draft');
select throws_ok($$select public.finalize_attachment_upload('70000000-0000-4000-8000-000000000099')$$,'42501','owned Draft attachment not found','attachment transition cannot report success for missing metadata');
select is(regexp_count(lower(pg_get_functiondef('private.assert_owned_draft(public.curriculum_content_type,uuid,uuid)'::regprocedure)),'for update'),6,'owned Draft assertion locks all six exact typed revision rows');

select lives_ok(format($sql$select public.update_contribution('module',%L,jsonb_build_object(
  'axis_id','a1000000-0000-4000-8000-000000000001','title','Módulo editado','description','Descripción editada.','learning_outcomes','[]'::jsonb,
  'instructor_ids',jsonb_build_array(%L),'material_ids',jsonb_build_array(%L),'institution_ids',jsonb_build_array(%L)))$sql$,
  (select payload->>'revision_id' from contribution_results where key='module'),
  (select payload->>'content_id' from contribution_results where key='instructor'),
  (select payload->>'content_id' from contribution_results where key='material'),
  (select payload->>'content_id' from contribution_results where key='institution')),'owner can update a Draft and its relationships');
select is((select title from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),'Módulo editado','typed table remains canonical after update');
select is((select count(*) from public.module_materials where module_revision_id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),1::bigint,'owned Draft relationship is readable');
select is((select count(*) from public.teaching_note_materials where teaching_note_revision_id=(select (payload->>'revision_id')::uuid from contribution_results where key='note')),1::bigint,'Teaching Note relationship is revision-scoped');
select is((select count(*) from public.search_curriculum('pendiente secreto')),0::bigint,'published search does not leak a Draft');
select is((select count(*) from public.list_published_modules() where id=(select (payload->>'content_id')::uuid from contribution_results where key='module')),0::bigint,'published listing does not return a Draft identity');

select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*) from public.modules where id=(select (payload->>'content_id')::uuid from contribution_results where key='module')),0::bigint,'another eligible user cannot read the Draft identity');
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),0::bigint,'another eligible user cannot read the Draft revision');
select throws_ok(format($sql$select public.update_contribution('module',%L,'{}')$sql$,(select payload->>'revision_id' from contribution_results where key='module')),'42501','owned Draft not found','another user cannot mutate the Draft by ID');
select throws_ok(format($sql$select public.create_contribution('program_topic',jsonb_build_object('module_id',%L,'title','Intrusión'))$sql$,(select payload->>'content_id' from contribution_results where key='module')),'23514','program topic requires an authorized module','another user cannot select a pending dependency');

select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
insert into contribution_results values ('admin',public.create_contribution('instructor','{"name":"Borrador Admin"}'::jsonb));
select is((select status::text from public.instructor_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='admin')),'Draft','eligible Admin uses the same Draft capability');
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),0::bigint,'Admin has no cross-user pending visibility');

select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into contribution_results values ('attachment_note',public.create_contribution('teaching_note',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='module'),'title','Nota solo archivo')));
select is((select text is null and source_url is null from public.teaching_note_revisions
  where id=(select (payload->>'revision_id')::uuid from contribution_results where key='attachment_note')),true,
  'attachment-only Teaching Note Draft is physically representable after constraint reconciliation');
select throws_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='attachment_note')),'23514','Draft is not valid for submission','Teaching Note without text, HTTPS URL, or attachment cannot submit');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note',%L,%L,'application/pdf',20)$sql$,
  (select payload->>'revision_id' from contribution_results where key='attachment_note'),E'salto\r\n.pdf'),'23514',null,'attachment filename rejects CR and LF');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note',%L,%L,'application/pdf',20)$sql$,
  (select payload->>'revision_id' from contribution_results where key='attachment_note'),'comilla".pdf'),'23514',null,'attachment filename rejects double quotes');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note',%L,%L,'application/pdf',20)$sql$,
  (select payload->>'revision_id' from contribution_results where key='attachment_note'),E'ruta\\archivo.pdf'),'23514',null,'attachment filename rejects backslashes');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note',%L,%L,'application/pdf',20)$sql$,
  (select payload->>'revision_id' from contribution_results where key='attachment_note'),'ruta/archivo.pdf'),'23514',null,'attachment filename rejects path separators');
insert into contribution_results values ('attachment',public.reserve_attachment('teaching_note',
  (select (payload->>'revision_id')::uuid from contribution_results where key='attachment_note'),'programa.pdf','application/pdf',321));
select is((select state::text from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='attachment')),'Reserved','attachment metadata starts Reserved');
select throws_ok(format($sql$select public.finalize_attachment_upload(%L)$sql$,(select payload->>'id' from contribution_results where key='attachment')),'23514','matching attachment object not found','Reserved metadata cannot become Ready without matching bytes');
select is((select object_name from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='attachment')),
  (select payload->>'id' from contribution_results where key='attachment'),'attachment path is an opaque generated identifier');
select is((select original_filename from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='attachment')),'programa.pdf','original filename is display metadata only');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note',%L,'huge.pdf','application/pdf',3145729)$sql$,(select payload->>'revision_id' from contribution_results where key='attachment_note')),'23514',null,'attachment larger than 3 MiB is rejected');
select throws_ok(format($sql$select public.reserve_attachment('teaching_note',%L,'script.html','text/html',20)$sql$,(select payload->>'revision_id' from contribution_results where key='attachment_note')),'23514',null,'non-document MIME is rejected');
insert into contribution_results values ('cancelled_attachment',public.reserve_attachment('teaching_note',
  (select (payload->>'revision_id')::uuid from contribution_results where key='attachment_note'),'cancelado.pdf','application/pdf',20));
select lives_ok(format($sql$select public.cancel_attachment_reservation(%L)$sql$,(select payload->>'id' from contribution_results where key='cancelled_attachment')),'unused attachment reservation can be cancelled');
select is((select count(*) from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='cancelled_attachment')),0::bigint,'cancellation removes only unused relational metadata');
select lives_ok(format($sql$insert into storage.objects(id,bucket_id,name,metadata) values(gen_random_uuid(),'governed-attachments',%L,'{"size":321,"mimetype":"application/pdf"}')$sql$,
  (select payload->>'object_name' from contribution_results where key='attachment')),'owner can upload bytes matching a Draft reservation');
select is((select count(*) from storage.objects where bucket_id='governed-attachments' and name=(select payload->>'object_name' from contribution_results where key='attachment')),1::bigint,'owner can read reserved Draft object');
select throws_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='attachment_note')),'23514','attachment metadata is not Ready','submission rejects uploaded bytes that were not finalized Ready');
select lives_ok(format($sql$select public.finalize_attachment_upload(%L)$sql$,(select payload->>'id' from contribution_results where key='attachment')),'matching uploaded bytes finalize attachment metadata');
select is((select state::text from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='attachment')),'Ready','finalized attachment metadata is Ready');
select throws_ok(format($sql$select public.finalize_attachment_upload(%L)$sql$,(select payload->>'id' from contribution_results where key='attachment')),'55000','attachment is not in the required state','attachment finalization cannot falsely succeed twice');
select lives_ok(format($sql$select public.begin_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='attachment')),'Ready attachment can begin deletion under the Draft lock');
select is((select state::text from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='attachment')),'Deleting','begin deletion marks metadata Deleting');
select throws_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='attachment_note')),'23514','attachment metadata is not Ready','submission rejects Deleting metadata');
select throws_ok(format($sql$select public.finalize_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='attachment')),'55000','attachment object still exists','metadata deletion cannot finalize while bytes remain');
select lives_ok(format($sql$select public.cancel_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='attachment')),'failed object deletion can restore metadata to Ready');
select is((select state::text from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='attachment')),'Ready','cancel deletion restores Ready state');

insert into contribution_results values ('mismatch_attachment',public.reserve_attachment('teaching_note',
  (select (payload->>'revision_id')::uuid from contribution_results where key='attachment_note'),'declarado.pdf','application/pdf',321));
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select throws_ok(format($sql$insert into storage.objects(id,bucket_id,name,metadata) values(gen_random_uuid(),'governed-attachments',%L,'{"size":320,"mimetype":"text/plain"}')$sql$,
  (select payload->>'object_name' from contribution_results where key='mismatch_attachment')),'42501',null,'another eligible user cannot upload to an owner reservation');
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select lives_ok(format($sql$insert into storage.objects(id,bucket_id,name,metadata) values(gen_random_uuid(),'governed-attachments',%L,'{"size":320,"mimetype":"text/plain"}')$sql$,
  (select payload->>'object_name' from contribution_results where key='mismatch_attachment')),'owner can upload an allowed object before Storage metadata reaches final shape');
select throws_ok(format($sql$select public.finalize_attachment_upload(%L)$sql$,(select payload->>'id' from contribution_results where key='mismatch_attachment')),'23514','matching attachment object not found','mismatched uploaded object cannot finalize Ready');
select throws_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='attachment_note')),'23514','attachment metadata is not Ready','mismatched Reserved object blocks submission');
select lives_ok(format($sql$select public.begin_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='mismatch_attachment')),'Reserved object that cannot finalize can begin deletion');
select is((select state::text from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='mismatch_attachment')),'Deleting','Reserved recovery transitions metadata to Deleting');
select throws_ok(format($sql$select public.cancel_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='mismatch_attachment')),'23514','matching attachment object not found','Deleting metadata cannot return Ready for mismatched bytes');
select ok(private.can_access_attachment_object((select payload->>'object_name' from contribution_results where key='mismatch_attachment'),'delete'),'Deleting recovery object is authorized for Storage API deletion');
select set_config('test.mismatch_object_name',(select payload->>'object_name' from contribution_results where key='mismatch_attachment'),true);
reset role;
select set_config('storage.allow_delete_query','true',true);
delete from storage.objects where bucket_id='governed-attachments' and name=current_setting('test.mismatch_object_name');
select set_config('storage.allow_delete_query','false',true);
set local role authenticated;
select lives_ok(format($sql$select public.finalize_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='mismatch_attachment')),'metadata finalizes after mismatched object deletion');
select is((select count(*) from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='mismatch_attachment')),0::bigint,'mismatched recovery metadata is cleaned');
select throws_ok($$insert into storage.objects(id,bucket_id,name,metadata) values(gen_random_uuid(),'governed-attachments',gen_random_uuid()::text,'{"size":1,"mimetype":"application/pdf"}')$$,'42501',null,'unreserved opaque path cannot bypass Storage authorization');

reset role;
update public.organizations set is_active=false where id='71000000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),0::bigint,'organization deactivation revokes pending contribution access');
select is((select count(*) from public.curriculum_attachments),0::bigint,'organization deactivation revokes pending attachment metadata access');
select is((select count(*) from storage.objects where bucket_id='governed-attachments'),0::bigint,'organization deactivation revokes pending attachment object access');
reset role;
update public.organizations set is_active=true where id='71000000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),1::bigint,'organization restoration restores owner pending access');
select is((select count(*) from storage.objects where bucket_id='governed-attachments'),1::bigint,'organization restoration restores owner object access');

reset role;
delete from public.organization_domains where domain='contribution.test';
set local role authenticated;
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),0::bigint,'approved-domain revocation removes pending contribution access');
select is((select count(*) from public.curriculum_attachments),0::bigint,'approved-domain revocation removes pending attachment metadata access');
select is((select count(*) from storage.objects where bucket_id='governed-attachments'),0::bigint,'approved-domain revocation removes pending attachment object access');
reset role;
insert into public.organization_domains(domain,organization_id) values('contribution.test','71000000-0000-4000-8000-000000000001');
set local role authenticated;
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),1::bigint,'approved-domain restoration restores owner pending access');
select is((select count(*) from storage.objects where bucket_id='governed-attachments'),1::bigint,'approved-domain restoration restores owner object access');

select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*) from public.curriculum_attachments),0::bigint,'unrelated eligible user cannot read pending attachment metadata');
select is((select count(*) from storage.objects where bucket_id='governed-attachments'),0::bigint,'unrelated eligible user cannot read pending attachment object');

select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select lives_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='attachment_note')),'attachment-only Teaching Note submits with an actual matching private object');
select lives_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='note')),'valid Teaching Note submits');
select lives_ok(format($sql$select public.submit_contribution('program_topic',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='topic')),'valid Program Topic submits');
select lives_ok(format($sql$select public.submit_contribution('module',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='module')),'valid Module submits');
select lives_ok(format($sql$select public.submit_contribution('instructor',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='instructor')),'valid Instructor submits');
select lives_ok(format($sql$select public.submit_contribution('material',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='material')),'valid Material submits');
select lives_ok(format($sql$select public.submit_contribution('institution',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='institution')),'valid Institution submits');
select is((select status::text from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),'Submitted','submission derives Submitted status');
select ok((select submitted_at is not null from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),'submission derives submitted_at');
select is((select current_published_revision_id from public.modules where id=(select (payload->>'content_id')::uuid from contribution_results where key='module')),null::uuid,'submission leaves current pointer null');
select is((select state::text from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='attachment')),'Ready','Submitted revision contains only Ready attachment metadata');
select throws_ok(format($sql$select public.update_contribution('module',%L,'{}')$sql$,(select payload->>'revision_id' from contribution_results where key='module')),'42501','owned Draft not found','Submitted revision cannot be edited through RPC');
select throws_ok(format($sql$select public.delete_contribution('module',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='module')),'42501','owned Draft not found','Submitted revision cannot be deleted through RPC');
select throws_ok(format($sql$delete from storage.objects where bucket_id='governed-attachments' and name=%L$sql$,(select payload->>'object_name' from contribution_results where key='attachment')),'42501','Direct deletion from storage tables is not allowed. Use the Storage API instead.','SQL cannot bypass the Storage API deletion boundary');
select is((select count(*) from storage.objects where bucket_id='governed-attachments' and name=(select payload->>'object_name' from contribution_results where key='attachment')),1::bigint,'Submitted attachment bytes remain immutable and readable by owner');
select throws_ok(format($sql$select public.begin_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='attachment')),'42501','owned Draft not found','Submitted attachment metadata cannot begin deletion');

reset role;
select throws_ok(format($sql$delete from public.module_materials where module_revision_id=%L$sql$,(select payload->>'revision_id' from contribution_results where key='module')),'55000','submitted relationships are immutable','Submitted relationship is database-immutable');
select throws_ok(format($sql$update public.module_revisions set title='Alterado' where id=%L$sql$,(select payload->>'revision_id' from contribution_results where key='module')),'55000','submitted revisions are immutable','Submitted typed revision is database-immutable');
select throws_ok(format($sql$delete from public.curriculum_attachments where id=%L$sql$,(select payload->>'id' from contribution_results where key='attachment')),'55000','submitted attachments are immutable','Submitted attachment metadata is database-immutable');
select is((select count(*) from public.curriculum_lifecycle_events where actor_user_id='72000000-0000-4000-8000-000000000001'),31::bigint,'trusted create/edit/attachment-state/submit events are appended');
select is((select count(*) from public.curriculum_lifecycle_events where actor_user_id='72000000-0000-4000-8000-000000000001' and actor_organization_id='71000000-0000-4000-8000-000000000001'),31::bigint,'every owner lifecycle event records the trusted organization at event time');
select is((select count(*) from public.curriculum_lifecycle_events where content_id=(select (payload->>'content_id')::uuid from contribution_results where key='module') and actor_user_id='72000000-0000-4000-8000-000000000001' and actor_organization_id='71000000-0000-4000-8000-000000000001'),4::bigint,'Module lifecycle actor and organization exactly match trusted context');
select throws_ok($$update public.curriculum_lifecycle_events set action='revision_edited'$$,'55000','lifecycle events are append-only','lifecycle events cannot be rewritten');
select throws_ok($$delete from public.curriculum_lifecycle_events$$,'55000','lifecycle events are append-only','lifecycle events cannot be deleted');
select is((select count(*) from public.search_curriculum('Módulo editado')),0::bigint,'Submitted content remains absent from published search');

-- Caller-owned Submitted dependencies remain valid while only Draft anchors mutate.
set local role authenticated;
insert into contribution_results values ('order_module',public.create_contribution('module','{"axis_id":"a1000000-0000-4000-8000-000000000001","title":"Módulo orden independiente","description":"Dependencia para orden.","learning_outcomes":[]}'::jsonb));
insert into contribution_results values ('order_topic',public.create_contribution('program_topic',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='order_module'),'title','Tema dependiente')));
insert into contribution_results values ('order_note',public.create_contribution('teaching_note',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='order_module'),
  'program_topic_id',(select payload->>'content_id' from contribution_results where key='order_topic'),
  'title','Nota dependiente','text','Fuente textual válida.')));
select lives_ok(format($sql$select public.submit_contribution('module',%L)$sql$,
  (select payload->>'revision_id' from contribution_results where key='order_module')),'Module may be submitted before its owned dependent Drafts');
select lives_ok(format($sql$select public.update_contribution('program_topic',%L,jsonb_build_object(
  'module_id',%L,'title','Tema editable tras módulo enviado','position',2))$sql$,
  (select payload->>'revision_id' from contribution_results where key='order_topic'),
  (select payload->>'content_id' from contribution_results where key='order_module')),'Program Topic remains editable with an owned Submitted Module dependency');
select lives_ok(format($sql$select public.submit_contribution('program_topic',%L)$sql$,
  (select payload->>'revision_id' from contribution_results where key='order_topic')),'Program Topic remains submittable after its Module dependency is Submitted');
select lives_ok(format($sql$select public.update_contribution('teaching_note',%L,jsonb_build_object(
  'module_id',%L,'program_topic_id',%L,'title','Nota editable tras dependencias enviadas','text','Fuente textual actualizada.','material_ids','[]'::jsonb))$sql$,
  (select payload->>'revision_id' from contribution_results where key='order_note'),
  (select payload->>'content_id' from contribution_results where key='order_module'),
  (select payload->>'content_id' from contribution_results where key='order_topic')),'Teaching Note remains editable with owned Submitted Module and Program Topic dependencies');
select lives_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,
  (select payload->>'revision_id' from contribution_results where key='order_note')),'Teaching Note remains submittable after both dependencies are Submitted');
select throws_ok(format($sql$select public.update_contribution('module',%L,'{}')$sql$,
  (select payload->>'revision_id' from contribution_results where key='order_module')),'42501','owned Draft not found','accepting a Submitted dependency does not make that dependency editable');

insert into contribution_results values ('topic_first_module',public.create_contribution('module','{"axis_id":"a1000000-0000-4000-8000-000000000001","title":"Módulo tema primero","description":"Dependencia aún en borrador.","learning_outcomes":[]}'::jsonb));
insert into contribution_results values ('topic_first_topic',public.create_contribution('program_topic',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='topic_first_module'),'title','Tema enviado primero')));
insert into contribution_results values ('topic_first_note',public.create_contribution('teaching_note',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='topic_first_module'),
  'program_topic_id',(select payload->>'content_id' from contribution_results where key='topic_first_topic'),
  'title','Nota tras tema','text','Fuente textual.')));
select lives_ok(format($sql$select public.submit_contribution('program_topic',%L)$sql$,
  (select payload->>'revision_id' from contribution_results where key='topic_first_topic')),'Program Topic may be submitted before its dependent Teaching Note');
select lives_ok(format($sql$select public.update_contribution('teaching_note',%L,jsonb_build_object(
  'module_id',%L,'program_topic_id',%L,'title','Nota editable tras tema enviado','text','Fuente actualizada.','material_ids','[]'::jsonb))$sql$,
  (select payload->>'revision_id' from contribution_results where key='topic_first_note'),
  (select payload->>'content_id' from contribution_results where key='topic_first_module'),
  (select payload->>'content_id' from contribution_results where key='topic_first_topic')),'Teaching Note remains editable when its Program Topic dependency is Submitted first');
select lives_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,
  (select payload->>'revision_id' from contribution_results where key='topic_first_note')),'Teaching Note remains submittable when its Program Topic dependency is already Submitted');

insert into contribution_results values ('url_note',public.create_contribution('teaching_note',jsonb_build_object(
  'module_id',(select payload->>'content_id' from contribution_results where key='order_module'),
  'title','Nota con URL','source_url','https://example.test/fuente')));
select lives_ok(format($sql$select public.submit_contribution('teaching_note',%L)$sql$,
  (select payload->>'revision_id' from contribution_results where key='url_note')),'valid HTTPS URL remains an accepted Teaching Note submission source');

select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='order_module')),0::bigint,'another contributor cannot see an owned Submitted dependency revision');
select is((select count(*) from public.program_topic_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='order_topic')),0::bigint,'another contributor cannot see an owned Submitted Program Topic dependency');
select throws_ok(format($sql$select public.create_contribution('program_topic',jsonb_build_object('module_id',%L,'title','Dependencia ajena'))$sql$,
  (select payload->>'content_id' from contribution_results where key='order_module')),'23514','program topic requires an authorized module','another contributor cannot use an owned Submitted dependency');
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*) from public.search_curriculum('orden independiente')),0::bigint,'Submitted dependency content remains excluded from published search');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into contribution_results values ('relationship_module',public.create_contribution('module','{"axis_id":"a1000000-0000-4000-8000-000000000001","title":"Módulo relación","description":"Módulo temporal.","learning_outcomes":[]}'::jsonb));
insert into contribution_results values ('invalid_topic',public.create_contribution('program_topic',jsonb_build_object('module_id',(select payload->>'content_id' from contribution_results where key='relationship_module'),'title','Tema invalidado')));
reset role;
update public.modules set archived_at=now() where id=(select (payload->>'content_id')::uuid from contribution_results where key='relationship_module');
set local role authenticated;
select throws_ok(format($sql$select public.submit_contribution('program_topic',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='invalid_topic')),'23514','program topic requires an authorized module','submission revalidates the Program Topic to Module relationship');

insert into contribution_results values ('invalid_url',public.create_contribution('material','{"title":"URL inválida","material_type":"Manual","source_url":"https://"}'::jsonb));
select throws_ok(format($sql$select public.submit_contribution('material',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='invalid_url')),'23514','Draft is not valid for submission','empty-host HTTPS placeholder cannot submit');

insert into contribution_results values ('reserved_delete_material',public.create_contribution('material','{"title":"Material reservado","material_type":"Manual"}'::jsonb));
insert into contribution_results values ('reserved_delete_attachment',public.reserve_attachment('material',(select (payload->>'revision_id')::uuid from contribution_results where key='reserved_delete_material'),'reservado.pdf','application/pdf',20));
insert into contribution_results values ('max_size_attachment',public.reserve_attachment('material',(select (payload->>'revision_id')::uuid from contribution_results where key='reserved_delete_material'),'limite.pdf','application/pdf',3145728));
select is((select size_bytes from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='max_size_attachment')),3145728::bigint,'attachment exactly at 3 MiB is accepted');
select throws_ok(format($sql$select public.delete_contribution('material',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='reserved_delete_material')),'55000','delete all attachment metadata before deleting the Draft','Draft deletion rejects Reserved metadata even without an object');
select lives_ok(format($sql$select public.cancel_attachment_reservation(%L)$sql$,(select payload->>'id' from contribution_results where key='reserved_delete_attachment')),'Reserved metadata can be removed before Draft deletion');
select lives_ok(format($sql$select public.cancel_attachment_reservation(%L)$sql$,(select payload->>'id' from contribution_results where key='max_size_attachment')),'3 MiB boundary reservation can be cancelled');
select lives_ok(format($sql$select public.delete_contribution('material',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='reserved_delete_material')),'Draft deletes after all attachment metadata is removed');

insert into contribution_results values ('finalize_delete_material',public.create_contribution('material','{"title":"Objeto eliminado","material_type":"Manual"}'::jsonb));
insert into contribution_results values ('finalize_delete_attachment',public.reserve_attachment('material',(select (payload->>'revision_id')::uuid from contribution_results where key='finalize_delete_material'),'eliminado.pdf','application/pdf',20));
reset role;
-- Simulate the post-Storage-delete state; HTTP byte deletion is covered by app E2E.
update public.curriculum_attachments set state='Ready' where id=(select (payload->>'id')::uuid from contribution_results where key='finalize_delete_attachment');
update public.curriculum_attachments set state='Deleting' where id=(select (payload->>'id')::uuid from contribution_results where key='finalize_delete_attachment');
set local role authenticated;
select lives_ok(format($sql$select public.finalize_attachment_deletion(%L)$sql$,(select payload->>'id' from contribution_results where key='finalize_delete_attachment')),'Deleting metadata finalizes after object absence');
select is((select count(*) from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='finalize_delete_attachment')),0::bigint,'successful deletion finalization removes metadata');

insert into contribution_results values ('deletable',public.create_contribution('instructor','{"name":"Borrador eliminable"}'::jsonb));
select lives_ok(format($sql$select public.delete_contribution('instructor',%L)$sql$,(select payload->>'revision_id' from contribution_results where key='deletable')),'owner can delete an unsubmitted Draft');
select is((select count(*) from public.instructor_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='deletable')),0::bigint,'deleted Draft row is removed');
reset role;
select is((select count(*) from public.curriculum_lifecycle_events where revision_id=(select (payload->>'revision_id')::uuid from contribution_results where key='deletable') and action='draft_deleted'),1::bigint,'draft deletion evidence survives row deletion');

-- Existing/imported Published rows remain compatible with nullable historical provenance.
insert into public.instructors(id) values('73000000-0000-4000-8000-000000000001');
insert into public.instructor_revisions(id,instructor_id,revision_number,status,name,published_at)
values('73100000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000001',1,'Published','Importado',now());
update public.instructors set current_published_revision_id='73100000-0000-4000-8000-000000000001' where id='73000000-0000-4000-8000-000000000001';
select is((select contributor_organization_id from public.instructor_revisions where id='73100000-0000-4000-8000-000000000001'),null::uuid,'existing Published import shape remains compatible');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
insert into contribution_results values ('transfer_material',public.create_contribution('material','{"title":"Material transferible","material_type":"Manual"}'::jsonb));
insert into contribution_results values ('transfer_attachment',public.reserve_attachment('material',(select (payload->>'revision_id')::uuid from contribution_results where key='transfer_material'),'transfer.pdf','application/pdf',30));
select lives_ok(format($sql$insert into storage.objects(id,bucket_id,name,metadata) values(gen_random_uuid(),'governed-attachments',%L,'{"size":30,"mimetype":"application/pdf"}')$sql$,(select payload->>'object_name' from contribution_results where key='transfer_attachment')),'owner uploads transfer fixture bytes');
select lives_ok(format($sql$select public.finalize_attachment_upload(%L)$sql$,(select payload->>'id' from contribution_results where key='transfer_attachment')),'owner finalizes transfer fixture metadata');
reset role;
update public.memberships set organization_id='71000000-0000-4000-8000-000000000002' where user_id='72000000-0000-4000-8000-000000000001';
update auth.users set email='owner@transfer.test' where id='72000000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*) from public.material_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='transfer_material')),1::bigint,'eligible transferred owner retains pending revision access');
select is((select count(*) from public.curriculum_attachments where id=(select (payload->>'id')::uuid from contribution_results where key='transfer_attachment')),1::bigint,'eligible transferred owner retains attachment metadata access');
select is((select count(*) from storage.objects where name=(select payload->>'object_name' from contribution_results where key='transfer_attachment')),1::bigint,'eligible transferred owner retains attachment object access');
select lives_ok(format($sql$select public.update_contribution('material',%L,'{"title":"Material transferido","material_type":"Manual"}')$sql$,(select payload->>'revision_id' from contribution_results where key='transfer_material')),'eligible transferred owner can continue editing');
select is((select contributor_organization_id from public.material_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='transfer_material')),'71000000-0000-4000-8000-000000000001'::uuid,'revision keeps immutable creation-time organization provenance');
reset role;
select is((select count(*) from public.curriculum_lifecycle_events where revision_id=(select (payload->>'revision_id')::uuid from contribution_results where key='transfer_material') and action='revision_edited' and actor_organization_id='71000000-0000-4000-8000-000000000002'),1::bigint,'post-transfer event records the current trusted organization');
update public.memberships set organization_id='71000000-0000-4000-8000-000000000001' where user_id='72000000-0000-4000-8000-000000000001';
update auth.users set email='owner@contribution.test' where id='72000000-0000-4000-8000-000000000001';

update public.memberships set is_active=false where user_id='72000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"72000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select is((select count(*) from public.module_revisions where id=(select (payload->>'revision_id')::uuid from contribution_results where key='module')),0::bigint,'membership revocation immediately removes pending reads');
select is((select count(*) from storage.objects where bucket_id='governed-attachments'),0::bigint,'membership revocation immediately removes pending object reads');
select throws_ok($$select public.create_contribution('instructor','{"name":"Revocado"}')$$,'42501','eligible authenticated access required','membership revocation immediately removes authoring');

reset role;
select is((select count(*) from pg_policies where schemaname='public' and tablename in (
  'modules','module_revisions','program_topics','program_topic_revisions','instructors','instructor_revisions',
  'teaching_notes','teaching_note_revisions','materials','material_revisions','institutions','institution_revisions',
  'module_instructors','module_materials','module_institutions','teaching_note_materials') and cmd<>'SELECT'),0::bigint,'governed typed tables still have no generic write policies');
select is((select count(*) from pg_proc where oid in (
  'public.list_published_modules(text,uuid,text)'::regprocedure,'public.get_published_module(uuid)'::regprocedure,
  'public.search_curriculum(text,text,uuid,text,text)'::regprocedure,'public.get_published_reference(text,uuid)'::regprocedure
) and not prosecdef),4::bigint,'all SPEC-002 published reader RPCs remain security-invoker');
select is((select count(*) from pg_proc where oid in (
  'public.create_contribution(public.curriculum_content_type,jsonb)'::regprocedure,
  'public.update_contribution(public.curriculum_content_type,uuid,jsonb)'::regprocedure,
  'public.submit_contribution(public.curriculum_content_type,uuid)'::regprocedure,
  'public.delete_contribution(public.curriculum_content_type,uuid)'::regprocedure
) and prosecdef and proconfig @> array['search_path=""']),4::bigint,'trusted contribution RPCs use security-definer with empty search_path');
select is((select count(*) from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'Owners % attachment objects'),3::bigint,'Storage has only owner read/upload/delete policies');
select is((select count(*) from pg_policies where schemaname='storage' and tablename='objects' and cmd='UPDATE'),0::bigint,'Storage exposes no ordinary object UPDATE or upsert policy');
select is(to_regprocedure('public.delete_attachment_metadata(uuid)'),null::regprocedure,'obsolete direct attachment metadata deletion RPC is absent');
select is((select count(*) from pg_proc where oid in (
  'public.finalize_attachment_upload(uuid)'::regprocedure,
  'public.cancel_attachment_reservation(uuid)'::regprocedure,
  'public.begin_attachment_deletion(uuid)'::regprocedure,
  'public.cancel_attachment_deletion(uuid)'::regprocedure,
  'public.finalize_attachment_deletion(uuid)'::regprocedure
) and prosecdef and proconfig @> array['search_path=""']),5::bigint,'all attachment state RPCs are security-definer with empty search_path');
select is((select count(*) from (values
  ('anon'),('service_role')
) denied(role_name) cross join unnest(array[
  'public.finalize_attachment_upload(uuid)'::regprocedure,
  'public.cancel_attachment_reservation(uuid)'::regprocedure,
  'public.begin_attachment_deletion(uuid)'::regprocedure,
  'public.cancel_attachment_deletion(uuid)'::regprocedure,
  'public.finalize_attachment_deletion(uuid)'::regprocedure
]) functions(function_oid) where has_function_privilege(denied.role_name,functions.function_oid,'EXECUTE')),0::bigint,'attachment state RPC ACLs exclude anonymous and service roles');

select * from finish();
rollback;
