import type { CSSProperties, ReactNode } from "react"

/**
 * One screen's content area: 20px sides, a small gap below the status bar
 * (`screen-top`, plus the top safe area in case the status bar ever overlays
 * the page), and enough bottom padding to scroll clear of the tab bar.
 *
 * `background` overrides the app background, e.g. a city tint on the stamp
 * page. `tabBar={false}` drops the tab-bar clearance.
 */
export function Screen({
  background,
  tabBar = true,
  className = "",
  children,
}: {
  background?: string
  tabBar?: boolean
  className?: string
  children: ReactNode
}) {
  const style: CSSProperties = {
    paddingTop: "calc(env(safe-area-inset-top) + var(--spacing-screen-top))",
    paddingBottom: tabBar
      ? "calc(env(safe-area-inset-bottom) + var(--spacing-tabbar-gap) + var(--spacing-tabbar-h) + 24px)"
      : "calc(env(safe-area-inset-bottom) + 24px)",
    background,
  }
  return (
    <div className={`flex flex-1 flex-col gap-4 px-screen-x ${className}`} style={style}>
      {children}
    </div>
  )
}
