import React, { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { threeWayDiffsByTurnFamily } from "../../features/three-way-diff";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { ThreeWayConflictRegion, ThreeWayDiffData, TurnId } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

// ─── Helpers ────────────────────────────────────────────────

function isConflictLine(lineNumber: number, conflicts: readonly ThreeWayConflictRegion[]): boolean {
  return conflicts.some((c) => lineNumber >= c.start_line && lineNumber <= c.end_line);
}

function splitLines(content: string): string[] {
  return content.split("\n");
}

function extractFileName(filePath: string): string {
  const parts = filePath.split("/");
  return parts[parts.length - 1] ?? filePath;
}

const RESOLUTION_LABELS: Record<string, string> = {
  accept_agent: "Agent 변경 적용",
  accept_current: "현재 유지",
  manual_merge: "수동 병합",
};

// ─── Diff Panel ─────────────────────────────────────────────

interface DiffPanelProps {
  readonly title: string;
  readonly icon: string;
  readonly content: string;
  readonly conflicts: readonly ThreeWayConflictRegion[];
}

const DiffPanel = React.memo(function DiffPanel({
  title,
  icon,
  content,
  conflicts,
}: DiffPanelProps) {
  const lines = useMemo(() => splitLines(content), [content]);

  return (
    <div className="flex flex-col flex-1 min-w-0 border border-vsc-border rounded-md overflow-hidden">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-vsc-surface-1 border-b border-vsc-border">
        <Icon name={icon} tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="xs" weight="medium" truncate>
          {title}
        </Text>
        <Text size="2xs" tone="ghost" className="ml-auto">
          {lines.length} line{lines.length !== 1 ? "s" : ""}
        </Text>
      </div>
      <pre
        className="text-xs leading-relaxed overflow-auto m-0 max-h-[--panel-max-h-md]"
        tabIndex={0}
        role="region"
        aria-label={`${title} content`}
      >
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const inConflict = isConflictLine(lineNum, conflicts);
          return (
            <div
              key={lineNum}
              className={cn(
                "flex",
                inConflict &&
                  "bg-[var(--vscode-merge-incomingContentBackground,rgba(219,68,149,0.13))]",
              )}
            >
              <span
                className={cn(
                  "w-10 shrink-0 text-right pr-2 select-none tabular-nums border-r mr-2",
                  inConflict
                    ? "text-[var(--vscode-merge-incomingHeaderBackground,#c74b88)] border-[var(--vscode-merge-incomingHeaderBackground,#c74b88)]/30"
                    : "text-vsc-text-ghost border-vsc-border/30",
                )}
              >
                {lineNum}
              </span>
              <span className="px-1 flex-1 whitespace-pre">{line}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
});

// ─── Single Diff Card ───────────────────────────────────────

const ThreeWayDiffCard = React.memo(function ThreeWayDiffCard({
  data,
}: {
  data: ThreeWayDiffData;
}) {
  const isPending = data.status === "pending";
  const fileName = extractFileName(data.file_path);
  const conflictCount = data.conflicts.length;

  const handleResolve = useCallback(
    (resolution: string) => {
      getVscodeApi().postMessage({ type: "RESOLVE_THREE_WAY_DIFF", id: data.id, resolution });
    },
    [data.id],
  );

  // Resolved: compact badge
  if (!isPending) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-vsc-surface-1 border border-vsc-border/40">
        <Icon name="check" tokenSize="xs" className="text-vsc-success" />
        <Text size="xs" tone="secondary">
          {fileName} — {RESOLUTION_LABELS[data.resolution ?? "accept_agent"]}
        </Text>
      </div>
    );
  }

  // Pending: full three-panel view with actions
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg border border-vsc-warning/40 bg-vsc-warning/5 animate-[fade-in_var(--duration-normal)_var(--ease-default)]"
      data-testid={`three-way-diff-${data.id}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon name="diff-multiple" tokenSize="sm" className="text-vsc-warning" />
        <Text size="xs" weight="bold">
          Conflict
        </Text>
        <Text size="2xs" tone="secondary" truncate title={data.file_path}>
          {fileName}
        </Text>
        {conflictCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-vsc-error/10 text-vsc-error text-2xs">
            {conflictCount} conflict{conflictCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Three panels */}
      <div className="flex gap-2 overflow-x-auto">
        <DiffPanel
          title="Base"
          icon="git-commit"
          content={data.base_content}
          conflicts={data.conflicts}
        />
        <DiffPanel
          title="Agent"
          icon="robot"
          content={data.agent_content}
          conflicts={data.conflicts}
        />
        <DiffPanel
          title="Current"
          icon="file"
          content={data.current_content}
          conflicts={data.conflicts}
        />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button variant="primary" size="sm" onClick={() => handleResolve("accept_agent")}>
          Accept Agent
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleResolve("accept_current")}>
          Keep Current
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleResolve("manual_merge")}>
          Manual Merge
        </Button>
      </div>
    </div>
  );
});

// ─── Main Widget (Turn-Scoped) ──────────────────────────────

export interface ThreeWayDiffProps {
  readonly turnId: TurnId;
}

export const ThreeWayDiff = React.memo(function ThreeWayDiff({ turnId }: ThreeWayDiffProps) {
  const diffs = useAtomValue(threeWayDiffsByTurnFamily(turnId));

  if (diffs.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {diffs.map((d) => (
        <ThreeWayDiffCard key={d.id} data={d} />
      ))}
    </div>
  );
});
