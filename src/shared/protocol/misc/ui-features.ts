/**
 * UI Feature Types
 *
 * Architect Mode, Model Routing, Privacy, Three-Model, DeepWiki,
 * Click-to-Edit, Live Preview, Voice Input, Machine Snapshot,
 * Mode Gallery, Playbook Market, Gantt, Prompt Suggestion,
 * Debug State, Speculative Edits, Action Replay, Smart Context,
 * Breadcrumb, User Input, Bugbot, Verifier, Living Spec.
 */

import type { TurnId } from "../brandedIds";
import type { RiskLevel } from "../tool";
import type { ReviewSeverity } from "./review";

// ─── Breadcrumb Context ────────────────────────────────────
export interface BreadcrumbContext {
  readonly session_name?: string;
  readonly turn_id?: TurnId;
  readonly turn_label?: string;
  readonly file_path?: string;
  readonly symbol_name?: string;
}

// ─── Architect Mode ─────────────────────────────────────────
export type ArchitectRole = "planner" | "coder" | "critic";

export interface ArchitectState {
  readonly active_role: ArchitectRole;
  readonly model_name: string;
  readonly task_description?: string;
}

// ─── Model Routing ──────────────────────────────────────────
export interface ModelRoute {
  readonly task_type: string;
  readonly model: string;
  readonly reason: string;
  readonly timestamp_ms: number;
}

// ─── Privacy Mode ───────────────────────────────────────────
export type PrivacyMode = "local" | "shared" | "stored";

export interface PrivacyState {
  readonly mode: PrivacyMode;
  readonly details: string;
  readonly policy_url?: string;
}

// ─── Gantt Entry ────────────────────────────────────────────
export type GanttEntryStatus = "running" | "success" | "error";
export type GanttToolType = "read" | "write" | "bash" | "search" | "other";

export interface GanttEntry {
  readonly id: string;
  readonly tool_name: string;
  readonly start_ms: number;
  readonly end_ms: number;
  readonly status: GanttEntryStatus;
  readonly tool_type: GanttToolType;
}

// ─── Three-Model Architecture (AS-03) ─────────────────────
export type ModelRoleStatus = "idle" | "active" | "done";

export interface ModelRoleState {
  readonly model: string;
  readonly status: ModelRoleStatus;
  readonly output: string;
}

export interface ThreeModelState {
  readonly planner: ModelRoleState;
  readonly coder: ModelRoleState;
  readonly critic: ModelRoleState;
}

// ─── DeepWiki (AS-04) ──────────────────────────────────────
export interface WikiPage {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly parent_id?: string;
  readonly source_turn_id?: TurnId;
  readonly updated_at_ms: number;
}

// ─── Click-to-Edit (AS-05) ─────────────────────────────────
export interface ElementMapping {
  readonly selector: string;
  readonly file_path: string;
  readonly line: number;
  readonly column: number;
}

// ─── Live Preview (AS-06) ──────────────────────────────────
export type PreviewStatus = "disconnected" | "connected" | "updating" | "error";

export interface PreviewState {
  readonly url: string;
  readonly status: PreviewStatus;
  readonly last_update_ms?: number;
}

// ─── Voice Input ───────────────────────────────────────────
export type VoiceInputStatus = "idle" | "listening" | "processing" | "done";

export interface VoiceInputState {
  readonly status: VoiceInputStatus;
  readonly transcript?: string;
  readonly confidence?: number;
}

// ─── Machine Snapshot ──────────────────────────────────────
export type MachineSnapshotStatus = "ready" | "creating" | "restoring";

export interface MachineSnapshot {
  readonly id: string;
  readonly label: string;
  readonly created_at_ms: number;
  readonly size_mb: number;
  readonly status: MachineSnapshotStatus;
}

// ─── Mode Gallery ──────────────────────────────────────────
export interface ModeEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly author: string;
  readonly rating: number;
  readonly install_count: number;
  readonly installed: boolean;
  readonly categories: readonly string[];
}

// ─── Playbook Market ───────────────────────────────────────
export interface PlaybookEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly author: string;
  readonly rating: number;
  readonly installed: boolean;
  readonly category?: string;
}

// ─── Prompt Suggestion ───────────────────────────────────────
export interface PromptSuggestion {
  readonly id: string;
  readonly text: string;
  readonly context?: string;
  readonly confidence?: number;
}

// ─── Debug State ─────────────────────────────────────────────
export type DebugPhase = "idle" | "hypothesizing" | "instrumenting" | "reproducing" | "verifying" | "resolved";

