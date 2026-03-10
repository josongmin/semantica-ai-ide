/**
 * Handler registry types for the ServerEvent dispatcher.
 *
 * Each handler file registers its handlers via `registerHandler`.
 * The main dispatcher looks up handlers by event type from the shared map.
 */
import type { createStore } from "jotai";

import type { ServerEvent, ServerEventType } from "../../../shared/protocol";

export type Store = ReturnType<typeof createStore>;
export type EventHandler = (event: ServerEvent, store: Store) => void;

/**
 * Map keyed by `ServerEventType` (the discriminant union) rather than
 * plain `string`.  This prevents registering handlers for event types
 * that do not exist in the `ServerEvent` union.
 */
const handlers = new Map<ServerEventType, EventHandler>();

/**
 * Register a handler for a specific ServerEvent type.
 *
 * The `eventType` parameter is constrained to the `ServerEventType`
 * discriminant union, so typos or stale event names are caught at
 * compile time.
 */
export function registerHandler(eventType: ServerEventType, handler: EventHandler): void {
  handlers.set(eventType, handler);
}

export function getHandler(eventType: ServerEventType): EventHandler | undefined {
  return handlers.get(eventType);
}

export { handlers };
