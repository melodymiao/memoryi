# Build plan: ldr-redesign

Work one step per session. Plan first, wait for approval, then build. At the end of each session, mark the step, list what changed, and note open questions.

Already done from memoryi: PWA scaffold (Vite, manifest, service worker, icons, Vercel deploy) and the original Supabase schema (`spaces`, `space_members`, `cards`, `entries`, `entry-photos` bucket, `is_space_member()`).

## Steps

- [ ] **1. Design system + tab shell**: tokens from `docs/DESIGN.md` (palette, Inter Tight / Doto type scale, radii); shared components (Card, DarkBanner, SplitFlapDigits, Chip, DashedRoute, PerforatedStamp); 4-tab bottom nav (Home, Trips, Plans, Passport) with empty screens. Remove the old memoryi tabs and screens.
- [x] **2. Schema + data layer**: new tables (trips, ideas, idea_favorites, trip_plans, postcards, statuses, favorite_songs), profile fields (display code, home city/airport/lat-lng), `entries.trip_id`, postcard bucket, `can_view_postcard()` unlock rule, configurable postcard lifetime, passport stats view, `src/data/` hooks, seed file. Create or refresh `SCHEMA.md`.
- [ ] **3. Trips (sample data)**: Ticket component (pickup info only), countdown banner, month calendar with prev/next (selected trip lime, others pink), collapsible trip plans, past-ticket stack that swaps into the main view.
- [ ] **4. Flight lookup**: Supabase edge function: flight number + date → airline, times, arrival terminal/gate, status (AeroDataBox or Aviationstack). Add/edit flight sheet. Gate shows "TBA" until known.
- [ ] **5. Plans**: ideas list, location dropdown (incl. "within X mi"), type chips, pin added items, hearts (pink = Melody, lime = partner), source link icon, address line, event/seasonal date chips with "During [trip]" / "No trip booked", new-idea sheet.
- [ ] **6. Home**: city card with weather (Open-Meteo), miles apart, fave songs (paste a YouTube Music link → title/artist/thumbnail via oEmbed), free-text status banner.
- [ ] **7. Postcards**: camera capture (`<input capture>`), upload to `postcard-photos`, lock/unlock UI, expiry, "View my postcard".
- [ ] **8. Passport**: miles split-flap, stats, stamp grid (one color per city, halftone image), most visited, stamp scrapbook page.
- [ ] **9. Two-person sharing**: real auth for both people, invite partner into the same space, realtime sync.
- [ ] **10. Polish**: push notifications (iOS 16.4+), offline handling, empty states, app icon/name.

## Session log

<!-- Claude Code: add an entry per session: date, step, what changed, files touched, open questions. -->

### 2026-10-27 — Step 2: schema + data layer
**Changed**
- 8 migrations: `supabase/migrations/20261027120000_ldr_members.sql` … `20261027120700_passport_stats.sql`. The run order is in `supabase/migrations/README.md`.
- New tables: `trips`, `ideas`, `idea_favorites`, `trip_plans`, `postcards`, `statuses`, `favorite_songs`.
- Profile fields on `space_members`; `spaces.postcard_ttl_hours`; `entries.trip_id`.
- `postcard-photos` bucket.
- SQL functions: `can_view_postcard()`, `has_locked_postcard()`, `get_passport_stats()`.
- `cards` copied into `ideas`; `cards` itself untouched.
- Seed file: `supabase/seed/ldr_sample_data.sql`.
- Data layer in `src/data/`:
  - New: `members`, `trips`, `ideas`, `tripPlans`, `postcards`, `statuses`, `favoriteSongs`, `passport`, `useLoader`, `columns`, `step`.
  - Changed: `entries` (gains `tripId`); `cards` now imports the shared `step()`.
- Also: `src/lib/dates.ts`, postcard helpers in `src/lib/photos.ts`, types in `src/types/database.ts`, tests in `src/data/__tests__/`.
- `SCHEMA.md` rewritten.

**Verified**
- `npm test` (98 passing), `npm run lint`, `npm run build`.
- All migrations and the seed run in a local Postgres 17 (PGlite) with stubbed auth/storage, including re-runs. 42 checks pass: RLS for a non-member, a partner and the owner; the postcard lock, unlock and expiry cases; TTL changes; storage read gating; passport numbers; `on delete` behaviour.
- **Not yet run against the real Supabase project.**

**Open questions**
- PRODUCT.md's new-idea sheet has a note and a photo, but `ideas` has no `note` or `photos` columns yet. Add them in step 5? Card notes and photos are still on `cards` if we want to carry them over.
- The stamp page has a per-trip "note", and trips have no `note` column yet (step 8).
- Home cities: PRODUCT.md says SF ↔ LA, but the seed uses YIC = San Diego (SAN) as asked, with trips SFO ↔ LAX.
- BUILD_PLAN said "passport stats view". It's a function instead (`get_passport_stats(space_id, as_of)`), because "as of" needs a parameter.
- Step 1 isn't done yet, so the old Cards/Shuffle screens still use `cards`. Cards added there only reach `ideas` if `20261027120200_ideas.sql` is re-run.