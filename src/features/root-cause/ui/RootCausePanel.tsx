import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useNavigateToFile } from "~shared/lib";
import { getVscodeApi } from "~shared/lib/vscodeApi";
import type { EvidenceKind } from "~shared/protocol/types";
import { type BreadcrumbItem, Breadcrumbs, Button, cn, Icon, Kbd, Text } from "~shared/ui";

import { rootCauseAnalysisAtom, rootCauseLoadingAtom, startRootCauseAtom } from "../model/atoms";
import { CausalChainGraph } from "./CausalChainGraph";
import { CauseCandidateCard } from "./CauseCandidate";
import { EvidenceBundle } from "./EvidenceBundle";

// ─── Loading Steps ───────────────────────────────────────

const LOADING_STEPS = [
  { label: "locating handler", threshold: 0.25 },
  { label: "analyzing call graph", threshold: 0.5 },
  { label: "checking recent commits", threshold: 0.75 },
  { label: "ranking causes", threshold: 1.0 },
] as const;

const ProgressStep = React.memo(function ProgressStep({
  label,
  progress,
}: {
  label: string;
  progress: number;
}) {
  const filled = Math.round(progress * 10);
  const bar = "\u25A0".repeat(filled) + "\u25A1".repeat(10 - filled);

  return (
    <div className="flex items-center gap-2 font-mono">
      <Text size="2xs" className="text-vsc-accent tabular-nums whitespace-pre">
        {bar}
      </Text>
      <Text size="2xs" tone="ghost">
        {label}
      </Text>
    </div>
  );
});

const LoadingState = React.memo(function LoadingState() {
  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="loading~spin" tokenSize="sm" className="text-vsc-accent" />
        <Text size="xs" className="font-medium text-vsc-fg">
          Analyzing...
        </Text>
      </div>
      {LOADING_STEPS.map((step, i) => (
        <ProgressStep
          key={step.label}
          label={step.label}
          progress={Math.min(1, Math.max(0, (i + 1) / LOADING_STEPS.length))}
        />
      ))}
      <div className="flex flex-col gap-2 mt-2">
        <div className="h-16 w-full rounded bg-vsc-bg-secondary animate-pulse" />
        <div className="h-16 w-full rounded bg-vsc-bg-secondary animate-pulse" />
        <div className="h-10 w-3/4 rounded bg-vsc-bg-secondary animate-pulse" />
      </div>
    </div>
  );
});

// ─── Empty State ─────────────────────────────────────────

const EmptyState = React.memo(function EmptyState({
  onAnalyzeLastError,
}: {
  readonly onAnalyzeLastError: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost py-12">
      <Icon name="search" tokenSize="lg" className="opacity-30" />
      <Text size="xs" tone="ghost">
        No root cause analysis active
      </Text>
      <Text size="2xs" tone="ghost">
        Trigger with <Kbd>Cmd+Shift+R</Kbd>
      </Text>
      <Button
        size="sm"
        variant="ghost"
        className="mt-2 border border-vsc-border/30"
        onClick={onAnalyzeLastError}
      >
        <Icon name="error" tokenSize="xs" />
        Analyze Last Error
      </Button>
    </div>
  );
});

// ─── Section Header ──────────────────────────────────────

const SectionHeader = React.memo(function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
      <Icon name={icon} tokenSize="sm" className="text-vsc-text-secondary" />
      <Text size="xs" className="font-medium text-vsc-text-primary">
        {title}
      </Text>
    </div>
  );
});

// ─── Analysis Context Breadcrumb ─────────────────────

const RootCauseContextBar = React.memo(function RootCauseContextBar({
  symptomFile,
  symptomLine,
}: {
  symptomFile: string;
  symptomLine: number;
}) {
  const fileName = symptomFile.split("/").pop() ?? symptomFile;

  const items: BreadcrumbItem[] = [
    { label: `${fileName}:${symptomLine}`, icon: "file" },
    { label: "Root Cause Analysis", icon: "search" },
  ];

  return (
    <div className="border-b border-vsc-border/10 px-3 py-1.5 shrink-0">
      <Breadcrumbs items={items} className="text-xs text-vsc-text-secondary" />
    </div>
  );
});

const HIGHLIGHT_DURATION_MS = 1500;

// ─── Component ───────────────────────────────────────────

