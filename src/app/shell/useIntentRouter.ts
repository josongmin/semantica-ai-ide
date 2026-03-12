import { useEffect } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";

import {
  activeTrayViewAtom,
  agentPanelVisibleAtom,
  type SurfaceId,
  trayVisibleAtom,
} from "./model/shellAtoms";
import { navigateAtom } from "./model/surfaceLifecycleAtoms";

// ─── Intent-Driven Surface Routing ──────────────────────
//
// Instead of manually opening panels, declare an intent and
// the UI automatically arranges the optimal layout.

export type IntentKind =
  | "review-changes"
  | "debug-error"
  | "explore-codebase"
  | "run-terminal"
  | "orchestrate-agents"
  | "inspect-graph"
  | "replay-session"
  | "write-code";

interface IntentConfig {
  surface: SurfaceId;
  trayView?: string;
  trayVisible?: boolean;
  agentVisible?: boolean;
}

// ─── Dynamic Intent Registration ───────────────────────

const dynamicIntents = new Map<string, IntentConfig>();

export function registerIntent(kind: string, config: IntentConfig): void {
  dynamicIntents.set(kind, config);
}

const INTENT_MAP: Record<IntentKind, IntentConfig> = {
  "review-changes": {
    surface: "review",
    trayView: "problems",
    trayVisible: true,
    agentVisible: true,
  },
  "debug-error": {
    surface: "editor",
    trayView: "problems",
    trayVisible: true,
    agentVisible: true,
  },
  "explore-codebase": { surface: "graph", agentVisible: false },
  "run-terminal": { surface: "editor", trayView: "terminal", trayVisible: true },
  "orchestrate-agents": { surface: "orchestrator", agentVisible: true },
  "inspect-graph": { surface: "graph", trayView: "output", trayVisible: false },
  "replay-session": {
    surface: "replay",
    trayView: "agent-log",
    trayVisible: true,
    agentVisible: false,
  },
  "write-code": {
    surface: "editor",
    trayView: "terminal",
    trayVisible: false,
    agentVisible: true,
  },
};

/** Current active intent (null = no intent, manual navigation) */
export const activeIntentAtom = atom<IntentKind | null>(null);

/** Dispatch an intent — triggers automatic layout rearrangement */
export const declareIntentAtom = atom(null, (_get, set, intent: IntentKind) => {
  set(activeIntentAtom, intent);
});

/** Clear intent (return to manual navigation) */
export const clearIntentAtom = atom(null, (_get, set) => {
  set(activeIntentAtom, null);
});

/**
 * Reacts to intent changes and morphs the UI layout accordingly.
 * Preserves user overrides — only applies on intent change.
 */
export function useIntentRouter() {
  const intent = useAtomValue(activeIntentAtom);
  const navigate = useSetAtom(navigateAtom);
  const setTrayView = useSetAtom(activeTrayViewAtom);
  const setTrayVisible = useSetAtom(trayVisibleAtom);
  const setAgentPanelVisible = useSetAtom(agentPanelVisibleAtom);

  useEffect(() => {
    if (!intent) return;

    const config = INTENT_MAP[intent];

    // RFC-021 §4: Surface switch via coordinator
    navigate({ surfaceId: config.surface });
    if (config.trayView) setTrayView(config.trayView);
    if (config.trayVisible !== undefined) setTrayVisible(config.trayVisible);
    if (config.agentVisible !== undefined) setAgentPanelVisible(config.agentVisible);
  }, [intent, navigate, setTrayView, setTrayVisible, setAgentPanelVisible]);
}
