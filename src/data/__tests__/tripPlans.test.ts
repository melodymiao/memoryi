import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeQueryMock } from "./supabaseMock"

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn() } }))
vi.mock("../../lib/auth", () => ({ ensureSession: vi.fn() }))
vi.mock("../spaces", () => ({ getMySpaceId: vi.fn() }))

import { supabase } from "../../lib/supabase"
import { ensureSession } from "../../lib/auth"
import { getMySpaceId } from "../spaces"
import { addIdeaToTrip, addTripPlan, setTripPlanDone } from "../tripPlans"

const SPACE_ID = "space-1"
const USER_ID = "user-1"

beforeEach(() => {
  vi.mocked(getMySpaceId).mockResolvedValue(SPACE_ID)
  vi.mocked(ensureSession).mockResolvedValue(USER_ID)
})

describe("addIdeaToTrip", () => {
  it("copies the idea's title, links it, and appends after the last item", async () => {
    const positionQuery = makeQueryMock({ data: { position: 2 }, error: null })
    const insertQuery = makeQueryMock({ data: {}, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(positionQuery as never).mockReturnValueOnce(insertQuery as never)

    await addIdeaToTrip("trip-1", { id: "idea-1", title: "Sun Nong Dan" })

    expect(positionQuery.eq).toHaveBeenCalledWith("trip_id", "trip-1")
    expect(insertQuery.insert).toHaveBeenCalledWith({
      space_id: SPACE_ID,
      trip_id: "trip-1",
      idea_id: "idea-1",
      title: "Sun Nong Dan",
      position: 3,
      created_by: USER_ID,
    })
  })
})

describe("addTripPlan", () => {
  it("starts at position 0 on an empty trip, with no idea link", async () => {
    const positionQuery = makeQueryMock({ data: null, error: null })
    const insertQuery = makeQueryMock({ data: {}, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(positionQuery as never).mockReturnValueOnce(insertQuery as never)

    await addTripPlan("trip-1", "Pick up costumes")

    expect(insertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ idea_id: null, title: "Pick up costumes", position: 0 }),
    )
  })
})

describe("setTripPlanDone", () => {
  it("stamps done_at when done and clears it when undone", async () => {
    const query = makeQueryMock({ data: {}, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await setTripPlanDone("plan-1", true)
    expect(query.update).toHaveBeenLastCalledWith({ done: true, done_at: expect.any(String) })

    await setTripPlanDone("plan-1", false)
    expect(query.update).toHaveBeenLastCalledWith({ done: false, done_at: null })
  })
})
