/**
 * Session-related Miscellaneous Types
 *
 * Compaction, restore, export, share, usage, notepad, schedule.
 */

import type { FileChange } from "../git";

// ─── Compaction Event ────────────────────────────────────
export interface CompactionEvent {
  readonly id: string;
  readonly timestamp_ms: number;
  readonly tokens_before: number;
  readonly tokens_after: number;
  readonly summary: string;
}

// ─── Restore Mode ────────────────────────────────────────
export type RestoreMode = "chat" | "code" | "both";

// ─── Completion Settings ───────────────────────────────────
export interface CompletionSettings {
  readonly enabled: boolean;
  readonly trigger_delay_ms: number;
  readonly max_lines: number;
  readonly accept_key: string;
}
export interface CompletionStats {
  readonly shown_today: number;
  readonly accepted_today: number;
  readonly acceptance_rate: number;
}

// ─── Share Link ─────────────────────────────────────────────
export interface ShareLink {
  readonly url: string;
  readonly expires_at_ms: number | null;
  readonly masked: boolean;
}

// ─── PR Summary ─────────────────────────────────────────────
export interface PRSummary {
  readonly title: string;
  readonly changes: readonly FileChange[];
  readonly intent: string;
  readonly todos: readonly string[];
}

// ─── Export ─────────────────────────────────────────────────
export type ExportFormat = "html" | "pdf" | "markdown";
export type ExportProgress = "idle" | "exporting" | "done" | "error";

export interface ExportOptions {
  readonly include_diffs: boolean;
  readonly include_tool_calls: boolean;
  readonly include_timestamps: boolean;
}

// ─── Notepad / Scratchpad ───────────────────────────────────
export interface Notepad {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly updated_at_ms: number;
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

// ─── Session Schedule ────────────────────────────────────────
export type ScheduleFrequency = "once" | "hourly" | "daily" | "weekly" | "cron";

export interface SessionSchedule {
  readonly id: string;
  readonly label: string;
  readonly frequency: ScheduleFrequency;
  readonly cron_expression?: string;
  readonly next_run_ms: number;
  readonly last_run_ms?: number;
  readonly enabled: boolean;
  readonly prompt: string;
  readonly repository?: string;
}
