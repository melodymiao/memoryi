import { describe, expect, it } from "vitest"
import { areaNamesOf, pickNeighborhood, priceLevelFromGoogle, stripAreaFromName } from "../places"

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

describe("stripAreaFromName", () => {
  const areas = ["Arcadia", "Los Angeles"]

  it("removes a trailing city after a separator", () => {
    expect(stripAreaFromName("Din Tai Fung - Arcadia", areas)).toBe("Din Tai Fung")
    expect(stripAreaFromName("Din Tai Fung, Arcadia", areas)).toBe("Din Tai Fung")
    expect(stripAreaFromName("Din Tai Fung | Arcadia", areas)).toBe("Din Tai Fung")
    expect(stripAreaFromName("Din Tai Fung (Arcadia)", areas)).toBe("Din Tai Fung")
    expect(stripAreaFromName("Din Tai Fung at Arcadia", areas)).toBe("Din Tai Fung")
  })

  it("removes a bare trailing city", () => {
    expect(stripAreaFromName("Din Tai Fung Arcadia", areas)).toBe("Din Tai Fung")
    expect(stripAreaFromName("Blue Bottle Coffee Los Angeles", areas)).toBe("Blue Bottle Coffee")
  })

  it("leaves names alone otherwise", () => {
    expect(stripAreaFromName("Arcadia Tavern", areas)).toBe("Arcadia Tavern")
    expect(stripAreaFromName("Sushi Gen", areas)).toBe("Sushi Gen")
    expect(stripAreaFromName("Arcadia", areas)).toBe("Arcadia")
    expect(stripAreaFromName("Sushi Gen - Arcadia", [])).toBe("Sushi Gen - Arcadia")
  })

  it("only matches whole words", () => {
    expect(stripAreaFromName("Cafe Arcadiana", areas)).toBe("Cafe Arcadiana")
  })
})

describe("areaNamesOf", () => {
  it("collects neighborhood, sub-area and city names only", () => {
    expect(
      areaNamesOf([c("Arcadia", "locality"), c("Los Angeles County", "administrative_area_level_2"), c("Downtown", "sublocality_level_1")]),
    ).toEqual(["Arcadia", "Downtown"])
  })
})
