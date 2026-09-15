begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
select no_plan();

insert into public.organizations(id, name, is_active)
values ('81000000-0000-4000-8000-000000000001', 'Red de publicación', true);
insert into public.organization_domains(domain, organization_id)
values ('publication.test', '81000000-0000-4000-8000-000000000001');
insert into auth.users(id, email, email_confirmed_at) values
  ('82000000-0000-4000-8000-000000000001', 'admin-a@publication.test', now()),
  ('82000000-0000-4000-8000-000000000002', 'admin-b@publication.test', now()),
  ('82000000-0000-4000-8000-000000000003', 'reader@publication.test', now());
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('82000000-0000-4000-8000-000000000001', '81000000-0000-4000-8000-000000000001', 'Admin', true),
  ('82000000-0000-4000-8000-000000000002', '81000000-0000-4000-8000-000000000001', 'Admin', true),
  ('82000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000001', 'Contributor', true);

create temporary table publication_results(key text primary key, payload jsonb);
grant all on publication_results to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"82000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into publication_results values ('instructor', public.create_contribution(
  'instructor', '{"name":"Docente publicable","thematic_axis_or_themes":[]}'::jsonb));
insert into publication_results values ('module', public.create_contribution('module', jsonb_build_object(
  'axis_id', 'a1000000-0000-4000-8000-000000000001',
  'title', 'Módulo publicable', 'description', 'Descripción completa.', 'learning_outcomes', '[]'::jsonb,
  'instructor_ids', jsonb_build_array((select payload->>'content_id' from publication_results where key = 'instructor')))));

select set_config('request.jwt.claims', '{"sub":"82000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'module')),
  '23514', 'Module requires current-published Instructors', 'publication rejects an unpublished Draft dependency');
select is((select status::text from public.module_revisions where id = (select (payload->>'revision_id')::uuid from publication_results where key = 'module')),
  'Draft', 'failed publication rolls revision status back to Draft');
select is((select current_published_revision_id from public.modules where id = (select (payload->>'content_id')::uuid from publication_results where key = 'module')),
  null::uuid, 'failed publication leaves the current pointer null');

select lives_ok(format($sql$select public.publish_content_draft('instructor', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'instructor')), 'Admin B publishes Admin A valid Draft dependency');
select lives_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'module')), 'current-published dependency is accepted');
select is((select status::text from public.module_revisions where id = (select (payload->>'revision_id')::uuid from publication_results where key = 'module')),
  'Published', 'publication sets revision status Published');
select is((select current_published_revision_id from public.modules where id = (select (payload->>'content_id')::uuid from publication_results where key = 'module')),
  (select (payload->>'revision_id')::uuid from publication_results where key = 'module'), 'publication atomically sets the matching current pointer');
select ok((select published_at is not null from public.module_revisions where id = (select (payload->>'revision_id')::uuid from publication_results where key = 'module')),
  'publication sets trusted publication time');
select is((select created_by from public.module_revisions where id = (select (payload->>'revision_id')::uuid from publication_results where key = 'module')),
  '82000000-0000-4000-8000-000000000001'::uuid, 'cross-Admin publication preserves original creator provenance');
select is((select count(*) from public.list_curriculum_lifecycle_history(
    content_id_filter => (select (payload->>'content_id')::uuid from publication_results where key = 'module'),
    action_filter => 'content_published')
  where revision_id = (select (payload->>'revision_id')::uuid from publication_results where key = 'module')
    and previous_status = 'Draft' and resulting_status = 'Published'
    and actor_user_id = '82000000-0000-4000-8000-000000000002'
    and actor_organization_id = '81000000-0000-4000-8000-000000000001'), 1::bigint,
  'publication event records trusted actor, organization, target, and transition');
select throws_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'module')),
  '42501', 'active Admin Draft not found', 'repeated publication rejects a stale non-Draft target');

select set_config('request.jwt.claims', '{"sub":"82000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.list_published_modules() where id = (select (payload->>'content_id')::uuid from publication_results where key = 'module')), 1::bigint,
  'existing reader RPC exposes newly current-published content');
select is((select count(*) from public.module_revisions where id = (select (payload->>'revision_id')::uuid from publication_results where key = 'module')), 1::bigint,
  'Contributor reads the newly current-published revision');
select throws_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'module')),
  '42501', 'eligible Admin access required', 'Contributor cannot publish');
select throws_ok($$update public.modules set current_published_revision_id = gen_random_uuid()$$,
  '42501', 'permission denied for table modules', 'ordinary direct DML cannot corrupt current pointers');
