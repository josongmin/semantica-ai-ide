import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  contextPressureLevelAtom,
  contextUsagePctAtom,
  sessionMetaAtom,
} from "~entities/session/state";

import { pushToastAtom } from "../../../shared/lib/atoms/toastAtoms";
import { compactUsagePctAtom, pendingCompactAtom } from "./autoCompactAtoms";

/** Cooldown (ms) between auto-compact triggers to avoid spamming */
const AUTO_COMPACT_COOLDOWN = 60_000;

/**
 * Monitors context usage and sets a pending-compact flag when usage crosses 85%.
 * Instead of auto-firing, the user confirms via AutoCompactDialog.
 * Only triggers once per cooldown period and only when session is running.
 */
export function useAutoCompact(): void {
  const pressureLevel = useAtomValue(contextPressureLevelAtom);
  const usagePct = useAtomValue(contextUsagePctAtom);
  const meta = useAtomValue(sessionMetaAtom);
  const pushToast = useSetAtom(pushToastAtom);
  const setPendingCompact = useSetAtom(pendingCompactAtom);
  const setCompactUsagePct = useSetAtom(compactUsagePctAtom);
  const lastCompactRef = useRef(0);
  const triggeredRef = useRef(false);

  useEffect(() => {
    // Only auto-compact during active sessions
    if (meta.status !== "running") {
      triggeredRef.current = false;
      return;
    }

    // Trigger at critical threshold (85%+)
    if (pressureLevel === "critical" && !triggeredRef.current) {
      const now = Date.now();
      if (now - lastCompactRef.current < AUTO_COMPACT_COOLDOWN) return;

      triggeredRef.current = true;
      lastCompactRef.current = now;

      // Set pending state — the AutoCompactDialog will show for user confirmation
      setCompactUsagePct(Math.round(usagePct));
      setPendingCompact(true);

      pushToast({
        id: `auto-compact-${now}`,
        variant: "warning",
        message: `Context at ${Math.round(usagePct)}% — compact recommended`,
      });
    }

    // Reset trigger when pressure drops below critical
    if (pressureLevel !== "critical") {
      triggeredRef.current = false;
    }
  }, [pressureLevel, usagePct, meta.status, pushToast, setPendingCompact, setCompactUsagePct]);
}
