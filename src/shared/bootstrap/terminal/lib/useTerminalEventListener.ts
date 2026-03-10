/**
 * useTerminalEventListener — Tauri event → Jotai atom sync
 *
 * Listens to all terminal:// events from Rust and dispatches them
 * to the appropriate Jotai atoms. This is the single point where
 * Rust backend state flows into FE state.
 */

import { useEffect, useRef } from "react";
import { useSetAtom } from "jotai";

import { logger } from "~shared/lib/logger";
import type { TerminalSession } from "~shared/protocol/types/terminal";

import {
  appendParsedEventAtom,
  appendTerminalCommandAtom,
  enqueueApprovalAtom,
  markSessionExitedAtom,
  removeTerminalSessionAtom,
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

type UnlistenFn = () => void;
type ListenFn = (event: string, handler: (event: { payload: unknown }) => void) => Promise<UnlistenFn>;

let listenFn: ListenFn | null = null;

/** Initialize with Tauri's listen function. Call once at app bootstrap. */
export function initTerminalEventListener(listen: ListenFn): void {
  listenFn = listen;
}

/** Get the current listen function (for output writer). */
export function getTerminalListenFn(): ListenFn | null {
  return listenFn;
}

/**
 * Hook: subscribe to all terminal events and sync them to atoms.
 * Must be mounted once in a component near the app root.
 */
export function useTerminalEventListener(ready = true): void {
  const upsertSession = useSetAtom(upsertTerminalSessionAtom);
  const removeSession = useSetAtom(removeTerminalSessionAtom);
  const markExited = useSetAtom(markSessionExitedAtom);
  const updateMode = useSetAtom(updateSessionModeAtom);
  const updateCwd = useSetAtom(updateSessionCwdAtom);
  const appendCommand = useSetAtom(appendTerminalCommandAtom);
  const updateCommand = useSetAtom(updateTerminalCommandAtom);
  const appendParsedEvent = useSetAtom(appendParsedEventAtom);
  const updateCompat = useSetAtom(updateCompatibilityAtom);
  const updateOverlay = useSetAtom(updateOverlayStateAtom);
  const updateTask = useSetAtom(updateTaskStateAtom);
  const storeResult = useSetAtom(storeAgentExecutionResultAtom);
  const enqueueApproval = useSetAtom(enqueueApprovalAtom);

  // Stabilize setter refs — useSetAtom returns stable references, but
  // accessing via ref guarantees no effect re-subscription on identity changes.
  const settersRef = useRef({
    upsertSession, removeSession, markExited, updateMode, updateCwd,
    appendCommand, updateCommand, appendParsedEvent,
    updateCompat, updateOverlay, updateTask, storeResult, enqueueApproval,
  });

  useEffect(() => {
    if (!listenFn || !ready) {
      return;
    }

    const listen = listenFn;
    const unlisteners: UnlistenFn[] = [];
    const s = settersRef; // Access via ref — always current, no deps needed

    async function subscribe() {
      // ── Session events ──────────────────────────────────
      unlisteners.push(
        await listen(TERMINAL_EVENTS.SESSION_CREATED, (e) => {
          s.current.upsertSession(e.payload as TerminalSession);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.SESSION_EXITED, (e) => {
          const payload = e.payload as { sessionId: string; status: string; exitCode?: number };
          s.current.markExited(payload);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.SESSION_MODE_CHANGED, (e) => {
          const payload = e.payload as SessionModeChangedPayload;
          s.current.updateMode({ sessionId: payload.sessionId, mode: payload.mode });
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.SESSION_CWD_CHANGED, (e) => {
          const payload = e.payload as SessionCwdChangedPayload;
          s.current.updateCwd({ sessionId: payload.sessionId, cwd: payload.cwd });
        }),
      );

      // ── Command events ──────────────────────────────────
      unlisteners.push(
        await listen(TERMINAL_EVENTS.COMMAND_STARTED, (e) => {
          s.current.appendCommand(e.payload as TerminalCommand);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.COMMAND_COMPLETED, (e) => {
          s.current.updateCommand(e.payload as TerminalCommand);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.COMMAND_CANCELLED, (e) => {
          s.current.updateCommand(e.payload as TerminalCommand);
        }),
      );

      // ── Parsed event ────────────────────────────────────
      unlisteners.push(
        await listen(TERMINAL_EVENTS.PARSED_EVENT, (e) => {
          s.current.appendParsedEvent(e.payload as ParsedTerminalEvent);
        }),
      );

      // ── Compatibility / overlay events ──────────────────
      unlisteners.push(
        await listen(TERMINAL_EVENTS.COMPATIBILITY_STATE, (e) => {
          s.current.updateCompat(e.payload as CompatibilityState);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.OVERLAY_MODE_CHANGED, (e) => {
          const payload = e.payload as OverlayModeChangedPayload;
          s.current.updateOverlay(payload);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.FALLBACK_TRIGGERED, (e) => {
          const payload = e.payload as FallbackTriggeredPayload;
          s.current.updateMode({ sessionId: payload.sessionId, mode: payload.newMode });
          logger.warn(
            `[Terminal] Fallback triggered: ${payload.previousMode} → ${payload.newMode} (${payload.reason})`,
          );
        }),
      );

      // ── Task state events ───────────────────────────────
      unlisteners.push(
        await listen(TERMINAL_EVENTS.TASK_STATE_CHANGED, (e) => {
          s.current.updateTask(e.payload as TerminalTaskState);
        }),
      );

      // ── Agent bridge events ─────────────────────────────
      unlisteners.push(
        await listen(TERMINAL_EVENTS.AGENT_EXEC_STARTED, (e) => {
          logger.info("[Terminal] Agent exec started:", e.payload);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.AGENT_EXEC_COMPLETED, (e) => {
          s.current.storeResult(e.payload as AgentTerminalExecutionResult);
        }),
      );
      unlisteners.push(
        await listen(TERMINAL_EVENTS.AGENT_APPROVAL_REQUIRED, (e) => {
          const payload = e.payload as ApprovalRequiredPayload;
          s.current.enqueueApproval(payload);
          logger.info("[Terminal] Agent approval required:", payload.requestId);
        }),
      );
    }

    subscribe().catch((err: unknown) => {
      logger.warn("[useTerminalEventListener] Failed to subscribe:", err);
    });

    return () => {
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, [ready]); // Only re-subscribe when ready changes — setters accessed via stable ref
}
