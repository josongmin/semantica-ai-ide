/**
 * TerminalAIInline — ##ai inline mode pill badge
 *
 * Tiny floating pill that tracks the xterm cursor position via rAF polling.
 * View-only — no event handling.
 */

import { memo, useEffect, useRef, useState } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { TerminalViewportRawHandle } from "./TerminalViewportRaw";

export interface AIModeBadgeProps {
  visible: boolean;
  intent: "ask" | "fix" | "explain";
  /** Ref to the terminal viewport — used to poll cursor position */
  viewportRef: React.RefObject<TerminalViewportRawHandle | null>;
}

const INTENT_CFG = {
  ask: { label: "AI", icon: "hubot" },
  fix: { label: "FIX", icon: "hubot" },
  explain: { label: "EXPLAIN", icon: "hubot" },
} as const;

export const AIModeBadge = memo(function AIModeBadge({
  visible,
  intent,
  viewportRef,
}: AIModeBadgeProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    // Poll xterm cursor position via rAF — syncs with actual cursor, not key events
    // Skip polling when tab is hidden to save battery/CPU
    const tick = () => {
      if (!document.hidden) {
        const p = viewportRef.current?.getCursorPixelPosition() ?? null;
        if (p) setPos((prev) => (prev?.x === p.x && prev.y === p.y ? prev : p));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, viewportRef]);

  if (!visible || !pos) return null;

  const cfg = INTENT_CFG[intent];

  return (
    <div
      className={cn(
        "fixed z-[--z-overlay] pointer-events-none",
        "inline-flex items-center gap-0.5 h-4 px-1.5 rounded-full",
        "border border-white/10",
        "animate-in fade-in zoom-in-95 duration-fast",
        "select-none backdrop-blur-sm shadow-sm",
      )}
      style={{
        left: pos.x + 4,
        top: pos.y - 20,
        background: "var(--color-gnb-via)",
      }}
    >
      <Icon name={cfg.icon} size={10} className="text-white/70" />
      <span className="text-4xs font-medium text-white/80 tracking-wider uppercase leading-none">
        {cfg.label}
      </span>
    </div>
  );
});
