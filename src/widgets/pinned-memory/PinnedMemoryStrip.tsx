import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { pinMemoryRuleAtom, pinnedMemoryRulesAtom } from "../../entities/memory-rule";
import type { MemoryRuleId } from "../../shared/protocol";
import { cn, Icon, Text, Tooltip } from "../../shared/ui";

/**
 * Thin horizontal strip showing pinned memory items as chips.
 * Each chip: truncated title + click to expand/view.
 * Unpin button (x) on hover.
 * Only renders when there are pinned memory rules.
 */
export const PinnedMemoryStrip = React.memo(function PinnedMemoryStrip() {
  const pinnedRules = useAtomValue(pinnedMemoryRulesAtom);
  const setPinMemory = useSetAtom(pinMemoryRuleAtom);

  const handleUnpin = useCallback(
    (id: MemoryRuleId) => {
      setPinMemory({ id, pinned: false });
    },
    [setPinMemory],
  );

  if (pinnedRules.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 border-b border-vsc-border overflow-x-auto flex-nowrap text-2xs"
      role="list"
      aria-label="Pinned memory rules"
    >
      <Icon name="pin" tokenSize="xs" className="text-vsc-text-ghost shrink-0" />

      {pinnedRules.map((rule) => (
        <div
          key={rule.id}
          role="listitem"
          className={cn(
            "group/chip flex items-center gap-1 px-2 py-0.5 rounded-md",
            "bg-vsc-surface-2 border border-vsc-border",
            "hover:bg-vsc-list-hover transition-colors duration-fast",
            "whitespace-nowrap shrink-0 max-w-[200px]",
          )}
        >
          <Tooltip content={rule.content}>
            <Text size="2xs" tone="secondary" className="truncate cursor-default">
              {rule.title}
            </Text>
          </Tooltip>

          <button
            type="button"
            onClick={() => handleUnpin(rule.id)}
            aria-label={`Unpin: ${rule.title}`}
            className={cn(
              "opacity-0 group-hover/chip:opacity-100 transition-opacity duration-fast",
              "flex items-center justify-center w-4 h-4 rounded",
              "hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer shrink-0 focus-ring",
            )}
          >
            <Icon name="close" tokenSize="2xs" className="text-vsc-text-tertiary" />
          </button>
        </div>
      ))}
    </div>
  );
});
