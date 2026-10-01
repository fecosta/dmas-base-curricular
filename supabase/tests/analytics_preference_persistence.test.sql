begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

insert into public.organizations(id, name, is_active) values
  ('a1000000-0000-4000-8000-000000000001', 'Organización analítica', true),
  ('a1000000-0000-4000-8000-000000000002', 'Organización inactiva', false);
insert into public.organization_domains(domain, organization_id) values
  ('analitica.test', 'a1000000-0000-4000-8000-000000000001'),
  ('apagada.test', 'a1000000-0000-4000-8000-000000000002');
insert into auth.users(id, email, email_confirmed_at) values
  ('a2000000-0000-4000-8000-000000000001', 'reader@analitica.test', now()),
  ('a2000000-0000-4000-8000-000000000002', 'admin@analitica.test', now()),
  ('a2000000-0000-4000-8000-000000000003', 'otro@analitica.test', now()),
  ('a2000000-0000-4000-8000-000000000004', 'inelegible@apagada.test', now()),
  ('a2000000-0000-4000-8000-000000000005', 'sinmembresia@analitica.test', now());
insert into public.memberships(user_id, organization_id, role, is_active) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Contributor', true),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Admin', true),
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'Contributor', true),
  ('a2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'Contributor', true);

-- Structure.
select ok(
  (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'analytics_preferences'),
  'analytics_preferences has RLS enabled');
select is(
  (select count(*) from pg_policies where schemaname = 'public'
    and tablename = 'analytics_preferences' and cmd <> 'SELECT'),
  0::bigint, 'no ordinary write policy exists on the preference table');
select is(
  (select confdeltype from pg_constraint where conrelid = 'public.analytics_preferences'::regclass and contype = 'f'),
  'c', 'the preference is deleted with the Auth identity');
select ok(
  (select prosecdef from pg_proc where oid = 'public.set_analytics_preference(boolean, text, text)'::regprocedure),
  'the preference writer is security definer');
select is(
  (select proconfig from pg_proc where oid = 'public.set_analytics_preference(boolean, text, text)'::regprocedure),
  array['search_path=""'], 'the preference writer pins an empty search_path');
-- No subject parameter: an Admin has no argument through which to write
-- another user's row.
select is(
  (select pronargs from pg_proc where oid = 'public.set_analytics_preference(boolean, text, text)'::regprocedure),
  3::smallint, 'the preference writer takes no subject argument');
select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like '%analytics_preference%'
      and p.oid <> 'public.set_analytics_preference(boolean, text, text)'::regprocedure),
  0::bigint, 'no additional public analytics-preference function exists');
-- service_role may read for privacy-rights fulfilment but holds no write
-- privilege, so no operator path can enable analytics for someone else.
select is(
  (select string_agg(distinct privilege_type, ',' order by privilege_type)
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'analytics_preferences' and grantee = 'service_role'),
  'SELECT', 'service_role may read the preference but not write it');
select is(
  (select string_agg(distinct privilege_type, ',' order by privilege_type)
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'analytics_preferences' and grantee = 'authenticated'),
  'SELECT', 'authenticated may read its own preference but not write it');

set local role anon;
select throws_ok('select * from public.analytics_preferences', '42501',
  'permission denied for table analytics_preferences', 'anonymous preference read denied');
select throws_ok($$select public.set_analytics_preference(true, '1.1', '1.1')$$, '42501',
  'permission denied for function set_analytics_preference', 'anonymous preference write denied');

set local role authenticated;
-- Absence means undecided.
select set_config('request.jwt.claims', '{"sub":"a2000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.analytics_preferences), 0::bigint,
  'a user with no decision has no row');

-- Direct table writes are unreachable even for the owner; the RPC is the only path.
select throws_ok($$insert into public.analytics_preferences(user_id, analytics_enabled, privacy_notice_version, consent_version) values (auth.uid(), true, '1.1', '1.1')$$,
  '42501', 'permission denied for table analytics_preferences', 'direct preference insert denied');
select throws_ok($$update public.analytics_preferences set analytics_enabled = true$$,
  '42501', 'permission denied for table analytics_preferences', 'direct preference update denied');
select throws_ok($$delete from public.analytics_preferences$$,
  '42501', 'permission denied for table analytics_preferences', 'direct preference delete denied');

