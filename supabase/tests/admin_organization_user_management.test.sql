begin;
create extension if not exists pgtap with schema extensions;
select plan(61);

insert into public.organizations(id, name, is_active) values
  ('91000000-0000-4000-8000-000000000001', 'Organización Admin', true),
  ('91000000-0000-4000-8000-000000000002', 'Organización destino', true);
insert into public.organization_domains(domain, organization_id) values
  ('admin.test', '91000000-0000-4000-8000-000000000001'),
  ('miembros.test', '91000000-0000-4000-8000-000000000001'),
  ('destino.test', '91000000-0000-4000-8000-000000000002'),
  ('admin.actor.test', '91000000-0000-4000-8000-000000000002');
insert into auth.users(id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data) values
  ('92000000-0000-4000-8000-000000000001', 'admin@admin.actor.test', now(), '{"provider":"email","providers":["email"]}', null),
  ('92000000-0000-4000-8000-000000000002', 'reader@admin.test', now(), '{"provider":"email","providers":["email"]}', null),
  ('92000000-0000-4000-8000-000000000003', 'member@miembros.test', now(), '{"provider":"email","providers":["email"],"spec009_trusted_provisioning":"true"}', null),
  ('92000000-0000-4000-8000-000000000004', 'other@destino.test', now(), '{"provider":"email","providers":["email"],"spec009_trusted_provisioning":"true"}', null),
  ('92000000-0000-4000-8000-000000000005', 'new@miembros.test', now(), '{"provider":"email","providers":["email"],"spec009_trusted_provisioning":"true"}', null),
  ('92000000-0000-4000-8000-000000000006', 'untrusted@miembros.test', now(), '{"provider":"email","providers":["email"]}', '{"spec009_trusted_provisioning":"true"}'),
  ('92000000-0000-4000-8000-000000000007', 'unconfirmed@miembros.test', null, '{"provider":"google","providers":["google"]}', null),
  ('92000000-0000-4000-8000-000000000008', 'google@miembros.test', now(), '{"provider":"google","providers":["google"]}', null),
  ('92000000-0000-4000-8000-000000000009', 'legacy@miembros.test', now(), '{"provider":"email","providers":["email"]}', null);
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('92000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002', 'Admin', true),
  ('92000000-0000-4000-8000-000000000002', '91000000-0000-4000-8000-000000000001', 'Contributor', true),
  ('92000000-0000-4000-8000-000000000003', '91000000-0000-4000-8000-000000000002', 'Contributor', true),
  ('92000000-0000-4000-8000-000000000004', '91000000-0000-4000-8000-000000000002', 'Contributor', true),
  ('92000000-0000-4000-8000-000000000009', '91000000-0000-4000-8000-000000000001', 'Contributor', true);

set local role anon;
select throws_ok('select * from public.list_admin_organizations()', '42501', 'permission denied for function list_admin_organizations', 'anonymous cannot list organizations');
select throws_ok($$select public.admin_set_membership_role('92000000-0000-4000-8000-000000000002', 'Admin')$$,
  '42501', 'permission denied for function admin_set_membership_role', 'anonymous cannot change roles');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select throws_ok('select * from public.list_admin_organizations()', '42501', 'eligible Admin access required', 'Contributor cannot list organizations');
select throws_ok($$select public.admin_create_organization('Nope', array['nope.test'])$$,
  '42501', 'eligible Admin access required', 'Contributor cannot create organizations');
select throws_ok($$select public.admin_set_membership_role('92000000-0000-4000-8000-000000000002', 'Admin')$$,
  '42501', 'eligible Admin access required', 'Contributor cannot promote self');

select set_config('request.jwt.claims', '{}', true);
select throws_ok('select * from public.list_admin_memberships()', '42501', 'eligible Admin access required', 'unauthenticated caller cannot list memberships');

select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated","user_metadata":{"role":"Contributor"}}', true);
select is((select count(*) from public.list_admin_organizations()
  where organization_id in ('91000000-0000-4000-8000-000000000001', '91000000-0000-4000-8000-000000000002')),
  2::bigint, 'live persisted Admin can list global organizations');
select is((select array_to_string(approved_domains, ',') from public.list_admin_organizations() where organization_id = '91000000-0000-4000-8000-000000000001'),
  'admin.test,miembros.test', 'approved domains are listed in stable order');
select is((select member_count from public.list_admin_organizations() where organization_id = '91000000-0000-4000-8000-000000000001'),
  2::bigint, 'member counts derive from canonical memberships');
select is((select count(*) from public.list_admin_organization_members('91000000-0000-4000-8000-000000000001')),
  2::bigint, 'Admin can view organization members');
select is((select count(*) from public.list_admin_memberships('reader@', null, 'Contributor', true, 100, 0)),
  1::bigint, 'global membership list supports email, role, and status filters');
