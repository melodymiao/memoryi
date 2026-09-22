import { useCallback, useState } from "react"
import type { LatLng } from "./cardFilters"

export type GeoStatus = "idle" | "loading" | "ready" | "denied" | "error"

/** The device's position, requested on demand (call `request()` from a tap so
 * the browser's permission prompt is tied to a user action). Held in memory
 * only — never sent anywhere or saved. */
export function useUserLocation() {
  const [origin, setOrigin] = useState<LatLng | null>(null)
  const [status, setStatus] = useState<GeoStatus>("idle")

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error")
      return
    }
    setStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setStatus("ready")
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    )
  }, [])

  return { origin, status, request }
}
