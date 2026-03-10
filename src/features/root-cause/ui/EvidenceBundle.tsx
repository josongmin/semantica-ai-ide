import React, { useCallback } from "react";

import type { EvidenceItem, EvidenceKind } from "~shared/protocol/types";
import { cn, Collapsible, Icon, Text } from "~shared/ui";

// ─── Icon Mapping ────────────────────────────────────────

const EVIDENCE_ICON: Record<EvidenceKind, string> = {
  "call-path": "arrow-both",
  "dataflow-path": "arrow-swap",
  "recent-commit": "git-commit",
  "runtime-trace": "pulse",
  "test-failure": "beaker",
  "stack-trace": "debug-stackframe",
  "config-change": "settings-gear",
  "layer-violation": "shield",
};

// ─── Props ───────────────────────────────────────────────

interface EvidenceBundleProps {
  evidence: readonly EvidenceItem[];
  onFileClick?: (filePath: string, line: number) => void;
  className?: string;
}

// ─── Relevance Bar ───────────────────────────────────────

const RelevanceBar = React.memo(function RelevanceBar({
  relevance,
}: {
  relevance: number;
}) {
  const pct = Math.round(relevance * 100);

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1 rounded-full bg-vsc-surface-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-vsc-accent transition-[width] duration-normal ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Text size="3xs" className="tabular-nums text-vsc-text-ghost shrink-0">
        {pct}%
      </Text>
    </div>
  );
});

// ─── Evidence Row ────────────────────────────────────────

const EvidenceRow = React.memo(function EvidenceRow({
  item,
  onFileClick,
}: {
  item: EvidenceItem;
  onFileClick?: (filePath: string, line: number) => void;
}) {
  const iconName = EVIDENCE_ICON[item.kind];

  const handleFileClick = useCallback(() => {
    if (item.filePath && item.line !== undefined) {
      onFileClick?.(item.filePath, item.line);
    }
  }, [onFileClick, item.filePath, item.line]);

  const fileName = item.filePath?.split("/").pop();

  const header = (
    <div className="flex items-center gap-1.5 min-w-0">
      <RelevanceBar relevance={item.relevance} />
    </div>
  );

  return (
    <Collapsible
      title={item.title}
      icon={iconName}
      headerRight={header}
      defaultCollapsed
      contentClassName="px-3 pb-2"
    >
      <div className="flex flex-col gap-1.5">
        {/* Detail */}
        <Text size="2xs" tone="secondary" className="leading-relaxed whitespace-pre-wrap">
          {item.detail}
        </Text>

        {/* File link */}
        {item.filePath && (
          <button
            type="button"
            onClick={handleFileClick}
            className={cn(
              "flex items-center gap-1 text-2xs text-vsc-text-link hover:underline",
              "cursor-pointer bg-transparent border-none p-0 self-start",
            )}
          >
            <Icon name="go-to-file" tokenSize="sm" />
            {fileName}
            {item.line !== undefined && `:${String(item.line)}`}
          </button>
        )}

        {/* Commit hash */}
        {item.commitHash && (
          <div className="flex items-center gap-1">
            <Icon
              name="git-commit"
              tokenSize="sm"
              className="text-vsc-text-ghost"
            />
            <Text size="3xs" className="font-mono text-vsc-text-ghost">
              {item.commitHash.slice(0, 8)}
            </Text>
          </div>
        )}
      </div>
    </Collapsible>
  );
});

// ─── Component ───────────────────────────────────────────

export const EvidenceBundle = React.memo(function EvidenceBundle({
  evidence,
  onFileClick,
  className,
}: EvidenceBundleProps) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {evidence.map((item) => (
        <EvidenceRow
          key={item.id}
          item={item}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );
});