select throws_ok($$update public.module_revisions set status = 'Draft'$$,
  '42501', 'permission denied for table module_revisions', 'ordinary direct DML cannot bypass publication');

select set_config('request.jwt.claims', '{"sub":"82000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into publication_results values ('invalid_material', public.create_contribution(
  'material', '{"title":"Material inválido","material_type":"Manual","source_url":"https://"}'::jsonb));
select throws_ok(format($sql$select public.publish_content_draft('material', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'invalid_material')),
  '23514', 'Draft is not valid for submission', 'publication rejects structurally invalid content');
select is((select status::text from public.material_revisions where id = (select (payload->>'revision_id')::uuid from publication_results where key = 'invalid_material')),
  'Draft', 'invalid content remains Draft');

insert into publication_results values ('module_two', public.create_contribution(
  'module', '{"axis_id":"a1000000-0000-4000-8000-000000000001","title":"Segundo módulo","description":"Dependencia.","learning_outcomes":[]}'::jsonb));
insert into publication_results values ('topic', public.create_contribution('program_topic', jsonb_build_object(
  'module_id', (select payload->>'content_id' from publication_results where key = 'module_two'), 'title', 'Tema dependiente')));
select throws_ok(format($sql$select public.publish_content_draft('program_topic', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'topic')),
  '23514', 'Program Topic requires a current-published Module', 'Program Topic cannot publish before its Module');
select lives_ok(format($sql$select public.publish_content_draft('module', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'module_two')), 'dependency Module publishes');
select lives_ok(format($sql$select public.publish_content_draft('program_topic', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'topic')), 'Program Topic publishes after its Module is current-published');

insert into publication_results values ('invalid_note', public.create_contribution('teaching_note', jsonb_build_object(
  'module_id', (select payload->>'content_id' from publication_results where key = 'module_two'), 'title', 'Nota sin fuente')));
select throws_ok(format($sql$select public.publish_content_draft('teaching_note', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'invalid_note')),
  '23514', 'Draft is not valid for submission', 'Teaching Note requires text, valid URL, or a Ready attachment');
insert into publication_results values ('reserved_attachment', public.reserve_attachment('teaching_note',
  (select (payload->>'revision_id')::uuid from publication_results where key = 'invalid_note'), 'nota.pdf', 'application/pdf', 50));
select throws_ok(format($sql$select public.publish_content_draft('teaching_note', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'invalid_note')),
  '23514', 'attachment metadata is not Ready', 'publication rejects incomplete attachment state');

insert into publication_results values ('revoked_material', public.create_contribution(
  'material', '{"title":"Material para revocación","material_type":"Informe"}'::jsonb));
reset role;
update public.memberships set role = 'Contributor' where user_id = '82000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"82000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok(format($sql$select public.publish_content_draft('material', %L)$sql$,
  (select payload->>'revision_id' from publication_results where key = 'revoked_material')),
  '42501', 'eligible Admin access required', 'live Admin role revocation immediately removes publication authority');

reset role;
select throws_ok(format($sql$update public.module_revisions set title = 'Mutado' where id = %L$sql$,
  (select payload->>'revision_id' from publication_results where key = 'module')),
  '55000', 'published revisions are immutable', 'published revision immutability remains enforced');
select throws_ok(format($sql$delete from public.module_instructors where module_revision_id = %L$sql$,
  (select payload->>'revision_id' from publication_results where key = 'module')),
  '55000', 'published revision relationships are immutable', 'published relationship immutability remains enforced');

insert into public.materials(id) values ('83000000-0000-4000-8000-000000000001');
insert into public.material_revisions(
  id, material_id, revision_number, status, title, material_type
) values (
  '83100000-0000-4000-8000-000000000001', '83000000-0000-4000-8000-000000000001', 1,
  'Draft', 'Puntero inválido', 'Manual'
);
select throws_ok($$update public.materials
  set current_published_revision_id = '83100000-0000-4000-8000-000000000001'
  where id = '83000000-0000-4000-8000-000000000001'$$,
  '23514', 'current revision must be Published', 'current pointer cannot reference a Draft');
select throws_ok($$update public.material_revisions
  set status = 'Submitted', submitted_at = now()
  where id = '83100000-0000-4000-8000-000000000001'$$,
  '55000', 'submission is inactive', 'direct Draft to Submitted transition is disabled');
select is((select current_published_revision_id from public.materials where id = '83000000-0000-4000-8000-000000000001'),
  null::uuid, 'rejected pointer mutation leaves identity consistent');

