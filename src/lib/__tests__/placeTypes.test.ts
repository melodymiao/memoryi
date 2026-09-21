import { describe, expect, it } from "vitest"
import { CATEGORY_SLUGS } from "../categories"
import { categoriesFromPlaceTypes } from "../placeTypes"

describe("categoriesFromPlaceTypes", () => {
  it("maps any *_restaurant type to food", () => {
    expect(categoriesFromPlaceTypes(["sushi_restaurant"])).toEqual(["food"])
    expect(categoriesFromPlaceTypes(["restaurant"])).toEqual(["food"])
  })

  it("maps common places", () => {
    expect(categoriesFromPlaceTypes(["amusement_center"])).toEqual(["entertainment"])
    expect(categoriesFromPlaceTypes(["coffee_shop"])).toEqual(["cafe"])
    expect(categoriesFromPlaceTypes(["ice_cream_shop"])).toEqual(["dessert"])
    expect(categoriesFromPlaceTypes(["wine_bar"])).toEqual(["bars"])
    expect(categoriesFromPlaceTypes(["shopping_mall"])).toEqual(["shopping"])
    expect(categoriesFromPlaceTypes(["botanical_garden"])).toEqual(["nature"])
    expect(categoriesFromPlaceTypes(["art_museum"])).toEqual(["culture"])
    expect(categoriesFromPlaceTypes(["climbing_gym"])).toEqual(["active"])
    expect(categoriesFromPlaceTypes(["event_venue"])).toEqual(["events"])
    expect(categoriesFromPlaceTypes(["resort_hotel"])).toEqual(["travel"])
  })

  it("prefers the more specific category for one identifier", () => {
    expect(categoriesFromPlaceTypes(["dessert_restaurant"])).toEqual(["dessert"])
    expect(categoriesFromPlaceTypes(["bar_and_grill"])).toEqual(["bars"])
    // bar as a whole word only — barbecue is food
    expect(categoriesFromPlaceTypes(["barbecue_restaurant"])).toEqual(["food"])
  })

  it("keeps priority order, dedupes, and caps at three", () => {
    expect(categoriesFromPlaceTypes(["japanese_restaurant", "bar", "restaurant"])).toEqual(["food", "bars"])
    expect(
      categoriesFromPlaceTypes(["restaurant", "bar", "cafe", "movie_theater", "shopping_mall"]),
    ).toEqual(["food", "bars", "cafe"])
  })

  it("ignores generic and unknown types", () => {
    expect(categoriesFromPlaceTypes(["food", "point_of_interest", "establishment", "store", "tourist_attraction"])).toEqual([])
    expect(categoriesFromPlaceTypes([])).toEqual([])
  })

  it("only ever returns valid category slugs", () => {
    const all = [
      "restaurant", "cafe", "bar", "amusement_center", "park", "museum", "gym", "event_venue", "hotel",
      "ice_cream_shop", "shopping_mall",
    ]
    for (const c of categoriesFromPlaceTypes(all)) expect(CATEGORY_SLUGS).toContain(c)
  })
})
