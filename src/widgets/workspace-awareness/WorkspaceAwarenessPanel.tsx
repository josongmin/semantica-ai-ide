import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  filteredWorkspaceFileGroupsAtom,
  workspaceFileTotalCountAtom,
  workspaceTurnFilterAtom,
  workspaceTurnIdsAtom,
} from "~shared/bootstrap/workspace-awareness";

import { workspaceAwarenessPanelVisibleAtom } from "../../shared/lib/atoms/inspectionPanelAtoms";
import { Badge, cn, Collapsible, Icon, Text } from "../../shared/ui";
import { WORKSPACE_ACTION_ICONS, WORKSPACE_ACTION_LABELS } from "./constants";
import { WorkspaceFileRow } from "./WorkspaceFileRow";

/** Turn filter button -- avoids inline arrow in .map() */
const TurnFilterButton = React.memo(function TurnFilterButton({
  tid,
  isActive,
  onSelect,
}: {
  tid: string;
  isActive: boolean;
  onSelect: (tid: string) => void;
}) {
  const handleClick = useCallback(() => onSelect(tid), [onSelect, tid]);
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "px-1.5 py-0.5 text-2xs rounded shrink-0 transition-colors duration-fast cursor-pointer focus-ring",
        isActive
          ? "bg-vsc-button text-vsc-button-fg"
          : "text-vsc-text-tertiary hover:bg-vsc-toolbar",
      )}
    >
      {tid}
    </button>
  );
});

export const WorkspaceAwarenessPanel = React.memo(function WorkspaceAwarenessPanel() {
  const visible = useAtomValue(workspaceAwarenessPanelVisibleAtom);
  const groups = useAtomValue(filteredWorkspaceFileGroupsAtom);
  const totalCount = useAtomValue(workspaceFileTotalCountAtom);
  const turnIds = useAtomValue(workspaceTurnIdsAtom);
  const turnFilter = useAtomValue(workspaceTurnFilterAtom);
  const setTurnFilter = useSetAtom(workspaceTurnFilterAtom);

  const clearTurnFilter = useCallback(() => setTurnFilter(null), [setTurnFilter]);

  if (!visible) return null;

  return (
    <div
      className="border-t border-vsc-border bg-vsc-surface-1 overflow-hidden max-h-[--panel-max-h-sm]"
      role="region"
      aria-label="Workspace awareness"
    >
      <div className="px-3 py-1 text-2xs font-medium text-vsc-text-tertiary tracking-wide border-b border-vsc-border sticky top-0 bg-vsc-surface-1 z-[--z-sticky] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Icon name="files" tokenSize="2xs" />
          Workspace
        </span>
        {totalCount > 0 && <Badge text={totalCount} variant="default" />}
      </div>

      {turnIds.length > 1 && (
        <div className="flex items-center gap-1 px-2 py-1 border-b border-vsc-border overflow-x-auto">
          <button
            type="button"
            onClick={clearTurnFilter}
            className={cn(
              "px-1.5 py-0.5 text-2xs rounded shrink-0 transition-colors duration-fast cursor-pointer focus-ring",
              turnFilter === null
                ? "bg-vsc-button text-vsc-button-fg"
                : "text-vsc-text-tertiary hover:bg-vsc-toolbar",
            )}
          >
            All
          </button>
          {turnIds.map((tid) => (
            <TurnFilterButton
              key={tid}
              tid={tid}
              isActive={turnFilter === tid}
              onSelect={setTurnFilter}
            />
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <Text size="xs" tone="tertiary">
            No files touched yet
          </Text>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[--panel-max-h-sm] scroll-shadow">
          {groups.map((group) => (
            <Collapsible
              key={group.action}
              title={WORKSPACE_ACTION_LABELS[group.action]}
              icon={WORKSPACE_ACTION_ICONS[group.action]}
              badge={group.count}
              defaultCollapsed={false}
            >
              <div role="list">
                {group.files.map((entry) => (
                  <WorkspaceFileRow key={entry.file_path} entry={entry} />
                ))}
              </div>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
});
