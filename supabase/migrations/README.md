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
