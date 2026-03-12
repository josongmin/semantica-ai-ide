/**
 * Terminal AI Atoms — RFC-TERMINAL-016
 *
 * State atoms for AI terminal intelligence features:
 * context, ghost text, explain, and command input.
 */

import { atom } from "jotai";

import {
  activeSessionCommandsAtom,
  activeTerminalSessionAtom,
  terminalParsedEventMapAtom,
} from "./atoms";
import type { DiagnosticEvent, ShellType } from "./types";

// ─── AI Context ──────────────────────────────────────────

export interface TerminalAIContext {
  readonly cwd: string;
  readonly shellType: ShellType;
  readonly recentCommands: string[];
  readonly projectType?: string;
  readonly packageManager?: string;
  readonly availableScripts?: string[];
  readonly gitBranch?: string;
  readonly openFiles?: string[];
  readonly lastErrors?: DiagnosticEvent[];
}

// ─── Scripts Atom ────────────────────────────────────────

export interface TerminalScriptsState {
  readonly packageManager: string;
  readonly scripts: string[];
}

/**
 * Writable atom for available package.json scripts.
 * Populated externally (e.g., from reading package.json via Tauri).
 */
export const terminalScriptsAtom = atom<TerminalScriptsState | null>(null);

// ─── Derived AI Context ─────────────────────────────────

/** Aggregated context for AI features — feeds ghost text, explain, and command input */
export const terminalAIContextAtom = atom((get): TerminalAIContext | null => {
  const session = get(activeTerminalSessionAtom);
  if (!session) return null;

  const commands = get(activeSessionCommandsAtom);
  const recentCommands = commands.slice(-20).map((c) => c.command);

  const parsedEventMap = get(terminalParsedEventMapAtom);
  const sid = session.sessionId;
  const events = parsedEventMap.get(sid) ?? [];
  const lastErrors = events
    .filter((e) => e.kind === "diagnostic" && (e.data as DiagnosticEvent).severity === "error")
    .map((e) => e.data as DiagnosticEvent)
    .slice(-10);

  const scriptsState = get(terminalScriptsAtom);

  return {
    cwd: session.cwd,
    shellType: session.shellType as ShellType,
    recentCommands,
    packageManager: scriptsState?.packageManager,
    availableScripts: scriptsState?.scripts,
    lastErrors: lastErrors.length > 0 ? lastErrors : undefined,
  };
});

// ─── Ghost Text ──────────────────────────────────────────

export interface GhostTextState {
  readonly sessionId: string;
  readonly text: string;
  readonly source: "history" | "ai" | "script";
}

export const terminalGhostTextAtom = atom<GhostTextState | null>(null);

// ─── AI Command Input (Cmd+I) ────────────────────────────

export interface AICommandInputState {
  readonly visible: boolean;
  readonly query: string;
  readonly loading: boolean;
  readonly result: {
    readonly command: string;
    readonly explanation: string;
    readonly confidence: number;
    readonly alternatives?: string[];
  } | null;
}

export const terminalAICommandInputAtom = atom<AICommandInputState>({
  visible: false,
  query: "",
  loading: false,
  result: null,
});

// ─── AI Explain ──────────────────────────────────────────

export interface ExplainState {
  readonly commandId: string;
  readonly loading: boolean;
  readonly result: {
    readonly explanation: string;
    readonly suggestedFix?: string;
    readonly canAutoFix: boolean;
  } | null;
}

export const terminalExplainAtom = atom<ExplainState | null>(null);

// ─── Write Atoms ─────────────────────────────────────────

export const showAICommandInputAtom = atom(null, (_get, set) => {
  set(terminalAICommandInputAtom, (prev) => ({
    ...prev,
    visible: true,
    query: "",
    result: null,
  }));
});

export const hideAICommandInputAtom = atom(null, (_get, set) => {
  set(terminalAICommandInputAtom, (prev) => ({
    ...prev,
    visible: false,
    loading: false,
  }));
});

export const dismissExplainAtom = atom(null, (_get, set) => {
  set(terminalExplainAtom, null);
});

// ─── AI Inline Mode (##ai) ──────────────────────────────

export type AIInlineIntent = "ask" | "fix" | "explain";

export const AI_INLINE_PREFIX: Record<AIInlineIntent, string> = {
  ask: "##ai",
  fix: "##ai-fix",
  explain: "##ai-explain",
};

export interface AIInlineModeState {
  readonly active: boolean;
  readonly intent: AIInlineIntent;
  readonly query: string;
  readonly loading: boolean;
  readonly result: {
    readonly command: string;
    readonly explanation: string;
    readonly confidence: number;
    readonly alternatives?: string[];
  } | null;
  /** Pixel position of the terminal cursor when mode was entered */
  readonly anchorPosition: { x: number; y: number } | null;
}

export const terminalAIInlineModeAtom = atom<AIInlineModeState>({
  active: false,
  intent: "ask",
  query: "",
  loading: false,
  result: null,
  anchorPosition: null,
});

/** Submit an AI inline query (triggered by Enter after ##ai ...) */
export const submitAIInlineQueryAtom = atom(
  null,
  (
    _get,
    set,
    payload: {
      intent: AIInlineIntent;
      query: string;
      anchorPosition: { x: number; y: number } | null;
    },
  ) => {
    set(terminalAIInlineModeAtom, {
      active: true,
      intent: payload.intent,
      query: payload.query,
      loading: true,
      result: null,
      anchorPosition: payload.anchorPosition,
    });
  },
);

/** Set AI inline result (called by AI suggestion hook) */
export const setAIInlineResultAtom = atom(
  null,
  (
    _get,
    set,
    result: {
      command: string;
      explanation: string;
      confidence: number;
      alternatives?: string[];
    },
  ) => {
    set(terminalAIInlineModeAtom, (prev) => ({
      ...prev,
      loading: false,
      result,
    }));
  },
);

/** Exit AI inline mode */
export const exitAIInlineModeAtom = atom(null, (_get, set) => {
  set(terminalAIInlineModeAtom, (prev) => ({
    ...prev,
    active: false,
    loading: false,
    result: null,
  }));
});

// ─── Command Search (Cmd+K) ─────────────────────────────

/** Whether the terminal command search overlay is visible */
export const terminalCommandSearchVisibleAtom = atom(false);
