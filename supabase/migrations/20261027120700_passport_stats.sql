-- LDR pivot, part 8: Passport stats, derived from trips (nothing stored).
--
-- A function rather than a view because the numbers depend on "as of" — pass
-- the client's local date so a visit that starts today counts today, not
-- whenever UTC midnight happens.
--
--   Counts every trip with visit_start <= as_of; a visit in progress counts
--   up to as_of. days_together is distinct calendar days across all visits
--   (inclusive of both ends), so overlapping trips aren't double-counted.
--
-- Runs as the caller (not security definer), so trips RLS applies: a
-- non-member just gets zeros.
--
-- Returns:
--   { total_miles, visit_count, days_together, distinct_cities,
--     visits_per_city: [{ city, visits }, ...] }  -- most-visited first
--
-- Safe to re-run.

create or replace function get_passport_stats(target_space_id uuid, as_of date default current_date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with counted as (
    select *
    from trips
    where space_id = target_space_id
      and visit_start <= as_of
  ),
  days as (
    select count(distinct d)::int as n
    from counted c,
      generate_series(c.visit_start::timestamp, least(c.visit_end, as_of)::timestamp, interval '1 day') d
  ),
  cities as (
    select dest_city as city, count(*)::int as visits
    from counted
    group by dest_city
  )
  select jsonb_build_object(
    'total_miles', coalesce((select sum(miles) from counted), 0),
    'visit_count', (select count(*) from counted),
    'days_together', (select n from days),
    'distinct_cities', (select count(*) from cities),
    'visits_per_city', coalesce(
      (select jsonb_agg(jsonb_build_object('city', city, 'visits', visits) order by visits desc, city) from cities),
      '[]'::jsonb
    )
  );
$$;

grant execute on function get_passport_stats(uuid, date) to authenticated;
