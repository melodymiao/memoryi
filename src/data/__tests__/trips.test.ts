import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeQueryMock } from "./supabaseMock"

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn() } }))
vi.mock("../../lib/auth", () => ({ ensureSession: vi.fn() }))
vi.mock("../spaces", () => ({ getMySpaceId: vi.fn() }))

import { supabase } from "../../lib/supabase"
import { ensureSession } from "../../lib/auth"
import { getMySpaceId } from "../spaces"
import { createTrip, getNextTrip, getPastTrips, listTrips, tripNumber, updateTrip } from "../trips"
import type { Trip } from "../../types/database"

const SPACE_ID = "space-1"
const USER_ID = "user-1"

function trip(id: string, visitStart: string, visitEnd = visitStart): Trip {
  return {
    id,
    space_id: SPACE_ID,
    traveler_user_id: USER_ID,
    airline: "Alaska Airlines",
    flight_number: "AS 1381",
    flight_date: visitStart,
    origin_code: "SFO",
    dest_code: "LAX",
    dest_city: "Los Angeles",
    depart_at: null,
    arrive_at: null,
    arrival_terminal: "6",
    arrival_gate: "64B",
    flight_status: null,
    flight_data_updated_at: null,
    visit_start: visitStart,
    visit_end: visitEnd,
    miles: 337,
    created_by: USER_ID,
    created_at: "2026-09-01T00:00:00.000Z",
  }
}

beforeEach(() => {
  vi.mocked(getMySpaceId).mockResolvedValue(SPACE_ID)
  vi.mocked(ensureSession).mockResolvedValue(USER_ID)
})

describe("listTrips", () => {
  it("scopes to the space, oldest visit first", async () => {
    const query = makeQueryMock({ data: [trip("t1", "2026-10-03")], error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await listTrips()

    expect(supabase.from).toHaveBeenCalledWith("trips")
    expect(query.eq).toHaveBeenCalledWith("space_id", SPACE_ID)
    expect(query.order).toHaveBeenCalledWith("visit_start", { ascending: true })
    expect(result).toHaveLength(1)
  })
})

describe("getNextTrip", () => {
  it("returns the earliest trip that hasn't ended by the given date", async () => {
    const next = trip("t3", "2026-10-31", "2026-11-02")
    const query = makeQueryMock({ data: next, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await getNextTrip("2026-10-27")

    expect(query.gte).toHaveBeenCalledWith("visit_end", "2026-10-27")
    expect(query.order).toHaveBeenCalledWith("visit_start", { ascending: true })
    expect(query.limit).toHaveBeenCalledWith(1)
    expect(result).toEqual(next)
  })

  it("returns null when there's nothing ahead", async () => {
    vi.mocked(supabase.from).mockReturnValue(makeQueryMock({ data: null, error: null }) as never)

    expect(await getNextTrip("2027-01-01")).toBeNull()
  })
})

describe("getPastTrips", () => {
  it("returns trips that ended before the given date, newest first", async () => {
    const query = makeQueryMock({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await getPastTrips("2026-10-27")

    expect(query.lt).toHaveBeenCalledWith("visit_end", "2026-10-27")
    expect(query.order).toHaveBeenCalledWith("visit_start", { ascending: false })
  })
})

describe("tripNumber", () => {
  it("numbers trips by visit_start regardless of input order", () => {
    const trips = [trip("c", "2026-10-31"), trip("a", "2026-10-03"), trip("b", "2026-10-17")]

    expect(tripNumber(trips, "a")).toBe(1)
    expect(tripNumber(trips, "c")).toBe(3)
    expect(tripNumber(trips, "missing")).toBeNull()
  })
})

describe("createTrip", () => {
  it("maps camelCase input to columns and leaves unset fields to DB defaults", async () => {
    const query = makeQueryMock({ data: trip("t1", "2026-10-03"), error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await createTrip({
      travelerUserId: USER_ID,
      destCity: "Los Angeles",
      visitStart: "2026-10-03",
      visitEnd: "2026-10-05",
      originCode: "SFO",
      destCode: "LAX",
    })

    expect(query.insert).toHaveBeenCalledWith({
      traveler_user_id: USER_ID,
      dest_city: "Los Angeles",
      visit_start: "2026-10-03",
      visit_end: "2026-10-05",
      origin_code: "SFO",
      dest_code: "LAX",
      space_id: SPACE_ID,
      created_by: USER_ID,
    })
  })
})

describe("updateTrip", () => {
  it("only sends the fields passed, with null clearing", async () => {
    const query = makeQueryMock({ data: trip("t1", "2026-10-03"), error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await updateTrip("t1", { arrivalGate: null, flightStatus: "delayed" })

    expect(query.update).toHaveBeenCalledWith({ arrival_gate: null, flight_status: "delayed" })
    expect(query.eq).toHaveBeenCalledWith("id", "t1")
  })
})
