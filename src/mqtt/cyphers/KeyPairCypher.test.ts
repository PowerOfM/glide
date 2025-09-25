import { beforeEach, describe, expect, it } from "vitest"
import { DeviceKeyManager } from "../../helpers/DeviceKeyManager"
import { KeyPairCypher } from "./KeyPairCypher"

describe(KeyPairCypher.name, () => {
  let publicKey: CryptoKey | null = null
  let privateKey: CryptoKey | null = null

  beforeEach(async () => {
    // Generate a test key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: DeviceKeyManager.ALGO,
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: DeviceKeyManager.HASH,
      },
      true,
      ["encrypt", "decrypt"]
    )

    publicKey = keyPair.publicKey
    privateKey = keyPair.privateKey
  })

  describe("Encryption", () => {
    it("should encrypt and decrypt text correctly", async () => {
      const cypher = new KeyPairCypher(publicKey, null)

      const plainText = "Hello, World! This is a test message."
      const encrypted = await cypher.encrypt(plainText)
      const decrypted = await cypher.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
      expect(encrypted).not.toBe(plainText) // Ensure it's actually encrypted
    })

    it("should handle empty strings", async () => {
      const cypher = new KeyPairCypher(publicKey, null)

      const plainText = ""
      const encrypted = await cypher.encrypt(plainText)
      const decrypted = await cypher.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it("should handle special characters", async () => {
      const cypher = new KeyPairCypher(publicKey, null)

      const plainText = "🚀 Hello! 🌟 Testing special chars: ñáéíóú 中文 🎉"
      const encrypted = await cypher.encrypt(plainText)
      const decrypted = await cypher.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it("should handle long text", async () => {
      const cypher = new KeyPairCypher(publicKey, null)

      const plainText = "A".repeat(1000) // Long string
      const encrypted = await cypher.encrypt(plainText)
      const decrypted = await cypher.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it("should throw error when public key is null", async () => {
      const cypher = new KeyPairCypher(null, null)

      await expect(cypher.encrypt("test")).rejects.toThrow(
        "Public key is not set for encryption."
      )
    })
  })

  describe("Decryption", () => {
    it("should handle invalid encrypted data", async () => {
      const cypher = new KeyPairCypher(publicKey, privateKey)

      // This should fail with an invalid encrypted string
      await expect(cypher.decrypt("invalid-encrypted-data")).rejects.toThrow()
    })

    it("should throw error when private key is null", async () => {
      const cypher = new KeyPairCypher(publicKey, null)

      await expect(cypher.decrypt("dGVzdA==")).rejects.toThrow(
        "Private key is not set for decryption."
      )
    })
  })

  describe("Round-trip consistency", () => {
    it("should produce consistent results with same key pair", async () => {
      const cypher1 = new KeyPairCypher(publicKey, privateKey)
      const cypher2 = new KeyPairCypher(publicKey, privateKey)

      const plainText = "Consistency test"
      const encrypted1 = await cypher1.encrypt(plainText)
      const encrypted2 = await cypher2.encrypt(plainText)
      const decrypted1 = await cypher1.decrypt(encrypted1)
      const decrypted2 = await cypher2.decrypt(encrypted2)

      expect(decrypted1).toBe(plainText)
      expect(decrypted2).toBe(plainText)
      expect(encrypted1).toBe(encrypted2) // Same input should produce same output
    })
  })
})
