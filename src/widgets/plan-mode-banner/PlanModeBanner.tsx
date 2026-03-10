import React from "react";
import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";

import type { TurnId } from "../../shared/protocol";
import { Badge, cn, type Step, StepTimeline } from "../../shared/ui";

// Plan mode atoms
// eslint-disable-next-line react-refresh/only-export-components
export const planModeActiveAtom = atom(false);
// eslint-disable-next-line react-refresh/only-export-components
export const activePlanTurnIdAtom = atom<string | null>(null);

/** Per-turn plan steps (atomFamily keyed by TurnId) */
// eslint-disable-next-line react-refresh/only-export-components, @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const planStepsFamily = atomFamily((_turnId: TurnId) => atom<Step[]>([]));

// Backward compat: session-level singleton
// eslint-disable-next-line react-refresh/only-export-components
export const planStepsAtom = atom<Step[]>([]);

export const PlanModeBanner = React.memo(function PlanModeBanner({ turnId }: { turnId: TurnId }) {
  const active = useAtomValue(planModeActiveAtom);
  const activeTurnId = useAtomValue(activePlanTurnIdAtom);
  const steps = useAtomValue(planStepsFamily(turnId));

  // Only show on the turn that activated plan mode
  if (!active || activeTurnId !== turnId) return null;

  const completed = steps.filter((s) => s.status === "completed").length;
  const total = steps.length;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5",
        "bg-vsc-info/5 border-b border-vsc-info/20",
        "animate-[step-reveal_200ms_ease-out]",
      )}
    >
      <Badge text="Plan Mode" variant="info" />
      {total > 0 && (
        <>
          <StepTimeline steps={steps} direction="horizontal" className="flex-1" />
          <span className="text-2xs text-vsc-text-tertiary tabular-nums shrink-0">
            {completed}/{total}
          </span>
        </>
      )}
    </div>
  );
});
