/**
 * LensHoverCard — floating detail card for a symbol
 *
 * Shows callers/callees, impact summary, runtime stats,
 * recent change info, risk bar, and action buttons.
 */

import { memo, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { LensDetailData } from "../model/types";

// ─── Helpers ─────────────────────────────────────────────

const SYMBOL_KIND_ICON: Record<string, string> = {
  function: "symbol-method",
  method: "symbol-method",
  class: "symbol-class",
  interface: "symbol-interface",
  variable: "symbol-variable",
  module: "symbol-namespace",
  type: "symbol-parameter",
  hook: "symbol-event",
  enum: "symbol-enum",
  namespace: "symbol-namespace",
};

interface RiskBlock {
  readonly filled: number;
  readonly color: string;
  readonly label: string;
}

const RISK_FALLBACK: RiskBlock = {
  filled: 0,
  color: "text-[var(--color-risk-none)]",
  label: "None",
} as const;

const RISK_BLOCKS: Record<string, RiskBlock> = {
  none: RISK_FALLBACK,
  low: { filled: 2, color: "text-[var(--color-risk-low)]", label: "Low" },
  medium: { filled: 4, color: "text-[var(--color-risk-medium)]", label: "Medium" },
  high: { filled: 7, color: "text-[var(--color-risk-high)]", label: "High" },
  critical: { filled: 10, color: "text-[var(--color-risk-critical)]", label: "Critical" },
};

const BLOCK_FILLED = "\u2588"; // █
const BLOCK_EMPTY = "\u2591"; // ░

const MAX_REFS = 5;

// ─── Props ───────────────────────────────────────────────

interface LensHoverCardProps {
  detail: LensDetailData;
  loading: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: "graph" | "dataflow" | "impact" | "explain") => void;
  onNodeClick: (filePath: string, line: number) => void;
  className?: string;
}

// ─── Sub-components ──────────────────────────────────────

const SkeletonLine = memo(function SkeletonLine({ width }: { width: string }) {
  return <div className="h-3 rounded bg-vsc-surface-2 animate-pulse" style={{ width }} />;
});

const RefList = memo(function RefList({
  title,
  refs,
  onNodeClick,
}: {
  title: string;
  refs: LensDetailData["callers"];
  onNodeClick: (filePath: string, line: number) => void;
}) {
  const visible = refs.slice(0, MAX_REFS);
  const remaining = refs.length - visible.length;

  return (
    <div className="min-w-0 flex-1">
      <div className="text-2xs font-semibold text-vsc-text-secondary mb-1">{title}</div>
      {visible.length === 0 ? (
        <div className="text-3xs text-vsc-text-ghost italic">none</div>
      ) : (
        <ul className="space-y-0.5">
          {visible.map((ref) => (
            <li key={ref.id}>
              <button
                type="button"
                onClick={() => onNodeClick(ref.filePath, ref.line)}
                className="text-3xs text-vsc-accent hover:underline truncate block max-w-full cursor-pointer"
                title={`${ref.filePath}:${ref.line}`}
              >
                {ref.name}
              </button>
            </li>
          ))}
          {remaining > 0 && <li className="text-3xs text-vsc-text-ghost">+{remaining} more</li>}
        </ul>
      )}
    </div>
  );
});

const ActionPill = memo(function ActionPill({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "text-3xs text-vsc-text-secondary",
        "bg-vsc-surface-2/80 hover:bg-vsc-surface-2 hover:text-vsc-text-primary",
        "transition-colors duration-fast cursor-pointer",
      )}
    >
      <Icon name={icon} tokenSize="2xs" />
      {label}
    </button>
  );
});

// ─── Main Component ──────────────────────────────────────

