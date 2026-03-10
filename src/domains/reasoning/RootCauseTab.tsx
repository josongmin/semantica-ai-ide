/**
 * RootCauseTab — displays symptom, cause candidates, evidence, and causal chain
 */

import { memo } from "react";

import type { RootCauseAnalysis } from "~features/root-cause";
import { Icon } from "~shared/ui/primitives/Icon";

import { CausalChainMini } from "./components/CausalChainMini";
import { CauseCandidateRow } from "./components/CauseCandidateRow";

// ─── Evidence kind badge colors ─────────────────────────

const evidenceKindColor: Record<string, string> = {
  "call-path": "bg-vsc-info/20 text-vsc-info",
  "dataflow-path": "bg-vsc-accent/20 text-vsc-accent",
  "recent-commit": "bg-vsc-warning/20 text-vsc-warning",
  "runtime-trace": "bg-vsc-success/20 text-vsc-success",
  "test-failure": "bg-vsc-error/20 text-vsc-error",
  "stack-trace": "bg-vsc-warning/20 text-vsc-warning",
  "config-change": "bg-vsc-info/20 text-vsc-info",
  "layer-violation": "bg-vsc-error/20 text-vsc-error",
};

export const RootCauseTab = memo(function RootCauseTab({
  analysis,
  loading,
}: {
  analysis: RootCauseAnalysis | null;
  loading: boolean;
}) {
  if (!analysis && !loading) return null;

  if (loading && !analysis) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Icon
            name="loading"
            size={24}
            className="mx-auto text-vsc-text-ghost animate-spin"
          />
          <p className="text-xs text-vsc-text-secondary">
            Analyzing root cause...
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Symptom */}
      <div className="px-4 py-3 border-b border-vsc-border/20 backdrop-blur-md bg-vsc-surface-0/80">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="alert-circle" size={14} className="text-vsc-warning shrink-0" />
          <h3 className="text-xs font-semibold text-vsc-text-primary">
            Symptom
          </h3>
          {loading && (
            <Icon name="loading" size={12} className="text-vsc-text-ghost animate-spin ml-auto" />
          )}
          {!loading && (
            <span className="ml-auto text-3xs text-vsc-success">
              {analysis.status === "complete" ? "Complete" : "Partial"}
            </span>
          )}
        </div>
        <p className="text-2xs text-vsc-text-secondary">{analysis.symptom}</p>
        <span className="text-3xs text-vsc-text-ghost">
          {analysis.symptomFile}:{analysis.symptomLine}
        </span>
      </div>

      {/* Cause Candidates */}
      <div className="border-b border-vsc-border/20">
        <div className="px-4 pt-3 pb-1">
          <h4 className="text-3xs font-semibold uppercase tracking-wider text-vsc-text-ghost">
            Cause Candidates ({analysis.candidates.length})
          </h4>
        </div>
        {analysis.candidates.map((c) => (
          <CauseCandidateRow key={c.id} candidate={c} />
        ))}
      </div>

      {/* Evidence */}
      <div className="border-b border-vsc-border/20">
        <div className="px-4 pt-3 pb-1">
          <h4 className="text-3xs font-semibold uppercase tracking-wider text-vsc-text-ghost">
            Evidence ({analysis.evidence.length})
          </h4>
        </div>
        {analysis.evidence.map((ev) => (
          <div
            key={ev.id}
            className="px-4 py-2 border-b border-vsc-border/10 hover:bg-vsc-surface-1/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`text-3xs px-1.5 py-0.5 rounded ${
                  evidenceKindColor[ev.kind] ?? "bg-vsc-surface-2 text-vsc-text-ghost"
                }`}
              >
                {ev.kind}
              </span>
              <span className="text-xs text-vsc-text-primary truncate">
                {ev.title}
              </span>
            </div>
            <p className="text-2xs text-vsc-text-ghost pl-0">{ev.detail}</p>
            {ev.filePath && (
              <span className="text-3xs text-vsc-text-ghost">
                {ev.filePath}
                {ev.line !== undefined ? `:${ev.line}` : ""}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Causal Chain */}
      <CausalChainMini analysis={analysis} />
    </div>
  );
});
