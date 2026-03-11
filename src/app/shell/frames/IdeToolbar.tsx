import React from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import { currentPageAtom, newTabAtom } from "../../../shared/lib";
import { Separator } from "../components/TopBarPrimitives";
import { activeSurfaceAtom } from "../model/shellAtoms";

import { editorTabsAtom } from "~domains/editor/editorAtoms";

// ─── Tab Definitions ─────────────────────────────────────

const IDE_MODE_TABS = [
  { id: "ide" as const, label: "IDE", icon: "code" },
  { id: "workbooks" as const, label: "Workbooks", icon: "book" },
] as const;

// ─── IDE Toolbar ─────────────────────────────────────────

/**
 * Local toolbar shown above the canvas in IDE mode.
 * Contains: IDE|Workbooks tabs + VC toolbar + History/New Chat.
 */
export const IdeToolbar = React.memo(function IdeToolbar() {
  const setActiveSurface = useSetAtom(activeSurfaceAtom);
  const editorTabs = useAtomValue(editorTabsAtom);
  const editedFilesCount = editorTabs.filter((t) => t.isDirty).length;
  const setCurrentPage = useSetAtom(currentPageAtom);
  const newTab = useSetAtom(newTabAtom);

  return (
    <div className="flex items-center h-9 bg-vsc-bg border-b border-vsc-border/15 shrink-0 px-3 gap-2 select-none">
      {/* IDE | Workbooks tabs */}
      <nav role="tablist" aria-label="IDE modes" className="flex items-center">
        {IDE_MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={tab.id === "ide"}
            className={cn(
              "px-2.5 h-9 text-[13px] font-medium relative",
              "cursor-pointer border-none shrink-0 focus-ring transition-colors duration-150",
              tab.id === "ide"
                ? "text-vsc-fg"
                : "text-vsc-text-ghost hover:text-vsc-text-secondary",
            )}
          >
            {tab.label}
            {tab.id === "ide" && (
              <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-vsc-accent rounded-t-full" />
            )}
          </button>
        ))}
      </nav>

      <Separator />

      {/* Exit development mode */}
      <button
        type="button"
        onClick={() => setActiveSurface("chat")}
        className="inline-flex items-center gap-1 text-[11px] text-vsc-text-tertiary hover:text-vsc-fg
                   cursor-pointer border-none focus-ring transition-colors duration-150"
      >
        <Icon name="arrow-left" size={14} />
        Exit development mode
      </button>

      <Separator />

      {/* VC toolbar */}
      <div className="flex items-center gap-1">
        <ToolbarBtn label="View changes" icon="diff" />
        <ToolbarBtn label="Reject" icon="close" />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 h-6 text-[11px] font-medium rounded-md
                     bg-vsc-accent text-white hover:bg-vsc-accent/90
                     cursor-pointer border-none focus-ring transition-colors duration-150"
        >
          <Icon name="check" size={12} />
          Accept
        </button>
        <Separator />
        <ToolbarBtn label={`Edited Files (${editedFilesCount})`} icon="edit" />
        <ToolbarBtn label="Save All" icon="save-all" />
        <ToolbarBtn label="Commit & Sync" icon="git-commit" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: History + New Chat */}
      <ToolbarBtn
        label="History"
        icon="history"
        onClick={() => {
          setActiveSurface("chat");
          setCurrentPage("sessions");
        }}
      />
      <button
        type="button"
        onClick={() => {
          setActiveSurface("chat");
          setCurrentPage("chat");
          newTab();
        }}
        className="inline-flex items-center gap-1 px-2.5 h-6 text-[11px] font-medium rounded-md
                   bg-vsc-accent/12 text-vsc-accent hover:bg-vsc-accent/20
                   cursor-pointer border-none focus-ring transition-colors duration-150"
      >
        <Icon name="add" size={12} />
        New Chat
      </button>
    </div>
  );
});

// ─── Toolbar Button ─────────────────────────────────────

function ToolbarBtn({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-1.5 h-6 text-[11px] rounded-md
                 text-vsc-text-secondary hover:text-vsc-fg hover:bg-vsc-surface-3/30
                 cursor-pointer border-none focus-ring transition-colors duration-150"
      aria-label={label}
    >
      {icon && <Icon name={icon} size={12} className="shrink-0" />}
      <span>{label}</span>
    </button>
  );
}
