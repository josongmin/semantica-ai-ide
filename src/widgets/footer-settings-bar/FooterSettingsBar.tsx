import React, { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { gitCommitsAtom } from "~entities/git-history";
import { approvalModeAtom } from "~entities/session/settings";

import { worktreeStatusAtom } from "../../features/worktree-status";
import { permissionSettingsOpenAtom } from "../../shared/lib";
import { remotePanelVisibleAtom } from "../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import { Button, cn, Icon, Text, Tooltip } from "../../shared/ui";

const APPROVAL_LABELS: Record<string, string> = {
  auto: "Default permissions",
  turbo: "Turbo",
};

/**
 * Footer settings bar below chat input: Local|Remote, Permission settings, Git branch.
 * Matches reference UX with dropdown-style controls.
 */
export const FooterSettingsBar = React.memo(function FooterSettingsBar() {
  const [remoteVisible, setRemoteVisible] = useAtom(remotePanelVisibleAtom);
  const setPermissionOpen = useSetAtom(permissionSettingsOpenAtom);
  const approvalMode = useAtomValue(approvalModeAtom);
  const worktree = useAtomValue(worktreeStatusAtom);
  const gitCommits = useAtomValue(gitCommitsAtom);

  const branch =
    worktree?.branch ??
    gitCommits[0]?.branch ??
    "main";

  const handleWorkspaceToggle = useCallback(() => {
    setRemoteVisible((v) => !v);
  }, [setRemoteVisible]);

  const handlePermissionClick = useCallback(() => {
    setPermissionOpen(true);
  }, [setPermissionOpen]);

  const handleBranchRefresh = useCallback(() => {
    getVscodeApi().postMessage({ type: "REQUEST_PROJECT_FILES" });
  }, []);

  const itemClass = "flex items-center gap-1.5 py-1 text-vsc-text-secondary hover:text-vsc-fg transition-colors duration-fast cursor-pointer focus-ring";

  return (
    <div
      className="flex items-center gap-4 mx-2 px-2.5 py-1 -mt-px text-xs"
      role="group"
      aria-label="Footer settings"
    >
      <Tooltip content={remoteVisible ? "Switch to Local" : "Switch to Remote"}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleWorkspaceToggle}
          aria-label={remoteVisible ? "Switch to Local" : "Switch to Remote"}
          className={cn(itemClass, "text-vsc-fg")}
        >
          {remoteVisible ? (
            <>
              <Icon name="vm" tokenSize="2xs" />
              <Text size="xs" tone="secondary">Remote</Text>
            </>
          ) : (
            <>
              <Icon name="device-desktop" tokenSize="2xs" />
              <Text size="xs" tone="secondary">Local</Text>
            </>
          )}
          <Icon name="chevron-down" tokenSize="2xs" className="opacity-60 ml-0.5 shrink-0" />
        </Button>
      </Tooltip>
      <Tooltip content="Permission settings">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePermissionClick}
          aria-label="Permission settings"
          className={itemClass}
        >
          <Icon name="shield" tokenSize="2xs" />
          <Text size="xs" tone="secondary">
            {APPROVAL_LABELS[approvalMode] ?? "Default permissions"}
          </Text>
        </Button>
      </Tooltip>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Icon name="git-branch" tokenSize="2xs" className="text-vsc-text-secondary shrink-0" />
        <Text size="xs" tone="secondary" truncate className="max-w-[100px]">
          {branch}
        </Text>
        <Tooltip content="Refresh branch">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBranchRefresh}
            aria-label="Refresh branch"
            className="p-0.5 text-vsc-text-secondary hover:text-vsc-fg transition-colors duration-fast"
          >
            <Icon name="sync" tokenSize="2xs" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});
