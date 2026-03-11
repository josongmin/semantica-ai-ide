import React from "react";
import { useAtomValue } from "jotai";

import { currentGitBranchAtom } from "~entities/git-history/model/atoms";
import { cn, Icon } from "~shared/ui";

import { notificationsAtom } from "../../features/notifications/model/notificationAtoms";

// ─── Status Bar (IntelliJ style footer) ─────────────────

const BAR_H = "h-[32px]";

export const ShellStatusBar = React.memo(function ShellStatusBar() {
  const currentBranch = useAtomValue(currentGitBranchAtom);
  const notifications = useAtomValue(notificationsAtom);
  const unreadCount = notifications.length;

  return (
    <footer
      role="contentinfo"
      className={cn(
        "relative z-40 flex items-center bg-vsc-surface-1 border-t border-vsc-border/20",
        "text-[13px] text-vsc-text-ghost select-none shrink-0 px-1",
        BAR_H,
      )}
    >
      {/* Left: breadcrumb path */}
      <div className="flex items-center min-w-0 flex-1">
        <StatusItem>
          <Icon name="folder" size={14} className="shrink-0 text-vsc-text-ghost" />
          <span className="text-vsc-text-secondary">semantica</span>
        </StatusItem>
        <BreadcrumbSep />
        <StatusItem>
          <span>src</span>
        </StatusItem>
        <BreadcrumbSep />
        <StatusItem>
          <span>app</span>
        </StatusItem>
        <BreadcrumbSep />
        <StatusItem>
          <Icon name="file-code" size={14} className="shrink-0 text-vsc-text-ghost" />
          <span>index.tsx</span>
        </StatusItem>
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

function BreadcrumbSep() {
  return <Icon name="chevron-right" size={12} className="text-vsc-text-ghost/40 shrink-0" />;
}

function StatusSep() {
  return <span className="w-px h-4 bg-vsc-border/20 mx-0.5 shrink-0" />;
}
