import { useState } from "react"
import {
  IHelloMessage,
  makeHelloMessage,
} from "../../../mqtt/protocols/DiscoveryProtocol"

export type IDevice = Omit<IHelloMessage, "type"> & {
  lastSeen: number
}

export const useDeviceList = () => {
  const [list, setList] = useState<IDevice[]>(() => [
    { ...makeHelloMessage(), lastSeen: Date.now() },
  ])

  return {
    list,
    add: (device: Omit<IDevice, "lastSeen">) =>
      setList((prev) => {
        const exists = prev.find((d) => d.id === device.id)
        if (exists) {
          return prev.map((d) =>
            d.id === device.id ? { ...d, lastSeen: Date.now() } : d
          )
        }
        return [...prev, { ...device, lastSeen: Date.now() }]
      }),
    remove: (id: string) => setList((prev) => prev.filter((d) => d.id !== id)),
    clear: () => setList([]),
  }
}
