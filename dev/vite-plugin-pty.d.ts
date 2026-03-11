/**
 * Vite Plugin: WebSocket PTY Server
 *
 * Piggybacks on Vite's own HTTP server — no separate port needed.
 * Browser dev mode connects to ws://<vite-host>/__pty for real PTY access.
 *
 * Protocol:
 *   ws://localhost:5173/__pty?cols=80&rows=24  → spawns a PTY, streams I/O
 *   Client → Server: stdin text, or JSON { type: "resize", cols, rows }
 *   Server → Client: stdout text
 */
import type { Plugin } from "vite";
export declare const PTY_WS_PATH = "/__pty";
export declare function ptyDevServer(): Plugin;
