-- LDR pivot, part 4: trip_plans — ideas or ad-hoc items attached to a trip.
--
-- `title` is always filled: for an item added from an idea it's a copy of the
-- idea's title at the time, and `idea_id` stays as the link. That way deleting
-- the idea later leaves the plan item with a name instead of a blank row.
--
-- Safe to re-run.

create table if not exists trip_plans (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  trip_id uuid not null,
  idea_id uuid,
  title text not null,
  done boolean not null default false,
  done_at timestamptz,
  position integer not null default 0,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint trip_plans_done_at_matches check (done = (done_at is not null)),
  -- Composite FKs: a plan can only point at a trip / idea in its own space.
  constraint trip_plans_trip_fk foreign key (trip_id, space_id)
    references trips (id, space_id) on delete cascade,
  constraint trip_plans_idea_fk foreign key (idea_id, space_id)
    references ideas (id, space_id) on delete set null (idea_id)
);

create index if not exists trip_plans_trip_position_idx on trip_plans (trip_id, position);
create index if not exists trip_plans_idea_id_idx on trip_plans (idea_id);
-- The same idea can't be added to one trip twice.
create unique index if not exists trip_plans_trip_idea_key on trip_plans (trip_id, idea_id) where idea_id is not null;

alter table trip_plans enable row level security;

drop policy if exists "members can view trip plans in their space" on trip_plans;
create policy "members can view trip plans in their space"
on trip_plans for select
to authenticated
using (is_space_member(space_id));

drop policy if exists "members can create trip plans in their space" on trip_plans;
create policy "members can create trip plans in their space"
on trip_plans for insert
to authenticated
with check (is_space_member(space_id) and created_by = auth.uid());

drop policy if exists "members can update trip plans in their space" on trip_plans;
create policy "members can update trip plans in their space"
on trip_plans for update
to authenticated
using (is_space_member(space_id))
with check (is_space_member(space_id));

drop policy if exists "members can delete trip plans in their space" on trip_plans;
create policy "members can delete trip plans in their space"
on trip_plans for delete
to authenticated
using (is_space_member(space_id));

grant select, insert, update, delete on trip_plans to authenticated;

notify pgrst, 'reload schema';
