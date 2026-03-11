import React, { Suspense } from "react";
import { useAtom, useAtomValue } from "jotai";

import { Spinner } from "~shared/ui";

import { activeTrayViewAtom, trayMaximizedAtom } from "../model/shellAtoms";
import { getViewsForFrame } from "../model/viewRegistry";

// ─── Types ──────────────────────────────────────────────

interface TrayFrameProps {
  height: number;
}

// ─── Component ──────────────────────────────────────────

/**
 * Collapsible bottom tray frame with lazy-loaded content.
 * Tab switching is handled by ShellStatusBar; this frame only shows content.
 * All views stay mounted (display:none) to preserve scroll/state.
 */
export const TrayFrame = React.memo(function TrayFrame({ height }: TrayFrameProps) {
  const views = getViewsForFrame("tray");
  const activeView = useAtomValue(activeTrayViewAtom);
  const [maximized] = useAtom(trayMaximizedAtom);

  return (
    <div
      role="complementary"
      aria-label="Panel"
      data-keyboard-zone="tray"
      className="flex flex-col shrink-0 overflow-hidden bg-vsc-bg"
      style={{ height: maximized ? "calc(100vh - 80px)" : height }}
    >
      {/* View content — all views mounted, only active visible */}
      <div className="flex-1 min-h-0 relative bg-vsc-bg">
        {views.map((view) => {
          const isActive = activeView === view.id;
          const Comp = view.component;
          return (
            <div
              key={view.id}
              role="tabpanel"
              aria-labelledby={`tab-${view.id}`}
              className="absolute inset-0 flex-col"
              style={{ display: isActive ? "flex" : "none" }}
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full w-full">
                    <Spinner size="sm" />
                  </div>
                }
              >
                <Comp />
              </Suspense>
            </div>
          );
        })}
      </div>
    </div>
  );
});
