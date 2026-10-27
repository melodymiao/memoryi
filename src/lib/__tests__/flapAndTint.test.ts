import { describe, expect, it } from "vitest"
import { toFlapTiles } from "../flap"
import { cityTint } from "../cityTint"

describe("toFlapTiles", () => {
  it("keeps strings as given, so a padded countdown stays two tiles", () => {
    expect(toFlapTiles("09")).toEqual([
      { char: "0", separator: false },
      { char: "9", separator: false },
    ])
  })

  it("formats numbers with commas and marks the commas as separators", () => {
    expect(toFlapTiles(4944)).toEqual([
      { char: "4", separator: false },
      { char: ",", separator: true },
      { char: "9", separator: false },
      { char: "4", separator: false },
      { char: "4", separator: false },
    ])
  })

  it("leaves small numbers without separators", () => {
    expect(toFlapTiles(9).map((t) => t.char)).toEqual(["9"])
  })
})

describe("cityTint", () => {
  it("maps each known city to its tint, ignoring case and spaces", () => {
    expect(cityTint("San Francisco")).toBe("pink")
    expect(cityTint(" los angeles ")).toBe("lime")
    expect(cityTint("San Diego")).toBe("on-dark-muted")
  })

  it("falls back for cities without a tint yet", () => {
    expect(cityTint("Seattle")).toBe("surface-muted")
  })
})
