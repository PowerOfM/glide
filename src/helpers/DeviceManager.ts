import { RandomGenerator } from "./RandomGenerator"
import { LOCAL_STORAGE_PREFIX } from "./useLocalStorage"

export enum DeviceType {
  mobile,
  desktop,
}

export abstract class DeviceManager {
  public static readonly ID_KEY = LOCAL_STORAGE_PREFIX + "deviceId"
  public static readonly NAME_KEY = LOCAL_STORAGE_PREFIX + "deviceName"

  private static _id: string | null = null
  public static getId(): string {
    if (this._id) {
      return this._id
    }

    const fromStorage = localStorage.getItem(this.ID_KEY)
    if (fromStorage) {
      this._id = fromStorage
      return fromStorage
    }

    const randValues = new Uint32Array(8)
    crypto.getRandomValues(randValues)
    const generated = Array.from(randValues, (dec) => dec.toString(36)).join("")
    localStorage.setItem(this.ID_KEY, generated)
    this._id = generated
    return generated
  }

  private static _name: string | null = null
  public static getName(): string {
    if (this._name) {
      return this._name
    }

    const fromStorage = localStorage.getItem(this.NAME_KEY)
    if (fromStorage) {
      this._name = fromStorage
      return fromStorage
    }

    const defaultName = RandomGenerator.name()
    this._name = defaultName
    return defaultName
  }

  public static getType(): DeviceType {
    const ua = navigator.userAgent
    if (/Mobi|Android/i.test(ua)) {
      return DeviceType.mobile
    }
    return DeviceType.desktop
  }

  // /**
  //  * Export the public key as a string that can be shared with other clients
  //  * @returns Base64 encoded public key in JWK format
  //  */
  // public static async exportPublicKey(): Promise<string> {
  //   const keyPair = await this.getKeyPair()
  //   const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey)
  //   // Convert to base64 string for easy transmission
  //   return btoa(JSON.stringify(publicKeyJwk))
  // }

  // /**
  //  * Import a partner's public key from a base64 encoded string
  //  * @param encodedPublicKey Base64 encoded public key in JWK format
  //  * @returns CryptoKey that can be used for encryption
  //  */
  // public static async importPartnerPublicKey(
  //   encodedPublicKey: string
  // ): Promise<CryptoKey> {
  //   try {
  //     const publicKeyJwk = JSON.parse(atob(encodedPublicKey))
  //     return await crypto.subtle.importKey(
  //       "jwk",
  //       publicKeyJwk,
  //       {
  //         name: "RSA-OAEP",
  //         hash: "SHA-256",
  //       },
  //       true,
  //       ["encrypt"]
  //     )
  //   } catch (error) {
  //     throw new Error(`Failed to import partner's public key: ${error}`)
  //   }
  // }

  // /**
  //  * Encrypt a message using the partner's public key
  //  * @param message The message to encrypt
  //  * @param partnerPublicKey The partner's public key (obtained via importPartnerPublicKey)
  //  * @returns Base64 encoded encrypted message
  //  */
  // public static async encryptMessage(
  //   message: string,
  //   partnerPublicKey: CryptoKey
  // ): Promise<string> {
  //   const encoder = new TextEncoder()
  //   const data = encoder.encode(message)

  //   const encrypted = await crypto.subtle.encrypt(
  //     {
  //       name: "RSA-OAEP",
  //     },
  //     partnerPublicKey,
  //     data
  //   )

  //   // Convert ArrayBuffer to base64 string
  //   return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  // }

  // /**
  //  * Decrypt a message using your own private key
  //  * @param encryptedMessage Base64 encoded encrypted message
  //  * @returns The decrypted message
  //  */
  // public static async decryptMessage(
  //   encryptedMessage: string
  // ): Promise<string> {
  //   const keyPair = await this.getKeyPair()

  //   // Convert base64 to ArrayBuffer
  //   const binaryString = atob(encryptedMessage)
  //   const bytes = new Uint8Array(binaryString.length)
  //   for (let i = 0; i < binaryString.length; i++) {
  //     bytes[i] = binaryString.charCodeAt(i)
  //   }

  //   const decrypted = await crypto.subtle.decrypt(
  //     {
  //       name: "RSA-OAEP",
  //     },
  //     keyPair.privateKey,
  //     bytes
  //   )

  //   const decoder = new TextDecoder()
  //   return decoder.decode(decrypted)
  // }

  // /**
  //  * Encrypt the public key with a custom token before sending over MQTT
  //  * This adds an extra layer of security for the key exchange
  //  * @param token Custom token for encrypting the public key
  //  * @returns Encrypted public key string
  //  */
  // public static async getEncryptedPublicKey(token: string): Promise<string> {
  //   const publicKey = await this.exportPublicKey()

  //   // Simple XOR encryption with the token for the key exchange
  //   // You might want to use a more sophisticated method
  //   const encoder = new TextEncoder()
  //   const tokenBytes = encoder.encode(token)
  //   const keyBytes = encoder.encode(publicKey)

  //   const encrypted = new Uint8Array(keyBytes.length)
  //   for (let i = 0; i < keyBytes.length; i++) {
  //     encrypted[i] = keyBytes[i] ^ tokenBytes[i % tokenBytes.length]
  //   }

  //   return btoa(String.fromCharCode(...encrypted))
  // }

  // /**
  //  * Decrypt a public key that was encrypted with a custom token
  //  * @param encryptedKey The encrypted public key string
  //  * @param token The custom token used for encryption
  //  * @returns The partner's public key as a CryptoKey
  //  */
  // public static async decryptPublicKey(
  //   encryptedKey: string,
  //   token: string
  // ): Promise<CryptoKey> {
  //   // Decode from base64
  //   const binaryString = atob(encryptedKey)
  //   const encrypted = new Uint8Array(binaryString.length)
  //   for (let i = 0; i < binaryString.length; i++) {
  //     encrypted[i] = binaryString.charCodeAt(i)
  //   }

  //   // XOR decrypt with the token
  //   const encoder = new TextEncoder()
  //   const tokenBytes = encoder.encode(token)

  //   const decrypted = new Uint8Array(encrypted.length)
  //   for (let i = 0; i < encrypted.length; i++) {
  //     decrypted[i] = encrypted[i] ^ tokenBytes[i % tokenBytes.length]
  //   }

  //   const decoder = new TextDecoder()
  //   const publicKeyString = decoder.decode(decrypted)

  //   // Import the decrypted public key
  //   return await this.importPartnerPublicKey(publicKeyString)
  // }
}
