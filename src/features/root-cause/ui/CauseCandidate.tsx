import React, { useCallback } from "react";

import type { EvidenceKind } from "~shared/protocol/types";
import { cn, Icon, Text } from "~shared/ui";

import type { CauseCandidate as CauseCandidateType } from "../model/types";

// ─── Evidence Kind Labels ────────────────────────────────

const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  "call-path": "call-path",
  "dataflow-path": "dataflow",
  "recent-commit": "commit",
  "runtime-trace": "runtime",
  "test-failure": "test",
  "stack-trace": "stack",
  "config-change": "config",
  "layer-violation": "layer",
};

// ─── Props ───────────────────────────────────────────────

interface CauseCandidateProps {
  candidate: CauseCandidateType;
  evidenceKinds?: ReadonlyMap<string, EvidenceKind>;
  onFileClick?: (filePath: string, line: number) => void;
  onEvidenceClick?: (evidenceId: string) => void;
  className?: string;
}

// ─── Confidence Bar ──────────────────────────────────────

const ConfidenceBar = React.memo(function ConfidenceBar({
  confidence,
}: {
  confidence: number;
}) {
  const pct = Math.round(confidence * 100);
  let colorClass: string;
  if (pct >= 80) colorClass = "bg-vsc-success";
  else if (pct >= 60) colorClass = "bg-vsc-warning";
  else colorClass = "bg-vsc-error";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-vsc-surface-3 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-normal ease-out",
            colorClass,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <Text size="2xs" className="tabular-nums shrink-0 text-vsc-text-secondary">
        {pct}%
      </Text>
    </div>
  );
});

// ─── Component ───────────────────────────────────────────

export const CauseCandidateCard = React.memo(function CauseCandidateCard({
  candidate,
  evidenceKinds,
  onFileClick,
  onEvidenceClick,
  className,
}: CauseCandidateProps) {
  const handleFileClick = useCallback(() => {
    onFileClick?.(candidate.filePath, candidate.line);
  }, [onFileClick, candidate.filePath, candidate.line]);

  const handleEvidenceClick = useCallback(
    (evidenceId: string) => {
      onEvidenceClick?.(evidenceId);
    },
    [onEvidenceClick],
  );

  const fileName = candidate.filePath.split("/").pop() ?? candidate.filePath;

  return (
    <div
      className={cn(
        "flex gap-3 px-3 py-2.5 rounded-md",
        "backdrop-blur-md bg-vsc-surface-0/80 border border-vsc-border/30",
        "transition-colors duration-fast hover:bg-vsc-list-hover",
        className,
      )}
    >
      {/* Rank */}
      <div className="flex items-start pt-0.5">
        <Text
          size="sm"
          className="font-bold tabular-nums text-vsc-accent shrink-0 w-6 text-center"
        >
          #{candidate.rank}
        </Text>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Confidence */}
        <ConfidenceBar confidence={candidate.confidence} />

        {/* Symbol + file:line */}
        <div className="flex items-baseline gap-1.5 min-w-0">
          <Icon
            name="symbol-method"
            tokenSize="sm"
            className="text-vsc-accent shrink-0 relative top-px"
          />
          <Text size="xs" className="font-medium text-vsc-fg truncate">
            {candidate.symbolName}
          </Text>
          <button
            type="button"
            onClick={handleFileClick}
            className={cn(
              "text-2xs text-vsc-text-link hover:underline cursor-pointer",
              "bg-transparent border-none p-0 truncate shrink-0",
            )}
          >
            {fileName}:{candidate.line}
          </button>
        </div>

        {/* Description */}
        <Text size="2xs" tone="secondary" className="leading-relaxed">
          {candidate.description}
        </Text>

        {/* Evidence pills */}
        {candidate.evidenceIds.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {candidate.evidenceIds.map((eid) => {
              const kind = evidenceKinds?.get(eid);
              const label = kind ? EVIDENCE_KIND_LABEL[kind] : eid.slice(0, 8);
              return (
                <button
                  key={eid}
                  type="button"
                  onClick={() => handleEvidenceClick(eid)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-3xs font-medium",
                    "bg-vsc-badge-bg text-vsc-badge-fg",
                    "hover:bg-vsc-accent/20 cursor-pointer",
                    "border-none transition-colors duration-fast",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
