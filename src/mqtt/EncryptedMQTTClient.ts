import mqtt from "mqtt"
import { Emitter } from "strict-event-emitter"
import { PasskeyCypher } from "./cypers/PasskeyCypher"
import { Logger } from "../helpers/Logger"
import { ICypher } from "./cypers/CypherTypes"

const VERBOSE = false

// LOCAL: ws://localhost:8883

// TODO: move out of this file
// import mqttBrokers from "../assets/mqttBrokers.json"
// export const MQTT_BROKER_STORAGE_KEY = "mqtt-broker"
// export const DEFAULT_MQTT_BROKER = localStorage.getItem(MQTT_BROKER_STORAGE_KEY) || mqttBrokers[0]

// const ID_STORAGE_KEY = "mqtt-client-id"
// const ID_TIMESTAMP_KEY = "mqtt-client-id-timestamp"
// const ID_EXPIRY_MS = 24 * 60 * 1000

export enum MQTTClientStatus {
  disconnected,
  connecting,
  open,
  error,
}

type Topic = string

type EncryptedMQTTClientEvents = {
  connect: []
  disconnect: [number | undefined]
  data: [Topic, string]
  decryptError: [Topic, Error]
  error: [Error]
}

/**
 * MQTT client that uses a basic passkey to encrypt messages.
 */
export class EncryptedMQTTClient extends Emitter<EncryptedMQTTClientEvents> {
  private readonly logger = new Logger("MQTT")
  private readonly client: mqtt.MqttClient

  private readonly topicCyphers: Record<Topic, ICypher> = {}

  private _status: MQTTClientStatus = MQTTClientStatus.connecting
  public get status() {
    return this._status
  }

  public static async build(brokerUrl: string) {
    const client = new EncryptedMQTTClient(brokerUrl)
    await client.waitForConnect()
    return client
  }

  constructor(public readonly brokerUrl: string) {
    super()

    this.logger.debug("Connecting to broker", brokerUrl)
    this.client = mqtt.connect(brokerUrl)
    this.client.on("message", (topic, payload) => {
      this.handleMessage(topic, payload.toString())
    })
    this.client.on("error", (error) => {
      this._status = MQTTClientStatus.error
      this.emit("error", error)
    })
    this.client.on("disconnect", (value) => {
      this._status = MQTTClientStatus.disconnected
      this.emit("disconnect", value.reasonCode)
    })
    this.client.on("connect", () => {
      this._status = MQTTClientStatus.open
      this.emit("connect")
      this.logger.debug("Connected!")
    })
  }

  public async waitForConnect() {
    if (this._status === MQTTClientStatus.open) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      this.once("error", reject)
      this.once("connect", () => {
        this.off("error", reject)
        resolve()
      })
    })
  }

  public async destroy() {
    this._status = MQTTClientStatus.disconnected
    this.removeAllListeners()
    await this.client.endAsync()
  }

  public async subscribe(topic: string | string[]) {
    const topicStr = this.normalizeTopic(topic)
    const topicRoot = topicStr.split("/")[0]
    this.topicCyphers[topicRoot] = await PasskeyCypher.build(topicStr)

    this.logger.debug("Subscribing to", topicStr)
    await this.client.subscribeAsync(topicStr)
  }

  public async unsubscribe(topic: string | string[]) {
    const topicStr = this.normalizeTopic(topic)
    const topicRoot = topicStr.split("/")[0]
    delete this.topicCyphers[topicRoot]
    return this.client.unsubscribeAsync(topicStr)
  }
  public async setTopicCypher(topic: string | string[], cypher: ICypher) {
    const topicStr = this.normalizeTopic(topic)
    const topicRoot = topicStr.split("/")[0]
    this.topicCyphers[topicRoot] = cypher
  }

  public async send(topic: string | string[], data: string | object) {
    const topicStr = this.normalizeTopic(topic)
    const topicRoot = topicStr.split("/")[0]
    const cypher = this.topicCyphers[topicRoot]
    if (!cypher) {
      throw new Error(`Client not subscribed to the topic ${topic}`)
    }

    if (typeof data !== "string") {
      data = JSON.stringify(data)
    }
    const payload = await cypher.encrypt(data)
    if (VERBOSE) this.logger.debug("Sending", { topic: topicStr, payload })

    return this.client.publishAsync(topicStr, payload, { retain: true })
  }

  private async handleMessage(topic: string, payload: string) {
    if (VERBOSE) this.logger.debug("Received", { topic, payload })

    const topicRoot = topic.split("/")[0]
    const cypher = this.topicCyphers[topicRoot]
    if (!cypher) {
      this.logger.warn(
        "Received message for unknown topic. Unsubscribing...",
        topic
      )

      await this.unsubscribe(topic)
      return
    }

    if (!payload) {
      this.emit("data", topic, "")
      return
    }

    try {
      const data = await cypher.decrypt(payload)
      this.emit("data", topic, data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.emit("decryptError", topic, error)
      this.logger.error("Error decrypting message", error)
    }
  }

  private normalizeTopic(topic: string | string[]): string {
    return typeof topic === "string" ? topic : topic.join("/")
  }
}
