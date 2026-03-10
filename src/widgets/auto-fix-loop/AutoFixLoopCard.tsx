import React from "react";
import { useAtomValue } from "jotai";

import { autoFixLoopAtomFamily } from "../../entities/auto-fix";
import { Badge, cn, Collapsible } from "../../shared/ui";
import { type LoopIteration, LoopVisualizer } from "../loop-shared";

interface AutoFixLoopCardProps {
  turnId: string;
}

export const AutoFixLoopCard = React.memo(function AutoFixLoopCard({ turnId }: AutoFixLoopCardProps) {
  const loop = useAtomValue(autoFixLoopAtomFamily(turnId));
  if (!loop) return null;

  const loopIters: LoopIteration[] = loop.iterations.map((it) => ({
    id: it.id,
    label: it.fixDescription || it.errorMessage,
    status: it.status,
  }));

  let statusBadge: "success" | "error" | "info";
  if (loop.status === "completed") {
    statusBadge = "success";
  } else if (loop.status === "failed") {
    statusBadge = "error";
  } else {
    statusBadge = "info";
  }

  return (
    <Collapsible
      title="Auto-Fix"
      icon="sync"
      badge={`${loop.currentIndex + 1}/${loop.maxIterations}`}
      defaultCollapsed={loop.status !== "running"}
      headerRight={
        <Badge text={loop.status} variant={statusBadge} />
      }
      className="mt-1"
    >
      <div className="px-2 py-1.5">
        <LoopVisualizer
          iterations={loopIters}
          currentIndex={loop.currentIndex}
          maxIterations={loop.maxIterations}
        />
        {/* Current iteration detail */}
        {(() => {
          const currentIter = loop.iterations[loop.currentIndex];
          if (currentIter === undefined) return null;
          return (
            <div
              className={cn(
                "mt-2 p-2 rounded-md text-2xs",
                "bg-vsc-surface-2 border border-vsc-border/30",
              )}
            >
              <div className="text-vsc-error/80 line-clamp-2">
                {currentIter.errorMessage}
              </div>
              {currentIter.fixDescription && (
                <div className="mt-1 text-vsc-success/80">
                  → {currentIter.fixDescription}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </Collapsible>
  );
});
