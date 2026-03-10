import { isServerEvent, isServerEventBatch,type ServerEvent, type ServerEventBatch } from "../../protocol";

// ─── Coalescing Strategy (OCP extension point) ──────────────
export interface CoalescingStrategy {
  /** Returns true if `incoming` can be merged into `last` */
  canMerge(incoming: ServerEvent, last: ServerEvent): boolean;
  /** Produce the merged event */
  merge(incoming: ServerEvent, last: ServerEvent): ServerEvent;
}

/** Default strategy: merge consecutive APPEND_TEXT events sharing the same id */
export const APPEND_TEXT_STRATEGY: CoalescingStrategy = {
  canMerge: (incoming, last) =>
    incoming.t === "APPEND_TEXT" && last.t === "APPEND_TEXT" && incoming.id === last.id,
  merge: (incoming, last) => ({
    ...last,
    chunk: String((last as unknown as Record<string, unknown>).chunk) + String((incoming as unknown as Record<string, unknown>).chunk) as unknown,
  }) as ServerEvent,
};

type CommitFn = (serverEvents: readonly ServerEvent[]) => void;

interface StreamingEngineOptions {
  /** Max buffer size before forcing a synchronous flush (back-pressure) */
  maxBufferSize?: number;
  /** Custom coalescing strategies. Defaults to [APPEND_TEXT_STRATEGY]. */
  strategies?: readonly CoalescingStrategy[];
}

interface DestroyOptions {
  /** Whether to flush buffered serverEvents before destroying. Default: true */
  flush?: boolean;
}

interface StreamingEngine {
  /** Push a single serverEvent or batch */
  push(input: ServerEvent | ServerEventBatch): void;
  /** Flush any buffered serverEvents immediately */
  flush(): void;
  /** Stop the engine and cancel pending frame. Flushes remaining buffer by default. */
  destroy(options?: DestroyOptions): void;
  /** Current buffer size (for debugging/monitoring) */
  readonly bufferSize: number;
}

const DEFAULT_MAX_BUFFER = 500;

/**
 * RFC-003 Streaming Engine
 *
 * Buffers incoming serverEvents, coalesces consecutive APPEND_TEXT for the same
 * message id, and commits once per rAF (~16ms). This prevents the UI from
 * being overwhelmed by high-frequency streaming updates.
 *
 * Back-pressure: flushes synchronously if buffer exceeds maxBufferSize.
 */
export function createStreamingEngine(
  commit: CommitFn,
  options: StreamingEngineOptions = {},
): StreamingEngine {
  const maxBuffer = options.maxBufferSize ?? DEFAULT_MAX_BUFFER;
  const strategies = options.strategies ?? [APPEND_TEXT_STRATEGY];
  let buffer: ServerEvent[] = [];
  let rafId: number | null = null;
  let destroyed = false;

  function coalesce(serverEvents: readonly ServerEvent[]): ServerEvent[] {
    if (serverEvents.length <= 1) return [...serverEvents];

    const result: ServerEvent[] = [];
    for (const d of serverEvents) {
      if (result.length > 0) {
        const last = result[result.length - 1];
        if (last == null) continue;
        const strategy = strategies.find((s) => s.canMerge(d, last));
        if (strategy) {
          result[result.length - 1] = strategy.merge(d, last);
          continue;
        }
      }
      result.push(d);
    }
    return result;
  }

  function scheduleFlush() {
    if (rafId !== null || destroyed) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      flush();
    });
  }

  function flush() {
    if (buffer.length === 0) return;
    const batch = coalesce(buffer);
    buffer = [];
    commit(batch);
  }

  function push(input: ServerEvent | ServerEventBatch) {
    if (destroyed) return;

    if (isServerEventBatch(input)) {
      for (const d of input.serverEvents) {
        if (isServerEvent(d)) buffer.push(d);
      }
    } else if (isServerEvent(input)) {
      buffer.push(input);
    }

    // Back-pressure: synchronous flush when buffer is full
    if (buffer.length >= maxBuffer) {
      // Cancel any pending rAF before sync flush to prevent double-commit
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      flush();
    } else {
      scheduleFlush();
    }
  }

  function destroy(options?: DestroyOptions) {
    destroyed = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (options?.flush !== false) {
      flush();
    } else {
      buffer = [];
    }
  }

  return {
    push,
    flush,
    destroy,
    get bufferSize() {
      return buffer.length;
    },
  };
}
