/**
 * Settings & Configuration Handlers
 *
 * Covers: SWITCH_MODEL, SET_THINKING_MODE, SET_FAST_MODE, REQUEST_PROJECT_FILES,
 *         SET_APPROVAL_MODE, SET_AGENT_REQUEST_MODE, SET_COMPLETION_SETTINGS
 */
import { postServerEvent, postServerEvents } from "../MockBackendCore";
import { MOCK_PROJECT_FILES,MODEL_LABELS } from "./handlerConstants";
import type { Handler } from "./index";

// ── Registration ──────────────────────────────────────────────

export function registerSettingsHandlers(registry: Map<string, Handler>): void {
  registry.set("SET_APPROVAL_MODE", (msg, ctx) => {
    ctx.state.approvalMode = msg.mode;
    postServerEvents([
      { t: "SET_APPROVAL_MODE", mode: msg.mode },
      { t: "SET_SESSION_META", meta: { approval_mode: msg.mode } },
    ]);
  });

  registry.set("SET_AGENT_REQUEST_MODE", () => {
    // Client-side state — no server response needed
  });

  registry.set("SWITCH_MODEL", (msg, ctx) => {
    ctx.state.activeModel = msg.model_id;
    postServerEvent({
      t: "SET_SESSION_META",
      meta: {
        model_id: msg.model_id,
        model_label: MODEL_LABELS[msg.model_id] ?? msg.model_id,
      },
    });
  });

  registry.set("SET_THINKING_MODE", (msg, ctx) => {
    ctx.state.thinkingMode = msg.enabled;
    postServerEvent({ t: "SET_THINKING_MODE", enabled: msg.enabled });
  });

  registry.set("SET_FAST_MODE", (msg, ctx) => {
    ctx.state.fastMode = msg.enabled;
    postServerEvent({ t: "SET_FAST_MODE", enabled: msg.enabled });
  });

  registry.set("REQUEST_PROJECT_FILES", () => {
    postServerEvent({
      t: "SET_PROJECT_FILES",
      files: MOCK_PROJECT_FILES,
    });
  });

  registry.set("SET_COMPLETION_SETTINGS", (msg) => {
    postServerEvent({ t: "SET_COMPLETION_SETTINGS", settings: msg.settings });
  });
}
