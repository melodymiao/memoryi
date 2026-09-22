import { describe, expect, it } from "vitest"
import { collectFacets, distanceMiles, EMPTY_FILTERS, filterCards, sortCards } from "../cardFilters"
import type { Card } from "../../types/database"

let n = 0
function card(over: Partial<Card>): Card {
  n++
  return {
    id: `c${n}`,
    space_id: "s",
    title: `Card ${n}`,
    category: null,
    categories: [],
    status: "wishlist",
    notes: null,
    tags: [],
    place_id: null,
    latitude: null,
    longitude: null,
    address: null,
    neighborhood: null,
    price_level: null,
    photos: [],
    types: [],
    source_person: null,
    source_link: null,
    source_screenshot: null,
    created_by: "u",
    created_at: `2026-01-0${n}T00:00:00.000Z`,
    ...over,
  }
}

describe("sortCards", () => {
  const a = card({ title: "banana", price_level: 3 })
  const b = card({ title: "Apple", price_level: 1 })
  const c = card({ title: "cherry", price_level: null })
  const d = card({ title: "date", price_level: 1 })
  const all = [a, b, c, d]
  const ids = (cards: Card[]) => cards.map((x) => x.title)

  it("sorts by date created", () => {
    expect(ids(sortCards(all, "newest"))).toEqual(["date", "cherry", "Apple", "banana"])
    expect(ids(sortCards(all, "oldest"))).toEqual(["banana", "Apple", "cherry", "date"])
  })

  it("sorts alphabetically, ignoring case", () => {
    expect(ids(sortCards(all, "az"))).toEqual(["Apple", "banana", "cherry", "date"])
    expect(ids(sortCards(all, "za"))).toEqual(["date", "cherry", "banana", "Apple"])
  })

  it("sorts by price with unpriced cards last in both directions", () => {
    expect(ids(sortCards(all, "priceLow"))).toEqual(["date", "Apple", "banana", "cherry"])
    expect(ids(sortCards(all, "priceHigh"))).toEqual(["banana", "date", "Apple", "cherry"])
  })

  it("doesn't mutate its input", () => {
    const copy = [...all]
    sortCards(all, "az")
    expect(all).toEqual(copy)
  })
})

describe("filterCards", () => {
  const sushi = card({ categories: ["food"], neighborhood: "Little Tokyo", types: ["Japanese restaurant"], price_level: 3, status: "visited" })
  const cafe = card({ categories: ["cafe"], neighborhood: "Mira Mesa", types: ["Coffee shop"], price_level: 1 })
  const all = [sushi, cafe]

  it("returns everything with no filters", () => {
    expect(filterCards(all, EMPTY_FILTERS)).toEqual(all)
  })

  it("ORs within a group and ANDs across groups", () => {
    expect(filterCards(all, { ...EMPTY_FILTERS, locations: ["little tokyo", "mira mesa"] })).toEqual(all)
    expect(filterCards(all, { ...EMPTY_FILTERS, locations: ["Mira Mesa"], categories: ["food"] })).toEqual([])
    expect(filterCards(all, { ...EMPTY_FILTERS, types: ["japanese RESTAURANT"] })).toEqual([sushi])
    expect(filterCards(all, { ...EMPTY_FILTERS, prices: [1] })).toEqual([cafe])
    expect(filterCards(all, { ...EMPTY_FILTERS, statuses: ["visited"] })).toEqual([sushi])
  })

  it("excludes cards missing the filtered field", () => {
    expect(filterCards([card({})], { ...EMPTY_FILTERS, prices: [2] })).toEqual([])
    expect(filterCards([card({})], { ...EMPTY_FILTERS, locations: ["x"] })).toEqual([])
  })
})

describe("collectFacets", () => {
  it("lists only values that exist, with counts, grouping case-insensitively", () => {
    const facets = collectFacets([
      card({ neighborhood: "Mira Mesa", types: ["Japanese restaurant"], price_level: 2 }),
      card({ neighborhood: "mira mesa", types: ["japanese restaurant", "omakase"], price_level: 2 }),
      card({ neighborhood: "National City", types: [], price_level: null }),
    ])
    expect(facets.locations).toEqual([
      { value: "Mira Mesa", count: 2 },
      { value: "National City", count: 1 },
    ])
    expect(facets.types).toEqual([
      { value: "Japanese restaurant", count: 2 },
      { value: "omakase", count: 1 },
    ])
    expect(facets.prices).toEqual([{ value: 2, count: 2 }])
  })
})

describe("more filters", () => {
  const now = new Date("2026-03-31T00:00:00.000Z")
  const recent = card({ created_at: "2026-03-28T00:00:00.000Z", source_person: "Jenny", types: ["Sushi restaurant"] })
  const older = card({ created_at: "2026-03-10T00:00:00.000Z", source_person: "sam", types: ["Pizza restaurant"] })
  const ancient = card({ created_at: "2025-01-01T00:00:00.000Z" })
  const all = [recent, older, ancient]

  it("filters by who recommended it, case-insensitively", () => {
    expect(filterCards(all, { ...EMPTY_FILTERS, sources: ["jenny", "SAM"] }, { now })).toEqual([recent, older])
  })

  it("filters by recently added", () => {
    expect(filterCards(all, { ...EMPTY_FILTERS, addedWithin: "week" }, { now })).toEqual([recent])
    expect(filterCards(all, { ...EMPTY_FILTERS, addedWithin: "month" }, { now })).toEqual([recent, older])
  })

  it("filters by cleaned-up cuisine", () => {
    expect(filterCards(all, { ...EMPTY_FILTERS, cuisines: ["Japanese"] }, { now })).toEqual([recent])
    expect(filterCards(all, { ...EMPTY_FILTERS, cuisines: ["italian"] }, { now })).toEqual([older])
  })

  it("filters by distance and drops cards without coordinates", () => {
    const origin = { latitude: 32.7157, longitude: -117.1611 } // downtown San Diego
    const near = card({ latitude: 32.7, longitude: -117.15 })
    const far = card({ latitude: 34.05, longitude: -118.24 }) // Los Angeles
    const unknown = card({})
    expect(filterCards([near, far, unknown], { ...EMPTY_FILTERS, maxMiles: 10 }, { origin })).toEqual([near])
    expect(filterCards([near, far, unknown], { ...EMPTY_FILTERS, maxMiles: 200 }, { origin })).toEqual([near, far])
  })

  it("doesn't hide everything while the position is still unknown", () => {
    const near = card({ latitude: 32.7, longitude: -117.15 })
    expect(filterCards([near, card({})], { ...EMPTY_FILTERS, maxMiles: 5 }, { origin: null })).toHaveLength(2)
  })

  it("collects cuisine, source and coordinate facets", () => {
    const f = collectFacets([recent, older, ancient])
    expect(f.cuisines).toEqual([
      { value: "Italian", count: 1 },
      { value: "Japanese", count: 1 },
    ])
    expect(f.sources).toEqual([
      { value: "Jenny", count: 1 },
      { value: "sam", count: 1 },
    ])
    expect(f.cardsWithoutCoordinates).toBe(3)
  })
})

describe("distanceMiles", () => {
  it("is ~110 miles from San Diego to Los Angeles", () => {
    const d = distanceMiles({ latitude: 32.7157, longitude: -117.1611 }, { latitude: 34.0522, longitude: -118.2437 })
    expect(d).toBeGreaterThan(105)
    expect(d).toBeLessThan(120)
  })
})
