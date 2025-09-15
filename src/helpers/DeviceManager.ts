import { RandomGenerator } from "./RandomGenerator"
import { LOCAL_STORAGE_PREFIX } from "./useLocalStorage"

export abstract class DeviceManager {
  public static readonly DEVICE_ID_KEY = LOCAL_STORAGE_PREFIX + "deviceId"
  public static readonly DEVICE_NAME_KEY = LOCAL_STORAGE_PREFIX + "deviceName"

  private static _deviceId: string | null = null
  public static getDeviceId(): string {
    if (this._deviceId) {
      return this._deviceId
    }

    const fromStorage = localStorage.getItem(this.DEVICE_ID_KEY)
    if (fromStorage) {
      this._deviceId = fromStorage
      return fromStorage
    }

    const randValues = new Uint32Array(8)
    crypto.getRandomValues(randValues)
    const generated = Array.from(randValues, (dec) => dec.toString(36)).join("")
    localStorage.setItem(this.DEVICE_ID_KEY, generated)
    this._deviceId = generated
    return generated
  }
  
  private static _deviceName: string | null = null
  public static getDeviceName(): string {
    if (this._deviceName) {
      return this._deviceName
    }

    const fromStorage = localStorage.getItem(this.DEVICE_NAME_KEY)
    if (fromStorage) {
      this._deviceName = fromStorage
      return fromStorage
    }
    
    const defaultName = RandomGenerator.name()
    this._deviceName = defaultName
    return defaultName
  }
  
  public static getDeviceType(): "mobile" | "desktop" {
    const ua = navigator.userAgent
    if (/Mobi|Android/i.test(ua)) {
      return "mobile"
    }
    return "desktop"
  }
}
