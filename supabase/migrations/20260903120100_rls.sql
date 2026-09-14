-- Row Level Security for memoryi.
--
-- Interim-phase model (before step 7's real invite flow): every request is
-- authenticated via Supabase Anonymous Auth (auth.uid() is a real, stable
-- uid per signed-in device — see src/lib/auth.ts). Access is scoped by
-- space_members, not by "is this the anon user" — so step 7 (swapping
-- anonymous sessions for real accounts) only ever adds space_members rows,
-- it never touches these policies.

-- Membership check, reused by every space-scoped table's policies.
-- security definer so it can read space_members regardless of the caller's
-- own RLS visibility into that table (avoids a chicken-and-egg recursive
-- policy) — it only ever answers "is this specific (space, caller) pair a
-- member?", it doesn't expose other rows.
create or replace function is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from space_members
    where space_id = target_space_id
      and user_id = auth.uid()
  );
$$;

grant execute on function is_space_member(uuid) to authenticated;

alter table spaces enable row level security;
alter table space_members enable row level security;
alter table cards enable row level security;
alter table entries enable row level security;

-- spaces: members can see their own space. No client-facing insert/update/
-- delete policy — space rows are created by hand (seed migration / dashboard)
-- for now.
create policy "members can view their space"
on spaces for select
to authenticated
using (is_space_member(id));

-- space_members: you can see your own membership rows (lets the client
-- confirm "am I set up yet" without needing service-role access). No
-- client-facing insert/update/delete — membership is seeded by hand until
-- step 7 builds a real invite flow.
create policy "members can view their own membership"
on space_members for select
to authenticated
using (user_id = auth.uid());

-- cards: full CRUD for any member of the card's space.
create policy "members can view cards in their space"
on cards for select
to authenticated
using (is_space_member(space_id));

create policy "members can create cards in their space"
on cards for insert
to authenticated
with check (is_space_member(space_id) and created_by = auth.uid());

create policy "members can update cards in their space"
on cards for update
to authenticated
using (is_space_member(space_id))
with check (is_space_member(space_id));

create policy "members can delete cards in their space"
on cards for delete
to authenticated
using (is_space_member(space_id));

-- entries: same shape as cards.
create policy "members can view entries in their space"
on entries for select
to authenticated
using (is_space_member(space_id));

create policy "members can create entries in their space"
on entries for insert
to authenticated
with check (is_space_member(space_id) and created_by = auth.uid());

create policy "members can update entries in their space"
on entries for update
to authenticated
using (is_space_member(space_id))
with check (is_space_member(space_id));

create policy "members can delete entries in their space"
on entries for delete
to authenticated
using (is_space_member(space_id));
