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
var PTY_WS_PORT = 7681;
export function ptyDevServer() {
    return {
        name: "vite-plugin-pty",
        apply: "serve",
        configureServer: function () {
            // Use createRequire for native addons — dynamic import() fails
            // inside Vite's module resolution for native .node binaries
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
            var wss = new WebSocketServer({ port: PTY_WS_PORT });
            console.log("\u001B[36m[pty-plugin]\u001B[0m WebSocket PTY server on ws://localhost:".concat(PTY_WS_PORT));
            wss.on("connection", function (socket, req) {
                var _a;
                var url = new URL((_a = req.url) !== null && _a !== void 0 ? _a : "/", "http://localhost:".concat(PTY_WS_PORT));
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
                // PTY stdout → WebSocket
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
                // WebSocket → PTY stdin (or JSON control messages)
                socket.on("message", function (raw) {
                    var text = typeof raw === "string" ? raw : Buffer.from(raw).toString("utf-8");
                    // JSON control message: { type: "resize", cols, rows }
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
                    catch ( /* already dead */_a) { /* already dead */ }
                });
                socket.on("error", function () {
                    try {
                        ptyProcess.kill();
                    }
                    catch ( /* already dead */_a) { /* already dead */ }
                });
            });
            wss.on("error", function (err) {
                if (err.code === "EADDRINUSE") {
                    console.warn("\u001B[33m[pty-plugin]\u001B[0m Port ".concat(PTY_WS_PORT, " in use \u2014 PTY server skipped"));
                }
                else {
                    console.error("\u001B[31m[pty-plugin]\u001B[0m Server error:", err);
                }
            });
        },
    };
}
export { PTY_WS_PORT };
