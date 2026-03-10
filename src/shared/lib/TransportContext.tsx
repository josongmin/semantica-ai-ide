import { createContext, useContext } from "react";

import { type ExtensionHostMessage, getVscodeApi } from "./vscodeApi";

/**
 * Transport abstraction layer (DIP).
 *
 * React components should use `useTransport()` instead of importing
 * `getVscodeApi()` directly. This allows:
 * - Mock injection in tests via `<TransportProvider value={mock}>`
 * - Future transport swapping (WebSocket, Tauri IPC, etc.)
 * - Proper dependency inversion — components depend on abstraction, not concrete API
 *
 * Migration: new code should use `useTransport()`. Existing `getVscodeApi()` calls
 * continue to work and can be migrated incrementally.
 */
export interface Transport {
  postMessage(msg: ExtensionHostMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

const TransportContext = createContext<Transport | null>(null);

export const TransportProvider = TransportContext.Provider;

/**
 * Access the transport layer from React components.
 * Falls back to `getVscodeApi()` if no provider is mounted (backwards-compatible).
 */
export function useTransport(): Transport {
  const ctx = useContext(TransportContext);
  if (ctx) return ctx;
  return getVscodeApi();
}

/**
 * Create a mock transport for tests.
 * Records all messages and provides inspection helpers.
 */
export function createMockTransport(): Transport & { readonly sent: ExtensionHostMessage[] } {
  const sent: ExtensionHostMessage[] = [];
  let state: unknown = null;
  return {
    sent,
    postMessage(msg: ExtensionHostMessage) { sent.push(msg); },
    getState() { return state; },
    setState(s: unknown) { state = s; },
  };
}
