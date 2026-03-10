/**
 * Terminal Cross-Surface Intent Types — RFC-TERMINAL-017
 *
 * Defines all intents that flow between terminal and other IDE surfaces.
 * Intent Router dispatches these to the appropriate surface handler.
 */

import type {
  CommandStatus,
  DiagnosticEvent,
  SummaryEvent,
  TestResultEvent,
} from "./types";

// ─── Surface Source ──────────────────────────────────────

export type SurfaceSource =
  | { surface: "terminal"; sessionId: string; commandId?: string }
  | { surface: "editor"; fileId: string }
  | { surface: "agent"; threadId: string }
  | { surface: "graph"; nodeId: string };

// ─── Base Intent ─────────────────────────────────────────

export interface SurfaceIntent<T extends string = string, P = unknown> {
  readonly type: T;
  readonly source: SurfaceSource;
  readonly payload: P;
  readonly timestamp: number;
}

// ─── open-file ───────────────────────────────────────────

export interface OpenFilePayload {
  readonly file: string;
  readonly line: number;
  readonly column?: number;
  readonly highlight?: { startLine: number; endLine: number };
  readonly inlineHint?: {
    severity: "error" | "warning" | "info";
    message: string;
  };
  readonly revealMode: "focus" | "peek" | "side";
}

export type OpenFileIntent = SurfaceIntent<"open-file", OpenFilePayload>;

// ─── open-problems ───────────────────────────────────────

export interface OpenProblemsPayload {
  readonly filter: { sessionId: string; commandId: string };
  readonly diagnostics: DiagnosticEvent[];
}

export type OpenProblemsIntent = SurfaceIntent<"open-problems", OpenProblemsPayload>;

// ─── ask-agent ───────────────────────────────────────────

export interface TerminalBlockAttachment {
  readonly blockId: string;
  readonly sessionId: string;
  readonly command: string;
  readonly status: CommandStatus;
  readonly exitCode?: number;
  readonly duration?: number;
  readonly diagnostics: DiagnosticEvent[];
  readonly testResults: TestResultEvent[];
  readonly outputPreview: string;
  readonly summary?: SummaryEvent;
}

export interface AskAgentPayload {
  readonly attachment: TerminalBlockAttachment;
  readonly intent: "explain" | "fix" | "debug" | "custom";
  readonly customMessage?: string;
  readonly threadId?: string;
  readonly autoMessage?: string;
}

export type AskAgentIntent = SurfaceIntent<"ask-agent", AskAgentPayload>;

// ─── reveal-terminal ─────────────────────────────────────

export interface RevealTerminalPayload {
  readonly sessionId: string;
  readonly commandId: string;
  readonly scrollTo: boolean;
}

export type RevealTerminalIntent = SurfaceIntent<"reveal-terminal", RevealTerminalPayload>;

// ─── copy-to-editor ──────────────────────────────────────

export interface CopyToEditorPayload {
  readonly title: string;
  readonly content: string;
  readonly language?: string;
}

export type CopyToEditorIntent = SurfaceIntent<"copy-to-editor", CopyToEditorPayload>;

// ─── Union ───────────────────────────────────────────────

export type TerminalIntent =
  | OpenFileIntent
  | OpenProblemsIntent
  | AskAgentIntent
  | RevealTerminalIntent
  | CopyToEditorIntent;
