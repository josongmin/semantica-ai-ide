import React from "react";
import { useAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import { activeSidebarViewAtom, activeTrayViewAtom } from "./model/shellAtoms";
import { type FrameSlot, getViewsForFrame } from "./model/viewRegistry";

// ─── Types ──────────────────────────────────────────────

type PanelZone = "sidebar" | "bottom";

interface ZonePanelTabsProps {
  zone: PanelZone;
  className?: string;
}

// ─── Zone → Frame Mapping ───────────────────────────────

const frameForZone: Record<PanelZone, FrameSlot> = {
  sidebar: "dock-left",
  bottom: "tray",
};

// ─── Atom Lookup ────────────────────────────────────────

const atomForZone = {
  sidebar: activeSidebarViewAtom,
  bottom: activeTrayViewAtom,
} as const;

// ─── Component ──────────────────────────────────────────

/**
 * Horizontal tab bar for switching views within a frame.
 * Used internally by SidebarFrame and TrayFrame.
 */
export const ZonePanelTabs = React.memo(function ZonePanelTabs({
  zone,
  className,
}: ZonePanelTabsProps) {
  const views = getViewsForFrame(frameForZone[zone]);
  const [active, setActive] = useAtom(atomForZone[zone]);

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 px-1 h-[--height-row-md] border-b border-vsc-border shrink-0",
        className,
      )}
      role="tablist"
      aria-label={`${zone} panel tabs`}
    >
      {views.map((view) => (
        <button
          key={view.id}
          role="tab"
          type="button"
          aria-selected={active === view.id}
          tabIndex={active === view.id ? 0 : -1}
          onClick={() => setActive(view.id)}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 text-2xs uppercase tracking-wider rounded-sm",
            "cursor-pointer border-none transition-colors duration-fast focus-ring",
            active === view.id
              ? "text-vsc-accent font-semibold"
              : "bg-transparent text-vsc-text-tertiary hover:text-vsc-text-secondary",
          )}
          style={
            active === view.id
              ? { background: "color-mix(in srgb, var(--color-gnb-via) 35%, transparent)" }
              : undefined
          }
        >
          <Icon name={view.icon} tokenSize="2xs" className="shrink-0" />
          <span>{view.title}</span>
        </button>
      ))}
    </div>
  );
});
