/**
 * SelfExplainPanel — Full self-explaining code panel wired to Jotai atoms.
 *
 * Shows purpose, usage, impact, history, runtime, and why-chain
 * for a given code symbol.
 */

import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useNavigateToFile } from "~shared/lib";
import { Badge, type BreadcrumbItem, Breadcrumbs, cn, Icon, Kbd, Skeleton, Text } from "~shared/ui";

import {
  closeSelfExplainAtom,
  selfExplainDataAtom,
  selfExplainLoadingAtom,
  selfExplainVisibleAtom,
} from "../model/atoms";
import { ExplainSection } from "./ExplainSection";
import { WhyChain } from "./WhyChain";

// ─── Symbol Kind Icons ──────────────────────────────────────

const SYMBOL_KIND_ICON: Record<string, string> = {
  function: "symbol-method",
  method: "symbol-method",
  class: "symbol-class",
  interface: "symbol-interface",
  variable: "symbol-variable",
  module: "symbol-namespace",
  type: "symbol-struct",
  hook: "symbol-event",
  enum: "symbol-enum",
  namespace: "symbol-namespace",
};

// ─── Risk Badge Variant ─────────────────────────────────────

const RISK_VARIANT: Record<string, "success" | "info" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

// ─── Analysis Context Breadcrumb ────────────────────────

const ExplainContextBar = React.memo(function ExplainContextBar({
  filePath,
  symbolName,
  symbolKind,
}: {
  filePath: string;
  symbolName: string;
  symbolKind: string;
}) {
  const fileName = filePath.split("/").pop() ?? filePath;
  const kindIcon = SYMBOL_KIND_ICON[symbolKind] ?? "symbol-method";

  const items: BreadcrumbItem[] = [
    { label: fileName, icon: "file" },
    { label: symbolName, icon: kindIcon },
    { label: "Explain" },
  ];

  return (
    <div className="border-b border-vsc-border/10 px-3 py-1.5 shrink-0">
      <Breadcrumbs items={items} className="text-xs text-vsc-text-secondary" />
    </div>
  );
});

// ─── Loading Skeleton ───────────────────────────────────────

const LoadingSkeleton = React.memo(function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex flex-col gap-2 mt-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
});

// ─── Empty State ────────────────────────────────────────────

const EmptyState = React.memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost">
      <Icon name="lightbulb" tokenSize="lg" className="opacity-30" />
      <Text size="xs" tone="ghost">
        <Kbd>Alt+Click</Kbd> a symbol to see why it exists
      </Text>
      <Text size="2xs" tone="ghost">
        Works on functions, classes, and variables
      </Text>
    </div>
  );
});

// ─── Main Panel ─────────────────────────────────────────────

