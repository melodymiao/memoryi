-- LDR pivot, part 1: member profiles + per-space postcard lifetime.
--
-- Profile info lives on space_members rather than a separate profiles table:
-- a "profile" here is "me in this couple", and space_members is already
-- exactly one row per person per space. A profiles table would need its own
-- RLS, a second join everywhere, and a way to stay in sync with membership.
--
-- Safe to re-run.

alter table space_members
  -- Short code shown in the UI, e.g. "MEL", "YIC".
  add column if not exists display_code text,
  add column if not exists home_city text,
  -- IATA code, e.g. "SFO".
  add column if not exists home_airport text,
  -- Used for weather.
  add column if not exists home_lat double precision,
  add column if not exists home_lng double precision;

alter table space_members drop constraint if exists space_members_display_code_format;
alter table space_members
  add constraint space_members_display_code_format check (display_code is null or display_code ~ '^[A-Z]{2,4}$');

alter table space_members drop constraint if exists space_members_home_airport_format;
alter table space_members
  add constraint space_members_home_airport_format check (home_airport is null or home_airport ~ '^[A-Z]{3}$');

alter table space_members drop constraint if exists space_members_home_coords_range;
alter table space_members
  add constraint space_members_home_coords_range check (
    (home_lat is null or home_lat between -90 and 90)
    and (home_lng is null or home_lng between -180 and 180)
  );

-- Members can now see each other's rows (the partner's display code and home
-- city are on every screen). Replaces the original "own row only" policy.
drop policy if exists "members can view their own membership" on space_members;
drop policy if exists "members can view members of their space" on space_members;
create policy "members can view members of their space"
on space_members for select
to authenticated
using (is_space_member(space_id));

-- You can edit your own profile only. The column-level grant below limits
-- *what* can be updated, so nobody can move themselves to another space or
-- rewrite user_id through this policy.
drop policy if exists "members can update their own profile" on space_members;
create policy "members can update their own profile"
on space_members for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant update (display_code, home_city, home_airport, home_lat, home_lng) on space_members to authenticated;

-- How long a postcard stays visible, in hours. The only place this lifetime
-- is defined — postcards.expires_at is computed from it by a trigger (see
-- 20261027120400_postcards.sql). Change it per space with plain SQL; there's
-- no client-facing update policy on spaces.
alter table spaces
  add column if not exists postcard_ttl_hours integer not null default 24;

alter table spaces drop constraint if exists spaces_postcard_ttl_positive;
alter table spaces
  add constraint spaces_postcard_ttl_positive check (postcard_ttl_hours > 0);

-- Shared trigger function for "one current row per person" tables
-- (statuses, favorite_songs) — keeps updated_at honest without trusting the
-- client's clock.
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

notify pgrst, 'reload schema';
