import { useCallback, useEffect, useState, type DependencyList } from "react"

/**
 * The same plain useState/useEffect shape as useCards / useEntries, written
 * once for the LDR hooks: runs `load` on mount (and whenever `deps` change),
 * exposes `refetch` for after a mutation. Still no react-query/SWR — see
 * SCHEMA.md "Data-access layer".
 */
export function useLoader<T>(load: () => Promise<T>, initial: T, deps: DependencyList = []) {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // `load` is usually an inline closure; `deps` is what decides when to reload.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await run())
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [run])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, setData, loading, error, refetch }
}
