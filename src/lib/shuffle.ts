import type { Card } from "../types/database"
import { collectFacets, distanceMiles, type LatLng } from "./cardFilters"
import { cuisinesOfTypes } from "./cuisine"

/**
 * Shuffle-page filtering. Looser than the cards screen on purpose: it's for
 * "what should we do tonight", so a card with no price still shows up under any
 * budget. Location picks do need coordinates, though.
 */

export type AreaKey = "work" | "home" | "beach" | "sd" | "oc" | "la"

export const AREAS: { key: AreaKey; label: string }[] = [
  { key: "work", label: "Near work" },
  { key: "home", label: "Near home" },
  { key: "beach", label: "Near the beach" },
  { key: "sd", label: "San Diego" },
  { key: "oc", label: "OC" },
  { key: "la", label: "LA" },
]

/** "Near home" / "near work" radius. */
export const NEAR_MILES = 5
/** How close to a beach counts as "near the beach". */
const BEACH_MILES = 1.5

/** Rough circles around each metro — they overlap a little at the edges, which is fine. */
const REGIONS: Record<"sd" | "oc" | "la", { center: LatLng; miles: number }> = {
  sd: { center: { latitude: 32.85, longitude: -117.15 }, miles: 28 },
  oc: { center: { latitude: 33.7, longitude: -117.83 }, miles: 20 },
  la: { center: { latitude: 34.05, longitude: -118.3 }, miles: 30 },
}

/** Points along the SoCal coast, Imperial Beach to Malibu. */
const BEACHES: LatLng[] = [
  [32.58, -117.133], [32.68, -117.18], [32.75, -117.252], [32.77, -117.252], [32.795, -117.256],
  [32.85, -117.272], [32.96, -117.268], [33.045, -117.296], [33.16, -117.352], [33.195, -117.385],
  [33.42, -117.62], [33.46, -117.7], [33.54, -117.785], [33.61, -117.93], [33.655, -118.003],
  [33.74, -118.105], [33.765, -118.19], [33.84, -118.39], [33.885, -118.412], [33.985, -118.473],
  [34.01, -118.497], [34.035, -118.68],
].map(([latitude, longitude]) => ({ latitude, longitude }))

/** Home / work spots the user saved from their device location. */
export interface SavedPlaces {
  home: LatLng | null
  work: LatLng | null
}

export interface ShufflePrefs {
  categories: string[]
  /** Follow-up picks per category: cuisines for food, specific types otherwise. Empty = any. */
  details: Record<string, string[]>
  /** 1–3; 3 also covers $$$$. */
  prices: number[]
  areas: AreaKey[]
}

export const EMPTY_PREFS: ShufflePrefs = { categories: [], details: {}, prices: [], areas: [] }

const norm = (s: string) => s.trim().toLowerCase()

/** The values a category's follow-up question is about, for one card. */
function detailValues(card: Card, category: string): string[] {
  return (category === "food" ? cuisinesOfTypes(card.types) : card.types).map(norm)
}

/** Follow-up options for a category, drawn from the cards that have it. */
export function detailOptions(cards: Card[], category: string): string[] {
  const facets = collectFacets(cards.filter((c) => c.categories.includes(category)))
  return (category === "food" ? facets.cuisines : facets.types).map((f) => f.value)
}

export function inArea(card: Card, area: AreaKey, saved: SavedPlaces): boolean {
  if (card.latitude === null || card.longitude === null) return false
  const at = { latitude: card.latitude, longitude: card.longitude }
  switch (area) {
    case "home":
    case "work": {
      const spot = saved[area]
      return spot !== null && distanceMiles(spot, at) <= NEAR_MILES
    }
    case "beach":
      return BEACHES.some((b) => distanceMiles(b, at) <= BEACH_MILES)
    default: {
      const region = REGIONS[area]
      return distanceMiles(region.center, at) <= region.miles
    }
  }
}

/** Within a question any pick matches (OR); across questions all must match (AND). */
export function matchesPrefs(card: Card, prefs: ShufflePrefs, saved: SavedPlaces): boolean {
  if (prefs.categories.length > 0) {
    const ok = prefs.categories.some((cat) => {
      if (!card.categories.includes(cat)) return false
      const picks = (prefs.details[cat] ?? []).map(norm)
      return picks.length === 0 || detailValues(card, cat).some((v) => picks.includes(v))
    })
    if (!ok) return false
  }
  if (prefs.prices.length > 0 && card.price_level !== null && !prefs.prices.includes(Math.min(card.price_level, 3))) {
    return false
  }
  if (prefs.areas.length > 0 && !prefs.areas.some((a) => inArea(card, a, saved))) return false
  return true
}

/** Fisher–Yates; returns a new array. */
export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
