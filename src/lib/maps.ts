/** Google Maps link for a place, using the documented Maps URL scheme. With a
 * Places id Google opens the exact place; otherwise it searches the address
 * (or name). Returns null when there's nothing to look up. */
export function mapsUrl({
  placeId,
  address,
  name,
}: {
  placeId?: string | null
  address?: string | null
  name?: string | null
}): string | null {
  const query = [name, address].filter(Boolean).join(" ").trim()
  if (!query) return null
  const params = new URLSearchParams({ api: "1", query })
  if (placeId) params.set("query_place_id", placeId)
  return `https://www.google.com/maps/search/?${params.toString()}`
}
