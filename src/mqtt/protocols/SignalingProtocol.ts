import { z } from "zod"

/**
 * START
 *
 * First message sent over the receipient's private topic to
 * start the signaling procedure.
 */
export const StartMessageSchema = z.object({
  type: z.literal("start"),
  sessionId: z
    .string()
    .describe("A unique session ID for this transfer session"),
  from: z.string(),
  key: z
    .string()
    .describe(
      "The sender's public key, encrypted with the recipient's public key"
    ),
})

export type IStartMessage = z.infer<typeof StartMessageSchema>
export const makeStartMessage = (
  sessionId: string,
  from: string,
  key: string
): IStartMessage => ({
  type: "start",
  sessionId,
  from,
  key,
})

/**
 * RTC SESSION DESCRIPTION
 *
 * RTC session description offer/answer
 */
export const RTCSessionDescriptionMessageSchema = z.object({
  type: z.literal("rtcSessionDescription"),
  sessionId: z
    .string()
    .describe("A unique session ID for this transfer session"),
  data: {
    type: z.enum(["offer", "answer", "pranswer", "rollback"]),
    sdp: z.string().describe("The RTC session description protocol offer"),
  },
})

export type IRTCSessionDescriptionMessage = z.infer<
  typeof RTCSessionDescriptionMessageSchema
>
export const makeRTCSessionDescriptionMessage = (
  sessionId: string,
  data: IRTCSessionDescriptionMessage["data"]
): IRTCSessionDescriptionMessage => ({
  type: "rtcSessionDescription",
  sessionId,
  data,
})

/**
 * ICE CANDIDATE
 *
 * ICE candidate for establishing peer connection
 */
export const RTCIceCandidateMessageSchema = z.object({
  type: z.literal("rtcIceCandidate"),
  sessionId: z
    .string()
    .describe("A unique session ID for this transfer session"),
  candidate: z.string().describe("The ICE candidate string"),
})

export type IRTCIceCandidateMessage = z.infer<
  typeof RTCIceCandidateMessageSchema
>
export const makeRTCIceCandidateMessage = (
  sessionId: string,
  candidate: string
): IRTCIceCandidateMessage => ({
  type: "rtcIceCandidate",
  sessionId,
  candidate,
})

/**
 * END
 *
 * Sent to indicate the end of a signaling session
 */
export const EndMessageSchema = z.object({
  type: z.literal("end"),
  sessionId: z
    .string()
    .describe("A unique session ID for this transfer session"),
})

export type IEndMessage = z.infer<typeof EndMessageSchema>
export const makeEndMessage = (sessionId: string): IEndMessage => ({
  type: "end",
  sessionId,
})
