import mqtt from "mqtt"
import { Emitter } from "strict-event-emitter"
import { PasskeyCypher } from "./PasskeyCypher"
import { hash } from "./hash"
import { Logger } from "../helpers/Logger"

const VERBOSE = false
const TOPIC_PREFIX = "GSP"

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

type EncodedTopic = string
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

  private readonly encodedTopicMap: Record<EncodedTopic, Topic> = {}
  private readonly topicCyphers: Record<EncodedTopic, PasskeyCypher> = {}

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

  public async subscribe(topic: string) {
    const encodedTopic = await this.encodeTopic(topic)

    this.encodedTopicMap[encodedTopic] = topic
    this.topicCyphers[encodedTopic] = await PasskeyCypher.build(encodedTopic)

    await this.client.subscribeAsync(encodedTopic)
  }

  public async unsubscribe(topic: string) {
    const encodedTopic = await this.encodeTopic(topic)
    return this.client.unsubscribeAsync(encodedTopic)
    delete this.topicCyphers[encodedTopic]
    delete this.encodedTopicMap[encodedTopic]
  }

  public async destroy() {
    this._status = MQTTClientStatus.disconnected
    this.removeAllListeners()
    await this.client.endAsync()
  }

  // TODO: allow caller to register cypher for a specific topic
  // then use it for pub-key comms

  public async send(topic: string, data: string) {
    const encodedTopic = await this.encodeTopic(topic)
    const cypher = this.topicCyphers[encodedTopic]
    if (!cypher) {
      throw new Error(`Client not subscribed to the topic ${topic}`)
    }

    const payload = await cypher.encrypt(data)
    if (VERBOSE) this.logger.debug("Sending", { encodedTopic, payload })

    return this.client.publishAsync(encodedTopic, payload)
  }

  private async handleMessage(encodedTopic: string, payload: string) {
    if (VERBOSE) this.logger.debug("Received", { encodedTopic, payload })

    const cypher = this.topicCyphers[encodedTopic]
    const topic = this.encodedTopicMap[encodedTopic]
    if (!cypher || !topic) {
      this.logger.warn(
        "Received message for unknown topic. Unsubscribing...",
        encodedTopic
      )
      await this.client.unsubscribeAsync(encodedTopic)
      delete this.topicCyphers[encodedTopic]
      delete this.encodedTopicMap[encodedTopic]
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

  // private createId() {
  //   const now = Date.now()
  //   const storedId = localStorage.getItem(ID_STORAGE_KEY)
  //   const expiry = now - Number(localStorage.getItem(ID_TIMESTAMP_KEY))

  //   if (storedId && expiry < ID_EXPIRY_MS) {
  //     return storedId
  //   }

  //   const newId = crypto.randomUUID().replace(/-/g, "")
  //   localStorage.setItem(ID_STORAGE_KEY, newId)
  //   localStorage.setItem(ID_TIMESTAMP_KEY, now.toString())
  //   return newId
  // }

  // TODO: make this not break at midnight
  public async encodeTopic(topic: string): Promise<EncodedTopic> {
    const date = new Date()
    const dateStr =
      String(date.getFullYear()).slice(2) +
      String(date.getMonth()) +
      date.getDate()

    const hashed = await hash(topic + dateStr)
    return TOPIC_PREFIX + hashed
  }
}
