import { Uint8Encoder } from "../mqtt/cyphers/Uint8Encoder"
import { LOCAL_STORAGE_PREFIX } from "./useLocalStorage"

export class DeviceKeyManager {
  public static readonly ALGO = "RSA-OAEP"
  public static readonly HASH = "SHA-256"

  private static _keyPair: CryptoKeyPair | null = null
  private static _publicKeyJwk: JsonWebKey | null = null

  public static async getPrivateKey(): Promise<CryptoKey> {
    if (this._keyPair) {
      return this._keyPair.privateKey
    }

    this._keyPair = await this.load()
    if (!this._keyPair) {
      this._keyPair = await this.create()
      await this.save(this._keyPair)
    }

    return this._keyPair.privateKey
  }

  public static async getPublicKey(): Promise<CryptoKey> {
    if (this._keyPair) {
      return this._keyPair.publicKey
    }

    this._keyPair = await this.load()
    if (!this._keyPair) {
      this._keyPair = await this.create()
      await this.save(this._keyPair)
    }

    return this._keyPair.publicKey
  }

  public static async getPublicKeyJwk(): Promise<JsonWebKey> {
    const publicKey = await this.getPublicKey()

    // Assigned during `save()`
    if (this._publicKeyJwk) {
      return this._publicKeyJwk
    }

    // Fallback
    this._publicKeyJwk = await crypto.subtle.exportKey("jwk", publicKey)
    return this._publicKeyJwk
  }

  public static async wrapPublicKey(wrappingKey: CryptoKey): Promise<string> {
    const publicKey = await this.getPublicKey()
    const wrapped = await crypto.subtle.wrapKey("jwk", publicKey, wrappingKey, {
      name: this.ALGO,
    })

    const result = new Uint8Array(wrapped)
    return Uint8Encoder.toString(result)
  }

  private static async load(): Promise<CryptoKeyPair | null> {
    const storedPrivateKey = localStorage.getItem(
      LOCAL_STORAGE_PREFIX + "privateKey"
    )
    const storedPublicKey = localStorage.getItem(
      LOCAL_STORAGE_PREFIX + "publicKey"
    )

    // Try to import existing keys from storage
    if (!storedPrivateKey || !storedPublicKey) {
      return null
    }

    try {
      const privateKeyData = JSON.parse(storedPrivateKey)
      const publicKeyData = JSON.parse(storedPublicKey)

      // Import the private key for decryption
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        privateKeyData,
        { name: this.ALGO, hash: this.HASH },
        true,
        ["decrypt"]
      )

      // Import the public key for encryption
      const publicKey = await crypto.subtle.importKey(
        "jwk",
        publicKeyData,
        { name: this.ALGO, hash: this.HASH },
        true,
        ["encrypt", "wrapKey"]
      )

      return { privateKey, publicKey }
    } catch (error) {
      console.error("Failed to import stored keys--removing them.", error)
      // Clear invalid stored keys
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + "privateKey")
      localStorage.removeItem(LOCAL_STORAGE_PREFIX + "publicKey")
    }

    return null
  }

  private static async create() {
    // Generate new RSA-OAEP key pair (public for enc, private for dec)
    return crypto.subtle.generateKey(
      {
        name: this.ALGO,
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: this.HASH,
      },
      true, // extractable - allows exporting the keys
      ["encrypt", "decrypt", "wrapKey"]
    )
  }

  private static async save(keyPair: CryptoKeyPair) {
    // Export keys to JWK format for storage
    const privateKeyJwk = await crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    )
    const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey)
    this._publicKeyJwk = publicKeyJwk

    // Store the exported keys
    localStorage.setItem(
      LOCAL_STORAGE_PREFIX + "privateKey",
      JSON.stringify(privateKeyJwk)
    )
    localStorage.setItem(
      LOCAL_STORAGE_PREFIX + "publicKey",
      JSON.stringify(publicKeyJwk)
    )
  }
}
