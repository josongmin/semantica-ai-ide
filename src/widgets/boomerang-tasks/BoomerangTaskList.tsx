import React, { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import {
  allBoomerangTasksCompleteAtom,
  boomerangTasksByTurnAtom,
} from "../../features/boomerang-tasks";
import type { BoomerangTask, TurnId } from "../../shared/protocol";
import { Badge, Button, cn, Collapsible, Icon, Spinner, Text } from "../../shared/ui";

interface BoomerangTaskListProps {
  turnId: TurnId;
  onMergeResults?: (turnId: TurnId) => void;
}

const statusIcons: Record<BoomerangTask["status"], string> = {
  pending: "circle-outline",
  running: "loading",
  success: "check",
  error: "error",
};

const statusColors: Record<BoomerangTask["status"], string> = {
  pending: "text-vsc-text-tertiary",
  running: "text-vsc-info",
  success: "text-vsc-success",
  error: "text-vsc-error",
};

const statusBadgeVariants: Record<BoomerangTask["status"], "default" | "success" | "warning" | "error" | "info"> = {
  pending: "default",
  running: "info",
  success: "success",
  error: "error",
};

interface BoomerangTaskRowProps {
  task: BoomerangTask;
}

const BoomerangTaskRow = React.memo(function BoomerangTaskRow({ task }: BoomerangTaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(task.result_summary);

  const handleToggle = useCallback(() => {
    if (hasDetails) setExpanded((prev) => !prev);
  }, [hasDetails]);


  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-2 py-1.5 rounded",
        "border border-vsc-border/50 bg-vsc-surface-2",
      )}
      data-testid={`boomerang-task-${task.id}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn("flex items-center gap-2 w-full text-left px-0 py-0 h-auto", hasDetails && "cursor-pointer")}
        onClick={hasDetails ? handleToggle : undefined}
        aria-expanded={hasDetails ? expanded : undefined}
        disabled={!hasDetails}
        tabIndex={hasDetails ? 0 : -1}
      >
        {/* Status icon */}
        {task.status === "running" ? (
          <Spinner size="sm" className={statusColors[task.status]} />
        ) : (
          <Icon name={statusIcons[task.status]} tokenSize="2xs" className={statusColors[task.status]} />
        )}

        {/* Label */}
        <Text size="xs" className="flex-1 min-w-0 truncate">
          {task.label}
        </Text>

        {/* Agent badge */}
        {task.agent_id && (
          <Badge text={task.agent_id} variant={statusBadgeVariants[task.status]} />
        )}

        {/* Expand chevron */}
        {hasDetails && (
          <Icon
            name={expanded ? "chevron-down" : "chevron-right"}
            tokenSize="2xs"
            className="text-vsc-text-tertiary"
          />
        )}
      </Button>

      {/* Expanded result summary */}
      {expanded && task.result_summary && (
        <div className="pl-5 pb-1">
          <Text size="2xs" tone="secondary" className="whitespace-pre-wrap">
            {task.result_summary}
          </Text>
        </div>
      )}
    </div>
  );
});

/**
 * Boomerang Task List: Shows subtasks delegated from a parent turn.
 * Each subtask displays status, label, agent badge, and collapsible result.
 * Shows a "Merge Results" button when all subtasks are complete.
 */
export const BoomerangTaskList = React.memo(function BoomerangTaskList({
  turnId,
  onMergeResults,
}: BoomerangTaskListProps) {
  const tasks = useAtomValue(boomerangTasksByTurnAtom(turnId));
  const allComplete = useAtomValue(allBoomerangTasksCompleteAtom(turnId));

  const handleMerge = useCallback(() => {
    onMergeResults?.(turnId);
  }, [onMergeResults, turnId]);

  if (tasks.length === 0) return null;

  const completedCount = tasks.filter((t) => t.status === "success" || t.status === "error").length;

  return (
    <Collapsible
      title="Subtasks"
      icon="git-merge"
      summary={`${completedCount}/${tasks.length} complete`}
      defaultCollapsed={false}
    >
      <div
        className="flex flex-col gap-1"
        data-testid="boomerang-task-list"
        role="list"
        aria-label={`Boomerang subtasks for turn ${turnId}`}
      >
        {tasks.map((task) => (
          <div key={task.id} role="listitem">
            <BoomerangTaskRow task={task} />
          </div>
        ))}

        {/* Merge Results button */}
        {allComplete && onMergeResults && (
          <div className="flex justify-end mt-1">
            <Button variant="primary" size="sm" onClick={handleMerge}>
              <Icon name="git-merge" tokenSize="2xs" className="mr-1" />
              Merge Results
            </Button>
          </div>
        )}
      </div>
    </Collapsible>
  );
});
