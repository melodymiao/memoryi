import { useState } from "react"
import { Card, ChevronLeftIcon, ChevronRightIcon, SectionHeader } from "../ui"
import { monthGrid } from "../../lib/trips"
import type { Trip } from "../../types/database"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

/** "2026-10-31" → { year: 2026, month: 10 } */
function monthOf(iso: string) {
  const [year, month] = iso.split("-").map(Number)
  return { year, month }
}

/**
 * Month view with prev/next (Trips.html). The selected trip is a lime band,
 * other trips pink. Opens on `initialIso`'s month; remount (change `key`) to
 * jump to a newly selected trip. Paging never changes the selection.
 */
export function TripCalendar({
  trips,
  selectedId,
  today,
  initialIso,
}: {
  trips: Trip[]
  selectedId: string | null
  today: string
  initialIso: string
}) {
  const [view, setView] = useState(() => monthOf(initialIso))
  const cells = monthGrid(view.year, view.month, trips, selectedId, today)

  const page = (delta: number) =>
    setView(({ year, month }) => {
      const m = month + delta
      return m < 1 ? { year: year - 1, month: 12 } : m > 12 ? { year: year + 1, month: 1 } : { year, month: m }
    })

  return (
    <section className="mt-2 flex flex-col gap-3">
      <SectionHeader
        title={MONTHS[view.month - 1]}
        muted={view.year}
        align="center"
        right={
          <div className="flex gap-1.5">
            <RoundButton label="Previous month" onClick={() => page(-1)}>
              <ChevronLeftIcon />
            </RoundButton>
            <RoundButton label="Next month" onClick={() => page(1)}>
              <ChevronRightIcon />
            </RoundButton>
          </div>
        }
      />
      <Card padding="none" className="grid grid-cols-7 gap-y-1.5 px-4 py-[18px] text-center text-body leading-none">
        {WEEKDAYS.map((d, i) => (
          <span key={i} aria-hidden="true" className="pb-1.5 text-text-muted">
            {d}
          </span>
        ))}
        {cells.map((cell, i) => (
          <span
            key={i}
            className={[
              "min-h-[15px] py-[11px]",
              cell.band === "selected" ? "bg-lime" : cell.band === "other" ? "bg-pink" : "",
              cell.roundLeft ? "rounded-l-pill" : "",
              cell.roundRight ? "rounded-r-pill" : "",
              cell.past && !cell.band ? "text-text-muted" : "text-ink",
            ].join(" ")}
          >
            {cell.day ?? ""}
          </span>
        ))}
      </Card>
    </section>
  )
}

function RoundButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full border-none bg-surface text-ink"
    >
      {children}
    </button>
  )
}
