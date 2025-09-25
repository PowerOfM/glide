import { useEffect, useState } from "react"
import { useLocation } from "wouter"
import { useHistoryState } from "wouter/use-browser-location"
import { Button } from "../../components/Button"
import { DeviceKeyManager } from "../../helpers/DeviceKeyManager"
import { DeviceManager } from "../../helpers/DeviceManager"
import { KeyPairCypher } from "../../mqtt/cyphers/KeyPairCypher"
import { PasskeyCypher } from "../../mqtt/cyphers/PasskeyCypher"
import { IPairRequestMessage } from "../../mqtt/protocols/DiscoveryProtocol"
import { makeStartMessage } from "../../mqtt/protocols/SignalingProtocol"
import { hash, TopicHasher } from "../../mqtt/TopicHasher"
import { useMQTT } from "../../mqtt/useMQTT"

export const PairResponsePage = () => {
  const [, navigate] = useLocation()
  const state = useHistoryState<IPairRequestMessage>()
  const [mqttClient, , mqttError] = useMQTT()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Navigate back if no state
  useEffect(() => {
    if (!state) {
      console.log("No pairing request found, navigating back to discover.")
      navigate("/")
    }
  }, [state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !state) return

    setLoading(true)
    setError(null)

    try {
      // Wait for MQTT connection
      await mqttClient.waitForConnect()

      // Create cypher with the entered code
      const codeCypher = await PasskeyCypher.build(code)

      // Decrypt partner's public key
      let partnerPublicKeyJwk: JsonWebKey
      try {
        const decryptedKey = await codeCypher.decrypt(state.key)
        const keyHash = await hash(decryptedKey)
        console.log("PARTNER KEY HASH", { keyHash })
        partnerPublicKeyJwk = JSON.parse(decryptedKey)
      } catch (err) {
        setError("Invalid code. Please try again.")
        setLoading(false)
        return
      }

      console.log("Decrypted partner's public key", partnerPublicKeyJwk)

      // Import partner's public key
      const partnerPublicKey = await crypto.subtle.importKey(
        "jwk",
        partnerPublicKeyJwk,
        { name: DeviceKeyManager.ALGO, hash: DeviceKeyManager.HASH },
        true,
        ["encrypt", "wrapKey"]
      )

      // Get our public key and encrypt it with partner's public key
      const ourPublicKeyJwk = await DeviceKeyManager.wrapPublicKey(
        partnerPublicKey
      )

      const partnerId = state.src
      const sessionId = crypto.randomUUID().replace(/-/g, "")

      // Send Start message to partner's direct topic
      const partnerTopic = await TopicHasher.direct(partnerId)
      const partnerCypher = new KeyPairCypher(partnerPublicKey, null)
      mqttClient.setTopicCypher(partnerTopic, partnerCypher)
      await mqttClient.subscribe(partnerTopic)
      await mqttClient.send(
        partnerTopic,
        makeStartMessage(sessionId, DeviceManager.getId(), ourPublicKeyJwk)
      )

      // Save partner's public key to localStorage for future use
      const partnerKeyId = `partner_${partnerId}_publicKey`
      localStorage.setItem(partnerKeyId, JSON.stringify(partnerPublicKeyJwk))

      // Navigate to signal page
      navigate("/signal", {
        state: {
          type: "start",
          sessionId,
          partnerId,
        },
      })
    } catch (err) {
      console.error("Pairing error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem" }}>
        <h1>Pair with Device</h1>
        <p style={{ marginBottom: "1.5rem", opacity: 0.8 }}>
          Enter the code shown on the other device to complete pairing.
        </p>

        {mqttError && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            MQTT Error: {mqttError.message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter pairing code"
            autoFocus
            style={{
              padding: "0.75rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />

          {error && (
            <div
              style={{ color: "red", marginTop: "0.5rem", fontSize: "0.9rem" }}
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !code.trim()}
            style={{ marginTop: "1rem", width: "100%" }}
          >
            {loading ? "Pairing..." : "Complete Pairing"}
          </Button>
        </form>

        <Button
          onClick={() => navigate("/")}
          style={{ marginTop: "0.5rem", width: "100%", opacity: 0.7 }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
