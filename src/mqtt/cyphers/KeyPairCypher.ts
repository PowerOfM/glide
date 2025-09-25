import { DeviceKeyManager } from "../../helpers/DeviceKeyManager"
import { ICypher } from "./CypherTypes"
import { Uint8Encoder } from "./Uint8Encoder"

export class KeyPairCypher implements ICypher {
  constructor(
    private publicKey: CryptoKey | null,
    private privateKey: CryptoKey | null
  ) {}

  public async encrypt(plainText: string): Promise<string> {
    if (!this.publicKey) {
      throw new Error("Public key is not set for encryption.")
    }

    const encrypted = await crypto.subtle.encrypt(
      { name: DeviceKeyManager.ALGO },
      this.publicKey,
      new TextEncoder().encode(plainText)
    )

    const result = new Uint8Array(encrypted)
    return Uint8Encoder.toString(result)
  }

  public async decrypt(cypherText: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error("Private key is not set for decryption.")
    }

    const cypherArray = Uint8Encoder.toArray(cypherText)
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: DeviceKeyManager.ALGO },
      this.privateKey,
      cypherArray
    )

    return new TextDecoder().decode(new Uint8Array(decryptedBuffer))
  }
}
