import { NavLink } from "react-router-dom"
import type { ComponentType, SVGProps } from "react"
import { CalendarIcon, CardsIcon, FeedIcon, UsIcon } from "../assets/icons/tab-icons"

/**
 * Bottom tab bar. Figma (drank file, node 1661-6940 "tab-bar"): a floating
 * pill — bg `background`, `shadow-float`, `rounded-tabbar` — with 4 evenly
 * spaced tabs. The active tab gets a filled `ink` circle behind its icon
 * (icon flips to `background`) and a bold label; inactive tabs use
 * `ink-soft` for both.
 */

const tabs: { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { to: "/", label: "feed", icon: FeedIcon },
  { to: "/calendar", label: "calendar", icon: CalendarIcon },
  { to: "/cards", label: "cards", icon: CardsIcon },
  { to: "/us", label: "us", icon: UsIcon },
]

export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-tabbar-x"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
    >
      <div className="flex w-full max-w-md items-start justify-center gap-1 rounded-tabbar bg-background px-2 py-2.5 shadow-float">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex size-10 items-center justify-center rounded-pill ${
                    isActive ? "bg-ink text-background" : "text-ink-soft"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <span
                  className={`text-[10.5px] ${
                    isActive ? "font-bold text-ink" : "font-medium text-ink-soft"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
