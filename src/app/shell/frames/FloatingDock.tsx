/**
 * FloatingDock — Minimized Window Dock
 *
 * Horizontal dock bar that appears at the bottom of the viewport
 * showing minimized floating windows as compact chips.
 * Click to restore, right-click to close.
 */

import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import {
  attachFromFloatingAtom,
  minimizedFloatingWindowsAtom,
  restoreFloatingWindowAtom,
} from "../model/floatingAtoms";
import { getViewById } from "../model/viewRegistry";

// ─── Component ───────────────────────────────────────────

export const FloatingDock = React.memo(function FloatingDock() {
  const minimized = useAtomValue(minimizedFloatingWindowsAtom);

  if (minimized.length === 0) return null;

  return (
    <div
      className={cn(
        "absolute bottom-2 left-1/2 -translate-x-1/2 z-(--z-floating-dock) pointer-events-auto",
        "flex items-center gap-1 px-2 py-1 rounded-lg max-w-[90vw] overflow-x-auto",
        "border border-vsc-border/40",
        "shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
        // Glass
        "bg-[color-mix(in_srgb,var(--color-vsc-bg)_85%,transparent)]",
        "backdrop-blur-md backdrop-saturate-150",
      )}
      data-floating-enter
    >
      {minimized.map((win) => (
        <DockChip key={win.viewId} viewId={win.viewId} />
      ))}
    </div>
  );
});

// ─── Dock Chip ───────────────────────────────────────────

function DockChip({ viewId }: { viewId: string }) {
  const restore = useSetAtom(restoreFloatingWindowAtom);
  const close = useSetAtom(attachFromFloatingAtom);
  const view = getViewById(viewId);

  const handleClick = useCallback(() => {
    restore(viewId);
  }, [restore, viewId]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      close(viewId);
    },
    [close, viewId],
  );

  if (!view) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
        "text-2xs text-vsc-text-secondary font-medium",
        "cursor-pointer bg-transparent border-none",
        "hover:bg-vsc-list-hover hover:text-vsc-fg",
        "transition-[color,background-color,transform] duration-fast focus-ring",
        "active:scale-95",
      )}
      title={`Restore ${view.title} (right-click to close)`}
      aria-label={`Restore ${view.title}`}
    >
      <Icon name={view.icon} tokenSize="2xs" className="text-vsc-text-ghost" />
      <span>{view.title}</span>
    </button>
  );
}
