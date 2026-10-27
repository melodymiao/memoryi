-- LDR pivot, part 5: postcards + the unlock rule.
--
-- Rules:
--   - A postcard's lifetime is spaces.postcard_ttl_hours (default 24). The
--     trigger below sets expires_at from it on insert; whatever the client
--     sends is ignored. That column is the only place the lifetime lives.
--   - Senders can always see their own postcards, even expired ones.
--   - You can see your partner's postcard only while it hasn't expired AND
--     you have an unexpired postcard of your own in the same space.
--   That rule lives entirely in can_view_postcard() — change it there.
--
-- Postcards are immutable: no update policy or grant. The sender can delete.
--
-- Safe to re-run.

create table if not exists postcards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  -- Storage paths in the private `postcard-photos` bucket, always
  -- "<space_id>/<postcard id>/<file>" (enforced below). Tying the path to
  -- this row's own id is what stops a postcard row from pointing at someone
  -- else's photo — storage read access is granted by "you can see a postcard
  -- row that references this path" (see 20261027120500_postcard_storage.sql).
  photo_path text not null,
  -- For a future front/back camera version.
  secondary_photo_path text,
  caption text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint postcards_id_space_id_key unique (id, space_id),
  constraint postcards_photo_path_scoped check (
    photo_path like space_id::text || '/' || id::text || '/%'
  ),
  constraint postcards_secondary_photo_path_scoped check (
    secondary_photo_path is null
    or secondary_photo_path like space_id::text || '/' || id::text || '/%'
  )
);

create index if not exists postcards_space_sender_expires_idx on postcards (space_id, sender_id, expires_at);

-- Server clock + the space's TTL decide created_at / expires_at, never the
-- client.
create or replace function set_postcard_expiry()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  select new.created_at + make_interval(hours => s.postcard_ttl_hours)
    into new.expires_at
    from spaces s
    where s.id = new.space_id;
  return new;
end;
$$;

drop trigger if exists postcards_set_expiry on postcards;
create trigger postcards_set_expiry
before insert on postcards
for each row execute function set_postcard_expiry();

-- The unlock rule. Used by the select policy below (and by
-- has_locked_postcard), so changing who-can-see-what means changing only this.
--
-- security definer because it reads `postcards` from inside a policy on
-- `postcards` — as invoker that would recurse into the same policy. The
-- inner query only ever looks at the caller's own postcards
-- (sender_id = auth.uid()), so it exposes nothing.
create or replace function can_view_postcard(
  target_space_id uuid,
  target_sender_id uuid,
  target_expires_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(target_sender_id = auth.uid(), false)
    or (
      is_space_member(target_space_id)
      and target_expires_at > now()
      and exists (
        select 1
        from postcards mine
        where mine.space_id = target_space_id
          and mine.sender_id = auth.uid()
          and mine.expires_at > now()
      )
    );
$$;

-- "Your partner sent a postcard you can't see yet" — lets the Home tab show
-- the locked state without exposing the postcard itself. Returns only a
-- boolean, and only for a space you're a member of.
create or replace function has_locked_postcard(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_space_member(target_space_id)
    and exists (
      select 1
      from postcards p
      where p.space_id = target_space_id
        and p.sender_id <> auth.uid()
        and p.expires_at > now()
        and not can_view_postcard(p.space_id, p.sender_id, p.expires_at)
    );
$$;

grant execute on function can_view_postcard(uuid, uuid, timestamptz) to authenticated;
grant execute on function has_locked_postcard(uuid) to authenticated;

alter table postcards enable row level security;

drop policy if exists "members can view unlocked postcards" on postcards;
create policy "members can view unlocked postcards"
on postcards for select
to authenticated
using (can_view_postcard(space_id, sender_id, expires_at));

drop policy if exists "members can send postcards in their space" on postcards;
create policy "members can send postcards in their space"
on postcards for insert
to authenticated
with check (is_space_member(space_id) and sender_id = auth.uid());

drop policy if exists "senders can delete their own postcards" on postcards;
create policy "senders can delete their own postcards"
on postcards for delete
to authenticated
using (sender_id = auth.uid());

grant select, insert, delete on postcards to authenticated;

notify pgrst, 'reload schema';
