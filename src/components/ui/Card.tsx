import type { ElementType, ReactNode } from "react"

const PADDING = {
  /** 24×22 — ticket, city card. */
  default: "px-[22px] py-6",
  /** 20×22 — stats card, most-visited card. */
  stats: "px-[22px] py-5",
  none: "",
} as const

/** White card, radius 28 (docs/DESIGN.md "Card"). */
export function Card({
  as: Tag = "div",
  padding = "default",
  className = "",
  children,
}: {
  as?: ElementType
  padding?: keyof typeof PADDING
  className?: string
  children?: ReactNode
}) {
  return <Tag className={`rounded-card bg-surface ${PADDING[padding]} ${className}`}>{children}</Tag>
}
