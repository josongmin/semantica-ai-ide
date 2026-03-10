import { atom } from "jotai";

import type { CostGovernorConfig, ResourceMetrics } from "../../../shared/protocol";

/** Live resource metrics from extension host */
export const resourceMetricsAtom = atom<ResourceMetrics | null>(null);

/** Cost governor configuration */
export const costGovernorConfigAtom = atom<CostGovernorConfig>({
  enabled: false,
  budget_usd: 10,
  period: "daily",
  alerts: [
    { threshold: 0.5, action: "warn", triggered: false },
    { threshold: 0.8, action: "slow", triggered: false },
    { threshold: 1.0, action: "stop", triggered: false },
  ],
  autoDowngrade: false,
});

/** Budget usage ratio (0-1) */
export const budgetUsageRatioAtom = atom((get) => {
  const metrics = get(resourceMetricsAtom);
  const config = get(costGovernorConfigAtom);
  if (!metrics || !config.enabled || config.budget_usd === 0) return 0;
  let cost: number;
  if (config.period === "session") {
    cost = metrics.cost.session_usd;
  } else if (config.period === "daily") {
    cost = metrics.cost.today_usd;
  } else {
    cost = metrics.cost.month_usd;
  }
  return Math.min(cost / config.budget_usd, 1);
});

/** Session cost sparkline data (sliding window, max 50 points) */
export const costSparklineAtom = atom<readonly number[]>([]);

/** Append a data point to the sparkline */
export const appendCostDataPointAtom = atom(null, (get, set, value: number) => {
  if (!isFinite(value) || value < 0) return;
  const prev = get(costSparklineAtom);
  const next = prev.length >= 50 ? [...prev.slice(1), value] : [...prev, value];
  set(costSparklineAtom, next);
});

/** Performance summary derived from metrics */
export const performanceSummaryAtom = atom((get) => {
  const metrics = get(resourceMetricsAtom);
  if (!metrics) return null;
  return {
    latency: `${metrics.performance.avg_latency_ms}ms`,
    p95: `${metrics.performance.p95_latency_ms}ms`,
    rpm: metrics.performance.requests_per_min,
    errorRate: `${(metrics.performance.error_rate * 100).toFixed(1)}%`,
  };
});
