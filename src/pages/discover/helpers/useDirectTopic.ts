import { useState } from "react"
import { DeviceManager } from "../../../helpers/DeviceManager"
import { Logger } from "../../../helpers/Logger"
import { useAsyncEffect } from "../../../helpers/useAsync"
import { EncryptedMQTTClient } from "../../../mqtt/EncryptedMQTTClient"
import { MQTTMessageParser } from "../../../mqtt/MQTTMessageParser"
import { TopicHasher } from "../../../mqtt/TopicHasher"
import {
  IPairRequestMessage,
  PairRequestMessageSchema,
} from "../../../mqtt/protocols/DiscoveryProtocol"
import {
  IStartMessage,
  StartMessageSchema,
} from "../../../mqtt/protocols/SignalingProtocol"

const log = new Logger("DIRECT")

export const useDirectTopic = (
  mqttClient: EncryptedMQTTClient,
  onStart: (msg: IStartMessage) => void,
  onPairRequest: (msg: IPairRequestMessage) => void
) => {
  const [error, setError] = useState<Error | null>(null)

  useAsyncEffect(
    async (mountedRef) => {
      await mqttClient.waitForConnect()
      if (!mountedRef.current) return

      const parser = new MQTTMessageParser([
        StartMessageSchema,
        PairRequestMessageSchema,
      ])
      const directTopic = await TopicHasher.direct(DeviceManager.getId())

      mqttClient.subscribe(directTopic)
      log.debug("Subscribed to direct topic", directTopic)

      const dataHandler = (topic: string, message: string) => {
        if (topic !== directTopic || !mountedRef.current || !message) {
          return
        }

        const parsed = parser.parse(message)
        if (!parsed) {
          return
        }

        if (parsed.type === "start") {
          log.debug("Received start message", parsed)
          onStart(parsed)
        } else if (parsed.type === "pairRequest") {
          log.debug("Received pair request message", parsed)
          onPairRequest(parsed)
        }
        mqttClient.send(topic, "")
      }

      mqttClient.on("data", dataHandler)

      return () => {
        mqttClient.off("data", dataHandler)
        mqttClient.unsubscribe(directTopic)
      }
    },
    setError,
    [mqttClient, onStart]
  )

  return error
}
