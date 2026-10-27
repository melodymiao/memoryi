-- SAMPLE DATA for building the LDR UI against. NOT a migration — don't add
-- this to supabase/migrations/, and don't run it against data you care about
-- without reading it first.
--
-- Run in the SQL Editor after all of the 20261027* migrations. Safe to re-run:
-- every row uses a fixed id (all starting "5eed") and `on conflict do nothing`.
-- To remove it again, run the block at the bottom.
--
-- Needs both of you to be space members. By default it takes the space's two
-- members in the order they joined: first = MEL, second = YIC. If the space
-- has more than two member rows (e.g. one per device), set mel_override /
-- yic_override to the right user ids instead.
--
-- To find the right ids, run this on its own first and match rows to
-- devices by when they last signed in:
--   select m.user_id, m.created_at as joined, u.last_sign_in_at
--   from space_members m join auth.users u on u.id = m.user_id
--   where m.space_id = '264f1118-4348-45f7-947e-69fbcb24c97c'
--   order by u.last_sign_in_at desc nulls last;
-- Or, in a browser where the app is open, run this in the dev tools console
-- to print that device's id:
--   JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.endsWith("-auth-token")))).user.id
--
-- Also sets each member's profile (display code + home city/airport/coords),
-- overwriting what's there.

do $$
declare
  v_space uuid := '264f1118-4348-45f7-947e-69fbcb24c97c';
  mel_override uuid := 'eb0ba4c1-f0b7-4f11-a853-898cc651e205'; -- paste MEL's auth user id here if needed
  yic_override uuid := '4e12252d-991f-4299-93fb-90a32ff69445'; -- paste YIC's auth user id here if needed
  mel uuid;
  yic uuid;
  member_count int;
