import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import { turnAtomFamily } from "~entities/message/turns";
import { toolCallAtomFamily, toolCallIdsByTurnAtom } from "~entities/tool-call";

import type { ToolCall, TurnId } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

// ─── Step derivation ──────────────────────────────────────

interface LogStep {
  key: string;
  icon: string;
  label: string;
  status: "done" | "active";
}

/** Human-friendly label for a tool call */
function toolLabel(tc: ToolCall): string {
  const arg = tc.args_summary;
  switch (tc.tool_name) {
    case "read_file":
    case "Read":
      return `Read ${shortPath(arg)}`;
    case "write_file":
    case "Write":
      return `Write ${shortPath(arg)}`;
    case "edit_file":
    case "Edit":
      return `Edit ${shortPath(arg)}`;
    case "Glob":
    case "glob":
      return `Search files ${arg ? `"${truncate(arg, 24)}"` : ""}`;
    case "Grep":
    case "grep":
    case "search":
      return `Search ${arg ? `"${truncate(arg, 24)}"` : "code"}`;
    case "bash":
    case "Bash":
      return `Run command`;
    case "list_directory":
      return `List ${shortPath(arg)}`;
    default:
      return tc.tool_name + (arg ? ` ${truncate(arg, 20)}` : "");
  }
}

function toolIcon(tc: ToolCall): string {
  switch (tc.category) {
    case "read": return "file";
    case "search": return "search";
    case "write": return "edit";
    case "delete": return "trash";
    case "terminal": return "terminal";
    case "git": return "git-commit";
    case "analysis": return "lightbulb";
    case "other": return "extensions";
  }
}

/** Phase → step label while running */
function phaseActiveLabel(phase: string): string {
  switch (phase) {
    case "thinking": return "Thinking...";
    case "analysis": return "Analyzing...";
    case "plan": return "Planning next moves";
    case "changes": return "Making changes";
    case "summary": return "Summarizing";
    default: return phase;
  }
}

function phaseIcon(phase: string): string {
  switch (phase) {
    case "thinking": return "lightbulb";
    case "analysis": return "inspect";
    case "plan": return "checklist";
    case "changes": return "diff";
    case "summary": return "note";
    default: return "circle-large-outline";
  }
}

function shortPath(s: string): string {
  if (!s) return "";
  const parts = s.split("/");
  return parts[parts.length - 1] ?? s;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)  }...` : s;
}

// ─── Hook: derive steps from turn data ─────────────────────

function useThinkingSteps(turnId: TurnId): LogStep[] {
  const turn = useAtomValue(turnAtomFamily(turnId));
  // Subscribe to tool call IDs so we re-render when new TCs arrive
  useAtomValue(toolCallIdsByTurnAtom);

  return useMemo(() => {
    if (!turn) return [];
    const steps: LogStep[] = [];

    for (const phase of turn.phases) {
      if (phase.phase === "user_message") continue;

      // If phase has no messages and no tool calls and isn't running, skip
      if (
        phase.status !== "running" &&
        phase.status !== "success" &&
        phase.status !== "error"
      ) continue;

      // For thinking phase: show compact label (detail is in MessageRow)
      if (phase.phase === "thinking") {
        steps.push({
          key: `phase-${phase.phase}`,
          icon: phaseIcon(phase.phase),
          label: phase.status === "running" ? "Thinking..." : "Thought briefly",
          status: phase.status === "running" ? "active" : "done",
        });
        continue;
      }

      // Skip summary phase — it's rendered by TurnPhaseSection
      if (phase.phase === "summary") continue;

      // For other phases: show individual tool calls as steps
      // but also show the phase label if it's the currently active phase
      if (phase.tool_call_ids.length === 0 && phase.status === "running") {
        steps.push({
          key: `phase-${phase.phase}`,
          icon: phaseIcon(phase.phase),
          label: phaseActiveLabel(phase.phase),
          status: "active",
        });
      }

      // Tool calls are shown as individual steps (derived from IDs)
      // We'll show them via ToolStepRow components below
      for (const tcId of phase.tool_call_ids) {
        steps.push({
          key: `tc-${tcId}`,
          icon: "", // will be derived from tool call atom
          label: tcId, // placeholder - ToolStepRow reads the actual atom
          status: "done",
        });
      }

      // If phase is running and has tool calls, the last might still be active
      // This is handled by ToolStepRow reading status from atom
    }

    return steps;
  }, [turn]);
}

// ─── Sub-components ────────────────────────────────────────

/** Renders a single tool call step from atom */
const ToolStepRow = React.memo(function ToolStepRow({ id }: { id: string }) {
  const tc = useAtomValue(toolCallAtomFamily(id));
  if (!tc) return null;

  const isActive = tc.status === "running";
  const label = toolLabel(tc);
  const icon = toolIcon(tc);

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-0.5 animate-[fade-in_0.2s_ease]",
        isActive && "text-vsc-text-primary",
      )}
    >
      {isActive ? (
        <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-vsc-accent/30 animate-ping" aria-hidden="true" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-vsc-accent" />
        </span>
      ) : (
        <Icon name={icon} tokenSize="xs" className="text-vsc-text-ghost shrink-0" />
      )}
      <Text size="xs" tone={isActive ? "primary" : "tertiary"}>
        {label}
      </Text>
      {tc.duration_ms != null && !isActive && (
        <Text size="2xs" tone="ghost" mono className="ml-auto shrink-0">
          {tc.duration_ms < 1000 ? `${tc.duration_ms}ms` : `${(tc.duration_ms / 1000).toFixed(1)}s`}
        </Text>
      )}
    </div>
  );
});

/** Renders a phase-level step (Thinking, Planning, etc.) */
function PhaseStepRow({ step }: { step: LogStep }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-0.5 animate-[fade-in_0.2s_ease]",
        step.status === "active" && "text-vsc-text-primary",
      )}
    >
      {step.status === "active" ? (
        <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-vsc-accent/30 animate-ping" aria-hidden="true" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-vsc-accent" />
        </span>
      ) : (
        <Icon name={step.icon} tokenSize="xs" className="text-vsc-text-ghost shrink-0" />
      )}
      <Text size="xs" tone={step.status === "active" ? "primary" : "tertiary"}>
        {step.label}
      </Text>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

/**
 * ThinkingLog — compact, real-time activity stream for a running turn.
 * Shows "Thought briefly", "Read file.ts", "Planning next moves" etc.
 * Inspired by Claude.ai's thinking step display.
 */
export const ThinkingLog = React.memo(function ThinkingLog({
  turnId,
}: {
  turnId: TurnId;
}) {
  const steps = useThinkingSteps(turnId);

  if (steps.length === 0) return null;

  return (
    <div className="px-4 py-1.5" data-testid="thinking-log">
      <div className="flex flex-col gap-0">
        {steps.map((step) =>
          step.key.startsWith("tc-") ? (
            <ToolStepRow key={step.key} id={step.key.slice(3)} />
          ) : (
            <PhaseStepRow key={step.key} step={step} />
          ),
        )}
      </div>
    </div>
  );
});
