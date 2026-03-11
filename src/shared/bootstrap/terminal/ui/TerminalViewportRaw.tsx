/**
 * TerminalViewportRaw — RFC-TERMINAL-005 §11.2
 *
 * The z-0 raw xterm.js viewport. This is THE core terminal rendering surface.
 * It mounts an interactive xterm.js terminal connected to a Rust PTY via Tauri IPC.
 *
 * Key properties:
 * - Full PTY stdin/stdout (NOT read-only)
 * - Auto-fit on container resize
 * - Theme-aware via CSS custom properties
 * - Lazy-loads xterm.js + addons
 * - Reports resize back to Rust PTY via resizePty()
 * - Exposes imperative handle for search + scroll
 */

import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { FitAddon } from "@xterm/addon-fit";
import type { ISearchOptions, SearchAddon } from "@xterm/addon-search";
import type { Terminal } from "@xterm/xterm";
import { useAtomValue } from "jotai";

import { logger } from "~shared/lib/logger";
import { cn } from "~shared/ui/variants";

import { isTerminalBridgeReady, resizePty, writeToPty } from "../lib/tauriTerminalBridge";
import { getTerminalListenFn } from "../lib/useTerminalEventListener";
import { cachedXtermTheme } from "../lib/xtermTheme";
import { activeSessionCompatibilityAtom } from "../model/atoms";
import { TERMINAL_EVENTS, type TerminalOutputPayload } from "../model/events";

// ─── Lazy loader (singleton) ───────────────────────────────

interface XtermModules {
  Terminal: typeof Terminal;
  FitAddon: typeof FitAddon;
  SearchAddon: typeof SearchAddon;
}

let xtermPromise: Promise<XtermModules> | null = null;

function loadXterm(): Promise<XtermModules> {
  xtermPromise ??= Promise.all([
    import("@xterm/xterm"),
    import("@xterm/addon-fit"),
    import("@xterm/addon-search"),
  ]).then(([xtermMod, fitMod, searchMod]) => ({
    Terminal: xtermMod.Terminal,
    FitAddon: fitMod.FitAddon,
    SearchAddon: searchMod.SearchAddon,
  }));
  return xtermPromise;
}

// ─── Props + Handle ─────────────────────────────────────────

export interface TerminalViewportRawProps {
  /** Session ID to connect to. If null, renders empty. */
  sessionId: string | null;
  /** Optional additional classes on the container */
  className?: string;
  /** Font size in px (default: 13) */
  fontSize?: number;
  /** Line height (default: 1.35) */
  lineHeight?: number;
  /** Scrollback lines (default: 5000) */
  scrollback?: number;
  /** Called when search results change (from SearchAddon.onDidChangeResults) */
  onSearchResults?: (results: { resultIndex: number; resultCount: number }) => void;
  /** Called when user scrolls — reports whether viewport is at the bottom */
  onScroll?: (isAtBottom: boolean) => void;
  /** Called with each keystroke input for ghost text matching */
  onInput?: (data: string) => void;
}

/** Imperative handle for parent access to search + scroll */
export interface TerminalViewportRawHandle {
  search(query: string, options?: ISearchOptions): boolean;
  searchNext(): boolean;
  searchPrevious(): boolean;
  clearSearch(): void;
  scrollToLine(line: number): void;
}

// ─── Component ─────────────────────────────────────────────