export const RootCausePanel = React.memo(function RootCausePanel() {
  const analysis = useAtomValue(rootCauseAnalysisAtom);
  const loading = useAtomValue(rootCauseLoadingAtom);
  const startRootCause = useSetAtom(startRootCauseAtom);

  const navigateToFile = useNavigateToFile();
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current !== null) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const handleAnalyzeLastError = useCallback(() => {
    void startRootCause({
      symptom: "Last recorded error",
      filePath: "unknown",
      line: 0,
    });
  }, [startRootCause]);

  const handleFileClick = useCallback(
    (filePath: string, line: number) => {
      navigateToFile(filePath, line);
    },
    [navigateToFile],
  );

  const handleEvidenceClick = useCallback((evidenceId: string) => {
    // Scroll evidence into view and flash highlight
    const el = document.querySelector(`[data-evidence-id="${evidenceId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-vsc-accent/50");
      if (highlightTimeoutRef.current !== null) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        el.classList.remove("ring-2", "ring-vsc-accent/50");
        highlightTimeoutRef.current = null;
      }, HIGHLIGHT_DURATION_MS);
    }
  }, []);

  // Build evidence kind lookup for candidate pills
  const evidenceKinds = useMemo(() => {
    if (!analysis) return new Map<string, EvidenceKind>();
    const map = new Map<string, EvidenceKind>();
    for (const e of analysis.evidence) {
      map.set(e.id, e.kind);
    }
    return map;
  }, [analysis]);

  // Action handlers for bottom buttons
  const handleFixSuggestion = useCallback(() => {
    if (!analysis?.candidates[0]) return;
    const top = analysis.candidates[0];
    getVscodeApi().postMessage({
      type: "ASK_AGENT",
      prompt: `Root cause: ${top.symbolName} in ${top.filePath}:${top.line} — ${top.description}. Please suggest a fix.`,
    });
  }, [analysis]);

  const handleShowInEditor = useCallback(() => {
    if (!analysis?.candidates[0]) return;
    const top = analysis.candidates[0];
    navigateToFile(top.filePath, top.line);
  }, [analysis, navigateToFile]);

  const handleRunTests = useCallback(() => {
    if (!analysis) return;
    const testFiles = analysis.evidence
      .filter((e) => e.kind === "test-failure")
      .map((e) => e.filePath)
      .filter((f): f is string => Boolean(f));
    if (testFiles.length > 0) {
      for (const file of testFiles) {
        getVscodeApi().postMessage({ type: "RUN_TESTS", file_path: file });
      }
    }
  }, [analysis]);

  const isLoading = loading && (!analysis || analysis.status === "analyzing");

  return (
    <div className="flex flex-col h-full bg-vsc-surface-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-vsc-border/15">
        <div className="flex items-center gap-2">
          <Icon name="search" tokenSize="sm" className="text-(--color-cause-root,#f7768e)" />
          <Text size="xs" className="font-semibold text-vsc-fg">
            Root Cause Analysis
          </Text>
        </div>
        <Kbd>Cmd+Shift+R</Kbd>
      </div>

      {/* Symptom display */}
      {analysis && (
        <div className="flex flex-col gap-0.5 px-3 py-2 border-b border-vsc-border/15 bg-vsc-surface-1/30">
          <div className="flex items-center gap-1.5">
            <Icon name="error" tokenSize="sm" className="text-vsc-error shrink-0" />
            <Text size="xs" className="font-medium text-vsc-error truncate">
              {analysis.symptom}
            </Text>
          </div>
          <button
            type="button"
            onClick={() => handleFileClick(analysis.symptomFile, analysis.symptomLine)}
            aria-label="Navigate to symptom location"
            className={cn(
              "text-2xs text-vsc-text-link hover:underline cursor-pointer",
              "bg-transparent border-none p-0 self-start ml-5",
            )}
          >
            {analysis.symptomFile.split("/").pop()}:{analysis.symptomLine}
          </button>
        </div>
      )}

      {/* Analysis context breadcrumb */}
      {analysis?.status === "complete" && (
        <RootCauseContextBar
          symptomFile={analysis.symptomFile}
          symptomLine={analysis.symptomLine}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading && <LoadingState />}
        {!isLoading && !analysis && <EmptyState onAnalyzeLastError={handleAnalyzeLastError} />}
        {!isLoading && analysis && (
          <div className="flex flex-col gap-0.5 animate-in fade-in duration-slow">
            {/* Candidates */}
            {analysis.candidates.length > 0 && (
              <>
                <SectionHeader title="Candidates" icon="list-ordered" />
                <div
                  role="listbox"
                  aria-label="Root cause candidates"
                  className="flex flex-col gap-2 px-3 pb-2"
                >
                  {analysis.candidates.map((c, i) => (
                    <div
                      key={c.id}
                      role="option"
                      aria-selected={false}
                      className="si-stagger-item"
                      style={{ "--si-delay": `${i * 50}ms` } as React.CSSProperties}
                    >
                      <CauseCandidateCard
                        candidate={c}
                        evidenceKinds={evidenceKinds}
                        onFileClick={handleFileClick}
                        onEvidenceClick={handleEvidenceClick}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Causal Chain */}
            {analysis.causalChain.nodes.length > 0 && (
              <>
                <SectionHeader title="Causal Chain" icon="git-merge" />
                <div className="px-3 pb-2">
                  <CausalChainGraph
                    nodes={analysis.causalChain.nodes}
                    edges={analysis.causalChain.edges}
                    onNodeClick={handleFileClick}
                  />
                </div>
              </>
            )}

            {/* Evidence */}
            {analysis.evidence.length > 0 && (
              <>
                <SectionHeader title="Evidence" icon="book" />
                <EvidenceBundle evidence={analysis.evidence} onFileClick={handleFileClick} />
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-vsc-border/15 mt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleFixSuggestion}
                disabled={analysis.candidates.length === 0}
              >
                <Icon name="lightbulb" tokenSize="sm" />
                Fix Suggestion
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleShowInEditor}
                disabled={analysis.candidates.length === 0}
              >
                <Icon name="go-to-file" tokenSize="sm" />
                Show in Editor
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRunTests}
                disabled={!analysis.evidence.some((e) => e.kind === "test-failure")}
              >
                <Icon name="beaker" tokenSize="sm" />
                Run Tests
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
