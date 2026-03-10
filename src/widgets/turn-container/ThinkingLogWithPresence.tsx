import React, { Suspense, useEffect, useRef } from "react";

import { useAnimatedPresence } from "../../shared/lib";
import type { TurnId } from "../../shared/protocol";
import { cn } from "../../shared/ui";

const ThinkingLog = React.lazy(() =>
  import("../thinking-log").then((m) => ({ default: m.ThinkingLog })),
);

/** ThinkingLog with exit animation — collapses based on actual height to prevent layout jank. */
export const ThinkingLogWithPresence = React.memo(function ThinkingLogWithPresence({
  turnId,
  isRunning,
}: {
  turnId: TurnId;
  isRunning: boolean;
}) {
  const { mounted, exiting, onAnimationEnd } = useAnimatedPresence(isRunning, 200);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (exiting && wrapRef.current) {
      const h = wrapRef.current.scrollHeight;
      wrapRef.current.style.setProperty("--collapse-h", `${h}px`);
    }
  }, [exiting]);

  if (!mounted) return null;
  return (
    <div
      ref={wrapRef}
      className={cn(
        "overflow-hidden",
        exiting && "animate-[collapse-measured_200ms_ease-out_forwards]",
      )}
      onAnimationEnd={onAnimationEnd}
    >
      <Suspense fallback={null}>
        <ThinkingLog turnId={turnId} />
      </Suspense>
    </div>
  );
});
