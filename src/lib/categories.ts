/**
 * The fixed set of card categories. Free-text categories are gone on purpose —
 * keep the slugs in sync with the check constraint in
 * supabase/migrations/20260921120000_card_categories.sql.
 *
 * Similar categories share a color group (drawn from the existing card
 * palette): eat & drink, going out, outdoors & travel, and indoors & culture.
 */

import type { CardColorName } from "../components/Card"

export type CategoryGroup = "eatDrink" | "outAbout" | "outdoors" | "indoors"

export const CATEGORY_SLUGS = [
  "food",
  "cafe",
  "bars",
  "dessert",
  "shopping",
  "home",
  "entertainment",
  "nature",
  "culture",
  "travel",
  "active",
  "events",
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export interface CategoryDef {
  slug: CategorySlug
  emoji: string
  label: string
  description: string
  group: CategoryGroup
}

export const CATEGORIES: CategoryDef[] = [
  { slug: "food", emoji: "🍽️", label: "Food", description: "Restaurants, takeout, food trucks", group: "eatDrink" },
  { slug: "cafe", emoji: "☕", label: "Cafe", description: "Coffee shops, tea houses, bakeries", group: "eatDrink" },
  { slug: "bars", emoji: "🍹", label: "Bars", description: "Bars, breweries, wine bars, cocktail lounges", group: "eatDrink" },
  { slug: "dessert", emoji: "🍰", label: "Dessert", description: "Ice cream, boba, pastries, dessert-specific spots", group: "eatDrink" },
  { slug: "shopping", emoji: "🛍️", label: "Shopping", description: "Malls, boutiques, markets, thrift stores", group: "outAbout" },
  { slug: "entertainment", emoji: "🎬", label: "Entertainment", description: "Movies, concerts, arcades, bowling, karaoke", group: "outAbout" },
  { slug: "active", emoji: "🏃", label: "Active", description: "Sports, gyms, climbing, mini golf, dance classes", group: "outAbout" },
  { slug: "events", emoji: "🎉", label: "Events", description: "Festivals, pop-ups, seasonal/one-off happenings", group: "outAbout" },
  { slug: "nature", emoji: "🌳", label: "Nature", description: "Hikes, parks, beaches, botanical gardens", group: "outdoors" },
  { slug: "travel", emoji: "✈️", label: "Travel", description: "Day trips, weekend getaways, out-of-town spots", group: "outdoors" },
  { slug: "home", emoji: "🏡", label: "Home", description: "Cooking together, home date nights, staying in", group: "indoors" },
  { slug: "culture", emoji: "🎨", label: "Culture", description: "Museums, galleries, exhibits", group: "indoors" },
]

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value)
}

const BY_SLUG = new Map<string, CategoryDef>(CATEGORIES.map((c) => [c.slug, c]))

export function getCategory(slug: string): CategoryDef | undefined {
  return BY_SLUG.get(slug)
}

/** "🍽️ Food" — used for card badges. Unknown slugs are dropped by callers. */
export function categoryBadge(def: CategoryDef): string {
  return `${def.emoji} ${def.label}`
}

/** Badge text for a card: its fixed categories, or the legacy free-text
 * category if it hasn't been re-categorized yet. */
export function cardCategoryBadges(card: { categories: string[]; category: string | null }): string[] {
  const defs = card.categories.map(getCategory).filter((d): d is CategoryDef => d !== undefined)
  if (defs.length > 0) return defs.map(categoryBadge)
  return card.category ? [card.category] : []
}

/** "$"–"$$$$" for a 1–4 price level; null when unset. */
export function priceLabel(level: number | null): string | null {
  return level && level >= 1 && level <= 4 ? "$".repeat(level) : null
}

/** Small labels shown on a card: its categories (or legacy text), then specific
 * types, price, neighborhood, and any legacy free-text tags. */
export function cardBadges(card: {
  categories: string[]
  category: string | null
  types: string[]
  price_level: number | null
  neighborhood: string | null
  tags: string[]
}): string[] {
  return [
    ...cardCategoryBadges(card),
    ...card.types,
    ...[priceLabel(card.price_level), card.neighborhood].filter((b): b is string => Boolean(b)),
    ...card.tags,
  ]
}

export const groupCardColor: Record<CategoryGroup, CardColorName> = {
  eatDrink: "orange",
  outAbout: "wasabi",
  outdoors: "sage",
  indoors: "coolBlue",
}

/** Full literal class strings (not built dynamically) so Tailwind can see them.
 * `idle` = tinted, `active` = solid with an ink ring. */
export const groupChipClasses: Record<CategoryGroup, { idle: string; active: string }> = {
  eatDrink: { idle: "bg-orange/25 text-orange-fg", active: "bg-orange text-orange-fg ring-2 ring-ink" },
  outAbout: { idle: "bg-wasabi/35 text-wasabi-fg", active: "bg-wasabi text-wasabi-fg ring-2 ring-ink" },
  outdoors: { idle: "bg-sage/35 text-sage-fg", active: "bg-sage text-sage-fg ring-2 ring-ink" },
  indoors: { idle: "bg-cool-blue/60 text-cool-blue-fg", active: "bg-cool-blue text-cool-blue-fg ring-2 ring-ink" },
}
