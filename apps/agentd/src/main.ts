import { existsSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { WebSocketServer } from "ws";

import { AGENTD_BUILD_HASH, AGENTD_VERSION, handleConnection } from "./protocol/handler.js";

// ── Constants ───────────────────────────────────────────────

const AGENTD_DIR = join(homedir(), ".semantica", "agentd");
const PID_FILE = join(AGENTD_DIR, "agentd.pid");
const PORT_FILE = join(AGENTD_DIR, "agentd.port");
const META_FILE = join(AGENTD_DIR, "agentd.meta.json");

// ── Endpoint Discovery (atomic write) ───────────────────────

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/** Atomic write: tmpfile → rename(2) to prevent UI from reading partial data */
function atomicWrite(filePath: string, content: string) {
  const tmp = filePath + ".tmp." + process.pid;
  try {
    writeFileSync(tmp, content, "utf-8");
    renameSync(tmp, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try { unlinkSync(tmp); } catch { /* best effort */ }
    throw err;
  }
}

function writePid() {
  atomicWrite(PID_FILE, String(process.pid));
}

function writeEndpoint(port: number) {
  atomicWrite(PORT_FILE, `ws://127.0.0.1:${port}`);
}

function writeMeta() {
  atomicWrite(
    META_FILE,
    JSON.stringify({
      version: AGENTD_VERSION,
      build_hash: AGENTD_BUILD_HASH,
      started_at: new Date().toISOString(),
    }),
  );
}

// ── Cleanup ─────────────────────────────────────────────────

let cleaned = false;

function cleanup() {
  if (cleaned) return;
  cleaned = true;

  for (const file of [PID_FILE, PORT_FILE, META_FILE]) {
    try {
      if (existsSync(file)) unlinkSync(file);
    } catch {
      // Best effort per-file
    }
  }
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  ensureDir(AGENTD_DIR);
  writePid();
  writeMeta();

  // Bind to random port (0) — no port conflicts possible
  const wss = new WebSocketServer({ host: "127.0.0.1", port: 0 });

  wss.on("error", (err) => {
    console.error("[agentd] server error:", err);
  });

  const address = wss.address();
  if (typeof address === "object" && address) {
    const port = address.port;
    writeEndpoint(port);
    console.log(`[agentd] listening on ws://127.0.0.1:${port}`);
    console.log(`[agentd] PID: ${process.pid}, version: ${AGENTD_VERSION}, build: ${AGENTD_BUILD_HASH}`);
  }

  wss.on("connection", (ws) => {
    console.log("[agentd] client connected");
    handleConnection(ws);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("[agentd] shutting down...");
    wss.close();
    cleanup();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", cleanup);
}

main().catch((err) => {
  console.error("[agentd] fatal:", err);
  cleanup();
  process.exit(1);
});
