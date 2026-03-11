import React, { Suspense } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { cn, Icon, Spinner } from "~shared/ui";

import { activeTrayViewAtom, trayMaximizedAtom, trayVisibleAtom } from "../model/shellAtoms";
import { getViewsForFrame } from "../model/viewRegistry";

// ─── Types ──────────────────────────────────────────────

interface TrayFrameProps {
  height: number;
}

// ─── Component ──────────────────────────────────────────

/**
 * Collapsible bottom tray frame with lazy-loaded content.
 * Tab switching is handled by ShellStatusBar; this frame only shows content + actions.
 * All views stay mounted (display:none) to preserve scroll/state.
 */
export const TrayFrame = React.memo(function TrayFrame({ height }: TrayFrameProps) {
  const views = getViewsForFrame("tray");
  const activeView = useAtomValue(activeTrayViewAtom);
  const setVisible = useSetAtom(trayVisibleAtom);
  const [maximized, setMaximized] = useAtom(trayMaximizedAtom);

  return (
    <div
      role="complementary"
      aria-label="Panel"
      data-keyboard-zone="tray"
      className="flex flex-col shrink-0 overflow-hidden bg-vsc-bg"
      style={{ height: maximized ? "calc(100vh - 80px)" : height }}
    >
      {/* Toolbar — actions only (tabs live in StatusBar) */}
      <div className="flex items-center justify-end h-[28px] shrink-0 bg-vsc-surface-0 border-b border-vsc-border/10">
        <div className="flex items-center gap-0.5 pr-2 shrink-0">
          <PanelAction
            icon={maximized ? "collapse-all" : "expand-all"}
            label={maximized ? "Restore Panel" : "Maximize Panel"}
            onClick={() => setMaximized((m) => !m)}
          />
          <PanelAction icon="close" label="Close Panel" onClick={() => setVisible(false)} />
        </div>
      </div>

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

// ─── Sub-components ─────────────────────────────────────

function PanelAction({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center w-[22px] h-[22px] rounded-md",
        "cursor-pointer bg-transparent border-none transition-all duration-200 focus-ring",
        "text-vsc-text-ghost hover:text-vsc-text-primary hover:bg-white/60",
      )}
      title={label}
      aria-label={label}
    >
      <Icon name={icon} size={12} />
    </button>
  );
}
