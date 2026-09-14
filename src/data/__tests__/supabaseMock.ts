import { vi } from "vitest"

/**
 * Minimal fake for a supabase-js query builder. Real query builders are
 * chainable AND thenable (awaiting one resolves `{ data, error }` without
 * an explicit terminal call) — this mock matches that shape so code under
 * test can `await supabase.from(...).select(...).eq(...)` exactly like
 * against the real client.
 */
export function makeQueryMock(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  const chainable = ["select", "eq", "order", "limit", "insert", "update", "delete", "single", "maybeSingle", "returns"]
  for (const method of chainable) {
    builder[method] = vi.fn(() => builder)
  }
  // oxlint-disable-next-line no-thenable -- intentional: matches supabase-js's own thenable builders
  ;(builder as { then: (resolve: (r: typeof result) => void) => void }).then = (resolve) => resolve(result)
  return builder
}
