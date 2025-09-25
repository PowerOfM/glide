import { describe, expect, it } from "vitest"
import { Uint8Encoder } from "./Uint8Encoder"

describe(Uint8Encoder.name, () => {
  it("converts", () => {
    const data = crypto.getRandomValues(new Uint8Array(16))
    const serialized = Uint8Encoder.toString(data)
    console.log("Serialized", serialized)
    const deserialized = Uint8Encoder.toArray(serialized)
    expect(deserialized).toEqual(data)
  })
})
