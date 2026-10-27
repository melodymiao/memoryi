import type { ReactNode, SVGProps } from "react"

/**
 * Every icon used across docs/design-reference/*.html, paths copied from
 * there. Stroke icons in currentColor on a 24×24 grid; set the color with a
 * text-* class. Decorative (aria-hidden) unless given a `label`.
 */

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number
  strokeWidth?: number
  /** Accessible name; without it the icon is hidden from screen readers. */
  label?: string
}

function Icon({
  size = 18,
  strokeWidth = 1.8,
  label,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...props}
    >
      {children}
    </svg>
  )
}

// Tabs ------------------------------------------------------------------------

/** Home tab icon, and the plane on routes / banners. */
export function PlaneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 12h20M13 5l7 7-7 7M6 12l-2-4M6 12l-2 4" />
    </Icon>
  )
}

/** Trips tab. */
export function TicketIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </Icon>
  )
}

/** Plans tab. */
export function BookmarkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 4h10v16l-5-3.5L7 20z" />
    </Icon>
  )
}

/** Passport tab. */
export function PassportIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M9 16h6" />
    </Icon>
  )
}

// Actions ---------------------------------------------------------------------

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13 7l4 4" />
    </Icon>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 6l-6 6 6 6" />
    </Icon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  )
}

export function CameraIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </Icon>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Icon>
  )
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12l5 5 9-10" />
    </Icon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

// Weather (Home) ----------------------------------------------------------------

export function CloudIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.6} {...props}>
      <path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z" />
    </Icon>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  )
}

// Heart -------------------------------------------------------------------------

export type HeartFill = "pink" | "lime" | "none"

/**
 * Favorite heart: Melody = pink, partner = lime (docs/DESIGN.md), always with
 * the 1.6px ink outline so it reads on white. `fill="none"` is the outline-only
 * version (e.g. the "favorite" tool in the new-idea sheet), drawn in
 * currentColor.
 */
export function HeartIcon({ fill = "none", strokeWidth, ...props }: IconProps & { fill?: HeartFill }) {
  const filled = fill !== "none"
  return (
    <Icon
      size={13}
      strokeWidth={strokeWidth ?? (filled ? 1.6 : 1.8)}
      fill={filled ? `var(--color-${fill})` : "none"}
      stroke={filled ? "var(--color-ink)" : "currentColor"}
      {...props}
    >
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.5 1.1 4.3 2.4.8-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
    </Icon>
  )
}
