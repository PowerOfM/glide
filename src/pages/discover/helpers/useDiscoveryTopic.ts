import { useEffect, useState } from "react"
import { DeviceManager } from "../../../helpers/DeviceManager"
import { Logger } from "../../../helpers/Logger"
import { EncryptedMQTTClient } from "../../../mqtt/EncryptedMQTTClient"
import { MQTTMessageParser } from "../../../mqtt/MQTTMessageParser"
import {
  HelloMessageSchema,
  IPairRequestMessage,
  LeaveMessageSchema,
  PairRequestMessageSchema,
  WelcomeMessageSchema,
  makeHelloMessage,
  makeWelcomeMessage,
} from "../../../mqtt/protocols/DiscoveryProtocol"
import { IDevice, useDeviceList } from "./useDeviceList"

const log = new Logger("DISCOVERY")

export const useDiscoveryTopic = (
  topic: string | null,
  mqttClient: EncryptedMQTTClient | null,
  onPairRequest: (msg: IPairRequestMessage) => void
): [IDevice[], Error | null] => {
  const [error, setError] = useState<Error | null>(null)
  const devices = useDeviceList()

  useEffect(() => {
    if (!topic || !mqttClient) return
    let isMounted = true

    const parser = new MQTTMessageParser([
      HelloMessageSchema,
      WelcomeMessageSchema,
      LeaveMessageSchema,
      PairRequestMessageSchema,
    ])

    log.debug("Setting up discovery over MQTT")
    const discoveryTopic = `discovery_${topic}`
    mqttClient
      .subscribe(discoveryTopic)
      .then(() => {
        if (!isMounted) return

        log.debug(`Subscribed to topic: ${discoveryTopic}`)
        mqttClient.send(discoveryTopic, makeHelloMessage())
      })
      .catch((error: Error) => {
        if (!isMounted) return

        log.error("Failed to subscribe to discovery topic:", error)
        setError(error)
      })

    const dataHandler = (topic: string, message: string) => {
      if (topic !== discoveryTopic || !isMounted) return

      const parsed = parser.parse(message)
      switch (parsed?.type) {
        case "hello":
          if (parsed.id === DeviceManager.getId()) break
          log.debug("Received HELLO message:", parsed)
          devices.add(parsed)
          mqttClient.send(discoveryTopic, makeWelcomeMessage())
          break

        case "welcome":
          log.debug("Received WELCOME message:", parsed)
          devices.add(parsed)
          break

        case "leave":
          log.debug("Received LEAVE message:", parsed)
          devices.remove(parsed.id)
          break

        case "pairRequest":
          log.debug("Received PAIR REQUEST message:", parsed)
          if (parsed.to === DeviceManager.getId()) {
            onPairRequest(parsed)
            // Navigate to pairing screen with parsed details
            log.debug(
              "Pair request is for this device, navigating to pairing screen."
            )
            // navigate(`/pairing/${parsed.sessionId}?partnerId=${parsed.partnerId}&partnerKey=${parsed.partnerEncryptedKey}`)
          }
          break
      }
    }
    mqttClient.on("data", dataHandler)

    return () => {
      isMounted = false
      mqttClient.off("data", dataHandler)
    }
  }, [topic, mqttClient, onPairRequest])

  return [devices.list, error]
}
