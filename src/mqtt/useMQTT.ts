import { useEffect, useState } from "react"
import mqttBrokers from "../assets/mqttBrokers.json"
import { Logger } from "../helpers/Logger"
import { useLocalStorage } from "../helpers/useLocalStorage"
import { EncryptedMQTTClient } from "./EncryptedMQTTClient"
import { MQTTManager } from "./MQTTManager"

const logger = new Logger("useMQTT")

export const useMQTT = (): [EncryptedMQTTClient, boolean, Error | null] => {
  const [mqttBrokerUrl] = useLocalStorage(
    "mqtt-broker",
    "wss://mqtt.ionx.ca:443/mqtt" || mqttBrokers[0]
  )
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Initialize client state from MQTTManager or create new
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    let isMounted = true
    setConnected(false)
    setError(null)

    logger.debug("Setting up MQTT client event listeners.")
    client.once("connect", () => {
      if (!isMounted) return
      setConnected(true)
      console.log("connected!")
    })
    client.once("disconnect", (reason) => {
      if (!isMounted) return
      setConnected(false)
      console.log("disconnected", reason)
    })

    const handleError = (err: Error) => {
      if (!isMounted) return
      console.log("error", err)
      setError(err)
    }
    const handleDecryptError = (topic: string, err: Error) => {
      if (!isMounted) return
      console.log("decryptError", topic, err)
    }

    client.on("error", handleError)
    client.on("decryptError", handleDecryptError)

    return () => {
      isMounted = false
      client.off("error", handleError)
      client.off("decryptError", handleDecryptError)
    }
  }, [client])

  return [client, connected, error]
}
