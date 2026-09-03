import type { ReactNode } from "react"
import { TabBar } from "./TabBar"

/**
 * Top-level layout: safe-area padding for the status bar / Dynamic Island up
 * top, scrollable screen content, floating tab bar pinned to the bottom.
 * `viewport-fit=cover` (index.html) is what makes `env(safe-area-inset-*)`
 * report real, non-zero values instead of 0 on iOS.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)",
        }}
      >
        {children}
      </main>
      <TabBar />
    </div>
  )
}
