/**
 * Stamp tint per city (docs/DESIGN.md "City stamps"). Each city always gets
 * the same tint. Values are color token names, used as var(--color-<tint>).
 * A new city needs its own tint picked from the palette — until then it falls
 * back to `surface-muted`.
 */
export type StampTint = "pink" | "lime" | "on-dark-muted" | "surface-muted"

const CITY_TINT: Record<string, StampTint> = {
  "san francisco": "pink",
  "los angeles": "lime",
  "san diego": "on-dark-muted",
}

export function cityTint(city: string): StampTint {
  return CITY_TINT[city.trim().toLowerCase()] ?? "surface-muted"
}
