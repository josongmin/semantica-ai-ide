/**
 * TerminalSessionTabs — IntelliJ-style horizontal tab bar with tab groups
 *
 * Each tab represents a group of 1–2 sessions (single or split).
 * Tab click switches to that group's sessions.
 * Split creates a new session within the current tab.
 *
 * Layout: [Terminal] | [Tab1 ×] [Tab2 ×] [+] [∨]  ···  [⫞] [⋯] [—]
 */

import { memo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { removeTerminalSessionAtom, terminalSessionListAtom } from "../model/atoms";
import {
  activeTabIndexAtom,
  closeTabAtom,
  isSplitModeAtom,
  selectTabAtom,
  tabGroupsAtom,
  unsplitTabAtom,
} from "../model/splitPaneAtoms";

// ─── Tab Item ──────────────────────────────────────────────

interface TabItemProps {
  label: string;
  isSplit: boolean;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

const TabItem = memo(function TabItem({
  label,
  isSplit,
  isActive,
  onSelect,
  onClose,
}: TabItemProps) {
  return (
    <div
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      className={cn(
        "group relative flex items-center h-full cursor-pointer shrink-0",
        "transition-colors duration-fast select-none",
        isActive
          ? "text-vsc-text-primary"
          : "text-vsc-text-tertiary hover:text-vsc-text-secondary hover:bg-vsc-surface-1/40",
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      <div className="flex items-center gap-1 px-2.5">
        <span className="text-2xs whitespace-nowrap leading-none">{label}</span>

        {/* Split badge */}
        {isSplit && (
          <span className="flex items-center justify-center w-3 h-3 rounded-sm bg-vsc-accent/15 text-vsc-accent">
            <Icon name="split-horizontal" size={8} />
          </span>
        )}

        {/* Close — always rendered for stable layout */}
        <button
          type="button"
          className={cn(
            "flex items-center justify-center w-3.5 h-3.5 rounded-sm -mr-0.5",
            "hover:bg-vsc-surface-2 hover:text-vsc-text-primary",
            "transition-all duration-fast",
            isActive ? "text-vsc-text-ghost" : "text-transparent group-hover:text-vsc-text-ghost",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          tabIndex={-1}
          title="Close"
          aria-label="Close tab"
        >
          <Icon name="close" size={9} />
        </button>
      </div>

      {/* Active underline */}
      {isActive && <div className="absolute bottom-0 inset-x-0 h-[2px] bg-vsc-accent" />}
    </div>
  );
});

// ─── Icon Button ────────────────────────────────────────────

function IconBtn({
  icon,
  title,
  onClick,
  active,
  size = 13,
}: {
  icon: string;
  title: string;
  onClick?: () => void;
  active?: boolean;
  size?: number;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded shrink-0",
        "transition-colors duration-fast",
        active
          ? "text-vsc-accent bg-vsc-accent/10 hover:bg-vsc-accent/20"
          : "text-vsc-text-tertiary hover:text-vsc-text-primary hover:bg-vsc-surface-2/60",
      )}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

// ─── Tab Bar ───────────────────────────────────────────────

export interface TerminalSessionTabsProps {
  onCreateSession?: () => void;
  onSplitSession?: () => void;
  className?: string;
}

export const TerminalSessionTabs = memo(function TerminalSessionTabs({
  onCreateSession,
  onSplitSession,
  className,
}: TerminalSessionTabsProps) {
  const sessions = useAtomValue(terminalSessionListAtom);
  const tabGroups = useAtomValue(tabGroupsAtom);
  const activeTabIdx = useAtomValue(activeTabIndexAtom);
  const selectTab = useSetAtom(selectTabAtom);
  const closeTab = useSetAtom(closeTabAtom);
  const unsplitTab = useSetAtom(unsplitTabAtom);
  const removeSession = useSetAtom(removeTerminalSessionAtom);
  const isSplitMode = useAtomValue(isSplitModeAtom);

  // Build a session lookup for labels
  const sessionMap = new Map(sessions.map((s) => [s.sessionId, s]));

  const handleSelectTab = useCallback((index: number) => selectTab(index), [selectTab]);

  const handleCloseTab = useCallback(
    (index: number) => {
      const group = tabGroups[index];
      if (!group) return;
      // Remove all sessions in the group, then close the tab
      for (const sid of group) {
        removeSession(sid);
      }
      closeTab(index);
    },
    [tabGroups, removeSession, closeTab],
  );

  const handleSplitToggle = useCallback(() => {
    if (isSplitMode) {
      // Unsplit: collapse to single pane, remove the extra session
      unsplitTab();
    } else {
      // Split: create new session in current tab
      onSplitSession?.();
    }
  }, [isSplitMode, unsplitTab, onSplitSession]);

  // Generate tab labels from first session in each group
  const tabLabels: string[] = [];
  const shellCounts = new Map<string, number>();
  for (const group of tabGroups) {
    const firstId = group[0];
    if (!firstId) continue;
    const primarySession = sessionMap.get(firstId);
    const shell = primarySession?.shellType ?? "Local";
    const name = shell !== "unknown" ? shell : "Local";
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    const count = shellCounts.get(shell) ?? 0;
    shellCounts.set(shell, count + 1);
    tabLabels.push(count === 0 ? label : `${label} (${count + 1})`);
  }

  return (
    <div
      className={cn(
        "flex items-stretch h-[30px] bg-vsc-surface-0 border-b border-vsc-border/20 shrink-0",
        className,
      )}
      role="tablist"
      aria-orientation="horizontal"
      aria-label="Terminal sessions"
    >
      {/* Tabs — one per tab group */}
      <div className="flex items-stretch overflow-x-auto scrollbar-none min-w-0 pl-1">
        {tabGroups.map((group, idx) => (
          <TabItem
            key={group[0]}
            label={tabLabels[idx] ?? "Shell"}
            isSplit={group.length > 1}
            isActive={idx === activeTabIdx}
            onSelect={() => handleSelectTab(idx)}
            onClose={() => handleCloseTab(idx)}
          />
        ))}
      </div>

      {/* + and ∨ */}
      <div className="flex items-center gap-px px-0.5 shrink-0">
        {onCreateSession && <IconBtn icon="add" title="New terminal" onClick={onCreateSession} />}
        <IconBtn icon="chevron-down" title="Terminal list" size={10} />
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-px pr-1.5 shrink-0">
        {tabGroups.length > 0 && (
          <IconBtn
            icon="split-horizontal"
            title={isSplitMode ? "Close split" : "Split terminal"}
            onClick={handleSplitToggle}
            active={isSplitMode}
          />
        )}
        <IconBtn icon="ellipsis" title="More actions" />
        <IconBtn icon="chrome-minimize" title="Minimize" />
      </div>
    </div>
  );
});
