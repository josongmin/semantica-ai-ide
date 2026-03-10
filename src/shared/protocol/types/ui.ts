/**
 * UI Feature Protocol Types
 *
 * Types for UI features: Gantt, ThreeWay Diff, ThreeModel, Wiki,
 * Preview, Voice, Snapshot, Gallery, Playbook, Context, Integration,
 * Ticket, Prompt, User Input, and more.
 */

import type { PrivacyMode, TurnId } from "./core";
import type { FileChange } from "./tool";

// ─── Surface Routing ────────────────────────────────────────
export type SurfaceId =
  | "chat"
  | "code"
  | "editor"
  | "graph"
  | "orchestrator"
  | "overview"
  | "reasoning"
  | "replay"
  | "review"
  | "settings"
  | "tasks"
  | "timeline"
  | "agent"
  | "agents";

export type AgentsSubTab = "workspace" | "fleet";

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

// ─── Three-Way Diff ─────────────────────────────────────────
export interface ThreeWayConflictRegion {
  readonly start_line: number;
  readonly end_line: number;
}

export type ThreeWayDiffResolution = "accept_agent" | "accept_current" | "manual_merge";
export type ThreeWayDiffStatus = "pending" | "resolved";

export interface ThreeWayDiffData {
  readonly id: string;
  readonly turn_id: TurnId;
  readonly file_path: string;
  readonly base_content: string;
  readonly agent_content: string;
  readonly current_content: string;
  readonly conflicts: readonly ThreeWayConflictRegion[];
  readonly status: ThreeWayDiffStatus;
  readonly resolution?: ThreeWayDiffResolution;
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

// ─── Context Space ──────────────────────────────────────────
export interface ContextSpace {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly files: readonly string[];
  readonly rules: readonly string[];
  readonly active: boolean;
  readonly created_by?: string;
}

// ─── Integration Connection ─────────────────────────────────
export type IntegrationPlatform = "slack" | "teams" | "discord" | "custom";
export type IntegrationStatus = "connected" | "disconnected" | "syncing";

export interface IntegrationConnection {
  readonly id: string;
  readonly platform: IntegrationPlatform;
  readonly channel: string;
  readonly status: IntegrationStatus;
  readonly last_sync_ms?: number;
}

// ─── Linked Ticket ──────────────────────────────────────────
export type TicketPlatform = "linear" | "jira" | "github";

export interface LinkedTicket {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly status: string;
  readonly platform: TicketPlatform;
  readonly url: string;
}

// ─── Prompt Suggestion ───────────────────────────────────────
export interface PromptSuggestion {
  readonly id: string;
  readonly text: string;
  readonly context?: string;
  readonly confidence?: number;
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

// ─── Export Options ─────────────────────────────────────────
export interface ExportOptions {
  readonly include_diffs: boolean;
  readonly include_tool_calls: boolean;
  readonly include_timestamps: boolean;
}

// ─── Share Link ─────────────────────────────────────────────
export interface ShareLink {
  readonly url: string;
  readonly expires_at_ms: number | null;
  readonly masked: boolean;
}

// ─── Team Config ────────────────────────────────────────────
export type TeamConfigStatus = "same" | "different" | "local_only" | "team_only";

export interface TeamConfig {
  readonly key: string;
  readonly local_value: string;
  readonly team_value: string;
  readonly status: TeamConfigStatus;
}

export type ConfigChoice = "local" | "team" | "merge";

// ─── Prompt Template ────────────────────────────────────────
export type PromptTemplateScope = "personal" | "team";

export interface PromptTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly template: string;
  readonly scope: PromptTemplateScope;
  readonly category?: string;
  readonly created_by?: string;
}

// ─── Usage Stats ────────────────────────────────────────────
export interface UsageModelBreakdown {
  readonly model: string;
  readonly tokens: number;
  readonly cost_usd: number;
}

export interface UsageStats {
  readonly total_sessions: number;
  readonly total_cost_usd: number;
  readonly total_tokens: number;
  readonly per_model: readonly UsageModelBreakdown[];
}

// ─── PR Summary ─────────────────────────────────────────────
export interface PRSummary {
  readonly title: string;
  readonly changes: readonly FileChange[];
  readonly intent: string;
  readonly todos: readonly string[];
}

// ─── Todo Board Filter Types ───────────────────────────────
export type TodoFilterStatus = "all" | "pending" | "in_progress" | "completed" | "failed";
export type TodoSortKey = "date" | "priority" | "status";

// ─── Notepad / Scratchpad ───────────────────────────────────
export interface Notepad {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly updated_at_ms: number;
}

// ─── Privacy State ───────────────────────────────────────────
export interface PrivacyState {
  readonly mode: PrivacyMode;
  readonly details: string;
  readonly policy_url?: string;
}
