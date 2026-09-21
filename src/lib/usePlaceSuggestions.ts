import { useEffect, useState } from "react"
import { placesEnabled, searchPlaces, type PlaceSuggestion } from "./places"

const MIN_CHARS = 3
const DEBOUNCE_MS = 300

/** Debounced autocomplete suggestions for `query`. Empty when disabled, the
 * query is short, or the request fails (autocomplete is a nicety — a failure
 * shouldn't block adding a card). */
export function usePlaceSuggestions(query: string, sessionToken: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!enabled || !placesEnabled || q.length < MIN_CHARS) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    const timer = window.setTimeout(() => {
      searchPlaces(q, sessionToken, controller.signal)
        .then((result) => {
          setSuggestions(result)
          setLoading(false)
        })
        .catch((err: unknown) => {
          if ((err as Error).name === "AbortError") return
          console.warn(err)
          setSuggestions([])
          setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, sessionToken, enabled])

  return { suggestions, loading }
}
