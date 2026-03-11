import React, { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import { currentGitBranchAtom } from "~entities/git-history/model/atoms";
import { cn, Icon } from "~shared/ui";

import { notificationsAtom } from "../../features/notifications/model/notificationAtoms";
import { activeTrayViewAtom, trayVisibleAtom } from "./model/shellAtoms";
import { getViewsForFrame } from "./model/viewRegistry";

// ─── Status Bar ─────────────────────────────────────────

const BAR_H = 28;

export const ShellStatusBar = React.memo(function ShellStatusBar() {
  const currentBranch = useAtomValue(currentGitBranchAtom);
  const notifications = useAtomValue(notificationsAtom);
  const unreadCount = notifications.length;
  const trayViews = getViewsForFrame("tray");
  const [activeView, setActiveView] = useAtom(activeTrayViewAtom);
  const [trayVisible, setTrayVisible] = useAtom(trayVisibleAtom);

  const handleTrayViewClick = useCallback(
    (viewId: string) => {
      if (trayVisible && activeView === viewId) {
        setTrayVisible(false);
      } else {
        setTrayVisible(true);
        setActiveView(viewId);
      }
    },
    [trayVisible, activeView, setTrayVisible, setActiveView],
  );

  return (
    <footer
      role="contentinfo"
      className="relative z-40 flex items-center justify-between bg-vsc-surface-1 border-t border-vsc-border/20 select-none shrink-0"
      style={{ height: BAR_H }}
    >
      {/* Left: tray panel buttons */}
      <div className="flex items-center gap-px pl-1">
        {trayViews.map((view) => {
          const isActive = trayVisible && activeView === view.id;
          return (
            <TrayToggleButton
              key={view.id}
              icon={view.icon}
              label={view.title}
              isActive={isActive}
              onClick={() => handleTrayViewClick(view.id)}
            />
          );
        })}
      </div>

      {/* Right: meta info */}
      <div className="flex items-center gap-px pr-1">
        <MetaChip icon="git-branch" label={currentBranch} />
        {unreadCount > 0 && <MetaChip icon="bell-dot" label={String(unreadCount)} accent />}
      </div>
    </footer>
  );
});

// ─── Sub-components ─────────────────────────────────────

function TrayToggleButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 rounded-md border-none cursor-pointer",
        "text-[11.25px] tracking-[0.01em]",
        isActive
          ? "text-vsc-accent bg-vsc-accent/15"
          : "text-vsc-text-ghost bg-transparent hover:text-vsc-text-secondary hover:bg-vsc-surface-2/50",
      )}
      style={{ height: BAR_H - 7 }}
      title={label}
      aria-pressed={isActive}
    >
      <Icon
        name={icon}
        size={12}
        className={cn("shrink-0", isActive ? "text-vsc-accent" : "opacity-60")}
      />
      <span>{label}</span>
    </button>
  );
}

function MetaChip({ icon, label, accent }: { icon: string; label: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full cursor-default",
        accent
          ? "px-2 bg-rose-500/12 text-rose-500 hover:bg-rose-500/20"
          : "px-2 text-vsc-text-ghost hover:bg-vsc-surface-2/60",
      )}
      style={{ height: BAR_H - 6 }}
    >
      <Icon
        name={icon}
        size={13}
        className={cn("shrink-0", accent ? "text-rose-500" : "opacity-70")}
      />
      {accent && (
        <span className="min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
          {label}
        </span>
      )}
      {!accent && (
        <span className="truncate max-w-[100px] text-[11.5px] tracking-[0.01em]">{label}</span>
      )}
    </span>
  );
}
