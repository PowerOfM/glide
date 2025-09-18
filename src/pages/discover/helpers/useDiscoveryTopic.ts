import { useEffect, useRef, useState } from "react"
import { Logger } from "../../../helpers/Logger"
import { useAsyncEffect } from "../../../helpers/useAsync"
import { EncryptedMQTTClient } from "../../../mqtt/EncryptedMQTTClient"
import { MQTTMessageParser } from "../../../mqtt/MQTTMessageParser"
import { TopicHasher } from "../../../mqtt/TopicHasher"
import {
  HelloMessageSchema,
  IHelloMessage,
  IPairRequestMessage,
  makeHelloMessage,
} from "../../../mqtt/protocols/DiscoveryProtocol"

const log = new Logger("DISCOVERY")

export const useDiscoveryTopic = (
  topicValue: string | null,
  mqttClient: EncryptedMQTTClient,
  onDevice: (device: IHelloMessage) => void,
  onPairRequest: (msg: IPairRequestMessage) => void
): Error | null => {
  const [broadcasting, setBroadcasting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const topicRef = useRef("")

  useAsyncEffect(
    async (mountedRef) => {
      if (!topicValue) return

      await mqttClient.waitForConnect()
      if (!mountedRef.current) return

      const topic = await TopicHasher.discovery(topicValue)
      topicRef.current = topic

      await mqttClient.subscribe(topic)
      mqttClient.send(topic, makeHelloMessage())
      log.debug(`Broadcasting on topic: ${topic}`)

      const parser = new MQTTMessageParser([HelloMessageSchema])
      const dataHandler = (topic: string, message: string) => {
        if (topic !== topicRef.current || !mountedRef.current || !message) {
          return
        }

        const parsed = parser.parse(message)
        if (parsed) {
          log.debug("Received device hello:", parsed)
          onDevice(parsed)
        }
      }

      mqttClient.on("data", dataHandler)
      setBroadcasting(true)

      return () => {
        mqttClient.off("data", dataHandler)
        if (topicRef.current) {
          mqttClient.unsubscribe(topicRef.current)
        }
      }
    },
    setError,
    [topicValue, mqttClient, onPairRequest]
  )

  useEffect(() => {
    if (!broadcasting) return

    const interval = setInterval(() => {
      const topic = topicRef.current
      if (mqttClient && topic) {
        mqttClient.send(topic, makeHelloMessage())
      }
    }, 2500)

    const timeout = setTimeout(() => {
      setBroadcasting(false)
    }, 30000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcasting])

  return error
}
