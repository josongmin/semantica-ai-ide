/**
 * FloatingFrame — 2026 SOTA Draggable + Resizable Window Primitive
 *
 * Thin composition wrapper that delegates responsibilities:
 *  - Drag handling       -> useFloatingWindowDrag
 *  - Resize handling     -> useFloatingWindowResize
 *  - Snap geometry       -> floatingGeometry (computeSnapStyle)
 *  - Window state atoms  -> floatingAtoms
 */

import React, { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useKeyboardScope } from "~shared/lib/keyboard";
import { cn, Icon } from "~shared/ui";

import { useFloatingWindowDrag } from "../hooks/useFloatingWindowDrag";
import { type ResizeDirection, useFloatingWindowResize } from "../hooks/useFloatingWindowResize";
import {
  attachFromFloatingAtom,
  bringToFrontAtom,
  type FloatingWindowState,
  minimizeFloatingWindowAtom,
  toggleMaximizeFloatingAtom,
  topFloatingWindowIdAtom,
} from "../model/floatingAtoms";
import { computeSnapStyle } from "../model/floatingGeometry";
import type { ViewDefinition } from "../model/viewRegistry";

// ─── Types ───────────────────────────────────────────────

interface FloatingFrameProps {
  state: FloatingWindowState;
  panel: ViewDefinition;
  children: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────

export const FloatingFrame = React.memo(function FloatingFrame({
  state,
  panel,
  children,
}: FloatingFrameProps) {
  const topWindowId = useAtomValue(topFloatingWindowIdAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const minimize = useSetAtom(minimizeFloatingWindowAtom);
  const toggleMaximize = useSetAtom(toggleMaximizeFloatingAtom);
  const attach = useSetAtom(attachFromFloatingAtom);

  const windowRef = useRef<HTMLDivElement>(null);
  const isTopWindow = topWindowId === state.viewId;

  // ── Extracted hooks ──
  const handleDragStart = useFloatingWindowDrag({
    viewId: state.viewId,
    position: state.position,
    size: state.size,
  });

  const handleResizeStart = useFloatingWindowResize({
    viewId: state.viewId,
    position: state.position,
    size: state.size,
  });

  // ── Focus on click ──
  const handleFocus = useCallback(() => {
    if (!isTopWindow) {
      bringToFront(state.viewId);
    }
  }, [isTopWindow, bringToFront, state.viewId]);

  // ── Double-click title -> maximize ──
  const handleTitleDoubleClick = useCallback(() => {
    toggleMaximize(state.viewId);
  }, [toggleMaximize, state.viewId]);

  // ── Keyboard: Escape -> minimize (scoped to this floating window) ──
  useKeyboardScope(
    `floating-escape-${state.viewId}`,
    "panel",
    (e) => {
      if (e.key === "Escape" && !e.metaKey && !e.ctrlKey) {
        minimize(state.viewId);
        return true; // claim — don't let global handlers also process Escape
      }
      return false;
    },
    {
      panelId: `floating-${state.viewId}`,
      priority: 10, // floating windows get high priority within panel scope
      enabled: isTopWindow,
    },
  );

  // ── Position & size styles ──
  const snapStyle = computeSnapStyle(state.snappedTo);
  const isSnapped = !!snapStyle;

  let positionStyle: React.CSSProperties;
  if (state.maximized) {
    positionStyle = { inset: 8, width: "auto", height: "auto", position: "absolute" };
  } else if (isSnapped) {
    positionStyle = { ...snapStyle, position: "absolute" };
  } else {
    positionStyle = {
      position: "absolute",
      left: state.position.x,
      top: state.position.y,
      width: state.size.width,
      height: state.size.height,
    };
  }

  return (
    <div
      ref={windowRef}
      role="dialog"
      aria-label={`${panel.title} — Floating`}
      data-floating-window={state.viewId}
      data-keyboard-zone={`floating-${state.viewId}`}
      data-floating-enter
      style={{
        ...positionStyle,
        zIndex: state.zOrder,
      }}
      className={cn(
        "flex flex-col rounded-lg overflow-hidden pointer-events-auto",
        "border border-vsc-border/40 bg-vsc-bg shadow-lg shadow-black/10",
        isTopWindow && "ring-1 ring-vsc-accent/25 shadow-xl shadow-black/15",
        "transition-shadow duration-normal",
        (state.snappedTo !== null || state.maximized) &&
          "transition-[left,top,right,bottom,width,height,box-shadow] duration-slow ease-spring",
      )}
      onMouseDown={handleFocus}
    >
      {/* ── Title Bar ── */}
      <div
        className={cn(
          "flex items-center h-8 px-2 shrink-0 select-none",
          "bg-vsc-surface-1",
          "border-b border-vsc-border/30",
          "cursor-grab active:cursor-grabbing",
        )}
        onMouseDown={handleDragStart}
        onDoubleClick={handleTitleDoubleClick}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Icon name={panel.icon} tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
          <span className="text-2xs font-medium text-vsc-fg truncate">{panel.title}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <WindowControl
            icon="chrome-minimize"
            label="Minimize"
            onClick={() => minimize(state.viewId)}
            color="warning"
          />
          <WindowControl
            icon={state.maximized ? "collapse-all" : "expand-all"}
            label={state.maximized ? "Restore" : "Maximize"}
            onClick={() => toggleMaximize(state.viewId)}
            color="success"
          />
          <WindowControl
            icon="pin"
            label="Dock back"
            onClick={() => attach(state.viewId)}
            color="info"
          />
          <WindowControl
            icon="close"
            label="Close"
            onClick={() => attach(state.viewId)}
            color="error"
          />
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 min-h-0 overflow-hidden bg-vsc-bg">{children}</div>

      {/* ── 8-direction Resize Handles ── */}
      {!state.maximized && !isSnapped && (
        <>
          <ResizeEdge direction="n" onResizeStart={handleResizeStart} />
          <ResizeEdge direction="s" onResizeStart={handleResizeStart} />
          <ResizeEdge direction="e" onResizeStart={handleResizeStart} />
          <ResizeEdge direction="w" onResizeStart={handleResizeStart} />
          <ResizeCorner direction="ne" onResizeStart={handleResizeStart} />
          <ResizeCorner direction="nw" onResizeStart={handleResizeStart} />
          <ResizeCorner direction="se" onResizeStart={handleResizeStart} />
          <ResizeCorner direction="sw" onResizeStart={handleResizeStart} />
        </>
      )}
    </div>
  );
});

// ─── Window Control Button ───────────────────────────────

function WindowControl({
  icon,
  label,
  onClick,
  color,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  color: "error" | "warning" | "success" | "info";
}) {
  const colorMap = {
    error: "hover:bg-vsc-error/20 hover:text-vsc-error",
    warning: "hover:bg-vsc-warning/20 hover:text-vsc-warning",
    success: "hover:bg-vsc-success/20 hover:text-vsc-success",
    info: "hover:bg-vsc-info/20 hover:text-vsc-info",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded-sm",
        "cursor-pointer bg-transparent border-none",
        "text-vsc-text-ghost transition-colors duration-fast focus-ring",
        colorMap[color],
      )}
      title={label}
      aria-label={label}
    >
      <Icon name={icon} tokenSize="2xs" />
    </button>
  );
}

