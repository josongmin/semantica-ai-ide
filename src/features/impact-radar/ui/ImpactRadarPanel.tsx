import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useNavigateToFile } from "~shared/lib";
import { activeSurfaceAtom } from "~shared/lib/atoms/surfaceAtoms";
import { IS_MAC } from "~shared/lib/hooks/usePlatform";
import { getVscodeApi } from "~shared/lib/vscodeApi";
import { type BreadcrumbItem, Breadcrumbs, Button, Icon, Kbd, Text } from "~shared/ui";

import {
  clearImpactResultAtom,
  closeImpactRadarAtom,
  impactAnalysisResultAtom,
  impactRadarLoadingAtom,
  impactSummaryAtom,
} from "../model/atoms";
import type { ImpactSummary } from "../model/types";
import { ImpactNodeList } from "./ImpactNodeList";

// ─── Analysis Context Breadcrumb ─────────────────────────

const AnalysisContextBar = React.memo(function AnalysisContextBar({
  triggerFile,
  triggerSymbol,
}: {
  triggerFile: string;
  triggerSymbol: string;
}) {
  const fileName = triggerFile.split("/").pop() ?? triggerFile;

  const items: BreadcrumbItem[] = [
    { label: fileName, icon: "file" },
    { label: triggerSymbol, icon: "symbol-method" },
    { label: "Impact Radar", icon: "radar" },
  ];

  return (
    <div className="border-t border-vsc-border/10 px-3 py-1.5 shrink-0">
      <Breadcrumbs items={items} className="text-xs text-vsc-text-secondary" />
    </div>
  );
});

// ─── Summary Card ────────────────────────────────────────

const SummaryCard = React.memo(function SummaryCard({ summary }: { summary: ImpactSummary }) {
  return (
    <div className="flex flex-col gap-3 p-3 backdrop-blur-md bg-vsc-surface-0/80 border border-vsc-border/30 rounded-md">
      {/* Severity counts */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-(--color-impact-breaking)" />
          <Text size="2xs" className="tabular-nums">
            {summary.breaking} breaking
          </Text>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-(--color-impact-major)" />
          <Text size="2xs" className="tabular-nums">
            {summary.major} major
          </Text>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-(--color-impact-minor)" />
          <Text size="2xs" className="tabular-nums">
            {summary.minor} minor
          </Text>
        </div>
      </div>

      {/* Test predictions */}
      <div className="flex flex-col gap-1 border-t border-vsc-border/15 pt-2">
        <Text size="2xs" tone="ghost" className="font-medium">
          Tests
        </Text>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-(--color-impact-breaking)" />
          <Text size="2xs" className="tabular-nums">
            {summary.testsPredictedFailing} predicted failing
          </Text>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-vsc-success" />
          <Text size="2xs" className="tabular-nums">
            {summary.testsPredictedPassing} predicted passing
          </Text>
        </div>
      </div>

      {/* API / Service counts */}
      <div className="flex flex-col gap-1 border-t border-vsc-border/15 pt-2">
        <Text size="2xs" className="tabular-nums">
          APIs: {summary.apisAffected}
        </Text>
        <Text size="2xs" className="tabular-nums">
          Services: {summary.servicesAffected}
        </Text>
      </div>
    </div>
  );
});

// ─── Loading Bar ─────────────────────────────────────────

const LoadingBar = React.memo(function LoadingBar() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="loading~spin" tokenSize="sm" className="text-vsc-accent" />
        <Text size="xs" tone="ghost">
          Analyzing impact...
        </Text>
      </div>
      <div className="h-4 w-3/4 rounded bg-vsc-bg-secondary animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-vsc-bg-secondary animate-pulse" />
      <div className="h-20 w-full rounded bg-vsc-bg-secondary animate-pulse" />
      <div className="h-12 w-full rounded bg-vsc-bg-secondary animate-pulse" />
      <div className="h-12 w-2/3 rounded bg-vsc-bg-secondary animate-pulse" />
    </div>
  );
});

// ─── Empty State ─────────────────────────────────────────

const EmptyState = React.memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost">
      <Icon name="radar" tokenSize="lg" className="opacity-30" />
      <Text size="xs" tone="ghost">
        No impact analysis result
      </Text>
      <Text size="2xs" tone="ghost">
        Select a symbol in the editor and press <Kbd>{IS_MAC ? "Cmd" : "Ctrl"}+Shift+I</Kbd>
      </Text>
    </div>
  );
});

