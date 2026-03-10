import React, { useMemo } from "react";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";

import type { TurnId } from "../../shared/protocol";
import { cn, GATE_STATUS_COLOR, GATE_STATUS_ICON, Icon, RISK_TEXT_COLOR, StatusDot, Text } from "../../shared/ui";

export const ValidationPanel = React.memo(function ValidationPanel({ turnId }: { turnId: TurnId }) {
  const validationAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.validation), [turnId]);
  const state = useAtomValue(validationAtom);

  const invariantPassCount = useMemo(() => state.invariants.filter(i => i.status === "pass").length, [state.invariants]);
  const qapiResolvedCount = useMemo(() => state.qapi_results.filter(q => q.status === "resolved").length, [state.qapi_results]);

  // Hide when no meaningful data (all arrays empty + default runner idle)
  if (
    state.invariants.length === 0 &&
    state.risk_witnesses.length === 0 &&
    state.qapi_results.length === 0 &&
    state.counter_examples.length === 0 &&
    state.runner_status === "idle"
  ) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="validation-panel">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="verified-filled" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">Validation Core</Text>
        <Icon name={GATE_STATUS_ICON[state.policy_check]} tokenSize="2xs" className={cn("ml-auto", GATE_STATUS_COLOR[state.policy_check])} />
      </div>

      <div className="pl-5 space-y-1.5">
        {/* Invariants */}
        {state.invariants.length > 0 && (
          <div>
            <Text size="2xs" tone="ghost" className="mb-0.5">Invariants ({invariantPassCount}/{state.invariants.length})</Text>
            <div className="space-y-0.5">
              {state.invariants.map((inv) => (
                <div key={inv.id} className="flex items-center gap-1.5">
                  <Icon name={GATE_STATUS_ICON[inv.status]} tokenSize="2xs" className={GATE_STATUS_COLOR[inv.status]} />
                  <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">{inv.invariant}</Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Witnesses */}
        {state.risk_witnesses.length > 0 && (
          <div>
            <Text size="2xs" tone="ghost" className="mb-0.5">Risk Witnesses</Text>
            <div className="space-y-0.5">
              {state.risk_witnesses.map((rw) => (
                <div key={rw.id} className="flex items-center gap-1.5">
                  <Icon name="warning" tokenSize="2xs" className={RISK_TEXT_COLOR[rw.severity]} />
                  <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">{rw.description}</Text>
                  {rw.file_path && <Text size="2xs" mono tone="ghost">{rw.file_path.split("/").pop()}</Text>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QAPI Results */}
        {state.qapi_results.length > 0 && (
          <div>
            <Text size="2xs" tone="ghost" className="mb-0.5">QAPI ({qapiResolvedCount}/{state.qapi_results.length})</Text>
            <div className="space-y-0.5">
              {state.qapi_results.map((q) => (
                <div key={q.query_id} className="flex items-center gap-1.5">
                  <StatusDot status={(() => { if (q.status === "resolved") return "success" as const; if (q.status === "error") return "error" as const; return "idle" as const; })()} />
                  <Text size="2xs" mono tone="ghost">{q.query_type}</Text>
                  {q.answer && <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">{q.answer}</Text>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Counter Examples */}
        {state.counter_examples.length > 0 && (
          <div>
            <Text size="2xs" tone="ghost" className="mb-0.5">Counter Examples</Text>
            {state.counter_examples.map((ce) => (
              <div key={ce.id} className="flex items-center gap-1.5">
                <Icon name="bug" tokenSize="2xs" className="text-vsc-error" />
                <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">{ce.description}</Text>
              </div>
            ))}
          </div>
        )}

        {/* Runner */}
        <div className="flex items-center gap-2">
          <Text size="2xs" tone="ghost">Runner</Text>
          <StatusDot status={(() => { if (state.runner_status === "pass") return "success" as const; if (state.runner_status === "fail") return "error" as const; if (state.runner_status === "running") return "running" as const; return "idle" as const; })()} />
          <Text size="2xs" mono tone="primary">{state.runner_status}</Text>
          {state.runner_summary && <Text size="2xs" tone="secondary">— {state.runner_summary}</Text>}
        </div>
      </div>
    </div>
  );
});
