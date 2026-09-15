begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into public.organizations(id, name, is_active)
values ('a0100000-0000-4000-8000-000000000001', 'Red lectora de archivos', true);
insert into public.organization_domains(domain, organization_id)
values ('attachment-reader.test', 'a0100000-0000-4000-8000-000000000001');
insert into auth.users(id, email, email_confirmed_at) values
  ('a0200000-0000-4000-8000-000000000001', 'admin@attachment-reader.test', now()),
  ('a0200000-0000-4000-8000-000000000002', 'reader@attachment-reader.test', now());
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', 'Admin', true),
  ('a0200000-0000-4000-8000-000000000002', 'a0100000-0000-4000-8000-000000000001', 'Contributor', true);

insert into public.modules(id, created_by)
values ('a0300000-0000-4000-8000-000000000001', 'a0200000-0000-4000-8000-000000000001');
insert into public.module_revisions(
  id, module_id, revision_number, status, axis_id, title, description,
  created_by, contributor_organization_id, published_at
) values (
  'a0310000-0000-4000-8000-000000000001', 'a0300000-0000-4000-8000-000000000001', 1, 'Published',
  'a1000000-0000-4000-8000-000000000001', 'Módulo con nota adjunta', 'Descripción publicada.',
  'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', now()
);
update public.modules set current_published_revision_id = 'a0310000-0000-4000-8000-000000000001'
where id = 'a0300000-0000-4000-8000-000000000001';

insert into public.teaching_notes(id, created_by)
values ('a0400000-0000-4000-8000-000000000001', 'a0200000-0000-4000-8000-000000000001');
insert into public.teaching_note_revisions(
  id, teaching_note_id, revision_number, status, module_id, title, text,
  created_by, contributor_organization_id, published_at
) values (
  'a0410000-0000-4000-8000-000000000001', 'a0400000-0000-4000-8000-000000000001', 1, 'Published',
  'a0300000-0000-4000-8000-000000000001', 'Nota publicada', 'Texto de la nota.',
  'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', now()
);
update public.teaching_notes set current_published_revision_id = 'a0410000-0000-4000-8000-000000000001'
where id = 'a0400000-0000-4000-8000-000000000001';

insert into public.materials(id, created_by) values
  ('a0500000-0000-4000-8000-000000000001', 'a0200000-0000-4000-8000-000000000001'),
  ('a0500000-0000-4000-8000-000000000002', 'a0200000-0000-4000-8000-000000000001');
