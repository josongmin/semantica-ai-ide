/**
 * Terminal Event Bus — Subscribes to Tauri terminal events
 * and updates Jotai atoms accordingly.
 *
 * Call `setupTerminalEventListeners(store)` once during app initialization.
 * Returns a cleanup function that unsubscribes all listeners.
 *
 * This is the store-based (non-React) counterpart to useTerminalEventListener.
 * Use this when you need to wire terminal events outside of React lifecycle
 * (e.g., from an imperative bootstrap flow or menu action layer).
 */

import type { createStore } from "jotai";

import { logger } from "~shared/lib/logger";
import type { TerminalSession } from "~shared/protocol/types/terminal";

import {
  appendParsedEventAtom,
  appendTerminalCommandAtom,
  enqueueApprovalAtom,
  markSessionExitedAtom,
  storeAgentExecutionResultAtom,
  updateCompatibilityAtom,
  updateOverlayStateAtom,
  updateSessionCwdAtom,
  updateSessionModeAtom,
  updateTaskStateAtom,
  updateTerminalCommandAtom,
  upsertTerminalSessionAtom,
} from "../model/atoms";
import {
  type FallbackTriggeredPayload,
  type SessionCwdChangedPayload,
  type SessionModeChangedPayload,
  TERMINAL_EVENTS,
} from "../model/events";
import type {
  AgentTerminalExecutionResult,
  ApprovalRequiredPayload,
  CompatibilityState,
  OverlayModeChangedPayload,
  ParsedTerminalEvent,
  TerminalCommand,
  TerminalTaskState,
} from "../model/types";
import { getTerminalListenFn } from "./useTerminalEventListener";

type Store = ReturnType<typeof createStore>;
type UnlistenFn = () => void;

/**
 * Subscribe to all terminal:// events from Rust and dispatch updates
 * to the Jotai store. Returns a cleanup function that unsubscribes
 * all listeners.
 *
 * Requires that `initTerminalEventListener(listen)` has already been called
 * (typically by `useTerminalBootstrap`).
 */
export function setupTerminalEventListeners(store: Store): () => void {
  const listenFn = getTerminalListenFn();
  if (!listenFn) {
    logger.warn(
      "[terminalEventBus] Listen function not initialized. " +
        "Call initTerminalEventListener() before setupTerminalEventListeners().",
    );
    return () => { /* noop */ };
  }

  // Capture in a non-nullable const for use inside async scope
  const listen = listenFn;
  const unlisteners: UnlistenFn[] = [];
  let disposed = false;

  /** Helper: register a listener and abort if disposed mid-subscribe */
  async function reg(event: string, handler: (e: { payload: unknown }) => void) {
    if (disposed) return;
    const unlisten = await listen(event, handler);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- disposed may change during await
    if (disposed) {
      unlisten(); // Immediately clean up if disposed during await
    } else {
      unlisteners.push(unlisten);
    }
  }

  async function subscribe() {
    // ── Session events ──────────────────────────────────

    await reg(TERMINAL_EVENTS.SESSION_CREATED, (e) => {
      store.set(upsertTerminalSessionAtom, e.payload as TerminalSession);
    });

    await reg(TERMINAL_EVENTS.SESSION_EXITED, (e) => {
      const payload = e.payload as { sessionId: string; status: string; exitCode?: number };
      store.set(markSessionExitedAtom, payload);
    });

    await reg(TERMINAL_EVENTS.SESSION_CWD_CHANGED, (e) => {
      const payload = e.payload as SessionCwdChangedPayload;
      store.set(updateSessionCwdAtom, { sessionId: payload.sessionId, cwd: payload.cwd });
    });

    await reg(TERMINAL_EVENTS.SESSION_MODE_CHANGED, (e) => {
      const payload = e.payload as SessionModeChangedPayload;
      store.set(updateSessionModeAtom, {
        sessionId: payload.sessionId,
        mode: payload.mode,
      });
    });

    // ── Output event ────────────────────────────────────
    // Raw output is forwarded directly to xterm.js instances via their
    // own listener; no atom update needed here.
    await reg(TERMINAL_EVENTS.OUTPUT, () => {
      // no-op: xterm.js handles raw output via its own listener
    });

    // ── Command events ──────────────────────────────────

    await reg(TERMINAL_EVENTS.COMMAND_STARTED, (e) => {
      store.set(appendTerminalCommandAtom, e.payload as TerminalCommand);
    });

    await reg(TERMINAL_EVENTS.COMMAND_COMPLETED, (e) => {
      store.set(updateTerminalCommandAtom, e.payload as TerminalCommand);
    });

    await reg(TERMINAL_EVENTS.COMMAND_CANCELLED, (e) => {
      store.set(updateTerminalCommandAtom, e.payload as TerminalCommand);
    });

    // ── Parsed event ────────────────────────────────────

    await reg(TERMINAL_EVENTS.PARSED_EVENT, (e) => {
      store.set(appendParsedEventAtom, e.payload as ParsedTerminalEvent);
    });

    // ── Task state events ───────────────────────────────

    await reg(TERMINAL_EVENTS.TASK_STATE_CHANGED, (e) => {
      store.set(updateTaskStateAtom, e.payload as TerminalTaskState);
    });

    // ── Compatibility / overlay events ──────────────────

    await reg(TERMINAL_EVENTS.COMPATIBILITY_STATE, (e) => {
      store.set(updateCompatibilityAtom, e.payload as CompatibilityState);
    });

    await reg(TERMINAL_EVENTS.OVERLAY_MODE_CHANGED, (e) => {
      const payload = e.payload as OverlayModeChangedPayload;
      store.set(updateOverlayStateAtom, payload);
    });

    await reg(TERMINAL_EVENTS.FALLBACK_TRIGGERED, (e) => {
      const payload = e.payload as FallbackTriggeredPayload;
      store.set(updateSessionModeAtom, {
        sessionId: payload.sessionId,
        mode: payload.newMode,
      });
      logger.warn(
        `[terminalEventBus] Fallback triggered: ${payload.previousMode} → ${payload.newMode} (${payload.reason})`,
      );
    });

    // ── Agent bridge events ─────────────────────────────

    await reg(TERMINAL_EVENTS.AGENT_EXEC_STARTED, (e) => {
      logger.info("[terminalEventBus] Agent exec started:", e.payload);
    });

    await reg(TERMINAL_EVENTS.AGENT_EXEC_COMPLETED, (e) => {
      store.set(
        storeAgentExecutionResultAtom,
        e.payload as AgentTerminalExecutionResult,
      );
    });

    await reg(TERMINAL_EVENTS.AGENT_APPROVAL_REQUIRED, (e) => {
      const payload = e.payload as { requestId: string; request: unknown };
      store.set(enqueueApprovalAtom, {
        requestId: payload.requestId,
        ...(payload.request as Omit<ApprovalRequiredPayload, "requestId">),
      } as ApprovalRequiredPayload);
      logger.info("[terminalEventBus] Agent approval required:", payload.requestId);
    });
  }

  subscribe().catch((err: unknown) => {
    if (!disposed) {
      logger.warn("[terminalEventBus] Failed to subscribe:", err);
    }
  });

  return () => {
    disposed = true;
    for (const unlisten of unlisteners) {
      unlisten();
    }
  };
}
