import type {
  BrowserAction,
  BrowserConsoleEntry,
} from "../../../shared/protocol";
import { postServerEvent } from "../devUtils";

/**
 * Seeds browser preview state, console entries, and browser actions.
 */
export function seedBrowser() {
  const now = Date.now();

  // ── Browser preview ─────────────────────────────────────
  postServerEvent({ t: "SET_BROWSER_STATE", state: { url: "http://localhost:3000/auth/login", loading: false, title: "Login Page" } });
  const consoleEntries: BrowserConsoleEntry[] = [
    { id: "bc-1", level: "log", message: "App mounted successfully", timestamp_ms: now - 5000 },
    { id: "bc-2", level: "warn", message: "React.StrictMode detected", timestamp_ms: now - 4000 },
    { id: "bc-3", level: "error", message: "Failed to fetch /api/health", timestamp_ms: now - 2000 },
  ];
  for (const e of consoleEntries) postServerEvent({ t: "PUSH_BROWSER_CONSOLE", entry: e });

  // ── Browser actions ──────────────────────────────────────
  const browserActions: BrowserAction[] = [
    { id: "ba-1", type: "navigate", value: "http://localhost:3000", timestamp_ms: now - 6000 },
    { id: "ba-2", type: "click", target: "button.login-btn", timestamp_ms: now - 4000 },
    { id: "ba-3", type: "type", target: "input#email", value: "test@example.com", timestamp_ms: now - 3500 },
    { id: "ba-4", type: "screenshot", timestamp_ms: now - 3000 },
  ];
  postServerEvent({ t: "SET_BROWSER_ACTIONS", actions: browserActions });
}
