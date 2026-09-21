/**
 * Thin client for the Google Places API (New): autocomplete suggestions while
 * typing a card title, and a details lookup once one is picked. Called
 * straight from the browser, so VITE_GOOGLE_PLACES_API_KEY is public — it must
 * be restricted in Google Cloud to this site's referrers and the Places API
 * only (see .env.example). Without a key, everything here is a no-op and the
 * form falls back to manual entry.
 *
 * Autocomplete + Details share a session token so Google bills them as one
 * session rather than per keystroke.
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined
const BASE = "https://places.googleapis.com/v1"

export const placesEnabled = Boolean(API_KEY)

export interface PlaceSuggestion {
  placeId: string
  /** Business name, e.g. "Sushi Gen". */
  name: string
  /** Address / area line, e.g. "422 E 2nd St, Los Angeles, CA". */
  secondary: string
}

export interface PlaceDetails {
  placeId: string
  name: string
  address: string
  /** Neighborhood if Google has one, else the sub-area or city. */
  neighborhood: string
  /** 1–4 for $–$$$$, or null when Google has no price info. */
  priceLevel: number | null
  /** Google's specific type, e.g. "Sushi restaurant"; empty if unknown. */
  type: string
  /** Google type identifiers, primary type first (see placeTypes.ts). */
  placeTypes: string[]
  /** City / neighborhood names for this place, used to trim them off titles. */
  areaNames: string[]
}

export function newSessionToken(): string {
  return crypto.randomUUID()
}

interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId: string
      text?: { text: string }
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } }
    }
  }[]
}

export async function searchPlaces(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  if (!API_KEY) return []
  const res = await fetch(`${BASE}/places:autocomplete`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": API_KEY },
    body: JSON.stringify({ input, sessionToken }),
  })
  if (!res.ok) throw new Error(`Places autocomplete failed (${res.status})`)

  const data = (await res.json()) as AutocompleteResponse
  const out: PlaceSuggestion[] = []
  for (const s of data.suggestions ?? []) {
    const p = s.placePrediction
    if (!p) continue
    out.push({
      placeId: p.placeId,
      name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondary: p.structuredFormat?.secondaryText?.text ?? "",
    })
  }
  return out
}

interface AddressComponent {
  longText: string
  types: string[]
}

interface DetailsResponse {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  addressComponents?: AddressComponent[]
  priceLevel?: string
  primaryTypeDisplayName?: { text: string }
  primaryType?: string
  types?: string[]
}

const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

/** Google's price-level enum → 1–4 (free / unspecified → null). */
export function priceLevelFromGoogle(level: string | undefined): number | null {
  return (level && PRICE_LEVELS[level]) || null
}

const AREA_TYPES = ["neighborhood", "sublocality_level_1", "sublocality", "locality"]

/** Best "where is this" label from Google's address parts. */
export function pickNeighborhood(components: AddressComponent[] = []): string {
  for (const type of AREA_TYPES) {
    const match = components.find((c) => c.types.includes(type))
    if (match) return match.longText
  }
  return ""
}

// priceLevel and primaryTypeDisplayName are in Google's higher-priced field
// tiers; drop them from this mask to make lookups cheaper (price/type autofill
// then stops).
const DETAILS_FIELDS = "id,displayName,formattedAddress,addressComponents,priceLevel,primaryTypeDisplayName,primaryType,types"

/** Names of the neighborhood / sub-area / city parts of an address. */
export function areaNamesOf(components: AddressComponent[] = []): string[] {
  const names = new Set<string>()
  for (const c of components) {
    if (AREA_TYPES.some((t) => c.types.includes(t))) names.add(c.longText)
  }
  return [...names]
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Drops a trailing city/neighborhood from a business name — "Din Tai Fung -
 * Arcadia", "Blue Bottle (Hayes Valley)" or "Nobu Malibu" — when it matches one
 * of the place's own area names. Only trailing, whole-word matches are
 * removed, and a name that would end up empty is left alone. */
export function stripAreaFromName(name: string, areas: string[]): string {
  const cleaned = areas.map((a) => a.trim()).filter(Boolean)
  if (cleaned.length === 0) return name
  const alternatives = cleaned.sort((a, b) => b.length - a.length).map(escapeRegExp).join("|")
  // separator (dash, comma, pipe, "at", "in", "(" or just a space) + area + optional ")"
  const trailing = new RegExp(`(?:\\s*[-–—|,:·]\\s*|\\s+\\(|\\s+(?:at|in)\\s+|\\s+)(?:${alternatives})\\)?\\s*$`, "i")

  let result = name.trim()
  for (let i = 0; i < 3; i++) {
    const next = result.replace(trailing, "").replace(/[\s\-–—|,:·(]+$/, "")
    if (next === result || next.length < 2) break
    result = next
  }
  return result
}

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceDetails> {
  if (!API_KEY) throw new Error("Places API key not configured")
  const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}?sessionToken=${sessionToken}`, {
    signal,
    headers: { "X-Goog-Api-Key": API_KEY, "X-Goog-FieldMask": DETAILS_FIELDS },
  })
  if (!res.ok) throw new Error(`Places details failed (${res.status})`)

  const data = (await res.json()) as DetailsResponse
  return {
    placeId: data.id,
    name: data.displayName?.text ?? "",
    address: data.formattedAddress ?? "",
    neighborhood: pickNeighborhood(data.addressComponents),
    priceLevel: priceLevelFromGoogle(data.priceLevel),
    type: data.primaryTypeDisplayName?.text ?? "",
    areaNames: areaNamesOf(data.addressComponents),
    placeTypes: [...new Set([data.primaryType, ...(data.types ?? [])].filter((t): t is string => Boolean(t)))],
  }
}
