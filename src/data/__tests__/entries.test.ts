import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeQueryMock } from "./supabaseMock"

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn() } }))
vi.mock("../../lib/auth", () => ({ ensureSession: vi.fn() }))
vi.mock("../spaces", () => ({ getMySpaceId: vi.fn() }))

import { supabase } from "../../lib/supabase"
import { ensureSession } from "../../lib/auth"
import { getMySpaceId } from "../spaces"
import { createEntry, listEntries } from "../entries"

const SPACE_ID = "space-1"
const USER_ID = "user-1"

const fixtureEntry = {
  id: "entry-1",
  space_id: SPACE_ID,
  title: "sun nong dan",
  place_name: "Koreatown",
  entry_date: "2026-09-01",
  caption: "galbi jjim, medium spice",
  photos: ["space-1/entry-1/a.jpg"],
  source_card_id: null,
  created_by: USER_ID,
  created_at: "2026-09-01T00:00:00.000Z",
}

beforeEach(() => {
  vi.mocked(getMySpaceId).mockResolvedValue(SPACE_ID)
  vi.mocked(ensureSession).mockResolvedValue(USER_ID)
})

describe("listEntries", () => {
  it("scopes to the current space, newest first", async () => {
    const query = makeQueryMock({ data: [fixtureEntry], error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await listEntries()

    expect(supabase.from).toHaveBeenCalledWith("entries")
    expect(query.eq).toHaveBeenCalledWith("space_id", SPACE_ID)
    expect(query.order).toHaveBeenCalledWith("entry_date", { ascending: false })
    expect(result).toEqual([fixtureEntry])
  })
})

describe("createEntry", () => {
  it("inserts with the resolved space/user and defaults photos to []", async () => {
    const query = makeQueryMock({ data: fixtureEntry, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await createEntry({ title: "sun nong dan", placeName: "Koreatown" })

    expect(query.insert).toHaveBeenCalledWith({
      space_id: SPACE_ID,
      title: "sun nong dan",
      place_name: "Koreatown",
      entry_date: undefined,
      caption: null,
      photos: [],
      source_card_id: null,
      created_by: USER_ID,
    })
  })

  it("links back to a source card when given one", async () => {
    const query = makeQueryMock({ data: fixtureEntry, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await createEntry({ title: "sun nong dan", sourceCardId: "card-1" })

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ source_card_id: "card-1" }),
    )
  })
})
