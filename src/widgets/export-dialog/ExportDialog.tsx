import React, { useCallback } from "react";

import { useExport } from "../../features/export";
import type { ExportFormat } from "../../shared/protocol";
import { Button, cn, Dialog, Icon, ProgressBar, SegmentedControl, Text } from "../../shared/ui";

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "html", label: "HTML" },
  { value: "pdf", label: "PDF" },
  { value: "markdown", label: "Markdown" },
];

interface OptionToggleProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly testId: string;
}

const OptionToggle = React.memo(function OptionToggle({
  label,
  checked,
  onChange,
  testId,
}: OptionToggleProps) {
  const handleChange = useCallback(() => onChange(!checked), [checked, onChange]);

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" data-testid={testId}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="accent-vsc-focusBorder"
      />
      <Text size="xs">{label}</Text>
    </label>
  );
});

/**
 * Export dialog widget for exporting conversations in HTML, PDF, or Markdown format.
 * Provides format selection, export options toggles, and progress indication.
 */
export const ExportDialog = React.memo(function ExportDialog() {
  const {
    progress,
    errorMessage,
    dialogOpen,
    format,
    options,
    sessionId,
    exportSession,
    closeDialog,
    setFormat,
    updateOption,
  } = useExport();

  const handleExport = useCallback(() => {
    exportSession(sessionId, format, options);
  }, [exportSession, sessionId, format, options]);

  const handleFormatChange = useCallback(
    (value: string) => {
      setFormat(value as ExportFormat);
    },
    [setFormat],
  );

  const handleToggleDiffs = useCallback(
    (checked: boolean) => updateOption("include_diffs", checked),
    [updateOption],
  );

  const handleToggleToolCalls = useCallback(
    (checked: boolean) => updateOption("include_tool_calls", checked),
    [updateOption],
  );

  const handleToggleTimestamps = useCallback(
    (checked: boolean) => updateOption("include_timestamps", checked),
    [updateOption],
  );

  if (!dialogOpen) return null;

  const isExporting = progress === "exporting";
  const isDone = progress === "done";
  const isError = progress === "error";

  return (
    <Dialog
      open={dialogOpen}
      onClose={closeDialog}
      title="Export Conversation"
      data-testid="export-dialog"
    >
      <div className="flex flex-col gap-4 p-4 min-w-[min(320px,calc(100vw-2rem))]">
        {/* Format selector */}
        <div className="flex flex-col gap-1.5">
          <Text size="xs" weight="medium" tone="secondary">
            Format
          </Text>
          <SegmentedControl
            options={FORMAT_OPTIONS}
            value={format}
            onValueChange={handleFormatChange}
            data-testid="export-format-selector"
          />
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          <Text size="xs" weight="medium" tone="secondary">
            Options
          </Text>
          <OptionToggle
            label="Include diffs"
            checked={options.include_diffs}
            onChange={handleToggleDiffs}
            testId="export-option-diffs"
          />
          <OptionToggle
            label="Include tool calls"
            checked={options.include_tool_calls}
            onChange={handleToggleToolCalls}
            testId="export-option-tool-calls"
          />
          <OptionToggle
            label="Include timestamps"
            checked={options.include_timestamps}
            onChange={handleToggleTimestamps}
            testId="export-option-timestamps"
          />
        </div>

        {/* Progress indicator */}
        {isExporting && (
          <div className="flex flex-col gap-1.5" data-testid="export-progress">
            <div className="flex items-center gap-2">
              <Icon name="loading" tokenSize="sm" className="text-vsc-focusBorder" />
              <Text size="xs">Exporting...</Text>
            </div>
            <ProgressBar value={0} max={100} />
          </div>
        )}

        {/* Done state */}
        {isDone && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded bg-vsc-success/10 border border-vsc-success/30"
            data-testid="export-done"
          >
            <Icon name="check" tokenSize="sm" className="text-vsc-success" />
            <Text size="xs" tone="success">
              Export completed successfully
            </Text>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded",
              "bg-vsc-error/10 border border-vsc-error/30",
            )}
            data-testid="export-error"
          >
            <Icon name="error" tokenSize="sm" className="text-vsc-error" />
            <Text size="xs" tone="error">
              {errorMessage ?? "Export failed"}
            </Text>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-vsc-panel-border">
          <Button variant="ghost" size="sm" onClick={closeDialog}>
            {isDone ? "Close" : "Cancel"}
          </Button>
          {!isDone && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              data-testid="export-button"
            >
              <Icon name="export" tokenSize="sm" />
              Export
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
});
