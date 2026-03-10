/**
 * Terminal Persistent Host — DOM Reparenting for xterm.js Survival
 *
 * Problem: xterm.js (stateful canvas/WebGL) is destroyed when React unmounts
 * the component. Switching between docked↔floating kills the terminal buffer.
 *
 * Solution: Render TerminalPanel into a persistent DOM node that lives outside
 * React's tree. Use `appendChild` to move this node between containers (bottom
 * panel slot ↔ floating window slot) without triggering React unmount/remount.
 *
 * This is the same pattern VS Code uses for terminal panel reparenting.
 *
 * Usage:
 *   <TerminalInPortal />   — mount once at app level (ShellLayout)
 *   <TerminalOutPortal />  — mount wherever the terminal should appear
 */

import { memo, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { TerminalPanel } from "./TerminalPanel";

// ─── Persistent Host Node ─────────────────────────────────

/**
 * A single DOM element that hosts the terminal React tree.
 * Created once at module load. Never destroyed.
 * Moved between containers via appendChild (no React unmount).
 */
const terminalHostNode = document.createElement("div");
terminalHostNode.style.cssText = "display:flex;flex-direction:column;height:100%;width:100%";

// ─── InPortal ─────────────────────────────────────────────

/**
 * Renders TerminalPanel into the persistent host node via React portal.
 * Mount this ONCE at the app shell level (ShellLayout).
 * The terminal instance stays alive regardless of where it's displayed.
 */
export const TerminalInPortal = memo(function TerminalInPortal() {
  return createPortal(<TerminalPanel />, terminalHostNode);
});

// ─── OutPortal ────────────────────────────────────────────

/**
 * Claims the persistent terminal host node into this container.
 * When mounted, the terminal DOM is moved here via appendChild.
 * When unmounted, the terminal DOM stays in the detached host node.
 *
 * Only ONE OutPortal should be visible at a time (enforced by the
 * floating↔docked mutual exclusion in ShellBottomPanel).
 *
 * ResizeObserver on the xterm container will fire automatically
 * when dimensions change due to reparenting → FitAddon.fit() runs.
 */
export const TerminalOutPortal = memo(function TerminalOutPortal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Move the persistent terminal DOM into this container
    container.appendChild(terminalHostNode);

    // On unmount, detach so the node isn't orphaned in the DOM tree.
    // The next OutPortal to mount will reclaim it via appendChild.
    return () => {
      try { terminalHostNode.parentNode?.removeChild(terminalHostNode); } catch { /* ignore */ }
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
});
