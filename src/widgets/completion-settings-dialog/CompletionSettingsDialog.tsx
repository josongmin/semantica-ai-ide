import React, { useCallback } from "react";

import { useInlineCompletion } from "../../features/inline-completion";
import { cn, Dialog, SegmentedControl, type SegmentedOption, Text } from "../../shared/ui";

interface CompletionSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const triggerDelayOptions: readonly SegmentedOption[] = [
  { value: "100", label: "100ms" },
  { value: "300", label: "300ms" },
  { value: "500", label: "500ms" },
  { value: "1000", label: "1s" },
];

const maxLinesOptions: readonly SegmentedOption[] = [
  { value: "3", label: "3" },
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "20", label: "20" },
];

export const CompletionSettingsDialog = React.memo(function CompletionSettingsDialog({
  open,
  onClose,
}: CompletionSettingsDialogProps) {
  const { settings, stats, updateSettings, toggleEnabled } = useInlineCompletion();

  const handleTriggerDelayChange = useCallback(
    (value: string) => {
      updateSettings({ trigger_delay_ms: Number(value) });
    },
    [updateSettings],
  );

  const handleMaxLinesChange = useCallback(
    (value: string) => {
      updateSettings({ max_lines: Number(value) });
    },
    [updateSettings],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Inline Completion Settings"
      description="Configure inline code completion behavior"
      data-testid="completion-settings-dialog"
    >
      <div
        className="flex flex-col gap-4 min-w-[min(320px,calc(100vw-2rem))]"
        data-testid="completion-settings-content"
      >
        {/* Enable toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <Text size="sm" weight="medium">
              Enable completions
            </Text>
            <Text size="xs" tone="secondary">
              Show inline code suggestions while typing
            </Text>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            aria-label="Enable inline completions"
            onClick={toggleEnabled}
            data-testid="enabled-toggle"
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-normal focus:outline-none focus-ring",
              settings.enabled ? "bg-vsc-button" : "bg-vsc-surface-3",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-vsc-fg shadow transition-transform duration-normal ease-in-out",
                settings.enabled ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>

        {/* Trigger delay */}
        <div className="flex flex-col gap-2">
          <Text size="sm" weight="medium">
            Trigger delay
          </Text>
          <SegmentedControl
            options={triggerDelayOptions}
            value={String(settings.trigger_delay_ms)}
            onValueChange={handleTriggerDelayChange}
            size="sm"
          />
        </div>

        {/* Max lines */}
        <div className="flex flex-col gap-2">
          <Text size="sm" weight="medium">
            Max completion lines
          </Text>
          <SegmentedControl
            options={maxLinesOptions}
            value={String(settings.max_lines)}
            onValueChange={handleMaxLinesChange}
            size="sm"
          />
        </div>

        {/* Stats */}
        <div
          className="rounded border border-vsc-border bg-vsc-surface-2 px-3 py-2 flex flex-col gap-1"
          data-testid="completion-stats"
        >
          <Text size="3xs" tone="tertiary" weight="medium" className="tracking-wide">
            Today's Stats
          </Text>
          <div className="flex items-center justify-between">
            <Text size="xs" tone="secondary">
              Shown
            </Text>
            <Text size="xs" mono>
              {stats.shown_today}
            </Text>
          </div>
          <div className="flex items-center justify-between">
            <Text size="xs" tone="secondary">
              Accepted
            </Text>
            <Text size="xs" mono>
              {stats.accepted_today}
            </Text>
          </div>
          <div className="flex items-center justify-between">
            <Text size="xs" tone="secondary">
              Acceptance rate
            </Text>
            <Text size="xs" mono>
              {(stats.acceptance_rate * 100).toFixed(0)}%
            </Text>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
