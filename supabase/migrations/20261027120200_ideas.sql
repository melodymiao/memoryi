-- LDR pivot, part 3: ideas (the Plans list) + per-person favorites, and a
-- one-time copy of existing cards into ideas.
--
-- Why a new table instead of renaming cards: the current Cards / Shuffle /
-- Add Card screens still read and write `cards`, and this step doesn't touch
-- UI — a rename would break them immediately. And about half of cards'
-- columns (status, the fixed categories check, legacy category/tags,
-- price_level, source_person/screenshot, photos) don't belong in the new
-- model. `cards` stays as-is, as the archive; entries.source_card_id still
-- points at it.
--
-- Safe to re-run — and re-running is how cards created in the old UI after
-- this migration get copied over (the copy skips cards it already has).

create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  title text not null,
  -- Free text region, e.g. "Bay", "LA", "SD", "Anywhere".
  location_label text not null default 'Anywhere',
  type text not null check (type in ('eat', 'do', 'go', 'stay')),
  address text,
  -- For "within X miles"; null when the idea isn't a specific place.
  latitude double precision,
  longitude double precision,
  -- Where it was found, e.g. a TikTok / Reel link.
  source_url text,
  -- Events and seasonal ideas. Any combination may be set.
  starts_on date,
  ends_on date,
  -- Free text, e.g. "Spring".
  season_label text,
  -- The card this idea was copied from, if any. Unique so the copy below can
  -- be re-run without duplicating.
  legacy_card_id uuid unique references cards (id) on delete set null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint ideas_date_range check (starts_on is null or ends_on is null or ends_on >= starts_on),
  constraint ideas_id_space_id_key unique (id, space_id)
);

create index if not exists ideas_space_created_at_idx on ideas (space_id, created_at desc);
create index if not exists ideas_space_location_idx on ideas (space_id, location_label);

-- One row per (idea, person) heart, so each of you shows separately.
create table if not exists idea_favorites (
  idea_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid not null references spaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id),
  constraint idea_favorites_idea_fk foreign key (idea_id, space_id)
    references ideas (id, space_id) on delete cascade
);

create index if not exists idea_favorites_space_id_idx on idea_favorites (space_id);

alter table ideas enable row level security;
alter table idea_favorites enable row level security;

drop policy if exists "members can view ideas in their space" on ideas;
create policy "members can view ideas in their space"
on ideas for select
to authenticated
using (is_space_member(space_id));

drop policy if exists "members can create ideas in their space" on ideas;
create policy "members can create ideas in their space"
on ideas for insert
to authenticated
with check (is_space_member(space_id) and created_by = auth.uid());

drop policy if exists "members can update ideas in their space" on ideas;
create policy "members can update ideas in their space"
on ideas for update
to authenticated
using (is_space_member(space_id))
with check (is_space_member(space_id));

drop policy if exists "members can delete ideas in their space" on ideas;
create policy "members can delete ideas in their space"
on ideas for delete
to authenticated
using (is_space_member(space_id));

-- Both of you see both hearts; each of you only adds/removes your own.
drop policy if exists "members can view favorites in their space" on idea_favorites;
create policy "members can view favorites in their space"
on idea_favorites for select
to authenticated
using (is_space_member(space_id));

drop policy if exists "members can favorite ideas in their space" on idea_favorites;
create policy "members can favorite ideas in their space"
on idea_favorites for insert
to authenticated
with check (is_space_member(space_id) and user_id = auth.uid());

drop policy if exists "members can remove their own favorites" on idea_favorites;
create policy "members can remove their own favorites"
on idea_favorites for delete
to authenticated
using (is_space_member(space_id) and user_id = auth.uid());

grant select, insert, update, delete on ideas to authenticated;
grant select, insert, delete on idea_favorites to authenticated;

-- Copy cards → ideas.
--   type:           food/cafe/bars/dessert → eat, travel → go, anything else → do
--   location_label: rough bounding boxes on the card's coordinates; no
--                   coordinates (or outside all three) → "Anywhere"
--   source_link     → source_url
-- Card photos, notes, source person/screenshot and status stay on the card.
insert into ideas (
  space_id, title, location_label, type, address, latitude, longitude,
  source_url, legacy_card_id, created_by, created_at
)
select
  c.space_id,
  c.title,
  case
    when c.latitude between 36.9 and 38.6 and c.longitude between -123.2 and -121.5 then 'Bay'
    when c.latitude between 33.6 and 34.5 and c.longitude between -118.95 and -117.6 then 'LA'
    when c.latitude between 32.5 and 33.3 and c.longitude between -117.4 and -116.8 then 'SD'
    else 'Anywhere'
  end,
  case
    when c.categories && array['food', 'cafe', 'bars', 'dessert']::text[] then 'eat'
    when 'travel' = any (c.categories) then 'go'
    else 'do'
  end,
  c.address,
  c.latitude,
  c.longitude,
  c.source_link,
  c.id,
  c.created_by,
  c.created_at
from cards c
on conflict (legacy_card_id) do nothing;

notify pgrst, 'reload schema';
