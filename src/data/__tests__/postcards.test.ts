import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeQueryMock } from "./supabaseMock"

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))
vi.mock("../../lib/auth", () => ({ ensureSession: vi.fn() }))
vi.mock("../spaces", () => ({ getMySpaceId: vi.fn() }))
vi.mock("../../lib/photos", () => ({ uploadPostcardPhoto: vi.fn(), deletePostcardPhotos: vi.fn() }))

import { supabase } from "../../lib/supabase"
import { ensureSession } from "../../lib/auth"
import { getMySpaceId } from "../spaces"
import { deletePostcardPhotos, uploadPostcardPhoto } from "../../lib/photos"
import { hasLockedPostcard, isPostcardActive, sendPostcard } from "../postcards"
import type { Postcard } from "../../types/database"

const SPACE_ID = "space-1"
const USER_ID = "user-1"
const photo = new File(["x"], "front.jpg", { type: "image/jpeg" })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getMySpaceId).mockResolvedValue(SPACE_ID)
  vi.mocked(ensureSession).mockResolvedValue(USER_ID)
  vi.mocked(uploadPostcardPhoto).mockImplementation(async (spaceId, id, file) => `${spaceId}/${id}/${file.name}`)
  vi.mocked(deletePostcardPhotos).mockResolvedValue()
})

describe("sendPostcard", () => {
  it("uploads under the new postcard's id, then inserts without expires_at", async () => {
    const query = makeQueryMock({ data: {}, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await sendPostcard({ photo, caption: "  hi from SF  " })

    const insert = vi.mocked(query.insert as (row: Record<string, unknown>) => unknown).mock.calls[0][0]
    expect(uploadPostcardPhoto).toHaveBeenCalledWith(SPACE_ID, insert.id, photo)
    expect(insert).toEqual({
      id: insert.id,
      space_id: SPACE_ID,
      sender_id: USER_ID,
      photo_path: `${SPACE_ID}/${insert.id}/front.jpg`,
      secondary_photo_path: null,
      caption: "hi from SF",
    })
    expect(insert).not.toHaveProperty("expires_at")
  })

  it("removes the uploaded photos if saving the row fails", async () => {
    vi.mocked(supabase.from).mockReturnValue(makeQueryMock({ data: null, error: { message: "nope" } }) as never)

    await expect(sendPostcard({ photo })).rejects.toThrow("Sending the postcard failed: nope")
    expect(deletePostcardPhotos).toHaveBeenCalledWith([expect.stringContaining("front.jpg")])
  })
})

describe("hasLockedPostcard", () => {
  it("asks the database for the current space", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as never)

    expect(await hasLockedPostcard()).toBe(true)
    expect(supabase.rpc).toHaveBeenCalledWith("has_locked_postcard", { target_space_id: SPACE_ID })
  })
})

describe("isPostcardActive", () => {
  it("compares expires_at with now", () => {
    const postcard = { expires_at: "2026-10-27T12:00:00Z" } as Postcard
    expect(isPostcardActive(postcard, new Date("2026-10-27T11:59:00Z"))).toBe(true)
    expect(isPostcardActive(postcard, new Date("2026-10-27T12:00:00Z"))).toBe(false)
  })
})
