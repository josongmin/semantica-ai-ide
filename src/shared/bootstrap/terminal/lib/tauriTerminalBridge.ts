/**
 * Tauri Terminal IPC Bridge — RFC-TERMINAL-013 §5
 *
 * Typed wrappers around Tauri invoke() for all terminal commands.
 * FE must use ONLY these functions to communicate with the Rust PTY host.
 */

import type {
  AgentTerminalExecRequest,
  AgentTerminalExecResponse,
  AgentTerminalExecutionResult,
  SessionProvenance,
  ShellType,
  TerminalCommand,
  TerminalSessionMeta,
} from "../model/types";

// ─── Tauri invoke helper ───────────────────────────────────

type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

let invokeFn: InvokeFn | null = null;

/**
 * Initialize the bridge with the Tauri invoke function.
 * Must be called once during app bootstrap (after Tauri is ready).
 */
export function initTerminalBridge(invoke: InvokeFn): void {
  if (invokeFn) {
    throw new Error("[TerminalBridge] Already initialized. initTerminalBridge() must only be called once.");
  }
  invokeFn = invoke;
}

/** Whether the bridge has been initialized */
export function isTerminalBridgeReady(): boolean {
  return invokeFn !== null;
}

function getInvoke(): InvokeFn {
  if (!invokeFn) {
    throw new Error(
      "[TerminalBridge] Not initialized. Call initTerminalBridge(invoke) at app startup.",
    );
  }
  return invokeFn;
}

// ─── Session Commands ──────────────────────────────────────

export async function createSession(opts: {
  shellType?: ShellType;
  cwd?: string;
  provenance: SessionProvenance;
}): Promise<TerminalSessionMeta> {
  const invoke = getInvoke();
  return invoke("terminal_create_session", { args: opts }) as Promise<TerminalSessionMeta>;
}

export async function killSession(sessionId: string): Promise<void> {
  const invoke = getInvoke();
  await invoke("terminal_kill_session", { sessionId });
}

export async function getSessions(): Promise<TerminalSessionMeta[]> {
  const invoke = getInvoke();
  return invoke("terminal_get_sessions") as Promise<TerminalSessionMeta[]>;
}

// ─── PTY I/O Commands ──────────────────────────────────────

export async function writeToPty(sessionId: string, data: string): Promise<void> {
  const invoke = getInvoke();
  await invoke("terminal_write", { sessionId, data });
}

export async function resizePty(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<void> {
  const invoke = getInvoke();
  await invoke("terminal_resize", { sessionId, cols, rows });
}

// ─── Command Queries ───────────────────────────────────────

export async function getCommands(sessionId: string): Promise<TerminalCommand[]> {
  const invoke = getInvoke();
  return invoke("terminal_get_commands", { sessionId }) as Promise<TerminalCommand[]>;
}

// ─── Agent Execution ───────────────────────────────────────

export async function execAgentCommand(
  request: AgentTerminalExecRequest,
): Promise<AgentTerminalExecResponse> {
  const invoke = getInvoke();
  return invoke("terminal_exec", { args: request }) as Promise<AgentTerminalExecResponse>;
}

export async function getExecution(
  executionId: string,
): Promise<AgentTerminalExecutionResult | null> {
  const invoke = getInvoke();
  return invoke("terminal_get_execution", { executionId }) as Promise<AgentTerminalExecutionResult | null>;
}

export async function cancelAgentExec(requestId: string): Promise<void> {
  const invoke = getInvoke();
  await invoke("terminal_cancel_exec", { requestId });
}

export async function approveCommand(requestId: string, approved: boolean): Promise<void> {
  const invoke = getInvoke();
  await invoke("terminal_approve_command", { requestId, approved });
}