export const LensHoverCard = memo(function LensHoverCard({
  detail,
  loading,
  position,
  onClose,
  onAction,
  onNodeClick,
  className,
}: LensHoverCardProps) {
  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const riskInfo = RISK_BLOCKS[detail.riskLevel] ?? RISK_FALLBACK;

  const riskBar = useMemo(() => {
    const { filled } = riskInfo;
    const empty = 10 - filled;
    return BLOCK_FILLED.repeat(filled) + BLOCK_EMPTY.repeat(empty);
  }, [riskInfo]);

  const handleAction = useCallback(
    (action: "graph" | "dataflow" | "impact" | "explain") => () => onAction(action),
    [onAction],
  );

  const recentCommit = detail.recentCommits[0] ?? null;

  return createPortal(
    <div
      className={cn(
        "fixed z-(--z-floating) max-w-[400px] min-w-0 sm:min-w-[280px]",
        "backdrop-blur-md bg-vsc-surface-0/90 border border-vsc-border/40",
        "rounded-lg shadow-xl",
        "p-3 space-y-2",
        "animate-in fade-in zoom-in-95 duration-slow",
        className,
      )}
      style={{ left: position.x, top: position.y }}
      onMouseLeave={onClose}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Icon
          name={SYMBOL_KIND_ICON[detail.symbolKind] ?? "symbol-method"}
          tokenSize="sm"
          className="text-vsc-accent shrink-0"
        />
        <span className="text-xs font-semibold text-vsc-text-primary truncate">
          {detail.symbolName}
        </span>
        <span className="text-3xs text-vsc-text-ghost ml-auto shrink-0">{detail.symbolKind}</span>
      </div>

      {/* Location */}
      <div className="text-3xs text-vsc-accent truncate">
        {detail.filePath}:{detail.line}
      </div>

      {loading ? (
        /* Skeleton loading state */
        <div className="space-y-2">
          <SkeletonLine width="80%" />
          <SkeletonLine width="60%" />
          <SkeletonLine width="70%" />
          <SkeletonLine width="50%" />
        </div>
      ) : (
        <>
          {/* Callers / Callees columns */}
          <div className="flex gap-3">
            <RefList title="Callers" refs={detail.callers} onNodeClick={onNodeClick} />
            <RefList title="Callees" refs={detail.callees} onNodeClick={onNodeClick} />
          </div>

          {/* Impact summary */}
          <div className="text-2xs text-vsc-text-secondary">
            <Icon name="beaker" tokenSize="2xs" className="mr-1" />
            Impact: {detail.impactedModules} modules &middot; {detail.impactedTests} tests &middot;{" "}
            {detail.impactedApis} APIs
          </div>

          {/* Runtime stats */}
          {detail.callFrequency !== null && (
            <div className="text-2xs text-vsc-text-secondary">
              <Icon name="pulse" tokenSize="2xs" className="mr-1" />
              Runtime: ~{(detail.callFrequency / 1000).toFixed(0)}k/h
              {detail.avgLatency !== null && <> &middot; avg {detail.avgLatency}ms</>}
            </div>
          )}

          {/* Recent change */}
          {recentCommit && (
            <div className="text-2xs text-vsc-text-secondary truncate">
              <Icon name="git-commit" tokenSize="2xs" className="mr-1" />
              Changed: {recentCommit.daysAgo}d ago ({recentCommit.message})
            </div>
          )}

          {/* Risk bar */}
          <div className="flex items-center gap-2 text-2xs">
            <Icon name="shield" tokenSize="2xs" className="text-vsc-text-secondary" />
            <span className={cn("font-mono text-3xs tracking-wider", riskInfo.color)}>
              {riskBar}
            </span>
            <span className={cn("text-3xs font-semibold", riskInfo.color)}>{riskInfo.label}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <ActionPill icon="graph" label="Graph" onClick={handleAction("graph")} />
            <ActionPill icon="arrow-both" label="Dataflow" onClick={handleAction("dataflow")} />
            <ActionPill icon="eye" label="Impact" onClick={handleAction("impact")} />
            <ActionPill
              icon="comment-discussion"
              label="Explain"
              onClick={handleAction("explain")}
            />
          </div>
        </>
      )}
    </div>,
    document.body,
  );
});
