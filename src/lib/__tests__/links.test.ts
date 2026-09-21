import { describe, expect, it } from "vitest"
import { linkHost, normalizeLink, safeHref } from "../links"

describe("normalizeLink", () => {
  it("treats blank as no link", () => {
    expect(normalizeLink("  ")).toEqual({ ok: true, url: null })
  })

  it("adds https:// to bare domains", () => {
    expect(normalizeLink("eater.com/la/sushi")).toEqual({ ok: true, url: "https://eater.com/la/sushi" })
  })

  it("keeps http(s) links", () => {
    expect(normalizeLink("http://example.com/x")).toEqual({ ok: true, url: "http://example.com/x" })
  })

  it("rejects non-http schemes and junk", () => {
    expect(normalizeLink("javascript:alert(1)")).toEqual({ ok: false })
    expect(normalizeLink("data:text/html,hi")).toEqual({ ok: false })
    expect(normalizeLink("not a link")).toEqual({ ok: false })
  })
})

describe("safeHref / linkHost", () => {
  it("only passes safe urls through", () => {
    expect(safeHref("https://example.com")).toBe("https://example.com/")
    expect(safeHref("javascript:alert(1)")).toBeNull()
    expect(safeHref(null)).toBeNull()
  })

  it("shows the host without www", () => {
    expect(linkHost("https://www.eater.com/la/sushi")).toBe("eater.com")
  })
})