select is(extensions.dblink_connect(
  'dependency_setup',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'
), 'OK', 'concurrency fixture connection opens');
select is(extensions.dblink_connect(
  'dependency_publisher',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'
), 'OK', 'concurrent publication connection opens');
select is(extensions.dblink_connect(
  'dependency_mutator',
  'host=host.docker.internal port=55322 dbname=' || current_database() || ' user=postgres password=postgres'
), 'OK', 'concurrent dependency mutation connection opens');

select is(extensions.dblink_exec('dependency_setup', $setup$
  insert into public.organizations(id, name, is_active)
  values ('89000000-0000-4000-8000-000000000001', 'Red concurrente', true);
  insert into public.organization_domains(domain, organization_id)
  values ('concurrency.test', '89000000-0000-4000-8000-000000000001');
  insert into auth.users(id, email, email_confirmed_at)
  values ('89100000-0000-4000-8000-000000000001', 'admin@concurrency.test', now());
  insert into public.memberships(user_id, organization_id, role, is_active)
  values ('89100000-0000-4000-8000-000000000001', '89000000-0000-4000-8000-000000000001', 'Admin', true);
  insert into public.instructors(id)
  values ('89200000-0000-4000-8000-000000000001');
  insert into public.instructor_revisions(id, instructor_id, revision_number, status, name, published_at)
  values (
    '89210000-0000-4000-8000-000000000001', '89200000-0000-4000-8000-000000000001', 1,
    'Published', 'Dependencia concurrente', now()
  );
  update public.instructors
  set current_published_revision_id = '89210000-0000-4000-8000-000000000001'
  where id = '89200000-0000-4000-8000-000000000001';
  insert into public.modules(id, created_by)
  values ('89300000-0000-4000-8000-000000000001', '89100000-0000-4000-8000-000000000001');
  insert into public.module_revisions(
    id, module_id, revision_number, status, axis_id, title, description, created_by, contributor_organization_id
  ) values (
    '89310000-0000-4000-8000-000000000001', '89300000-0000-4000-8000-000000000001', 1, 'Draft',
    'a1000000-0000-4000-8000-000000000001', 'Publicación concurrente', 'Prueba de bloqueo.',
    '89100000-0000-4000-8000-000000000001', '89000000-0000-4000-8000-000000000001'
  );
  insert into public.module_instructors(module_revision_id, instructor_id)
  values ('89310000-0000-4000-8000-000000000001', '89200000-0000-4000-8000-000000000001');
$setup$), 'INSERT 0 1', 'committed concurrency fixture is created');

select is(extensions.dblink_exec('dependency_publisher', 'set role authenticated'), 'SET', 'publication session uses the application role');
select is(extensions.dblink_exec(
  'dependency_publisher',
  $claims$set request.jwt.claims = '{"sub":"89100000-0000-4000-8000-000000000001","role":"authenticated"}'$claims$
), 'SET', 'publication session receives authenticated claims');
select is(extensions.dblink_exec('dependency_mutator', 'set role authenticated'), 'SET',
  'concurrent archive session uses the application role');
select is(extensions.dblink_exec(
  'dependency_mutator',
  $claims$set request.jwt.claims = '{"sub":"89100000-0000-4000-8000-000000000001","role":"authenticated"}'$claims$
), 'SET', 'concurrent archive session receives authenticated claims');

create temporary table dependency_concurrency_sessions(name text primary key, pid integer);
insert into dependency_concurrency_sessions
select 'publisher', remote.pid
from extensions.dblink('dependency_publisher', 'select pg_backend_pid()') as remote(pid integer);
insert into dependency_concurrency_sessions
select 'mutator', remote.pid
from extensions.dblink('dependency_mutator', 'select pg_backend_pid()') as remote(pid integer);

savepoint dependency_concurrency_barrier;
lock table public.curriculum_lifecycle_events in access exclusive mode;
select is(extensions.dblink_send_query(
  'dependency_publisher',
  $$select public.publish_content_draft('module', '89310000-0000-4000-8000-000000000001')$$
), 1, 'publication starts in a separate transaction');

do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when exists (
      select 1 from pg_stat_activity activity
      where activity.pid = (select pid from dependency_concurrency_sessions where name = 'publisher')
        and activity.wait_event_type = 'Lock'
    );
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select ok(exists (
  select 1 from pg_stat_activity activity
  where activity.pid = (select pid from dependency_concurrency_sessions where name = 'publisher')
    and activity.wait_event_type = 'Lock'
), 'publication reaches its final event write after dependency validation');

