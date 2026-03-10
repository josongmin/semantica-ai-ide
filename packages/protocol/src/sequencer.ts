import type { ProtocolEnvelope } from "./envelope.js";
import type { StreamId } from "./types.js";

/**
 * Stream sequencer: ensures in-order delivery within a stream_id.
 * Buffers out-of-order envelopes, delivers when gap is filled.
 * Owned by packages/protocol (deterministic algorithm).
 */
export interface StreamSequencer {
  /** Push envelope, returns envelopes ready for delivery (in order) */
  push(envelope: ProtocolEnvelope): ProtocolEnvelope[];
  /** Number of streams with pending gaps */
  pendingGaps(): number;
  /** Reset all state */
  clear(): void;
}

interface StreamState {
  nextSeq: number;
  buffer: Map<number, ProtocolEnvelope>;
}

export function createSequencer(): StreamSequencer {
  const streams = new Map<StreamId, StreamState>();

  return {
    push(envelope: ProtocolEnvelope): ProtocolEnvelope[] {
      const { stream_id, seq } = envelope;

      // Non-sequenced envelopes pass through immediately
      if (stream_id === undefined || seq === undefined) {
        return [envelope];
      }

      let state = streams.get(stream_id);
      if (!state) {
        state = { nextSeq: 0, buffer: new Map() };
        streams.set(stream_id, state);
      }

      // Duplicate or old — drop
      if (seq < state.nextSeq) {
        return [];
      }

      // Buffer this envelope
      state.buffer.set(seq, envelope);

      // Flush contiguous run starting from nextSeq
      const ready: ProtocolEnvelope[] = [];
      while (state.buffer.has(state.nextSeq)) {
        ready.push(state.buffer.get(state.nextSeq)!);
        state.buffer.delete(state.nextSeq);
        state.nextSeq++;
      }

      // Clean up completed streams
      if (
        state.buffer.size === 0 &&
        envelope.kind === "STREAM_CLOSE"
      ) {
        streams.delete(stream_id);
      }

      return ready;
    },

    pendingGaps(): number {
      let count = 0;
      for (const state of streams.values()) {
        if (state.buffer.size > 0) count++;
      }
      return count;
    },

    clear() {
      streams.clear();
    },
  };
}
