/**
 * Terminal atoms — barrel re-export from all sub-modules.
 *
 * Prefer importing from narrower sub-modules for new code:
 *   - "./sessionAtoms"  — session map, active session, session CRUD
 *   - "./taskAtoms"     — task state, task list management
 *   - "./prefsAtoms"    — terminal preferences, mode, panel visibility
 *   - "./derivedAtoms"  — all computed/derived read-only atoms
 */

import { atom } from "jotai";

import { activeTerminalSessionIdAtom as _activeTerminalSessionIdAtom } from "./sessionAtoms";
import type {
  AgentTerminalExecutionResult,
  ApprovalRequiredPayload,
  CompatibilityState,
  OverlayModeChangedPayload,
  ParsedTerminalEvent,
  TerminalCommand,
  TerminalTaskState,
  TerminalUIState,
} from "./types";

// ─── Session atoms ─────────────────────────────────────────
export {
  activeTerminalSessionIdAtom,
  removeTerminalSessionAtom,
  resetTerminalSessionsAtom,
  setTerminalSessionsAtom,
  terminalSessionAtomFamily,
  terminalSessionOrderAtom,
  upsertTerminalSessionAtom,
} from "./sessionAtoms";

// ─── Task atoms ────────────────────────────────────────────
export {
  clearTerminalTasksForSessionAtom,
  resetTerminalTasksAtom,
  setTerminalTaskStatusAtom,
  terminalTaskAtomFamily,
  terminalTaskOrderAtom,
  upsertTerminalTaskAtom,
} from "./taskAtoms";

// ─── Preference atoms ──────────────────────────────────────
export type { TerminalFontSize, TerminalMode, TerminalShell } from "./prefsAtoms";
export {
  terminalAutoScrollAtom,
  terminalFontSizeAtom,
  terminalLineNumbersAtom,
  terminalModeAtom,
  terminalPanelMaximizedAtom,
  terminalPanelVisibleAtom,
  terminalScrollbackAtom,
  terminalShellAtom,
  toggleTerminalMaximizedAtom,
  toggleTerminalPanelAtom,
} from "./prefsAtoms";

// ─── Derived atoms ─────────────────────────────────────────
export {
  activeTerminalSessionAtom,
  allTerminalSessionsAtom,
  busyTerminalSessionsAtom,
  hasApprovalsPendingAtom,
  pendingTerminalTaskCountAtom,
  pendingTerminalTasksAtom,
  tasksForSessionAtom,
  terminalSessionCountAtom,
  terminalStatusSummaryAtom,
} from "./derivedAtoms";

// ─── Legacy / compatibility atoms ──────────────────────────
// These atoms are referenced by terminal lib code (event bus, AI context, etc.)
// but were not originally part of the sub-module split.

/** Map of sessionId → commands for that session */
export const terminalCommandMapAtom = atom<Map<string, TerminalCommand[]>>(new Map());

/** Map of sessionId → parsed events for that session */
export const terminalParsedEventMapAtom = atom<Map<string, ParsedTerminalEvent[]>>(new Map());

/** Map of sessionId → compatibility state */
export const terminalCompatibilityMapAtom = atom<Map<string, CompatibilityState>>(new Map());

/** Map of sessionId → overlay state */
export const terminalOverlayStateMapAtom = atom<Map<string, OverlayModeChangedPayload>>(new Map());

/** Map of requestId → agent execution result */
export const agentTerminalExecutionMapAtom = atom<Map<string, AgentTerminalExecutionResult>>(new Map());

/** Map of sessionId → task state */
export const terminalTaskStateMapAtom = atom<Map<string, TerminalTaskState>>(new Map());

/** Approval queue for agent commands */
export const terminalApprovalQueueAtom = atom<ApprovalRequiredPayload[]>([]);

/** Terminal UI state (panel open, split layout, etc.) */
export const terminalUIStateAtom = atom<TerminalUIState>({
  bottomPanelOpen: false,
  activeTab: "terminal",
  splitLayout: "single",
});

/** Derived: commands for the active session */
export const activeSessionCommandsAtom = atom<TerminalCommand[]>((get) => {
  const id = get(_activeTerminalSessionIdAtom);
  if (!id) return [];
  return get(terminalCommandMapAtom).get(id) ?? [];
});

/** Derived: compatibility state for the active session */
export const activeSessionCompatibilityAtom = atom<CompatibilityState | null>((get) => {
  const id = get(_activeTerminalSessionIdAtom);
  if (!id) return null;
  return get(terminalCompatibilityMapAtom).get(id) ?? null;
});

