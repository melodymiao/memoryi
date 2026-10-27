import type { Idea, Trip } from "../types/database"

/**
 * Date logic for the Trips tab. Everything works on "YYYY-MM-DD" strings in
 * the device's local calendar (see todayLocal() in ./dates). Day arithmetic
 * goes through Date.UTC so daylight-saving changes can't shift a day.
 * Nothing here is stored — upcoming/past and order are always derived.
 */

type TripDates = Pick<Trip, "id" | "visit_start" | "visit_end" | "created_at">

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number)
  return [y, m, d]
}

function utcDay(iso: string): number {
  const [y, m, d] = parts(iso)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

function isoFromUtcDay(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10)
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return utcDay(to) - utcDay(from)
}

/** Oldest visit first; ties broken by when the trip was created. */
export function byVisitStart<T extends TripDates>(a: T, b: T): number {
  return a.visit_start.localeCompare(b.visit_start) || a.created_at.localeCompare(b.created_at)
}

/** The visit you're on, or else the soonest one ahead. Null if none. */
export function nextTrip<T extends TripDates>(trips: T[], today: string): T | null {
  return [...trips].sort(byVisitStart).find((t) => t.visit_end >= today) ?? null
}

/** Visits that have ended, oldest first (the order the past-ticket stack renders). */
export function pastTrips<T extends TripDates>(trips: T[], today: string): T[] {
  return trips.filter((t) => t.visit_end < today).sort(byVisitStart)
}

/** What the Trips tab shows by default: the next trip, else the most recent past one. */
export function defaultTrip<T extends TripDates>(trips: T[], today: string): T | null {
  return nextTrip(trips, today) ?? pastTrips(trips, today).at(-1) ?? null
}

export type Countdown =
  | { kind: "days"; days: number; trip: Trip }
  | { kind: "today"; trip: Trip }
  | { kind: "together" }
  | { kind: "none" }

/**
 * The countdown banner. Mid-visit (started before today, not yet over) →
 * "together". Otherwise counts to the next visit that hasn't started:
 * 0 days → "today". Never follows a past trip.
 */
export function countdown(trips: Trip[], today: string): Countdown {
  if (trips.some((t) => t.visit_start < today && t.visit_end >= today)) return { kind: "together" }
  const upcoming = [...trips].sort(byVisitStart).find((t) => t.visit_start >= today)
  if (!upcoming) return { kind: "none" }
  const days = daysBetween(today, upcoming.visit_start)
  return days === 0 ? { kind: "today", trip: upcoming } : { kind: "days", days, trip: upcoming }
}

/** Countdown digits: at least two ("09"), more if needed ("120"). */
export function padDays(days: number): string {
  return String(days).padStart(2, "0")
}

// Calendar ----------------------------------------------------------------------

