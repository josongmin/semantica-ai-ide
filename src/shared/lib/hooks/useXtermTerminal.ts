import { useEffect, useRef, useState } from "react";
import type { FitAddon } from "@xterm/addon-fit";
// ─── Types ────────────────────────────────────────────────
import type { Terminal } from "@xterm/xterm";

import { logger } from "../logger";
import { getVscodeColor } from "../vscodeTheme";

interface XtermModules {
  Terminal: typeof Terminal;
  FitAddon: typeof FitAddon;
}

export interface UseXtermTerminalOptions {
  content: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  fontSize?: number;
  lineHeight?: number;
}

export interface UseXtermTerminalReturn {
  isReady: boolean;
}

// ─── Module-level lazy loader ─────────────────────────────

let xtermPromise: Promise<XtermModules> | null = null;

function loadXterm(): Promise<XtermModules> {
  xtermPromise ??= Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")]).then(
    ([xtermMod, fitMod]) => ({
      Terminal: xtermMod.Terminal,
      FitAddon: fitMod.FitAddon,
    }),
  );
  return xtermPromise;
}

// ─── Theme from VSCode CSS variables ──────────────────────

function buildXtermTheme(): Record<string, string> {
  return {
    background: getVscodeColor("--vscode-editor-background", "#1e1e1e"),
    foreground: getVscodeColor("--vscode-editor-foreground", "#cccccc"),
    cursor: getVscodeColor("--vscode-editorCursor-foreground", "#cccccc"),
    selectionBackground: getVscodeColor("--vscode-editor-selectionBackground", "#264f78"),
    black: getVscodeColor("--vscode-terminal-ansiBlack", "#000000"),
    red: getVscodeColor("--vscode-terminal-ansiRed", "#cd3131"),
    green: getVscodeColor("--vscode-terminal-ansiGreen", "#0dbc79"),
    yellow: getVscodeColor("--vscode-terminal-ansiYellow", "#e5e510"),
    blue: getVscodeColor("--vscode-terminal-ansiBlue", "#2472c8"),
    magenta: getVscodeColor("--vscode-terminal-ansiMagenta", "#bc3fbc"),
    cyan: getVscodeColor("--vscode-terminal-ansiCyan", "#11a8cd"),
    white: getVscodeColor("--vscode-terminal-ansiWhite", "#e5e5e5"),
    brightBlack: getVscodeColor("--vscode-terminal-ansiBrightBlack", "#666666"),
    brightRed: getVscodeColor("--vscode-terminal-ansiBrightRed", "#f14c4c"),
    brightGreen: getVscodeColor("--vscode-terminal-ansiBrightGreen", "#23d18b"),
    brightYellow: getVscodeColor("--vscode-terminal-ansiBrightYellow", "#f5f543"),
    brightBlue: getVscodeColor("--vscode-terminal-ansiBrightBlue", "#3b8eea"),
    brightMagenta: getVscodeColor("--vscode-terminal-ansiBrightMagenta", "#d670d6"),
    brightCyan: getVscodeColor("--vscode-terminal-ansiBrightCyan", "#29b8db"),
    brightWhite: getVscodeColor("--vscode-terminal-ansiBrightWhite", "#e5e5e5"),
  };
}

// ─── Hook ─────────────────────────────────────────────────

/**
 * Manages an xterm.js Terminal lifecycle: creation, content writing, fitting, disposal.
 * The terminal is read-only (no user input).
 */
export function useXtermTerminal({
  content,
  containerRef,
  fontSize = 12,
  lineHeight = 1.4,
}: UseXtermTerminalOptions): UseXtermTerminalReturn {
  const [isReady, setIsReady] = useState(false);
  const terminalRef = useRef<InstanceType<XtermModules["Terminal"]> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !content) {
      setIsReady(false);
      return;
    }

    let disposed = false;
    let terminal: InstanceType<XtermModules["Terminal"]> | null = null;
    let resizeObserver: ResizeObserver | null = null;

    loadXterm()
      .then(({ Terminal, FitAddon }) => {
        if (disposed) return;

        terminal = new Terminal({
          disableStdin: true,
          convertEol: true,
          scrollback: 1000,
          fontSize,
          lineHeight,
          theme: buildXtermTheme(),
          cursorBlink: false,
          cursorStyle: "underline",
        });

        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(container);
        terminal.write(content);

        // Fit after content is written
        try {
          fitAddon.fit();
        } catch {
          /* silently ignore — fitAddon throws if container has zero dimensions (e.g. hidden tab) */
        }

        // Auto-resize on container size change
        resizeObserver = new ResizeObserver(() => {
          try {
            fitAddon.fit();
          } catch {
            /* silently ignore — resize fit can fail when container is detached or collapsed */
          }
        });
        resizeObserver.observe(container);

        terminalRef.current = terminal;
        setIsReady(true);
      })
      .catch((err: unknown) => {
        // xterm failed to load — degrade gracefully but log for debugging
        logger.warn("[useXtermTerminal] failed to load xterm:", err);
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      terminal?.dispose();
      terminalRef.current = null;
      setIsReady(false);
    };
  }, [content, containerRef, fontSize, lineHeight]);

  return { isReady };
}
