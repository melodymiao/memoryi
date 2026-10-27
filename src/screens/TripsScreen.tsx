import { useMemo, useState } from "react"
import { Screen } from "../shell/Screen"
import { ArrowRightIcon, Card, PencilIcon, Ticket } from "../components/ui"
import { CountdownBanner } from "../components/trips/CountdownBanner"
import { TripCalendar } from "../components/trips/TripCalendar"
import { TripPlans } from "../components/trips/TripPlans"
import { PastTicketStack } from "../components/trips/PastTicketStack"
import { useTrips } from "../data/trips"
import { useMembers } from "../data/members"
import { useIdeas } from "../data/ideas"
import { todayLocal } from "../lib/dates"
import { countdown, defaultTrip, pastTrips } from "../lib/trips"
import type { Idea, Trip } from "../types/database"

/**
 * Trips tab (docs/design-reference/Trips.html): countdown, the selected
 * ticket, the month calendar, its plans, and the stack of past tickets.
 * Upcoming/past are derived from dates on every render (src/lib/trips.ts).
 */
export function TripsScreen() {
  const { trips, loading: tripsLoading, error: tripsError, refetch: refetchTrips } = useTrips()
  const { members, loading: membersLoading, error: membersError, refetch: refetchMembers } = useMembers()
  const { ideas } = useIdeas()
  // null = the default (next trip, else the most recent past one).
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [plansOpen, setPlansOpen] = useState(true)

  const today = todayLocal()
  const codeByUser = useMemo(() => new Map(members.map((m) => [m.user_id, m.display_code ?? ""])), [members])
  const ideasById = useMemo(() => new Map<string, Idea>(ideas.map((i) => [i.id, i])), [ideas])
  const passengerFor = (trip: Trip) => codeByUser.get(trip.traveler_user_id) || "—"

  if (tripsLoading || membersLoading) return <TripsSkeleton />
  if (tripsError || membersError) {
    return (
      <Screen>
        <p className="m-0 px-0.5 text-body text-text-muted">
          Couldn't load trips.{" "}
          <button
            type="button"
            onClick={() => {
              refetchTrips()
              refetchMembers()
            }}
            className="cursor-pointer border-none bg-transparent p-0 font-sans text-body text-ink underline"
          >
            Retry
          </button>
        </p>
      </Screen>
    )
  }

  const selected = trips.find((t) => t.id === pickedId) ?? defaultTrip(trips, today)
  const picked = pickedId !== null && selected?.id === pickedId
  const used = !!selected && selected.visit_end < today
  const stack = pastTrips(trips, today).filter((t) => t.id !== selected?.id)

  const select = (id: string | null) => {
    setPickedId(id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <Screen className="gap-5">
      <CountdownBanner countdown={countdown(trips, today)} />

      {selected ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex min-h-6 items-center justify-between">
            <span className="text-body text-text-muted">{selected.flight_number}</span>
            {picked ? (
              <button
                type="button"
                onClick={() => select(null)}
                className="-my-2.5 -mr-1 flex h-11 cursor-pointer items-center gap-1.5 border-none bg-transparent px-1 font-sans text-body text-ink"
              >
                Back to next trip
                <ArrowRightIcon size={16} />
              </button>
            ) : (
              // TODO(step 4): open the edit-flight sheet.
              <button
                type="button"
                aria-label="Edit flight"
                className="-my-2.5 -mr-2.5 flex size-11 cursor-pointer items-center justify-center border-none bg-transparent text-ink"
              >
                <PencilIcon />
              </button>
            )}
          </div>
          <Ticket trip={selected} passenger={passengerFor(selected)} used={used} />
        </div>
      ) : (
        <Card className="text-body text-text-muted">No trips yet</Card>
      )}

      <TripCalendar
        key={selected?.id ?? "none"}
        trips={trips}
        selectedId={selected?.id ?? null}
        today={today}
        initialIso={selected?.visit_start ?? today}
      />

      {selected && (
        <TripPlans
          tripId={selected.id}
          ideasById={ideasById}
          open={plansOpen}
          onToggle={() => setPlansOpen((o) => !o)}
        />
      )}

      <PastTicketStack trips={stack} passengerFor={passengerFor} onPick={(t) => select(t.id)} />
    </Screen>
  )
}

/** Same layout while loading: muted blocks, no spinner. */
function TripsSkeleton() {
  return (
    <Screen className="gap-5">
      <div className="h-12 rounded-banner bg-surface-muted" />
      <div className="flex flex-col gap-2.5">
        <div className="h-6" />
        <div className="h-[372px] rounded-card bg-surface-muted" />
      </div>
      <div className="mt-2 flex flex-col gap-3">
        <div className="h-11 w-40 rounded-pill bg-surface-muted" />
        <div className="h-[300px] rounded-card bg-surface-muted" />
      </div>
    </Screen>
  )
}
