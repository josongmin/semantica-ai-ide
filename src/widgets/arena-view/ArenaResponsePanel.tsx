import React from "react";

import type { ArenaResponse } from "~entities/arena";

import { Text } from "../../shared/ui";

interface ArenaResponsePanelProps {
  response: ArenaResponse | null;
  slot: "A" | "B";
}

export const ArenaResponsePanel = React.memo(function ArenaResponsePanel({
  response,
  slot,
}: ArenaResponsePanelProps) {
  return (
    <div
      className="flex flex-col flex-1 min-w-0 border border-vsc-border rounded bg-vsc-surface-1"
      role="region"
      aria-label={`Slot ${slot} response`}
    >
      <div className="px-3 py-2 border-b border-vsc-border bg-vsc-surface-2 flex items-center gap-2">
        <Text size="xs" tone="secondary" className="font-medium">
          {response ? response.model_label : `Model ${slot}`}
        </Text>
        <Text size="xs" tone="tertiary">
          Slot {slot}
        </Text>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {response === null ? (
          <Text size="xs" tone="tertiary">
            Waiting for response…
          </Text>
        ) : (
          <div className="text-sm text-vsc-text-primary whitespace-pre-wrap break-words">
            {response.text}
          </div>
        )}
      </div>
    </div>
  );
});