insert into public.material_revisions(
  id, material_id, revision_number, status, title, material_type,
  created_by, contributor_organization_id, published_at
) values
  ('a0510000-0000-4000-8000-000000000001', 'a0500000-0000-4000-8000-000000000001', 1, 'Published',
   'Material v1', 'Informe', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', now()),
  ('a0510000-0000-4000-8000-000000000002', 'a0500000-0000-4000-8000-000000000001', 2, 'Draft',
   'Material v2', 'Informe', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', null),
  ('a0510000-0000-4000-8000-000000000003', 'a0500000-0000-4000-8000-000000000002', 1, 'Draft',
   'Material sin publicar', 'Informe', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', null);
update public.materials set current_published_revision_id = 'a0510000-0000-4000-8000-000000000001'
where id = 'a0500000-0000-4000-8000-000000000001';

set local session_replication_role = replica;
insert into public.curriculum_attachments(
  id, object_name, original_filename, mime_type, size_bytes,
  teaching_note_revision_id, material_revision_id, created_by, contributor_organization_id, state
) values
  ('a0600000-0000-4000-8000-000000000001', 'a0600000-0000-4000-8000-000000000001', 'nota-publicada.pdf', 'application/pdf', 101,
   'a0410000-0000-4000-8000-000000000001', null, 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', 'Ready'),
  ('a0600000-0000-4000-8000-000000000002', 'a0600000-0000-4000-8000-000000000002', 'material-v1.pdf', 'application/pdf', 102,
   null, 'a0510000-0000-4000-8000-000000000001', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', 'Ready'),
  ('a0600000-0000-4000-8000-000000000003', 'a0600000-0000-4000-8000-000000000003', 'material-v2.pdf', 'application/pdf', 103,
   null, 'a0510000-0000-4000-8000-000000000002', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', 'Ready'),
  ('a0600000-0000-4000-8000-000000000004', 'a0600000-0000-4000-8000-000000000004', 'material-borrador.pdf', 'application/pdf', 104,
   null, 'a0510000-0000-4000-8000-000000000003', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', 'Ready'),
  ('a0600000-0000-4000-8000-000000000005', 'a0600000-0000-4000-8000-000000000005', 'material-reservado.pdf', 'application/pdf', 105,
   null, 'a0510000-0000-4000-8000-000000000001', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', 'Reserved'),
  ('a0600000-0000-4000-8000-000000000006', 'a0600000-0000-4000-8000-000000000006', 'material-eliminando.pdf', 'application/pdf', 106,
   null, 'a0510000-0000-4000-8000-000000000001', 'a0200000-0000-4000-8000-000000000001', 'a0100000-0000-4000-8000-000000000001', 'Deleting');
set local session_replication_role = origin;

insert into storage.objects(id, bucket_id, name, metadata) values
  (gen_random_uuid(), 'governed-attachments', 'a0600000-0000-4000-8000-000000000001', '{"size":101,"mimetype":"application/pdf"}'),
  (gen_random_uuid(), 'governed-attachments', 'a0600000-0000-4000-8000-000000000002', '{"size":102,"mimetype":"application/pdf"}'),
  (gen_random_uuid(), 'governed-attachments', 'a0600000-0000-4000-8000-000000000003', '{"size":103,"mimetype":"application/pdf"}'),
  (gen_random_uuid(), 'governed-attachments', 'a0600000-0000-4000-8000-000000000004', '{"size":104,"mimetype":"application/pdf"}'),
  (gen_random_uuid(), 'governed-attachments', 'a0600000-0000-4000-8000-000000000005', '{"size":105,"mimetype":"application/pdf"}'),
  (gen_random_uuid(), 'governed-attachments', 'a0600000-0000-4000-8000-000000000006', '{"size":106,"mimetype":"application/pdf"}');

set local role anon;
select throws_ok($$select count(*) from public.curriculum_attachments$$,
  '42501', 'permission denied for table curriculum_attachments',
  'unauthenticated callers cannot read governed attachment metadata');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments'
  and name like 'a0600000-0000-4000-8000-0000000000%'), 0::bigint,
  'unauthenticated callers cannot read governed attachment objects by path');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments
  where id::text like 'a0600000-0000-4000-8000-0000000000%'), 2::bigint,
  'eligible reader sees only Ready attachments on authoritative current Published revisions');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments'
  and name like 'a0600000-0000-4000-8000-0000000000%'), 2::bigint,
  'eligible reader directly resolves only current-published governed objects');
select is((select count(*) from public.curriculum_attachments where id = 'a0600000-0000-4000-8000-000000000003'), 0::bigint,
  'reader cannot resolve a successor Draft attachment by attachment ID');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments' and name = 'a0600000-0000-4000-8000-000000000003'), 0::bigint,
  'reader cannot resolve a successor Draft object by known Storage path');
select is((select count(*) from public.curriculum_attachments where id = 'a0600000-0000-4000-8000-000000000004'), 0::bigint,
  'reader cannot resolve an unpublished first-Draft attachment');
select is((select count(*) from public.curriculum_attachments where id in (
  'a0600000-0000-4000-8000-000000000005', 'a0600000-0000-4000-8000-000000000006'
)), 0::bigint, 'reader cannot resolve Reserved or Deleting current-revision metadata');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments' and name in (
  'a0600000-0000-4000-8000-000000000005', 'a0600000-0000-4000-8000-000000000006'
)), 0::bigint, 'reader cannot resolve Reserved or Deleting current-revision objects');
select is(jsonb_array_length(public.get_published_module('a0300000-0000-4000-8000-000000000001')->'teachingNotes'->0->'attachments'), 1,
  'published Module detail exposes its Teaching Note attachment');
select is(public.get_published_reference('material', 'a0500000-0000-4000-8000-000000000001')->'attachments'->0->>'id',
  'a0600000-0000-4000-8000-000000000002', 'published Material detail exposes the current attachment');
select ok(not (public.get_published_reference('material', 'a0500000-0000-4000-8000-000000000001')->'attachments'->0 ? 'objectName'),
  'reader payload does not expose the private Storage object name');
