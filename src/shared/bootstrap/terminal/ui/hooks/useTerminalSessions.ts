/**
 * useTerminalSessions — extracted from TerminalPanel
 *
 * Manages terminal session lifecycle:
 * - Reads session list and active session from atoms
 * - Creates PTY sessions (Tauri) or mock sessions (browser dev mode)
 * - Auto-creates the first session on mount when bridge is ready
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { IS_TAURI } from "~shared/lib/hooks/usePlatform";
import { logger } from "~shared/lib/logger";
import type { TerminalSessionId } from "~shared/protocol/types/core";
import type { TerminalSession } from "~shared/protocol/types/terminal";

import { createSession } from "../../lib/tauriTerminalBridge";
import {
  activeTerminalSessionIdAtom,
  terminalBridgeReadyAtom,
  terminalSessionListAtom,
  upsertTerminalSessionAtom,
} from "../../model/atoms";

export function useTerminalSessions() {
  const sessions = useAtomValue(terminalSessionListAtom);
  const activeSessionId = useAtomValue(activeTerminalSessionIdAtom);
  const setActiveSessionId = useSetAtom(activeTerminalSessionIdAtom);
  const upsertSession = useSetAtom(upsertTerminalSessionAtom);
  const bridgeReady = useAtomValue(terminalBridgeReadyAtom);

  const handleCreateSession = useCallback(async () => {
    try {
      if (bridgeReady) {
        // Tauri mode: create real PTY session via Rust backend
        logger.info("[TerminalPanel] Creating PTY session...");
        const session = await createSession({
          provenance: { source: "user" },
        });
        logger.info("[TerminalPanel] PTY session created:", session.sessionId);
        upsertSession(session as unknown as TerminalSession);
        setActiveSessionId(session.sessionId as TerminalSessionId);
      } else {
        // Browser dev mode: mock session for UI testing (no PTY backend)
        logger.info("[TerminalPanel] No bridge — creating mock session for UI testing");
        const mockId = `mock_${Date.now().toString(36)}`;
        const mockSession: TerminalSession = {
          id: mockId as TerminalSessionId,
          sessionId: mockId,
          name: "Mock Terminal — browser dev mode",
          title: "Mock Terminal — browser dev mode",
          shellType: "unknown",
          pid: 0,
          cwd: "~",
          createdAt: Date.now(),
          status: "running",
          provenance: { source: "user" as const },
          mode: "classic",
          markerSupport: false,
          isActive: true,
        };
        upsertSession(mockSession);
        setActiveSessionId(mockId as TerminalSessionId);
      }
    } catch (err) {
      logger.error("[TerminalPanel] Failed to create session:", err);
    }
  }, [upsertSession, setActiveSessionId, bridgeReady]);

  // Auto-create first session once bridge is ready.
  // bridgeReady atom is reactive — re-triggers when bootstrap completes,
  // even if this component mounted before the bridge was initialized.
  const autoCreated = useRef(false);
  useEffect(() => {
    const canCreate = IS_TAURI ? bridgeReady : true;
    if (sessions.length === 0 && !autoCreated.current && canCreate) {
      autoCreated.current = true;
      void handleCreateSession();
    }
  }, [sessions.length, handleCreateSession, bridgeReady]);

  // Fallback: if activeSessionId references a non-existent session, use the first available
  const validActiveSessionId = useMemo(() => {
    if (sessions.length === 0) return activeSessionId;
    const exists = sessions.some((s) => s.sessionId === activeSessionId);
    return exists ? activeSessionId : ((sessions[0]?.sessionId ?? activeSessionId) as TerminalSessionId | null);
  }, [sessions, activeSessionId]);

  // Sync atom when fallback kicks in
  useEffect(() => {
    if (validActiveSessionId !== activeSessionId && validActiveSessionId !== null) {
      setActiveSessionId(validActiveSessionId);
    }
  }, [validActiveSessionId, activeSessionId, setActiveSessionId]);

  return {
    sessions,
    activeSessionId: validActiveSessionId,
    createSession: handleCreateSession,
  } as const;
}
