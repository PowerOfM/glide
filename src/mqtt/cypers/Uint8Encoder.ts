export class Uint8Encoder {
  public static toString(array: Uint8Array) {
    const output: string[] = []
    const len = array.length
    for (let i = 0; i < len; i++) {
      output.push(String.fromCharCode(array[i]))
    }

    return btoa(output.join(""))
  }

  public static toArray(chars: string) {
    return Uint8Array.from(atob(chars), (c) => c.charCodeAt(0))
  }
}
