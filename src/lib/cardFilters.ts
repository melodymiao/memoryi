import type { Card, CardStatus } from "../types/database"
import { cuisinesOfTypes } from "./cuisine"

export type SortKey = "newest" | "oldest" | "az" | "za" | "priceLow" | "priceHigh"

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
  { value: "priceLow", label: "Price: low to high" },
  { value: "priceHigh", label: "Price: high to low" },
]

const byNewest = (a: Card, b: Card) => b.created_at.localeCompare(a.created_at)

/** Returns a sorted copy. Cards with no price always sort last for the price
 * options; ties fall back to newest first. */
export function sortCards(cards: Card[], sort: SortKey): Card[] {
  const out = [...cards]
  switch (sort) {
    case "newest":
      return out.sort(byNewest)
    case "oldest":
      return out.sort((a, b) => a.created_at.localeCompare(b.created_at))
    case "az":
      return out.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) || byNewest(a, b))
    case "za":
      return out.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: "base" }) || byNewest(a, b))
    case "priceLow":
    case "priceHigh": {
      const dir = sort === "priceLow" ? 1 : -1
      return out.sort((a, b) => {
        if (a.price_level === null && b.price_level === null) return byNewest(a, b)
        if (a.price_level === null) return 1
        if (b.price_level === null) return -1
        return (a.price_level - b.price_level) * dir || byNewest(a, b)
      })
    }
  }
}

export type AddedWithin = "week" | "month"

export interface LatLng {
  latitude: number
  longitude: number
}

export interface CardFilters {
  statuses: CardStatus[]
  categories: string[]
  /** Neighborhood names (matched case-insensitively). */
  locations: string[]
  /** Specific types like "Japanese restaurant" (matched case-insensitively). */
  types: string[]
  /** Cleaned-up cuisines like "Japanese" (see cuisine.ts). */
  cuisines: string[]
  prices: number[]
  /** Who recommended it (matched case-insensitively). */
  sources: string[]
  addedWithin: AddedWithin | null
  /** Only cards within this many miles of the user's location. */
  maxMiles: number | null
}

export const EMPTY_FILTERS: CardFilters = {
  statuses: [],
  categories: [],
  locations: [],
  types: [],
  cuisines: [],
  prices: [],
  sources: [],
  addedWithin: null,
  maxMiles: null,
}

const norm = (s: string) => s.trim().toLowerCase()

const DAY_MS = 24 * 60 * 60 * 1000
const ADDED_DAYS: Record<AddedWithin, number> = { week: 7, month: 30 }

const EARTH_RADIUS_MILES = 3958.8

/** Great-circle distance in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

export interface FilterContext {
  /** "Now" for the recently-added window (injectable for tests). */
  now?: Date
  /** The user's location, needed for the distance filter. */
  origin?: LatLng | null
}

/** Within one group any selection matches (OR); across groups all must match (AND). */
export function filterCards(cards: Card[], f: CardFilters, { now = new Date(), origin = null }: FilterContext = {}): Card[] {
  const locations = f.locations.map(norm)
  const types = f.types.map(norm)
  const cuisines = f.cuisines.map(norm)
  const sources = f.sources.map(norm)
  const addedCutoff = f.addedWithin ? now.getTime() - ADDED_DAYS[f.addedWithin] * DAY_MS : null

  return cards.filter((card) => {
    if (f.statuses.length > 0 && !f.statuses.includes(card.status)) return false
    if (f.categories.length > 0 && !f.categories.some((c) => card.categories.includes(c))) return false
    if (locations.length > 0 && !(card.neighborhood !== null && locations.includes(norm(card.neighborhood)))) return false
    if (types.length > 0 && !card.types.some((t) => types.includes(norm(t)))) return false
    if (cuisines.length > 0 && !cuisinesOfTypes(card.types).some((c) => cuisines.includes(norm(c)))) return false
    if (f.prices.length > 0 && !(card.price_level !== null && f.prices.includes(card.price_level))) return false
    if (sources.length > 0 && !(card.source_person !== null && sources.includes(norm(card.source_person)))) return false
    if (addedCutoff !== null && new Date(card.created_at).getTime() < addedCutoff) return false
    if (f.maxMiles !== null) {
      // With no known position yet, don't hide everything — wait for it.
      if (origin) {
        if (card.latitude === null || card.longitude === null) return false
        if (distanceMiles(origin, { latitude: card.latitude, longitude: card.longitude }) > f.maxMiles) return false
      }
    }
    return true
  })
}

export interface Facet<T> {
  value: T
  count: number
}

export interface Facets {
  locations: Facet<string>[]
  types: Facet<string>[]
  cuisines: Facet<string>[]
  prices: Facet<number>[]
  sources: Facet<string>[]
  /** Cards with no coordinates — excluded when a distance filter is on. */
  cardsWithoutCoordinates: number
}

/** Values that actually exist on cards, with how many cards have each. Text
 * values are grouped case-insensitively and shown as first seen. */
export function collectFacets(cards: Card[]): Facets {
  const locations = new Map<string, Facet<string>>()
  const types = new Map<string, Facet<string>>()
  const cuisines = new Map<string, Facet<string>>()
  const sources = new Map<string, Facet<string>>()
  const prices = new Map<number, Facet<number>>()

  const bump = (map: Map<string, Facet<string>>, raw: string) => {
    const key = norm(raw)
    if (!key) return
    const existing = map.get(key)
    if (existing) existing.count++
    else map.set(key, { value: raw.trim(), count: 1 })
  }

  for (const card of cards) {
    if (card.neighborhood) bump(locations, card.neighborhood)
    if (card.source_person) bump(sources, card.source_person)
    for (const c of cuisinesOfTypes(card.types)) bump(cuisines, c)
    // count a card once per distinct type
    for (const t of new Set(card.types.map((t) => t.trim()))) bump(types, t)
    if (card.price_level !== null) {
      const existing = prices.get(card.price_level)
      if (existing) existing.count++
      else prices.set(card.price_level, { value: card.price_level, count: 1 })
    }
  }

  const alpha = (a: Facet<string>, b: Facet<string>) => a.value.localeCompare(b.value, undefined, { sensitivity: "base" })
  return {
    locations: [...locations.values()].sort(alpha),
    types: [...types.values()].sort(alpha),
    cuisines: [...cuisines.values()].sort(alpha),
    sources: [...sources.values()].sort(alpha),
    cardsWithoutCoordinates: cards.filter((c) => c.latitude === null || c.longitude === null).length,
    prices: [...prices.values()].sort((a, b) => a.value - b.value),
  }
}
