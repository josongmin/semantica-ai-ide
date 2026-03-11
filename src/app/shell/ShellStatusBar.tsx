import React, { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import { currentGitBranchAtom } from "~entities/git-history/model/atoms";
import { cn, Icon } from "~shared/ui";

import { notificationsAtom } from "../../features/notifications/model/notificationAtoms";
import { activeTrayViewAtom, trayVisibleAtom } from "./model/shellAtoms";
import { getViewsForFrame } from "./model/viewRegistry";

// ─── Status Bar (IntelliJ style footer) ─────────────────

const BAR_H = "h-[32px]";

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
      className={cn(
        "relative z-40 flex items-center bg-vsc-surface-1 border-t border-vsc-border/20",
        "text-[13px] text-vsc-text-ghost select-none shrink-0 px-1",
        BAR_H,
      )}
    >
      {/* Left: tray view toggle buttons */}
      <div className="flex items-center min-w-0 flex-1">
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

      {/* Right: git + notifications */}
      <div className="flex items-center">
        {/* Git branch */}
        <StatusItem>
          <Icon name="git-branch" size={14} className="shrink-0" />
          <span className="truncate max-w-[120px]">{currentBranch}</span>
        </StatusItem>

        {/* Notifications badge */}
        {unreadCount > 0 && (
          <>
            <StatusSep />
            <StatusItem highlight>
              <Icon name="bell-dot" size={14} />
              <span className="tabular-nums">{unreadCount}</span>
            </StatusItem>
          </>
        )}
      </div>
    </footer>
  );
});

// ─── Primitives ─────────────────────────────────────────

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
        "inline-flex items-center gap-1.5 px-2.5",
        BAR_H,
        "leading-none border-none cursor-pointer transition-colors duration-100",
        isActive
          ? "text-vsc-accent bg-white/10"
          : "text-vsc-text-ghost bg-transparent hover:text-vsc-text-secondary hover:bg-white/8",
      )}
      title={label}
      aria-pressed={isActive}
    >
      <Icon name={icon} size={14} className="shrink-0" />
      <span className="text-[12px]">{label}</span>
    </button>
  );
}

function StatusItem({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2",
        BAR_H,
        "leading-none",
        "hover:bg-white/8 cursor-default transition-colors duration-100",
        highlight && "text-vsc-accent",
      )}
    >
      {children}
    </span>
  );
}

function StatusSep() {
  return <span className="w-px h-4 bg-vsc-border/20 mx-0.5 shrink-0" />;
}
