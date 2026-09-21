import { describe, expect, it } from "vitest"
import { cardColorFor, cardColorForId } from "../cardColor"

describe("cardColorFor", () => {
  it("uses the first category's color", () => {
    expect(cardColorFor({ id: "a", categories: ["food", "entertainment", "shopping"] })).toBe("orange")
    expect(cardColorFor({ id: "a", categories: ["entertainment", "food"] })).toBe("wasabi")
    expect(cardColorFor({ id: "a", categories: ["nature"] })).toBe("sage")
    expect(cardColorFor({ id: "a", categories: ["culture"] })).toBe("coolBlue")
  })

  it("falls back to the id-based color with no valid category", () => {
    expect(cardColorFor({ id: "abc", categories: [] })).toBe(cardColorForId("abc"))
    expect(cardColorFor({ id: "abc", categories: ["legacy-thing"] })).toBe(cardColorForId("abc"))
  })
})