export const TerminalViewportRaw = memo(
  forwardRef<TerminalViewportRawHandle, TerminalViewportRawProps>(function TerminalViewportRaw(
    {
      sessionId,
      className,
      fontSize = 13,
      lineHeight = 1.35,
      scrollback = 5000,
      onSearchResults,
      onScroll,
      onInput,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<InstanceType<typeof Terminal> | null>(null);
    const fitAddonRef = useRef<InstanceType<typeof FitAddon> | null>(null);
    const searchAddonRef = useRef<InstanceType<typeof SearchAddon> | null>(null);
    const [, setIsReady] = useState(false);

    const compatibility = useAtomValue(activeSessionCompatibilityAtom);

    // ─── Imperative handle ──────────────────────────────────
    // Track last search query for next/previous navigation
    const lastSearchQueryRef = useRef("");
    const lastSearchOptionsRef = useRef<ISearchOptions | undefined>();

    useImperativeHandle(
      ref,
      () => ({
        search(query: string, options?: ISearchOptions) {
          if (!searchAddonRef.current) return false;
          lastSearchQueryRef.current = query;
          lastSearchOptionsRef.current = options;
          return searchAddonRef.current.findNext(query, options);
        },
        searchNext() {
          if (!searchAddonRef.current) return false;
          return searchAddonRef.current.findNext(
            lastSearchQueryRef.current,
            lastSearchOptionsRef.current,
          );
        },
        searchPrevious() {
          if (!searchAddonRef.current) return false;
          return searchAddonRef.current.findPrevious(
            lastSearchQueryRef.current,
            lastSearchOptionsRef.current,
          );
        },
        clearSearch() {
          searchAddonRef.current?.clearDecorations();
          lastSearchQueryRef.current = "";
        },
        scrollToLine(line: number) {
          terminalRef.current?.scrollToLine(line);
        },
      }),
      [],
    );

    // ─── xterm lifecycle ───────────────────────────────────
    useEffect(() => {
      const container = containerRef.current;
      if (!container || !sessionId) {
        setIsReady(false);
        return;
      }

      let disposed = false;
      let terminal: InstanceType<typeof Terminal> | null = null;
      let fitAddon: InstanceType<typeof FitAddon> | null = null;
      let searchAddon: InstanceType<typeof SearchAddon> | null = null;
      let resizeObserver: ResizeObserver | null = null;
      let fitRafId = 0;
      // Disposables from xterm event subscriptions
      const disposables: { dispose(): void }[] = [];
      // Output listener (async — needs race-safe cleanup)
      let outputUnlisten: (() => void) | null = null;
      // WebSocket PTY for browser dev mode
      let mockWs: WebSocket | null = null;

      loadXterm()
        .then(
          ({ Terminal: TerminalCtor, FitAddon: FitAddonCtor, SearchAddon: SearchAddonCtor }) => {
            if (disposed) return;

            terminal = new TerminalCtor({
              disableStdin: false,
              convertEol: true,
              scrollback,
              fontSize,
              lineHeight,
              theme: cachedXtermTheme(),
              cursorBlink: true,
              cursorStyle: "bar",
              cursorWidth: 2,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              allowProposedApi: true,
            });

            fitAddon = new FitAddonCtor();
            searchAddon = new SearchAddonCtor();
            terminal.loadAddon(fitAddon);
            terminal.loadAddon(searchAddon);
            terminal.open(container);

            // Initial fit
            try {
              fitAddon.fit();
            } catch {
              /* container may have zero dimensions */
            }

            // Mock session: connect via WebSocket PTY (browser dev mode)
            const isMock = sessionId.startsWith("mock_");
            const term = terminal; // non-null capture for closures

            if (isMock) {
              try {
                const dims = fitAddon.proposeDimensions();
                const cols = dims?.cols ?? 80;
                const rows = dims?.rows ?? 24;
                const wsUrl = `ws://${window.location.host}/__pty?cols=${cols}&rows=${rows}`;
                mockWs = new WebSocket(wsUrl);

                mockWs.onmessage = (ev: MessageEvent) => {
                  if (typeof ev.data === "string") {
                    term.write(ev.data);
                  }
                };

                mockWs.onerror = () => {
                  term.writeln("\x1b[1;31m[pty-ws] WebSocket connection failed.\x1b[0m");
                  term.writeln(
                    "\x1b[33mMake sure vite dev server is running with ptyDevServer plugin.\x1b[0m",
                  );
                };

                mockWs.onclose = () => {
                  term.writeln("\r\n\x1b[2m[pty-ws] Connection closed.\x1b[0m");
                };
              } catch {
                term.writeln("\x1b[1;31m[pty-ws] Failed to create WebSocket.\x1b[0m");
              }
            }

            // Send keystrokes to PTY (real mode) or WebSocket (mock mode)
            const ws = mockWs; // Capture for closure
            disposables.push(
              terminal.onData((data: string) => {
                if (isMock && ws) {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                  }
                } else if (sessionId && isTerminalBridgeReady()) {
                  writeToPty(sessionId, data).catch((err: unknown) => {
                    logger.warn("[TerminalViewportRaw] write error:", err);
                  });
                }
                // Notify parent for ghost text matching
                onInput?.(data);
              }),
            );

            // Report resize to PTY (Tauri) or WebSocket (mock)
            disposables.push(
              terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
                if (isMock && ws?.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "resize", cols, rows }));
                } else if (sessionId && isTerminalBridgeReady()) {
                  resizePty(sessionId, cols, rows).catch((err: unknown) => {
                    logger.warn("[TerminalViewportRaw] resize error:", err);
                  });
                }
              }),
            );

            // Auto-fit on container resize (RAF-debounced to avoid layout thrashing)
            resizeObserver = new ResizeObserver(() => {
              cancelAnimationFrame(fitRafId);
              fitRafId = requestAnimationFrame(() => {
                try {
                  fitAddon?.fit();
                } catch {
                  /* ignore */
                }
              });
            });
            resizeObserver.observe(container);

            // Scroll detection — inform parent when user scrolls away from bottom
            {
              disposables.push(
                terminal.onScroll(() => {
                  if (disposed || !terminal) return;
                  const buf = terminal.buffer.active;
                  const isAtBottom = buf.viewportY >= buf.baseY;
                  onScroll?.(isAtBottom);
                }),
              );
            }

            // Forward search result counts to parent
            disposables.push(
              searchAddon.onDidChangeResults((results) => {
                if (!disposed) onSearchResults?.(results);
              }),
            );

            terminalRef.current = terminal;
            fitAddonRef.current = fitAddon;
            searchAddonRef.current = searchAddon;

            // ─── PTY output → xterm.js pipe (race-safe) ───────
            const listen = getTerminalListenFn();
            if (listen && sessionId) {
              const sid = sessionId;
              listen(TERMINAL_EVENTS.OUTPUT, (event) => {
                const payload = event.payload as TerminalOutputPayload;
                if (payload.sessionId === sid) {
                  terminalRef.current?.write(payload.data);
                }
              })
                .then((fn) => {
                  if (disposed) {
                    fn();
                    return;
                  } // Already unmounted → immediately unsubscribe
                  outputUnlisten = fn;
                })
                .catch((err: unknown) => {
                  logger.warn("[TerminalViewportRaw] Failed to listen for output:", err);
                });
            }

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- disposed may change across await
            if (!disposed) setIsReady(true);
          },
        )
        .catch((err: unknown) => {
          logger.warn("[TerminalViewportRaw] failed to load xterm:", err);
        });

      return () => {
        disposed = true;
        cancelAnimationFrame(fitRafId);
        resizeObserver?.disconnect();
        for (const d of disposables) d.dispose();
        outputUnlisten?.();
        // Close WebSocket PTY if active
        if (mockWs && mockWs.readyState <= WebSocket.OPEN) {
          mockWs.close();
        }
        terminal?.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
        searchAddonRef.current = null;
        setIsReady(false);
      };
      // onSearchResults intentionally excluded — ref-stable callback expected
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, fontSize, lineHeight, scrollback]);

    // ─── Render ────────────────────────────────────────────
    const isAltScreen = compatibility?.altScreen ?? false;

    return (
      <div
        ref={containerRef}
        className={cn("relative h-full w-full bg-vsc-bg", className)}
        data-testid="terminal-viewport-raw"
        data-session-id={sessionId}
        data-alt-screen={isAltScreen}
      />
    );
  }),
);
