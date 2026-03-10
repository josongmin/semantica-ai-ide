import { randomUUID } from "node:crypto";

import type { WebSocket } from "ws";

import type {
  EventId,
  HelloAckPayload,
  ProtocolEnvelope,
  SessionId,
} from "@semantica/protocol";
import {
  HelloPayloadSchema,
  PROTOCOL_VERSION,
  ProtocolEnvelopeSchema,
} from "@semantica/protocol";

import { sessionManager } from "../session/manager.js";

// ── Shared constants ─────────────────────────────────────────

export const AGENTD_VERSION = "0.1.0";
export const AGENTD_BUILD_HASH = process.env.BUILD_HASH ?? "dev";

// ── Sentinel for pre-session errors ─────────────────────────

const NO_SESSION_ID = "" as SessionId;

// ── Helpers ──────────────────────────────────────────────────

function uid(): string {
  return randomUUID();
}

function envelope<T>(
  kind: ProtocolEnvelope["kind"],
  payload: T,
  sessionId: SessionId,
): ProtocolEnvelope<T> {
  return {
    version: PROTOCOL_VERSION,
    session_id: sessionId,
    correlation_id: uid() as ProtocolEnvelope["correlation_id"],
    event_id: uid() as EventId,
    ts_ms: Date.now(),
    kind,
    payload,
  };
}

function sendError(
  ws: WebSocket,
  code: string,
  message: string,
  recoverable: boolean,
  sessionId: SessionId = NO_SESSION_ID,
): void {
  ws.send(
    JSON.stringify(
      envelope("ERROR", { code, message, recoverable }, sessionId),
    ),
  );
}

// ── Connection handler ───────────────────────────────────────

export function handleConnection(ws: WebSocket) {
  let sessionId: SessionId | null = null;
  let helloReceived = false;

  ws.on("error", (err) => {
    console.error("[agentd] ws error:", err.message);
  });

  ws.on("message", (raw) => {
    try {
      const data =
        raw instanceof Buffer ? raw.toString("utf-8") : String(raw);
      const parsed = JSON.parse(data) as unknown;

      // Validate envelope structure
      const result = ProtocolEnvelopeSchema.safeParse(parsed);
      if (!result.success) {
        sendError(
          ws,
          "INVALID_ENVELOPE",
          `Malformed envelope: ${result.error.issues[0]?.message ?? "unknown"}`,
          true,
          sessionId ?? NO_SESSION_ID,
        );
        return;
      }
      const msg = result.data as ProtocolEnvelope;

      switch (msg.kind) {
        case "HELLO": {
          if (helloReceived) {
            sendError(ws, "DUPLICATE_HELLO", "HELLO already sent", true, sessionId ?? NO_SESSION_ID);
            return;
          }

          // Validate HELLO payload
          const helloResult = HelloPayloadSchema.safeParse(msg.payload);
          if (!helloResult.success) {
            sendError(ws, "INVALID_HELLO", "Invalid HELLO payload", true);
            return;
          }
          const hello = helloResult.data;

          // Protocol version check
          if (hello.protocol_version !== PROTOCOL_VERSION) {
            sendError(
              ws,
              "VERSION_MISMATCH",
              `Expected protocol ${PROTOCOL_VERSION}, got ${hello.protocol_version}`,
              false,
            );
            return;
          }

          helloReceived = true;
          sessionId = sessionManager.getOrCreateSession();

          const lastEventId = hello.last_event_id;
          const resumeMode = lastEventId
            ? sessionManager.canResume(sessionId, lastEventId as EventId)
              ? "patch"
              : "snapshot"
            : "fresh";

          const ack: HelloAckPayload = {
            server_version: AGENTD_VERSION,
            build_hash: AGENTD_BUILD_HASH,
            session_id: sessionId,
            capabilities: ["llm", "tools", "checkpoint"],
            resume_mode: resumeMode,
            resume_reason: lastEventId && resumeMode === "snapshot"
              ? "gap_too_large"
              : "ok",
          };

          ws.send(JSON.stringify(envelope("HELLO_ACK", ack, sessionId)));

          // Send initial state
          const state = sessionManager.getSnapshot(sessionId);
          ws.send(
            JSON.stringify(envelope("STATE_SNAPSHOT", { state }, sessionId)),
          );

          console.log(
            `[agentd] HELLO_ACK sent (session: ${sessionId}, resume: ${resumeMode})`,
          );
          break;
        }

        case "USER_MESSAGE": {
          if (!sessionId) {
            sendError(ws, "NO_SESSION", "Send HELLO first", true);
            return;
          }
          // TODO: Route to LLM Gateway → streaming response
          console.log("[agentd] USER_MESSAGE received (LLM gateway pending)");
          break;
        }

        case "HEARTBEAT": {
          if (!sessionId) {
            sendError(ws, "NO_SESSION", "Send HELLO first", true);
            return;
          }
          ws.send(
            JSON.stringify(envelope("HEARTBEAT", {}, sessionId)),
          );
          break;
        }

        default:
          console.log(`[agentd] unhandled kind: ${msg.kind}`);
      }
    } catch (err) {
      console.error("[agentd] message parse error:", err);
      sendError(
        ws,
        "PARSE_ERROR",
        "Failed to parse message",
        true,
        sessionId ?? NO_SESSION_ID,
      );
    }
  });

  ws.on("close", () => {
    console.log("[agentd] client disconnected");
  });
}
