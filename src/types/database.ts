/**
 * Hand-written types mirroring the schema in supabase/migrations/. Normally
 * you'd run `supabase gen types typescript` for this, but that needs the
 * Supabase CLI (blocked on this machine by an unaccepted Xcode license —
 * see supabase/migrations/README.md) — once that's sorted, swap this file
 * for a generated one and point src/lib/supabase.ts at it.
 *
 * Keep this in sync with supabase/migrations/*.sql by hand until then.
 */

export interface Space {
  id: string
  name: string
  created_at: string
}

export interface SpaceMember {
  id: string
  space_id: string
  user_id: string
  created_at: string
}

export type CardStatus = "wishlist" | "visited"

export interface Card {
  id: string
  space_id: string
  title: string
  category: string | null
  status: CardStatus
  notes: string | null
  tags: string[]
  created_by: string
  created_at: string
}

export interface Entry {
  id: string
  space_id: string
  title: string
  place_name: string | null
  entry_date: string // date, "YYYY-MM-DD"
  caption: string | null
  /** Ordered Storage object paths in the `entry-photos` bucket. */
  photos: string[]
  source_card_id: string | null
  created_by: string
  created_at: string
}
