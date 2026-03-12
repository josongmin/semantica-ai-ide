/**
 * AIGhostText — RFC-TERMINAL-016 §2.2
 *
 * Floating ghost text overlay positioned near the xterm cursor.
 * Shows dimmed completion text that the user can accept with Tab or →.
 *
 * Positioned at z-[11] — above xterm, below other overlays.
 * Uses absolute positioning; requires the parent to be `position: relative`.
 */

import { memo } from "react";
import { useAtomValue } from "jotai";

import { cn } from "~shared/ui/variants";

import { terminalGhostTextAtom } from "../model/aiAtoms";

// ─── Component ───────────────────────────────────────────

export interface AIGhostTextProps {
  /** Whether ghost text should be shown (xterm has focus & user is typing) */
  active?: boolean;
  className?: string;
}

export const AIGhostText = memo(function AIGhostText({
  active = true,
  className,
}: AIGhostTextProps) {
  const ghostText = useAtomValue(terminalGhostTextAtom);

  if (!active || !ghostText) return null;

  return (
    <div
      className={cn(
        "absolute bottom-1 left-12 z-[--z-sticky]",
        "pointer-events-none select-none",
        "animate-in fade-in duration-normal",
        className,
      )}
      data-testid="ai-ghost-text"
      aria-hidden="true"
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          "font-mono text-xs",
          "text-vsc-text-ghost/65",
          "italic font-light",
        )}
      >
        <span>{ghostText.text}</span>
        <GhostSourceBadge source={ghostText.source} />
      </span>
    </div>
  );
});

// ─── Source Badge ────────────────────────────────────────

function GhostSourceBadge({ source }: { source: "history" | "ai" | "script" }) {
  const config = {
    history: { label: "↑", title: "From history" },
    ai: { label: "AI", title: "AI suggestion" },
    script: { label: "⚡", title: "From package.json" },
  }[source];

  return (
    <span className="text-3xs opacity-70 ml-1" title={config.title}>
      {config.label}
    </span>
  );
}
