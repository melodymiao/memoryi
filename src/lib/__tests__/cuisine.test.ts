import { describe, expect, it } from "vitest"
import { cuisineOf, cuisinesOfTypes } from "../cuisine"

describe("cuisineOf", () => {
  it("groups Japanese-ish types together", () => {
    for (const t of ["Japanese restaurant", "Sushi restaurant", "Ramen Restaurant", "sushi", "omakase", "Japanese"]) {
      expect(cuisineOf(t)).toBe("Japanese")
    }
  })

  it("maps other common ones", () => {
    expect(cuisineOf("Pizza restaurant")).toBe("Italian")
    expect(cuisineOf("Hamburger restaurant")).toBe("American")
    expect(cuisineOf("Taco shop")).toBe("Mexican")
    expect(cuisineOf("Middle Eastern restaurant")).toBe("Middle Eastern")
    expect(cuisineOf("Vietnamese restaurant")).toBe("Vietnamese")
  })

  it("keeps the prefix of an unknown '<x> restaurant'", () => {
    expect(cuisineOf("Fondue restaurant")).toBe("Fondue")
  })

  it("returns null for non-cuisines", () => {
    for (const t of ["Coffee shop", "Bakery", "Bar", "", "restaurant", "Restaurant"]) {
      expect(cuisineOf(t)).toBeNull()
    }
  })
})

describe("cuisinesOfTypes", () => {
  it("dedupes across types", () => {
    expect(cuisinesOfTypes(["Sushi restaurant", "Japanese restaurant", "Coffee shop"])).toEqual(["Japanese"])
  })
})
