import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "./shell/AppShell"
import { HomeScreen } from "./screens/HomeScreen"
import { TripsScreen } from "./screens/TripsScreen"
import { PlansScreen } from "./screens/PlansScreen"
import { PassportScreen } from "./screens/PassportScreen"
import { StampDetailScreen } from "./screens/StampDetailScreen"

// Component gallery for checking the design system on a phone. Dev only: the
// import sits behind import.meta.env.DEV, so production builds drop it.
const UiGallery = import.meta.env.DEV ? lazy(() => import("./dev/UiGallery")) : null

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell><HomeScreen /></AppShell>} />
        <Route path="/trips" element={<AppShell><TripsScreen /></AppShell>} />
        <Route path="/plans" element={<AppShell><PlansScreen /></AppShell>} />
        <Route path="/passport" element={<AppShell><PassportScreen /></AppShell>} />
        <Route path="/passport/stamps/:tripId" element={<AppShell tabBar={false}><StampDetailScreen /></AppShell>} />
        {UiGallery && (
          <Route
            path="/dev/ui"
            element={
              <AppShell>
                <Suspense fallback={null}>
                  <UiGallery />
                </Suspense>
              </AppShell>
            }
          />
        )}
        {/* Old memoryi routes (/cards, /shuffle, …) and anything else land on Home. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
