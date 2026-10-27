import { describe, expect, it } from "vitest"
import {
  bandSegments,
  countdown,
  daysBetween,
  defaultTrip,
  formatTicketDate,
  formatTime,
  monthGrid,
  nextTrip,
  padDays,
  pastTrips,
  planCountLabel,
  planTypeLabel,
} from "../trips"
import { todayLocal } from "../dates"
import type { Trip } from "../../types/database"

function trip(id: string, start: string, end: string): Trip {
  return {
    id,
    space_id: "s",
    traveler_user_id: "u",
    airline: null,
    flight_number: null,
    flight_date: null,
    origin_code: "SFO",
    dest_code: "LAX",
    dest_city: "Los Angeles",
    depart_at: null,
    arrive_at: null,
    arrival_terminal: null,
    arrival_gate: null,
    flight_status: null,
    flight_data_updated_at: null,
    visit_start: start,
    visit_end: end,
    miles: 337,
    created_by: "u",
    created_at: "2026-09-01T00:00:00Z",
  }
}

// The seed trips.
const oct3 = trip("oct3", "2026-10-03", "2026-10-05")
const oct17 = trip("oct17", "2026-10-17", "2026-10-19")
const oct31 = trip("oct31", "2026-10-31", "2026-11-02")
const nov13 = trip("nov13", "2026-11-13", "2026-11-15")
const SEED = [nov13, oct3, oct31, oct17] // deliberately out of order

describe("daysBetween", () => {
  it("counts whole days, including across the Nov 1 DST change", () => {
    expect(daysBetween("2026-10-27", "2026-10-31")).toBe(4)
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2)
    expect(daysBetween("2026-10-31", "2026-10-27")).toBe(-4)
  })
})

describe("nextTrip / pastTrips / defaultTrip", () => {
  it("picks the soonest trip ahead and lists ended ones oldest first", () => {
    expect(nextTrip(SEED, "2026-10-27")?.id).toBe("oct31")
    expect(pastTrips(SEED, "2026-10-27").map((t) => t.id)).toEqual(["oct3", "oct17"])
  })

  it("counts a visit in progress — including its last day — as next, not past", () => {
    expect(nextTrip(SEED, "2026-11-01")?.id).toBe("oct31")
    expect(nextTrip(SEED, "2026-11-02")?.id).toBe("oct31")
    expect(pastTrips(SEED, "2026-11-02").map((t) => t.id)).toEqual(["oct3", "oct17"])
    expect(nextTrip(SEED, "2026-11-03")?.id).toBe("nov13")
  })

  it("defaults to the most recent past trip when nothing is ahead", () => {
    expect(defaultTrip(SEED, "2027-01-01")?.id).toBe("nov13")
    expect(defaultTrip([], "2027-01-01")).toBeNull()
  })
})

describe("countdown", () => {
  it("counts days to the next visit's start", () => {
    expect(countdown(SEED, "2026-10-27")).toMatchObject({ kind: "days", days: 4, trip: { id: "oct31" } })
  })

  it("says today on the arrival day", () => {
    expect(countdown(SEED, "2026-10-31")).toMatchObject({ kind: "today", trip: { id: "oct31" } })
  })

  it("says together mid-visit and on the last day", () => {
    expect(countdown(SEED, "2026-11-01")).toEqual({ kind: "together" })
    expect(countdown(SEED, "2026-11-02")).toEqual({ kind: "together" })
  })

  it("resumes counting the day after a visit", () => {
    expect(countdown(SEED, "2026-11-03")).toMatchObject({ kind: "days", days: 10, trip: { id: "nov13" } })
  })

  it("says none when nothing is booked", () => {
    expect(countdown(SEED, "2027-01-01")).toEqual({ kind: "none" })
    expect(countdown([], "2026-10-27")).toEqual({ kind: "none" })
  })

  it("pads to two digits but not beyond", () => {
    expect(padDays(4)).toBe("04")
    expect(padDays(42)).toBe("42")
    expect(padDays(120)).toBe("120")
  })
})

