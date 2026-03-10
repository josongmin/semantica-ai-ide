import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { isAllowedOrigin } from "~shared/lib";
import type { CostGovernorConfig, ResourceMetrics } from "~shared/protocol";

import {
  appendCostDataPointAtom,
  costGovernorConfigAtom,
  resourceMetricsAtom,
} from "../../../../entities/resource-monitor";

/**
 * Sync resource metrics and cost governor config from extension host.
 * Appends cost data points to sparkline on each update.
 */
export function useResourceMonitorSync() {
  const setMetrics = useSetAtom(resourceMetricsAtom);
  const appendCost = useSetAtom(appendCostDataPointAtom);
  const setConfig = useSetAtom(costGovernorConfigAtom);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isAllowedOrigin(e.origin)) return;
      const msg = e.data as { type?: string; payload?: unknown } | null;
      if (!msg || typeof msg.type !== "string") return;

      switch (msg.type) {
        case "resource/metrics":
          if (msg.payload != null) {
            const metrics = msg.payload as ResourceMetrics;
            setMetrics(metrics);
            appendCost(metrics.cost.session_usd);
          }
          break;
        case "resource/config":
          if (msg.payload != null) setConfig(msg.payload as CostGovernorConfig);
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setMetrics, appendCost, setConfig]);
}
