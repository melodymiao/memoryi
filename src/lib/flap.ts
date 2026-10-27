/** One position on a split-flap board: a digit/letter tile, or a separator
 * (comma) that sits between tiles with no tile behind it. */
export interface FlapTile {
  char: string
  separator: boolean
}

/**
 * Splits a value into split-flap tiles. Numbers get thousands separators
 * ("4,944"); strings are shown exactly as given, so a padded countdown stays
 * "09". Commas become separators.
 */
export function toFlapTiles(value: string | number): FlapTile[] {
  const text = typeof value === "number" ? value.toLocaleString("en-US") : value
  return [...text].map((char) => ({ char, separator: char === "," }))
}
