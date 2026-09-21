import { describe, expect, it } from "vitest"
import { pickNeighborhood, priceLevelFromGoogle } from "../places"

const c = (longText: string, ...types: string[]) => ({ longText, types })

describe("pickNeighborhood", () => {
  it("prefers the neighborhood over broader areas", () => {
    expect(pickNeighborhood([c("Los Angeles", "locality"), c("Little Tokyo", "neighborhood", "political")])).toBe(
      "Little Tokyo",
    )
  })

  it("falls back to sublocality, then locality", () => {
    expect(pickNeighborhood([c("Los Angeles", "locality"), c("Downtown", "sublocality_level_1")])).toBe("Downtown")
    expect(pickNeighborhood([c("Pasadena", "locality")])).toBe("Pasadena")
  })

  it("returns empty when nothing usable", () => {
    expect(pickNeighborhood([c("CA", "administrative_area_level_1")])).toBe("")
    expect(pickNeighborhood(undefined)).toBe("")
  })
})

describe("priceLevelFromGoogle", () => {
  it("maps Google's enum to 1–4", () => {
    expect(priceLevelFromGoogle("PRICE_LEVEL_INEXPENSIVE")).toBe(1)
    expect(priceLevelFromGoogle("PRICE_LEVEL_MODERATE")).toBe(2)
    expect(priceLevelFromGoogle("PRICE_LEVEL_EXPENSIVE")).toBe(3)
    expect(priceLevelFromGoogle("PRICE_LEVEL_VERY_EXPENSIVE")).toBe(4)
  })

  it("returns null for free, unspecified, or missing", () => {
    expect(priceLevelFromGoogle("PRICE_LEVEL_FREE")).toBeNull()
    expect(priceLevelFromGoogle("PRICE_LEVEL_UNSPECIFIED")).toBeNull()
    expect(priceLevelFromGoogle(undefined)).toBeNull()
  })
})