select throws_ok($$select * from public.list_admin_memberships(null, null, null, null, 101, 0)$$,
  '22023', 'membership page bounds are invalid', 'global user read is bounded');
select is(has_table_privilege('authenticated', 'public.access_administration_events', 'SELECT,INSERT,UPDATE,DELETE'), false,
  'authenticated clients have no access-administration audit privileges');

select throws_ok($$select public.admin_create_organization('   ', array['valid.test'])$$,
  '22023', 'organization name must contain 1 to 200 characters', 'empty organization names rejected');
select throws_ok($$select public.admin_create_organization('Invalid', array['invalid'])$$,
  '22023', 'invalid approved email domain', 'invalid domains rejected');
select throws_ok($$select public.admin_create_organization('Duplicate', array['DUP.test', ' dup.test '])$$,
  '23505', 'approved domains contain duplicates after normalization', 'normalized duplicate domains rejected');
select throws_ok($$select public.admin_create_organization('Missing domains', array[]::text[])$$,
  '22023', 'at least one approved domain is required', 'organization requires at least one approved domain');

select lives_ok($$select public.admin_create_organization('  Nueva organización  ', array[' NUEVA.TEST ', 'segundo.nueva.test'])$$,
  'organization and normalized domains created');
select is((select organization_name from public.list_admin_organizations() where organization_name = 'Nueva organización'),
  'Nueva organización', 'organization name is trimmed');
select is((select cardinality(approved_domains) from public.list_admin_organizations() where organization_name = 'Nueva organización'),
  2, 'organization can have multiple approved domains');
select throws_ok($$select public.admin_create_organization('Conflicto', array['ADMIN.TEST'])$$,
  '23505', 'duplicate key value violates unique constraint "organization_domains_pkey"', 'global domain uniqueness enforced');

select lives_ok($$select public.admin_update_organization_name('91000000-0000-4000-8000-000000000002', 'Destino actualizado')$$,
  'organization name updated');
select is((select organization_id from public.list_admin_organizations() where organization_name = 'Destino actualizado'), '91000000-0000-4000-8000-000000000002'::uuid,
  'organization canonical ID preserved during edit');
select lives_ok($$select public.admin_add_organization_domain('91000000-0000-4000-8000-000000000002', ' NUEVO.DESTINO.TEST ')$$,
  'approved domain added after normalization');
select ok(exists(select 1 from unnest((select approved_domains from public.list_admin_organizations()
  where organization_id = '91000000-0000-4000-8000-000000000002')) as domain_name
  where domain_name = 'nuevo.destino.test'), 'added domain stored lowercase and trimmed');
select lives_ok($$select public.admin_remove_organization_domain(' NUEVO.DESTINO.TEST ')$$, 'approved domain removed after normalization');
select ok(not exists(select 1 from unnest((select approved_domains from public.list_admin_organizations()
  where organization_id = '91000000-0000-4000-8000-000000000002')) as domain_name
  where domain_name = 'nuevo.destino.test'), 'domain removal takes effect');
select lives_ok($$select public.admin_set_organization_active('91000000-0000-4000-8000-000000000001', false)$$,
  'organization deactivated');
select is((select is_active from public.list_admin_memberships('reader@', null, 'Contributor', null, 100, 0)
  where user_id = '92000000-0000-4000-8000-000000000002'), true,
  'organization deactivation preserves member status');
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'inactive organization blocks eligibility');
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.admin_set_membership_role('92000000-0000-4000-8000-000000000009', 'Admin')$$,
  '42501', 'Auth identity is not trusted for membership', 'untrusted existing identity cannot be promoted');
select lives_ok($$select public.admin_set_membership_active('92000000-0000-4000-8000-000000000009', false)$$,
  'untrusted existing identity may be safely deactivated');
select is((select is_active from public.list_admin_memberships('legacy@', null, 'Contributor', null, 100, 0)
  where user_id = '92000000-0000-4000-8000-000000000009'), false, 'membership deactivation preserves other membership fields');
select lives_ok($$select public.admin_set_organization_active('91000000-0000-4000-8000-000000000001', true)$$,
  'organization reactivated');
select is((select is_active from public.list_admin_memberships('legacy@', null, 'Contributor', null, 100, 0)
  where user_id = '92000000-0000-4000-8000-000000000009'), false,
  'organization reactivation does not reactivate an inactive membership');

select throws_ok($$select public.admin_create_membership('92000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000002', 'Contributor', true)$$,
  '23514', 'Auth email domain is not approved for the target organization', 'domain-incompatible membership rejected');
select throws_ok($$select public.admin_create_membership('92000000-0000-4000-8000-000000000006', '91000000-0000-4000-8000-000000000001', 'Contributor', true)$$,
  '42501', 'Auth identity is not trusted for membership', 'untrusted confirmed identity rejected despite forged user metadata');
