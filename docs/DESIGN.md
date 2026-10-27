# Design system

Exact visual spec for the app. The screens themselves are in `docs/design-reference/` (see its README). When this file and a reference file disagree, the reference file wins; then fix this file.

## Color
Palette: lime green, pink, dark green, plus neutrals derived from them.

| Token | Hex | Use |
|---|---|---|
| `ink` | `#28301C` | All primary text; dark surfaces (banners, active tab, selected chips, primary buttons, checked circles) |
| `lime` | `#D2DB76` | Accent: selected trip on the calendar, "added to trip" circles, "During … trip" tags, plane icons on dark, LA stamp tint, photo placeholder |
| `pink` | `#FFC3CC` | Other trips on the calendar, song thumbnails, SF stamp tint, Melody's heart |
| `bg` | `#F4F3EA` | App background |
| `surface` | `#FFFFFF` | Cards, tab bar, round icon buttons |
| `surface-muted` | `#EEF1E0` | Song chips, progress-bar tracks, soft fills inside cards |
| `divider` | `#E7EAD6` | 1px dividers inside cards and between list rows |
| `line` | `#C5CBA8` | Dashed route lines, unchecked circle borders |
| `line-strong` | `#B9C09A` | Dashed border of the "next stamp" placeholder |
| `text-muted` | `#7E846C` | Secondary text, labels, past dates |
| `icon-muted` | `#5C6450` | Inactive tab icons |
| `on-dark-muted` | `#B3BA8C` | Gray text on dark banners (labels, person codes); SD stamp tint |
| `flap` | `#3A4428` | Split-flap digit tiles on dark |
| `flap-seam` | `#1A2012` | The horizontal line across each split-flap tile |

Hearts: Melody = `pink`, partner = `lime`, both with a 1.6px `ink` outline so they read on white.

City stamps: one tint per city, with `ink` halftone dots and text.

| City | Tint |
|---|---|
| San Francisco | `pink` |
| Los Angeles | `lime` |
| San Diego | `on-dark-muted` |

New cities need a new tint picked from this palette.

## Type
Fonts are self-hosted so the PWA works offline: use `@fontsource` packages if available, otherwise Google Fonts.
- **Inter Tight**: everything by default, weight **400** (500 only for the "me+you" wordmark).
- **Doto** (weight 800): pixel/"departure board" text, used only on dark banners and the USED stamp.
- **Instrument Serif**: city names on stamps only.

Font tokens (in `src/index.css`): `sans` (Inter Tight, the default), `pixel` (Doto), `serif` (Instrument Serif). Only the latin subset of each is loaded.

| Token | Size / line-height / tracking | Use |
|---|---|---|
| `hero` | 44 / 1.02 / -0.035em | Plans page heading |
| `display` | 40 / 1.05 / -0.03em | Airport codes, person codes, times on the ticket |
| `title` | 26 / 1.1 / -0.02em | Section headings, ticket values, stats |
| `temp` | 20 / 1.1 / -0.01em | Temperatures on Home |
| `body` | 15 / ~1.3 | Labels, list rows, buttons, tab label |
| `small` | 13 | Addresses, artists, chips' secondary text |
| `pixel` | Doto 16 / 1 | Banner text and small split-flap digits |
| `pixel-label` | Doto 13 / 1 | "STATUS" label |
| `pixel-xl` | Doto 44 / 1 | Miles flown |

Two-tone headings: the first words in `ink`, the rest in `text-muted`, same size (e.g. "Plans *for this trip*").

## Shape and spacing
- Radius: cards **28**; banners **16** (miles board **24**); chips, tab bar and pills **999**; song chips **16**; thumbnails **7**; small flap tiles **4**; large flap tiles **8**.
- Screen padding: **20px** left/right (`screen-x`). Top: in the reference frames content starts 56–64px from the very top of the screen. The app uses the `default` iOS status bar style, so the page already starts below the status bar; the top padding is the safe area + **12px** (`screen-top`), which lands in the same place.
- Gaps: 16–20px between sections; card padding about 24×22 (ticket) or 20×22 (stats card).
- Touch targets: at least **44×44** (icon buttons, chips, checkboxes, tabs).
- Shadows: tab bar `0 4px 20px rgba(0,0,0,0.06)` (`tabbar`); stacked tickets `0 -6px 16px rgba(0,0,0,0.07)` (`stack`); floating buttons `0 8px 24px rgba(0,0,0,0.2)` (`float`); round white buttons on photos `0 4px 14px rgba(0,0,0,0.12)` (`button`, from StampDetail.html).
- Tab bar spacing tokens: `tabbar-h` 64px, `tabbar-gap` 24px (distance above the bottom safe area).
- Icons: inline stroke SVGs, stroke 1.6–1.8, round caps/joins, copied from the reference files.

## Shared components (built in step 1 — `src/components/ui/`, previewed at `/dev/ui` in dev)
- **TabBar**: a floating white pill, 64px tall, 20px from the sides and 24px from the bottom (plus safe area), fixed to the viewport. Tabs: Home, Trips, Plans, Passport. The active tab is an `ink` pill with icon + label (Inter Tight 15 / 400, white). Inactive tabs are icon only, `icon-muted`, 44px targets.
- **Card**: `surface`, radius 28, padding as above.
- **DarkBanner**: `ink` background, radius 16, padding 12–14 × 18, white Doto text.
- **SplitFlap**: renders a number as tiles.
  - small: 24px tall, radius 4, 1px seam
  - large: 62px tall, 48px wide, radius 8, 2px seam
  - commas sit between tiles without a tile behind them
- **Chip**: 44px tall, 18px horizontal padding, radius 999, `body` text. Default `surface` with `ink` text; selected `ink` with white text.
- **SectionHeader**: two-tone `title`, with an optional right-side action (link or chevron).
- **DashedRoute**: dashed `line` rule, plane icon, dashed rule, and an optional caption below ("412 mi").
- **PerforatedStamp**: white scalloped edge (radial-gradient mask; see `.perf` in Passport.html), a halftone image area in the city tint, the city in Instrument Serif, and dates + #number.
- **Ticket**: see Ticket.html. Built in step 3, not step 1.
