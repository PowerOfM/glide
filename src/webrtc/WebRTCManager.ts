import { Emitter } from "strict-event-emitter"

export interface IPeerConnection {
  connection: RTCPeerConnection
  isInitiator: boolean
}

type WebRTCManagerEvents = {
  change: [IPeerConnection | null]
}

class WebRTCManagerSingleton extends Emitter<WebRTCManagerEvents> {
  private connection: IPeerConnection | null = null

  public setConnection(connection: IPeerConnection | null) {
    this.connection = connection
    this.emit("change", connection)
  }

  public getConnection() {
    return this.connection
  }

  public destroyConnection() {
    this.removeAllListeners()
    if (this.connection) {
      this.connection.connection.close()
      this.connection = null
    }
  }
}

export const WebRTCManager = new WebRTCManagerSingleton()
