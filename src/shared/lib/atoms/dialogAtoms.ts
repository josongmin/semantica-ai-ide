import { atom } from "jotai";

// ─── Modal / Dialog Visibility ──────────────────────────

/** MCP registry browser dialog visibility */
export const mcpRegistryOpenAtom = atom(false);

/** Mode gallery dialog visibility */
export const modeGalleryOpenAtom = atom(false);

/** Playbook market dialog visibility */
export const playbookMarketOpenAtom = atom(false);

/** Demo workflow modal visibility */
export const demoModalOpenAtom = atom(false);

/** Code block picker dialog visibility */
export const codeBlockPickerOpenAtom = atom(false);

/** Commit message generator dialog visibility */
export const commitGenDialogOpenAtom = atom(false);

/** Conversation history search overlay visibility */
export const conversationSearchOpenAtom = atom(false);

/** Activity feed panel visibility (popup) */
export const activityFeedVisibleAtom = atom(false);

/** Rewind panel visibility */
export const rewindPanelOpenAtom = atom(false);

/** Keyboard shortcuts dialog visibility */
export const keyboardShortcutsOpenAtom = atom(false);
