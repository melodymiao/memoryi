import type { CardColorName } from "../components/Card"
import { categoryColor, isCategorySlug } from "./categories"

const ORDER: CardColorName[] = ["wasabi", "coolBlue", "sage", "orange"]

/** Deterministic color per card id, so the same card renders the same color
 * in the list and on its own detail screen without storing a color column. */
export function cardColorForId(id: string): CardColorName {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return ORDER[Math.abs(hash) % ORDER.length]
}

/** A card takes the color of its first category (Food → orange, Nature →
 * sage, ...); cards with no category fall back to the id-based color. */
export function cardColorFor(card: { id: string; categories: string[] }): CardColorName {
  const first = card.categories.find(isCategorySlug)
  return first ? categoryColor[first] : cardColorForId(card.id)
}
