-- memoryi schema: spaces, space_members, cards, entries
-- Run this first (see supabase/migrations/README.md for how to apply).

-- One row per couple. There will only ever realistically be one row in this
-- app, but every other table hangs off space_id rather than a user_id so
-- step 7 (inviting a partner) is "add a space_members row", not a migration.
create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Who belongs to a space. Exactly one row for now (you); step 7 adds a
-- second row for your partner. Membership rows are seeded by hand via SQL
-- during this interim phase — see supabase/migrations/README.md — there's
-- no client-facing "join" flow until step 7.
create table if not exists space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (space_id, user_id)
);

-- Bucket list / wishlist items. Defined before `entries` since an entry can
-- optionally point back at the card it fulfilled.
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  title text not null,
  category text,
  status text not null default 'wishlist' check (status in ('wishlist', 'visited')),
  notes text,
  tags text[] not null default '{}',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists cards_space_id_idx on cards (space_id);
create index if not exists cards_status_idx on cards (space_id, status);

-- Visited-place photo posts.
--
-- `photos` is a jsonb array of Storage object paths (in the `entry-photos`
-- bucket), in display order — e.g. ["<space_id>/<entry_id>/0.jpg", ...].
-- Chosen over a separate `entry_photos` table because the only thing the
-- app needs right now is an ordered list of photos per post (that's all
-- the feed's photo grid uses); a jsonb array gives us that with zero extra
-- joins. The tradeoff: no per-photo caption/metadata, and no easy way to
-- query "posts containing photo X". If per-photo captions or ordering-via-
-- drag-and-drop-with-persisted-ids becomes a real feature, migrate this to
-- a proper `entry_photos (id, entry_id, storage_path, position, caption)`
-- table then — straightforward to backfill from the jsonb array.
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  title text not null,
  place_name text,
  entry_date date not null default current_date,
  caption text,
  photos jsonb not null default '[]'::jsonb,
  -- Nullable link back to the wishlist card this entry fulfilled, if any
  -- (e.g. "finally went to the restaurant on the wishlist"). Optional by
  -- design — cheap to have now (one nullable FK), spares us a migration
  -- later if/when the "create entry from card" flow (step 3/4) wants it.
  source_card_id uuid references cards (id) on delete set null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists entries_space_id_idx on entries (space_id);
create index if not exists entries_entry_date_idx on entries (space_id, entry_date desc);
create index if not exists entries_source_card_id_idx on entries (source_card_id);
