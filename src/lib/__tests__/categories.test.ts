import { describe, expect, it } from "vitest"
import sql from "../../../supabase/migrations/20260921120000_card_categories.sql?raw"
import { CATEGORIES, CATEGORY_SLUGS, cardBadges, cardCategoryBadges, isCategorySlug, priceLabel } from "../categories"

describe("categories", () => {
  it("defines exactly the twelve fixed categories, each once", () => {
    expect(CATEGORIES.map((c) => c.slug).sort()).toEqual([...CATEGORY_SLUGS].sort())
    expect(new Set(CATEGORY_SLUGS).size).toBe(12)
  })

  it("matches the slugs allowed by the database check constraint", () => {
    const constraint = sql.slice(sql.indexOf("cards_categories_allowed check"))
    for (const slug of CATEGORY_SLUGS) expect(constraint).toContain(`'${slug}'`)
  })

  it("rejects unknown slugs", () => {
    expect(isCategorySlug("food")).toBe(true)
    expect(isCategorySlug("activity")).toBe(false)
  })

  it("badges a card by its categories, falling back to the legacy text", () => {
    expect(cardCategoryBadges({ categories: ["food", "cafe"], category: "old" })).toEqual(["🍽️ Food", "☕ Cafe"])
    expect(cardCategoryBadges({ categories: [], category: "date night" })).toEqual(["date night"])
    expect(cardCategoryBadges({ categories: [], category: null })).toEqual([])
  })

  it("builds a card's badges: categories, types, price, neighborhood, legacy tags", () => {
    expect(
      cardBadges({
        categories: ["food"],
        category: null,
        types: ["omakase"],
        price_level: 3,
        neighborhood: "Little Tokyo",
        tags: ["date night"],
      }),
    ).toEqual(["🍽️ Food", "omakase", "$$$", "Little Tokyo", "date night"])
  })

  it("formats price levels", () => {
    expect(priceLabel(1)).toBe("$")
    expect(priceLabel(4)).toBe("$$$$")
    expect(priceLabel(null)).toBeNull()
    expect(priceLabel(0)).toBeNull()
  })
})
