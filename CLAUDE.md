# CLAUDE.md

Private two-person PWA for a long-distance couple (SF ↔ LA). Branch `ldr-redesign` pivots the old "memoryi" cards app into a 4-tab app: **Home, Trips, Plans, Passport**. Product rules live in `docs/PRODUCT.md`; read it before any feature work.

## Stack
- React + Vite, installed as an iOS Safari PWA via "Add to Home Screen" (no App Store).
- Supabase: Postgres, Storage, Auth. Only two users, sharing one `space_id`.
- Deployed to Vercel by drag-and-drop.

## Rules
- **Migrations**: plain SQL files in `supabase/migrations/`, numbered in order. There is no Supabase CLI; they're run by hand in the Supabase SQL Editor. Never assume a migration has run; tell me which files to run and in what order.
- **Security**: every table is scoped by `space_id` and protected by RLS using `is_space_member()`. Write policies for the final two-person model from the start.
- **Data layer**: lives in `src/data/`, using plain `useState`/`useEffect` hooks. No react-query/SWR unless I approve it.
- **Non-destructive**: don't drop tables or data. If something is renamed, migrate the data and list every code reference that changes.
- **Photos are permanent**: deleting an idea or trip never deletes its photos.
- **Design**: match `docs/design-reference/*.html` exactly (colors, sizes, spacing, radii). Tokens are in `docs/DESIGN.md`. Never edit files in `docs/design-reference/`.
- **Scope**: one build step per session (see `docs/BUILD_PLAN.md`). Plan first and wait for my approval before writing files. Stay inside the step.
- **End of every session**: update `docs/BUILD_PLAN.md` (mark progress) and add any new decisions to `docs/PRODUCT.md`. Keep `SCHEMA.md` current after any schema change.

## Platform notes
- Push notifications work on iOS 16.4+ for installed PWAs; home-screen widgets are not possible.
- Camera: use `<input type="file" accept="image/*" capture>`; a PWA can't open the iOS Camera app directly.
- iOS caches the PWA name/icon at install; changing them requires deleting and re-adding the app.