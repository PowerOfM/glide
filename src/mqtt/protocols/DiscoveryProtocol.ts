import { z } from "zod"
import { DeviceManager, DeviceType } from "../../helpers/DeviceManager"
import { RandomGenerator } from "../../helpers/RandomGenerator"

/**
 * HELLO
 *
 * Sent when a device joins the main topic
 */
export const HelloMessageSchema = z.object({
  type: z.literal("hello"),
  id: z.string(),
  name: z.string(),
  device: z.enum(DeviceType),
  color: z.string().optional(),
})

export type IHelloMessage = z.infer<typeof HelloMessageSchema>
export const makeHelloMessage = (
  color = RandomGenerator.color()
): IHelloMessage => ({
  type: "hello",
  id: DeviceManager.getId(),
  name: DeviceManager.getName(),
  device: DeviceManager.getType(),
  color,
})

/**
 * WELCOME
 *
 * A respond sent by all other devices when a HELLO message is seen
 */
export const WelcomeMessageSchema = HelloMessageSchema.extend({
  type: z.literal("welcome"),
})

export type IWelcomeMessage = z.infer<typeof WelcomeMessageSchema>
export const makeWelcomeMessage = (
  color = RandomGenerator.color()
): IWelcomeMessage => ({
  ...makeHelloMessage(color),
  type: "welcome",
})

/**
 * LEAVE
 *
 * Sent right before a device disconnects
 */
export const LeaveMessageSchema = z.object({
  type: z.literal("leave"),
  id: z.string(),
})

export type ILeaveMessage = z.infer<typeof LeaveMessageSchema>
export const makeLeaveMessage = (): ILeaveMessage => ({
  type: "leave",
  id: DeviceManager.getId(),
})

/**
 * PAIR REQUEST
 *
 * Sent to a specific device to indicate pairing. The key encrypted
 * should be encrypted with a join code known only to the receipient
 */
export const PairRequestMessageSchema = z.object({
  type: z.literal("pairRequest"),
  from: z.string(),
  to: z.string(),
  key: z
    .string()
    .describe("The sender's public key, encrypted by a secret join code"),
})

export type IPairRequestMessage = z.infer<typeof PairRequestMessageSchema>
export const makePairRequestMessage = (
  targetDeviceId: string,
  encryptedPublicKey: string
): IPairRequestMessage => ({
  type: "pairRequest",
  from: DeviceManager.getId(),
  to: targetDeviceId,
  key: encryptedPublicKey,
})
