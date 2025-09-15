import { useEffect, useState } from "react"
import { EncryptedMQTTClient } from "./EncryptedMQTTClient"
import { MQTTManager } from "./MQTTManager"
import { Logger } from "../helpers/Logger"

const logger = new Logger("useMQTT")

export const useMQTT = (
  mqttBrokerUrl: string
): [EncryptedMQTTClient, boolean, Error | null] => {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [client, setClient] = useState(() => {
    const existingClient = MQTTManager.getClient()
    if (existingClient) {
      return existingClient
    }

    logger.debug("Creating new MQTT client for broker:", mqttBrokerUrl)
    const client = new EncryptedMQTTClient(mqttBrokerUrl)
    MQTTManager.setClient(client)
    return client
  })

  // Sync state with MQTTManager
  useEffect(() => {
    const handler = (newClient: EncryptedMQTTClient | null) => {
      if (!newClient) {
        logger.debug("MQTT client destroyed but still in use, recreating...")
        MQTTManager.setClient(new EncryptedMQTTClient(mqttBrokerUrl))
      } else {
        setClient(newClient)
      }
    }
    MQTTManager.on("change", handler)
    return () => {
      MQTTManager.off("change", handler)
    }
  }, [])

  // Create client on mount and if broker URL changes
  useEffect(() => {
    const oldClient = MQTTManager.getClient()
    if (oldClient?.brokerUrl === mqttBrokerUrl) {
      // Same URL, do nothing
      return
    }

    if (oldClient) {
      logger.debug("Destroying old MQTT client pointing to different broker.")
      oldClient.destroy()
    }

    logger.debug("Creating new MQTT client for broker:", mqttBrokerUrl)
    const newClient = new EncryptedMQTTClient(mqttBrokerUrl)
    MQTTManager.setClient(newClient)
  }, [mqttBrokerUrl])

  // Listen to client events
  useEffect(() => {
    setConnected(false)
    setError(null)

    console.log("SETTING UP MQTT LISTENERS")
    client.once("connect", () => {
      setConnected(true)
      console.log("connected!")
    })
    client.once("disconnect", (reason) => {
      setConnected(false)
      console.log("disconnected", reason)
    })
    client.on("error", (error) => {
      console.log("error", error)
      setError(error)
    })
    client.on("decryptError", (topic, error) => {
      console.log("decryptError", topic, error)
    })

    return () => {
      // TODO: cleanup
    }
  }, [client])

  return [client, connected, error]
}