// ─── Resize Edge Handles ─────────────────────────────────

function ResizeEdge({
  direction,
  onResizeStart,
}: {
  direction: ResizeDirection;
  onResizeStart: (dir: ResizeDirection, e: React.MouseEvent) => void;
}) {
  const styles: Record<string, string> = {
    n: "top-0 left-2 right-2 h-1 cursor-ns-resize",
    s: "bottom-0 left-2 right-2 h-1 cursor-ns-resize",
    e: "right-0 top-2 bottom-2 w-1 cursor-ew-resize",
    w: "left-0 top-2 bottom-2 w-1 cursor-ew-resize",
  };

  return (
    <div
      className={cn(
        "absolute z-20 hover:bg-vsc-accent/10 transition-colors duration-fast",
        styles[direction],
      )}
      onMouseDown={(e) => onResizeStart(direction, e)}
    />
  );
}

function ResizeCorner({
  direction,
  onResizeStart,
}: {
  direction: ResizeDirection;
  onResizeStart: (dir: ResizeDirection, e: React.MouseEvent) => void;
}) {
  const styles: Record<string, string> = {
    ne: "top-0 right-0 w-3 h-3 cursor-ne-resize",
    nw: "top-0 left-0 w-3 h-3 cursor-nw-resize",
    se: "bottom-0 right-0 w-3 h-3 cursor-se-resize",
    sw: "bottom-0 left-0 w-3 h-3 cursor-sw-resize",
  };

  return (
    <div
      className={cn("absolute z-30", styles[direction])}
      onMouseDown={(e) => onResizeStart(direction, e)}
    />
  );
}
