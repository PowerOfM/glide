export interface ICypher {
  encrypt(plainText: string): Promise<string>
  decrypt(cyperText: string): Promise<string>
}
