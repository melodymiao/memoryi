-- LDR pivot, part 2: trips (one row per visit) + entries.trip_id.
--
-- Nothing derived is stored: upcoming/past comes from visit dates compared to
-- the client's local date, and "trip #3" is the row's position when ordered by
-- visit_start (see src/data/trips.ts).
--
-- Safe to re-run.

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  -- Who is flying.
  traveler_user_id uuid not null references auth.users (id),
  -- Flight details are nullable so a visit can be logged before it's booked.
  airline text,
  flight_number text,
  flight_date date,
  origin_code text check (origin_code ~ '^[A-Z]{3}$'),
  dest_code text check (dest_code ~ '^[A-Z]{3}$'),
  dest_city text not null,
  depart_at timestamptz,
  arrive_at timestamptz,
  -- Pickup info only, filled in later by a flight lookup.
  arrival_terminal text,
  arrival_gate text,
  -- Free text from the lookup, e.g. "on time", "delayed".
  flight_status text,
  flight_data_updated_at timestamptz,
  -- The visit itself — what the calendar and "days together" use.
  visit_start date not null,
  visit_end date not null,
  miles integer not null default 0 check (miles >= 0),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint trips_visit_range check (visit_end >= visit_start),
  -- Target for composite FKs from child tables (trip_plans, entries) so a
  -- child row can only ever point at a trip in its own space.
  constraint trips_id_space_id_key unique (id, space_id)
);

create index if not exists trips_space_visit_start_idx on trips (space_id, visit_start);

-- Photos can belong to a trip (stamps + scrapbook pages). Deleting a trip
-- only clears the link — photos are permanent.
alter table entries add column if not exists trip_id uuid;
alter table entries drop constraint if exists entries_trip_fk;
alter table entries
  add constraint entries_trip_fk foreign key (trip_id, space_id)
  references trips (id, space_id) on delete set null (trip_id);
create index if not exists entries_trip_id_idx on entries (trip_id);

alter table trips enable row level security;

drop policy if exists "members can view trips in their space" on trips;
create policy "members can view trips in their space"
on trips for select
to authenticated
using (is_space_member(space_id));

-- The traveler has to be a member of the same space (one of the two of you).
drop policy if exists "members can create trips in their space" on trips;
create policy "members can create trips in their space"
on trips for insert
to authenticated
with check (
  is_space_member(space_id)
  and created_by = auth.uid()
  and exists (
    select 1 from space_members m
    where m.space_id = trips.space_id and m.user_id = trips.traveler_user_id
  )
);

drop policy if exists "members can update trips in their space" on trips;
create policy "members can update trips in their space"
on trips for update
to authenticated
using (is_space_member(space_id))
with check (
  is_space_member(space_id)
  and exists (
    select 1 from space_members m
    where m.space_id = trips.space_id and m.user_id = trips.traveler_user_id
  )
);

drop policy if exists "members can delete trips in their space" on trips;
create policy "members can delete trips in their space"
on trips for delete
to authenticated
using (is_space_member(space_id));

grant select, insert, update, delete on trips to authenticated;

notify pgrst, 'reload schema';
