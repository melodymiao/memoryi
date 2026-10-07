import { describe, expect, it } from "vitest"
import { detailOptions, EMPTY_PREFS, inArea, matchesPrefs, shuffled, type SavedPlaces } from "../shuffle"
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
    created_at: "2026-01-01T00:00:00.000Z",
    ...over,
  }
}

const noPlaces: SavedPlaces = { home: null, work: null }
const prefs = (p: Partial<typeof EMPTY_PREFS>) => ({ ...EMPTY_PREFS, ...p })

describe("matchesPrefs", () => {
  const sushi = card({ categories: ["food"], types: ["Sushi restaurant"], price_level: 3 })
  const tacos = card({ categories: ["food"], types: ["Taco joint"], price_level: 1 })
  const bar = card({ categories: ["bars"], types: ["Wine bar"] })

  it("matches everything with no answers", () => {
    expect([sushi, tacos, bar].every((c) => matchesPrefs(c, EMPTY_PREFS, noPlaces))).toBe(true)
  })

  it("narrows food by cuisine but leaves other picked categories alone", () => {
    const p = prefs({ categories: ["food", "bars"], details: { food: ["Japanese"] } })
    expect(matchesPrefs(sushi, p, noPlaces)).toBe(true)
    expect(matchesPrefs(tacos, p, noPlaces)).toBe(false)
    expect(matchesPrefs(bar, p, noPlaces)).toBe(true)
  })

  it("keeps unpriced cards and folds $$$$ into $$$", () => {
    expect(matchesPrefs(bar, prefs({ prices: [1] }), noPlaces)).toBe(true)
    expect(matchesPrefs(card({ price_level: 4 }), prefs({ prices: [3] }), noPlaces)).toBe(true)
    expect(matchesPrefs(sushi, prefs({ prices: [1, 2] }), noPlaces)).toBe(false)
  })
})

describe("inArea", () => {
  const pacificBeach = card({ latitude: 32.797, longitude: -117.25 })
  const hollywood = card({ latitude: 34.098, longitude: -118.326 })

  it("places cards in metros and near the coast", () => {
    expect(inArea(pacificBeach, "sd", noPlaces)).toBe(true)
    expect(inArea(pacificBeach, "beach", noPlaces)).toBe(true)
    expect(inArea(hollywood, "la", noPlaces)).toBe(true)
    expect(inArea(hollywood, "beach", noPlaces)).toBe(false)
    expect(inArea(hollywood, "sd", noPlaces)).toBe(false)
  })

  it("needs a saved spot for home/work and coordinates on the card", () => {
    expect(inArea(pacificBeach, "home", noPlaces)).toBe(false)
    expect(inArea(pacificBeach, "home", { home: { latitude: 32.8, longitude: -117.24 }, work: null })).toBe(true)
    expect(inArea(card({}), "sd", noPlaces)).toBe(false)
  })
})

describe("detailOptions", () => {
  it("offers cuisines for food and raw types otherwise", () => {
    const cards = [
      card({ categories: ["food"], types: ["Ramen restaurant"] }),
      card({ categories: ["bars"], types: ["Speakeasy"] }),
    ]
    expect(detailOptions(cards, "food")).toEqual(["Japanese"])
    expect(detailOptions(cards, "bars")).toEqual(["Speakeasy"])
  })
})

describe("shuffled", () => {
  it("returns a permutation without mutating the input", () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffled(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual(input)
  })
})
