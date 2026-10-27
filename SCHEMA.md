# Data model

Source of truth: `supabase/migrations/*.sql`. This is the plain-English
version — see there for exact columns/constraints, and `supabase/migrations/README.md`
for how to apply them (and in what order).

## The shape

```
spaces ──< space_members  (the two of you + your profile: code, home city/airport)
   │
   ├──< trips ──────< trip_plans >──── ideas ──< idea_favorites
   │      ▲  (one per visit)   (checklist)   (Plans list)  (one heart per person)
   │      │ trip_id (nullable)
   ├──< entries  (photo posts; permanent)
   │      │ source_card_id (nullable)
   │      ▼
   ├──< cards     (old bucket list — kept as the archive, copied into ideas)
   │
   ├──< postcards        (24h-ish photo swap with the unlock rule)
   ├──< statuses         (one current status per person)
   └──< favorite_songs   (one current fave per person)
```

Everything hangs off `space_id`, not `user_id` — a space is the unit of
sharing, and there's only ever one (fixed id `264f1118-…`, seeded by
migration). Every table has RLS keyed on `is_space_member(space_id)`; policies
are written for the final two-person model, so adding your partner (build
plan step 9) only means adding a `space_members` row.

**Same-space links.** Parent tables (`trips`, `ideas`, `postcards`) have
`unique (id, space_id)`, and child rows reference `(parent_id, space_id)`
rather than just `parent_id`. That makes it impossible for, say, a trip plan
to point at a trip in another space, even if its own `space_id` passes RLS.
Nullable links use `on delete set null (col)` so only the link is cleared,
never `space_id`.

**Derived, never stored:** upcoming vs past trips, trip number, and all
Passport stats.

## Tables

**`spaces`** — `id`, `name`, `postcard_ttl_hours` (default 24 — the *only*
place a postcard's lifetime is defined; change it with SQL, there's no
client-facing update), `created_at`.

**`space_members`** — one row per person per space: `space_id`, `user_id`
(→ `auth.users`), plus profile fields: `display_code` (2–4 capitals, e.g.
`MEL`), `home_city`, `home_airport` (IATA, e.g. `SFO`), `home_lat` /
`home_lng` (for weather). Profile lives here rather than a separate
`profiles` table because a profile here *is* "me in this couple" — this is
already one row per person, already joined everywhere, and a second table
would need its own RLS and syncing. Members can see each other's rows; each
person can update only their own, and only the five profile columns
(column-level grant). Rows are inserted by hand (see migrations README).

**`trips`** — one row per visit.
- `traveler_user_id` (who's flying — must be a member of the space).
- Flight: `airline`, `flight_number`, `flight_date`, `origin_code` /
  `dest_code` (IATA), `dest_city`, `depart_at` / `arrive_at`.
- Pickup info only: `arrival_terminal`, `arrival_gate` (null → show "TBA"),
  `flight_status` (free text, e.g. "on time"), `flight_data_updated_at`. These
  are filled later by the flight lookup (step 4).
- Visit: `visit_start` / `visit_end` (dates, inclusive — the calendar and
  "days together" use these), `miles`.
- Flight fields are nullable so a visit can be logged before it's booked.
- Upcoming/past: compare `visit_end` with the device's local date (not the
  DB's UTC `current_date`). Trip number: position by `visit_start`.
- Deleting a trip deletes its plans; its photos stay (`entries.trip_id` is
  cleared).

**`ideas`** — the Plans list. `title`, `location_label` (free text: "Bay",
"LA", "SD", "Anywhere"; default "Anywhere"), `type` (`eat` | `do` | `go` |
`stay`), `address`, `latitude` / `longitude` (for "within X mi"),
`source_url` (TikTok/Reel), event/seasonal fields `starts_on`, `ends_on`,
`season_label` (e.g. "Spring"), `legacy_card_id`, `created_by`, `created_at`.

*Why a new table instead of renaming `cards`:* the old Cards/Shuffle screens
still read and write `cards`, and half its columns (status, fixed categories,
price level, source person/screenshot, photos) don't belong in the new model.
So migration `20261027120200_ideas.sql` copies cards into ideas (food/cafe/
bars/dessert → eat, travel → go, else do; location from coordinates; source
link → source URL) and leaves `cards` untouched. `legacy_card_id` is unique,
so re-running that file only picks up cards added since.

**`idea_favorites`** — `(idea_id, user_id)` primary key, plus `space_id`. One
heart per person per idea; both of you see both, each of you only adds or
removes your own.

**`trip_plans`** — a trip's checklist. `trip_id`, `idea_id` (nullable — set
when added from an idea), `title` (always set; copied from the idea when
added, so the item keeps its name if the idea is deleted), `done`, `done_at`
(set iff done), `position`. An idea can't be on the same trip twice.

