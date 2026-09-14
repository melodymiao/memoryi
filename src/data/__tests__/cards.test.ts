import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeQueryMock } from "./supabaseMock"

vi.mock("../../lib/supabase", () => ({ supabase: { from: vi.fn() } }))
vi.mock("../../lib/auth", () => ({ ensureSession: vi.fn() }))
vi.mock("../spaces", () => ({ getMySpaceId: vi.fn() }))

import { supabase } from "../../lib/supabase"
import { ensureSession } from "../../lib/auth"
import { getMySpaceId } from "../spaces"
import { createCard, deleteCard, getCard, listCards, updateCard, updateCardStatus } from "../cards"

const SPACE_ID = "space-1"
const USER_ID = "user-1"

const fixtureCard = {
  id: "card-1",
  space_id: SPACE_ID,
  title: "Sushi Gen",
  category: "food",
  status: "wishlist" as const,
  notes: null,
  tags: ["omakase"],
  created_by: USER_ID,
  created_at: "2026-01-01T00:00:00.000Z",
}

beforeEach(() => {
  vi.mocked(getMySpaceId).mockResolvedValue(SPACE_ID)
  vi.mocked(ensureSession).mockResolvedValue(USER_ID)
})

describe("listCards", () => {
  it("scopes the query to the current space and returns the rows", async () => {
    const query = makeQueryMock({ data: [fixtureCard], error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await listCards()

    expect(supabase.from).toHaveBeenCalledWith("cards")
    expect(query.eq).toHaveBeenCalledWith("space_id", SPACE_ID)
    expect(result).toEqual([fixtureCard])
  })

  it("throws when the query errors", async () => {
    const boom = new Error("boom")
    vi.mocked(supabase.from).mockReturnValue(makeQueryMock({ data: null, error: boom }) as never)

    await expect(listCards()).rejects.toBe(boom)
  })
})

describe("createCard", () => {
  it("inserts with the resolved space and user, defaulting optional fields", async () => {
    const query = makeQueryMock({ data: fixtureCard, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await createCard({ title: "Sushi Gen", category: "food", tags: ["omakase"] })

    expect(query.insert).toHaveBeenCalledWith({
      space_id: SPACE_ID,
      title: "Sushi Gen",
      category: "food",
      notes: null,
      tags: ["omakase"],
      status: undefined,
      created_by: USER_ID,
    })
    expect(result).toEqual(fixtureCard)
  })
})

describe("updateCardStatus", () => {
  it("updates just the status column for the given id", async () => {
    const visited = { ...fixtureCard, status: "visited" as const }
    const query = makeQueryMock({ data: visited, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await updateCardStatus("card-1", "visited")

    expect(query.update).toHaveBeenCalledWith({ status: "visited" })
    expect(query.eq).toHaveBeenCalledWith("id", "card-1")
    expect(result.status).toBe("visited")
  })
})

describe("getCard", () => {
  it("fetches a single card by id", async () => {
    const query = makeQueryMock({ data: fixtureCard, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await getCard("card-1")

    expect(supabase.from).toHaveBeenCalledWith("cards")
    expect(query.eq).toHaveBeenCalledWith("id", "card-1")
    expect(result).toEqual(fixtureCard)
  })

  it("throws when the query errors", async () => {
    const boom = new Error("boom")
    vi.mocked(supabase.from).mockReturnValue(makeQueryMock({ data: null, error: boom }) as never)

    await expect(getCard("card-1")).rejects.toBe(boom)
  })
})

describe("updateCard", () => {
  it("updates title/category/notes/tags for the given id", async () => {
    const updated = { ...fixtureCard, title: "Sushi Gen (updated)", notes: "counter seats" }
    const query = makeQueryMock({ data: updated, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await updateCard("card-1", {
      title: "Sushi Gen (updated)",
      category: "food",
      notes: "counter seats",
      tags: ["omakase"],
    })

    expect(query.update).toHaveBeenCalledWith({
      title: "Sushi Gen (updated)",
      category: "food",
      notes: "counter seats",
      tags: ["omakase"],
    })
    expect(query.eq).toHaveBeenCalledWith("id", "card-1")
    expect(result).toEqual(updated)
  })
})

describe("deleteCard", () => {
  it("deletes the card by id", async () => {
    const query = makeQueryMock({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    await deleteCard("card-1")

    expect(supabase.from).toHaveBeenCalledWith("cards")
    expect(query.eq).toHaveBeenCalledWith("id", "card-1")
  })

  it("throws when the query errors", async () => {
    const boom = new Error("boom")
    vi.mocked(supabase.from).mockReturnValue(makeQueryMock({ data: null, error: boom }) as never)

    await expect(deleteCard("card-1")).rejects.toBe(boom)
  })
})
