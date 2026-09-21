import { describe, expect, it } from "vitest"
import { mapsUrl } from "../maps"

describe("mapsUrl", () => {
  it("links to the exact place when a place id is known", () => {
    const url = new URL(mapsUrl({ placeId: "abc", name: "Sushi Gen", address: "422 E 2nd St, Los Angeles" })!)
    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/search/")
    expect(url.searchParams.get("api")).toBe("1")
    expect(url.searchParams.get("query")).toBe("Sushi Gen 422 E 2nd St, Los Angeles")
    expect(url.searchParams.get("query_place_id")).toBe("abc")
  })

  it("falls back to searching the address", () => {
    const url = new URL(mapsUrl({ address: "422 E 2nd St" })!)
    expect(url.searchParams.get("query")).toBe("422 E 2nd St")
    expect(url.searchParams.has("query_place_id")).toBe(false)
  })

  it("returns null with nothing to look up", () => {
    expect(mapsUrl({})).toBeNull()
    expect(mapsUrl({ placeId: "abc" })).toBeNull()
  })
})
