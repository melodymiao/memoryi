import { toFlapTiles } from "../../lib/flap"

/**
 * Split-flap digits on a dark banner (`.tick` in Trips.html, `.flap` in
 * Passport.html). Numbers get commas ("4,944"); strings render as given
 * ("09"). Commas sit between tiles with no tile behind them.
 */
export function SplitFlap({
  value,
  size = "sm",
  className = "",
}: {
  value: string | number
  size?: "sm" | "lg"
  className?: string
}) {
  const tiles = toFlapTiles(value)
  const label = typeof value === "number" ? value.toLocaleString("en-US") : value
  const lg = size === "lg"

  return (
    <span role="img" aria-label={label} className={`inline-flex ${lg ? "items-end gap-[5px]" : "gap-[3px]"} ${className}`}>
      {tiles.map((tile, i) =>
        tile.separator ? (
          <span
            key={i}
            aria-hidden="true"
            className={`inline-flex items-center justify-center font-pixel font-extrabold tracking-[0.02em] ${
              lg ? "h-[62px] w-[14px] text-pixel-xl" : "h-6 text-pixel"
            }`}
          >
            {tile.char}
          </span>
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className={
              lg
                ? "flap-seam-lg inline-flex h-[62px] w-12 items-center justify-center rounded-flap-lg bg-flap"
                : "flap-seam-sm box-border inline-flex h-6 min-w-4 items-center justify-center rounded-flap-sm bg-flap px-[3px]"
            }
          >
            <span className={`font-pixel font-extrabold tracking-[0.02em] ${lg ? "text-pixel-xl" : "text-pixel"}`}>
              {tile.char}
            </span>
          </span>
        ),
      )}
    </span>
  )
}