/** Day of week (0 = Sunday) of the 1st, and the number of days, for a month (1–12). */
function monthShape(year: number, month: number): { firstDow: number; daysInMonth: number } {
  return {
    firstDow: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
    daysInMonth: new Date(Date.UTC(year, month, 0)).getUTCDate(),
  }
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** One week-row piece of a trip's band within a month. Columns are 0 (Sun) – 6 (Sat). */
export interface BandSegment {
  row: number
  startCol: number
  endCol: number
  /** Rounded left end: the trip's first day, or a Sunday. */
  roundStart: boolean
  /** Rounded right end: the trip's last day, or a Saturday. */
  roundEnd: boolean
}

/**
 * How a trip's dates fall into week rows within one month (Sunday-first
 * weeks, as in Trips.html). Only the month's own days count — a trip running
 * Oct 31 → Nov 2 gives October one piece and November another.
 */
export function bandSegments(trip: Pick<Trip, "visit_start" | "visit_end">, year: number, month: number): BandSegment[] {
  const { firstDow, daysInMonth } = monthShape(year, month)
  const monthStart = isoDate(year, month, 1)
  const monthEnd = isoDate(year, month, daysInMonth)
  const from = trip.visit_start > monthStart ? trip.visit_start : monthStart
  const to = trip.visit_end < monthEnd ? trip.visit_end : monthEnd
  if (from > to) return []

  const segments: BandSegment[] = []
  for (let day = utcDay(from); day <= utcDay(to); day++) {
    const iso = isoFromUtcDay(day)
    const index = firstDow + parts(iso)[2] - 1
    const row = Math.floor(index / 7)
    const col = index % 7
    const last = segments.at(-1)
    if (last && last.row === row) {
      last.endCol = col
      last.roundEnd = iso === trip.visit_end || col === 6
    } else {
      segments.push({
        row,
        startCol: col,
        endCol: col,
        roundStart: iso === trip.visit_start || col === 0,
        roundEnd: iso === trip.visit_end || col === 6,
      })
    }
  }
  return segments
}

export interface CalendarCell {
  /** Null for the blank cells before the 1st. */
  day: number | null
  iso: string | null
  /** Before today (shown muted). */
  past: boolean
  band: "selected" | "other" | null
  roundLeft: boolean
  roundRight: boolean
}

/**
 * The cells of a month view: leading blanks, then one cell per day with the
 * band it sits in. Where trips overlap, the selected trip wins, else the
 * earliest.
 */
export function monthGrid(
  year: number,
  month: number,
  trips: Trip[],
  selectedId: string | null,
  today: string,
): CalendarCell[] {
  const { firstDow, daysInMonth } = monthShape(year, month)
  const cells: CalendarCell[] = Array.from({ length: firstDow }, () => ({
    day: null,
    iso: null,
    past: false,
    band: null,
    roundLeft: false,
    roundRight: false,
  }))
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = isoDate(year, month, day)
    cells.push({ day, iso, past: iso < today, band: null, roundLeft: false, roundRight: false })
  }

  // Paint others first (latest first, so the earliest ends up on top), then
  // the selected trip over everything.
  const ordered = [...trips].sort(byVisitStart).reverse()
  const selected = ordered.filter((t) => t.id === selectedId)
  for (const trip of [...ordered.filter((t) => t.id !== selectedId), ...selected]) {
    for (const seg of bandSegments(trip, year, month)) {
      for (let col = seg.startCol; col <= seg.endCol; col++) {
        const cell = cells[seg.row * 7 + col]
        cell.band = trip.id === selectedId ? "selected" : "other"
        cell.roundLeft = col === seg.startCol && seg.roundStart
        cell.roundRight = col === seg.endCol && seg.roundEnd
      }
    }
  }
  return cells
}

// Formatting ----------------------------------------------------------------------

/** "Sat, Oct 31" */
export function formatTicketDate(iso: string): string {
  const [y, m, d] = parts(iso)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

/** Airports we fly between, so times show in the airport's own zone like a
 * flight board. Anything else falls back to the device's zone. */
const AIRPORT_TIME_ZONE: Record<string, string> = Object.fromEntries(
  ["SFO", "OAK", "SJC", "LAX", "BUR", "LGB", "SNA", "ONT", "SAN"].map((code) => [code, "America/Los_Angeles"]),
)

/** 24-hour "16:20" in the airport's zone; "--:--" when unknown. `fallbackZone`
 * is for unlisted airports (defaults to the device's zone). */
export function formatTime(timestamp: string | null, airportCode: string | null, fallbackZone?: string): string {
  if (!timestamp) return "--:--"
  const timeZone = (airportCode && AIRPORT_TIME_ZONE[airportCode]) || fallbackZone
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone })
}

export function planCountLabel(count: number): string {
  if (count === 0) return "None yet"
  return count === 1 ? "1 plan" : `${count} plans`
}

/** The label on a trip-plan row: "Event" for dated/seasonal ideas (the Plans
 * "Events" filter), otherwise the idea's type. */
export function planTypeLabel(idea: Pick<Idea, "type" | "starts_on" | "ends_on" | "season_label">): string {
  if (idea.starts_on || idea.ends_on || idea.season_label) return "Event"
  return idea.type.charAt(0).toUpperCase() + idea.type.slice(1)
}
