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

import { createRequire } from "node:module";
import type { Plugin } from "vite";

const PTY_WS_PORT = 7681;

export function ptyDevServer(): Plugin {
  return {
    name: "vite-plugin-pty",
    apply: "serve",

    configureServer() {
      // Use createRequire for native addons — dynamic import() fails
      // inside Vite's module resolution for native .node binaries
      const require = createRequire(import.meta.url);

      let pty: typeof import("node-pty");
      let WebSocketServer: typeof import("ws").WebSocketServer;

      try {
        pty = require("node-pty") as typeof import("node-pty");
        const ws = require("ws") as typeof import("ws");
        WebSocketServer = ws.WebSocketServer;
      } catch (err) {
        console.warn(
          "\x1b[33m[pty-plugin]\x1b[0m Failed to load node-pty or ws:",
          (err as Error).message,
        );
        return;
      }

      const defaultShell =
        process.env.SHELL || (process.platform === "win32" ? "powershell.exe" : "/bin/zsh");

      const wss = new WebSocketServer({ port: PTY_WS_PORT });

      console.log(
        `\x1b[36m[pty-plugin]\x1b[0m WebSocket PTY server on ws://localhost:${PTY_WS_PORT}`,
      );

      wss.on("connection", (socket, req) => {
        const url = new URL(req.url ?? "/", `http://localhost:${PTY_WS_PORT}`);
        const cols = parseInt(url.searchParams.get("cols") || "80", 10);
        const rows = parseInt(url.searchParams.get("rows") || "24", 10);

        const ptyProcess = pty.spawn(defaultShell, [], {
          name: "xterm-256color",
          cols,
          rows,
          cwd: process.cwd(),
          env: process.env as Record<string, string>,
        });

        console.log(
          `\x1b[36m[pty-plugin]\x1b[0m PTY spawned (pid=${ptyProcess.pid}, ${cols}x${rows})`,
        );

        // PTY stdout → WebSocket
        ptyProcess.onData((data: string) => {
          if (socket.readyState === socket.OPEN) {
            socket.send(data);
          }
        });

        ptyProcess.onExit(({ exitCode }) => {
          console.log(`\x1b[36m[pty-plugin]\x1b[0m PTY exited (code=${exitCode})`);
          try {
            socket.close();
          } catch {
            /* already closed */
          }
        });

        // WebSocket → PTY stdin (or JSON control messages)
        socket.on("message", (raw) => {
          const text = typeof raw === "string" ? raw : Buffer.from(raw as ArrayBuffer).toString("utf-8");

          // JSON control message: { type: "resize", cols, rows }
          if (text.startsWith("{")) {
            try {
              const msg = JSON.parse(text) as { type: string; cols?: number; rows?: number };
              if (msg.type === "resize" && msg.cols && msg.rows) {
                ptyProcess.resize(msg.cols, msg.rows);
                return;
              }
            } catch {
              // Not JSON — treat as stdin
            }
          }

          ptyProcess.write(text);
        });

        socket.on("close", () => {
          try { ptyProcess.kill(); } catch { /* already dead */ }
        });

        socket.on("error", () => {
          try { ptyProcess.kill(); } catch { /* already dead */ }
        });
      });

      wss.on("error", (err) => {
        if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
          console.warn(
            `\x1b[33m[pty-plugin]\x1b[0m Port ${PTY_WS_PORT} in use — PTY server skipped`,
          );
        } else {
          console.error(`\x1b[31m[pty-plugin]\x1b[0m Server error:`, err);
        }
      });
    },
  };
}

export { PTY_WS_PORT };