select is(extensions.dblink_send_query(
  'dependency_mutator',
  $$select public.archive_governed_content('instructor', '89200000-0000-4000-8000-000000000001')$$
), 1, 'concurrent archival of the publication dependency starts');

do $$
declare attempt integer;
begin
  for attempt in 1..100 loop
    exit when (select pid from dependency_concurrency_sessions where name = 'publisher') = any (
      pg_blocking_pids((select pid from dependency_concurrency_sessions where name = 'mutator'))
    );
    perform pg_sleep(0.02);
  end loop;
end;
$$;
select ok(
  (select pid from dependency_concurrency_sessions where name = 'publisher') = any (
    pg_blocking_pids((select pid from dependency_concurrency_sessions where name = 'mutator'))
  ),
  'publication holds the authoritative dependency identity against concurrent archival'
);
select is(extensions.dblink_is_busy('dependency_publisher'), 1, 'publication remains open before commit');
select is(extensions.dblink_is_busy('dependency_mutator'), 1, 'dependency archival remains blocked before publication commit');

rollback to savepoint dependency_concurrency_barrier;

select is(
  (select result->>'status' from extensions.dblink_get_result('dependency_publisher') as remote(result jsonb)),
  'Published',
  'publication commits successfully after the test barrier is released'
);
select is(
  (select count(*) from extensions.dblink_get_result('dependency_mutator', false) as remote(result jsonb)),
  0::bigint,
  'dependency archival cannot succeed after the dependent publication commits'
);
select ok(extensions.dblink_error_message('dependency_mutator') like '%active current-published dependents block archival%',
  'serialized archival observes the newly current-published dependent');
select is(
  (select pointer from extensions.dblink(
    'dependency_setup',
    $$select current_published_revision_id from public.modules where id = '89300000-0000-4000-8000-000000000001'$$
  ) as remote(pointer uuid)),
  '89310000-0000-4000-8000-000000000001'::uuid,
  'concurrent publication leaves the current pointer consistent'
);
select ok(
  (select archived_at is null from extensions.dblink(
    'dependency_setup',
    $$select archived_at from public.instructors where id = '89200000-0000-4000-8000-000000000001'$$
  ) as remote(archived_at timestamptz)),
  'failed concurrent archival leaves the publication dependency active'
);
select is(
  (select event_count from extensions.dblink(
    'dependency_setup',
    $$select count(*) from public.curriculum_lifecycle_events
      where content_id = '89200000-0000-4000-8000-000000000001' and action = 'content_archived'$$
  ) as remote(event_count bigint)),
  0::bigint,
  'failed concurrent archival appends no successful lifecycle event'
);

select is(extensions.dblink_exec('dependency_setup', $cleanup$
  set session_replication_role = replica;
  delete from public.curriculum_lifecycle_events where content_id = '89300000-0000-4000-8000-000000000001';
  delete from public.module_instructors where module_revision_id = '89310000-0000-4000-8000-000000000001';
  delete from public.module_revisions where id = '89310000-0000-4000-8000-000000000001';
  delete from public.modules where id = '89300000-0000-4000-8000-000000000001';
  delete from public.instructor_revisions where id = '89210000-0000-4000-8000-000000000001';
  delete from public.instructors where id = '89200000-0000-4000-8000-000000000001';
  delete from public.memberships where user_id = '89100000-0000-4000-8000-000000000001';
  delete from public.organization_domains where domain = 'concurrency.test';
  delete from auth.users where id = '89100000-0000-4000-8000-000000000001';
  delete from public.organizations where id = '89000000-0000-4000-8000-000000000001';
  set session_replication_role = origin;
$cleanup$), 'SET', 'committed concurrency fixtures are removed');
select is(extensions.dblink_disconnect('dependency_mutator'), 'OK', 'dependency mutation connection closes');
select is(extensions.dblink_disconnect('dependency_publisher'), 'OK', 'publication connection closes');
select is(extensions.dblink_disconnect('dependency_setup'), 'OK', 'concurrency fixture connection closes');

select ok(strpos(pg_get_functiondef('public.publish_content_draft(public.curriculum_content_type,uuid)'::regprocedure), 'for update') > 0,
  'publication operation locks its revision and stable identity');
select is((select count(*) from pg_proc procedure join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public' and procedure.proname = 'publish_content_draft' and procedure.prosecdef), 1::bigint,
  'publication is one bounded security-definer database operation');

select * from finish();
rollback;
