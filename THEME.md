# Design system

Source of truth: `src/index.css` (`@theme` block, generates Tailwind utilities).
Mirrored for JS/TS use in `src/tokens.ts`.

Pulled from Figma file `drank` (fileKey `InttLwvZn27mO6JuZ7OTHB`):
- Card component + color palette — node `1661-6796`
- Card in use (compact + photo variants) — node `1661-6892`
- Screens/flows (header, filter strip, tab bar) — node `1614-984`

This file (and the Figma nodes above) is the reference for later sessions —
don't re-derive tokens by eyeballing screenshots, pull real values with the
Figma MCP tool the same way this file was built.

## Color

| Token | Value | Used for |
|---|---|---|
| `background` | `#fffbf5` | App background, PWA theme/background color |
| `surface` | `#f5efe4` | Secondary buttons, inactive pill fill |
| `ink` | `#422f0e` | Primary text, active tab icon bg, profile button bg |
| `ink-soft` | `#a6a69e` | Secondary/inactive text (tab labels, inactive pill text) |
| `accent` | `#3d202b` | Active filter pills (wishlist / shuffle) |
| `accent-soft` | `#c29cac` | Text on `accent` |

Card variants (each is a bg/fg pair — see `Card.tsx`'s `color` prop):

| Variant | bg | fg |
|---|---|---|
| `wasabi` | `#e0e939` | `#484800` |
| `cool-blue` | `#ceeaf5` | `#32586a` |
| `sage` | `#adb9a2` | `#2f3a27` |
| `orange` | `#ff663a` | `#841200` |

Note: in Figma, the orange card's "pinned by" label and badge text use a
slightly different red (`#971500`) than the title (`#841200`). Normalized to
one `orange-fg` here rather than adding a second near-identical token — flag
it if a future design pass wants them distinct again.

Badge chips (the little pills inside a card, e.g. "Little Tokyo", "$$") use
`background` at 60% opacity rather than a dedicated token — in Tailwind that's
`bg-background/60`.

Figma has no published Variables for this file (`get_variable_defs` returned
`{}` on the card node) except four semantic ones surfaced on the screen
frames — `neutral/text-primary`, `neutral/surface`, `neutral/background`,
`neutral/text-secondary` — which map 1:1 to `ink`, `surface`, `background`,
`ink-soft` above. Everything else (card colors, accent) was hardcoded hex in
the Figma file itself; if the designer adds real Variables for those later,
resync this table.

## Type

| Token | Family | Used for |
|---|---|---|
| `font-display` | Outfit (700) | Card titles (16px), screen header titles (27px, `-0.54px` tracking) |
| `font-sans` | Plus Jakarta Sans (500/600/700) | Everything else — badges, pills, tab labels, buttons |

Loaded via Google Fonts `<link>` in `index.html` (weights 600/700 for
Outfit, 500/600/700 + 700 italic for Plus Jakarta Sans — that's everything
the screens currently use).

## Radius

| Token | Value | Used for |
|---|---|---|
| `radius-card` | `24px` | Card outer corners |
| `radius-photo` | `16px` | Photo inside a card |
| `radius-pill` | `9999px` | Badge chips, filter pills, tab bar icon circles |
| `radius-tabbar` | `30px` | Bottom tab bar container |

## Spacing

Default Tailwind spacing scale (4px increments) covers most of it. Three
values from the screens don't land on that scale, so they're named tokens:

| Token | Value | Used for |
|---|---|---|
| `spacing-screen-x` | `18px` | Horizontal screen padding (card list, etc.) |
| `spacing-header-x` | `22px` | Horizontal padding for the per-screen header row |
| `spacing-tabbar-x` | `14px` | Side margin for the floating bottom tab bar |

## Elevation

| Token | Value | Used for |
|---|---|---|
| `shadow-float` | `0px 10px 17px rgba(20,22,26,.13), 0px 2px 3px rgba(20,22,26,.05)` | Floating tab bar |

## Safe areas / device chrome

Figma's phone frames draw their own status bar, Dynamic Island and home
indicator for reference, but none of that is real DOM — on an actual iOS PWA
those insets come from the OS via `env(safe-area-inset-*)`. The shell uses:

- `viewport-fit=cover` in `index.html` (required for `env()` to report
  non-zero insets at all)
- `padding-top: env(safe-area-inset-top)` above the per-screen header
- The bottom tab bar sits `env(safe-area-inset-bottom)` above the true
  screen edge, plus its own margin, so it floats clear of the home indicator
  the same way it does in the Figma frames.

## Extending this

Adding a token: add the CSS var to the `@theme` block in `src/index.css`,
mirror it in `src/tokens.ts`, and add a row to the table above. Don't
hardcode a new hex/px value in a component — if it's not here yet, that
means the design system doesn't have it, so add it here first.
