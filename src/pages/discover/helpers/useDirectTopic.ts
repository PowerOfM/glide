import { DeviceManager } from "../../../helpers/DeviceManager"
import { Logger } from "../../../helpers/Logger"
import { EncryptedMQTTClient } from "../../../mqtt/EncryptedMQTTClient"
import { useEffect } from "react"
import {
  IStartMessage,
  StartMessageSchema,
} from "../../../mqtt/protocols/SignalingProtocol"
import { MQTTMessageParser } from "../../../mqtt/MQTTMessageParser"

const log = new Logger("DIRECT")

export const useDirectTopic = (
  mqttClient: EncryptedMQTTClient | null,
  onStart: (msg: IStartMessage) => void
) =>
  useEffect(() => {
    if (!mqttClient) return
    let isMounted = true

    const parser = new MQTTMessageParser([StartMessageSchema])

    log.debug("Setting up direct protocol over MQTT")
    const directTopic = `direct_${DeviceManager.getId()}`
    mqttClient.subscribe(directTopic)

    const dataHandler = (topic: string, message: string) => {
      if (topic !== directTopic || !isMounted) return

      const parsed = parser.parse(message)
      if (parsed) {
        onStart(parsed)
      }
    }

    mqttClient.on("data", dataHandler)
    // TODO: set cypher for direct channel to private key/block (no sending from self on direct channel)

    return () => {
      isMounted = false
    }
  }, [mqttClient, onStart])
