import React from "react";
import { useAtomValue } from "jotai";

import { selfTestLoopAtomFamily } from "../../entities/self-test";
import { Collapsible, ProgressBar } from "../../shared/ui";
import { type LoopIteration, LoopVisualizer } from "../loop-shared";

interface SelfTestLoopCardProps { turnId: string }

export const SelfTestLoopCard = React.memo(function SelfTestLoopCard({ turnId }: SelfTestLoopCardProps) {
  const loop = useAtomValue(selfTestLoopAtomFamily(turnId));
  if (!loop) return null;

  const current = loop.iterations[loop.currentIndex];
  const loopIters: LoopIteration[] = loop.iterations.map((it) => ({
    id: it.id,
    label: `${it.testsPassed}/${it.testsTotal}`,
    status: it.status,
  }));

  return (
    <Collapsible
      title="Self-Test"
      icon="beaker"
      badge={`${loop.currentIndex + 1}/${loop.maxIterations}`}
      defaultCollapsed={loop.status !== "running"}
    >
      <div className="px-2 py-1.5 space-y-2">
        <LoopVisualizer
          iterations={loopIters}
          currentIndex={loop.currentIndex}
          maxIterations={loop.maxIterations}
        />
        {current && (
          <div className="space-y-1">
            <ProgressBar
              value={current.testsPassed}
              max={current.testsTotal}
              label={`${current.testsPassed}/${current.testsTotal} passed`}
              barClassName={current.testsFailed > 0 ? "bg-vsc-warning" : "bg-vsc-success"}
            />
            {current.testsFailed > 0 && (
              <span className="text-2xs text-vsc-error">{current.testsFailed} failed</span>
            )}
          </div>
        )}
      </div>
    </Collapsible>
  );
});
