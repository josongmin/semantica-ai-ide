import React, { Suspense, useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";

import { cn, Icon, Spinner } from "~shared/ui";

import { detachToFloatingAtom } from "../model/floatingAtoms";
import { activeSidebarViewAtom, activeTrayViewAtom, trayVisibleAtom } from "../model/shellAtoms";
import { getViewsForFrame } from "../model/viewRegistry";

// ─── Types ──────────────────────────────────────────────

interface SidebarFrameProps {
  width: number;
}

// ─── Component ──────────────────────────────────────────

/**
 * IntelliJ-style sidebar with vertical icon strip (top/bottom groups) + content area.
 *
 * Top group: dock-left views (Explorer, Search, Symbols, Findings)
 * Bottom group: tray views (Problems, Output, Terminal, Event Log) + Settings
 */
export const SidebarFrame = React.memo(function SidebarFrame({ width }: SidebarFrameProps) {
  const sidebarViews = getViewsForFrame("dock-left");
  const trayViews = getViewsForFrame("tray");
  const [activeView, setActiveView] = useAtom(activeSidebarViewAtom);
  const [activeTrayView, setActiveTrayView] = useAtom(activeTrayViewAtom);
  const [trayVisible, setTrayVisible] = useAtom(trayVisibleAtom);
  const detachToFloating = useSetAtom(detachToFloatingAtom);

  const active = sidebarViews.find((v) => v.id === activeView);
  const ViewComponent = active?.component;

  const handleTrayViewClick = useCallback(
    (viewId: string) => {
      if (viewId === "terminal") {
        detachToFloating("terminal");
        return;
      }
      if (activeTrayView === viewId && trayVisible) {
        setTrayVisible(false);
      } else {
        setActiveTrayView(viewId);
        setTrayVisible(true);
      }
    },
    [activeTrayView, trayVisible, setActiveTrayView, setTrayVisible, detachToFloating],
  );

  return (
    <aside
      role="complementary"
      aria-label="Sidebar"
      data-keyboard-zone="sidebar"
      className="flex h-full shrink-0 border-r border-vsc-border/30 overflow-hidden"
      style={{ width }}
    >
      {/* Icon strip — IntelliJ-style top/bottom groups */}
      <div className="flex flex-col items-center w-10 shrink-0 bg-vsc-surface-1 border-r border-vsc-border/20 py-1.5">
        {/* ── Top group: Sidebar views ── */}
        <div className="flex flex-col items-center gap-0.5">
          {sidebarViews.map((view) => (
            <IconStripButton
              key={view.id}
              icon={view.icon}
              label={view.title}
              isActive={activeView === view.id}
              onClick={() => setActiveView(view.id)}
            />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Bottom group: Tray views (Problems, Output, Terminal, Event Log) ── */}
        <div className="flex flex-col items-center gap-0.5">
          {trayViews.map((view) => (
            <IconStripButton
              key={view.id}
              icon={view.icon}
              label={view.title}
              isActive={trayVisible && activeTrayView === view.id}
              onClick={() => handleTrayViewClick(view.id)}
            />
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0 bg-vsc-bg">
        {/* View content */}
        <div className="flex-1 min-h-0 overflow-hidden scroll-shadow">
          {ViewComponent ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Spinner size="sm" />
                </div>
              }
            >
              <ViewComponent />
            </Suspense>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1 text-vsc-text-tertiary">
              <Icon name={active?.icon ?? "files"} size={20} className="opacity-40" />
              <span className="text-xs">{active?.title ?? "Explorer"}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
});

// ─── Icon Strip Button ──────────────────────────────────

interface IconStripButtonProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const IconStripButton = React.memo(function IconStripButton({
  icon,
  label,
  isActive,
  onClick,
}: IconStripButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg",
        "cursor-pointer border-none transition-all duration-fast focus-ring",
        isActive
          ? "bg-vsc-accent/15 text-vsc-accent"
          : "bg-transparent text-vsc-text-secondary hover:text-vsc-fg hover:bg-vsc-surface-3/40",
      )}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
    >
      <Icon name={icon} size={18} />
    </button>
  );
});
