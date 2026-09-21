import { describe, expect, it } from "vitest"
import { pickNeighborhood } from "../places"

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
