import React, { Suspense, useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";

import { cn, Icon, Spinner } from "~shared/ui";

import { activeTrayViewAtom, trayMaximizedAtom, trayVisibleAtom } from "../model/shellAtoms";
import { getViewsForFrame, type ViewDefinition } from "../model/viewRegistry";

// ─── Types ──────────────────────────────────────────────

interface TrayFrameProps {
  height: number;
}

// ─── Component ──────────────────────────────────────────

/**
 * Collapsible bottom tray frame with horizontal tabs + lazy-loaded content.
 * All views stay mounted (display:none) to preserve scroll/state.
 * Double-click a tab to maximize the tray.
 */
export const TrayFrame = React.memo(function TrayFrame({ height }: TrayFrameProps) {
  const views = getViewsForFrame("tray");
  const [activeView, setActiveView] = useAtom(activeTrayViewAtom);
  const setVisible = useSetAtom(trayVisibleAtom);
  const [maximized, setMaximized] = useAtom(trayMaximizedAtom);

  const handleTabClick = useCallback(
    (id: string) => {
      if (activeView === id) {
        setMaximized((m) => !m);
      } else {
        setActiveView(id);
      }
    },
    [activeView, setActiveView, setMaximized],
  );

  return (
    <div
      role="complementary"
      aria-label="Panel"
      data-keyboard-zone="tray"
      className="flex flex-col shrink-0 overflow-hidden bg-vsc-bg"
      style={{ height: maximized ? "calc(100vh - 80px)" : height }}
    >
      {/* Tab bar + controls */}
      <div className="flex items-center h-[34px] border-t border-vsc-border/30 shrink-0 bg-vsc-surface-0">
        {/* Tabs */}
        <div
          className="flex items-center gap-0 flex-1 min-w-0 pl-2"
          role="tablist"
          aria-label="Bottom panel tabs"
        >
          {views.map((view) => (
            <ViewTab
              key={view.id}
              view={view}
              isActive={activeView === view.id}
              onClick={() => handleTabClick(view.id)}
            />
          ))}
        </div>

        {/* Panel actions */}
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
              className="absolute inset-0"
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

function ViewTab({
  view,
  isActive,
  onClick,
}: {
  view: ViewDefinition;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      id={`tab-${view.id}`}
      role="tab"
      type="button"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-[26px] text-[11px] tracking-wide uppercase relative",
        "cursor-pointer border-none transition-all duration-200 focus-ring rounded-md",
        isActive
          ? "text-vsc-fg font-semibold bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          : "text-vsc-text-tertiary bg-transparent hover:text-vsc-text-secondary hover:bg-white/50",
      )}
      title={view.shortcut ? `${view.title} (${view.shortcut})` : view.title}
    >
      <Icon name={view.icon} size={12} className={cn("shrink-0", isActive && "text-vsc-accent")} />
      <span>{view.title}</span>
    </button>
  );
}

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
