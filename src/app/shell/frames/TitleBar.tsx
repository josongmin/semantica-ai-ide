import React from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  Bell,
  Bug,
  ChevronDown,
  GitBranch,
  type LucideIcon,
  PanelLeft,
  Play,
  Search,
  Settings,
} from "lucide-react";

import { currentGitBranchAtom } from "~entities/git-history/model/atoms";
import {
  HAS_TRAFFIC_LIGHTS,
  startTauriDrag,
  toggleTauriMaximize,
} from "~shared/lib/hooks/usePlatform";
import { cn } from "~shared/ui";

import { conversationSearchOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import { Separator } from "../components/TopBarPrimitives";
import { navBarExpandedAtom } from "../model/shellAtoms";

// ─── TitleBar Component ─────────────────────────────────

export const TitleBar = React.memo(function TitleBar() {
  const currentBranch = useAtomValue(currentGitBranchAtom);
  const [navExpanded, setNavExpanded] = useAtom(navBarExpandedAtom);
  const setSearchOpen = useSetAtom(conversationSearchOpenAtom);

  return (
    <header
      role="banner"
      className="relative flex items-center h-11 bg-vsc-surface-1 border-b border-vsc-border/20 shrink-0 select-none"
      onMouseDown={startTauriDrag}
      onDoubleClick={toggleTauriMaximize}
    >
      {/* Left: traffic lights + toggle + workspace + branch + run/debug */}
      <div
        className="flex items-center h-full shrink-0 gap-1"
        style={{ paddingLeft: HAS_TRAFFIC_LIGHTS ? 78 : 12 }}
      >
        {/* NavBar expand/collapse */}
        <GnbIconButton
          Icon={PanelLeft}
          label={navExpanded ? "Collapse menu" : "Expand menu"}
          isActive={navExpanded}
          onClick={() => setNavExpanded((v) => !v)}
        />

        <Separator />

        {/* Workspace name */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2 h-7 rounded-md text-[12px] font-medium
                     text-vsc-fg hover:bg-vsc-surface-3/30
                     cursor-pointer border-none focus-ring transition-colors duration-150"
        >
          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-vsc-accent/15 text-vsc-accent text-[10px] font-bold shrink-0">
            S
          </span>
          <span className="truncate max-w-[140px]">semantica</span>
          <ChevronDown size={12} className="text-vsc-text-ghost shrink-0" />
        </button>

        {/* Git branch */}
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[12px]
                     text-vsc-text-secondary hover:text-vsc-fg hover:bg-vsc-surface-3/30
                     cursor-pointer border-none focus-ring transition-colors duration-150"
        >
          <GitBranch size={14} className="shrink-0 text-vsc-text-primary" />
          <span className="truncate max-w-[120px]">{currentBranch}</span>
          <ChevronDown size={12} className="text-vsc-text-ghost shrink-0" />
        </button>

        <Separator />

        {/* Run */}
        <GnbIconButton Icon={Play} label="Run" />

        {/* Debug */}
        <GnbIconButton Icon={Bug} label="Debug" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: search + alarm + settings + avatar */}
      <div className="flex items-center gap-1 px-3 shrink-0">
        {/* Integrated search bar */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md",
            "cursor-pointer bg-vsc-surface-2/40 border border-vsc-border/15",
            "text-[12px] text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/60",
            "transition-colors duration-fast focus-ring min-w-[180px]",
          )}
          title="Search (⌘K)"
        >
          <Search size={15} className="shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] text-vsc-text-ghost/50 font-mono shrink-0">⌘K</kbd>
        </button>

        <Separator />

        {/* Alarm / Notifications */}
        <GnbIconButton Icon={Bell} label="Notifications" />

        {/* Settings */}
        <GnbIconButton Icon={Settings} label="Settings" />

        {/* User avatar */}
        <button
          type="button"
          className="flex items-center justify-center w-6 h-6 rounded-full shrink-0
                     bg-vsc-accent/15 text-vsc-accent text-[10px] font-bold
                     cursor-pointer border-none focus-ring transition-colors duration-150
                     hover:bg-vsc-accent/25"
          title="Account"
          aria-label="Account"
        >
          U
        </button>
      </div>
    </header>
  );
});

// ─── GNB Icon Button (Lucide) ────────────────────────────

function GnbIconButton({
  Icon,
  label,
  isActive,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-md shrink-0",
        "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
        isActive
          ? "text-vsc-accent"
          : "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-surface-3/30",
      )}
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  );
}
