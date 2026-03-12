import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import {
  budgetUsageRatioAtom,
  costGovernorConfigAtom,
  costSparklineAtom,
  performanceSummaryAtom,
  resourceMetricsAtom,
} from "../../entities/resource-monitor";
import { Badge, cn, EmptyState, Icon, Text } from "../../shared/ui";

// ─── Cost Summary Bar (for HeaderBar inline) ─────────────────

export const CostSummaryBar = React.memo(function CostSummaryBar() {
  const metrics = useAtomValue(resourceMetricsAtom);
  const config = useAtomValue(costGovernorConfigAtom);
  const ratio = useAtomValue(budgetUsageRatioAtom);

  if (!metrics) return null;

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label="Session cost">
      <Text size="xs" tone="ghost">
        $
      </Text>
      <Text size="xs" tone="secondary" className="tabular-nums">
        {metrics.cost.session_usd.toFixed(2)}
      </Text>
      {config.enabled && (
        <div className="w-16 h-1.5 rounded-full bg-vsc-surface-2 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width,background-color] duration-normal",
              (() => {
                if (ratio < 0.5) return "bg-vsc-success";
                if (ratio < 0.8) return "bg-vsc-warning";
                return "bg-vsc-error";
              })(),
            )}
            style={{ width: `${ratio * 100}%` }}
            role="progressbar"
            aria-valuenow={Math.round(ratio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Budget usage"
          />
        </div>
      )}
    </div>
  );
});

// ─── Budget Alert Banner ─────────────────────────────────────

export const BudgetAlertBanner = React.memo(function BudgetAlertBanner() {
  const config = useAtomValue(costGovernorConfigAtom);
  const ratio = useAtomValue(budgetUsageRatioAtom);

  if (!config.enabled || ratio < 0.8) return null;

  const isOver = ratio >= 1;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-xs",
        isOver ? "bg-vsc-error/10 text-vsc-error" : "bg-vsc-warning/10 text-vsc-warning",
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon name="warning" tokenSize="xs" />
      <Text size="xs">
        {isOver
          ? `Budget exceeded — ${Math.round(ratio * 100)}% of $${config.budget_usd}`
          : `Approaching budget — ${Math.round(ratio * 100)}% of $${config.budget_usd}`}
      </Text>
      {config.autoDowngrade && config.autoDowngradeModel && (
        <Badge text={`→ ${config.autoDowngradeModel}`} variant="warning" className="ml-auto" />
      )}
    </div>
  );
});

// ─── Token Sparkline ─────────────────────────────────────────

const TokenSparkline = React.memo(function TokenSparkline() {
  const data = useAtomValue(costSparklineAtom);

  if (data.length < 2) return null;

  const maxVal = Math.max(...data, 0.01);
  const w = 200;
  const h = 40;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / maxVal) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      <Text size="xs" weight="medium" tone="secondary">
        Cost Trend
      </Text>
      <svg
        width={w}
        height={h}
        className="w-full"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Cost trend sparkline"
      >
        <polyline
          points={points}
          fill="none"
          className="stroke-vsc-info"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

// ─── Performance Gauges ──────────────────────────────────────

const PerformanceGauges = React.memo(function PerformanceGauges() {
  const perf = useAtomValue(performanceSummaryAtom);
  if (!perf) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: "Avg Latency", value: perf.latency, icon: "clock" },
        { label: "P95 Latency", value: perf.p95, icon: "clock" },
        { label: "Req/min", value: String(perf.rpm), icon: "pulse" },
        { label: "Error Rate", value: perf.errorRate, icon: "warning" },
      ].map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 p-2 rounded border border-vsc-border/30 bg-vsc-surface-1"
        >
          <div className="flex items-center gap-1">
            <Icon name={item.icon} tokenSize="xs" className="text-vsc-text-ghost" />
            <Text size="2xs" tone="ghost">
              {item.label}
            </Text>
          </div>
          <Text size="sm" weight="bold" mono>
            {item.value}
          </Text>
        </div>
      ))}
    </div>
  );
});

