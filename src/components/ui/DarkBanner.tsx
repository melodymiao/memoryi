import type { ElementType, ReactNode } from "react"

const VARIANT = {
  /** Status banner on Home. */
  banner: "rounded-banner px-[18px] py-3.5",
  /** "LANDING IN 09 DAYS" on Trips. */
  countdown: "rounded-banner px-[18px] py-3",
  /** Miles flown board on Passport. */
  board: "rounded-board px-5 pt-5 pb-[22px]",
} as const

/** Ink banner with white text (docs/DESIGN.md "DarkBanner"). Put PixelText inside. */
export function DarkBanner({
  as: Tag = "div",
  variant = "banner",
  className = "",
  children,
}: {
  as?: ElementType
  variant?: keyof typeof VARIANT
  className?: string
  children?: ReactNode
}) {
  return <Tag className={`bg-ink text-surface ${VARIANT[variant]} ${className}`}>{children}</Tag>
}
