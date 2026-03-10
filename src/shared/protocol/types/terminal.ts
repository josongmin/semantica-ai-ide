/**
 * Terminal Bridge Protocol Types
 *
 * Terminal sessions, output, and agent actions.
 */

import type { TerminalSessionId } from "./core";

// ─── Terminal Bridge ────────────────────────────────────
export interface TerminalOutput {
  readonly sessionId: TerminalSessionId;
  readonly timestamp: number;
  readonly text: string;
  readonly isError: boolean;
}

export interface TerminalSession {
  readonly id: TerminalSessionId;
  readonly sessionId: string;
  readonly name: string;
  readonly title: string;
  readonly cwd: string;
  readonly isActive: boolean;
  readonly lastCommand?: string;
  readonly exitCode?: number;
  readonly shellType: string;
  readonly pid: number;
  readonly createdAt: number;
  readonly status: string;
  readonly provenance: unknown;
  readonly mode: string;
  readonly markerSupport: boolean;
  readonly purpose?: string;
}

export interface TerminalAgentAction {
  readonly id: string;
  readonly sessionId: TerminalSessionId;
  readonly command: string;
  readonly reason: string;
  readonly requiresApproval: boolean;
  readonly status: "pending" | "approved" | "rejected" | "executed";
}
