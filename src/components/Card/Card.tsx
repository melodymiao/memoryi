import type { ReactNode } from "react"
import { PinButtonIcon, PinGlyphIcon } from "../../assets/icons/card-icons"

/**
 * Reusable post/place card. Figma (drank file, node 1661-6796 "Card component
 * + color palette") defines this as one component with a `hasPhoto` flag
 * rather than two separate components — the "compact list-style card" seen
 * in node 1661-6892 is just `hasPhoto={false} pinBtn={false}`. Keep that
 * shape: one Card, driven by props, not a CompactCard/PhotoCard split.
 */

export type CardColorName = "wasabi" | "coolBlue" | "sage" | "orange"

const colorClasses: Record<CardColorName, { bg: string; fg: string }> = {
  wasabi: { bg: "bg-wasabi", fg: "text-wasabi-fg" },
  coolBlue: { bg: "bg-cool-blue", fg: "text-cool-blue-fg" },
  sage: { bg: "bg-sage", fg: "text-sage-fg" },
  orange: { bg: "bg-orange", fg: "text-orange-fg" },
}

export interface CardProps {
  /** Place / post name. */
  title: string
  color?: CardColorName
  /** Small pill labels below the title, e.g. ["Little Tokyo", "$$", "omakase"]. */
  badges?: string[]
  /** Photo shown when `hasPhoto` is true. Omit to show a placeholder block. */
  photoUrl?: string
  /** Photo card vs. compact list card. Defaults to whether a photo was given. */
  hasPhoto?: boolean
  /** Show the "pinned by ___" row. */
  pinned?: boolean
  pinnedBy?: string
  /** Show the circular pin toggle button (photo cards only, by convention). */
  pinBtn?: boolean
  onPinClick?: () => void
  onClick?: () => void
  className?: string
  /** Escape hatch for content not yet modeled (e.g. a date badge) — rendered
   * after the badges row, before the photo. */
  children?: ReactNode
}

export function Card({
  title,
  color = "wasabi",
  badges = [],
  photoUrl,
  hasPhoto = photoUrl !== undefined,
  pinned = false,
  pinnedBy = "you",
  pinBtn = hasPhoto,
  onPinClick,
  onClick,
  className,
  children,
}: CardProps) {
  const { bg, fg } = colorClasses[color]

  return (
    <div
      onClick={onClick}
      className={`flex w-full flex-col gap-1 rounded-card p-4 ${bg} ${fg} ${
        onClick ? "cursor-pointer" : ""
      } ${className ?? ""}`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex flex-col items-start gap-1">
          {pinned && (
            <div className="flex items-center gap-1">
              <PinGlyphIcon className="size-2.5" />
              <p className="text-[8px] font-bold tracking-[0.5px] uppercase">pinned by {pinnedBy}</p>
            </div>
          )}
          <p className="font-display text-base font-bold">{title}</p>
          {badges.length > 0 && (
            <div className="flex flex-wrap items-start gap-x-1 gap-y-0">
              {badges.map((badge) => (
                <span key={badge} className="rounded-pill bg-background/60 px-2 py-1 text-[8px] font-semibold">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
        {pinBtn && (
          <button
            type="button"
            aria-label={pinned ? "Unpin" : "Pin"}
            aria-pressed={pinned}
            onClick={(e) => {
              e.stopPropagation()
              onPinClick?.()
            }}
            className="size-10 shrink-0 rounded-full"
          >
            <PinButtonIcon className="size-10" />
          </button>
        )}
      </div>

      {children}

      {hasPhoto && (
        <div className="h-[200px] w-full overflow-hidden rounded-photo bg-background/20">
          {photoUrl && <img src={photoUrl} alt="" className="size-full object-cover" />}
        </div>
      )}
    </div>
  )
}
