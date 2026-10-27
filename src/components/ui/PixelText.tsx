import type { ReactNode } from "react"

const SIZE = {
  /** 16 — banner text, small split-flap digits. */
  pixel: "text-pixel",
  /** 13 — the "STATUS" label. */
  label: "text-pixel-label",
  /** 44 — miles flown. */
  xl: "text-pixel-xl",
} as const

/** Doto "departure board" text, for dark banners only. */
export function PixelText({
  size = "pixel",
  muted = false,
  className = "",
  children,
}: {
  size?: keyof typeof SIZE
  /** on-dark-muted, for labels and person codes. */
  muted?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <span
      className={`font-pixel font-extrabold tracking-[0.02em] ${SIZE[size]} ${muted ? "text-on-dark-muted" : ""} ${className}`}
    >
      {children}
    </span>
  )
}