**`postcards`** — `sender_id`, `photo_path`, `secondary_photo_path` (for a
future front/back camera version), `caption`, `created_at`, `expires_at`.
- A trigger sets `created_at = now()` and `expires_at = created_at +
  spaces.postcard_ttl_hours` on insert, ignoring whatever the client sends.
- Photo paths must be `<space_id>/<this postcard's id>/…` (check
  constraint), so a postcard row can't point at someone else's photo.
- Immutable: no updates. The sender can delete.

**The unlock rule — `can_view_postcard(space_id, sender_id, expires_at)`**,
used by the postcards select policy:
- Senders always see their own, even expired.
- You see your partner's only while **it** hasn't expired **and** you have an
  unexpired postcard of your own in the same space.

It's `security definer` because it reads `postcards` from inside a policy on
`postcards` (as invoker that recurses), but it only ever looks at the
caller's own rows. Change the rule there and nowhere else.
`has_locked_postcard(space_id)` returns just a boolean — "your partner has
one you can't see yet" — for the Home tab's locked state.

**`statuses`** — primary key `(space_id, user_id)`: `text` (1–40 chars),
`updated_at` (trigger). Set with an upsert.

**`favorite_songs`** — primary key `(space_id, user_id)`: `url` (http(s)),
`title`, `artist`, `thumbnail_url`, `updated_at` (trigger). Set with an upsert.

**`entries`** — photo posts. `title`, `place_name`, `entry_date`, `caption`,
`photos`, `source_card_id`, `trip_id` (nullable — the trip these photos
belong to, for stamps and the scrapbook page), `created_by`, `created_at`.
Photos are permanent: deleting a trip or card only clears the link.

**`cards`** — the old bucket list, kept as-is: `title`, `categories`,
`status`, `notes`, place details (`place_id`, `address`, `latitude` /
`longitude`, `neighborhood`, `price_level`, `types`), source (`source_person`,
`source_link`, `source_screenshot`), `photos`, legacy `category` / `tags`.
Still used by the old screens until the Plans UI (step 5) replaces them.

### `entries.photos`: jsonb array, not a table

`entries.photos` is a jsonb array of Storage object paths, in display order.
Chosen over a separate `entry_photos` table because the only need so far is
"an ordered list of photos per post." **Tradeoff:** no per-photo captions,
and no efficient "which posts contain photo X." If that's ever needed,
migrate to `entry_photos (id, entry_id, storage_path, position, caption)` —
a one-time backfill, not a design change.

## Passport stats — `get_passport_stats(space_id, as_of)`

A SQL function (not a view, because it takes "as of" — pass the device's
local date). Returns jsonb:

```
{ total_miles, visit_count, days_together, distinct_cities,
  visits_per_city: [{ city, visits }, ...] }   -- most visited first
```

Counts trips with `visit_start <= as_of`; a visit in progress counts up to
`as_of`. `days_together` is distinct calendar days across all visits
(inclusive), so overlapping trips don't double-count. Runs as the caller, so
trips RLS applies (a non-member gets zeros).

## Storage

Both buckets are **private** (photos are only served via short-lived signed
URLs, see `src/lib/photos.ts`), images only, 15 MB max per file. The leading
`space_id` path segment is what upload policies check against
`space_members`.

