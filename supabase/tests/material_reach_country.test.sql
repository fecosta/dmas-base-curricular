begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

-- SPEC-013: material reach (`country_or_scope`) is blank or approved on Draft
-- rows; unchanged legacy values carry over; direct Published inserts are exempt.

insert into public.organizations(id, name, is_active) values
  ('a1100000-0000-4000-8000-000000000001', 'Red alcance', true);
insert into public.organization_domains(domain, organization_id) values
  ('reach.test', 'a1100000-0000-4000-8000-000000000001');
insert into auth.users(id, email, email_confirmed_at) values
  ('a1200000-0000-4000-8000-000000000001', 'admin@reach.test', now()),
  ('a1200000-0000-4000-8000-000000000002', 'reader@reach.test', now());
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('a1200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', 'Admin', true),
  ('a1200000-0000-4000-8000-000000000002', 'a1100000-0000-4000-8000-000000000001', 'Contributor', true);

insert into public.materials(id, created_by) values
  ('a1300000-0000-4000-8000-000000000001', 'a1200000-0000-4000-8000-000000000001'),
  ('a1300000-0000-4000-8000-000000000002', 'a1200000-0000-4000-8000-000000000001'),
  ('a1300000-0000-4000-8000-000000000003', 'a1200000-0000-4000-8000-000000000001');

-- AC-14: direct Published inserts with off-list values are not subject to the rule.
select lives_ok($$insert into public.material_revisions(
  id, material_id, revision_number, status, title, material_type, country_or_scope, created_by,
  contributor_organization_id, published_at) values
  ('a1400000-0000-4000-8000-000000000001', 'a1300000-0000-4000-8000-000000000001', 1, 'Published',
   'Legado 1', 'Manual', 'Regional', 'a1200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', now()),
  ('a1400000-0000-4000-8000-000000000002', 'a1300000-0000-4000-8000-000000000002', 1, 'Published',
   'Legado 2', 'Manual', 'Latinoamérica', 'a1200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', now()),
  ('a1400000-0000-4000-8000-000000000003', 'a1300000-0000-4000-8000-000000000003', 1, 'Published',
   'Legado 3', 'Manual', 'Global', 'a1200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001', now())$$,
  'AC-14: owner inserts Published rows with off-list reach');
update public.materials set current_published_revision_id = 'a1400000-0000-4000-8000-000000000001' where id = 'a1300000-0000-4000-8000-000000000001';
update public.materials set current_published_revision_id = 'a1400000-0000-4000-8000-000000000002' where id = 'a1300000-0000-4000-8000-000000000002';
update public.materials set current_published_revision_id = 'a1400000-0000-4000-8000-000000000003' where id = 'a1300000-0000-4000-8000-000000000003';

create temporary table legacy_snapshot(id uuid primary key, row_data jsonb);
insert into legacy_snapshot select id, to_jsonb(revision) from public.material_revisions revision
  where id in ('a1400000-0000-4000-8000-000000000001', 'a1400000-0000-4000-8000-000000000002', 'a1400000-0000-4000-8000-000000000003');

create temporary table reach_results(key text primary key, payload jsonb);
grant all on reach_results to authenticated;
grant select on legacy_snapshot to authenticated;

-- AC-02 / AC-07: privileges and non-Admin denial.
select is((select count(*) from (values ('anon'), ('authenticated'), ('public')) roles(name)
  where has_function_privilege(roles.name, 'private.enforce_material_reach_country()', 'execute')), 0::bigint,
  'the private reach function is not executable by anon, authenticated or PUBLIC');
select is((select count(*) from pg_constraint where conrelid = 'public.material_revisions'::regclass
  and contype = 'c' and pg_get_constraintdef(oid) ilike '%country_or_scope%'), 0::bigint,
  'AC-08: no CHECK constraint over country_or_scope was added (no row validation or rewrite)');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1200000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok($$select public.create_contribution('material', '{"title":"X","material_type":"Manual","country_or_scope":"Perú"}')$$,
  '42501', 'eligible Admin access required', 'AC-07: non-Admin cannot create a material Draft');
select throws_ok($$select public.create_contribution('material', '{"title":"X","material_type":"Manual","country_or_scope":"Atlántida"}')$$,
  '42501', 'eligible Admin access required', 'AC-07: non-Admin is denied before any reach validation');
select throws_ok($$select public.update_contribution('material', gen_random_uuid(), '{"title":"X","material_type":"Manual"}')$$,
  '42501', 'eligible Admin access required', 'AC-07: non-Admin cannot update a material Draft');
select throws_ok($$select public.create_successor_draft('material', 'a1300000-0000-4000-8000-000000000001')$$,
  '42501', 'eligible Admin access required', 'AC-07: non-Admin cannot create a successor Draft');
