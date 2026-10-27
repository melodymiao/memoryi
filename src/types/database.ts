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
  /** How long a postcard stays visible. Only ever set via SQL. */
  postcard_ttl_hours: number
  created_at: string
}

/** One person in the couple. Profile fields are null until set. */
export interface SpaceMember {
  id: string
  space_id: string
  user_id: string
  /** Short code shown in the UI, e.g. "MEL". */
  display_code: string | null
  home_city: string | null
  /** IATA code, e.g. "SFO". */
  home_airport: string | null
  /** Home coordinates, for weather. */
  home_lat: number | null
  home_lng: number | null
  created_at: string
}

export type CardStatus = "wishlist" | "visited"

export interface Card {
  id: string
  space_id: string
  title: string
  /** Legacy free-text category; no longer written by the app — see `categories`. */
  category: string | null
  /** Fixed category slugs (src/lib/categories.ts); a card can have several. */
  categories: string[]
  status: CardStatus
  notes: string | null
  /** Legacy free-text tags; no longer written by the app. */
  tags: string[]
  /** Google Places id when created from an autocomplete suggestion. */
  place_id: string | null
  address: string | null
  /** Coordinates from the picked place; null for cards made by hand. */
  latitude: number | null
  longitude: number | null
  /** Neighborhood / area, e.g. "Little Tokyo". */
  neighborhood: string | null
  /** 1–4 for $–$$$$. */
  price_level: number | null
  /** Your own uploaded photos: Storage paths in the entry-photos bucket, in order. */
  photos: string[]
  /** Who told you about it. */
  source_person: string | null
  /** http(s) link the recommendation came from. */
  source_link: string | null
  /** Storage path (entry-photos bucket) of a screenshot of the recommendation. */
  source_screenshot: string | null
  /** Specific kinds of place, e.g. ["omakase"] — separate from `categories`. */
  types: string[]
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
  /** The trip these photos belong to, if any. */
  trip_id: string | null
  created_by: string
  created_at: string
}

/** One visit. Upcoming/past and the trip number are derived, never stored — see src/data/trips.ts. */
export interface Trip {
  id: string
  space_id: string
  /** Who is flying. */
  traveler_user_id: string
  airline: string | null
  flight_number: string | null
  flight_date: string | null // date, "YYYY-MM-DD"
  origin_code: string | null
  dest_code: string | null
  dest_city: string
  depart_at: string | null
  arrive_at: string | null
  /** Pickup info, filled in by a flight lookup. */
  arrival_terminal: string | null
  arrival_gate: string | null
  /** Free text from the lookup, e.g. "on time", "delayed". */
  flight_status: string | null
  flight_data_updated_at: string | null
  visit_start: string // date, "YYYY-MM-DD"
  visit_end: string // date, "YYYY-MM-DD"
  miles: number
  created_by: string
  created_at: string
}

export type IdeaType = "eat" | "do" | "go" | "stay"

/** A Plans-page idea. */
export interface Idea {
  id: string
  space_id: string
  title: string
  /** Free text region, e.g. "Bay", "LA", "SD", "Anywhere". */
  location_label: string
  type: IdeaType
  address: string | null
  latitude: number | null
  longitude: number | null
  /** Where it was found, e.g. a TikTok / Reel link. */
  source_url: string | null
  /** Events: date range (either end may be open). */
  starts_on: string | null // date, "YYYY-MM-DD"
  ends_on: string | null // date, "YYYY-MM-DD"
  /** Seasonal ideas, e.g. "Spring". */
  season_label: string | null
  /** The card this was copied from by the ideas migration, if any. */
  legacy_card_id: string | null
  created_by: string
  created_at: string
}

export interface IdeaFavorite {
  idea_id: string
  user_id: string
  space_id: string
  created_at: string
}

/** An idea or ad-hoc item attached to a trip. */
export interface TripPlan {
  id: string
  space_id: string
  trip_id: string
  /** Set when added from an idea; cleared if the idea is deleted. */
  idea_id: string | null
  /** Always set — for idea items, a copy of the idea's title when added. */
  title: string
  done: boolean
  done_at: string | null
  position: number
  created_by: string
  created_at: string
}

export interface Postcard {
  id: string
  space_id: string
  sender_id: string
  /** Storage path in the `postcard-photos` bucket. */
  photo_path: string
  /** For a future front/back camera version. */
  secondary_photo_path: string | null
  caption: string | null
  created_at: string
  /** Set by the database from spaces.postcard_ttl_hours. */
  expires_at: string
}

/** One current status per person. */
export interface Status {
  space_id: string
  user_id: string
  /** Max 40 characters. */
  text: string
  updated_at: string
}

/** One current favorite song per person. */
export interface FavoriteSong {
  space_id: string
  user_id: string
  url: string
  title: string | null
  artist: string | null
  thumbnail_url: string | null
  updated_at: string
}

/** What get_passport_stats() returns. */
export interface PassportStats {
  total_miles: number
  visit_count: number
  days_together: number
  distinct_cities: number
  /** Most-visited first. */
  visits_per_city: { city: string; visits: number }[]
}
