import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { registerSW } from "virtual:pwa-register"
import { App } from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// registerType is 'autoUpdate': a new worker skips waiting, claims clients, and
// this reloads the page once it takes over. Browsers (iOS home-screen apps
// especially) don't reliably re-check the worker on their own, so poll hourly
// and whenever the app comes back to the foreground.
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    const check = () => {
      if (navigator.onLine) void registration.update()
    }
    setInterval(check, 60 * 60 * 1000)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check()
    })
  },
})
