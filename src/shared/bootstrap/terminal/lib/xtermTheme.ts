/**
 * xterm.js Theme Binding — CSS Custom Properties → ITheme
 *
 * Reads CSS variables at runtime and produces an xterm-compatible theme object.
 * Uses the project's existing getVscodeColor utility for safe reads with fallbacks.
 *
 * Tokyo Night Storm defaults match index.css (--color-vsc-*).
 */

import { getVscodeColor } from "~shared/lib/vscodeTheme";

export interface XtermThemeColors {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  selectionForeground: string;
  selectionInactiveBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

// ─── Tokyo Night Storm Defaults ────────────────────────────

const TOKYO_NIGHT = {
  background: "#1a1b26",
  foreground: "#a9b1d6",
  cursor: "#c0caf5",
  cursorAccent: "#1a1b26",
  selectionBackground: "#33467c",
  selectionForeground: "#c0caf5",
  selectionInactiveBackground: "#33467c80",
  black: "#15161e",
  red: "#f7768e",
  green: "#9ece6a",
  yellow: "#e0af68",
  blue: "#7aa2f7",
  magenta: "#bb9af7",
  cyan: "#7dcfff",
  white: "#a9b1d6",
  brightBlack: "#414868",
  brightRed: "#f7768e",
  brightGreen: "#9ece6a",
  brightYellow: "#e0af68",
  brightBlue: "#7aa2f7",
  brightMagenta: "#bb9af7",
  brightCyan: "#7dcfff",
  brightWhite: "#c0caf5",
} as const;

// ─── Build Theme ───────────────────────────────────────────

/** Read app theme token first, then VSCode token, then hardcoded fallback. */
function tc(appToken: string, vscodeToken: string, fallback: string): string {
  return getVscodeColor(appToken, "") || getVscodeColor(vscodeToken, "") || fallback;
}

/**
 * Build an xterm.js ITheme from CSS custom properties.
 * Reads --color-vsc-* (app theme) first → --vscode-terminal-* (VSCode) → Tokyo Night fallback.
 */
export function buildXtermTheme(): XtermThemeColors {
  cachedTheme = null; // Invalidate cache so next cachedXtermTheme() call rebuilds
  return buildXtermThemeInner();
}

function buildXtermThemeInner(): XtermThemeColors {
  return {
    background: tc("--color-vsc-bg", "--vscode-terminal-background", TOKYO_NIGHT.background),
    foreground: tc("--color-vsc-fg", "--vscode-terminal-foreground", TOKYO_NIGHT.foreground),
    cursor: tc("--color-vsc-accent", "--vscode-terminalCursor-foreground", TOKYO_NIGHT.cursor),
    cursorAccent: tc("--color-vsc-bg", "--vscode-terminalCursor-background", TOKYO_NIGHT.cursorAccent),
    selectionBackground: tc("--color-vsc-selection", "--vscode-terminal-selectionBackground", TOKYO_NIGHT.selectionBackground),
    selectionForeground: getVscodeColor("--vscode-terminal-selectionForeground", TOKYO_NIGHT.selectionForeground),
    selectionInactiveBackground: getVscodeColor("--vscode-terminal-inactiveSelectionBackground", TOKYO_NIGHT.selectionInactiveBackground),
    black: getVscodeColor("--vscode-terminal-ansiBlack", TOKYO_NIGHT.black),
    red: tc("--color-vsc-error", "--vscode-terminal-ansiRed", TOKYO_NIGHT.red),
    green: tc("--color-vsc-success", "--vscode-terminal-ansiGreen", TOKYO_NIGHT.green),
    yellow: tc("--color-vsc-warning", "--vscode-terminal-ansiYellow", TOKYO_NIGHT.yellow),
    blue: tc("--color-vsc-link", "--vscode-terminal-ansiBlue", TOKYO_NIGHT.blue),
    magenta: getVscodeColor("--vscode-terminal-ansiMagenta", TOKYO_NIGHT.magenta),
    cyan: tc("--color-vsc-info", "--vscode-terminal-ansiCyan", TOKYO_NIGHT.cyan),
    white: tc("--color-vsc-fg", "--vscode-terminal-ansiWhite", TOKYO_NIGHT.white),
    brightBlack: tc("--color-vsc-text-ghost", "--vscode-terminal-ansiBrightBlack", TOKYO_NIGHT.brightBlack),
    brightRed: tc("--color-vsc-error", "--vscode-terminal-ansiBrightRed", TOKYO_NIGHT.brightRed),
    brightGreen: tc("--color-vsc-success", "--vscode-terminal-ansiBrightGreen", TOKYO_NIGHT.brightGreen),
    brightYellow: tc("--color-vsc-warning", "--vscode-terminal-ansiBrightYellow", TOKYO_NIGHT.brightYellow),
    brightBlue: tc("--color-vsc-link", "--vscode-terminal-ansiBrightBlue", TOKYO_NIGHT.brightBlue),
    brightMagenta: getVscodeColor("--vscode-terminal-ansiBrightMagenta", TOKYO_NIGHT.brightMagenta),
    brightCyan: tc("--color-vsc-info", "--vscode-terminal-ansiBrightCyan", TOKYO_NIGHT.brightCyan),
    brightWhite: getVscodeColor("--vscode-terminal-ansiBrightWhite", TOKYO_NIGHT.brightWhite),
  };
}

// ─── Cached Theme (for session mounts — avoids redundant CSS reads) ──

let cachedTheme: XtermThemeColors | null = null;

/** Returns cached theme; builds once per app lifecycle (invalidated by buildXtermTheme). */
export function cachedXtermTheme(): XtermThemeColors {
  cachedTheme ??= buildXtermThemeInner();
  return cachedTheme;
}
