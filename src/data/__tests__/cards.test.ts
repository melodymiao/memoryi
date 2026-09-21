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
  category: null,
  categories: ["food"],
  status: "wishlist" as const,
  notes: null,
  tags: [],
  place_id: "place-1",
  address: "422 E 2nd St, Los Angeles, CA",
  neighborhood: "Little Tokyo",
  price_level: 3,
  types: ["omakase"],
  source_person: "Jenny",
  source_link: "https://example.com/sushi-gen",
  source_screenshot: null,
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

    const result = await createCard({
      title: "Sushi Gen",
      categories: ["food"],
      types: ["omakase"],
      priceLevel: 3,
      neighborhood: "Little Tokyo",
      address: "422 E 2nd St, Los Angeles, CA",
      placeId: "place-1",
      sourcePerson: "Jenny",
      sourceLink: "https://example.com/sushi-gen",
    })

    expect(query.insert).toHaveBeenCalledWith({
      space_id: SPACE_ID,
      title: "Sushi Gen",
      categories: ["food"],
      notes: null,
      place_id: "place-1",
      address: "422 E 2nd St, Los Angeles, CA",
      neighborhood: "Little Tokyo",
      price_level: 3,
      types: ["omakase"],
      source_person: "Jenny",
      source_link: "https://example.com/sushi-gen",
      source_screenshot: null,
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
  it("updates title/categories/notes and place details for the given id", async () => {
    const updated = { ...fixtureCard, title: "Sushi Gen (updated)", notes: "counter seats" }
    const query = makeQueryMock({ data: updated, error: null })
    vi.mocked(supabase.from).mockReturnValue(query as never)

    const result = await updateCard("card-1", {
      title: "Sushi Gen (updated)",
      categories: ["food", "cafe"],
      notes: "counter seats",
      placeId: "place-1",
      address: "422 E 2nd St, Los Angeles, CA",
      neighborhood: "Little Tokyo",
      priceLevel: 3,
      types: ["omakase"],
      sourcePerson: "Jenny",
      sourceLink: "https://example.com/sushi-gen",
      sourceScreenshot: null,
    })

    expect(query.update).toHaveBeenCalledWith({
      title: "Sushi Gen (updated)",
      categories: ["food", "cafe"],
      notes: "counter seats",
      place_id: "place-1",
      address: "422 E 2nd St, Los Angeles, CA",
      neighborhood: "Little Tokyo",
      price_level: 3,
      types: ["omakase"],
      source_person: "Jenny",
      source_link: "https://example.com/sushi-gen",
      source_screenshot: null,
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
