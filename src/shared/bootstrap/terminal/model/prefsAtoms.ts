/**
 * Terminal preferences atoms — mode, panel visibility, and user settings.
 */
import { atom } from "jotai";

// ─── Terminal Mode ─────────────────────────────────────────

export type TerminalMode = "integrated" | "split" | "floating" | "external";
export type TerminalFontSize = "xs" | "sm" | "md" | "lg";
export type TerminalShell = "default" | "bash" | "zsh" | "fish" | "powershell" | "cmd";

/** Current terminal display mode */
export const terminalModeAtom = atom<TerminalMode>("integrated");

/** Whether the terminal panel is visible */
export const terminalPanelVisibleAtom = atom<boolean>(false);

/** Whether the terminal panel is maximized */
export const terminalPanelMaximizedAtom = atom<boolean>(false);

/** Terminal font size preference */
export const terminalFontSizeAtom = atom<TerminalFontSize>("sm");

/** Preferred shell override (null = system default) */
export const terminalShellAtom = atom<TerminalShell>("default");

/** Whether to auto-scroll terminal output to bottom */
export const terminalAutoScrollAtom = atom<boolean>(true);

/** Whether to show line numbers in terminal output */
export const terminalLineNumbersAtom = atom<boolean>(false);

/** Terminal scrollback buffer size (lines) */
export const terminalScrollbackAtom = atom<number>(5000);

// ─── Panel Toggle Writers ──────────────────────────────────

/** Write-only: toggle terminal panel visibility */
export const toggleTerminalPanelAtom = atom(null, (get, set) => {
  set(terminalPanelVisibleAtom, !get(terminalPanelVisibleAtom));
  // Un-maximize when hiding
  if (!get(terminalPanelVisibleAtom)) {
    set(terminalPanelMaximizedAtom, false);
  }
});

/** Write-only: toggle terminal panel maximized state */
export const toggleTerminalMaximizedAtom = atom(null, (get, set) => {
  if (!get(terminalPanelVisibleAtom)) {
    set(terminalPanelVisibleAtom, true);
  }
  set(terminalPanelMaximizedAtom, !get(terminalPanelMaximizedAtom));
});
