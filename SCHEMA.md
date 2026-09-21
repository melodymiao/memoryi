# Data model

Source of truth: `supabase/migrations/*.sql`. This is the plain-English
version — see there for exact columns/constraints, and `supabase/migrations/README.md`
for how to apply them and how access currently works.

## The shape

```
spaces ──< space_members  (who belongs to a space)
   │
   ├──< cards    (bucket list items)
   │       ▲
   │       │ source_card_id (nullable)
   │
   └──< entries  (visited-place photo posts)
```

Everything hangs off `space_id`, not `user_id` — a space is the unit of
sharing. Right now every space has exactly one member (you); step 7 adds a
second `space_members` row for your partner and nothing else in this model
changes. There will only ever realistically be one `spaces` row in this
app (it's a private two-person PWA, no public signup) — the abstraction
exists so "shared" is built in from day one, not bolted on later.

## Tables

**`spaces`** — `id`, `name`, `created_at`. One row, seeded by migration.

**`space_members`** — join table: `space_id`, `user_id` (→ `auth.users`).
Seeded by hand for now (see migrations README) — there's no invite flow
until step 7.

**`cards`** — bucket list / wishlist items. `title`, `categories` (text
array limited to twelve fixed slugs — food, cafe, bars, dessert, shopping,
home, entertainment, nature, culture, travel, active, events; enforced by a
check constraint, defined in `src/lib/categories.ts`), `status` (`wishlist` |
`visited`), `notes`, and place details: `place_id` (Google Places id),
`address`, `neighborhood`, `price_level` (1–4 for $–$$$$), `types` (specific
kinds, e.g. `{omakase}` — separate from the fixed `categories`),
`created_by`, `created_at`. The old free-text `category` and `tags` columns
are kept for legacy rows but no longer written.

**`entries`** — visited-place photo posts. `title`, `place_name`,
`entry_date`, `caption`, `photos`, `source_card_id`, `created_by`,
`created_at`.

### `photos`: jsonb array, not a table

`entries.photos` is a jsonb array of Storage object paths, in display order
— e.g. `["<space_id>/<entry_id>/<uuid>.jpg", ...]`. Chosen over a separate
`entry_photos` table because right now the only thing the app needs is "an
ordered list of photos per post," which a jsonb array gives you for free,
with no join.

**Tradeoff:** no per-photo caption/metadata, and you can't efficiently query
"which posts contain photo X." If a future step wants per-photo captions or
richer ordering, migrate to `entry_photos (id, entry_id, storage_path,
position, caption)` then — backfilling from the jsonb array is a
straightforward one-time script, not a design change.

### `source_card_id`: included now, unused until later

Nullable FK from `entries` to `cards` — set when an entry was created "from"
a wishlist card (you finally went). Included now even though nothing writes
it yet, because it's cheap (one nullable column) and the alternative is a
migration later; `on delete set null` so deleting a card never takes an
entry down with it.

## Storage

Bucket `entry-photos`, **private** (not public — photos are only ever
served via short-lived signed URLs, see `src/lib/photos.ts`). Images only,
15 MB max per file. Object paths are `<space_id>/<entry_id>/<random>.<ext>`
— the leading `space_id` segment is what storage RLS checks against
`space_members`, the same way the table RLS policies do.

## Access control (interim, until step 7)

Every request is authenticated via **Supabase Anonymous Auth** — the app
signs in anonymously on first load (`src/lib/auth.ts`), giving the device a
real, stable `auth.uid()`. RLS policies scope every table by
`space_members`, not by "is this the anon user" — so step 7 (real per-
partner accounts) only ever means adding `space_members` rows, never
touching a policy. Full writeup + the tradeoffs considered:
`supabase/migrations/20260903120100_rls.sql` and
`supabase/migrations/README.md`.

## Data-access layer

Components never call the Supabase client directly — they go through
`src/data/*.ts`:

- `src/data/spaces.ts` — `getMySpaceId()`, resolves the current device's
  space via `space_members`. Everything else calls this internally instead
  of taking a `spaceId` param, since there's only ever one per device right
  now.
- `src/data/entries.ts` — `listEntries()`, `createEntry()`, `useEntries()`
- `src/data/cards.ts` — `listCards()`, `getCard()`, `createCard()`,
  `updateCardStatus()`, `updateCard()`, `deleteCard()`, `useCards()`
- `src/lib/photos.ts` — `uploadEntryPhoto()`, `getEntryPhotoUrl()`,
  `deleteEntryPhoto()`

The plain async functions (not the hooks) are what's unit tested — see
`src/data/__tests__/`. The `use*` hooks are thin `useState`/`useEffect`
wrappers around them, kept deliberately dependency-free (no react-query/SWR
added this session) since swapping the hook implementation later doesn't
touch the tested functions or the schema. Worth reconsidering once there's
real caching/mutation-invalidation pressure from steps 3-4.

## Types

`src/types/database.ts` — hand-written, not generated (no Supabase CLI on
this machine yet, see migrations README). Keep it in sync with the
migrations by hand until `supabase gen types typescript` is available.
