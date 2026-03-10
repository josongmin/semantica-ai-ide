import React, { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { runningAgentsCountAtom } from "~entities/agent-instance";
import { allFileChangesCountAtom } from "~entities/diff";
import { hasGitCommitsAtom } from "~entities/git-history";
import { pendingTodoCountAtom } from "~entities/project-todo";
import { runningJobsCountAtom } from "~shared/bootstrap/background-agent";
import { isScopeGuardActiveAtom } from "~shared/bootstrap/scope-guard";
import { useSessionLifecycle } from "~shared/bootstrap/session-lifecycle";

import { useProjectTodoActions } from "../../features/project-todo";
import {
  activeFeatureSheetAtom,
  currentPageAtom,
  scopeGuardDialogOpenAtom,
  toggleFeatureSheetAtom,
} from "../../shared/lib";
import { Button, cn, Icon, Text, Tooltip } from "../../shared/ui";
import { PrivacyIndicator } from "../privacy-indicator";
import { SettingsMenu } from "../settings-menu";
import { CopyConversationButton } from "./CopyConversationButton";
import { type FeatureButton, SheetToggleButton } from "./SheetToggleButton";
import { BadgeIndicator, toolbarBtnClass, ToolbarSep } from "./ToolbarPrimitives";

/** Subheader toolbar: feature sheets + panel toggles (from former GNB) */
export const FeatureBar = React.memo(function FeatureBar() {
  const runningCount = useAtomValue(runningAgentsCountAtom);
  const hasGitCommits = useAtomValue(hasGitCommitsAtom);
  const bgJobsRunning = useAtomValue(runningJobsCountAtom);
  const pendingTodoCount = useAtomValue(pendingTodoCountAtom);
  const allChangesCount = useAtomValue(allFileChangesCountAtom);
  const setCurrentPage = useSetAtom(currentPageAtom);
  const setScopeGuardOpen = useSetAtom(scopeGuardDialogOpenAtom);
  const scopeGuardActive = useAtomValue(isScopeGuardActiveAtom);
  const { loadSessionList } = useSessionLifecycle();
  const { loadTodos } = useProjectTodoActions();

  const activeSheet = useAtomValue(activeFeatureSheetAtom);
  const toggleSheet = useSetAtom(toggleFeatureSheetAtom);

  const openSessions = useCallback(() => {
    loadSessionList();
    setCurrentPage("sessions");
  }, [loadSessionList, setCurrentPage]);

  const openTodoBoard = useCallback(() => {
    loadTodos();
    setCurrentPage("todos");
  }, [loadTodos, setCurrentPage]);

  const openScopeGuard = useCallback(() => {
    setScopeGuardOpen(true);
  }, [setScopeGuardOpen]);

  const sheetButtons: FeatureButton[] = useMemo(
    () => [
      {
        id: "agents" as const,
        label: "Agents",
        icon: "server-process",
        badgeCount: runningCount,
      },
      { id: "search" as const, label: "Search", icon: "search" },
      {
        id: "git" as const,
        label: "Git",
        icon: "git-commit",
        showDot: hasGitCommits,
      },
      { id: "compact" as const, label: "Compact", icon: "fold" },
      { id: "wiki" as const, label: "Wiki", icon: "book" },
      { id: "preview" as const, label: "Preview", icon: "open-preview" },
      { id: "snapshots" as const, label: "Snapshots", icon: "save" },
      { id: "notes" as const, label: "Notes", icon: "note" },
      { id: "graph" as const, label: "Graph", icon: "graph-line" },
      { id: "bg-agents" as const, label: "BG Agents", icon: "robot" },
      { id: "intent" as const, label: "Intent", icon: "timeline-open" },
      { id: "terminal" as const, label: "Terminal", icon: "terminal" },
      { id: "resources" as const, label: "Resources", icon: "dashboard" },
      { id: "mission" as const, label: "Mission", icon: "layout" },
    ],
    [runningCount, hasGitCommits],
  );

  return (
    <div
      className="flex items-center gap-1 border-b border-vsc-border bg-vsc-surface-1/50 px-2 py-1 overflow-x-auto scrollbar-none"
      role="toolbar"
      aria-label="Feature toggles"
      data-testid="feature-bar"
    >
      {/* Sheet buttons (BottomSheet) */}
      {sheetButtons.map((btn) => (
        <SheetToggleButton
          key={btn.id}
          btn={btn}
          isActive={activeSheet === btn.id}
          onToggle={toggleSheet}
        />
      ))}

      <ToolbarSep />

      {/* Panel toggles */}
      <Tooltip content="Sessions">
        <Button
          variant="ghost"
          size="sm"
          onClick={openSessions}
          aria-label="Session history"
          className={toolbarBtnClass(false)}
        >
          <Icon name="folder-opened" tokenSize="xs" />
          <Text size="xs">Sessions</Text>
        </Button>
      </Tooltip>

      <PrivacyIndicator />

      <Tooltip content={scopeGuardActive ? "Scope Guard active" : "Scope Guard"}>
        <Button
          variant="ghost"
          size="icon"
          onClick={openScopeGuard}
          aria-label="Scope Guard"
          className={cn(toolbarBtnClass(false), "justify-center w-6 h-6 px-0")}
        >
          <Icon
            name="shield"
            tokenSize="sm"
            className={scopeGuardActive ? "text-vsc-warning" : undefined}
          />
        </Button>
      </Tooltip>

      <Tooltip content="Project TODOs">
        <Button
          variant="ghost"
          size="sm"
          onClick={openTodoBoard}
          aria-label="Project TODOs"
          className={cn(toolbarBtnClass(false), "relative")}
        >
          <Icon name="tasklist" tokenSize="xs" />
          <Text size="xs">Todo</Text>
          <BadgeIndicator count={pendingTodoCount} />
        </Button>
      </Tooltip>

      <ToolbarSep />

      {/* Panel-popup group */}
      <div className="flex items-center gap-0.5 rounded-md bg-vsc-surface-2/80 px-1 py-0.5">
        <SheetToggleButton
          btn={{ id: "pipeline", label: "Pipeline", icon: "beaker" }}
          isActive={activeSheet === "pipeline"}
          onToggle={toggleSheet}
        />

        {allChangesCount > 0 && (
          <SheetToggleButton
            btn={{
              id: "review",
              label: "Review",
              icon: "git-pull-request",
              badgeCount: allChangesCount,
            }}
            isActive={activeSheet === "review"}
            onToggle={toggleSheet}
          />
        )}

        <SheetToggleButton
          btn={{ id: "jobs", label: "Jobs", icon: "cloud", badgeCount: bgJobsRunning }}
          isActive={activeSheet === "jobs"}
          onToggle={toggleSheet}
        />

        <SheetToggleButton
          btn={{ id: "workspace", label: "Workspace", icon: "files" }}
          isActive={activeSheet === "workspace"}
          onToggle={toggleSheet}
        />

        <SheetToggleButton
          btn={{ id: "activity", label: "Activity", icon: "output" }}
          isActive={activeSheet === "activity"}
          onToggle={toggleSheet}
        />
      </div>

      <span className="flex-1 min-w-2" />

      <CopyConversationButton />

      <SettingsMenu className="shrink-0" />
    </div>
  );
});
