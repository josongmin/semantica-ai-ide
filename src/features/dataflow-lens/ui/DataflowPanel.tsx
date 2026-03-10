/**
 * DataflowPanel — glass panel overlay showing dataflow analysis
 *
 * Displays inbound/outbound data paths for a symbol with taint
 * tracking, sanitizer detection, and security risk assessment.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { DataflowAnalysis } from "../model/types";
import { DataflowPathView } from "./DataflowPathView";

// ─── Props ──────────────────────────────────────────────

interface DataflowPanelProps {
  analysis: DataflowAnalysis;
  highlightedPathId: string | null;
  onClose: () => void;
  onNodeClick: (filePath: string, line: number) => void;
  onHighlightPath: (pathId: string) => void;
  onClearHighlight: () => void;
}

// ─── Sub-components ─────────────────────────────────────

const SectionHeader = memo(function SectionHeader({
  label,
  count,
  expanded,
  onToggle,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={expanded ? "Collapse section" : "Expand section"}
      className={cn(
        "flex items-center gap-1.5 w-full px-2 py-1 rounded",
        "text-2xs font-semibold text-vsc-text-secondary",
        "hover:bg-vsc-surface-1/40 transition-colors duration-fast cursor-pointer",
      )}
    >
      <Icon
        name="chevron-right"
        tokenSize="2xs"
        className={cn(
          "transition-transform duration-fast shrink-0",
          expanded && "rotate-90",
        )}
      />
      {label} ({count} {count === 1 ? "path" : "paths"})
    </button>
  );
});

const SecurityFooter = memo(function SecurityFooter({
  notes,
}: {
  notes: readonly string[];
}) {
  if (notes.length === 0) return null;

  const hasDanger = notes.some((n) => n.startsWith("DANGER"));

  return (
    <div
      className={cn(
        "px-3 py-2 border-t",
        hasDanger
          ? "border-vsc-error/30 bg-vsc-error/5"
          : "border-vsc-border/30 bg-vsc-surface-1/20",
      )}
    >
      <div className="flex items-center gap-1 mb-1">
        <Icon
          name="shield"
          tokenSize="2xs"
          className={hasDanger ? "text-vsc-error" : "text-vsc-success"}
        />
        <span
          className={cn(
            "text-2xs font-semibold",
            hasDanger ? "text-vsc-error" : "text-vsc-success",
          )}
        >
          Security
        </span>
      </div>
      <ul className="space-y-0.5">
        {notes.map((note) => (
          <li
            key={`note-${note.slice(0, 30)}`}
            className={cn(
              "text-3xs",
              note.startsWith("DANGER")
                ? "text-vsc-error font-medium"
                : "text-vsc-text-secondary",
            )}
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
});

const SkeletonPanel = memo(function SkeletonPanel() {
  return (
    <div className="p-3 space-y-3">
      {[80, 60, 70, 50, 65].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded bg-vsc-surface-2 animate-pulse"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
});

// ─── Main Component ─────────────────────────────────────

export const DataflowPanel = memo(function DataflowPanel({
  analysis,
  highlightedPathId,
  onClose,
  onNodeClick,
  onHighlightPath,
  onClearHighlight,
}: DataflowPanelProps) {
  const [inboundExpanded, setInboundExpanded] = useState(true);
  const [outboundExpanded, setOutboundExpanded] = useState(true);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const toggleInbound = useCallback(() => setInboundExpanded((p) => !p), []);
  const toggleOutbound = useCallback(() => setOutboundExpanded((p) => !p), []);

  // Focus the close button when panel mounts
  useEffect(() => {
    requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const dangerCount = useMemo(() => {
    const all = [...analysis.inbound, ...analysis.outbound];
    return all.filter((p) => p.riskLevel === "danger").length;
  }, [analysis.inbound, analysis.outbound]);

  const shortPath = useMemo(() => {
    const parts = analysis.filePath.split("/");
    return parts.length > 2 ? parts.slice(-2).join("/") : analysis.filePath;
  }, [analysis.filePath]);

  return createPortal(
    <div
      className={cn(
        "fixed right-4 top-4 bottom-4 w-full sm:w-[320px] z-(--z-toast)",
        "flex flex-col overflow-hidden",
        "backdrop-blur-md bg-vsc-surface-0/80 border border-vsc-border/30",
        "rounded-lg shadow-xl",
      )}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-vsc-border/30 shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Icon name="arrow-both" tokenSize="sm" className="text-vsc-accent shrink-0" />
            <span className="text-xs font-semibold text-vsc-text-primary truncate">
              Dataflow: {analysis.symbolName}
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close dataflow panel"
            className={cn(
              "p-0.5 rounded",
              "text-vsc-text-ghost hover:text-vsc-text-primary",
              "hover:bg-vsc-surface-2/80 transition-colors duration-fast cursor-pointer",
            )}
          >
            <Icon name="close" tokenSize="xs" />
          </button>
        </div>
        <div className="text-3xs text-vsc-text-ghost truncate">
          {shortPath}:{analysis.line}
        </div>
        {dangerCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-vsc-error animate-pulse" />
            <span className="text-3xs text-vsc-error font-semibold">
              {dangerCount} unsafe {dangerCount === 1 ? "path" : "paths"} detected
            </span>
          </div>
        )}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2 space-y-2">
        {/* Inbound section */}
        {analysis.inbound.length > 0 && (
          <div>
            <SectionHeader
              label="Inbound"
              count={analysis.inbound.length}
              expanded={inboundExpanded}
              onToggle={toggleInbound}
            />
            {inboundExpanded && (
              <div className="mt-1 space-y-1 animate-in fade-in duration-150">
                {analysis.inbound.map((path) => (
                  <DataflowPathView
                    key={path.id}
                    path={path}
                    highlighted={highlightedPathId === path.id}
                    onNodeClick={onNodeClick}
                    onHover={onHighlightPath}
                    onHoverEnd={onClearHighlight}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Outbound section */}
        {analysis.outbound.length > 0 && (
          <div>
            <SectionHeader
              label="Outbound"
              count={analysis.outbound.length}
              expanded={outboundExpanded}
              onToggle={toggleOutbound}
            />
            {outboundExpanded && (
              <div className="mt-1 space-y-1 animate-in fade-in duration-150">
                {analysis.outbound.map((path) => (
                  <DataflowPathView
                    key={path.id}
                    path={path}
                    highlighted={highlightedPathId === path.id}
                    onNodeClick={onNodeClick}
                    onHover={onHighlightPath}
                    onHoverEnd={onClearHighlight}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {analysis.inbound.length === 0 && analysis.outbound.length === 0 && (
          <div className="text-center py-6 text-2xs text-vsc-text-ghost italic">
            No dataflow paths detected for this symbol.
          </div>
        )}
      </div>

      {/* Security footer */}
      <SecurityFooter notes={analysis.securityNotes} />
    </div>,
    document.body,
  );
});

export { SkeletonPanel as DataflowPanelSkeleton };
