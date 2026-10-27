import type { StampTint } from "../../lib/cityTint"

/**
 * Passport stamp (`.perf` + `.halftone` in Passport.html; the small one in
 * StampDetail.html): scalloped white edge, a square image area in the city's
 * tint with ink halftone dots, then the city in Instrument Serif and the dates
 * + visit number. Pass `imageUrl` to show a photo instead of the placeholder
 * halftone. Get the tint for a city with cityTint().
 */
export function PerforatedStamp({
  city,
  dates,
  number,
  tint,
  imageUrl,
  tilt = 0,
  size = "md",
  shortLabel,
  className = "",
}: {
  city: string
  /** e.g. "Oct 31 – Nov 2". Not shown at size "sm". */
  dates?: string
  number: number
  tint: StampTint
  imageUrl?: string
  /** Degrees, e.g. -1.5. */
  tilt?: number
  /** "md": Passport grid. "sm": the 84px stamp on the stamp page. */
  size?: "md" | "sm"
  /** Shown instead of the city at size "sm", e.g. "SF". */
  shortLabel?: string
  className?: string
}) {
  const sm = size === "sm"
  const ink = "var(--color-ink)"
  const dot = sm ? [1, 1.5, 1.2, 1.7] : [1.1, 1.6, 1.3, 1.8]

  return (
    <div
      className={`stamp-perf ${sm ? "stamp-perf-raised w-[84px]" : ""} ${className}`}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      <div className={`flex flex-col bg-surface ${sm ? "gap-1 px-1 pt-1 pb-[5px]" : "gap-1.5 px-[5px] pt-[5px] pb-[7px]"}`}>
        <div className="relative aspect-square overflow-hidden" style={{ background: `var(--color-${tint})` }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-55"
                style={{
                  backgroundImage: `radial-gradient(${ink} ${dot[0]}px, transparent ${dot[1]}px)`,
                  backgroundSize: "4px 4px",
                }}
              />
              <div
                className={`absolute top-[22%] left-[18%] h-[56%] w-[64%] -rotate-12 ${sm ? "rounded-md" : "rounded-lg"}`}
                style={{
                  backgroundImage: `radial-gradient(${ink} ${dot[2]}px, transparent ${dot[3]}px)`,
                  backgroundSize: "4px 4px",
                }}
              />
            </>
          )}
        </div>
        {sm ? (
          <div className="flex items-baseline justify-between text-ink">
            <span className="font-serif text-[12px] leading-none">{shortLabel ?? city}</span>
            <span className="text-[10px] font-medium">#{number}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[3px] px-px text-ink">
            <span className="truncate font-serif text-[16px] leading-none tracking-[-0.01em]">{city}</span>
            <div className="flex items-baseline justify-between gap-1">
              <span className="whitespace-nowrap text-[8px] uppercase tracking-[0.06em]">{dates}</span>
              <span className="text-[12px] leading-none font-medium">#{number}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
