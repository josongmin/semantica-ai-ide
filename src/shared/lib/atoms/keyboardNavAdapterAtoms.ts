/**
 * Keyboard-navigation adapter atoms.
 *
 * These constants and the hook adapter live in shared/ so widgets never
 * need to import from features/keyboard-navigation directly.
 */

import { atom } from "jotai";

// ─── Custom DOM event names ─────────────────────────────────
// Previously exported from features/keyboard-navigation.
export const COPY_CONVERSATION_EVENT = "app:copy-conversation";
export const OPEN_COMMAND_PALETTE_EVENT = "app:open-command-palette";
export const FOCUS_PROMPT_EVENT = "app:focus-prompt";

// ─── Hook adapter ───────────────────────────────────────────
// The hook itself (`useKeyboardNavigation`) has a dependency on entity-layer
// atoms, so we cannot simply copy it here.  Instead we expose a slot that the
// feature writes to, and widget code reads.

export type KeyboardNavAdapter = (options: {
  scrollToIndex: (index: number) => void;
}) => { focusedIndex: number };

/**
 * Populated by `features/keyboard-navigation` at bootstrap.
 * Widgets call `useAtomValue(keyboardNavAdapterAtom)` and invoke the
 * returned function in place of `useKeyboardNavigation(...)`.
 */
export const keyboardNavAdapterAtom = atom<KeyboardNavAdapter | null>(null);
