export const hash = async (data: string, alg = "SHA-1", outputRadix = 36) => {
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest(alg, encoded)

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashB64 = hashArray
    .map((byte) => byte.toString(outputRadix).padStart(2, "0"))
    .join("")

  return hashB64
}

export class TopicHasher {
  public static readonly PREFIX = "gl1d3"
  
  public static async discovery(topic: string) {
    return this.hash('discovery/' + topic)
  }
  
  public static async direct(deviceId: string) {
    return this.hash('direct/' + deviceId)
  }

  // TODO: make this not break at midnight
  private static async hash(topic: string) {
    const date = new Date()
    const dateStr =
      String(date.getFullYear()).slice(2) +
      String(date.getMonth()) +
      date.getDate()

    const hashed = await hash(topic + dateStr)
    return this.PREFIX + hashed
  }
}
