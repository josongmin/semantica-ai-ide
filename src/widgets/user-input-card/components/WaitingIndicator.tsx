import { memo } from "react";

import { Text } from "../../../shared/ui";
import { useElapsed } from "../hooks";

// ─── Live waiting counter + pulse ───────────────────────────
export const WaitingIndicator = memo(function WaitingIndicator({ sinceMs }: { sinceMs: number }) {
  const elapsed = useElapsed(sinceMs);
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Text size="2xs" tone="ghost" mono>{elapsed}</Text>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vsc-accent opacity-50" aria-hidden="true" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-vsc-accent" />
      </span>
    </div>
  );
});
