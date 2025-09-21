import { useCallback } from "react"
import { useLocation } from "wouter"
import { Badge } from "../../components/Badge"
import { Button } from "../../components/Button"
import { useAsync } from "../../helpers/useAsync"
import {
  IHelloMessage,
  IPairRequestMessage,
} from "../../mqtt/protocols/DiscoveryProtocol"
import { IStartMessage } from "../../mqtt/protocols/SignalingProtocol"
import { useMQTT } from "../../mqtt/useMQTT"
import { STUNClient } from "../../signaling/STUNClient"
import cl from "./DiscoverPage.module.css"
import { DeviceButton } from "./components/DeviceButton"
import { useDeviceList } from "./helpers/useDeviceList"
import { useDirectTopic } from "./helpers/useDirectTopic"
import { useDiscoveryTopic } from "./helpers/useDiscoveryTopic"

/**
 * Start:
 * - Fetch IP
 * - Connect to MQTT
 *
 * When MQTT connects:
 * - Join private topic
 *
 * When IP resolves:
 * - Join discovery topic
 * - Start discovery protocol
 *
 * Private Topic: When Start message received:
 * - Navigate to Signaling
 */

export const DiscoverPage = () => {
  const [, navigate] = useLocation()
  const [ipResult, ipLoading] = useAsync(() => STUNClient.getIp())
  const [mqttClient, mqttConnected, mqttError] = useMQTT()
  const devices = useDeviceList()

  const handleDeviceFound = useCallback(
    (device: IHelloMessage) => devices.update(device),
    [devices]
  )

  const handlePairRequest = useCallback(
    (msg: IPairRequestMessage) => navigate("/pair-response", { state: msg }),
    [navigate]
  )

  const handleSignalStart = useCallback(
    (msg: IStartMessage) => navigate("/signal", { state: msg }),
    [navigate]
  )

  const discoveryError = useDiscoveryTopic(
    ipResult ?? null,
    mqttClient,
    handleDeviceFound
  )
  const directError = useDirectTopic(
    mqttClient,
    handleSignalStart,
    handlePairRequest
  )

  const handleDeviceClick = (device: { id: string; name: string }) => {
    if (!mqttClient) return
    navigate("/pair-request", { state: device })
  }

  return (
    <div className="page">
      <div className={cl.header}>
        <h1>
          {!mqttConnected
            ? "Establishing Connection..."
            : "Connect to a Device"}
        </h1>
        <Badge
          color={!mqttConnected ? "grey" : "pink"}
          // onClick={() => setMQTTModalOpen(true)}
        >
          MQTT
        </Badge>
      </div>

      <div className={cl.inputs}>
        <Button
          className={cl.discovery}
          // onClick={() => setRoomModalOpen(true)}
        >
          {ipLoading ? (
            "Loading..."
          ) : ipResult ? (
            "Local Network Discovery"
          ) : (
            <>
              Key: <span className={cl.roomId}>{ipResult}</span>
            </>
          )}
        </Button>

        {/*<Button className={cl.emoji} onClick={() => setEmojiModalOpen(true)}>
          {emoji}
        </Button>*/}
      </div>

      <div>
        {mqttError && <p className="error">MQTT Error: {mqttError.message}</p>}
        {discoveryError && (
          <p className="error">Discovery Error: {discoveryError.message}</p>
        )}
        {directError && (
          <p className="error">Direct Error: {directError.message}</p>
        )}
      </div>

      <div className={cl.peersList}>
        {devices.list.map((device) => (
          <DeviceButton
            key={device.id}
            device={device}
            onClick={handleDeviceClick}
          />
        ))}
      </div>
    </div>
  )
}