-- Rejection persists false and remains distinguishable from undecided.
select is((select analytics_enabled from public.set_analytics_preference(false, '1.1', '1.1')), false,
  'rejection returns a persisted negative decision');
select is((select count(*) from public.analytics_preferences where user_id = auth.uid() and not analytics_enabled),
  1::bigint, 'rejection stores one row holding false');
select is((select privacy_notice_version from public.analytics_preferences where user_id = auth.uid()), '1.1',
  'the privacy notice version persists');
select is((select consent_version from public.analytics_preferences where user_id = auth.uid()), '1.1',
  'the consent version persists');
select ok((select analytics_decided_at is not null from public.analytics_preferences where user_id = auth.uid()),
  'the decision timestamp persists');

-- OFF -> ON, then ON -> OFF, on the same owned row.
select is((select analytics_enabled from public.set_analytics_preference(true, '1.1', '1.1')), true,
  'acceptance updates the same row to true');
select is((select count(*) from public.analytics_preferences where user_id = auth.uid()), 1::bigint,
  'changing the decision does not create a second row');
select is((select analytics_enabled from public.set_analytics_preference(false, '1.1', '1.1')), false,
  'revocation updates the row back to false');

-- Validation.
select throws_ok($$select public.set_analytics_preference(null, '1.1', '1.1')$$, '22023',
  'an explicit analytics decision is required', 'a null decision is refused');
select throws_ok($$select public.set_analytics_preference(true, '  ', '1.1')$$, '22023',
  'privacy and consent versions are required', 'a blank privacy notice version is refused');
select throws_ok($$select public.set_analytics_preference(true, '1.1', null)$$, '22023',
  'privacy and consent versions are required', 'a missing consent version is refused');

-- Cross-user isolation. Another eligible user in the same organization.
select set_config('request.jwt.claims', '{"sub":"a2000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.analytics_preferences), 0::bigint,
  'a peer cannot read another user''s preference');
select is((select analytics_enabled from public.set_analytics_preference(true, '1.1', '1.1')), true,
  'a peer writes only its own preference');
select is((select count(*) from public.analytics_preferences), 1::bigint,
  'the peer still sees only its own row');
select ok((select analytics_enabled from public.analytics_preferences), 'the peer reads back its own decision');

-- An Admin has no authority over another user's analytics choice.
select set_config('request.jwt.claims', '{"sub":"a2000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is(public.is_admin(), true, 'the Admin identity is recognized');
select is((select count(*) from public.analytics_preferences), 0::bigint,
  'an Admin cannot read other users'' analytics preferences');
select is((select analytics_enabled from public.set_analytics_preference(false, '1.1', '1.1')), false,
  'an Admin writes only its own preference');
select is((select count(*) from public.analytics_preferences), 1::bigint,
  'an Admin sees only its own row after writing');
reset role;
select is((select count(*) from public.analytics_preferences), 3::bigint,
  'three independent owned rows exist');
select is(
  (select analytics_enabled from public.analytics_preferences where user_id = 'a2000000-0000-4000-8000-000000000003'),
  true, 'the peer''s affirmative decision was not altered by the Admin');

-- Ineligible identities cannot record or read a decision.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a2000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select throws_ok($$select public.set_analytics_preference(true, '1.1', '1.1')$$, '42501',
  'eligible authenticated access required', 'an inactive-organization member cannot record a decision');
select set_config('request.jwt.claims', '{"sub":"a2000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select throws_ok($$select public.set_analytics_preference(true, '1.1', '1.1')$$, '42501',
  'eligible authenticated access required', 'an identity without membership cannot record a decision');

-- Revoked eligibility stops reads of an existing affirmative row on the next request.
reset role;
update public.memberships set is_active = false where user_id = 'a2000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a2000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.analytics_preferences), 0::bigint,
  'deactivated membership stops preference reads without a token refresh');
select throws_ok($$select public.set_analytics_preference(false, '1.1', '1.1')$$, '42501',
  'eligible authenticated access required', 'deactivated membership cannot change the decision');

-- Deleting the Auth identity removes the preference rather than orphaning it.
reset role;
delete from auth.users where id = 'a2000000-0000-4000-8000-000000000003';
select is((select count(*) from public.analytics_preferences where user_id = 'a2000000-0000-4000-8000-000000000003'),
  0::bigint, 'the preference is removed with the Auth identity');

select * from finish();
rollback;
