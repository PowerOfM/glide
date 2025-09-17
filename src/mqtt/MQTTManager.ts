import { EncryptedMQTTClient } from "./EncryptedMQTTClient"
import { Emitter } from "strict-event-emitter"

type MQTTManagerEvents = {
  change: [EncryptedMQTTClient | null]
}

class MQTTManagerSingleton extends Emitter<MQTTManagerEvents> {
  private client: EncryptedMQTTClient | null = null

  public setClient(client: EncryptedMQTTClient | null) {
    this.client = client
    this.emit("change", client)
  }

  public getClient() {
    return this.client
  }

  public destroyClient() {
    this.removeAllListeners()
    if (this.client) {
      this.client.destroy()
      this.client = null
    }
  }
}

export const MQTTManager = new MQTTManagerSingleton()
