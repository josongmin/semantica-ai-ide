import React from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  clearComparisonAtom,
  comparisonFilesAtom,
  comparisonPairAtom,
  isComparisonActiveAtom,
} from "../../features/checkpoint-comparison";
import { Button, Icon, Text, Tooltip } from "../../shared/ui";
import { FileChangeRow } from "../file-change-summary";

export const CheckpointComparisonPanel = React.memo(function CheckpointComparisonPanel() {
  const isActive = useAtomValue(isComparisonActiveAtom);
  const pair = useAtomValue(comparisonPairAtom);
  const files = useAtomValue(comparisonFilesAtom);
  const clear = useSetAtom(clearComparisonAtom);

  if (!isActive || !pair) return null;

  return (
    <div
      className="border-t border-vsc-border bg-vsc-surface-1 max-h-[--panel-max-h-sm] overflow-hidden"
      role="region"
      aria-label="Checkpoint comparison"
      data-testid="checkpoint-comparison-panel"
    >
      <div className="px-3 py-1.5 flex items-center gap-2 border-b border-vsc-border bg-vsc-surface-1 sticky top-0 z-[--z-sticky]">
        <Icon name="git-compare" tokenSize="xs" className="text-vsc-text-tertiary" />
        <Tooltip content={`${pair.from.label} → ${pair.to.label}`}>
          <Text size="2xs" tone="tertiary" className="flex-1 min-w-0 truncate" title={`${pair.from.label} → ${pair.to.label}`}>
            {pair.from.label} → {pair.to.label}
          </Text>
        </Tooltip>
        <Button
          variant="ghost"
          size="sm"
          icon="close"
          aria-label="Clear comparison"
          onClick={clear}
        />
      </div>

      {files.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <Text size="xs" tone="tertiary">
            Loading diff...
          </Text>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[--panel-max-h-sm] py-1">
          {files.map((fc) => (
            <FileChangeRow key={fc.file_path} fileChange={fc} />
          ))}
        </div>
      )}
    </div>
  );
});
