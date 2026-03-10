import React, { useCallback, useMemo, useState } from "react";
import { useAtomValue } from "jotai";

import { toolCallGroupsByTurnAtom } from "~entities/tool-call";

import { PHASE_META } from "../../shared/lib/phaseMeta";
import type { TurnId, TurnPhaseEntry } from "../../shared/protocol";
import { cn, Icon, Spinner, Text } from "../../shared/ui";
import { FileChangeSummaryWidget } from "../file-change-summary";
import { MessageRow } from "../message-row";
import { PlanChecklistWidget } from "../plan-checklist";
import { ProjectTodoCardWidget } from "../project-todo-card";
import { ToolCallRow } from "../tool-call-group";

interface TurnPhaseSectionProps {
  turnId: TurnId;
  entry: TurnPhaseEntry;
}

/**
 * Timeline-style phase section.
 * user_message / summary → flat message rendering
 * thinking / analysis / plan / changes → collapsible timeline entry with tool calls as sub-items
 */
export const TurnPhaseSection = React.memo(function TurnPhaseSection({
  turnId,
  entry,
}: TurnPhaseSectionProps) {
  const allGroups = useAtomValue(toolCallGroupsByTurnAtom(turnId));

  const [collapsed, setCollapsed] = useState<boolean | undefined>(undefined);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      if (prev === undefined) return !entry.collapsed;
      return !prev;
    });
  }, [entry.collapsed]);

  // Flatten tool calls for this phase (show individually, not grouped)
  const toolCallIds = useMemo(() => {
    if (entry.tool_call_ids.length === 0) return [];
    const phaseIds = new Set(entry.tool_call_ids);
    const ids: string[] = [];
    for (const g of allGroups) {
      for (const tc of g.calls) {
        if (phaseIds.has(tc.id)) ids.push(tc.id);
      }
    }
    return ids;
  }, [allGroups, entry.tool_call_ids]);

  const isUserMessage = entry.phase === "user_message";
  const isThinking = entry.phase === "thinking";
  const isSummary = entry.phase === "summary";

  /* scrollbar-gutter(6px) 보정: 좌측 패딩 +6px로 시각적 대칭 */
  const scrollbarComp = "pl-4 pr-3";

  // user_message / thinking: render messages directly (no timeline chrome)
  if (isUserMessage || isThinking) {
    return (
      <div className={cn(scrollbarComp, "py-0.5")}>
        {entry.message_ids.map((msgId) => (
          <MessageRow key={msgId} messageId={msgId} />
        ))}
      </div>
    );
  }

  // summary: render messages directly
  if (isSummary) {
    return (
      <div className={cn(scrollbarComp, "py-0.5")}>
        {entry.message_ids.map((msgId) => (
          <MessageRow key={msgId} messageId={msgId} />
        ))}
        <ProjectTodoCardWidget turnId={turnId} />
      </div>
    );
  }

  // While running, force open
  let isOpen: boolean;
  if (entry.status === "running") {
    isOpen = true;
  } else if (collapsed === undefined) {
    isOpen = !entry.collapsed;
  } else {
    isOpen = !collapsed;
  }

  const meta = PHASE_META[entry.phase];

  const hasContent =
    entry.message_ids.length > 0 ||
    toolCallIds.length > 0 ||
    entry.phase === "plan" ||
    entry.phase === "changes";

  return (
    <div>
      {/* Phase header — clickable timeline entry */}
      <button
        type="button"
        onClick={hasContent ? handleToggle : undefined}
        tabIndex={hasContent ? 0 : -1}
        className={cn(
          "relative flex items-center gap-2 w-full py-1.5 text-left",
          scrollbarComp,
          "transition-colors duration-fast",
          hasContent && "hover:bg-vsc-list-hover cursor-pointer",
          !hasContent && "cursor-default pointer-events-none",
          "bg-transparent border-none focus-ring",
        )}
        aria-expanded={hasContent ? isOpen : undefined}
        aria-disabled={!hasContent || undefined}
      >
        {/* Chevron */}
        {hasContent ? (
          <Icon
            name="chevron-right"
            tokenSize="2xs"
            className={cn(
              "text-vsc-text-tertiary shrink-0 transition-transform duration-normal",
              isOpen && "rotate-90",
            )}
          />
        ) : (
          <span className="w-3 shrink-0" />
        )}

        {/* Phase icon — pulses while running, settles on completion */}
        {meta.icon &&
          (entry.status === "running" ? (
            <Spinner size="sm" className="text-vsc-text-primary" />
          ) : (
            <Icon
              name={(() => {
                if (entry.status === "success") return "check";
                if (entry.status === "error") return "error";
                return meta.icon;
              })()}
              tokenSize="sm"
              className={cn(
                "shrink-0 transition-colors duration-normal",
                entry.status === "success" && "text-vsc-success",
                entry.status === "error" && "text-vsc-error",
                entry.status !== "success" && entry.status !== "error" && "text-vsc-text-secondary",
              )}
            />
          ))}

        {/* Phase label */}
        <Text
          size="2xs"
          weight="medium"
          tone={entry.status === "running" ? "primary" : "secondary"}
          className="shrink-0"
        >
          {meta.label}
        </Text>

        {/* Summary text */}
        {entry.summary && (
          <Text size="2xs" tone="tertiary" truncate className="flex-1 min-w-0">
            {entry.summary}
          </Text>
        )}

        {/* Phase duration — shown after completion */}
        {entry.duration_ms != null && entry.status !== "running" && (
          <Text size="2xs" tone="ghost" mono className="shrink-0 tabular-nums">
            {entry.duration_ms < 1000
              ? `${entry.duration_ms}ms`
              : `${(entry.duration_ms / 1000).toFixed(1)}s`}
          </Text>
        )}
      </button>

      {/* Expanded content — messages + individual tool calls */}
      {isOpen && hasContent && (
        <div className="pl-8 pr-7 pb-1 animate-[fade-in_var(--duration-normal)_var(--ease-default)]">
          {/* Messages */}
          {entry.message_ids.map((msgId) => (
            <MessageRow key={msgId} messageId={msgId} />
          ))}

          {/* Individual tool calls — sequential timeline */}
          {toolCallIds.length > 0 && (
            <div className="mt-0.5">
              {toolCallIds.map((tcId) => (
                <ToolCallRow key={tcId} id={tcId} />
              ))}
            </div>
          )}

          {/* Plan checklist */}
          {entry.phase === "plan" && <PlanChecklistWidget turnId={turnId} />}

          {/* File change summary */}
          {entry.phase === "changes" && <FileChangeSummaryWidget turnId={turnId} />}
        </div>
      )}
    </div>
  );
});
