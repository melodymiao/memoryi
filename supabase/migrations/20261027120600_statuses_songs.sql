-- LDR pivot, part 7: one current status and one current favorite song per
-- person. Primary key (space_id, user_id) makes "set mine" an upsert.
--
-- Safe to re-run.

create table if not exists statuses (
  space_id uuid not null references spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  "text" text not null check (char_length("text") between 1 and 40),
  updated_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table if not exists favorite_songs (
  space_id uuid not null references spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null check (url ~ '^https?://'),
  title text,
  artist text,
  thumbnail_url text,
  updated_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

drop trigger if exists statuses_touch_updated_at on statuses;
create trigger statuses_touch_updated_at
before insert or update on statuses
for each row execute function touch_updated_at();

drop trigger if exists favorite_songs_touch_updated_at on favorite_songs;
create trigger favorite_songs_touch_updated_at
before insert or update on favorite_songs
for each row execute function touch_updated_at();

alter table statuses enable row level security;
alter table favorite_songs enable row level security;

-- Both of you see both; each of you only sets your own.
drop policy if exists "members can view statuses in their space" on statuses;
create policy "members can view statuses in their space"
on statuses for select
to authenticated
using (is_space_member(space_id));

drop policy if exists "members can set their own status" on statuses;
create policy "members can set their own status"
on statuses for insert
to authenticated
with check (is_space_member(space_id) and user_id = auth.uid());

drop policy if exists "members can update their own status" on statuses;
create policy "members can update their own status"
on statuses for update
to authenticated
using (user_id = auth.uid())
with check (is_space_member(space_id) and user_id = auth.uid());

drop policy if exists "members can clear their own status" on statuses;
create policy "members can clear their own status"
on statuses for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "members can view favorite songs in their space" on favorite_songs;
create policy "members can view favorite songs in their space"
on favorite_songs for select
to authenticated
using (is_space_member(space_id));

drop policy if exists "members can set their own favorite song" on favorite_songs;
create policy "members can set their own favorite song"
on favorite_songs for insert
to authenticated
with check (is_space_member(space_id) and user_id = auth.uid());

drop policy if exists "members can update their own favorite song" on favorite_songs;
create policy "members can update their own favorite song"
on favorite_songs for update
to authenticated
using (user_id = auth.uid())
with check (is_space_member(space_id) and user_id = auth.uid());

drop policy if exists "members can clear their own favorite song" on favorite_songs;
create policy "members can clear their own favorite song"
on favorite_songs for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on statuses to authenticated;
grant select, insert, update, delete on favorite_songs to authenticated;

notify pgrst, 'reload schema';
