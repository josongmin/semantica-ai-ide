/**
 * Memory Rule & Auto-Memory Types
 */

import type { MemoryRuleId } from "../brandedIds";

// ─── Memory Rule ─────────────────────────────────────────
export type MemoryRuleSource =
  | "user"
  | "project"
  | "auto"
  | ".cursorrules"
  | "CLAUDE.md"
  | ".clinerules"
  | "custom";

export interface MemoryRule {
  readonly id: MemoryRuleId;
  readonly title: string;
  readonly content: string;
  readonly pinned?: boolean;
  readonly source?: MemoryRuleSource;
  readonly file_path?: string;
  readonly active?: boolean;
  readonly created_at_ms?: number;
}

// ─── Auto-Memory Suggestion ─────────────────────────────
export interface AutoMemorySuggestion {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly confidence: number;
  readonly source_turn_id?: string;
}
