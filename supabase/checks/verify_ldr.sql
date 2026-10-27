-- Verification for the LDR migrations (step 2). NOT a migration.
--
-- Run in the SQL Editor after the 20261027* migrations AND the seed file
-- (it finds the two of you by display code MEL / YIC). It impersonates each
-- of you in turn, records what it saw, deletes its two test postcards, and
-- ends by showing a table of checks — every row's `pass` should be true.
--
-- Safe to run repeatedly. It leaves no data behind.

drop table if exists pg_temp.ldr_checks;
drop table if exists pg_temp.ldr_who;
create temp table ldr_checks (at timestamptz default clock_timestamp(), check_name text, expected text, actual text);
create temp table ldr_who as
  select user_id, display_code from space_members
  where space_id = '264f1118-4348-45f7-947e-69fbcb24c97c' and display_code in ('MEL', 'YIC');
grant all on ldr_checks, ldr_who to authenticated;

do $$
begin
  if (select count(distinct display_code) from ldr_who) <> 2 then
    raise exception 'Couldn''t find both MEL and YIC in space_members — run supabase/seed/ldr_sample_data.sql first, and make sure both override ids are space members.';
  end if;
end
$$;

-- Test postcard ids (paths must be <space_id>/<postcard id>/...).
--   c0ffee00-…-01: YIC's postcard     c0ffee00-…-02: MEL's postcard
delete from postcards where id in ('c0ffee00-0000-4000-8000-000000000001', 'c0ffee00-0000-4000-8000-000000000002');

-- ── As YIC: send a postcard (with a bogus expires_at, which must be ignored) ──
set role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from ldr_who where display_code = 'YIC'), 'role', 'authenticated')::text, false),
       set_config('request.jwt.claim.sub', ((select user_id from ldr_who where display_code = 'YIC'))::text, false);
insert into postcards (id, space_id, sender_id, photo_path, expires_at) values (
  'c0ffee00-0000-4000-8000-000000000001', '264f1118-4348-45f7-947e-69fbcb24c97c', auth.uid(),
  '264f1118-4348-45f7-947e-69fbcb24c97c/c0ffee00-0000-4000-8000-000000000001/test.jpg', '2099-01-01');
insert into ldr_checks (check_name, expected, actual)
  select 'YIC sees own postcard', '1', count(*)::text from postcards where id = 'c0ffee00-0000-4000-8000-000000000001';

-- ── As MEL, before sending: locked ──
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from ldr_who where display_code = 'MEL'), 'role', 'authenticated')::text, false),
       set_config('request.jwt.claim.sub', ((select user_id from ldr_who where display_code = 'MEL'))::text, false);
insert into ldr_checks (check_name, expected, actual)
  select 'MEL sees YIC''s row in space_members', '1', count(*)::text from space_members
  where user_id = (select user_id from ldr_who where display_code = 'YIC');
insert into ldr_checks (check_name, expected, actual)
  select 'MEL sees all 5 seed trips', '5', count(*)::text from trips where id::text like '5eed%';
insert into ldr_checks (check_name, expected, actual)
  select 'LOCKED: MEL can''t see YIC''s postcard', '0', count(*)::text from postcards where id = 'c0ffee00-0000-4000-8000-000000000001';
insert into ldr_checks (check_name, expected, actual)
  select 'LOCKED: has_locked_postcard() for MEL', 'true', has_locked_postcard('264f1118-4348-45f7-947e-69fbcb24c97c')::text;
with u as (
  update space_members set home_city = 'HACKED'
  where user_id = (select user_id from ldr_who where display_code = 'YIC') returning 1
)
insert into ldr_checks (check_name, expected, actual)
  select 'MEL can''t edit YIC''s profile (rows changed)', '0', count(*)::text from u;

-- ── As MEL: send one → unlocked ──
insert into postcards (id, space_id, sender_id, photo_path) values (
  'c0ffee00-0000-4000-8000-000000000002', '264f1118-4348-45f7-947e-69fbcb24c97c', auth.uid(),
  '264f1118-4348-45f7-947e-69fbcb24c97c/c0ffee00-0000-4000-8000-000000000002/test.jpg');
insert into ldr_checks (check_name, expected, actual)
  select 'UNLOCKED: MEL sees YIC''s postcard', '1', count(*)::text from postcards where id = 'c0ffee00-0000-4000-8000-000000000001';
insert into ldr_checks (check_name, expected, actual)
  select 'UNLOCKED: has_locked_postcard() for MEL', 'false', has_locked_postcard('264f1118-4348-45f7-947e-69fbcb24c97c')::text;

-- ── Expire MEL's postcard → locked again, but MEL still sees own ──
reset role;
update postcards set expires_at = now() - interval '1 minute' where id = 'c0ffee00-0000-4000-8000-000000000002';
set role authenticated;
insert into ldr_checks (check_name, expected, actual)
  select 'EXPIRED own: MEL can''t see YIC''s postcard', '0', count(*)::text from postcards where id = 'c0ffee00-0000-4000-8000-000000000001';
insert into ldr_checks (check_name, expected, actual)
  select 'EXPIRED own: MEL still sees own postcard', '1', count(*)::text from postcards where id = 'c0ffee00-0000-4000-8000-000000000002';

-- ── Passport stats as of Oct 27 2026 (from the seed: 2 visits, 674 mi) ──
insert into ldr_checks (check_name, expected, actual)
  select 'Passport visits/miles as of 2026-10-27', '2 / 674',
    (s->>'visit_count') || ' / ' || (s->>'total_miles')
  from get_passport_stats('264f1118-4348-45f7-947e-69fbcb24c97c', '2026-10-27') s;

-- ── As a stranger (not a member): sees nothing ──
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, false),
       set_config('request.jwt.claim.sub', (gen_random_uuid())::text, false);
insert into ldr_checks (check_name, expected, actual)
  select 'Non-member sees no trips / ideas / postcards / members', '0',
    ((select count(*) from trips) + (select count(*) from ideas) + (select count(*) from postcards) + (select count(*) from space_members))::text;

-- ── Back to admin: lifetime came from the space setting, then clean up ──
reset role;
select set_config('request.jwt.claims', '', false), set_config('request.jwt.claim.sub', '', false);
insert into ldr_checks (check_name, expected, actual)
  select 'expires_at = created_at + postcard_ttl_hours (client value ignored)', 'true',
    (p.expires_at = p.created_at + make_interval(hours => s.postcard_ttl_hours))::text
  from postcards p join spaces s on s.id = p.space_id
  where p.id = 'c0ffee00-0000-4000-8000-000000000001';
insert into ldr_checks (check_name, expected, actual)
  select 'YIC''s profile unchanged', 'false', (home_city = 'HACKED')::text
  from space_members where user_id = (select user_id from ldr_who where display_code = 'YIC');
delete from postcards where id in ('c0ffee00-0000-4000-8000-000000000001', 'c0ffee00-0000-4000-8000-000000000002');

select check_name, expected, actual, expected = actual as pass from ldr_checks order by at;
