import { useLocation } from "wouter"
import { useHistoryState } from "wouter/use-browser-location"
import { DeviceKeyManager } from "../../helpers/DeviceKeyManager"
import { DeviceManager } from "../../helpers/DeviceManager"
import { useAsync, useAsyncEffect } from "../../helpers/useAsync"
import { KeyPairCypher } from "../../mqtt/cypers/KeyPairCypher"
import { PasskeyCypher } from "../../mqtt/cypers/PasskeyCypher"
import { MQTTMessageParser } from "../../mqtt/MQTTMessageParser"
import { makePairRequestMessage } from "../../mqtt/protocols/DiscoveryProtocol"
import { StartMessageSchema } from "../../mqtt/protocols/SignalingProtocol"
import { TopicHasher } from "../../mqtt/TopicHasher"
import { useMQTT } from "../../mqtt/useMQTT"

export const PairRequestPage = () => {
  const [, navigate] = useLocation()
  const state = useHistoryState<{
    id: string
    name: string
  }>()

  const [mqttClient, mqttConnected, mqttError] = useMQTT()

  // Join own direct topic to listen for responses
  useAsyncEffect(
    async (mountedRef) => {
      if (!mqttConnected || !state) return

      const privateKey = await DeviceKeyManager.getPrivateKey()
      const selfCypher = new KeyPairCypher(null, privateKey)
      const selfTopic = await TopicHasher.direct(DeviceManager.getId())
      await mqttClient.subscribe(selfTopic)
      mqttClient.setTopicCypher(selfTopic, selfCypher)

      const parser = new MQTTMessageParser([StartMessageSchema])
      const handleData = async (topic: string, payload: string) => {
        if (!mountedRef.current || topic !== selfTopic) return

        const parsed = parser.parse(payload)
        if (parsed) {
          navigate("/signal", { state: parsed })
        }
      }

      mqttClient.on("data", handleData)

      return () => {
        mqttClient.off("data", handleData)
      }
    },
    console.error,
    [mqttClient, mqttConnected]
  )

  // Create code and send pair request
  const [code, loading, error] = useAsync(async () => {
    if (!state) {
      console.log("No state found, navigating back to home.")
      navigate("/")
    }

    await mqttClient.waitForConnect()

    // Create join code (TOTP)
    // TODO: figure out TOTP generation (or emoji)
    const totp = "test"
    const totpCypher = await PasskeyCypher.build(totp)

    // Encrypt public key with TOTP
    const publicJWK = await DeviceKeyManager.getPublicKeyJwk()
    const encryptedPublicKey = await totpCypher.encrypt(
      JSON.stringify(publicJWK)
    )

    // Send Start-Pair message
    const partnerTopic = await TopicHasher.direct(state.id)
    await mqttClient.subscribe(partnerTopic)
    await mqttClient.send(
      partnerTopic,
      makePairRequestMessage(encryptedPublicKey)
    )

    return totp
  })

  return (
    <div className="page">
      {mqttError && "MQTT Error: " + mqttError.message}
      {loading ? "loading..." : error ? "Error: " + error.message : code}
    </div>
  )
}
