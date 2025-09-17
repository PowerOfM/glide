import { describe, expect, it } from "vitest"
import { PasskeyCypher, 
} from "./PasskeyCypher"

describe(PasskeyCypher.name, () => {
  it("encrypts and decrypts", async () => {
    const passkey = "secret"

    const enc = await PasskeyCypher.build(passkey)
    const actual = "This is a test string"
    const cipher = await enc.encrypt(actual)

    const dec = await PasskeyCypher.build(passkey)
    const plaintext = await dec.decrypt(cipher)

    expect(plaintext).toBe(actual)
    console.log("Result: ", actual)
  })
})