select throws_ok($$select public.publish_content_draft('material', gen_random_uuid())$$,
  '42501', 'eligible Admin access required', 'AC-07: non-Admin cannot publish');
select throws_ok($$insert into public.material_revisions(id, material_id, revision_number, status, title, material_type, country_or_scope)
  values (gen_random_uuid(), 'a1300000-0000-4000-8000-000000000001', 9, 'Draft', 'D', 'Manual', 'Atlántida')$$,
  '42501', 'permission denied for table material_revisions', 'AC-02: authenticated cannot write material_revisions directly');
select throws_ok($$update public.material_revisions set country_or_scope = 'Perú'$$,
  '42501', 'permission denied for table material_revisions', 'AC-02: authenticated cannot update material_revisions directly');
set local role anon;
select throws_ok($$insert into public.material_revisions(id, material_id, revision_number, status, title, material_type, country_or_scope)
  values (gen_random_uuid(), 'a1300000-0000-4000-8000-000000000001', 9, 'Draft', 'D', 'Manual', 'Atlántida')$$,
  '42501', 'permission denied for table material_revisions', 'AC-02: anon cannot write material_revisions directly');

-- AC-02 / AC-06: create and update through the Admin RPCs.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1200000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.create_contribution('material', '{"title":"Fuera","material_type":"Manual","country_or_scope":"Latinoamérica"}')$$,
  '23514', 'material reach must be an approved country', 'AC-02: create rejects a regional value');
select throws_ok($$select public.create_contribution('material', '{"title":"Fuera","material_type":"Manual","country_or_scope":"Puerto Rico"}')$$,
  '23514', 'material reach must be an approved country', 'AC-02: create rejects an excluded territory');
select throws_ok($$select public.create_contribution('material', '{"title":"Fuera","material_type":"Manual","country_or_scope":"peru"}')$$,
  '23514', 'material reach must be an approved country', 'AC-02: matching is case-sensitive');
select throws_ok($$select public.create_contribution('material', '{"title":"Fuera","material_type":"Manual","country_or_scope":"Peru"}')$$,
  '23514', 'material reach must be an approved country', 'AC-02: matching is accent-sensitive');
select throws_ok($$select public.create_contribution('material', '{"title":"Fuera","material_type":"Manual","country_or_scope":"Colombia, Chile"}')$$,
  '23514', 'material reach must be an approved country', 'AC-02: create rejects a multi-country value');
select throws_ok($$select public.create_contribution('material', '{"title":"Fuera","material_type":"Manual","country_or_scope":" Perú"}')$$,
  '23514', 'material reach must be an approved country', 'AC-02: create does not trim an approved name');

insert into reach_results values
  ('approved', public.create_contribution('material', '{"title":"Aprobado","material_type":"Manual","country_or_scope":"Perú"}')),
  ('blank', public.create_contribution('material', '{"title":"Blanco","material_type":"Manual","country_or_scope":""}')),
  ('null', public.create_contribution('material', '{"title":"Nulo","material_type":"Manual"}')),
  ('space', public.create_contribution('material', '{"title":"Espacio","material_type":"Manual","country_or_scope":"   "}'));
select is((select count(*) from reach_results), 4::bigint, 'AC-06: create accepts an approved value, blank, NULL and whitespace-only');
select is((select country_or_scope from public.material_revisions where id = (select (payload->>'revision_id')::uuid from reach_results where key = 'approved')),
  'Perú', 'the approved value is stored exactly');

select lives_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Aprobado","material_type":"Manual","country_or_scope":"Chile"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'approved')), 'update changes an approved value to another approved value');
select throws_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Aprobado","material_type":"Manual","country_or_scope":"Atlántida"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'approved')),
  '23514', 'material reach must be an approved country', 'AC-02: update rejects an off-list value via a forged payload');
select is((select country_or_scope from public.material_revisions where id = (select (payload->>'revision_id')::uuid from reach_results where key = 'approved')),
  'Chile', 'a rejected update leaves the stored value untouched');
select lives_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Aprobado","material_type":"Manual"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'approved')), 'AC-06: update clears the value to NULL');
select lives_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Blanco","material_type":"Manual","country_or_scope":"Uruguay"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'blank')), 'AC-06: update sets a blank reach to an approved value');
select throws_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Blanco","material_type":"Manual","country_or_scope":"Regional"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'blank')),
  '23514', 'material reach must be an approved country', 'a first-revision Draft has no carry-over: a legacy value from elsewhere is rejected');

