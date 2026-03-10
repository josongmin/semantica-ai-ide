/**
 * Arena / Debate Protocol Types
 */

import type { ArenaResponseId } from "./core";

// ─── Arena ─────────────────────────────────────────────────
export type ArenaModelSlot = "A" | "B";
export type ArenaWinner = ArenaModelSlot | "tie" | null;
export type ArenaResponseStatus = "streaming" | "final" | "error";
export interface ArenaResponse {
  readonly id: ArenaResponseId;
  readonly slot: ArenaModelSlot;
  readonly model_id: string;
  readonly model_label: string;
  readonly text: string;
  readonly status: ArenaResponseStatus;
  readonly created_at_ms: number;
}

// ─── Multi-Agent Debate ─────────────────────────────────────
export type DebateAgentStatus = "working" | "done" | "error";

export interface DebateAgent {
  readonly id: string;
  readonly model_id: string;
  readonly label: string;
  readonly status: DebateAgentStatus;
  readonly approach_summary?: string;
  readonly code_diff_summary?: string;
  readonly confidence: number;
  readonly files_changed: number;
  readonly tokens_used: number;
  readonly duration_ms: number;
}

export interface ConsensusResult {
  readonly winner_id: string | null;
  readonly method: "auto_judge" | "user_pick" | "consensus";
  readonly scores: readonly { readonly agent_id: string; readonly score: number; readonly reasoning: string }[];
  readonly merged: boolean;
}

export interface DebateSession {
  readonly id: string;
  readonly prompt: string;
  readonly agents: readonly DebateAgent[];
  readonly status: "setup" | "running" | "judging" | "decided" | "merged";
  readonly consensus?: ConsensusResult;
  readonly created_at_ms: number;
}
