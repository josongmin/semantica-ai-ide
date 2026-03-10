import React, { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";

import type { TurnId } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

export const EvidenceBundleViewer = React.memo(function EvidenceBundleViewer({ turnId }: { turnId: TurnId }) {
  const bundleAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.evidenceBundle), [turnId]);
  const traceAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.decisionTrace), [turnId]);
  const bundle = useAtomValue(bundleAtom);
  const trace = useAtomValue(traceAtom);
  const [expanded, setExpanded] = useState(false);

  if ((!bundle?.bundle_id) && trace.length === 0) return null;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="evidence-bundle-viewer">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full text-left gap-2 bg-transparent"
      >
        <Icon name="chevron-right" tokenSize="2xs" className={cn("text-vsc-text-tertiary transition-transform duration-normal", expanded && "rotate-90")} />
        <Icon name="archive" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">Evidence Bundle</Text>
        {bundle && (
          <Icon name={bundle.gate_passed ? "pass-filled" : "error"} tokenSize="2xs" className={cn("ml-auto", bundle.gate_passed ? "text-vsc-success" : "text-vsc-error")} />
        )}
      </Button>

      {expanded && (
        <div className="pl-8 mt-1.5 space-y-1.5">
          {/* Digest chain */}
          {bundle && (
            <div className="space-y-0.5">
              <Text size="2xs" tone="ghost" className="mb-0.5">Digest Chain</Text>
              {[
                ["replay_key", bundle.replay_key],
                ["snapshot", bundle.snapshot_hash],
                ["env", bundle.env_digest],
                ["policy", bundle.policy_digest],
                ["ssot", bundle.ssot_digest],
                ["patch", bundle.patch_digest],
                ["runner_meta", bundle.runner_meta_digest],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center gap-2">
                  <Text size="2xs" mono tone="ghost" className="w-20 shrink-0">{label}</Text>
                  <Text size="2xs" mono tone="secondary" truncate className="flex-1 min-w-0">{value}</Text>
                </div>
              ))}
            </div>
          )}

          {/* Decision trace */}
          {trace.length > 0 && (
            <div>
              <Text size="2xs" tone="ghost" className="mb-0.5">Decision Trace ({trace.length})</Text>
              <div className="space-y-0.5 max-h-[200px] overflow-y-auto scroll-shadow">
                {trace.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-1.5">
                    <Text size="2xs" mono tone="ghost" className="shrink-0 w-12">{entry.stage}</Text>
                    <Text size="2xs" tone="secondary" className="flex-1">{entry.decision}</Text>
                    <Text size="2xs" tone="ghost" className="shrink-0">{entry.alternatives_considered} alt</Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof refs */}
          {bundle && bundle.proof_refs.length > 0 && (
            <div>
              <Text size="2xs" tone="ghost" className="mb-0.5">Proof References</Text>
              {bundle.proof_refs.map((ref) => (
                <Text key={ref} size="2xs" mono tone="secondary">{ref}</Text>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
