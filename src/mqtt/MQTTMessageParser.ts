import { z } from "zod"

/**
 * Parser for MQTT messages that validates JSON strings against multiple Zod schemas
 */
export class MQTTMessageParser<T extends readonly z.ZodSchema[]> {
  constructor(private readonly schemas: T) {}

  /**
   * Parses a JSON string and validates it against the registered schemas
   */
  public parse(input: string): z.output<T[number]> | null {
    let parsed: unknown
    try {
      parsed = JSON.parse(input)
    } catch (error) {
      return null
    }

    for (const schema of this.schemas) {
      const result = schema.safeParse(parsed)
      if (result.success) {
        return result.data as z.output<T[number]>
      }
    }

    return null
  }

  /**
   * Safe parse method that returns additional error information
   */
  public safeParse(
    input: string
  ):
    | { success: true; data: z.output<T[number]> }
    | { success: false; error: string } {
    let parsed: unknown
    try {
      parsed = JSON.parse(input)
    } catch (error) {
      return {
        success: false,
        error: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }

    const errors: string[] = []
    for (const schema of this.schemas) {
      const result = schema.safeParse(parsed)
      if (result.success) {
        return { success: true, data: result.data as z.output<T[number]> }
      } else {
        errors.push(result.error.message)
      }
    }

    return {
      success: false,
      error: `No schema matched. Validation errors: ${errors.join("; ")}`,
    }
  }
}