describe("bandSegments", () => {
  it("gives a one-day trip a single piece rounded on both ends", () => {
    expect(bandSegments(trip("a", "2026-10-14", "2026-10-14"), 2026, 10)).toEqual([
      { row: 2, startCol: 3, endCol: 3, roundStart: true, roundEnd: true },
    ])
  })

  it("splits a Sat→Mon trip across two week rows, rounding at the row edges", () => {
    // Oct 17 2026 is a Saturday.
    expect(bandSegments(trip("a", "2026-10-17", "2026-10-19"), 2026, 10)).toEqual([
      { row: 2, startCol: 6, endCol: 6, roundStart: true, roundEnd: true },
      { row: 3, startCol: 0, endCol: 1, roundStart: true, roundEnd: true },
    ])
  })

  it("only includes each month's own days for a trip spanning months", () => {
    expect(bandSegments(oct31, 2026, 10)).toEqual([{ row: 4, startCol: 6, endCol: 6, roundStart: true, roundEnd: true }])
    // Nov 1 2026 is a Sunday.
    expect(bandSegments(oct31, 2026, 11)).toEqual([{ row: 0, startCol: 0, endCol: 1, roundStart: true, roundEnd: true }])
    expect(bandSegments(oct31, 2026, 12)).toEqual([])
  })

  it("leaves the edge flat where a trip continues from the previous month mid-week", () => {
    // Sep 29 → Oct 2; Oct 1 2026 is a Thursday.
    expect(bandSegments(trip("a", "2026-09-29", "2026-10-02"), 2026, 10)).toEqual([
      { row: 0, startCol: 4, endCol: 5, roundStart: false, roundEnd: true },
    ])
  })

  it("rounds a full Sun–Sat week at both ends", () => {
    expect(bandSegments(trip("a", "2026-10-11", "2026-10-17"), 2026, 10)).toEqual([
      { row: 2, startCol: 0, endCol: 6, roundStart: true, roundEnd: true },
    ])
  })
})

describe("monthGrid", () => {
  it("starts with blanks up to the 1st (Oct 2026 starts on a Thursday)", () => {
    const cells = monthGrid(2026, 10, [], null, "2026-10-27")
    expect(cells.slice(0, 4).every((c) => c.day === null)).toBe(true)
    expect(cells[4]).toMatchObject({ day: 1, iso: "2026-10-01" })
    expect(cells).toHaveLength(4 + 31)
  })

  it("marks the selected trip lime, others pink, and days before today as past", () => {
    const cells = monthGrid(2026, 10, SEED, "oct31", "2026-10-27")
    const day = (d: number) => cells.find((c) => c.day === d)!
    expect(day(31)).toMatchObject({ band: "selected", roundLeft: true, roundRight: true })
    expect(day(17)).toMatchObject({ band: "other", roundLeft: true, roundRight: true })
    expect(day(18)).toMatchObject({ band: "other", roundLeft: true, roundRight: false })
    expect(day(19)).toMatchObject({ band: "other", roundLeft: false, roundRight: true })
    expect(day(26).past).toBe(true)
    expect(day(27).past).toBe(false)
    expect(day(10).band).toBeNull()
  })

  it("lets the selected trip win where two overlap", () => {
    const a = trip("a", "2026-10-10", "2026-10-12")
    const b = trip("b", "2026-10-12", "2026-10-14")
    const cells = monthGrid(2026, 10, [a, b], "b", "2026-10-01")
    expect(cells.find((c) => c.day === 12)?.band).toBe("selected")
    expect(cells.find((c) => c.day === 11)?.band).toBe("other")
  })
})

describe("formatting", () => {
  it("formats the ticket date", () => {
    expect(formatTicketDate("2026-10-31")).toBe("Sat, Oct 31")
  })

  it("shows times in the airport's zone regardless of the device's", () => {
    expect(formatTime("2026-10-31T23:20:00Z", "SFO", "Asia/Tokyo")).toBe("16:20")
    expect(formatTime("2026-11-13T19:00:00-08:00", "LAX", "Europe/London")).toBe("19:00")
    expect(formatTime("2026-10-31T23:20:00Z", "JFK", "America/New_York")).toBe("19:20")
    expect(formatTime(null, "SFO")).toBe("--:--")
  })

  it("todayLocal uses the local calendar date late at night", () => {
    expect(todayLocal(new Date(2026, 9, 27, 23, 30))).toBe("2026-10-27")
    expect(todayLocal(new Date(2026, 9, 28, 0, 5))).toBe("2026-10-28")
  })

  it("labels plan counts and types", () => {
    expect([0, 1, 3].map(planCountLabel)).toEqual(["None yet", "1 plan", "3 plans"])
    const idea = { type: "eat" as const, starts_on: null, ends_on: null, season_label: null }
    expect(planTypeLabel(idea)).toBe("Eat")
    expect(planTypeLabel({ ...idea, season_label: "Spring" })).toBe("Event")
    expect(planTypeLabel({ ...idea, starts_on: "2026-11-20" })).toBe("Event")
  })
})