/** Derived: whether overlay is enabled for the active session */
export const activeSessionOverlayEnabledAtom = atom<boolean>((get) => {
  const id = get(_activeTerminalSessionIdAtom);
  if (!id) return false;
  const compat = get(terminalCompatibilityMapAtom).get(id);
  return compat?.overlayEnabled ?? false;
});

// ─── Write atoms (used by event bus / event listeners) ─────

/** Append a command to the command map for a session */
export const appendTerminalCommandAtom = atom(null, (get, set, cmd: TerminalCommand) => {
  const map = new Map(get(terminalCommandMapAtom));
  const list = [...(map.get(cmd.sessionId) ?? []), cmd];
  map.set(cmd.sessionId, list);
  set(terminalCommandMapAtom, map);
});

/** Update an existing command (e.g., when completed) */
export const updateTerminalCommandAtom = atom(null, (get, set, cmd: TerminalCommand) => {
  const map = new Map(get(terminalCommandMapAtom));
  const list = (map.get(cmd.sessionId) ?? []).map((c) => (c.commandId === cmd.commandId ? cmd : c));
  map.set(cmd.sessionId, list);
  set(terminalCommandMapAtom, map);
});

/** Append a parsed event to the parsed event map */
export const appendParsedEventAtom = atom(null, (get, set, evt: ParsedTerminalEvent) => {
  const map = new Map(get(terminalParsedEventMapAtom));
  const list = [...(map.get(evt.sessionId) ?? []), evt];
  map.set(evt.sessionId, list);
  set(terminalParsedEventMapAtom, map);
});

/** Mark a session as exited */
export const markSessionExitedAtom = atom(null, (_get, _set, _payload: { sessionId: string; status: string; exitCode?: number }) => {
  // Session status update handled by sessionAtoms upsert
});

/** Update CWD for a session */
export const updateSessionCwdAtom = atom(null, (_get, _set, _payload: { sessionId: string; cwd: string }) => {
  // CWD update handled by sessionAtoms upsert
});

/** Update mode for a session */
export const updateSessionModeAtom = atom(null, (_get, _set, _payload: { sessionId: string; mode: string }) => {
  // Mode update handled by sessionAtoms upsert
});

/** Update task state */
export const updateTaskStateAtom = atom(null, (get, set, task: TerminalTaskState) => {
  const map = new Map(get(terminalTaskStateMapAtom));
  map.set(task.sessionId, task);
  set(terminalTaskStateMapAtom, map);
});

/** Update compatibility state */
export const updateCompatibilityAtom = atom(null, (get, set, compat: CompatibilityState) => {
  const map = new Map(get(terminalCompatibilityMapAtom));
  map.set(compat.sessionId, compat);
  set(terminalCompatibilityMapAtom, map);
});

/** Update overlay state */
export const updateOverlayStateAtom = atom(null, (get, set, overlay: OverlayModeChangedPayload) => {
  const map = new Map(get(terminalOverlayStateMapAtom));
  map.set(overlay.sessionId, overlay);
  set(terminalOverlayStateMapAtom, map);
});

/** Enqueue an approval request */
export const enqueueApprovalAtom = atom(null, (get, set, payload: ApprovalRequiredPayload) => {
  set(terminalApprovalQueueAtom, [...get(terminalApprovalQueueAtom), payload]);
});

/** Dequeue (remove) an approval request */
export const dequeueApprovalAtom = atom(null, (get, set, requestId: string) => {
  set(terminalApprovalQueueAtom, get(terminalApprovalQueueAtom).filter((a) => a.requestId !== requestId));
});

/** Store agent execution result */
export const storeAgentExecutionResultAtom = atom(null, (get, set, result: AgentTerminalExecutionResult) => {
  const map = new Map(get(agentTerminalExecutionMapAtom));
  map.set(result.requestId, result);
  set(agentTerminalExecutionMapAtom, map);
});

/** Alias for backward compat: reset both sessions and tasks */
export { resetTerminalSessionsAtom as resetTerminalStoreAtom } from "./sessionAtoms";

/** Alias: running session count → session count */
export { terminalSessionCountAtom as runningSessionCountAtom } from "./derivedAtoms";

/** Alias: session list → all terminal sessions */
export { allTerminalSessionsAtom as terminalSessionListAtom } from "./derivedAtoms";

/** Alias: session map → session atom family (for backward compat) */
export { terminalSessionAtomFamily as terminalSessionMapAtom } from "./sessionAtoms";

/** Bridge readiness flag */
export const terminalBridgeReadyAtom = atom<boolean>(false);
