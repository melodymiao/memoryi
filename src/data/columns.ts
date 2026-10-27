/**
 * Maps a camelCase input object to snake_case columns, keeping only the keys
 * that are actually set. `undefined` means "leave it alone" (so the DB default
 * applies on insert, and the column is untouched on update); `null` clears it.
 */
export function toColumns<T extends object>(input: Partial<T>, columns: Record<keyof T, string>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const key of Object.keys(columns) as (keyof T)[]) {
    if (input[key] !== undefined) row[columns[key]] = input[key]
  }
  return row
}
