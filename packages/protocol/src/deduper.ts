import type { EventId } from "./types.js";

/**
 * Replay deduplication based on event_id.
 * Owned by packages/protocol (deterministic algorithm).
 */
export interface ReplayDeduper {
  /** Returns true if this is a new event, false if duplicate (→ drop) */
  accept(event_id: EventId): boolean;
  /** Last accepted event_id (resume point on reconnect) */
  lastEventId(): EventId | null;
  /** Reset state */
  clear(): void;
}

/**
 * Map-based LRU deduper.
 * Uses Map insertion order + re-insertion on access to achieve true LRU.
 * Map.keys().next() gives the least recently used entry.
 */
export function createDeduper(maxSize = 10_000): ReplayDeduper {
  // Map<EventId, true> — we use Map for O(1) delete + re-insert LRU behavior
  const seen = new Map<EventId, true>();
  let last: EventId | null = null;

  return {
    accept(event_id: EventId): boolean {
      if (seen.has(event_id)) {
        // Move to end (most recently used) by delete + re-insert
        seen.delete(event_id);
        seen.set(event_id, true);
        return false;
      }
      // Evict LRU (first entry) when at capacity
      if (seen.size >= maxSize) {
        const lru = seen.keys().next().value;
        if (lru !== undefined) seen.delete(lru);
      }
      seen.set(event_id, true);
      last = event_id;
      return true;
    },
    lastEventId() {
      return last;
    },
    clear() {
      seen.clear();
      last = null;
    },
  };
}