begin
  if mel_override is not null and yic_override is not null then
    mel := mel_override;
    yic := yic_override;
  else
    select count(*) into member_count from space_members where space_id = v_space;
    if member_count <> 2 then
      raise exception
        'Seed needs exactly 2 space members to tell MEL and YIC apart (found %). Either add the second person''s device as a member (see supabase/migrations/README.md), or set mel_override / yic_override at the top of this file.',
        member_count;
    end if;
    select user_id into mel from space_members where space_id = v_space order by created_at, id limit 1;
    select user_id into yic from space_members where space_id = v_space order by created_at, id offset 1 limit 1;
  end if;

  if not exists (select 1 from space_members where space_id = v_space and user_id = mel)
     or not exists (select 1 from space_members where space_id = v_space and user_id = yic) then
    raise exception
      'MEL (%) and YIC (%) must both be space members — insert a space_members row for whichever is missing (see supabase/migrations/README.md).',
      mel, yic;
  end if;
  if mel = yic then
    raise exception 'mel_override and yic_override are the same id.';
  end if;

  -- Profiles ----------------------------------------------------------------
  update space_members
  set display_code = 'MEL', home_city = 'San Francisco', home_airport = 'SFO',
      home_lat = 37.7749, home_lng = -122.4194
  where space_id = v_space and user_id = mel;

  update space_members
  set display_code = 'YIC', home_city = 'San Diego', home_airport = 'SAN',
      home_lat = 32.7157, home_lng = -117.1611
  where space_id = v_space and user_id = yic;

  -- Trips -------------------------------------------------------------------
  -- Today is Oct 27 2026 in the design: two past visits, Oct 31 is next.
  -- SFO <-> LAX is 337 miles. Times are local (PDT until Nov 1, then PST).
  insert into trips (
    id, space_id, traveler_user_id, airline, flight_number, flight_date,
    origin_code, dest_code, dest_city, depart_at, arrive_at,
    arrival_terminal, arrival_gate, flight_status, flight_data_updated_at,
    visit_start, visit_end, miles, created_by
  ) values
    ('5eed0000-0000-4000-a000-000000000101', v_space, mel, 'Alaska Airlines', 'AS 1381', '2026-10-03',
     'SFO', 'LAX', 'Los Angeles', '2026-10-03 09:15-07', '2026-10-03 10:45-07',
     '6', '64B', 'landed', '2026-10-03 10:50-07',
     '2026-10-03', '2026-10-05', 337, mel),
    ('5eed0000-0000-4000-a000-000000000102', v_space, yic, 'United Airlines', 'UA 2194', '2026-10-17',
     'LAX', 'SFO', 'San Francisco', '2026-10-17 18:05-07', '2026-10-17 19:35-07',
     '3', 'F12', 'landed', '2026-10-17 19:40-07',
     '2026-10-17', '2026-10-19', 337, yic),
    ('5eed0000-0000-4000-a000-000000000103', v_space, mel, 'Southwest Airlines', 'WN 1645', '2026-10-31',
     'SFO', 'LAX', 'Los Angeles', '2026-10-31 16:20-07', '2026-10-31 17:45-07',
     '1', '9', 'on time', '2026-10-27 08:00-07',
     '2026-10-31', '2026-11-02', 337, mel),
    ('5eed0000-0000-4000-a000-000000000104', v_space, yic, 'Delta Air Lines', 'DL 1708', '2026-11-13',
     'LAX', 'SFO', 'San Francisco', '2026-11-13 19:00-08', '2026-11-13 20:25-08',
     '2', 'D5', 'scheduled', null,
     '2026-11-13', '2026-11-15', 337, yic),
    ('5eed0000-0000-4000-a000-000000000105', v_space, mel, 'Alaska Airlines', 'AS 1383', '2026-12-05',
     'SFO', 'LAX', 'Los Angeles', '2026-12-05 08:30-08', '2026-12-05 09:55-08',
     '6', '68A', 'scheduled', null,
     '2026-12-05', '2026-12-07', 337, mel)
  on conflict (id) do nothing;

  -- Ideas -------------------------------------------------------------------
  insert into ideas (
    id, space_id, title, location_label, type, address, latitude, longitude,
    source_url, starts_on, ends_on, season_label, created_by
  ) values
    -- Bay
    ('5eed0000-0000-4000-a000-000000000201', v_space, 'Tartine Manufactory', 'Bay', 'eat',
     '595 Alabama St, San Francisco, CA', 37.7618, -122.4115, null, null, null, null, mel),
    ('5eed0000-0000-4000-a000-000000000202', v_space, 'Lands End trail', 'Bay', 'go',
     'Lands End Trail, San Francisco, CA', 37.7804, -122.5050,
     'https://www.tiktok.com/search?q=lands%20end%20trail', null, null, null, mel),
    ('5eed0000-0000-4000-a000-000000000203', v_space, 'Cherry blossoms at the Japanese Tea Garden', 'Bay', 'go',
     '75 Hagiwara Tea Garden Dr, San Francisco, CA', 37.7702, -122.4703, null, null, null, 'Spring', yic),
    -- LA
    ('5eed0000-0000-4000-a000-000000000204', v_space, 'Holiday lights at Descanso Gardens', 'LA', 'do',
     '1418 Descanso Dr, La Cañada Flintridge, CA', 34.2016, -118.2108, null, '2026-11-20', '2027-01-04', null, yic),
    ('5eed0000-0000-4000-a000-000000000205', v_space, 'Sun Nong Dan', 'LA', 'eat',
     '3470 W 6th St, Los Angeles, CA', 34.0637, -118.2973, null, null, null, null, yic),
    ('5eed0000-0000-4000-a000-000000000206', v_space, 'Griffith Observatory at sunset', 'LA', 'go',
     '2800 E Observatory Rd, Los Angeles, CA', 34.1184, -118.3004, null, null, null, null, mel),
    ('5eed0000-0000-4000-a000-000000000207', v_space, 'Hotel Figueroa staycation', 'LA', 'stay',
     '939 S Figueroa St, Los Angeles, CA', 34.0451, -118.2636, null, null, null, null, mel),
    -- SD
    ('5eed0000-0000-4000-a000-000000000208', v_space, 'La Jolla Cove', 'SD', 'go',
     '1100 Coast Blvd, La Jolla, CA', 32.8503, -117.2713, null, null, null, null, yic),
    ('5eed0000-0000-4000-a000-000000000209', v_space, 'Tacos El Gordo', 'SD', 'eat',
     '689 H St, Chula Vista, CA', 32.6295, -117.0717,
     'https://www.tiktok.com/search?q=tacos%20el%20gordo', null, null, null, yic),
    ('5eed0000-0000-4000-a000-000000000210', v_space, 'Balboa Park museums', 'SD', 'do',
     '1549 El Prado, San Diego, CA', 32.7341, -117.1446, null, null, null, null, mel),
    -- Anywhere
    ('5eed0000-0000-4000-a000-000000000211', v_space, 'Make dumplings from scratch', 'Anywhere', 'do',
     null, null, null, null, null, null, null, mel),
    ('5eed0000-0000-4000-a000-000000000212', v_space, 'Film photo walk', 'Anywhere', 'do',
     null, null, null, null, null, null, null, yic)
  on conflict (id) do nothing;

  insert into idea_favorites (idea_id, user_id, space_id) values
    ('5eed0000-0000-4000-a000-000000000201', mel, v_space),
    ('5eed0000-0000-4000-a000-000000000203', mel, v_space),
    ('5eed0000-0000-4000-a000-000000000204', mel, v_space),
    ('5eed0000-0000-4000-a000-000000000204', yic, v_space),
    ('5eed0000-0000-4000-a000-000000000205', yic, v_space),
    ('5eed0000-0000-4000-a000-000000000208', mel, v_space),
    ('5eed0000-0000-4000-a000-000000000208', yic, v_space)
  on conflict do nothing;

  -- Trip plans --------------------------------------------------------------
  -- Oct 17 (past, SF): both done. Oct 31 (next, LA): two ideas + one ad-hoc.
  insert into trip_plans (id, space_id, trip_id, idea_id, title, done, done_at, position, created_by) values
    ('5eed0000-0000-4000-a000-000000000301', v_space, '5eed0000-0000-4000-a000-000000000102',
     '5eed0000-0000-4000-a000-000000000202', 'Lands End trail', true, '2026-10-18 11:30-07', 0, yic),
    ('5eed0000-0000-4000-a000-000000000302', v_space, '5eed0000-0000-4000-a000-000000000102',
     '5eed0000-0000-4000-a000-000000000201', 'Tartine Manufactory', true, '2026-10-18 09:00-07', 1, mel),
    ('5eed0000-0000-4000-a000-000000000303', v_space, '5eed0000-0000-4000-a000-000000000103',
     '5eed0000-0000-4000-a000-000000000205', 'Sun Nong Dan', false, null, 0, yic),
    ('5eed0000-0000-4000-a000-000000000304', v_space, '5eed0000-0000-4000-a000-000000000103',
     '5eed0000-0000-4000-a000-000000000206', 'Griffith Observatory at sunset', false, null, 1, mel),
    ('5eed0000-0000-4000-a000-000000000305', v_space, '5eed0000-0000-4000-a000-000000000103',
     null, 'Pick up Halloween costumes', false, null, 2, mel)
  on conflict (id) do nothing;

  -- Status + fave song ------------------------------------------------------
  insert into statuses (space_id, user_id, "text") values
    (v_space, mel, '4 days till LA'),
    (v_space, yic, 'cleaning the apartment')
  on conflict (space_id, user_id) do nothing;

  insert into favorite_songs (space_id, user_id, url, title, artist, thumbnail_url) values
    (v_space, mel, 'https://music.youtube.com/search?q=LANY+Malibu+Nights', 'Malibu Nights', 'LANY', null),
    (v_space, yic, 'https://music.youtube.com/search?q=Rex+Orange+County+Loving+Is+Easy', 'Loving Is Easy', 'Rex Orange County', null)
  on conflict (space_id, user_id) do nothing;
end
$$;

-- ---------------------------------------------------------------------------
-- Remove the sample data (uncomment and run). Deletes only the fixed seed ids
-- above, plus the two statuses / fave songs it set. Profiles are left as-is.
-- ---------------------------------------------------------------------------
-- delete from trip_plans where id::text like '5eed0000-%';
-- delete from idea_favorites where idea_id::text like '5eed0000-%';
-- delete from ideas where id::text like '5eed0000-%';
-- delete from trips where id::text like '5eed0000-%';
-- delete from statuses where space_id = '264f1118-4348-45f7-947e-69fbcb24c97c'
--   and "text" in ('4 days till LA', 'cleaning the apartment');
-- delete from favorite_songs where space_id = '264f1118-4348-45f7-947e-69fbcb24c97c'
--   and url like 'https://music.youtube.com/search?q=%';
