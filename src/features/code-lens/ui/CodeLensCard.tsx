/**
 * CodeLensCard — Inline Explain floating card.
 *
 * Displays a glass-panel overlay with code analysis data:
 * summary, call flow, side effects, throws, and complexity.
 */

import { memo, useCallback, useEffect, useRef } from "react";

import { cn, Icon } from "~shared/ui";

import type { CodeLensData, CodeLensTarget } from "../model/codeLensAtoms";

// ─── Types ─────────────────────────────────────────────────

export interface CodeLensCardProps {
  data: CodeLensData;
  target: CodeLensTarget;
  onClose: () => void;
  onFlowNodeClick?: (filePath: string, line: number) => void;
  className?: string;
}

// ─── Constants ─────────────────────────────────────────────

const COMPLEXITY_DOTS: Record<CodeLensData["complexity"], number> = {
  low: 1,
  medium: 3,
  high: 5,
};

const COMPLEXITY_COLOR: Record<CodeLensData["complexity"], string> = {
  low: "text-vsc-success",
  medium: "text-vsc-warning",
  high: "text-vsc-error",
};

const LANG_ACCENT: Record<string, string> = {
  typescript: "bg-lang-typescript",
  javascript: "bg-lang-javascript",
  python: "bg-lang-python",
  rust: "bg-lang-rust",
  go: "bg-lang-go",
  java: "bg-lang-java",
  css: "bg-lang-css",
  html: "bg-lang-html",
};

function getAccentClass(language?: string): string {
  if (!language) return "bg-vsc-accent";
  return LANG_ACCENT[language.toLowerCase()] ?? "bg-vsc-accent";
}

// ─── Component ─────────────────────────────────────────────

export const CodeLensCard = memo(function CodeLensCard({
  data,
  target,
  onClose,
  onFlowNodeClick,
  className,
}: CodeLensCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Defer listener registration to avoid closing on the opening click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleFlowClick = useCallback(
    (filePath: string, line: number) => {
      onFlowNodeClick?.(filePath, line);
    },
    [onFlowNodeClick],
  );

  const accentClass = getAccentClass(target.language);
  const dots = COMPLEXITY_DOTS[data.complexity];
  const complexityColor = COMPLEXITY_COLOR[data.complexity];

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label="Code Lens: Inline Explain"
      className={cn(
        // Glass panel
        "bg-vsc-surface-1/90 backdrop-blur-sm",
        "border border-vsc-border/20 rounded-lg",
        "shadow-lg shadow-black/10",
        // Size
        "w-full sm:w-[360px] max-w-[90vw]",
        // Enter animation
        "animate-[codeLensEnter_200ms_ease-out]",
        className,
      )}
    >
      {/* Layout with accent bar */}
      <div className="flex">
        {/* Left accent bar */}
        <div className={cn("w-1 shrink-0 rounded-l-lg", accentClass)} />

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 space-y-3">
          {/* Header: summary + close */}
          <div className="flex items-start gap-2">
            <p className="flex-1 text-xs font-semibold text-vsc-fg leading-snug">{data.summary}</p>
            <button
              type="button"
              className={cn(
                "shrink-0 p-0.5 rounded",
                "text-vsc-text-ghost hover:text-vsc-fg",
                "hover:bg-vsc-surface-2 transition-colors duration-fast",
                "focus-ring",
              )}
              onClick={onClose}
              aria-label="Close"
            >
              <Icon name="close" size={12} />
            </button>
          </div>

          {/* Flow chain */}
          {data.flow.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-2xs font-medium text-vsc-text-secondary uppercase tracking-wide">
                Flow
              </h4>
              <div className="flex flex-wrap items-center gap-1">
                {data.flow.map((node, i) => (
                  <span key={`${node.name}-${node.line}`} className="flex items-center gap-1">
                    {i > 0 && (
                      <Icon name="arrow-right" size={10} className="text-vsc-text-ghost shrink-0" />
                    )}
                    <button
                      type="button"
                      className={cn(
                        "text-2xs text-vsc-accent hover:text-vsc-accent/80",
                        "hover:underline underline-offset-2",
                        "transition-colors duration-fast",
                        "focus-ring rounded px-0.5",
                      )}
                      onClick={() => handleFlowClick(node.filePath, node.line)}
                      title={`${node.filePath}:${node.line}`}
                    >
                      {node.name}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Side Effects + Throws (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Side Effects */}
            {data.sideEffects.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-2xs font-medium text-vsc-text-secondary uppercase tracking-wide">
                  Side Effects
                </h4>
                <ul className="space-y-0.5">
                  {data.sideEffects.map((effect) => (
                    <li
                      key={effect}
                      className="flex items-start gap-1 text-2xs text-vsc-text-secondary"
                    >
                      <span className="shrink-0 mt-px text-vsc-text-ghost" aria-hidden>
                        &bull;
                      </span>
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Throws */}
            {data.throws.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-2xs font-medium text-vsc-text-secondary uppercase tracking-wide">
                  Throws
                </h4>
                <ul className="space-y-0.5">
                  {data.throws.map((err) => (
                    <li key={err} className="flex items-start gap-1 text-2xs text-vsc-error/80">
                      <span className="shrink-0 mt-px" aria-hidden>
                        &bull;
                      </span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Complexity */}
          <div className="flex items-center gap-2">
            <h4 className="text-2xs font-medium text-vsc-text-secondary uppercase tracking-wide">
              Complexity
            </h4>
            <div
              className="flex items-center gap-0.5"
              aria-label={`Complexity: ${data.complexity}`}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full transition-colors duration-fast",
                    i < dots ? complexityColor : "bg-vsc-text-ghost/20",
                    i < dots && "opacity-100",
                  )}
                  style={i < dots ? { backgroundColor: "currentColor" } : undefined}
                />
              ))}
            </div>
            <span className={cn("text-2xs font-medium", complexityColor)}>{data.complexity}</span>
          </div>

          {/* File location */}
          <div className="pt-1 border-t border-vsc-border/10">
            <p className="text-3xs text-vsc-text-ghost truncate" title={target.filePath}>
              {target.filePath}:{target.startLine}&ndash;{target.endLine}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
