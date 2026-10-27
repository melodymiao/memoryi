import { formatTicketDate, formatTime } from "../../lib/trips"
import type { Trip } from "../../types/database"
import { DashedRoute } from "./DashedRoute"

/**
 * Flight ticket (docs/design-reference/Ticket.html). Pickup info only: when it
 * lands and the arrival terminal/gate. Missing times show "--:--", missing
 * terminal/gate "TBA" (the gate often isn't known until hours before).
 *
 * `variant="strip"` is the 72px collapsed version in the past-ticket stack:
 * just airline + date.
 */
export function Ticket({
  trip,
  passenger,
  used = false,
  variant = "full",
  className = "",
}: {
  trip: Trip
  /** The flyer's display code, e.g. "MEL". */
  passenger: string
  used?: boolean
  variant?: "full" | "strip"
  className?: string
}) {
  const date = formatTicketDate(trip.flight_date ?? trip.visit_start)
  const from = trip.origin_code ?? "---"
  const to = trip.dest_code ?? "---"
  const depart = formatTime(trip.depart_at, trip.origin_code)
  const arrive = formatTime(trip.arrive_at, trip.dest_code)

  const header = (
    <div className="flex justify-between text-body leading-[1.2]">
      <span>{trip.airline ?? "Flight"}</span>
      <span className="text-text-muted">{date}</span>
    </div>
  )

  if (variant === "strip") {
    return <div className={`box-border h-[72px] bg-surface px-[22px] pt-6 text-left text-ink ${className}`}>{header}</div>
  }

  return (
    <div
      className={`box-border flex w-full flex-col gap-[22px] rounded-card bg-surface px-[22px] py-6 text-left text-ink ${className}`}
    >
      {header}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3.5">
        <div className="flex flex-col text-display">
          <span>{from}</span>
          <span className="text-text-muted">{depart}</span>
        </div>
        <DashedRoute caption={`${trip.miles} mi`} className="pt-3.5" />
        <div className="flex flex-col items-end text-right text-display">
          <span>{to}</span>
          <span className="text-text-muted">{arrive}</span>
        </div>
      </div>
      <div className="border-t border-divider" />
      <div className="flex items-center justify-between">
        <Stat label="Passenger" value={passenger} />
        {used && (
          <span className="-rotate-8 rounded-lg border-2 border-line px-2 py-1 font-pixel text-[15px] font-extrabold text-text-muted">
            USED
          </span>
        )}
      </div>
      <div className="border-t border-divider" />
      <div className="flex justify-between gap-4">
        <Stat label="Lands" value={arrive} />
        <Stat label={`${to} term`} value={trip.arrival_terminal ?? "TBA"} />
        <Stat label={`${to} gate`} value={trip.arrival_gate ?? "TBA"} />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-body text-text-muted">{label}</span>
      <span className="text-title">{value}</span>
    </div>
  )
}
