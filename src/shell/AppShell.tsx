import { useEffect, type ReactNode } from "react"
import { ensureSession } from "../lib/auth"
import { TabBar } from "./TabBar"

/**
 * Top-level layout: safe-area padding for the status bar / Dynamic Island up
 * top, scrollable screen content, floating tab bar pinned to the bottom.
 * `viewport-fit=cover` (index.html) is what makes `env(safe-area-inset-*)`
 * report real, non-zero values instead of 0 on iOS.
 *
 * `tabBar={false}` for full-screen overlay routes (card add/detail) — Figma's
 * cards-3 frame replaces the tab bar entirely with its own bottom CTA strip,
 * matching the "close" button pattern rather than the 4-tab shell.
 */
export function AppShell({ children, tabBar = true }: { children: ReactNode; tabBar?: boolean }) {
  useEffect(() => {
    ensureSession().catch((error) => {
      console.error("Failed to establish Supabase session:", error)
    })
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main
        className="flex-1 overflow-x-clip"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: tabBar ? "calc(env(safe-area-inset-bottom) + 96px)" : "env(safe-area-inset-bottom)",
        }}
      >
        {children}
      </main>
      {tabBar && <TabBar />}
    </div>
  )
}
