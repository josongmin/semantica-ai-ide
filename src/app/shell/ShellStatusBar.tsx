import React from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { currentGitBranchAtom } from "~entities/git-history/model/atoms";
import { cn, Icon } from "~shared/ui";

import { notificationsAtom } from "../../features/notifications/model/notificationAtoms";
import {
  activeSurfaceAtom,
  applyLayoutPresetAtom,
  focusModeAtom,
  type LayoutPreset,
  splitDirectionAtom,
  toggleFocusModeAtom,
  toggleSplitAtom,
} from "./model/shellAtoms";

// ─── Layout Preset Definitions ──────────────────────────

const PRESETS: { id: LayoutPreset; label: string; icon: string }[] = [
  { id: "coding", label: "Coding", icon: "code" },
  { id: "review", label: "Review", icon: "git-pull-request" },
  { id: "debug", label: "Debug", icon: "debug-alt" },
  { id: "agent-only", label: "Agent", icon: "hubot" },
  { id: "presentation", label: "Present", icon: "screen-full" },
];

// ─── Status Bar ─────────────────────────────────────────

export const ShellStatusBar = React.memo(function ShellStatusBar() {
  const surface = useAtomValue(activeSurfaceAtom);
  const isFocusMode = useAtomValue(focusModeAtom);
  const splitDir = useAtomValue(splitDirectionAtom);
  const toggleFocus = useSetAtom(toggleFocusModeAtom);
  const toggleSplit = useSetAtom(toggleSplitAtom);
  const applyPreset = useSetAtom(applyLayoutPresetAtom);
  const currentBranch = useAtomValue(currentGitBranchAtom);
  const notifications = useAtomValue(notificationsAtom);
  const unreadCount = notifications.length;

  return (
    <footer
      role="contentinfo"
      className="flex items-center h-[--height-row-sm] bg-vsc-accent/8 border-t border-vsc-border/20
                 text-2xs text-vsc-text-ghost select-none shrink-0 px-2 gap-3"
    >
      {/* Left: Surface indicator + git branch */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Active surface */}
        <span className="inline-flex items-center gap-1 text-vsc-accent font-medium">
          <Icon name="circle-filled" tokenSize="2xs" />
          {surface}
        </span>

        {/* Git branch — derived from latest commit */}
        <span className="inline-flex items-center gap-1">
          <Icon name="git-branch" tokenSize="2xs" />
          <span className="truncate max-w-[120px]" title={currentBranch}>
            {currentBranch}
          </span>
        </span>

        {/* Focus mode indicator */}
        {isFocusMode && (
          <button
            type="button"
            onClick={() => toggleFocus()}
            className="inline-flex items-center gap-1 px-1.5 rounded-sm
                       bg-vsc-accent/15 text-vsc-accent cursor-pointer
                       hover:bg-vsc-accent/25 transition-colors duration-fast"
          >
            <Icon name="eye-closed" tokenSize="2xs" />
            Focus
          </button>
        )}
      </div>

      {/* Center: Layout presets */}
      <div className="flex items-center gap-px">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className={cn(
              "inline-flex items-center justify-center w-5 h-[--height-row-xs] rounded-sm",
              "cursor-pointer bg-transparent border-none transition-colors duration-fast",
              "hover:text-vsc-fg hover:bg-vsc-surface-2/50",
            )}
            title={`${preset.label} layout`}
            aria-label={`${preset.label} layout`}
          >
            <Icon name={preset.icon} tokenSize="2xs" />
          </button>
        ))}
      </div>

      {/* Right: Split controls + resource hints */}
      <div className="flex items-center gap-2 justify-end">
        {/* Split view controls */}
        <div className="flex items-center gap-px">
          <button
            type="button"
            onClick={() => toggleSplit("vertical")}
            className={cn(
              "inline-flex items-center justify-center w-5 h-[--height-row-xs] rounded-sm cursor-pointer transition-colors duration-fast",
              splitDir === "vertical"
                ? "text-vsc-accent bg-vsc-accent/15"
                : "hover:text-vsc-fg hover:bg-vsc-surface-2/50",
            )}
            title="Split Vertical (⌘K \)"
            aria-label="Split vertical"
          >
            <Icon name="split-horizontal" tokenSize="2xs" />
          </button>
          <button
            type="button"
            onClick={() => toggleSplit("horizontal")}
            className={cn(
              "inline-flex items-center justify-center w-5 h-[--height-row-xs] rounded-sm cursor-pointer transition-colors duration-fast",
              splitDir === "horizontal"
                ? "text-vsc-accent bg-vsc-accent/15"
                : "hover:text-vsc-fg hover:bg-vsc-surface-2/50",
            )}
            title="Split Horizontal (⌘K -)"
            aria-label="Split horizontal"
          >
            <Icon name="split-vertical" tokenSize="2xs" />
          </button>
        </div>

        {/* Notifications — wired to notificationsAtom */}
        <span
          className={cn("inline-flex items-center gap-1", unreadCount > 0 && "text-vsc-accent")}
        >
          <Icon name="bell" tokenSize="2xs" />
          <span className="tabular-nums">{unreadCount}</span>
        </span>

        {/* Keyboard shortcut hint */}
        <span className="text-vsc-text-ghost/60 font-mono">? help</span>

        {/* Zen shortcut hint */}
        <button
          type="button"
          onClick={() => toggleFocus()}
          className="hover:text-vsc-fg cursor-pointer transition-colors duration-fast"
          title="Focus Mode (⌘\)"
          aria-label="Toggle focus mode"
        >
          <Icon name={isFocusMode ? "eye-closed" : "eye"} tokenSize="2xs" />
        </button>
      </div>
    </footer>
  );
});
