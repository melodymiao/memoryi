import { NavLink } from "react-router-dom"
import type { ComponentType } from "react"
import { BookmarkIcon, PassportIcon, PlaneIcon, TicketIcon, type IconProps } from "./icons"

/**
 * Floating tab bar (nav in every docs/design-reference tab file): a white pill
 * 64px tall, 20px from the sides and 24px above the bottom safe area. The
 * active tab is an ink pill with icon + label; inactive tabs are icon only.
 */

interface Tab {
  to: string
  label: string
  icon: ComponentType<IconProps>
}

const TABS: Tab[] = [
  { to: "/", label: "Home", icon: PlaneIcon },
  { to: "/trips", label: "Trips", icon: TicketIcon },
  { to: "/plans", label: "Plans", icon: BookmarkIcon },
  { to: "/passport", label: "Passport", icon: PassportIcon },
]

export function TabBar() {
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 z-10 mx-auto max-w-md px-screen-x"
      style={{ bottom: "calc(var(--spacing-tabbar-gap) + env(safe-area-inset-bottom))" }}
    >
      <div className="flex h-tabbar-h items-center justify-around rounded-pill bg-surface shadow-tabbar">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            aria-label={label}
            className={({ isActive }) =>
              isActive
                ? "flex h-11 items-center gap-1.5 rounded-pill bg-ink px-4 text-body tracking-[-0.01em] text-surface"
                : "flex size-11 items-center justify-center text-icon-muted"
            }
          >
            {({ isActive }) =>
              isActive ? (
                <>
                  <Icon size={18} />
                  {label}
                </>
              ) : (
                <Icon size={22} />
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