export const SelfExplainPanel = React.memo(function SelfExplainPanel() {
  const visible = useAtomValue(selfExplainVisibleAtom);
  const data = useAtomValue(selfExplainDataAtom);
  const loading = useAtomValue(selfExplainLoadingAtom);
  const close = useSetAtom(closeSelfExplainAtom);

  const navigateToFile = useNavigateToFile();

  const handleCallerClick = useCallback(
    (filePath: string, line: number) => {
      navigateToFile(filePath, line);
    },
    [navigateToFile],
  );

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full backdrop-blur-md bg-vsc-surface-0/80 border border-vsc-border/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-vsc-border/15 shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="lightbulb" tokenSize="sm" className="text-vsc-accent" />
          <Text size="xs" className="font-medium text-vsc-fg">
            Self-Explaining Code
          </Text>
          <Kbd>Alt+Click</Kbd>
        </div>
        <button
          type="button"
          onClick={close}
          className="p-0.5 rounded hover:bg-vsc-surface-2 transition-colors cursor-pointer"
          aria-label="Close self-explain panel"
        >
          <Icon name="close" tokenSize="sm" className="text-vsc-text-ghost" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && <LoadingSkeleton />}
        {!loading && !data && <EmptyState />}
        {!loading && data && (
          <div className="flex flex-col animate-in fade-in duration-slow">
            {/* Analysis context breadcrumb */}
            <ExplainContextBar
              filePath={data.filePath}
              symbolName={data.symbolName}
              symbolKind={data.symbolKind}
            />

            {/* Symbol Header */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Icon
                name={SYMBOL_KIND_ICON[data.symbolKind] ?? "symbol-method"}
                tokenSize="sm"
                className="text-vsc-accent shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <Text size="sm" className="font-medium text-vsc-fg truncate">
                  {data.symbolName}
                </Text>
                <Text size="2xs" tone="ghost" className="truncate">
                  {data.filePath}:{data.line}
                </Text>
              </div>
            </div>

            {/* Purpose */}
            <ExplainSection icon="book" title="Purpose" index={0}>
              <Text size="xs" className="text-vsc-text-secondary leading-relaxed">
                {data.purpose}
              </Text>
            </ExplainSection>

            {/* Usage */}
            <ExplainSection icon="references" title="Usage" index={1}>
              <div className="flex flex-col gap-1.5">
                <Text size="2xs" tone="ghost">
                  {data.usage.callerCount} caller{data.usage.callerCount !== 1 ? "s" : ""}
                </Text>
                <div className="flex flex-col gap-0.5">
                  {data.usage.topCallers.map((caller) => (
                    <button
                      key={`${caller.filePath}:${caller.line}`}
                      onClick={() => handleCallerClick(caller.filePath, caller.line)}
                      className="flex items-center gap-1.5 text-left hover:bg-vsc-surface-2 rounded px-1.5 py-0.5 transition-colors"
                    >
                      <Icon
                        name="symbol-method"
                        tokenSize="2xs"
                        className="text-vsc-text-ghost shrink-0"
                      />
                      <Text size="2xs" className="text-vsc-accent truncate">
                        {caller.name}
                      </Text>
                      <Text size="2xs" tone="ghost" className="truncate">
                        {caller.filePath}:{caller.line}
                      </Text>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {data.usage.exposedVia.map((via) => (
                    <Badge key={via} text={via} variant="info" className="text-2xs" />
                  ))}
                </div>
              </div>
            </ExplainSection>

            {/* Impact */}
            <ExplainSection icon="pulse" title="Impact" index={2}>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-3">
                  <Text size="2xs" tone="ghost">
                    <span className="text-vsc-fg font-medium tabular-nums">
                      {data.impact.modules}
                    </span>{" "}
                    modules
                  </Text>
                  <Text size="2xs" tone="ghost">
                    <span className="text-vsc-fg font-medium tabular-nums">
                      {data.impact.tests}
                    </span>{" "}
                    tests
                  </Text>
                  <Text size="2xs" tone="ghost">
                    <span className="text-vsc-fg font-medium tabular-nums">{data.impact.apis}</span>{" "}
                    APIs
                  </Text>
                  <Text size="2xs" tone="ghost">
                    <span className="text-vsc-fg font-medium tabular-nums">
                      {data.impact.services}
                    </span>{" "}
                    services
                  </Text>
                </div>
                <Badge
                  text={data.impact.riskLevel}
                  variant={RISK_VARIANT[data.impact.riskLevel] ?? "info"}
                  className="text-2xs w-fit"
                />
              </div>
            </ExplainSection>

            {/* History */}
            <ExplainSection icon="history" title="History" index={3}>
              <div className="flex flex-col gap-1.5">
                <Text size="2xs" tone="ghost">
                  Created by <span className="text-vsc-fg">{data.history.createdBy}</span>{" "}
                  {data.history.createdDaysAgo}d ago ({data.history.createdCommit})
                </Text>
                <Text size="2xs" tone="ghost">
                  {data.history.totalChanges} total change
                  {data.history.totalChanges !== 1 ? "s" : ""}
                </Text>
                {data.history.significantChanges.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {data.history.significantChanges.map((change) => (
                      <div key={change.hash} className="flex items-start gap-1.5 min-w-0">
                        <Text size="2xs" className="text-vsc-text-ghost shrink-0 tabular-nums">
                          {change.hash.slice(0, 7)}
                        </Text>
                        <Text size="2xs" className="text-vsc-text-secondary truncate">
                          {change.message}
                        </Text>
                        <Text size="2xs" tone="ghost" className="shrink-0">
                          {change.daysAgo}d
                        </Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ExplainSection>

            {/* Runtime */}
            <ExplainSection icon="dashboard" title="Runtime" index={4}>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-3">
                  {data.runtime.callsPerHour !== null && (
                    <Text size="2xs" tone="ghost">
                      <span className="text-vsc-fg font-medium tabular-nums">
                        {data.runtime.callsPerHour.toLocaleString()}
                      </span>{" "}
                      calls/hr
                    </Text>
                  )}
                  {data.runtime.avgLatencyMs !== null && (
                    <Text size="2xs" tone="ghost">
                      <span className="text-vsc-fg font-medium tabular-nums">
                        {data.runtime.avgLatencyMs}
                      </span>
                      ms avg
                    </Text>
                  )}
                  {data.runtime.errorRate !== null && (
                    <Text size="2xs" tone="ghost">
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          data.runtime.errorRate > 0.01 ? "text-vsc-error" : "text-vsc-fg",
                        )}
                      >
                        {(data.runtime.errorRate * 100).toFixed(1)}%
                      </span>{" "}
                      errors
                    </Text>
                  )}
                </div>
                {data.runtime.lastIncident && (
                  <Text size="2xs" tone="ghost">
                    Last incident: {data.runtime.lastIncident}
                  </Text>
                )}
                {data.runtime.criticalPath && (
                  <Badge text="Critical Path" variant="error" className="text-2xs w-fit" />
                )}
              </div>
            </ExplainSection>

            {/* Why Chain */}
            <ExplainSection icon="type-hierarchy" title="Why Chain" index={5}>
              <WhyChain chain={data.whyChain} />
            </ExplainSection>
          </div>
        )}
      </div>
    </div>
  );
});
