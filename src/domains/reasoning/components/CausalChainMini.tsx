/**
 * CausalChainMini — horizontal chain graph visualization of causal relationships
 */

import { memo } from "react";

import type { RootCauseAnalysis } from "~features/root-cause";
import { Icon } from "~shared/ui/primitives/Icon";

export const CausalChainMini = memo(function CausalChainMini({
  analysis,
}: {
  analysis: RootCauseAnalysis;
}) {
  const { nodes, edges } = analysis.causalChain;
  if (nodes.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <h4 className="text-3xs font-semibold uppercase tracking-wider text-vsc-text-ghost mb-2">
        Causal Chain
      </h4>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {nodes.map((node, idx) => {
          let roleColor: string;
          if (node.role === "root-cause") {
            roleColor = "border-vsc-error/60 bg-vsc-error/10";
          } else if (node.role === "symptom") {
            roleColor = "border-vsc-warning/60 bg-vsc-warning/10";
          } else {
            roleColor = "border-vsc-border/40 bg-vsc-surface-1";
          }

          const edge = idx < edges.length ? edges[idx] : null;

          return (
            <div key={node.id} className="flex items-center gap-1 shrink-0">
              <div
                className={`px-2 py-1 rounded border text-3xs ${roleColor}`}
              >
                <div className="font-semibold text-vsc-text-primary truncate max-w-24">
                  {node.symbolName}
                </div>
                <div className="text-vsc-text-ghost">{node.role}</div>
              </div>
              {edge && (
                <div className="flex items-center gap-0.5 text-vsc-text-ghost">
                  <span className="text-3xs truncate max-w-16">{edge.label}</span>
                  <Icon name="arrow-right" size={10} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
