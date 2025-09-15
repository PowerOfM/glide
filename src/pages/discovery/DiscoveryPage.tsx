import { useEffect, useState } from "react"
import { useLocalStorage } from "../../helpers/useLocalStorage"
import { useAsync } from "../../helpers/useAsync"
import { STUNClient } from "../../signaling/STUNClient"
import mqttBrokers from "../../assets/mqttBrokers.json"
import { useMQTT } from "../../mqtt/useMQTT"
import { DeviceManager } from "../../helpers/DeviceManager"

export const DiscoveryPage = () => {
  const [ipResult, ipLoading] = useAsync(() => STUNClient.getIp())

  const [mqttBrokerUrl] = useLocalStorage("mqtt-broker", mqttBrokers[0])
  const [mqttClient, mqttConnected, mqttError] = useMQTT(mqttBrokerUrl)

  // useDirectProtocol
  useEffect(() => {
    if (!mqttConnected) return

    // Sub to direct topic
    console.log("SETTING UP DIRECT TOPIC")
    const directTopic = `direct_${DeviceManager.getDeviceId()}`
    mqttClient.subscribe(directTopic)
    mqttClient.on("data", (topic, message) => {
      if (topic !== directTopic) return
      console.log("direct-topic data", topic, message)
      // IF message = "start"
      // TODO: navigate to signaling { sessionId, partnerId, partnerPublicKey }
      //    there: sub to partner's direct topic and set cypher as public key 
    })
    // TODO: set cypher for direct channel to private key/block (no sending from self on direct channel)

    return () => {
      // TODO: cleanup
    }
  }, [mqttClient, mqttConnected])

  // useDiscoveryProtocol
  useEffect(() => {
    if (!ipResult || !mqttConnected) return

    console.log("SETTING UP DISCOVERY")
    const discoveryTopic = `discovery_${ipResult}`
    mqttClient
      .subscribe(discoveryTopic)
      .then(() =>
        mqttClient.send(
          discoveryTopic,
          JSON.stringify({
            type: "hello",
            id: DeviceManager.getDeviceId(),
            name: DeviceManager.getDeviceName(),
            deviceType: DeviceManager.getDeviceType(),
          })
        )
      )
      .catch(console.error)

    mqttClient.on("data", (topic, message) => {
      if (topic !== discoveryTopic) return
      console.log("discovery data", topic, message)
      // IF message = "hello",
      //  update device list
      //  send back "welcome"
      // IF message = "welcome" or "leave"
      //  update device list
      //
      // IF message = "pairRequest" AND target = me
      //  navigate to pairing { topic, partnerEncryptedKey }
    })

    return () => {
      // TODO: cleanup
    }
  }, [ipResult, mqttClient, mqttConnected])

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

  // useEffect(() => {
  //   if (ipLoading || roomId) return

  //   if (ipResult) {
  //     setRoomId(ipResult)
  //   } else {
  //     setRoomId((prev) => prev ?? crypto.randomUUID().slice(0, 8).toUpperCase())
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [ipResult, ipLoading])

  // if (client.error)
  //   return <div className="page">Error! {client.error?.message}</div>
  // if (client.state === "signaling")
  //   return <ConnectionPage message="Waiting for other device" />
  // if (client.state === "negotiating")
  //   return <ConnectionPage message="Negotiating secure connection" />

  // const clientLoading = client.state === "loading"
  // const handlePeerClick = (peer: ISignalingPeer) => {
  //   client.sendRequest(peer.id)
  // }

  return (
    <div className="page">
      <div className={cl.header}>
        <h1>
          {clientLoading ? "Establishing Connection..." : "Connect to a Device"}
        </h1>
        <Badge
          color={clientLoading ? "grey" : "pink"}
          onClick={() => setMQTTModalOpen(true)}
        >
          MQTT
        </Badge>
      </div>

      <div className={cl.inputs}>
        <Button className={cl.discovery} onClick={() => setRoomModalOpen(true)}>
          {ipLoading ? (
            "Loading..."
          ) : roomId === ipResult ? (
            "Local Network Discovery"
          ) : (
            <>
              Key: <span className={cl.roomId}>{roomId}</span>
            </>
          )}
        </Button>

        <Button className={cl.emoji} onClick={() => setEmojiModalOpen(true)}>
          {emoji}
        </Button>
      </div>

      <div className={cl.peersList}>
        {client.peers.map((peer) => (
          <SignalingPeerItem
            key={peer.id}
            peer={peer}
            clientId={client.id ?? ""}
            onClick={handlePeerClick}
          />
        ))}
      </div>
    </div>
  )
}
