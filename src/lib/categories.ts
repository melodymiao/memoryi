/**
 * The fixed set of card categories. Free-text categories are gone on purpose —
 * keep the slugs in sync with the check constraint in
 * supabase/migrations/20260921120000_card_categories.sql.
 */

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
}

export const CATEGORIES: CategoryDef[] = [
  { slug: "food", emoji: "🍽️", label: "Food", description: "Restaurants, takeout, food trucks" },
  { slug: "cafe", emoji: "☕", label: "Cafe", description: "Coffee shops, tea houses, bakeries" },
  { slug: "bars", emoji: "🍹", label: "Bars", description: "Bars, breweries, wine bars, cocktail lounges" },
  { slug: "dessert", emoji: "🍰", label: "Dessert", description: "Ice cream, boba, pastries, dessert-specific spots" },
  { slug: "shopping", emoji: "🛍️", label: "Shopping", description: "Malls, boutiques, markets, thrift stores" },
  { slug: "entertainment", emoji: "🎬", label: "Entertainment", description: "Movies, concerts, arcades, bowling, karaoke" },
  { slug: "active", emoji: "🏃", label: "Active", description: "Sports, gyms, climbing, mini golf, dance classes" },
  { slug: "events", emoji: "🎉", label: "Events", description: "Festivals, pop-ups, seasonal/one-off happenings" },
  { slug: "nature", emoji: "🌳", label: "Nature", description: "Hikes, parks, beaches, botanical gardens" },
  { slug: "travel", emoji: "✈️", label: "Travel", description: "Day trips, weekend getaways, out-of-town spots" },
  { slug: "home", emoji: "🏡", label: "Home", description: "Cooking together, home date nights, staying in" },
  { slug: "culture", emoji: "🎨", label: "Culture", description: "Museums, galleries, exhibits" },
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
/** "Food, Entertainment, +1 more" — categories collapsed into one label. */
export function categorySummary(categories: string[], visible = 2): string | null {
  const labels = categories
    .map(getCategory)
    .filter((d): d is CategoryDef => d !== undefined)
    .map((d) => d.label)
  if (labels.length === 0) return null
  const shown = labels.slice(0, visible)
  const rest = labels.length - shown.length
  return rest > 0 ? `${shown.join(", ")}, +${rest} more` : shown.join(", ")
}

/** Badges for a card. With `collapseCategories` (list cards) the categories
 * become one "Food, Entertainment, +1 more" badge; otherwise each gets its own
 * (detail screen). */
export function cardBadges(
  card: {
    categories: string[]
    category: string | null
    types: string[]
    price_level: number | null
    neighborhood: string | null
    tags: string[]
  },
  { collapseCategories = false }: { collapseCategories?: boolean } = {},
): string[] {
  const categoryBadges = collapseCategories
    ? [categorySummary(card.categories) ?? card.category].filter((b): b is string => Boolean(b))
    : cardCategoryBadges(card)
  return [
    ...categoryBadges,
    ...card.types,
    ...[priceLabel(card.price_level), card.neighborhood].filter((b): b is string => Boolean(b)),
    ...card.tags,
  ]
}

/** Selected-chip color per category, drawn from the card palette: eat & drink
 * orange, going out wasabi, outdoors & travel sage, indoors & culture blue. */
export type CategoryColor = "orange" | "wasabi" | "sage" | "coolBlue"

export const categoryColor: Record<CategorySlug, CategoryColor> = {
  food: "orange",
  cafe: "orange",
  bars: "orange",
  dessert: "orange",
  shopping: "wasabi",
  entertainment: "wasabi",
  active: "wasabi",
  events: "wasabi",
  nature: "sage",
  travel: "sage",
  home: "coolBlue",
  culture: "coolBlue",
}

/** Full literal class strings (not built dynamically) so Tailwind sees them. */
const selectedChipClasses: Record<CategoryColor, string> = {
  orange: "bg-orange text-orange-fg",
  wasabi: "bg-wasabi text-wasabi-fg",
  sage: "bg-sage text-sage-fg",
  coolBlue: "bg-cool-blue text-cool-blue-fg",
}

export function selectedCategoryChipClass(slug: CategorySlug): string {
  return selectedChipClasses[categoryColor[slug]]
}
