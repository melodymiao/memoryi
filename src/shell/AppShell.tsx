import { useEffect, type ReactNode } from "react"
import { ensureSession } from "../lib/auth"
import { TabBar } from "../components/ui"

/**
 * Top-level layout: a phone-width column with the floating tab bar fixed to
 * the bottom of the viewport. Per-screen padding (safe areas, clearing the tab
 * bar) lives in Screen.
 *
 * `tabBar={false}` for full-screen pages like the stamp detail.
 */
export function AppShell({ children, tabBar = true }: { children: ReactNode; tabBar?: boolean }) {
  useEffect(() => {
    ensureSession().catch((error) => {
      console.error("Failed to establish Supabase session:", error)
    })
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex flex-1 flex-col overflow-x-clip">{children}</main>
      {tabBar && <TabBar />}
    </div>
  )
}
