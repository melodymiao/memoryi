/**
 * Design tokens for JS/TS, mirrored from the `@theme` block in `src/index.css`
 * (the source of truth, which follows docs/DESIGN.md). Prefer the Tailwind
 * utilities in components; use these only where a className can't reach,
 * e.g. a value passed to a native API.
 */

export const color = {
  ink: "#28301C",
  lime: "#D2DB76",
  pink: "#FFC3CC",
  bg: "#F4F3EA",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF1E0",
  divider: "#E7EAD6",
  line: "#C5CBA8",
  lineStrong: "#B9C09A",
  textMuted: "#7E846C",
  iconMuted: "#5C6450",
  onDarkMuted: "#B3BA8C",
  flap: "#3A4428",
  flapSeam: "#1A2012",
} as const

export const font = {
  sans: "'Inter Tight', ui-sans-serif, system-ui, sans-serif",
  pixel: "'Doto', ui-monospace, monospace",
  serif: "'Instrument Serif', ui-serif, serif",
} as const

export const radius = {
  card: "28px",
  banner: "16px",
  board: "24px",
  pill: "999px",
  song: "16px",
  thumb: "7px",
  flapSm: "4px",
  flapLg: "8px",
} as const

export const shadow = {
  tabbar: "0 4px 20px rgba(0, 0, 0, 0.06)",
  stack: "0 -6px 16px rgba(0, 0, 0, 0.07)",
  float: "0 8px 24px rgba(0, 0, 0, 0.2)",
  button: "0 4px 14px rgba(0, 0, 0, 0.12)",
} as const
