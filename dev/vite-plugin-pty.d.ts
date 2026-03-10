/**
 * Vite Plugin: WebSocket PTY Server
 *
 * Starts a standalone WebSocket server (port 7681) alongside Vite's dev server.
 * Browser dev mode connects to this for real PTY access via node-pty.
 *
 * Protocol:
 *   ws://localhost:7681?cols=80&rows=24  → spawns a PTY, streams I/O
 *   Client → Server: stdin text, or JSON { type: "resize", cols, rows }
 *   Server → Client: stdout text
 */
import type { Plugin } from "vite";
declare const PTY_WS_PORT = 7681;
export declare function ptyDevServer(): Plugin;
export { PTY_WS_PORT };
