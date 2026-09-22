import type { ReactNode } from "react"
import type { AddedWithin, CardFilters, Facet, Facets } from "../../lib/cardFilters"
import { priceLabel } from "../../lib/categories"
import type { GeoStatus } from "../../lib/useUserLocation"

export interface MoreFiltersSheetProps {
  facets: Facets
  filters: CardFilters
  onChange: (patch: Partial<CardFilters>) => void
  geo: { status: GeoStatus; request: () => void }
  /** How many cards match the current filters. */
  resultCount: number
  onClearAll: () => void
  onClose: () => void
}

const ADDED_OPTIONS: { value: AddedWithin; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
]

const DISTANCE_OPTIONS = [1, 5, 10, 25]

/** Price bands: quick pairs over the individual $ levels. */
const PRICE_BANDS: { label: string; levels: number[] }[] = [
  { label: "Budget $–$$", levels: [1, 2] },
  { label: "Splurge $$$+", levels: [3, 4] },
]

const chip = (selected: boolean) =>
  `rounded-pill px-3.5 py-2 text-[12px] ${
    selected ? "bg-accent font-bold text-on-accent" : "bg-surface font-semibold text-ink-soft"
  }`

const sameText = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
const includesText = (list: string[], value: string) => list.some((v) => sameText(v, value))
const toggleText = (list: string[], value: string) =>
  includesText(list, value) ? list.filter((v) => !sameText(v, value)) : [...list, value]

/**
 * Bottom sheet with finer filters. Everything except "recently added" and
 * "distance" is built from what's actually on your cards, so only values that
 * exist are offered. Options within a section are OR'd; sections are AND'd
 * with each other and with the main filter row.
 */
export function MoreFiltersSheet({ facets, filters, onChange, geo, resultCount, onClearAll, onClose }: MoreFiltersSheetProps) {
  const anySelected =
    filters.locations.length +
      filters.types.length +
      filters.cuisines.length +
      filters.prices.length +
      filters.sources.length +
      (filters.addedWithin ? 1 : 0) +
      (filters.maxMiles ? 1 : 0) >
    0

  const presentLevels = facets.prices.map((f) => f.value)

  function textSection(title: string, facet: Facet<string>[], selected: string[], key: "locations" | "types" | "cuisines" | "sources") {
    if (facet.length === 0) return null
    return (
      <Section title={title}>
        {facet.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={includesText(selected, f.value)}
            onClick={() => onChange({ [key]: toggleText(selected, f.value) })}
            className={chip(includesText(selected, f.value))}
          >
            {f.value} <span className="opacity-60">{f.count}</span>
          </button>
        ))}
      </Section>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="More filters">
      <button type="button" aria-label="Close filters" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/40" />
      <div
        className="relative flex max-h-[82dvh] w-full max-w-md flex-col rounded-t-tabbar bg-background"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-header-x pt-5 pb-3">
          <h2 className="font-display text-[19px] font-bold text-ink">more filters</h2>
          <button type="button" onClick={onClose} className="text-[13px] font-bold text-ink-soft">
            done
          </button>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-header-x pb-4">
          <Section title="recently added">
            {ADDED_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={filters.addedWithin === o.value}
                onClick={() => onChange({ addedWithin: filters.addedWithin === o.value ? null : o.value })}
                className={chip(filters.addedWithin === o.value)}
              >
                {o.label}
              </button>
            ))}
          </Section>

          <Section title="near me">
            {DISTANCE_OPTIONS.map((miles) => (
              <button
                key={miles}
                type="button"
                aria-pressed={filters.maxMiles === miles}
                onClick={() => {
                  const next = filters.maxMiles === miles ? null : miles
                  onChange({ maxMiles: next })
                  // Ask for the device location the first time it's needed (from this tap).
                  if (next !== null && geo.status !== "ready" && geo.status !== "loading") geo.request()
                }}
                className={chip(filters.maxMiles === miles)}
              >
                within {miles} mi
              </button>
            ))}
            {filters.maxMiles !== null && (
              <p className="basis-full text-[11.5px] text-ink-soft">
                {geo.status === "loading" && "Finding your location…"}
                {geo.status === "denied" && "Location permission is off — enable it for this site in your browser settings."}
                {geo.status === "error" && "Couldn't get your location. Try again in a moment."}
                {geo.status === "ready" &&
                  (facets.cardsWithoutCoordinates > 0
                    ? `${facets.cardsWithoutCoordinates} ${facets.cardsWithoutCoordinates === 1 ? "card has" : "cards have"} no saved location and won't show. Re-pick their place to add one.`
                    : "Using your current location.")}
              </p>
            )}
          </Section>

          {textSection("location", facets.locations, filters.locations, "locations")}
          {textSection("cuisine", facets.cuisines, filters.cuisines, "cuisines")}
          {textSection("type", facets.types, filters.types, "types")}

          {facets.prices.length > 0 && (
            <Section title="price">
              {PRICE_BANDS.map((band) => {
                const levels = band.levels.filter((l) => presentLevels.includes(l))
                if (levels.length === 0) return null
                const selected = levels.every((l) => filters.prices.includes(l))
                return (
                  <button
                    key={band.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      onChange({
                        prices: selected
                          ? filters.prices.filter((p) => !levels.includes(p))
                          : [...new Set([...filters.prices, ...levels])],
                      })
                    }
                    className={chip(selected)}
                  >
                    {band.label}
                  </button>
                )
              })}
              {facets.prices.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filters.prices.includes(f.value)}
                  onClick={() =>
                    onChange({
                      prices: filters.prices.includes(f.value)
                        ? filters.prices.filter((p) => p !== f.value)
                        : [...filters.prices, f.value],
                    })
                  }
                  className={chip(filters.prices.includes(f.value))}
                >
                  {priceLabel(f.value)} <span className="opacity-60">{f.count}</span>
                </button>
              ))}
            </Section>
          )}

          {textSection("recommended by", facets.sources, filters.sources, "sources")}
        </div>

        <div className="flex gap-2 border-t border-surface px-header-x pt-3 pb-3">
          {anySelected && (
            <button type="button" onClick={onClearAll} className="rounded-pill bg-surface px-5 py-3.5 text-[13.5px] font-bold text-ink">
              clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-pill bg-accent py-3.5 text-[13.5px] font-bold text-on-accent"
          >
            show {resultCount} {resultCount === 1 ? "card" : "cards"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[10px] font-bold tracking-[0.6px] text-ink-soft uppercase">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
