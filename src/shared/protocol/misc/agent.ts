/**
 * Agent-related Types
 *
 * AgentInstance, AgentRule, AgentSteer, AgentWave, AgentMessage,
 * MissionControl, Boomerang, BackgroundJob, Debate.
 */

import type { AgentInstanceId, SessionId, TurnId } from "../brandedIds";
import type { RiskLevel } from "../tool";

// ─── Agent Instance ────────────────────────────────────────
export type AgentInstanceStatus = "queued" | "running" | "success" | "error" | "cancelled";
export interface AgentInstance {
  readonly id: AgentInstanceId;
  readonly label: string;
  readonly status: AgentInstanceStatus;
  readonly progress: number;
  readonly model_id: string;
  readonly created_at_ms: number;
  readonly completed_at_ms?: number;
  readonly error_message?: string;
  readonly current_file?: string;
  readonly files_processed?: number;
  readonly files_total?: number;
  readonly current_task?: string;
  readonly resources?: {
    readonly memory_mb?: number;
    readonly cpu_percent?: number;
  };
}

// ─── Mission Control ───────────────────────────────────────
export type MissionControlAgentStatus = "running" | "idle" | "error";

export interface MissionControlAgent {
  readonly id: AgentInstanceId;
  readonly name: string;
  readonly status: MissionControlAgentStatus;
  readonly current_task?: string;
  readonly progress_pct: number;
  readonly risk_level: RiskLevel;
  readonly eta_ms?: number;
  readonly session_id?: SessionId;
}

// ─── Boomerang Task ────────────────────────────────────────
export type BoomerangTaskStatus = "pending" | "running" | "success" | "error";

export interface BoomerangTask {
  readonly id: string;
  readonly parent_turn_id: TurnId;
  readonly label: string;
  readonly status: BoomerangTaskStatus;
  readonly agent_id?: string;
  readonly result_summary?: string;
}

// ─── Agent Rules ─────────────────────────────────────────────
export type AgentRuleSource = "file" | "user" | "team" | "auto_detected";
export type AgentRuleStatus = "active" | "disabled" | "violated";

export interface AgentRule {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly source: AgentRuleSource;
  readonly file_path?: string;
  readonly status: AgentRuleStatus;
  readonly violation_count: number;
  readonly last_applied_ms?: number;
}

export interface RuleViolation {
  readonly id: string;
  readonly rule_id: string;
  readonly turn_id: string;
  readonly description: string;
  readonly severity: "warning" | "error";
  readonly timestamp_ms: number;
}

// ─── Agent Steer ─────────────────────────────────────────────
export type SteerAction = "pause" | "resume" | "redirect" | "restart" | "stop";

export interface AgentSteer {
  readonly agent_id: string;
  readonly action: SteerAction;
  readonly reason?: string;
  readonly redirect_prompt?: string;
  readonly timestamp_ms: number;
}

// ─── Agent Wave (Coordinator -> Specialist) ───────────────────
export type AgentWavePhase = "planning" | "dispatching" | "executing" | "merging" | "completed";

export interface AgentWave {
  readonly wave_id: string;
  readonly wave_number: number;
  readonly phase: AgentWavePhase;
  readonly agent_ids: readonly string[];
  readonly completed_count: number;
  readonly total_count: number;
  readonly started_at_ms: number;
}

// ─── Agent Message (P2P) ────────────────────────────────────
export type AgentMessageType = "request" | "response" | "broadcast";

export interface AgentMessage {
  readonly id: string;
  readonly from_agent: string;
  readonly to_agent: string;
  readonly content: string;
  readonly timestamp_ms: number;
  readonly message_type: AgentMessageType;
}

// ─── Background Agent ───────────────────────────────────────
export type BackgroundJobPhase = "queued" | "initializing" | "running" | "finalizing" | "done" | "failed" | "cancelled";

export interface BackgroundJob {
  readonly id: string;
  readonly label: string;
  readonly phase: BackgroundJobPhase;
  readonly progress: number;
  readonly agent_model?: string;
  readonly created_at_ms: number;
  readonly completed_at_ms?: number;
  readonly current_step?: string;
  readonly steps_completed: number;
  readonly steps_total: number;
  readonly files_changed: number;
  readonly error_message?: string;
  readonly result_summary?: string;
  readonly cloud: boolean;
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
