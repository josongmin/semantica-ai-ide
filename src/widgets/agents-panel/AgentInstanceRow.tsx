import React, { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import { agentInstanceAtomFamily } from "~entities/agent-instance";

import { Badge, Button, cn, Icon, ProgressBar, Spinner, Text } from "../../shared/ui";

interface AgentInstanceRowProps {
  id: string;
  onCancel: (agentId: string) => void;
}

export const AgentInstanceRow = React.memo(function AgentInstanceRow({
  id,
  onCancel,
}: AgentInstanceRowProps) {
  const agent = useAtomValue(agentInstanceAtomFamily(id));

  const [expanded, setExpanded] = useState(false);

  const handleCancel = useCallback(() => {
    onCancel(id);
  }, [id, onCancel]);

  if (!agent) return null;

  const currentFileName = agent.current_file?.split("/").pop() ?? null;
  const hasFileProgress = agent.files_processed !== undefined && agent.files_total !== undefined;
  const hasResources = agent.resources?.memory_mb !== undefined || agent.resources?.cpu_percent !== undefined;

  const isRunning = agent.status === "running" || agent.status === "queued";
  const isDone = agent.status === "success";
  const isError = agent.status === "error";
  const isCancelled = agent.status === "cancelled";

  /* ── Border class ── */
  let borderClass: string;
  if (isRunning) {
    borderClass = "border-vsc-info/30 bg-vsc-surface-2/60";
  } else if (isError) {
    borderClass = "border-vsc-error/25 bg-vsc-error/5";
  } else {
    borderClass = "border-vsc-border/30 bg-vsc-surface-1/60";
  }

  /* ── Status icon ── */
  let statusIcon: React.ReactNode;
  if (isRunning) {
    statusIcon = <Spinner size="sm" className="text-vsc-info" />;
  } else if (isDone) {
    statusIcon = <Icon name="check" tokenSize="xs" className="text-vsc-success" />;
  } else if (isError) {
    statusIcon = <Icon name="error" tokenSize="xs" className="text-vsc-error" />;
  } else if (isCancelled) {
    statusIcon = <Icon name="circle-slash" tokenSize="xs" className="text-vsc-text-ghost" />;
  } else {
    statusIcon = <Icon name="circle-outline" tokenSize="xs" className="text-vsc-text-ghost" />;
  }

  return (
    <div
      className={cn(
        "group flex flex-col rounded-lg border transition-colors duration-normal",
        borderClass,
      )}
      data-testid={`agent-row-${id}`}
    >
      {/* ── Main row ── */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="shrink-0 flex items-center justify-center w-5 h-5">
          {statusIcon}
        </div>

        <div className="flex-1 min-w-0">
          <Text
            size="sm"
            weight="medium"
            title={agent.label}
            className={cn(
              "block truncate min-w-0",
              isDone || isCancelled ? "text-vsc-text-secondary" : "text-vsc-fg",
            )}
          >
            {agent.label}
          </Text>
          {agent.current_task && isRunning && (
            <Text size="2xs" tone="secondary" className="truncate min-w-0 block" title={agent.current_task} data-testid="current-task">
              {agent.current_task}
            </Text>
          )}
        </div>

        {/* File progress badge — running only */}
        {hasFileProgress && isRunning && (
          <Badge
            text={`${agent.files_processed}/${agent.files_total}`}
            variant="info"
            data-testid="file-progress-badge"
            className="tabular-nums shrink-0"
          />
        )}

        {/* Resource expand toggle */}
        {hasResources && (
          <Button
            variant="ghost"
            size="icon"
            className="p-1 text-vsc-text-ghost hover:text-vsc-text-secondary transition-colors duration-fast"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse details" : "Expand details"}
            aria-expanded={expanded}
            data-testid="expand-resources"
          >
            <Icon name={expanded ? "chevron-up" : "chevron-down"} tokenSize="2xs" />
          </Button>
        )}

        {/* Cancel — icon button */}
        {isRunning && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            aria-label={`Cancel agent ${agent.label}`}
            data-testid={`cancel-agent-${id}`}
            className={cn(
              "shrink-0 w-6 h-6 rounded-md",
              "text-vsc-text-ghost hover:text-vsc-error hover:bg-vsc-error/10",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-fast",
            )}
          >
            <Icon name="close" tokenSize="xs" />
          </Button>
        )}

        {/* Completed summary — file count inline */}
        {isDone && hasFileProgress && (
          <Text size="2xs" tone="ghost" className="tabular-nums shrink-0">
            {agent.files_processed} files
          </Text>
        )}
      </div>

      {/* ── Current file (running, when no task shown) ── */}
      {currentFileName && !agent.current_task && isRunning && (
        <Text
          size="2xs"
          tone="ghost"
          className="px-3 pb-1.5 truncate flex items-center gap-1"
          title={agent.current_file}
          data-testid="current-file"
        >
          <Icon name="file" tokenSize="2xs" />
          {currentFileName}
        </Text>
      )}

      {/* ── Progress bar — running only ── */}
      {isRunning && agent.progress > 0 && (
        <div className="px-3 pb-2">
          <ProgressBar
            value={agent.progress}
            max={100}
            label={`${agent.progress}%`}
            barClassName="bg-vsc-info"
          />
        </div>
      )}

      {/* ── Error message ── */}
      {agent.error_message && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-md bg-vsc-error/8 flex items-start gap-2">
          <Icon name="warning" tokenSize="2xs" className="text-vsc-error shrink-0 mt-0.5" />
          <Text size="2xs" tone="error" data-testid="agent-error" className="flex-1">
            {agent.error_message}
          </Text>
        </div>
      )}

      {/* ── Resource details (expanded) ── */}
      {expanded && hasResources && (
        <div className="px-3 pb-2 flex items-center gap-4" data-testid="resource-details">
          {agent.resources.memory_mb !== undefined && (
            <Text size="2xs" tone="ghost" className="flex items-center gap-1">
              <Icon name="database" tokenSize="2xs" />
              {agent.resources.memory_mb.toFixed(0)} MB
            </Text>
          )}
          {agent.resources.cpu_percent !== undefined && (
            <Text size="2xs" tone="ghost" className="flex items-center gap-1">
              <Icon name="pulse" tokenSize="2xs" />
              {agent.resources.cpu_percent.toFixed(0)}%
            </Text>
          )}
        </div>
      )}
    </div>
  );
});