select throws_ok($$select public.admin_create_membership('92000000-0000-4000-8000-000000000007', '91000000-0000-4000-8000-000000000001', 'Contributor', true)$$,
  '42501', 'Auth identity is not trusted for membership', 'unconfirmed Google identity rejected');
select is((select count(*) from public.memberships where user_id in (
  '92000000-0000-4000-8000-000000000006', '92000000-0000-4000-8000-000000000007')),
  0::bigint, 'rejected Auth identities receive no membership authority');
select lives_ok($$select public.admin_create_membership('92000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000001', 'Contributor', true)$$,
  'domain-compatible membership created');
select lives_ok($$select public.admin_create_membership('92000000-0000-4000-8000-000000000008', '91000000-0000-4000-8000-000000000001', 'Contributor', true)$$,
  'confirmed Google identity can be reused');
select throws_ok($$select public.admin_create_membership('92000000-0000-4000-8000-000000000005', '91000000-0000-4000-8000-000000000001', 'Admin', true)$$,
  '23505', 'duplicate key value violates unique constraint "memberships_pkey"', 'one canonical membership per Auth user enforced');
select throws_ok($$select public.admin_reassign_membership('92000000-0000-4000-8000-000000000004', '91000000-0000-4000-8000-000000000001')$$,
  '23514', 'Auth email domain is not approved for the target organization', 'domain-incompatible reassignment rejected');
select lives_ok($$select public.admin_reassign_membership('92000000-0000-4000-8000-000000000003', '91000000-0000-4000-8000-000000000001')$$,
  'membership reassignment updates the canonical row');
select is((select count(*) from public.list_admin_organization_members('91000000-0000-4000-8000-000000000001')
  where user_id = '92000000-0000-4000-8000-000000000003'), 1::bigint, 'reassignment does not create a second membership');
select lives_ok($$select public.admin_set_membership_role('92000000-0000-4000-8000-000000000003', 'Admin')$$,
  'canonical Admin role can be assigned');
select throws_ok($$select public.admin_set_membership_role('92000000-0000-4000-8000-000000000003', 'SuperAdmin'::public.product_role)$$,
  '22P02', 'invalid input value for enum product_role: "SuperAdmin"', 'invalid persisted roles rejected');
select lives_ok($$select public.admin_set_membership_active('92000000-0000-4000-8000-000000000003', false)$$,
  'membership deactivated');
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'deactivated membership cannot satisfy eligibility');
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lives_ok($$select public.admin_set_membership_active('92000000-0000-4000-8000-000000000003', true)$$,
  'trusted identity membership reactivated');
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.current_access()), 1::bigint, 'reactivation restores eligibility only for the active member');
select set_config('request.jwt.claims', '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
reset role;
select is((select count(*) from public.access_administration_events
  where actor_user_id = '92000000-0000-4000-8000-000000000001'), 15::bigint,
  'organization, domain, and membership mutations append audit events');
select is((select count(*) from public.access_administration_events where actor_user_id = '92000000-0000-4000-8000-000000000001'
  and actor_organization_id = '91000000-0000-4000-8000-000000000002'), 15::bigint, 'audit actor and actor organization derive from live access');
select is((select count(*) from public.access_administration_events where actor_user_id = '92000000-0000-4000-8000-000000000001'
  and target_user_id = '92000000-0000-4000-8000-000000000003' and action = 'membership_organization_changed'
  and previous_state->>'organization_id' = '91000000-0000-4000-8000-000000000002'
  and resulting_state->>'organization_id' = '91000000-0000-4000-8000-000000000001'), 1::bigint, 'audit records bounded reassignment before/after state');
select throws_ok($$update public.access_administration_events set action = 'organization_updated'
  where actor_user_id = '92000000-0000-4000-8000-000000000001'$$,
  '55000', 'access-administration events are append-only', 'audit update rejected');
select throws_ok($$delete from public.access_administration_events
  where actor_user_id = '92000000-0000-4000-8000-000000000001'$$,
  '55000', 'access-administration events are append-only', 'audit deletion rejected');
select is((select count(*) from public.curriculum_lifecycle_events
  where actor_user_id = '92000000-0000-4000-8000-000000000001'), 0::bigint,
  'administration events remain separate from curriculum lifecycle history');
select ok((select relrowsecurity from pg_class where oid = 'public.access_administration_events'::regclass),
  'access-administration audit has RLS enabled');
select is((select count(*) from pg_policies where schemaname = 'public' and tablename = 'access_administration_events'),
  0::bigint, 'no direct client audit policy exists');
select is((select count(*) from pg_proc procedure join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public' and procedure.proname like 'admin_%'
  and procedure.prosecdef and array_to_string(procedure.proconfig, ',') like 'search_path=%'), 9::bigint,
  'all Admin mutation RPCs are hardened security-definer functions');
select ok(not has_function_privilege('anon', 'public.admin_create_organization(text,text[])', 'EXECUTE'),
  'anonymous cannot execute Admin RPCs');

reset role;
select * from finish();
rollback;
