import React, { useCallback, useState } from "react";

import type { RestoreMode } from "../../shared/protocol";
import { Button, cn, Dialog, Icon, Text } from "../../shared/ui";

interface RestoreModeDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (mode: RestoreMode) => void;
  readonly checkpointLabel: string;
}

interface ModeOption {
  readonly mode: RestoreMode;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    mode: "chat",
    label: "Chat only",
    description: "Restore conversation history, keep current file changes",
    icon: "comment-discussion",
  },
  {
    mode: "code",
    label: "Code only",
    description: "Restore files to checkpoint state, keep conversation",
    icon: "file-code",
  },
  {
    mode: "both",
    label: "Both",
    description: "Restore everything to checkpoint state",
    icon: "history",
  },
];

/**
 * Modal dialog for selecting checkpoint restore mode.
 * Shows three radio-style options: Chat only, Code only, or Both.
 * Confirm/Cancel buttons.
 */
export const RestoreModeDialog = React.memo(function RestoreModeDialog({
  open,
  onClose,
  onConfirm,
  checkpointLabel,
}: RestoreModeDialogProps) {
  const [selectedMode, setSelectedMode] = useState<RestoreMode>("both");

  const handleConfirm = useCallback(() => {
    onConfirm(selectedMode);
  }, [onConfirm, selectedMode]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Restore Checkpoint"
      description={`Choose what to restore from "${checkpointLabel}"`}
    >
      <fieldset className="space-y-2 mb-4" role="radiogroup" aria-label="Restore mode">
        {MODE_OPTIONS.map((option) => (
          <label
            key={option.mode}
            className={cn(
              "flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors duration-fast",
              selectedMode === option.mode
                ? "border-vsc-focus bg-vsc-focus/5"
                : "border-vsc-border hover:bg-vsc-list-hover",
            )}
          >
            <input
              type="radio"
              name="restore-mode"
              value={option.mode}
              checked={selectedMode === option.mode}
              onChange={() => setSelectedMode(option.mode)}
              className="mt-1 accent-[var(--vscode-focusBorder)]"
              aria-label={option.label}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon name={option.icon} tokenSize="sm" className="text-vsc-text-secondary" />
                <Text size="sm" weight="medium">
                  {option.label}
                </Text>
              </div>
              <Text size="2xs" tone="secondary" className="mt-0.5">
                {option.description}
              </Text>
            </div>
          </label>
        ))}
      </fieldset>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleConfirm}>
          Restore
        </Button>
      </div>
    </Dialog>
  );
});
