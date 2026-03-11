import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { IS_MAC } from "~shared/lib/hooks/usePlatform";
import { cn } from "~shared/ui";

import { AgentFrame } from "./frames/AgentFrame";
import { FloatingLayer } from "./frames/FloatingLayer";
import { NavBar } from "./frames/NavBar";
import { SidebarFrame } from "./frames/SidebarFrame";
import { TitleBar } from "./frames/TitleBar";
import { TrayFrame } from "./frames/TrayFrame";
import { KeyboardShortcutOverlay } from "./KeyboardShortcutOverlay";
import { activeNavCategoryAtom } from "./model/navRegistry";
import {
  activeSurfaceAtom,
  agentPanelVisibleAtom,
  agentPanelWidthAtom,
  focusModeAtom,
  navBarExpandedAtom,
  sidebarVisibleAtom,
  sidebarWidthAtom,
  toggleFocusModeAtom,
  trayHeightAtom,
  trayVisibleAtom,
  zenModeAtom,
  zoomLevelAtom,
} from "./model/shellAtoms";
import { ResizeHandle } from "./Resizable";
import { ShellStatusBar } from "./ShellStatusBar";

// ─── Constants ──────────────────────────────────────────
const NAV_RAIL_W = 48;
const NAV_EXPANDED_W = 190;

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
  const activeNavCategory = useAtomValue(activeNavCategoryAtom);
  const navExpanded = useAtomValue(navBarExpandedAtom);
  const sidebarVisible = useAtomValue(sidebarVisibleAtom);
  const agentVisible = useAtomValue(agentPanelVisibleAtom);
  const trayVisible = useAtomValue(trayVisibleAtom);
  const sidebarWidth = useAtomValue(sidebarWidthAtom);
  const agentWidth = useAtomValue(agentPanelWidthAtom);
  const trayHeight = useAtomValue(trayHeightAtom);
  const isFocusMode = useAtomValue(focusModeAtom);
  const isZenMode = useAtomValue(zenModeAtom);
  const activeSurface = useAtomValue(activeSurfaceAtom);
  const isFullscreenSurface = activeSurface === "settings";
  const zoomLevel = useAtomValue(zoomLevelAtom);
  const toggleFocus = useSetAtom(toggleFocusModeAtom);
  const setSidebarWidth = useSetAtom(sidebarWidthAtom);
  const setAgentWidth = useSetAtom(agentPanelWidthAtom);
  const setTrayHeight = useSetAtom(trayHeightAtom);

  const isIdeMode = activeNavCategory === "ide";
  const showNavBar = !isZenMode && !isFocusMode;

  const handleSidebarResize = useCallback(
    (delta: number) => {
      setSidebarWidth((prev) => Math.max(160, Math.min(400, prev + delta)));
    },
    [setSidebarWidth],
  );

  const handleAgentResize = useCallback(
    (delta: number) => {
      setAgentWidth((prev) => Math.max(300, Math.min(700, prev - delta)));
    },
    [setAgentWidth],
  );

  const handleTrayResize = useCallback(
    (delta: number) => {
      setTrayHeight((prev) => Math.max(100, Math.min(500, prev - delta)));
    },
    [setTrayHeight],
  );

  return (
    <div
      className="flex flex-col h-screen bg-vsc-bg text-vsc-fg overflow-hidden origin-top-left"
      style={zoomLevel !== 1 ? { zoom: zoomLevel } : undefined}
    >
      {/* TitleBar — highest z */}
      {!isFocusMode && <TitleBar />}

      {/* Body: NavBar | Content */}
      <div className="flex flex-1 min-h-0 min-w-0">
        {showNavBar && <NavBar width={navExpanded ? NAV_EXPANDED_W : NAV_RAIL_W} />}

        {/* Content row: Left section (Sidebar + Canvas + Tray) | Agent */}
        <div className="flex flex-1 min-h-0 min-w-0 gap-px bg-vsc-surface-1">
          {/* Left section: Sidebar + Canvas + Tray */}
          <div className="flex flex-col flex-1 min-w-0 gap-px">
            {/* Main row: Sidebar | Canvas */}
            <div className="flex flex-1 min-h-0 min-w-0 gap-px">
              {isIdeMode && sidebarVisible && !isFocusMode && !isFullscreenSurface && (
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
                  <div className={cn("w-full h-full", isZenMode && "max-w-[800px]")}>
                    {children}
                  </div>

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

            {/* Tray — spans Sidebar + Canvas only, Agent is beside it */}
            {isIdeMode && trayVisible && !isFocusMode && !isFullscreenSurface && (
              <>
                <ResizeHandle direction="vertical" onResize={handleTrayResize} />
                <TrayFrame height={trayHeight} />
              </>
            )}
          </div>

          {/* Agent Panel — full height, beside left section */}
          {agentVisible && !isFocusMode && !isFullscreenSurface && (
            <>
              <ResizeHandle direction="horizontal" onResize={handleAgentResize} />
              <div className="shrink-0 h-full" style={{ width: agentWidth }}>
                <AgentFrame width={agentWidth}>{agentContent}</AgentFrame>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Bar — full width, z-40 */}
      {!isZenMode && <ShellStatusBar />}

      {/* Global overlays */}
      <FloatingLayer />
      <KeyboardShortcutOverlay />
    </div>
  );
});
