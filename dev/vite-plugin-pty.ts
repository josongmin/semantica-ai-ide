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

import { createRequire } from "node:module";
import type { Plugin } from "vite";

/** Path that the client connects to for PTY WebSocket upgrade */
export const PTY_WS_PATH = "/__pty";

export function ptyDevServer(): Plugin {
  return {
    name: "vite-plugin-pty",
    apply: "serve",

    configureServer(server) {
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

      // noServer mode — we handle upgrade manually
      const wss = new WebSocketServer({ noServer: true });

      console.log(
        `\x1b[36m[pty-plugin]\x1b[0m PTY WebSocket attached at ${PTY_WS_PATH}`,
      );

      wss.on("connection", (socket, req) => {
        const url = new URL(req.url ?? "/", "http://localhost");
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

        socket.on("message", (raw) => {
          const text = typeof raw === "string" ? raw : Buffer.from(raw as ArrayBuffer).toString("utf-8");

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

      // Intercept HTTP upgrade requests on /__pty path
      server.httpServer?.on("upgrade", (req, socket, head) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
        if (pathname === PTY_WS_PATH) {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
          });
        }
      });
    },
  };
}
