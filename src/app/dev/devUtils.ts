import type { AgentInstanceId, MessageId, ServerEvent, SessionId, TurnId } from "../../shared/protocol";

// Defense-in-depth: ensure dev utilities never run in production
if (import.meta.env.PROD) {
  throw new Error("[devUtils] Must not be loaded in production builds");
}

let idCounter = 0;

export function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/** Type-safe branded ID factories — centralise the single `as` cast */
export function nextSessionId(): SessionId { return nextId("session") as SessionId; }
export function nextMsgId(): MessageId { return nextId("msg") as MessageId; }
export function nextTurnId(): TurnId { return nextId("turn") as TurnId; }
export function nextAgentId(): AgentInstanceId { return nextId("agent") as AgentInstanceId; }

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function postServerEvent(serverEvent: ServerEvent) {
  window.postMessage(serverEvent, window.location.origin);
}

export function postServerEvents(serverEvents: ServerEvent[]) {
  window.postMessage(
    { type: "SERVER_EVENT_BATCH", batch_id: nextId("batch"), created_at_ms: Date.now(), serverEvents },
    window.location.origin,
  );
}

export async function streamText(msgId: MessageId, text: string, durationMs: number) {
  const chunkSize = 3;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  const delay = durationMs / chunks.length;
  for (const chunk of chunks) {
    window.postMessage({ t: "APPEND_TEXT", id: msgId, chunk }, window.location.origin);
    await sleep(delay);
  }
}

/** Delay between pipeline stages in scenario simulations */
export const STAGE_DELAY = 600;
