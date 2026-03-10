import React, { useCallback, useMemo } from "react";
import { useSetAtom } from "jotai";

import { useClearConversation } from "../../features/clear-conversation";
import { useFastMode } from "../../features/fast-mode";
import { useThinkingMode } from "../../features/thinking-mode";
import { currentPageAtom, getVscodeApi } from "../../shared/lib";
import { Button, cn, DropdownMenu, type DropdownMenuItem, Icon } from "../../shared/ui";

/** Stable message payloads -- avoids creating new objects each callback invocation */
const MSG_LOAD_AGENT_RULES = { type: "LOAD_AGENT_RULES" } as const;
const MSG_LAUNCH_BG_JOB = { type: "LAUNCH_BACKGROUND_JOB", label: "Quick Task", prompt: "", cloud: false } as const;
const MSG_START_DEBATE = { type: "START_DEBATE" as const, prompt: "", model_ids: ["claude-sonnet-4-6", "claude-haiku-4-5"] };

export const SettingsMenu = React.memo(function SettingsMenu({
  className,
  compact,
}: {
  className?: string;
  /** Compact trigger for header/GNB — smaller icon, tighter hit area */
  compact?: boolean;
}) {
  const { enabled: thinkingEnabled, toggle: toggleThinking } = useThinkingMode();
  const { enabled: fastEnabled, toggle: toggleFast } = useFastMode();
  const { clearConversation } = useClearConversation();
  const setCurrentPage = useSetAtom(currentPageAtom);

  const items: DropdownMenuItem[] = useMemo(
    () => [
      {
        id: "thinking",
        label: thinkingEnabled ? "Thinking: ON" : "Thinking: OFF",
      },
      {
        id: "fast",
        label: fastEnabled ? "Fast Mode: ON" : "Fast Mode: OFF",
      },
      { id: "divider", label: "", separator: true },
      {
        id: "settings",
        label: "Settings",
      },
      { id: "divider-sota", label: "", separator: true },
      {
        id: "sota-rules",
        label: "Agent Rules",
      },
      {
        id: "sota-background",
        label: "Background Jobs",
      },
      {
        id: "sota-debate",
        label: "Multi-Agent Debate",
      },
      { id: "divider-danger", label: "", separator: true },
      {
        id: "clear",
        label: "Clear Conversation",
        danger: true,
      },
    ],
    [thinkingEnabled, fastEnabled],
  );

  const handleSelect = useCallback(
    (id: string) => {
      switch (id) {
        case "thinking":
          toggleThinking();
          break;
        case "fast":
          toggleFast();
          break;
        case "settings":
          setCurrentPage("settings");
          break;
        case "sota-rules":
          getVscodeApi().postMessage(MSG_LOAD_AGENT_RULES);
          break;
        case "sota-background":
          getVscodeApi().postMessage(MSG_LAUNCH_BG_JOB);
          break;
        case "sota-debate":
          getVscodeApi().postMessage(MSG_START_DEBATE);
          break;
        case "clear":
          clearConversation();
          break;
      }
    },
    [toggleThinking, toggleFast, clearConversation, setCurrentPage],
  );

  return (
    <DropdownMenu
      items={items}
      onSelect={handleSelect}
      align="right"
      className={className}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Settings menu"
          className={cn(
            compact ? "w-6 h-6" : "p-1",
          )}
          data-testid="settings-menu-trigger"
        >
          <Icon name="ellipsis" tokenSize={compact ? "xs" : "sm"} />
        </Button>
      }
    />
  );
});
