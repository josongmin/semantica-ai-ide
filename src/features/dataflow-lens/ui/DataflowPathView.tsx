/**
 * DataflowPathView — renders a single dataflow path as a vertical chain
 *
 * Each node displays role icon, symbol name (clickable), taint badge,
 * and connecting lines between nodes.
 */

import { memo, useCallback } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { DataflowNode, DataflowPath } from "../model/types";

// ─── Constants ──────────────────────────────────────────

const ROLE_ICON: Record<DataflowNode["role"], string> = {
  source: "arrow-circle-down",
  transform: "symbol-method",
  sink: "arrow-circle-up",
};

const TAINT_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  "user-input": { bg: "bg-vsc-error/20", text: "text-vsc-error", label: "user-input" },
  "db-result": { bg: "bg-vsc-info/20", text: "text-vsc-info", label: "db-result" },
  config: { bg: "bg-neutral-500/20", text: "text-neutral-400", label: "config" },
  env: { bg: "bg-neutral-500/20", text: "text-neutral-400", label: "env" },
  network: { bg: "bg-vsc-warning/20", text: "text-vsc-warning", label: "network" },
  "file-io": { bg: "bg-vsc-accent/20", text: "text-vsc-accent", label: "file-io" },
};

const RISK_DOT: Record<string, string> = {
  safe: "bg-vsc-success",
  caution: "bg-vsc-warning",
  danger: "bg-vsc-error animate-pulse",
};

// ─── Props ──────────────────────────────────────────────

interface DataflowPathViewProps {
  path: DataflowPath;
  highlighted: boolean;
  onNodeClick: (filePath: string, line: number) => void;
  onHover: (pathId: string) => void;
  onHoverEnd: () => void;
}

// ─── Sub-components ─────────────────────────────────────

const TaintBadge = memo(function TaintBadge({ label }: { label: string }) {
  const badge = TAINT_BADGE[label];
  if (!badge) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-medium",
        badge.bg,
        badge.text,
      )}
    >
      {badge.label}
    </span>
  );
});

const SanitizerMarker = memo(function SanitizerMarker() {
  return (
    <div className="flex items-center gap-1 pl-6 py-0.5">
      <Icon name="shield" tokenSize="2xs" className="text-vsc-success" />
      <span className="text-3xs text-vsc-success font-medium">sanitized</span>
    </div>
  );
});

const NodeRow = memo(function NodeRow({
  node,
  isLast,
  hasSanitizer,
  showSanitizerAfter,
  dashedLine,
  onNodeClick,
}: {
  node: DataflowNode;
  isLast: boolean;
  hasSanitizer: boolean;
  showSanitizerAfter: boolean;
  dashedLine: boolean;
  onNodeClick: (filePath: string, line: number) => void;
}) {
  const handleClick = useCallback(() => {
    onNodeClick(node.filePath, node.line);
  }, [node.filePath, node.line, onNodeClick]);

  return (
    <>
      <div className="flex items-start gap-2 group">
        {/* Vertical connector + role icon */}
        <div className="flex flex-col items-center w-4 shrink-0">
          <Icon
            name={ROLE_ICON[node.role]}
            tokenSize="xs"
            className={cn(
              "shrink-0",
              node.role === "source" && "text-vsc-info",
              node.role === "transform" && "text-vsc-text-secondary",
              node.role === "sink" && "text-vsc-warning",
            )}
          />
          {!isLast && (
            <div
              className={cn(
                "w-px flex-1 min-h-[12px]",
                dashedLine
                  ? "border-l border-dashed border-vsc-border/50"
                  : "bg-vsc-border/40",
              )}
            />
          )}
        </div>

        {/* Symbol info */}
        <div className="min-w-0 flex-1 pb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleClick}
              className="text-2xs font-mono text-vsc-accent hover:underline cursor-pointer truncate"
              title={`${node.filePath}:${node.line}`}
            >
              {node.symbolName}
            </button>
            {node.taintLabel && <TaintBadge label={node.taintLabel} />}
          </div>
          <div className="text-3xs text-vsc-text-ghost truncate">
            {node.description}
          </div>
        </div>
      </div>

      {/* Sanitizer checkpoint */}
      {showSanitizerAfter && hasSanitizer && <SanitizerMarker />}
    </>
  );
});

// ─── Main Component ─────────────────────────────────────

export const DataflowPathView = memo(function DataflowPathView({
  path,
  highlighted,
  onNodeClick,
  onHover,
  onHoverEnd,
}: DataflowPathViewProps) {
  const handleMouseEnter = useCallback(() => {
    onHover(path.id);
  }, [onHover, path.id]);

  // Find the index after which to show the sanitizer marker
  // (after the last transform node, before the sink)
  const sanitizerIndex = path.hasSanitizer
    ? path.nodes.findIndex((n, i) => n.role === "transform" && (i + 1 >= path.nodes.length || path.nodes[i + 1]?.role === "sink"))
    : -1;

  return (
    <div
      className={cn(
        "rounded-md px-2 py-1.5 transition-colors duration-fast",
        highlighted
          ? "bg-vsc-surface-2/60 ring-1 ring-vsc-accent/30"
          : "hover:bg-vsc-surface-1/40",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onHoverEnd}
    >
      {/* Path header */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={cn("w-2 h-2 rounded-full shrink-0", RISK_DOT[path.riskLevel])} />
        <span className="text-2xs font-medium text-vsc-text-primary truncate">
          {path.label}
        </span>
        {path.isTainted && !path.hasSanitizer && (
          <span className="text-3xs text-vsc-error font-semibold ml-auto shrink-0">
            NO SANITIZER
          </span>
        )}
      </div>

      {/* Node chain */}
      <div className="pl-1">
        {path.nodes.map((node, i) => (
          <NodeRow
            key={node.id}
            node={node}
            isLast={i === path.nodes.length - 1}
            hasSanitizer={path.hasSanitizer}
            showSanitizerAfter={i === sanitizerIndex}
            dashedLine={!path.hasSanitizer && path.isTainted}
            onNodeClick={onNodeClick}
          />
        ))}
      </div>

      {/* Danger warning */}
      {path.riskLevel === "danger" && (
        <div className="flex items-center gap-1 mt-1 px-1.5 py-1 rounded bg-vsc-error/10 border border-vsc-error/20">
          <Icon name="warning" tokenSize="2xs" className="text-vsc-error shrink-0" />
          <span className="text-3xs text-vsc-error font-medium">
            DANGER: Potential injection risk — unsanitized user input reaches sink
          </span>
        </div>
      )}
    </div>
  );
});
