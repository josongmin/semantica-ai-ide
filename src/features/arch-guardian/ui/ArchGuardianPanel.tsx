/**
 * ArchGuardianPanel — Bottom panel showing architecture violations
 *
 * Displays health score, scan controls, and a scrollable list of
 * all detected architecture violations with severity and fix actions.
 */

import { memo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { IS_MAC } from "~shared/lib/hooks/usePlatform";
import type { BreadcrumbItem } from "~shared/ui";
import { Breadcrumbs } from "~shared/ui/primitives/Breadcrumbs";
import { Button } from "~shared/ui/primitives/Button";
import { Icon } from "~shared/ui/primitives/Icon";
import { Kbd } from "~shared/ui/primitives/Kbd";
import { cn } from "~shared/ui/variants";

import {
  archAnalysisAtom,
  archGuardianLoadingAtom,
  dismissViolationAtom,
  scanArchitectureAtom,
} from "../model/atoms";
import type { ArchViolationItem } from "../model/types";
import { LayerDiagram } from "./LayerDiagram";

// ─── Severity helpers ───────────────────────────────────

const STAGGER_INTERVAL_MS = 50;

const SEVERITY_STYLE = {
  error: {
    icon: { name: "error", className: "text-vsc-error" },
    badge: "bg-vsc-error/15 text-vsc-error",
    health: "bg-vsc-error/20 border-vsc-error/30",
    healthText: "text-vsc-error",
  },
  warning: {
    icon: { name: "warning", className: "text-vsc-warning" },
    badge: "bg-vsc-warning/15 text-vsc-warning",
    health: "bg-vsc-warning/20 border-vsc-warning/30",
    healthText: "text-vsc-warning",
  },
  info: {
    icon: { name: "info", className: "text-vsc-info" },
    badge: "bg-vsc-info/15 text-vsc-info",
    health: "bg-vsc-info/20 border-vsc-info/30",
    healthText: "text-vsc-info",
  },
} as const;

const KIND_LABELS: Record<string, string> = {
  "layer-skip": "Layer Violation",
  "circular-dependency": "Circular Dependency",
  "forbidden-import": "Feature Coupling",
  "coupling-threshold": "Shared Violation",
};

function healthColor(score: number): string {
  if (score >= 90) return SEVERITY_STYLE.info.healthText;
  if (score >= 70) return SEVERITY_STYLE.warning.healthText;
  return SEVERITY_STYLE.error.healthText;
}

function healthBg(score: number): string {
  if (score >= 90) return "bg-vsc-success/20 border-vsc-success/30";
  if (score >= 70) return SEVERITY_STYLE.warning.health;
  return SEVERITY_STYLE.error.health;
}

// ─── Violation Row ──────────────────────────────────────

const ViolationRow = memo(function ViolationRow({
  violation,
  onDismiss,
  index = 0,
}: {
  readonly violation: ArchViolationItem;
  readonly onDismiss: (id: string) => void;
  readonly index?: number;
}) {
  const style = SEVERITY_STYLE[violation.severity];

  const handleDismiss = useCallback(() => {
    onDismiss(violation.id);
  }, [onDismiss, violation.id]);

  return (
    <div
      role="option"
      aria-selected={false}
      className="si-stagger-item border-b border-vsc-border/20 px-3 py-2.5 transition-colors hover:bg-vsc-surface-1/40"
      style={{ "--si-delay": `${index * STAGGER_INTERVAL_MS}ms` } as React.CSSProperties}
    >
      {/* Top row: severity icon + kind badge + file path */}
      <div className="flex items-center gap-2">
        <Icon name={style.icon.name} className={style.icon.className} tokenSize="sm" />
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-2xs font-medium",
            style.badge,
          )}
        >
          {KIND_LABELS[violation.kind] ?? violation.kind}
        </span>
        <span className="ml-auto font-mono text-2xs text-vsc-text-2">
          {violation.filePath}:{violation.line}
        </span>
      </div>

      {/* Message */}
      <p className="mt-1 text-xs leading-relaxed text-vsc-text-1">{violation.message}</p>

      {/* Suggested fix + actions */}
      {violation.suggestedFix && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-2xs text-vsc-text-2">
            Fix: {violation.suggestedFix}
          </span>
          {violation.autoFixable && (
            <button
              type="button"
              onClick={handleDismiss}
              className="ml-auto rounded bg-vsc-info/30 px-2 py-0.5 text-2xs font-medium text-vsc-info transition-colors hover:bg-vsc-info/50"
            >
              Fix
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Analysis Context Breadcrumb ────────────────────────

const ArchContextBar = memo(function ArchContextBar({
  violationCount,
}: {
  violationCount: number;
}) {
  const items: BreadcrumbItem[] = [
    { label: "Architecture Scan", icon: "shield" },
    {
      label: `${violationCount} violation${violationCount !== 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="border-b border-vsc-border/10 px-3 py-1.5 shrink-0">
      <Breadcrumbs items={items} className="text-xs text-vsc-text-secondary" />
    </div>
  );
});

// ─── Panel ──────────────────────────────────────────────

export const ArchGuardianPanel = memo(function ArchGuardianPanel() {
  const analysis = useAtomValue(archAnalysisAtom);
  const loading = useAtomValue(archGuardianLoadingAtom);
  const scan = useSetAtom(scanArchitectureAtom);
  const dismiss = useSetAtom(dismissViolationAtom);

  const handleDismiss = useCallback(
    (id: string) => {
      dismiss(id);
    },
    [dismiss],
  );

  return (
    <div className="flex h-full flex-col backdrop-blur-md bg-vsc-surface-0/80 border border-vsc-border/30 rounded-lg overflow-hidden">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-vsc-border/30 px-3 py-2">
        <Icon name="shield" className="text-vsc-info" tokenSize="base" />
        <span className="text-sm font-semibold text-vsc-text-0">Architecture Guardian</span>

        {/* Health score badge */}
        {analysis && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-2xs font-bold",
              healthBg(analysis.healthScore),
              healthColor(analysis.healthScore),
            )}
          >
            {analysis.healthScore}/100
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Violation count */}
          {analysis && analysis.violations.length > 0 && (
            <span className="text-2xs text-vsc-text-2">
              {analysis.violations.length} violation{analysis.violations.length !== 1 ? "s" : ""}
            </span>
          )}

          {/* Scan button */}
          <button
            type="button"
            onClick={() => scan()}
            disabled={loading}
            aria-label="Run architecture scan"
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
              "bg-vsc-surface-1/60 text-vsc-text-1 hover:bg-vsc-surface-1",
              loading && "cursor-not-allowed opacity-50",
            )}
          >
            <Icon
              name="sync"
              tokenSize="xs"
              className={cn(loading && "animate-spin")}
            />
            {loading ? "Scanning…" : "Scan"}
          </button>
        </div>
      </div>

      {/* ── Analysis Context Breadcrumb ─────────────────── */}
      {analysis && analysis.violations.length > 0 && (
        <ArchContextBar violationCount={analysis.violations.length} />
      )}

      {/* ── Body ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Violations list */}
        <div role="listbox" aria-label="Architecture violations" className="flex-1 overflow-y-auto">
          {!analysis && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-vsc-text-2">
              <Icon name="shield" tokenSize="lg" className="opacity-40" />
              <p className="text-xs">Run a scan to detect architecture violations</p>
              <p className="text-2xs text-vsc-text-ghost">
                <Kbd>{IS_MAC ? "Cmd" : "Ctrl"}+Shift+A</Kbd>
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 border border-vsc-border/30"
                onClick={() => scan()}
              >
                <Icon name="shield" tokenSize="xs" />
                Scan Now
              </Button>
            </div>
          )}

          {loading && !analysis && (
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="sync" tokenSize="sm" className="animate-spin text-vsc-accent" />
                <p className="text-xs text-vsc-text-2">Scanning architecture...</p>
              </div>
              <div className="h-4 w-3/4 rounded bg-vsc-bg-secondary animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-vsc-bg-secondary animate-pulse" />
              <div className="h-20 w-full rounded bg-vsc-bg-secondary animate-pulse" />
              <div className="h-14 w-full rounded bg-vsc-bg-secondary animate-pulse" />
              <div className="h-14 w-5/6 rounded bg-vsc-bg-secondary animate-pulse" />
            </div>
          )}

          {analysis?.violations.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-vsc-text-2">
              <Icon name="check" tokenSize="lg" className="text-vsc-success" />
              <p className="text-xs">No architecture violations detected</p>
            </div>
          )}

          {analysis && analysis.violations.length > 0 && (
            <div className="animate-in fade-in duration-200">
              {analysis.violations.map((v, i) => (
                <ViolationRow key={v.id} violation={v} onDismiss={handleDismiss} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Layer diagram sidebar */}
        {analysis && (
          <div className="hidden w-52 shrink-0 border-l border-vsc-border/20 lg:block">
            <LayerDiagram layers={analysis.layers} violations={analysis.violations} />
          </div>
        )}
      </div>
    </div>
  );
});
