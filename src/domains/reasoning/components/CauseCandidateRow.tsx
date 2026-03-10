/**
 * CauseCandidateRow — renders a single cause candidate with rank, description, and confidence
 */

import { memo } from "react";

import type { CauseCandidate } from "~features/root-cause";

import { ConfidenceBar } from "./ConfidenceBar";

export const CauseCandidateRow = memo(function CauseCandidateRow({
  candidate,
}: {
  candidate: CauseCandidate;
}) {
  return (
    <div className="px-4 py-2.5 border-b border-vsc-border/20 hover:bg-vsc-surface-1/50 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-3xs font-mono text-vsc-text-ghost w-4">
          #{candidate.rank}
        </span>
        <span className="text-xs font-semibold text-vsc-text-primary truncate">
          {candidate.symbolName}
        </span>
      </div>
      <p className="text-2xs text-vsc-text-secondary mb-1.5 pl-6">
        {candidate.description}
      </p>
      <div className="pl-6 flex items-center gap-3">
        <span className="text-3xs text-vsc-text-ghost truncate max-w-48">
          {candidate.filePath}:{candidate.line}
        </span>
        <div className="flex-1 max-w-32">
          <ConfidenceBar value={candidate.confidence} />
        </div>
      </div>
    </div>
  );
});
