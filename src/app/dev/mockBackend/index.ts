/**
 * Mock Backend — Auto-reactive backend for dev mode.
 *
 * Intercepts postMessage calls from the frontend and responds
 * with serverEvent streams, simulating a real backend without any server.
 *
 * Usage:
 *   - Automatically installed in dev mode (see main.tsx)
 *   - Disable with URL param: ?no-mock
 *   - Access from console: window.__mockBackend
 */
import { setDevMessageHandler } from "../../../shared/lib/vscodeApi";
import { getState,handleMessage } from "./handlers";
import { postServerEvents, sleep } from "./MockBackendCore";
import { createSeedServerEvents } from "./scenarioSeed";

export function installMockBackend(): void {
  // Allow disabling via URL param
  if (new URLSearchParams(window.location.search).has("no-mock")) {
    // eslint-disable-next-line no-console
    console.log("[mockBackend] Disabled via ?no-mock");
    return;
  }

  // Register message handler
  setDevMessageHandler(handleMessage);

  // Seed initial data after a short delay (let React mount first)
  sleep(300)
    .then(() => {
      const serverEvents = createSeedServerEvents();
      postServerEvents(serverEvents);
      // eslint-disable-next-line no-console
      console.log(`[mockBackend] Seeded ${serverEvents.length} initial serverEvents`);
    })
    .catch((err: unknown) => console.error("[mockBackend] Seed failed:", err));

  // Expose for console debugging
  (window as unknown as Record<string, unknown>).__mockBackend = {
    getState,
    handleMessage,
  };

  // eslint-disable-next-line no-console
  console.log(
    "%c[mockBackend] Installed — UI interactions will receive mock responses",
    "color: #4ade80; font-weight: bold",
  );
}