select throws_ok($$insert into storage.objects(id, bucket_id, name, metadata)
  values(gen_random_uuid(), 'governed-attachments', 'a0600000-0000-4000-8000-000000000099', '{"size":10,"mimetype":"application/pdf"}')$$,
  '42501', null, 'eligible reader cannot upload arbitrary governed objects');

select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments
  where id::text like 'a0600000-0000-4000-8000-0000000000%'), 4::bigint,
  'eligible Admin retains current-published reads and broader Draft attachment inspection');
select lives_ok($$select public.publish_content_draft('material', 'a0510000-0000-4000-8000-000000000002')$$,
  'Admin publishes the successor with independently Ready attachment bytes');

select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments where id = 'a0600000-0000-4000-8000-000000000003'), 1::bigint,
  'reader gains access to the v2 attachment after v2 becomes current');
select is((select count(*) from public.curriculum_attachments where id = 'a0600000-0000-4000-8000-000000000002'), 0::bigint,
  'reader loses ordinary access to the historical v1 attachment after v2 publication');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments' and name = 'a0600000-0000-4000-8000-000000000002'), 0::bigint,
  'known historical Storage path does not bypass the moved current pointer');
select is(public.get_published_reference('material', 'a0500000-0000-4000-8000-000000000001')->'attachments'->0->>'id',
  'a0600000-0000-4000-8000-000000000003', 'Material reader payload follows the new current revision');

select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.archive_governed_content('material', 'a0500000-0000-4000-8000-000000000001')$$,
  'Admin archives the Material through the authoritative operation');
select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments where id = 'a0600000-0000-4000-8000-000000000003'), 0::bigint,
  'archiving the parent identity immediately removes current attachment metadata visibility');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments' and name = 'a0600000-0000-4000-8000-000000000003'), 0::bigint,
  'archiving the parent identity immediately removes current object visibility');

select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.restore_governed_content('material', 'a0500000-0000-4000-8000-000000000001')$$,
  'Admin restores the same Published Material without creating a revision');
select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments where id = 'a0600000-0000-4000-8000-000000000003'), 1::bigint,
  'restore makes only the Ready attachment on the current Material revision readable');
select is((select count(*) from public.curriculum_attachments where id = 'a0600000-0000-4000-8000-000000000002'), 0::bigint,
  'restore leaves historical Material attachments denied');
reset role;
update public.memberships set is_active = false where user_id = 'a0200000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.curriculum_attachments
  where id::text like 'a0600000-0000-4000-8000-0000000000%'), 0::bigint,
  'live membership revocation removes attachment metadata reads immediately');
select is((select count(*) from storage.objects where bucket_id = 'governed-attachments'
  and name like 'a0600000-0000-4000-8000-0000000000%'), 0::bigint,
  'live membership revocation removes direct Storage reads immediately');

reset role;
select is((select public from storage.buckets where id = 'governed-attachments'), false,
  'governed attachment bucket remains private');
select ok(not has_function_privilege('anon', 'private.can_read_current_published_attachment(text)', 'EXECUTE'),
  'anonymous callers cannot invoke the current-published attachment helper');
select ok(not has_function_privilege('service_role', 'private.can_read_current_published_attachment(text)', 'EXECUTE'),
  'service role receives no explicit attachment-helper execution grant');
select ok(has_function_privilege('authenticated', 'private.can_read_current_published_attachment(text)', 'EXECUTE'),
  'authenticated policy evaluation can invoke the bounded attachment helper');
select ok(not exists (
  select 1 from aclexplode((select proacl from pg_proc
    where oid = 'private.can_read_current_published_attachment(text)'::regprocedure)) privilege
  where privilege.grantee = 0 and privilege.privilege_type = 'EXECUTE'
), 'PUBLIC receives no attachment-helper execution grant');
select is((select count(*) from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'private' and procedure.proname = 'can_read_current_published_attachment'
    and procedure.prosecdef and array_to_string(procedure.proconfig, ',') like 'search_path=%'), 1::bigint,
  'attachment helper is a hardened security-definer function');
select is((select pg_get_userbyid(proowner) from pg_proc
  where oid = 'private.can_read_current_published_attachment(text)'::regprocedure), 'postgres',
  'attachment helper remains owned by the trusted migration role');
select ok(not (select relforcerowsecurity from pg_class where oid = 'public.curriculum_attachments'::regclass),
  'attachment metadata does not FORCE RLS against its trusted policy helper owner');

select * from finish();
rollback;