// ─── Main Panel ──────────────────────────────────────────

export const ImpactRadarPanel = React.memo(function ImpactRadarPanel() {
  const result = useAtomValue(impactAnalysisResultAtom);
  const loading = useAtomValue(impactRadarLoadingAtom);
  const summary = useAtomValue(impactSummaryAtom);
  const close = useSetAtom(closeImpactRadarAtom);
  const clear = useSetAtom(clearImpactResultAtom);
  const setActiveSurface = useSetAtom(activeSurfaceAtom);

  const navigateToFile = useNavigateToFile();

  const handleNodeClick = useCallback(
    (filePath: string, line: number) => {
      navigateToFile(filePath, line);
    },
    [navigateToFile],
  );

  const handleRunTests = useCallback(() => {
    // Trigger affected test run via VSCode task
    const affectedFiles =
      result?.nodes.filter((n) => n.category === "test").map((n) => n.filePath) ?? [];
    if (affectedFiles.length > 0) {
      for (const file of affectedFiles) {
        getVscodeApi().postMessage({
          type: "RUN_TESTS",
          file_path: file,
        });
      }
    }
  }, [result]);

  const handleShowGraph = useCallback(() => {
    // Switch to graph surface to visualize impact
    setActiveSurface("graph");
  }, [setActiveSurface]);

  // ─── Loading ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-vsc-surface-0">
        <Header triggerSymbol="..." triggerFile="" triggerLine={0} onClose={close} isLoading />
        <LoadingBar />
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────
  if (!result) {
    return (
      <div className="flex flex-col h-full bg-vsc-surface-0">
        <EmptyState />
      </div>
    );
  }

  // ─── Results ──────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      <Header
        triggerSymbol={result.triggerSymbol}
        triggerFile={result.triggerFile}
        triggerLine={result.triggerLine}
        onClose={close}
      />

      <AnalysisContextBar triggerFile={result.triggerFile} triggerSymbol={result.triggerSymbol} />

      <div className="flex flex-1 min-h-0 overflow-hidden animate-in fade-in duration-slow">
        {/* Left sidebar — summary */}
        {summary && (
          <div className="hidden sm:flex w-48 shrink-0 flex-col p-2 border-r border-vsc-border/15 overflow-y-auto">
            <SummaryCard summary={summary} />
          </div>
        )}

        {/* Right main — node list */}
        <ImpactNodeList nodes={result.nodes} onNodeClick={handleNodeClick} className="flex-1" />
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-vsc-border/15">
        <Button size="sm" variant="primary" onClick={handleRunTests}>
          <Icon name="beaker" tokenSize="xs" />
          Run Affected Tests
        </Button>
        <Button size="sm" variant="ghost" onClick={handleShowGraph}>
          <Icon name="graph" tokenSize="xs" />
          Show Graph
        </Button>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => clear()}>
          Dismiss
        </Button>
      </div>
    </div>
  );
});

// ─── Header ──────────────────────────────────────────────

const Header = React.memo(function Header({
  triggerSymbol,
  triggerFile,
  triggerLine,
  onClose,
  isLoading,
}: {
  triggerSymbol: string;
  triggerFile: string;
  triggerLine: number;
  onClose: () => void;
  isLoading?: boolean;
}) {
  const subtitle = triggerFile ? `${triggerFile}:${triggerLine}` : "";

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border/15 shrink-0">
      <Icon name="radar" tokenSize="sm" className="text-vsc-accent shrink-0" />
      <Text size="xs" className="font-medium text-vsc-fg truncate">
        Impact Radar
        {triggerSymbol && !isLoading && (
          <span className="text-vsc-text-ghost font-normal">
            {" "}
            &mdash; {triggerSymbol}
            {subtitle && <span className="text-vsc-text-ghost"> ({subtitle})</span>}
          </span>
        )}
      </Text>
      <div className="flex-1" />
      <button
        type="button"
        className="p-0.5 rounded hover:bg-vsc-surface-2 transition-colors duration-fast text-vsc-text-ghost hover:text-vsc-fg"
        onClick={onClose}
        aria-label="Close impact radar"
      >
        <Icon name="close" tokenSize="xs" />
      </button>
    </div>
  );
});
