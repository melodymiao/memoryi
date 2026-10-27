import type { ElementType, ReactNode } from "react"

/**
 * Two-tone section heading (docs/DESIGN.md): `title` in ink, `muted` in
 * text-muted, same size — e.g. "Plans for this trip". Optional right-side
 * slot for a link, count or buttons.
 */
export function SectionHeader({
  title,
  muted,
  right,
  as: Tag = "h2",
  align = "baseline",
  className = "",
}: {
  title: ReactNode
  muted?: ReactNode
  right?: ReactNode
  as?: ElementType
  /** "baseline" for text on the right (Passport "Stamps"); "center" for buttons (Trips month header). */
  align?: "baseline" | "center"
  className?: string
}) {
  return (
    <div
      className={`flex justify-between gap-3 px-0.5 ${align === "center" ? "items-center" : "items-baseline"} ${className}`}
    >
      <Tag className="m-0 text-title font-normal">
        {title}
        {muted && <span className="text-text-muted"> {muted}</span>}
      </Tag>
      {right}
    </div>
  )
}
