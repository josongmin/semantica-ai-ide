/**
 * Shared test fixtures for feature-level streaming tests.
 *
 * Re-exports rAF mock from tests/utils and adds postMessage + Jotai helpers
 * specific to the streaming feature layer.
 */
import { createElement, type ReactNode } from "react";
import { type createStore, Provider } from "jotai";

import type { ServerEvent, ServerEventBatch } from "../../../shared/protocol";

// Re-export rAF mock helpers (single source of truth in tests/utils)
export { flushAllRaf, rafScheduleCount, resetRafMock } from "../../../../tests/utils/raf-mock";

/** Dispatch a single ServerEvent via window postMessage. */
export function postServerEvent(serverEvent: ServerEvent): void {
  window.dispatchEvent(new MessageEvent("message", { data: serverEvent }));
}

/** Dispatch a ServerEventBatch via window postMessage. */
export function postBatch(serverEvents: ServerEvent[], batchId = "batch_1"): void {
  const batch: ServerEventBatch = {
    type: "SERVER_EVENT_BATCH",
    batch_id: batchId,
    created_at_ms: Date.now(),
    serverEvents,
  };
  window.dispatchEvent(new MessageEvent("message", { data: batch }));
}

/** Create a Jotai Provider wrapper for renderHook(). */
export function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}
