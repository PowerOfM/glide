import { useEffect, useState } from "react"
import { IHelloMessage } from "../../../mqtt/protocols/DiscoveryProtocol"
import { DeviceManager } from "../../../helpers/DeviceManager"

export type IDevice = Omit<IHelloMessage, "type"> & {
  sessionId?: string
  lastSeen: number
}

export const useDeviceList = () => {
  const [list, setList] = useState<IDevice[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setList((prev) => {
        if (prev.length === 1) return prev

        return prev.filter(
          (d) =>
            d.id === DeviceManager.getId() || Date.now() - d.lastSeen < 15000
        )
      })
    }, 7000) // every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return {
    list,
    update: (device: Omit<IDevice, "lastSeen">) =>
      setList((prev) => {
        const exists = prev.find((d) => d.id === device.id)
        if (exists) {
          return prev.map((d) =>
            d.id === device.id ? { ...device, lastSeen: Date.now() } : d
          )
        }
        return [...prev, { ...device, lastSeen: Date.now() }]
      }),
    remove: (sessionId: string) =>
      setList((prev) => prev.filter((d) => d.sessionId !== sessionId)),
    clear: () => setList([]),
  }
}