// ─── Model Cost Breakdown ────────────────────────────────────

const CHART_COLORS: readonly string[] = [
  "var(--color-chart-blue)",
  "var(--color-chart-green)",
  "var(--color-chart-yellow)",
  "var(--color-chart-purple)",
  "var(--color-chart-red)",
  "var(--color-chart-blue)",
];

function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? "#666";
}

const ModelCostBreakdown = React.memo(function ModelCostBreakdown() {
  const metrics = useAtomValue(resourceMetricsAtom);

  const total = metrics ? metrics.models.reduce((s, m) => s + m.cost_usd, 0) : 0;

  const gradient = useMemo(() => {
    if (!metrics || total === 0) return "conic-gradient(var(--vscode-editorWidget-border) 0% 100%)";
    const segments: string[] = [];
    let cum = 0;
    metrics.models.forEach((m, i) => {
      const pct = (m.cost_usd / total) * 100;
      segments.push(`${getChartColor(i)} ${cum}% ${cum + pct}%`);
      cum += pct;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [metrics, total]);

  if (!metrics || metrics.models.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <Text size="xs" weight="medium" tone="secondary">
        Model Breakdown
      </Text>
      <div className="flex items-center gap-3">
        <div
          className="size-16 rounded-full shrink-0"
          style={{ background: gradient }}
          role="img"
          aria-label={`Model cost: ${metrics.models.map((m) => `${m.model} $${m.cost_usd.toFixed(2)}`).join(", ")}`}
        />
        <div className="flex flex-col gap-1 min-w-0">
          {metrics.models.map((m, i) => (
            <div key={m.model} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: getChartColor(i) }}
                aria-hidden="true"
              />
              <Text size="2xs" truncate className="max-w-[80px]">
                {m.model}
              </Text>
              <Text size="2xs" tone="ghost" mono className="ml-auto">
                ${m.cost_usd.toFixed(2)}
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── Main Panel ──────────────────────────────────────────────

export const ResourceMonitorPanel = React.memo(function ResourceMonitorPanel() {
  const metrics = useAtomValue(resourceMetricsAtom);

  if (!metrics) {
    return <EmptyState icon="dashboard" title="No metrics available" className="py-8" />;
  }

  return (
    <div className="flex flex-col gap-4 p-3" data-testid="resource-monitor-panel">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon name="dashboard" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="bold">
          Resource Monitor
        </Text>
      </div>

      {/* Token summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col p-2 rounded border border-vsc-border/30 bg-vsc-surface-1">
          <Text size="2xs" tone="ghost">
            Input
          </Text>
          <Text size="sm" weight="bold" mono>
            {metrics.tokens.input >= 1000
              ? `${(metrics.tokens.input / 1000).toFixed(1)}K`
              : metrics.tokens.input}
          </Text>
        </div>
        <div className="flex flex-col p-2 rounded border border-vsc-border/30 bg-vsc-surface-1">
          <Text size="2xs" tone="ghost">
            Output
          </Text>
          <Text size="sm" weight="bold" mono>
            {metrics.tokens.output >= 1000
              ? `${(metrics.tokens.output / 1000).toFixed(1)}K`
              : metrics.tokens.output}
          </Text>
        </div>
        <div className="flex flex-col p-2 rounded border border-vsc-border/30 bg-vsc-surface-1">
          <Text size="2xs" tone="ghost">
            Cached
          </Text>
          <Text size="sm" weight="bold" mono tone="success">
            {metrics.tokens.cached >= 1000
              ? `${(metrics.tokens.cached / 1000).toFixed(1)}K`
              : metrics.tokens.cached}
          </Text>
        </div>
      </div>

      {/* Cost trend */}
      <TokenSparkline />

      {/* Model breakdown */}
      <ModelCostBreakdown />

      {/* Performance */}
      <PerformanceGauges />
    </div>
  );
});
