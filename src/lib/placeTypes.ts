/**
 * Maps Google Places type identifiers (Table A of the Places API "types"
 * list, e.g. "japanese_restaurant", "amusement_center") to this app's fixed
 * categories, so picking a place can pre-select its categories.
 *
 * Two kinds of rule, checked in this order for each type identifier:
 *   1. `exact`  — the identifier is one of these.
 *   2. `tokens` — the identifier, split on "_", contains one of these words
 *      (so "restaurant" catches sushi_restaurant, ramen_restaurant, ...
 *      while "bar" catches wine_bar / sports_bar but not barbecue_restaurant).
 * The first matching rule wins for that identifier, so put more specific
 * categories above generic ones (dessert_restaurant → dessert, not food).
 *
 * Generic Google types (food, store, point_of_interest, establishment,
 * tourist_attraction) are deliberately unmapped — they'd tag everything.
 * "home" is manual-only; Google has no type for staying in.
 *
 * This is a plain list — add or move entries freely.
 */

import type { CategorySlug } from "./categories"

interface Rule {
  category: CategorySlug
  exact?: string[]
  tokens?: string[]
}

const MAX_CATEGORIES = 3

const RULES: Rule[] = [
  // Dessert before food/cafe: dessert_restaurant, ice_cream_shop, bakery-adjacent sweets.
  {
    category: "dessert",
    exact: ["dessert_shop", "dessert_restaurant", "ice_cream_shop", "candy_store", "confectionery", "chocolate_shop", "chocolate_factory", "donut_shop", "juice_shop", "frozen_yogurt_shop", "acai_shop"],
    tokens: ["gelato", "boba", "dessert", "pastry", "creamery"],
  },
  // Bars before food: bar_and_grill, gastropub, brewpub, night_club.
  {
    category: "bars",
    exact: ["bar_and_grill", "night_club", "brewery", "brewpub", "winery", "wine_bar", "cocktail_bar", "lounge_bar", "pub", "irish_pub", "sports_bar", "hookah_bar", "gastropub", "beer_garden", "distillery"],
    tokens: ["bar", "pub", "brewery"],
  },
  {
    category: "cafe",
    exact: ["cafe", "coffee_shop", "coffee_roastery", "coffee_stand", "tea_house", "tea_store", "bakery", "cat_cafe", "dog_cafe", "internet_cafe", "bagel_shop", "sandwich_shop"],
    tokens: ["cafe", "coffee", "bakery"],
  },
  {
    category: "food",
    exact: ["restaurant", "meal_takeaway", "meal_delivery", "food_court", "steak_house", "diner", "deli", "cafeteria", "buffet_restaurant", "food_delivery", "barbecue_restaurant"],
    tokens: ["restaurant", "diner", "eatery", "steakhouse"],
  },
  {
    category: "entertainment",
    exact: ["amusement_center", "amusement_park", "water_park", "movie_theater", "drive_in", "performing_arts_theater", "concert_hall", "live_music_venue", "comedy_club", "opera_house", "philharmonic_hall", "amphitheatre", "bowling_alley", "video_arcade", "karaoke", "casino", "zoo", "aquarium", "wildlife_park", "planetarium", "escape_room", "ferris_wheel", "roller_coaster"],
    tokens: ["arcade", "theater", "theatre", "karaoke", "cinema"],
  },
  {
    category: "shopping",
    exact: ["shopping_mall", "outlet_mall", "department_store", "clothing_store", "shoe_store", "jewelry_store", "book_store", "gift_shop", "florist", "market", "farmers_market", "flea_market", "thrift_store", "consignment_shop", "vintage_store", "electronics_store", "furniture_store", "home_goods_store", "toy_store", "cosmetics_store", "sporting_goods_store", "pet_store", "antique_store", "record_store", "stationery_store", "boutique"],
    tokens: ["boutique", "mall"],
  },
  {
    category: "nature",
    exact: ["park", "city_park", "state_park", "national_park", "dog_park", "hiking_area", "beach", "botanical_garden", "garden", "nature_preserve", "wildlife_refuge", "lake", "river", "woods", "mountain_peak", "picnic_ground", "campground", "camping_cabin", "scenic_spot", "vineyard", "farm"],
  },
  {
    category: "culture",
    exact: ["museum", "art_museum", "history_museum", "art_gallery", "art_studio", "cultural_center", "cultural_landmark", "historical_landmark", "historical_place", "monument", "sculpture", "library", "observation_deck"],
    tokens: ["museum", "gallery"],
  },
  {
    category: "active",
    exact: ["gym", "fitness_center", "sports_club", "sports_complex", "sports_activity_location", "sports_school", "athletic_field", "playground", "golf_course", "miniature_golf_course", "driving_range", "yoga_studio", "pilates_studio", "dance_hall", "swimming_pool", "ice_skating_rink", "roller_skating_rink", "skateboard_park", "ski_resort", "tennis_court", "trampoline_park", "climbing_gym", "rock_climbing"],
    tokens: ["gym", "fitness", "yoga", "pilates", "climbing"],
  },
  {
    category: "events",
    exact: ["event_venue", "convention_center", "wedding_venue", "banquet_hall", "auditorium", "arena", "stadium", "fairgrounds", "exhibition_hall", "festival"],
    tokens: ["festival"],
  },
  // Google only knows lodging, not "out of town" — hotels/resorts are the
  // best proxy for a getaway.
  {
    category: "travel",
    exact: ["lodging", "hotel", "resort_hotel", "motel", "inn", "bed_and_breakfast", "hostel", "extended_stay_hotel", "cottage", "guest_house", "farmstay", "airport", "island"],
  },
]

function categoryForType(type: string): CategorySlug | null {
  const tokens = type.split("_")
  for (const rule of RULES) {
    if (rule.exact?.includes(type)) return rule.category
  }
  for (const rule of RULES) {
    if (rule.tokens?.some((t) => tokens.includes(t))) return rule.category
  }
  return null
}

/** Categories to pre-select for a place, in priority order (the first one
 * also picks the card's color). `types` should list the primary type first. */
export function categoriesFromPlaceTypes(types: string[]): CategorySlug[] {
  const found: CategorySlug[] = []
  for (const type of types) {
    const category = categoryForType(type)
    if (category && !found.includes(category)) found.push(category)
    if (found.length === MAX_CATEGORIES) break
  }
  return found
}