export interface DebugHypothesis {
  readonly id: string;
  readonly description: string;
  readonly status: "open" | "confirmed" | "refuted";
  readonly confidence: number;
  readonly evidence?: string;
}

export interface DebugState {
  readonly phase: DebugPhase;
  readonly hypotheses: readonly DebugHypothesis[];
  readonly current_hypothesis_id?: string;
  readonly reproduction_command?: string;
  readonly requires_user_verification?: boolean;
}

// ─── Smart Context Curation ─────────────────────────────────
export interface ContextSuggestion {
  readonly id: string;
  readonly file_path: string;
  readonly snippet?: string;
  readonly relevance_score: number;
  readonly reason: string;
  readonly token_cost: number;
  readonly accepted: boolean;
}

export interface AutoContextState {
  readonly suggestions: readonly ContextSuggestion[];
  readonly total_token_cost: number;
  readonly budget_tokens: number;
  readonly status: "idle" | "analyzing" | "ready";
}

// ─── Speculative Edits ──────────────────────────────────────
export interface SpeculativeEdit {
  readonly id: string;
  readonly file_path: string;
  readonly original_text: string;
  readonly proposed_text: string;
  readonly line_start: number;
  readonly line_end: number;
  readonly confidence: number;
  readonly risk_level: RiskLevel;
  readonly status: "pending" | "accepted" | "rejected" | "expired";
}

export interface SpeculativeEditState {
  readonly edits: readonly SpeculativeEdit[];
  readonly status: "idle" | "predicting" | "ready";
  readonly model_id?: string;
}

// ─── Action Replay ──────────────────────────────────────────
export type ReplayStepType = "tool_call" | "model_response" | "user_input" | "approval" | "checkpoint" | "error";

export interface ReplayStep {
  readonly id: string;
  readonly index: number;
  readonly type: ReplayStepType;
  readonly summary: string;
  readonly input_snapshot?: string;
  readonly output_snapshot?: string;
  readonly files_affected: readonly string[];
  readonly timestamp_ms: number;
  readonly duration_ms: number;
  readonly can_branch: boolean;
}

export interface ReplaySession {
  readonly steps: readonly ReplayStep[];
  readonly current_index: number;
  readonly total_steps: number;
  readonly source_turn_id: string;
  readonly status: "idle" | "playing" | "paused" | "branching";
  readonly playback_speed: number;
}

// ─── Verifier Result ─────────────────────────────────────────
export type VerifierOutcome = "pass" | "fail" | "partial" | "skipped";

export interface VerifierResult {
  readonly id: string;
  readonly spec_section: string;
  readonly outcome: VerifierOutcome;
  readonly message: string;
  readonly inconsistencies: readonly string[];
  readonly timestamp_ms: number;
}

// ─── Living Spec ─────────────────────────────────────────────
export interface LivingSpec {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly version: number;
  readonly last_updated_ms: number;
  readonly sections_completed: number;
  readonly sections_total: number;
}

// ─── Bugbot Status ───────────────────────────────────────────
export type BugbotPhase = "scanning" | "issues_found" | "fixing" | "fix_proposed" | "merged" | "idle";

export interface BugbotIssue {
  readonly id: string;
  readonly title: string;
  readonly file_path: string;
  readonly line?: number;
  readonly severity: ReviewSeverity;
  readonly auto_fixable: boolean;
  readonly fix_pr_url?: string;
}

export interface BugbotStatus {
  readonly phase: BugbotPhase;
  readonly pr_url?: string;
  readonly issues: readonly BugbotIssue[];
  readonly fix_merge_rate?: number;
  readonly last_scan_ms?: number;
}

// ─── User Input Request (HITL) ──────────────────────────────
export type UserInputResponseType = "text" | "single_choice" | "multi_choice" | "confirmation";

export interface UserInputChoice {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
}

export type UserInputRequestStatus = "pending" | "answered" | "cancelled" | "expired";

export interface UserInputRequest {
  readonly id: string;
  readonly turn_id: TurnId;
  readonly question: string;
  readonly description?: string;
  readonly response_type: UserInputResponseType;
  readonly choices?: readonly UserInputChoice[];
  readonly placeholder?: string;
  readonly default_value?: string;
  readonly required: boolean;
  readonly urgency: "low" | "normal" | "high";
  readonly created_at_ms: number;
  readonly status: UserInputRequestStatus;
  readonly answer?: string | readonly string[];
}
