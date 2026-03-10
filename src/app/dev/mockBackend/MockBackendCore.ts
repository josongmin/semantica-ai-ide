import type { AgentInstanceId, MessageId, ServerEvent, SessionId, TurnId } from "../../../shared/protocol";

// Defense-in-depth: ensure mock backend never runs in production
if (import.meta.env.PROD) {
  throw new Error("[MockBackend] Must not be loaded in production builds");
}

let idCounter = 0;

/** Generate a unique ID with prefix */
export function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

/** Type-safe branded ID factories — centralise the single `as` cast */
export function nextSessionId(): SessionId { return nextId("session") as SessionId; }
export function nextMsgId(): MessageId { return nextId("msg") as MessageId; }
export function nextTurnId(): TurnId { return nextId("turn") as TurnId; }
export function nextAgentId(): AgentInstanceId { return nextId("agent") as AgentInstanceId; }

/** Post a single serverEvent to the frontend via window.postMessage */
export function postServerEvent(serverEvent: ServerEvent): void {
  window.postMessage(serverEvent, "*");
}

/** Post multiple serverEvents as a batch */
export function postServerEvents(serverEvents: ServerEvent[]): void {
  window.postMessage(
    { type: "SERVER_EVENT_BATCH", batch_id: nextId("batch"), created_at_ms: Date.now(), serverEvents },
    "*",
  );
}

/** Promise-based sleep */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Abortable sleep — rejects when signal fires */
export function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/** Stream text character-by-character as APPEND_TEXT serverEvents */
export async function streamText(
  msgId: MessageId,
  text: string,
  durationMs: number,
  signal?: AbortSignal,
): Promise<void> {
  const chunkSize = 3;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  const delay = Math.max(durationMs / chunks.length, 10);
  for (const chunk of chunks) {
    if (signal?.aborted) return;
    postServerEvent({ t: "APPEND_TEXT", id: msgId, chunk });
    if (signal) {
      await abortableSleep(delay, signal).catch(() => { /* abort expected */ });
      if (signal.aborted) return;
    } else {
      await sleep(delay);
    }
  }
}
