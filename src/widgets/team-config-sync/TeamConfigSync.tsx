import React, { useCallback } from "react";

import { useTeamConfigSync } from "../../features/team-config-sync";
import type { ConfigChoice, TeamConfig, TeamConfigStatus } from "../../shared/protocol";
import { Button, cn, Dialog, Icon, Text } from "../../shared/ui";

const STATUS_LABELS: Record<TeamConfigStatus, string> = {
  same: "Same",
  different: "Different",
  local_only: "Local only",
  team_only: "Team only",
};

const STATUS_COLORS: Record<TeamConfigStatus, string> = {
  same: "text-vsc-text-tertiary",
  different: "text-vsc-warning",
  local_only: "text-vsc-info",
  team_only: "text-vsc-focusBorder",
};

interface ConfigRowProps {
  readonly item: TeamConfig;
  readonly onApplyChoice: (key: string, choice: ConfigChoice) => void;
}

const ConfigRow = React.memo(function ConfigRow({ item, onApplyChoice }: ConfigRowProps) {
  const handleUseLocal = useCallback(
    () => onApplyChoice(item.key, "local"),
    [item.key, onApplyChoice],
  );
  const handleUseTeam = useCallback(
    () => onApplyChoice(item.key, "team"),
    [item.key, onApplyChoice],
  );
  const handleMerge = useCallback(
    () => onApplyChoice(item.key, "merge"),
    [item.key, onApplyChoice],
  );

  const isSame = item.status === "same";

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 rounded",
        "border border-vsc-panel-border",
        isSame ? "opacity-60" : "bg-vsc-panel-bg",
      )}
      data-testid={`config-row-${item.key}`}
    >
      {/* Local value column */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Text size="xs" weight="medium" className="truncate min-w-0">
            {item.key}
          </Text>
          <span className={cn("text-2xs", STATUS_COLORS[item.status])}>
            {STATUS_LABELS[item.status]}
          </span>
        </div>
        <code className="text-2xs text-vsc-text-secondary truncate min-w-0 block bg-vsc-editor-bg px-1.5 py-0.5 rounded">
          {item.local_value || "(empty)"}
        </code>
      </div>

      {/* Team value column */}
      <div className="flex flex-col gap-1 min-w-0">
        <Text size="xs" weight="medium" tone="tertiary">
          Team
        </Text>
        <code className="text-2xs text-vsc-text-secondary truncate min-w-0 block bg-vsc-editor-bg px-1.5 py-0.5 rounded">
          {item.team_value || "(empty)"}
        </code>
      </div>

      {/* Actions */}
      {!isSame && (
        <div className="flex items-center gap-1 shrink-0">
          {item.status !== "team_only" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUseLocal}
              data-testid={`config-use-local-${item.key}`}
            >
              Use local
            </Button>
          )}
          {item.status !== "local_only" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUseTeam}
              data-testid={`config-use-team-${item.key}`}
            >
              Use team
            </Button>
          )}
          {item.status === "different" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMerge}
              data-testid={`config-merge-${item.key}`}
            >
              Merge
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Team Configuration Sync widget.
 * Shows a two-column diff-like view of local vs team config with per-setting actions.
 */
export const TeamConfigSync = React.memo(function TeamConfigSync() {
  const {
    items,
    diffCount,
    dialogOpen,
    closeDialog,
    syncConfig,
    applyChoice,
    acceptAllTeam,
    keepAllLocal,
  } = useTeamConfigSync();

  if (!dialogOpen) return null;

  return (
    <Dialog
      open={dialogOpen}
      onClose={closeDialog}
      title="Team Config Sync"
      data-testid="team-config-dialog"
    >
      <div className="flex flex-col gap-3 p-4 min-w-[min(480px,calc(100vw-2rem))] max-h-[60vh]">
        {/* Header info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="settings-gear" tokenSize="sm" className="text-vsc-focusBorder" />
            <Text size="xs" tone="secondary">
              {diffCount} difference{diffCount !== 1 ? "s" : ""} found
            </Text>
          </div>
          <Button variant="ghost" size="sm" onClick={syncConfig} data-testid="sync-config-button">
            <Icon name="sync" tokenSize="sm" />
            Refresh
          </Button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3">
          <Text size="xs" weight="medium" tone="secondary">
            Local Config
          </Text>
          <Text size="xs" weight="medium" tone="secondary">
            Team Config
          </Text>
          <div className="w-[180px]" />
        </div>

        {/* Config items */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[40vh]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Icon name="info" tokenSize="sm" className="text-vsc-text-tertiary" />
              <Text size="xs" tone="tertiary">
                No config data loaded. Click Refresh to sync.
              </Text>
            </div>
          ) : (
            items.map((item) => (
              <ConfigRow key={item.key} item={item} onApplyChoice={applyChoice} />
            ))
          )}
        </div>

        {/* Bulk actions + close */}
        <div className="flex justify-between pt-2 border-t border-vsc-panel-border">
          <div className="flex gap-2">
            {diffCount > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={keepAllLocal}
                  data-testid="keep-all-local"
                >
                  Keep all local
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={acceptAllTeam}
                  data-testid="accept-all-team"
                >
                  Accept all team
                </Button>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={closeDialog}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
