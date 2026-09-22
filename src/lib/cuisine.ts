/**
 * Cleans free-form / Google place types into cuisines so "Sushi restaurant",
 * "Ramen restaurant" and "Japanese restaurant" all filter as "Japanese".
 * A type only counts as a cuisine if it's a known cuisine, an alias below, or
 * "<something> restaurant"; "Coffee shop", "omakase" and friends yield null.
 *
 * Plain data — add aliases freely.
 */

const ALIASES: Record<string, string> = {
  sushi: "Japanese",
  ramen: "Japanese",
  izakaya: "Japanese",
  teppanyaki: "Japanese",
  tempura: "Japanese",
  udon: "Japanese",
  yakitori: "Japanese",
  omakase: "Japanese",
  pho: "Vietnamese",
  taco: "Mexican",
  tacos: "Mexican",
  taqueria: "Mexican",
  burrito: "Mexican",
  pizza: "Italian",
  pasta: "Italian",
  trattoria: "Italian",
  hamburger: "American",
  burger: "American",
  steak: "American",
  "steak house": "American",
  steakhouse: "American",
  diner: "American",
  "dim sum": "Chinese",
  hotpot: "Chinese",
  "hot pot": "Chinese",
  "korean barbecue": "Korean",
  kbbq: "Korean",
  "middle eastern": "Middle Eastern",
}

const KNOWN = new Set([
  "japanese", "chinese", "korean", "thai", "vietnamese", "indian", "mexican", "italian", "french",
  "greek", "mediterranean", "american", "spanish", "turkish", "lebanese", "ethiopian", "filipino",
  "indonesian", "malaysian", "taiwanese", "cajun", "caribbean", "brazilian", "peruvian", "german",
  "british", "irish", "moroccan", "persian", "afghani", "african", "asian", "latin american",
  "southern", "hawaiian", "seafood", "vegan", "vegetarian", "barbecue", "fusion", "fast food",
])

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** The cuisine a type string implies, or null if it isn't one. */
export function cuisineOf(type: string): string | null {
  const t = type.trim().toLowerCase()
  if (!t) return null
  const bare = t.replace(/\s+(restaurants?|joint|place|spot|shop)$/, "").trim()
  if (ALIASES[bare]) return ALIASES[bare]
  if (KNOWN.has(bare)) return titleCase(bare)
  // "<something> restaurant" that we don't specifically know: keep the prefix.
  if (bare !== t && /restaurants?$/.test(t) && bare.length > 1) return titleCase(bare)
  return null
}

/** Distinct cuisines across a card's types. */
export function cuisinesOfTypes(types: string[]): string[] {
  const out: string[] = []
  for (const type of types) {
    const c = cuisineOf(type)
    if (c && !out.includes(c)) out.push(c)
  }
  return out
}