- **`entry-photos`** — `<space_id>/<entry_id>/<random>.<ext>`, plus card
  photos/screenshots under `<space_id>/card-photos/` and
  `<space_id>/card-sources/`. Any space member can read/write.
- **`postcard-photos`** — `<space_id>/<postcard_id>/<random>.<ext>`. Stricter
  read rule: you can read an object only if you can see (under postcards
  RLS) a postcard row that references it — otherwise the unlock rule could be
  bypassed by fetching the image directly. Members can upload; only the
  uploader can delete.

## Access control

Every request is authenticated via **Supabase Anonymous Auth** for now — the
app signs in anonymously on first load (`src/lib/auth.ts`), giving the device
a real, stable `auth.uid()`. RLS scopes every table by `space_members`, not
"is this the anon user", so real per-person accounts (step 9) only means
changing how sessions are created and adding `space_members` rows — never a
policy. Each table also needs an explicit `grant … to authenticated` (see
`20260911190000_grants.sql`); the LDR migrations include theirs.

## Data-access layer

Components never call the Supabase client directly — they go through
`src/data/*.ts`. Every function resolves "my space" via `getMySpaceId()` and
"me" via `ensureSession()` instead of taking them as params.

- `spaces.ts` — `getMySpaceId()`
- `members.ts` — `listMembers()`, `getMyMember()`, `getPartner()`,
  `updateMyProfile()`, `useMembers()` (→ `members`, `me`, `partner`)
- `trips.ts` — `listTrips()`, `getTrip()`, `getNextTrip(today?)`,
  `getPastTrips(today?)`, `tripNumber()`, `createTrip()`, `updateTrip()`,
  `deleteTrip()`, `useTrips()`, `useNextTrip()`
- `ideas.ts` — `listIdeas()` / `getIdea()` (with `favorited_by` user ids),
  `createIdea()`, `updateIdea()`, `deleteIdea()`, `toggleIdeaFavorite()`,
  `useIdeas()`
- `tripPlans.ts` — `listTripPlans()`, `addIdeaToTrip()`, `addTripPlan()`,
  `setTripPlanDone()`, `updateTripPlan()`, `reorderTripPlans()`,
  `deleteTripPlan()`, `useTripPlans(tripId)`
- `postcards.ts` — `listPostcards()`, `sendPostcard()` (uploads, then
  inserts; cleans up uploads if the insert fails), `hasLockedPostcard()`,
  `isPostcardActive()`, `deletePostcard()`, `usePostcards()` (→ `postcards`,
  `locked`)
- `statuses.ts` — `listStatuses()`, `upsertMyStatus()`, `clearMyStatus()`,
  `useStatuses()`
- `favoriteSongs.ts` — `listFaveSongs()`, `upsertMyFaveSong()`,
  `clearMyFaveSong()`, `useFaveSongs()`
- `passport.ts` — `getPassportStats(asOf?)`, `usePassportStats()`
- `entries.ts` — `listEntries()`, `listEntriesForTrip()`, `createEntry()`,
  `useEntries()`
- `cards.ts` — old bucket list (`listCards()`, `createCard()`, …)
- `src/lib/photos.ts` — entry/card photo helpers, plus
  `uploadPostcardPhoto()`, `getPostcardPhotoUrls()`, `deletePostcardPhotos()`
- `src/lib/dates.ts` — `todayLocal()`, the device's "YYYY-MM-DD"

The plain async functions (not the hooks) are what's unit tested — see
`src/data/__tests__/`. Hooks are thin `useState`/`useEffect` wrappers; the
LDR ones share `useLoader()` (`src/data/useLoader.ts`). No react-query/SWR.

## Types

`src/types/database.ts` — hand-written, not generated (no Supabase CLI).
Keep it in sync with the migrations by hand.

## Sample data

`supabase/seed/ldr_sample_data.sql` — not a migration. Sample trips, ideas,
plans, statuses and songs for building the UI. See the migrations README.
