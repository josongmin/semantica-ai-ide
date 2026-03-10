import React from "react";

import { Button } from "~shared/ui";

interface Candidate {
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

const SAMPLE_CANDIDATES: Candidate[] = [
  { id: "c1", label: "Candidate A", score: 0.85 },
  { id: "c2", label: "Candidate B", score: 0.72 },
  { id: "c3", label: "Candidate C", score: 0.68 },
];

export const ConvergencePane = React.memo(function ConvergencePane() {
  return (
    <div className="px-4 py-2.5 border-t border-vsc-border bg-vsc-surface-1">
      <h3 className="text-2xs font-semibold text-vsc-text-tertiary uppercase tracking-wider mb-2">
        Convergence
      </h3>
      <div className="flex items-center gap-2">
        {SAMPLE_CANDIDATES.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-vsc-surface-2 text-xs"
          >
            <span className="text-vsc-fg">{c.label}</span>
            <span className="text-vsc-text-tertiary tabular-nums">
              {c.score.toFixed(2)}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-1.5 ml-auto">
          <Button variant="primary" size="sm">Select A</Button>
          <Button variant="ghost" size="sm">Compare</Button>
          <Button variant="ghost" size="sm">View Evidence</Button>
        </div>
      </div>
    </div>
  );
});
