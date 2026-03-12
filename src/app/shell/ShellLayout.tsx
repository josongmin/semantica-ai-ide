import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { IS_MAC } from "~shared/lib/hooks/usePlatform";
import { cn } from "~shared/ui";

import { AgentFrame } from "./frames/AgentFrame";
import { FloatingLayer } from "./frames/FloatingLayer";
import { SidebarFrame } from "./frames/SidebarFrame";
import { TitleBar } from "./frames/TitleBar";
import { TrayFrame } from "./frames/TrayFrame";
import { KeyboardShortcutOverlay } from "./KeyboardShortcutOverlay";
import {
  agentPanelWidthAtom,
  effectiveAgentVisibleAtom,
  effectiveSidebarVisibleAtom,
  effectiveTrayVisibleAtom,
  focusModeAtom,
  sidebarWidthAtom,
  toggleFocusModeAtom,
  trayHeightAtom,
  zenModeAtom,
  zoomLevelAtom,
} from "./model/shellAtoms";
import { ResizeHandle } from "./Resizable";
import { ShellStatusBar } from "./ShellStatusBar";

// ─── Hooks ──────────────────────────────────────────────

/**
 * Creates a clamped resize handler for drag-resize interactions.
 * @param min   — minimum allowed size (px)
 * @param max   — maximum allowed size (px)
 * @param setter — Jotai setter for the size atom
 * @param invert — when true, subtracts delta (used when dragging toward the panel shrinks it)
 */
function useResizeHandler(
  min: number,
  max: number,
  setter: (fn: (prev: number) => number) => void,
  invert = false,
) {
  return useCallback(
    (delta: number) => {
      const d = invert ? -delta : delta;
      setter((prev) => Math.max(min, Math.min(max, prev + d)));
    },
    [min, max, setter, invert],
  );
}

// ─── Types ──────────────────────────────────────────────

interface ShellLayoutProps {
  children: React.ReactNode;
  agentContent?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────

/**
 * AI-Native Shell (RFC-017):
 *
 * +--[Nav]--+--[Sidebar]--+--[Canvas]--+--[Agent]--+
 * | Icons   | File Tree   | Surfaces   | Chat      |
 * | 48px    | resizable   |            | resizable |
 * |         +-------------+------------+ (full h)  |
 * |         |         Tray             |           |
 * +---------+--------------------------+-----------+
 * |              Status Bar                         |
 * +-------------------------------------------------+
 */
export const ShellLayout = React.memo(function ShellLayout({
  children,
  agentContent,
}: ShellLayoutProps) {
  const sidebarVisible = useAtomValue(effectiveSidebarVisibleAtom);
  const agentVisible = useAtomValue(effectiveAgentVisibleAtom);
  const trayVisible = useAtomValue(effectiveTrayVisibleAtom);
  const sidebarWidth = useAtomValue(sidebarWidthAtom);
  const agentWidth = useAtomValue(agentPanelWidthAtom);
  const trayHeight = useAtomValue(trayHeightAtom);
  const isFocusMode = useAtomValue(focusModeAtom);
  const isZenMode = useAtomValue(zenModeAtom);
  const zoomLevel = useAtomValue(zoomLevelAtom);
  const toggleFocus = useSetAtom(toggleFocusModeAtom);
  const setSidebarWidth = useSetAtom(sidebarWidthAtom);
  const setAgentWidth = useSetAtom(agentPanelWidthAtom);
  const setTrayHeight = useSetAtom(trayHeightAtom);

  const handleSidebarResize = useResizeHandler(160, 400, setSidebarWidth);
  const handleAgentResize = useResizeHandler(300, 700, setAgentWidth, true);
  const handleTrayResize = useResizeHandler(100, 500, setTrayHeight, true);

  return (
    <div
      className="flex flex-col h-screen bg-vsc-bg text-vsc-fg overflow-hidden origin-top-left"
      style={zoomLevel !== 1 ? { zoom: zoomLevel } : undefined}
    >
      {/* TitleBar — highest z */}
      {!isFocusMode && <TitleBar />}

      {/* Body: Content */}
      <div className="flex flex-1 min-h-0 min-w-0">
        {/* Left section: Sidebar + Canvas + Tray */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Main row: Sidebar | Canvas */}
          <div className="flex flex-1 min-h-0 min-w-0">
            {sidebarVisible && !isFocusMode && (
              <>
                <div className="shrink-0 h-full" style={{ width: sidebarWidth }}>
                  <SidebarFrame width={sidebarWidth} />
                </div>
                <ResizeHandle direction="horizontal" onResize={handleSidebarResize} />
              </>
            )}

            {/* Canvas */}
            <div
              role="main"
              data-keyboard-zone="canvas"
              className="flex flex-col flex-1 min-w-0 overflow-hidden bg-vsc-bg"
            >
              <div
                className={cn(
                  "flex-1 min-h-0 overflow-hidden relative",
                  isZenMode && "flex justify-center",
                )}
              >
                <div className={cn("w-full h-full", isZenMode && "max-w-[800px]")}>{children}</div>

                {isFocusMode && (
                  <button
                    type="button"
                    onClick={() => toggleFocus()}
                    aria-label={isZenMode ? "Exit zen mode" : "Exit focus mode"}
                    className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md text-2xs
                               glass-panel text-vsc-text-ghost
                               hover:text-vsc-fg
                               opacity-0 hover:opacity-100 focus:opacity-100
                               transition-opacity duration-slow cursor-pointer"
                  >
                    {isZenMode
                      ? `Exit Zen Mode (${IS_MAC ? "⌘" : "Ctrl+"}K Z)`
                      : `Exit Focus Mode (${IS_MAC ? "⌘" : "Ctrl+"}\\)`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tray — spans Sidebar + Canvas width, Agent is beside it */}
          {trayVisible && !isFocusMode && (
            <>
              <ResizeHandle direction="vertical" onResize={handleTrayResize} />
              <TrayFrame height={trayHeight} />
            </>
          )}
        </div>

        {/* Agent Panel — full height, beside left section */}
        {agentVisible && !isFocusMode && (
          <>
            <ResizeHandle direction="horizontal" onResize={handleAgentResize} />
            <div className="shrink-0 h-full" style={{ width: agentWidth }}>
              <AgentFrame width={agentWidth}>{agentContent}</AgentFrame>
            </div>
          </>
        )}
      </div>

      {/* Status Bar — full width, z-40 */}
      {!isZenMode && <ShellStatusBar />}

      {/* Global overlays */}
      <FloatingLayer />
      <KeyboardShortcutOverlay />
    </div>
  );
});
