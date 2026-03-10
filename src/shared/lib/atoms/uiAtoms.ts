import { atom } from "jotai";

import type {
  MessageId,
  ModelInfo,
  SessionListEntry,
  ToolCategory,
  TurnId,
} from "../../protocol";
import { resetAttachmentAtomsAtom } from "./attachmentAtoms";
import { resetOverlayAtomsAtom } from "./overlayAtoms";
import { resetPanelAtomsAtom } from "./panelAtoms";
import { registerResetAtom } from "./resetRegistry";
import { resetToastAtomsAtom } from "./toastAtoms";

// ─── View Mode Atoms ──────────────────────────────────────

/** Diff viewer mode: inline (default) or side-by-side */
export type DiffViewMode = "inline" | "side-by-side";
export const diffViewModeAtom = atom<DiffViewMode>("inline");

/** File change view mode: list (default) or tree */
export type FileViewMode = "list" | "tree";
export const fileViewModeAtom = atom<FileViewMode>("list");

/** Tool category filter: empty set = show all */
export const toolCategoryFilterAtom = atom<ReadonlySet<ToolCategory>>(new Set<ToolCategory>());

// ─── Navigation & Pages ──────────────────────────────────

/** Currently focused turn index for keyboard navigation (-1 = none) */
export const focusedTurnIndexAtom = atom(-1);

/** Current page: chat, sessions, arena, review, todos, or settings */
export type PageId = "chat" | "sessions" | "arena" | "review" | "todos" | "settings";
export const currentPageAtom = atom<PageId>("chat");

// ─── TODO Board UI State ─────────────────────────────────

export type TodoSortKey = "date" | "priority" | "status";
export type TodoFilterStatus = "all" | "pending" | "in_progress" | "completed" | "failed";

export const todoBoardSearchAtom = atom("");
export const todoBoardSortAtom = atom<TodoSortKey>("date");
export const todoBoardFilterAtom = atom<TodoFilterStatus>("all");

// ─── Session List ────────────────────────────────────────

/** Session list entries (populated by host) */
export const sessionListAtom = atom<readonly SessionListEntry[]>([]);

/** Write atom to replace the session list */
export const setSessionListAtom = atom(null, (_get, set, sessions: readonly SessionListEntry[]) => {
  set(sessionListAtom, sessions);
});

// ─── Available Models ───────────────────────────────────

/** List of models available for switching */
export const availableModelsAtom = atom<readonly ModelInfo[]>([]);

/** Write atom to replace the available models list */
export const setAvailableModelsAtom = atom(null, (_get, set, models: readonly ModelInfo[]) => {
  set(availableModelsAtom, models);
});

// ─── Thinking / Fast Mode ────────────────────────────────

/** Whether thinking mode is enabled */
export const thinkingModeAtom = atom(false);

/** Whether fast mode is enabled */
export const fastModeAtom = atom(false);

// ─── Workspace Name ──────────────────────────────────────

/** Workspace / project folder name (e.g. "semantica-code-agent-plugin") */
export const workspaceNameAtom = atom("");

// ─── Project Files (for @mention) ────────────────────────

/** Project file paths for @mention autocomplete */
export const projectFilesAtom = atom<readonly string[]>([]);

/** Write atom to replace project files list */
export const setProjectFilesAtom = atom(null, (_get, set, files: readonly string[]) => {
  set(projectFilesAtom, files);
});

// ─── Message Editing ────────────────────────────────────

/** ID of the user message currently being edited (null = none) */
export const editingMessageIdAtom = atom<MessageId | null>(null);


/** File tree panel visibility */
export const fileTreePanelVisibleAtom = atom(false);

// ─── Symbol Panel ───────────────────────────────────────

/** Symbol panel visibility */
export const symbolPanelVisibleAtom = atom(false);

// ─── Turn Anchor / Focus ─────────────────────────────────

/** The turn ID that should be scrolled to and highlighted */
export const focusedTurnIdAtom = atom<TurnId | null>(null);

/** Auto-clear focused turn after highlight animation (debounced 2 s) */
let _clearFocusTimer: ReturnType<typeof setTimeout> | null = null;
export const clearFocusedTurnAtom = atom(null, (_get, set) => {
  if (_clearFocusTimer !== null) clearTimeout(_clearFocusTimer);
  _clearFocusTimer = setTimeout(() => set(focusedTurnIdAtom, null), 2000);
});

// ─── Prompt Pre-fill ─────────────────────────────────────

/** Text to pre-fill into the prompt box (consumed once, then cleared) */
export const promptPrefillAtom = atom<string | null>(null);

// ─── Quick File Open (Cmd+P) ────────────────────────────

/** Whether the quick file open palette is visible */
export const filePickerOpenAtom = atom(false);

// ─── Scope Guard Dialog ─────────────────────────────────

/** Whether the scope guard dialog is open */
export const scopeGuardDialogOpenAtom = atom(false);

// ─── HITL Approval Atoms ─────────────────────────────────

/** Tool call ID currently awaiting dangerous approval dialog (null = no dialog) */
export const dangerousApprovalToolCallIdAtom = atom<string | null>(null);

/** Whether the permission settings dialog is open */
export const permissionSettingsOpenAtom = atom(false);

/** Whether the completion settings dialog is open */
export const completionSettingsOpenAtom = atom(false);

// ─── Reset UI Store ─────────────────────────────────────

/** Reset all transient UI state on session switch (called by RESET_STORES) */
export const resetUiStoreAtom = atom(null, (_get, set) => {
  // Delegate to per-module reset atoms (DIP: each module owns its own reset)
  set(resetPanelAtomsAtom);
  set(resetToastAtomsAtom);
  set(resetOverlayAtomsAtom);
  set(resetAttachmentAtomsAtom);

  // Reset atoms local to this module
  set(diffViewModeAtom, "inline" as DiffViewMode);
  set(fileViewModeAtom, "list" as FileViewMode);
  set(toolCategoryFilterAtom, new Set<ToolCategory>());
  set(focusedTurnIndexAtom, -1);
  set(editingMessageIdAtom, null);
  set(fileTreePanelVisibleAtom, false);
  set(symbolPanelVisibleAtom, false);
  set(todoBoardSearchAtom, "");
  set(todoBoardSortAtom, "date" as TodoSortKey);
  set(todoBoardFilterAtom, "all" as TodoFilterStatus);
  set(dangerousApprovalToolCallIdAtom, null);
  set(permissionSettingsOpenAtom, false);
  set(scopeGuardDialogOpenAtom, false);
  set(focusedTurnIdAtom, null);
  set(completionSettingsOpenAtom, false);
});

registerResetAtom(resetUiStoreAtom);
