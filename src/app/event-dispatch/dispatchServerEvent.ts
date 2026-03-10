/**
 * Pure (non-React) serverEvent dispatcher.
 *
 * Thin router that delegates to category-based handler files.
 * Handlers self-register via side-effect imports — adding a new
 * ServerEvent variant requires only:
 *   1. Adding the type to the protocol
 *   2. Adding a registerHandler() call in the appropriate handler file
 *
 * No changes to this file are needed when new handlers are added (OCP).
 */
import type { createStore } from "jotai";

import type { ServerEvent } from "../../shared/protocol";
// Side-effect import triggers handler self-registration; getHandler is used below.
import { getHandler } from "./handlers";

type Store = ReturnType<typeof createStore>;

// ── Main dispatch ────────────────────────────────────────────────────

/** Dispatch a single ServerEvent to the Jotai store. Exhaustive over all variants. */
export function dispatchServerEvent(store: Store, serverEvent: ServerEvent): void {
  const handler = getHandler(serverEvent.t);
  if (handler) {
    handler(serverEvent, store);
    return;
  }

  // If no handler was found, a new ServerEvent variant was likely added to the
  // protocol type without a corresponding registerHandler() call.
  console.warn("[dispatcher] No handler registered for serverEvent type:", serverEvent.t);
}
