import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeQueryMock } from "./supabaseMock"

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))
vi.mock("../../lib/auth", () => ({ ensureSession: vi.fn() }))
vi.mock("../spaces", () => ({ getMySpaceId: vi.fn() }))

import { supabase } from "../../lib/supabase"
import { ensureSession } from "../../lib/auth"
import { getMySpaceId } from "../spaces"
import { getPartner, updateMyProfile } from "../members"
import { upsertMyStatus } from "../statuses"
import { upsertMyFaveSong } from "../favoriteSongs"
import { getPassportStats } from "../passport"

const SPACE_ID = "space-1"
const USER_ID = "user-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getMySpaceId).mockResolvedValue(SPACE_ID)
  vi.mocked(ensureSession).mockResolvedValue(USER_ID)
})

describe("getPartner", () => {
  it("returns the member who isn't you, or null", async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeQueryMock({ data: [{ user_id: USER_ID }, { user_id: "user-2" }], error: null }) as never,
    )
    expect((await getPartner())?.user_id).toBe("user-2")

    vi.mocked(supabase.from).mockReturnValue(makeQueryMock({ data: [{ user_id: USER_ID }], error: null }) as never)
    expect(await getPartner()).toBeNull()
  })
})

describe("updateMyProfile", () => {
  it("updates only your row and only the fields given, upper-casing codes", async () => {
    const query = makeQueryMock({ data: {}, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await updateMyProfile({ displayCode: " mel ", homeAirport: "sfo" })

    expect(query.update).toHaveBeenCalledWith({ display_code: "MEL", home_airport: "SFO" })
    expect(query.eq).toHaveBeenCalledWith("space_id", SPACE_ID)
    expect(query.eq).toHaveBeenCalledWith("user_id", USER_ID)
  })
})

describe("upsertMyStatus", () => {
  it("upserts your row on (space_id, user_id)", async () => {
    const query = makeQueryMock({ data: {}, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await upsertMyStatus("  packing  ")

    expect(query.upsert).toHaveBeenCalledWith(
      { space_id: SPACE_ID, user_id: USER_ID, text: "packing" },
      { onConflict: "space_id,user_id" },
    )
  })

  it("rejects empty and over-long text before hitting the database", async () => {
    await expect(upsertMyStatus("   ")).rejects.toThrow()
    await expect(upsertMyStatus("a".repeat(41))).rejects.toThrow()
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

describe("upsertMyFaveSong", () => {
  it("upserts your row on (space_id, user_id)", async () => {
    const query = makeQueryMock({ data: {}, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await upsertMyFaveSong({ url: "https://music.youtube.com/watch?v=abc", title: "Malibu Nights", artist: "LANY" })

    expect(query.upsert).toHaveBeenCalledWith(
      {
        space_id: SPACE_ID,
        user_id: USER_ID,
        url: "https://music.youtube.com/watch?v=abc",
        title: "Malibu Nights",
        artist: "LANY",
        thumbnail_url: null,
      },
      { onConflict: "space_id,user_id" },
    )
  })
})

describe("getPassportStats", () => {
  it("calls get_passport_stats for the current space as of the given date", async () => {
    const stats = { total_miles: 674, visit_count: 2, days_together: 6, distinct_cities: 2, visits_per_city: [] }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: stats, error: null } as never)

    expect(await getPassportStats("2026-10-27")).toEqual(stats)
    expect(supabase.rpc).toHaveBeenCalledWith("get_passport_stats", { target_space_id: SPACE_ID, as_of: "2026-10-27" })
  })
})
