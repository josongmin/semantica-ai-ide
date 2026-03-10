import { useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  CONTEXT_THRESHOLDS,
  contextPressureLevelAtom,
  contextUsagePctAtom,
  sessionMetaAtom,
} from "~entities/session/state";

import { pushToastAtom } from "../../../shared/lib";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { ContextPressureLevel } from "../../../shared/protocol";
import { estimatedRemainingTurnsAtom } from "./contextPressureAtoms";

interface ToastThreshold {
  pct: number;
  variant: "warning" | "error";
  message: string;
}

const TOAST_THRESHOLDS: readonly ToastThreshold[] = [
  {
    pct: CONTEXT_THRESHOLDS.elevated,
    variant: "warning",
    message: "Context window 70% full. Consider starting a new session.",
  },
  {
    pct: CONTEXT_THRESHOLDS.critical,
    variant: "warning",
    message: "Context window 85% full. Responses may degrade.",
  },
  {
    pct: CONTEXT_THRESHOLDS.emergency,
    variant: "error",
    message: "Context window nearly full (95%). Start a new session or compact.",
  },
];

/**
 * Hook that monitors context window usage and fires toast warnings
 * when crossing thresholds.
 */
export function useContextPressure(): {
  usagePct: number;
  pressureLevel: ContextPressureLevel;
  estimatedTurns: number | null;
  requestCompaction: () => void;
} {
  const usagePct = useAtomValue(contextUsagePctAtom);
  const pressureLevel = useAtomValue(contextPressureLevelAtom);
  const estimatedTurns = useAtomValue(estimatedRemainingTurnsAtom);
  const pushToast = useSetAtom(pushToastAtom);
  const sessionId = useAtomValue(sessionMetaAtom).session_id;

  // Track which thresholds have fired, keyed by sessionId to prevent
  // cross-session leakage and stale state after remount.
  const firedRef = useRef<{ sessionId: string; thresholds: Set<number> }>({
    sessionId: "",
    thresholds: new Set(),
  });

  useEffect(() => {
    // Reset tracking on session change or when pressure drops below baseline
    if (firedRef.current.sessionId !== sessionId) {
      firedRef.current = { sessionId, thresholds: new Set() };
    }

    if (usagePct < CONTEXT_THRESHOLDS.elevated) {
      firedRef.current.thresholds.clear();
      return;
    }

    const { thresholds } = firedRef.current;
    for (const threshold of TOAST_THRESHOLDS) {
      if (usagePct >= threshold.pct && !thresholds.has(threshold.pct)) {
        thresholds.add(threshold.pct);
        pushToast({
          id: `ctx-pressure-${threshold.pct}`,
          message: threshold.message,
          variant: threshold.variant,
          duration: 6000,
        });
      }
    }
  }, [usagePct, pushToast, sessionId]);

  const requestCompaction = useCallback(() => {
    getVscodeApi().postMessage({ type: "COMPACT_CONTEXT" });
  }, []);

  return { usagePct, pressureLevel, estimatedTurns, requestCompaction };
}
