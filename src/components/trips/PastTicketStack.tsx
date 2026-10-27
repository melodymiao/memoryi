import { Link } from "react-router-dom"
import { SectionHeader, Ticket } from "../ui"
import { formatTicketDate } from "../../lib/trips"
import type { Trip } from "../../types/database"

/**
 * Past tickets (Trips.html): oldest on top as 72px strips, each newer one
 * overlapping the last by 14px, the most recent as the full ticket at the
 * front. Tapping one opens it as the main ticket.
 */
export function PastTicketStack({
  trips,
  passengerFor,
  onPick,
}: {
  /** Oldest first, already excluding the selected trip. */
  trips: Trip[]
  passengerFor: (trip: Trip) => string
  onPick: (trip: Trip) => void
}) {
  if (trips.length === 0) return null

  return (
    <section className="mt-2 flex flex-col gap-3">
      <SectionHeader
        title="Past tickets"
        right={
          <Link to="/passport" className="text-body text-text-muted no-underline">
            See stamps →
          </Link>
        }
      />
      <div className="flex flex-col">
        {trips.map((trip, i) => {
          const last = i === trips.length - 1
          return (
            <button
              key={trip.id}
              type="button"
              onClick={() => onPick(trip)}
              aria-label={`Open ${trip.airline ?? "flight"} ticket from ${formatTicketDate(trip.flight_date ?? trip.visit_start)}`}
              className={`relative block w-full cursor-pointer overflow-hidden rounded-card border-none bg-surface p-0 font-sans shadow-stack ${
                i === 0 ? "" : "-mt-3.5"
              } ${last ? "" : "h-[72px]"}`}
            >
              <Ticket trip={trip} passenger={passengerFor(trip)} used variant={last ? "full" : "strip"} />
            </button>
          )
        })}
      </div>
    </section>
  )
}
