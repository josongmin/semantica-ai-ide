/**
 * Types for the mock response pool.
 */

export type MockIntentType =
  | "Q_INFO"
  | "Q_LOCATE"
  | "Q_DIAG"
  | "Q_FIX"
  | "Q_REFACTOR"
  | "Q_SEC"
  | "Q_PERF"
  | "Q_SPEC"
  | "Q_MIGRATE";

export type MockRiskLevel = "R0" | "R1" | "R2" | "R3" | "R4";
export type MockChangeSize = "C0" | "C1" | "C2" | "C3";
export type Uncertainty = "U0" | "U1" | "U2" | "U3";

export interface ToolCallEntry {
  tool_name: string;
  category: string;
  args_summary: string;
  result_summary: string;
  duration_ms: number;
  /** Unified diff text for edit/write tool calls */
  diff_text?: string;
}

export interface FileChangeEntry {
  file_path: string;
  status: "added" | "modified" | "deleted";
  insertions: number;
  deletions: number;
}

export interface ResponseEntry {
  text: string;
  intent: MockIntentType;
  risk: MockRiskLevel;
  changeSize: MockChangeSize;
  uncertainty: Uncertainty;
  toolCalls?: ToolCallEntry[];
  fileChanges?: FileChangeEntry[];
  /** Custom thinking text for the thinking phase */
  thinkingText?: string;
  /** Custom plan steps */
  planSteps?: string;
}

export interface Classification {
  intent: MockIntentType;
  risk: MockRiskLevel;
  changeSize: MockChangeSize;
  uncertainty: Uncertainty;
}
