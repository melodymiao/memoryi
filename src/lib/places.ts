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

// Address fields only (cheapest tier). Price level and place types are a
// costlier tier — add them to this mask when wiring up price/type autofill.
const DETAILS_FIELDS = "id,displayName,formattedAddress,addressComponents"

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
  }
}
