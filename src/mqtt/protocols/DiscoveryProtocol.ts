import { z } from "zod"
import { DeviceManager, DeviceType } from "../../helpers/DeviceManager"
import { RandomGenerator } from "../../helpers/RandomGenerator"

/**
 * HELLO
 *
 * Sent when a device joins the main topic
 */
export const HelloMessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  device: z.enum(DeviceType),
  color: z.string().optional(),
})

export type IHelloMessage = z.infer<typeof HelloMessageSchema>
export const makeHelloMessage = (
  color = RandomGenerator.color()
): IHelloMessage => ({
  id: DeviceManager.getId(),
  name: DeviceManager.getName(),
  device: DeviceManager.getType(),
  color,
})

/**
 * PAIR REQUEST
 *
 * Sent to a specific device to indicate pairing. The key encrypted
 * should be encrypted with a join code known only to the receipient
 */
export const PairRequestMessageSchema = z.object({
  type: z.literal("pairRequest"),
  src: z.string(),
  key: z
    .string()
    .describe("The sender's public key, encrypted by a secret join code"),
})

export type IPairRequestMessage = z.infer<typeof PairRequestMessageSchema>
export const makePairRequestMessage = (
  encryptedPublicKey: string
): IPairRequestMessage => ({
  type: "pairRequest",
  src: DeviceManager.getId(),
  key: encryptedPublicKey,
})