-- AC-03 / AC-04: successor Draft carries the legacy value; unchanged saves and publishes.
insert into reach_results values
  ('succ1', public.create_successor_draft('material', 'a1300000-0000-4000-8000-000000000001')),
  ('succ2', public.create_successor_draft('material', 'a1300000-0000-4000-8000-000000000002')),
  ('succ3', public.create_successor_draft('material', 'a1300000-0000-4000-8000-000000000003'));
select is((select country_or_scope from public.material_revisions where id = (select (payload->>'revision_id')::uuid from reach_results where key = 'succ1')),
  'Regional', 'AC-03: create_successor_draft copies the predecessor legacy value unchanged');
select lives_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Legado 1 v2","material_type":"Manual","country_or_scope":"Regional"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ1')), 'AC-03: an unchanged legacy value saves on the successor Draft');
select throws_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Legado 1 v2","material_type":"Manual","country_or_scope":"Latinoamérica"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ1')),
  '23514', 'material reach must be an approved country', 'AC-02: switching to a different legacy value from an older revision is rejected');
select lives_ok(format($sql$select public.publish_content_draft('material', %L)$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ1')), 'AC-04: publishing an unchanged-legacy Draft succeeds');
select is((select country_or_scope from public.material_revisions where id = (select (payload->>'revision_id')::uuid from reach_results where key = 'succ1')),
  'Regional', 'AC-04: the published revision keeps the legacy value exactly');
select is((select status::text from public.material_revisions where id = (select (payload->>'revision_id')::uuid from reach_results where key = 'succ1')),
  'Published', 'AC-04: the successor is Published');

-- AC-06 / C3: clearing a legacy value is allowed; restoring it afterwards is not.
select lives_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Legado 2 v2","material_type":"Manual","country_or_scope":""}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ2')), 'AC-06: clearing a stored legacy value to blank succeeds');
select throws_ok(format($sql$select public.update_contribution('material', %L, '{"title":"Legado 2 v2","material_type":"Manual","country_or_scope":"Latinoamérica"}')$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ2')),
  '23514', 'material reach must be an approved country', 'restoring a cleared legacy value is rejected: it is no longer unchanged');
select lives_ok(format($sql$select public.publish_content_draft('material', %L)$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ2')), 'a Draft with a cleared reach publishes');

-- R-4: the Draft -> Published transition may not introduce an off-list value.
reset role;
select throws_ok(format($sql$update public.material_revisions set status = 'Published', published_at = now(), country_or_scope = 'Atlántida' where id = %L$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ3')),
  '23514', 'material reach must be an approved country', 'R-4: a Draft cannot become Published with a changed off-list value');
select lives_ok(format($sql$update public.material_revisions set country_or_scope = 'Argentina' where id = %L$sql$,
  (select payload->>'revision_id' from reach_results where key = 'succ3')), 'the owner path still accepts an approved value on a Draft');
delete from public.material_revisions where id = (select (payload->>'revision_id')::uuid from reach_results where key = 'succ3');
select throws_ok($$insert into public.material_revisions(id, material_id, revision_number, status, title, material_type, country_or_scope, created_by, contributor_organization_id)
  values ('a1400000-0000-4000-8000-000000000009', 'a1300000-0000-4000-8000-000000000001', 9, 'Draft', 'D', 'Manual', 'Atlántida',
  'a1200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001')$$,
  '23514', 'material reach must be an approved country', 'R-2(b): a Draft insert with a value unlike the current published revision is rejected');
select lives_ok($$insert into public.material_revisions(id, material_id, revision_number, status, title, material_type, country_or_scope, created_by, contributor_organization_id)
  values ('a1400000-0000-4000-8000-00000000000a', 'a1300000-0000-4000-8000-000000000003', 9, 'Draft', 'D', 'Manual', 'Global',
  'a1200000-0000-4000-8000-000000000001', 'a1100000-0000-4000-8000-000000000001')$$,
  'R-2(b): a Draft insert equal to the current published value is accepted');
delete from public.material_revisions where id = 'a1400000-0000-4000-8000-00000000000a';

-- AC-05: Published revisions stay immutable.
select throws_ok($$update public.material_revisions set country_or_scope = 'Chile' where id = 'a1400000-0000-4000-8000-000000000003'$$,
  '55000', 'published revisions are immutable', 'AC-05: published revision mutation stays blocked');
select throws_ok($$delete from public.material_revisions where id = 'a1400000-0000-4000-8000-000000000003'$$,
  '55000', 'published revisions are immutable', 'AC-05: published revision deletion stays blocked');

-- AC-08: untouched legacy rows are byte-identical.
select is((select count(*) from legacy_snapshot s join public.material_revisions r on r.id = s.id where to_jsonb(r) = s.row_data), 3::bigint,
  'AC-08: legacy Published rows are byte-identical after every operation');

select * from finish();
rollback;
