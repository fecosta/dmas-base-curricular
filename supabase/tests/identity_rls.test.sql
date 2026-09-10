begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

insert into public.organizations (id, name, is_active) values
  ('10000000-0000-0000-0000-000000000001', 'Organización uno', true),
  ('10000000-0000-0000-0000-000000000002', 'Organización dos', true),
  ('10000000-0000-0000-0000-000000000003', 'Organización inactiva', false);
insert into public.organization_domains (domain, organization_id) values
  ('partner.test', '10000000-0000-0000-0000-000000000001'),
  ('second.test', '10000000-0000-0000-0000-000000000002'),
  ('inactive.test', '10000000-0000-0000-0000-000000000003');
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('20000000-0000-0000-0000-000000000001', 'contributor@PARTNER.TEST', now(), '{"role":"Admin"}'),
  ('20000000-0000-0000-0000-000000000002', 'admin@partner.test', now(), '{}'),
  ('20000000-0000-0000-0000-000000000003', 'outsider@unknown.test', now(), '{}'),
  ('20000000-0000-0000-0000-000000000004', 'inactive@partner.test', now(), '{}'),
  ('20000000-0000-0000-0000-000000000005', 'member@inactive.test', now(), '{}'),
  ('20000000-0000-0000-0000-000000000006', 'missing@partner.test', now(), '{}'),
  ('20000000-0000-0000-0000-000000000007', 'unverified@partner.test', null, '{}'),
  ('20000000-0000-0000-0000-000000000008', 'mismatch@second.test', now(), '{}'),
  ('20000000-0000-0000-0000-000000000009', 'suffix@partner.test.attacker.test', now(), '{}'),
  ('20000000-0000-0000-0000-000000000010', 'subdomain@sub.partner.test', now(), '{}');
insert into public.memberships (user_id, organization_id, role, is_active)
select id,
  case when id = '20000000-0000-0000-0000-000000000005' then '10000000-0000-0000-0000-000000000003'::uuid
       else '10000000-0000-0000-0000-000000000001'::uuid end,
  case when id = '20000000-0000-0000-0000-000000000002' then 'Admin'::public.product_role else 'Contributor'::public.product_role end,
  id <> '20000000-0000-0000-0000-000000000004'
from auth.users where id::text like '20000000-%' and id <> '20000000-0000-0000-0000-000000000006';

set local role anon;
select throws_ok('select * from public.memberships', '42501', 'permission denied for table memberships', 'anonymous membership read denied');
select throws_ok('select * from public.organizations', '42501', 'permission denied for table organizations', 'anonymous organization read denied');
select throws_ok('select * from public.organization_domains', '42501', 'permission denied for table organization_domains', 'anonymous domain read denied');
select throws_ok('select * from public.current_access()', '42501', 'permission denied for function current_access', 'anonymous RPC denied');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated","user_metadata":{"role":"Admin"}}', true);
select is((select count(*) from public.current_access()), 1::bigint, 'eligible verified uppercase-domain identity allowed');
select is((select role::text from public.current_access()), 'Contributor', 'metadata cannot grant Admin');
select is(public.is_admin(), false, 'Contributor cannot obtain Admin authority');
select is((select count(*) from public.memberships), 1::bigint, 'only own membership visible');
select is((select count(*) from public.organizations), 1::bigint, 'only own organization visible');
select is((select count(*) from public.organization_domains), 1::bigint, 'only own domains visible');
select is((select count(*) from public.memberships where user_id = '20000000-0000-0000-0000-000000000002'), 0::bigint, 'same-org other user hidden');
select throws_ok($$update public.memberships set role = 'Admin'$$, '42501', 'permission denied for table memberships', 'self-promotion denied');
select throws_ok($$update public.memberships set organization_id = '10000000-0000-0000-0000-000000000002'$$, '42501', 'permission denied for table memberships', 'organization transfer denied');
select throws_ok($$insert into public.memberships values (auth.uid(), '10000000-0000-0000-0000-000000000001', 'Admin', true)$$, '42501', 'permission denied for table memberships', 'membership insertion denied');
select throws_ok($$delete from public.memberships$$, '42501', 'permission denied for table memberships', 'membership deletion denied');
select throws_ok($$update public.organizations set is_active = true$$, '42501', 'permission denied for table organizations', 'organization reactivation denied');
select throws_ok($$insert into public.organization_domains values ('attacker.test', '10000000-0000-0000-0000-000000000001')$$, '42501', 'permission denied for table organization_domains', 'allowlist mutation denied');

select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is(public.is_admin(), true, 'persisted eligible Admin recognized');
select throws_ok($$update public.memberships set role = 'Admin'$$, '42501', 'permission denied for table memberships', 'Admin session cannot provision roles');

select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated","email":"forged@partner.test"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'unknown domain denied even with forged email claim');
select is((select count(*) from public.memberships), 0::bigint, 'ineligible identity reads no memberships');
select is((select count(*) from public.organizations), 0::bigint, 'ineligible identity reads no organizations');
select is((select count(*) from public.organization_domains), 0::bigint, 'ineligible identity reads no domains');

select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000004"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'inactive membership denied');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000005"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'inactive organization denied');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000006"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'missing membership denied');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000007"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'unverified email denied');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000008"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'approved domain from another organization denied');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000009"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'domain suffix spoof denied');
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000010"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'unapproved subdomain denied');

reset role;
update public.memberships set is_active = false where user_id = '20000000-0000-0000-0000-000000000002';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is(public.is_admin(), false, 'Admin deactivation takes effect without token refresh');
reset role;
update auth.users set email = 'changed@unknown.test' where id = '20000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","email":"contributor@partner.test"}', true);
select is((select count(*) from public.current_access()), 0::bigint, 'live email change overrides stale JWT');
reset role;
update auth.users set email = 'contributor@partner.test', banned_until = now() + interval '1 hour' where id = '20000000-0000-0000-0000-000000000001';
set local role authenticated;
select is((select count(*) from public.current_access()), 0::bigint, 'banned user denied with an existing token');
reset role;
update auth.users set banned_until = null where id = '20000000-0000-0000-0000-000000000001';
delete from public.organization_domains where domain = 'partner.test';
set local role authenticated;
select is((select count(*) from public.current_access()), 0::bigint, 'domain revocation takes effect immediately');

reset role;
select is((select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('organizations', 'organization_domains', 'memberships') and c.relrowsecurity), 3::bigint, 'all identity tables have RLS enabled');
select is((select count(*) from pg_policies where schemaname = 'public' and cmd <> 'SELECT'), 0::bigint, 'no ordinary write policies');
select is((select prosecdef from pg_proc where oid = 'public.current_access()'::regprocedure), false, 'public wrapper is security invoker');
select * from finish();
rollback;
