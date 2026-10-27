import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeQueryMock } from "./supabaseMock"

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn() } }))
vi.mock("../../lib/auth", () => ({ ensureSession: vi.fn() }))
vi.mock("../spaces", () => ({ getMySpaceId: vi.fn() }))

import { supabase } from "../../lib/supabase"
import { ensureSession } from "../../lib/auth"
import { getMySpaceId } from "../spaces"
import { createIdea, listIdeas, toggleIdeaFavorite } from "../ideas"

const SPACE_ID = "space-1"
const USER_ID = "user-1"

const ideaRow = {
  id: "idea-1",
  space_id: SPACE_ID,
  title: "Sun Nong Dan",
  location_label: "LA",
  type: "eat",
  address: null,
  latitude: null,
  longitude: null,
  source_url: null,
  starts_on: null,
  ends_on: null,
  season_label: null,
  legacy_card_id: null,
  created_by: USER_ID,
  created_at: "2026-10-01T00:00:00.000Z",
}

beforeEach(() => {
  vi.mocked(getMySpaceId).mockResolvedValue(SPACE_ID)
  vi.mocked(ensureSession).mockResolvedValue(USER_ID)
})

describe("listIdeas", () => {
  it("flattens embedded favorites into favorited_by", async () => {
    const query = makeQueryMock({
      data: [{ ...ideaRow, idea_favorites: [{ user_id: "user-1" }, { user_id: "user-2" }] }],
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const [idea] = await listIdeas()

    expect(query.select).toHaveBeenCalledWith("*, idea_favorites(user_id)")
    expect(query.eq).toHaveBeenCalledWith("space_id", SPACE_ID)
    expect(idea.favorited_by).toEqual(["user-1", "user-2"])
    expect(idea).not.toHaveProperty("idea_favorites")
  })
})

describe("createIdea", () => {
  it("inserts only the fields given plus space/creator", async () => {
    const query = makeQueryMock({ data: { ...ideaRow, idea_favorites: [] }, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const idea = await createIdea({ title: "Sun Nong Dan", type: "eat", locationLabel: "LA" })

    expect(query.insert).toHaveBeenCalledWith({
      title: "Sun Nong Dan",
      type: "eat",
      location_label: "LA",
      space_id: SPACE_ID,
      created_by: USER_ID,
    })
    expect(idea.favorited_by).toEqual([])
  })
})

describe("toggleIdeaFavorite", () => {
  it("adds your heart when not favorited", async () => {
    const query = makeQueryMock({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    expect(await toggleIdeaFavorite("idea-1", false)).toBe(true)
    expect(supabase.from).toHaveBeenCalledWith("idea_favorites")
    expect(query.insert).toHaveBeenCalledWith({ idea_id: "idea-1", user_id: USER_ID, space_id: SPACE_ID })
  })

  it("removes only your heart when favorited", async () => {
    const query = makeQueryMock({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    expect(await toggleIdeaFavorite("idea-1", true)).toBe(false)
    expect(query.delete).toHaveBeenCalled()
    expect(query.eq).toHaveBeenCalledWith("idea_id", "idea-1")
    expect(query.eq).toHaveBeenCalledWith("user_id", USER_ID)
  })
})
