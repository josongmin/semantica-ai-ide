/**
 * useTerminalSessions — terminal session lifecycle with tab groups
 *
 * - Creates PTY sessions (Tauri) or mock sessions (browser dev mode)
 * - Auto-creates the first session/tab on mount
 * - `createSession` → new tab with a single session
 * - `createSplitSession` → new session added to the current tab (split)
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
import {
  createTabAtom,
  removeSessionFromTabAtom,
  splitTabAtom,
  tabGroupsAtom,
  visiblePaneIdsAtom,
} from "../../model/splitPaneAtoms";

/** Internal: create a mock session for browser dev mode */
function makeMockSession(): TerminalSession {
  const mockId = `mock_${Date.now().toString(36)}`;
  return {
    id: mockId as TerminalSessionId,
    sessionId: mockId,
    name: "zsh",
    title: "zsh",
    shellType: "zsh",
    pid: 0,
    cwd: "~",
    createdAt: Date.now(),
    status: "running",
    provenance: { source: "user" as const },
    mode: "classic",
    markerSupport: false,
    isActive: true,
  };
}

export function useTerminalSessions() {
  const sessions = useAtomValue(terminalSessionListAtom);
  const activeSessionId = useAtomValue(activeTerminalSessionIdAtom);
  const setActiveSessionId = useSetAtom(activeTerminalSessionIdAtom);
  const upsertSession = useSetAtom(upsertTerminalSessionAtom);
  const bridgeReady = useAtomValue(terminalBridgeReadyAtom);

  const visiblePaneIds = useAtomValue(visiblePaneIdsAtom);
  const tabGroups = useAtomValue(tabGroupsAtom);
  const createTab = useSetAtom(createTabAtom);
  const splitTab = useSetAtom(splitTabAtom);
  const removeSessionFromTab = useSetAtom(removeSessionFromTabAtom);

  /** Create a new session (PTY or mock) and return its ID */
  const spawnSession = useCallback(async (): Promise<TerminalSessionId | null> => {
    try {
      if (bridgeReady) {
        logger.info("[Terminal] Creating PTY session...");
        const session = await createSession({ provenance: { source: "user" } });
        logger.info("[Terminal] PTY session created:", session.sessionId);
        upsertSession(session as unknown as TerminalSession);
        return session.sessionId as TerminalSessionId;
      }
      logger.info("[Terminal] No bridge — creating mock session");
      const mock = makeMockSession();
      upsertSession(mock);
      return mock.sessionId as TerminalSessionId;
    } catch (err) {
      logger.error("[Terminal] Failed to create session:", err);
      return null;
    }
  }, [bridgeReady, upsertSession]);

  /** + button: new session in a new tab */
  const handleCreateSession = useCallback(async () => {
    const id = await spawnSession();
    if (id) createTab(id);
  }, [spawnSession, createTab]);

  /** Split button: new session added to current tab */
  const handleSplitSession = useCallback(async () => {
    const id = await spawnSession();
    if (id) splitTab(id);
  }, [spawnSession, splitTab]);

  // Auto-create first session/tab on mount
  const autoCreated = useRef(false);
  useEffect(() => {
    const canCreate = IS_TAURI ? bridgeReady : true;
    if (tabGroups.length === 0 && !autoCreated.current && canCreate) {
      autoCreated.current = true;
      void handleCreateSession();
    }
  }, [tabGroups.length, handleCreateSession, bridgeReady]);

  // Clean up tab groups when sessions are removed externally
  useEffect(() => {
    const sessionIds = new Set(sessions.map((s) => s.sessionId));
    for (const group of tabGroups) {
      for (const id of group) {
        if (!sessionIds.has(id)) {
          removeSessionFromTab(id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // Fallback: if activeSessionId is stale, fix it
  const validActiveSessionId = useMemo(() => {
    if (sessions.length === 0) return activeSessionId;
    const exists = sessions.some((s) => s.sessionId === activeSessionId);
    return exists
      ? activeSessionId
      : ((sessions[0]?.sessionId ?? activeSessionId) as TerminalSessionId | null);
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (validActiveSessionId !== activeSessionId && validActiveSessionId !== null) {
      setActiveSessionId(validActiveSessionId);
    }
  }, [validActiveSessionId, activeSessionId, setActiveSessionId]);

  return {
    sessions,
    activeSessionId: validActiveSessionId,
    visiblePaneIds,
    tabGroups,
    createSession: handleCreateSession,
    splitSession: handleSplitSession,
  } as const;
}
