import type { ButtonHTMLAttributes, ReactNode } from "react"

/**
 * Filter chip (Plans.html): a toggle button, 44px tall. Default is white with
 * ink text; selected is ink with white text. Extra button props pass through,
 * e.g. aria-expanded for a dropdown chip.
 */
export function Chip({
  selected = false,
  leading,
  trailing,
  className = "",
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  selected?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`flex h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-pill border-none px-[18px] font-sans text-body ${
        selected ? "bg-ink text-surface" : "bg-surface text-ink"
      } ${className}`}
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </button>
  )
}
