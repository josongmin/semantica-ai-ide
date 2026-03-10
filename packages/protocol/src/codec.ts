import type { ProtocolEnvelope } from "./envelope.js";

/**
 * Encode/decode protocol envelopes to binary.
 * Owned by packages/protocol (deterministic algorithm).
 */
export interface EnvelopeCodec {
  encode(envelope: ProtocolEnvelope): Uint8Array;
  decode(data: Uint8Array): ProtocolEnvelope;
}

/**
 * JSON-based codec with structural validation on decode.
 * Validates required envelope fields are present (lightweight check).
 * Full Zod validation should be done at the handler layer for detailed errors.
 */
export const jsonCodec: EnvelopeCodec = {
  encode(envelope: ProtocolEnvelope): Uint8Array {
    const json = JSON.stringify(envelope);
    return new TextEncoder().encode(json);
  },
  decode(data: Uint8Array): ProtocolEnvelope {
    const json = new TextDecoder().decode(data);
    const parsed: unknown = JSON.parse(json);

    // Structural validation: ensure required fields exist
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      !("session_id" in parsed) ||
      !("event_id" in parsed) ||
      !("kind" in parsed) ||
      !("ts_ms" in parsed) ||
      !("payload" in parsed)
    ) {
      throw new Error(
        "Invalid envelope: missing required fields (version, session_id, event_id, kind, ts_ms, payload)",
      );
    }

    return parsed as ProtocolEnvelope;
  },
};
