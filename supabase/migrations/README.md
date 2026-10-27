# Applying these migrations

No Supabase CLI on this machine yet — `brew install supabase/tap/supabase`
needs the Xcode license accepted first (`sudo xcodebuild -license accept`),
which needs your password, so that's for you to run if you want the CLI
workflow. Until then, apply these by hand:

1. Open your project's [SQL Editor](https://supabase.com/dashboard/project/_/sql/new).
2. Run each file in this folder **in filename order** (they're numbered):
   1. `20260903120000_schema.sql` — tables
   2. `20260903120100_rls.sql` — RLS policies
   3. `20260903120200_storage.sql` — the `entry-photos` bucket + its policies
   4. `20260903120300_seed_space.sql` — the one `spaces` row this app uses
   5. `20260911190000_grants.sql` — table grants for `authenticated` (RLS
      policies alone aren't enough; without these every query 403s with
      "permission denied for table X")
   6. `20260921120000_card_categories.sql` — fixed multi-select card
      categories (adds `cards.categories`). Run this **before** using the
      updated app, or creating/editing a card will fail.
   7. `20260921130000_card_place_details.sql` — adds `place_id`, `address`,
      `neighborhood`, `price_level`, `types` to `cards`. Also required before
      the updated app can save a card.
   8. `20260921140000_card_source.sql` — adds `source_person`, `source_link`,
      `source_screenshot` to `cards`. Required before saving a card with the
      updated app.
   9. `20260921150000_card_photos.sql` — adds `cards.photos` (your own card
      photos; the first is the list thumbnail). Required before saving a card
      or opening the cards tab with the updated app.
  10. `20260921160000_card_coordinates.sql` — adds `latitude` / `longitude`
      to `cards` for the "near me" filter. Required before saving a card with
      the updated app.

   **LDR redesign (step 2)** — run these in order. Each is safe to re-run.

  11. `20261027120000_ldr_members.sql` — profile fields on `space_members`
      (display code, home city/airport/lat/lng), lets members see each other,
      `spaces.postcard_ttl_hours`.
  12. `20261027120100_trips.sql` — `trips` + `entries.trip_id`.
  13. `20261027120200_ideas.sql` — `ideas` + `idea_favorites`, and copies
      `cards` into `ideas`. Re-run it later to copy cards added since.
  14. `20261027120300_trip_plans.sql` — `trip_plans`.
  15. `20261027120400_postcards.sql` — `postcards`, the expiry trigger,
      `can_view_postcard()` (the unlock rule), `has_locked_postcard()`.
  16. `20261027120500_postcard_storage.sql` — `postcard-photos` bucket +
      policies. Needs 15 first.
  17. `20261027120600_statuses_songs.sql` — `statuses`, `favorite_songs`.
  18. `20261027120700_passport_stats.sql` — `get_passport_stats()`.

## Sample data (optional)

`supabase/seed/ldr_sample_data.sql` is **not** a migration — it fills in
sample trips, ideas, trip plans, statuses and fave songs, and sets both
profiles (MEL = San Francisco/SFO, YIC = San Diego/SAN). Run it after the
migrations above. It needs both of you as space members: by default it takes
the space's two members in join order (first = MEL). If the space has more
than two member rows (e.g. one per device), set `mel_override` /
`yic_override` at the top of the file. Re-running is harmless; the block at
the bottom removes it.

## Checking RLS + the postcard unlock rule

After the migrations and the seed, run `supabase/checks/verify_ldr.sql`. It
impersonates MEL, YIC and a stranger, and ends with a table of checks.
Every `pass` should be true. It cleans up after itself.

Once you have the CLI (`supabase login`, `supabase link --project-ref
<ref>`), these same files apply via `supabase db push`, and future schema
changes should be added as new timestamped files here rather than editing
these — that's what keeps `db push` idempotent.

## One-time: make your device a space member

Migration 4 creates the space row, but nothing grants your device access to
it yet — RLS requires a matching `space_members` row, and that needs your
device's anonymous-auth user id, which doesn't exist until the app has run
once.

1. Run the app (`npm run dev`) and open it — `src/lib/auth.ts` signs you in
   anonymously on first load.
2. Find your user id: Supabase Dashboard → **Authentication → Users** — it's
   the row that just appeared (no email, "Anonymous").
3. Back in the SQL Editor, run:

   ```sql
   insert into space_members (space_id, user_id)
   values ('264f1118-4348-45f7-947e-69fbcb24c97c', '<paste your user id>');
   ```

Do this again for any additional device (e.g. your phone) you use before
step 7 replaces anonymous auth with real accounts.
