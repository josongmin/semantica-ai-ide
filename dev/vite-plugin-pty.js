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
export var PTY_WS_PATH = "/__pty";
export function ptyDevServer() {
    return {
        name: "vite-plugin-pty",
        apply: "serve",
        configureServer: function (server) {
            var require = createRequire(import.meta.url);
            var pty;
            var WebSocketServer;
            try {
                pty = require("node-pty");
                var ws = require("ws");
                WebSocketServer = ws.WebSocketServer;
            }
            catch (err) {
                console.warn("\x1b[33m[pty-plugin]\x1b[0m Failed to load node-pty or ws:", err.message);
                return;
            }
            var defaultShell = process.env.SHELL || (process.platform === "win32" ? "powershell.exe" : "/bin/zsh");
            var wss = new WebSocketServer({ noServer: true });
            console.log("\u001B[36m[pty-plugin]\u001B[0m PTY WebSocket attached at " + PTY_WS_PATH);
            wss.on("connection", function (socket, req) {
                var _a;
                var url = new URL((_a = req.url) !== null && _a !== void 0 ? _a : "/", "http://localhost");
                var cols = parseInt(url.searchParams.get("cols") || "80", 10);
                var rows = parseInt(url.searchParams.get("rows") || "24", 10);
                var ptyProcess = pty.spawn(defaultShell, [], {
                    name: "xterm-256color",
                    cols: cols,
                    rows: rows,
                    cwd: process.cwd(),
                    env: process.env,
                });
                console.log("\u001B[36m[pty-plugin]\u001B[0m PTY spawned (pid=".concat(ptyProcess.pid, ", ").concat(cols, "x").concat(rows, ")"));
                ptyProcess.onData(function (data) {
                    if (socket.readyState === socket.OPEN) {
                        socket.send(data);
                    }
                });
                ptyProcess.onExit(function (_a) {
                    var exitCode = _a.exitCode;
                    console.log("\u001B[36m[pty-plugin]\u001B[0m PTY exited (code=".concat(exitCode, ")"));
                    try {
                        socket.close();
                    }
                    catch (_b) {
                        /* already closed */
                    }
                });
                socket.on("message", function (raw) {
                    var text = typeof raw === "string" ? raw : Buffer.from(raw).toString("utf-8");
                    if (text.startsWith("{")) {
                        try {
                            var msg = JSON.parse(text);
                            if (msg.type === "resize" && msg.cols && msg.rows) {
                                ptyProcess.resize(msg.cols, msg.rows);
                                return;
                            }
                        }
                        catch (_a) {
                            // Not JSON — treat as stdin
                        }
                    }
                    ptyProcess.write(text);
                });
                socket.on("close", function () {
                    try {
                        ptyProcess.kill();
                    }
                    catch (_a) { /* already dead */ }
                });
                socket.on("error", function () {
                    try {
                        ptyProcess.kill();
                    }
                    catch (_a) { /* already dead */ }
                });
            });
            // Intercept HTTP upgrade requests on /__pty path
            var httpServer = server.httpServer;
            if (httpServer) {
                httpServer.on("upgrade", function (req, socket, head) {
                    var pathname = new URL(req.url || "/", "http://localhost").pathname;
                    if (pathname === PTY_WS_PATH) {
                        wss.handleUpgrade(req, socket, head, function (ws) {
                            wss.emit("connection", ws, req);
                        });
                    }
                });
            }
        },
    };
}
