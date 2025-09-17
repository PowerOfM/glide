import { useCallback } from "react"
import { useLocation } from "wouter"
import { useAsync } from "../../helpers/useAsync"
import { IPairRequestMessage } from "../../mqtt/protocols/DiscoveryProtocol"
import { IStartMessage } from "../../mqtt/protocols/SignalingProtocol"
import { useMQTT } from "../../mqtt/useMQTT"
import { STUNClient } from "../../signaling/STUNClient"
import { useDirectTopic } from "./helpers/useDirectTopic"
import { useDiscoveryTopic } from "./helpers/useDiscoveryTopic"
import cl from "./DiscoverPage.module.css"
import { Badge } from "../../components/Badge"
import { Button } from "../../components/Button"
import { DeviceButton } from "./components/DeviceButton"

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

  const handlePairRequest = useCallback(
    (msg: IPairRequestMessage) => {
      navigate("/pair", { state: msg })
    },
    [navigate]
  )

  const handleSignalStart = useCallback(
    (msg: IStartMessage) => {
      navigate("/signal", { state: msg })
    },
    [navigate]
  )

  useDirectTopic(mqttConnected ? mqttClient : null, handleSignalStart)
  const [deviceList, deviceListError] = useDiscoveryTopic(
    ipResult ?? null,
    mqttConnected ? mqttClient : null,
    handlePairRequest
  )

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
        {deviceListError && (
          <p className="error">Discovery Error: {deviceListError.message}</p>
        )}
      </div>

      <div className={cl.peersList}>
        {deviceList.map((device) => (
          <DeviceButton key={device.id} device={device} onClick={console.log} />
        ))}
      </div>
    </div>
  )
}
