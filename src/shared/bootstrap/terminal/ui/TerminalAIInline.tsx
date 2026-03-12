/**
 * TerminalAIInline — ##ai inline mode badge
 *
 * Tiny floating "✦ AI" label near cursor when ##ai prefix is detected.
 * No popup/widget — Enter just sends the query to the backend.
 *
 * Flow:
 *   user types: ##ai find big files here
 *                ↑ AIModeBadge appears
 *   presses Enter → intercepted, query sent to backend
 */

import { memo } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

// ─── AI Mode Badge ──────────────────────────────────────────
// Tiny floating badge that shows when user is typing ##ai prefix

export interface AIModeBadgeProps {
  /** Whether ##ai prefix is detected in current input */
  visible: boolean;
  /** Which ##ai variant */
  intent: "ask" | "fix" | "explain";
  /** Pixel position near the cursor */
  position: { x: number; y: number } | null;
}

export const AIModeBadge = memo(function AIModeBadge({
  visible,
  intent,
  position,
}: AIModeBadgeProps) {
  if (!visible || !position) return null;

  return (
    <div
      className={cn(
        "fixed z-[--z-overlay] pointer-events-none",
        "flex items-center gap-1 px-1.5 py-0.5 rounded-full",
        "bg-vsc-accent/15 border border-vsc-accent/30",
        "animate-in fade-in zoom-in-95 duration-fast",
        "select-none",
      )}
      style={{
        left: position.x,
        top: position.y - 22,
      }}
    >
      <Icon name="sparkle" size={9} className="text-vsc-accent" />
      <span className="text-3xs font-medium text-vsc-accent tracking-wide">
        {{ ask: "AI", fix: "FIX", explain: "EXPLAIN" }[intent]}
      </span>
    </div>
  );
});
