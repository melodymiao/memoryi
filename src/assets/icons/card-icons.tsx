/**
 * Card icons — vector paths pulled from Figma (drank file, node 1661-6796),
 * not hand-drawn.
 */
import type { SVGProps } from "react"

/** Small pin glyph used in the "pinned by ___" row. Colored via `currentColor`
 * so it inherits each card color variant's foreground text color. */
export function PinGlyphIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M5.83334 1.25L8.75017 4.1668L7.41676 4.45848L6.04168 6.70857L7.5001 7.91696L6.91673 8.50032L5.24997 6.87525L3.33319 8.792L2.95817 8.41698L4.87495 6.50023L3.24985 4.83349L3.83322 4.1668L6.08335 2.79173L5.83334 1.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** The pin toggle button (top-right of a photo card). Figma reuses the same
 * cream-on-translucent circle across every card color variant, so — unlike
 * the other card icons — this one is not currentColor-parameterized. */
export function PinButtonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="40" height="40" rx="20" fill="#FFFBF5" fillOpacity="0.4" />
      <path
        d="M19.9625 13.2125L25.2125 18.4625L22.8125 18.9875L20.3375 23.0375L22.9625 25.2125L21.9125 26.2625L18.9125 23.3375L15.4625 26.7875L14.7875 26.1125L18.2375 22.6625L15.3125 19.6625L16.3625 18.4625L20.4125 15.9875L19.9625 13.2125Z"
        fill="#FFFBF5"
      />
    </svg>
  )
}
