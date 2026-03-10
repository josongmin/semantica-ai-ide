import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { checkpointsAtom } from "~entities/session/state";

import { useCheckpointRestore } from "../../features/checkpoint-restore";
import { rewindPanelOpenAtom } from "../../features/rewind";
import type { Checkpoint, RestoreMode } from "../../shared/protocol";
import { Button, cn, Dialog, Icon, Text } from "../../shared/ui";

// ─── Mode options (same semantics as RestoreModeDialog) ──────

interface ModeOption {
  readonly mode: RestoreMode;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
}

const MODE_OPTIONS: readonly ModeOption[] = [
  {
    mode: "both",
    label: "Everything",
    description: "Restore files and conversation to this point",
    icon: "history",
  },
  {
    mode: "code",
    label: "Code only",
    description: "Restore files, keep current conversation",
    icon: "file-code",
  },
  {
    mode: "chat",
    label: "Chat only",
    description: "Restore conversation, keep current files",
    icon: "comment-discussion",
  },
];

// ─── Helpers ─────────────────────────────────────────────────

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Checkpoint Row ──────────────────────────────────────────

interface CheckpointRowProps {
  checkpoint: Checkpoint;
  selected: boolean;
  focused: boolean;
  onSelect: (id: string) => void;
}

const CheckpointRow = React.memo(function CheckpointRow({
  checkpoint,
  selected,
  focused,
  onSelect,
}: CheckpointRowProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const prevFocusedRef = useRef(false);

  // Only call focus() on the transition from unfocused → focused,
  // not on every render while focused remains true.
  useEffect(() => {
    if (focused && !prevFocusedRef.current) {
      ref.current?.focus();
    }
    prevFocusedRef.current = focused;
  }, [focused]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(checkpoint.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md",
        "transition-colors duration-fast cursor-pointer focus-ring",
        selected
          ? "bg-vsc-focus/10 ring-1 ring-vsc-focus"
          : "hover:bg-vsc-list-hover",
      )}
      aria-selected={selected}
      role="option"
      data-testid={`rewind-cp-${checkpoint.id}`}
    >
      <Icon
        name={selected ? "debug-restart" : "bookmark"}
        tokenSize="sm"
        className={cn(
          "shrink-0",
          selected ? "text-vsc-focus" : "text-vsc-text-tertiary",
        )}
      />
      <div className="flex-1 min-w-0">
        <Text size="sm" weight="medium" tone={selected ? "primary" : "secondary"} truncate>
          {checkpoint.label}
        </Text>
        <Text size="2xs" tone="ghost" mono>
          {relativeTime(checkpoint.timestamp_ms)}
        </Text>
      </div>
      {selected && (
        <Icon name="chevron-right" tokenSize="xs" className="text-vsc-focus shrink-0" />
      )}
    </button>
  );
});

// ─── RewindPanel ─────────────────────────────────────────────

/**
 * Rewind panel — Claude Code-style checkpoint restore dialog.
 * Opened via `/rewind` slash command or Ctrl+Shift+Z.
 * Two-step flow: select checkpoint → choose restore mode → confirm.
 */
export const RewindPanel = React.memo(function RewindPanel() {
  const open = useAtomValue(rewindPanelOpenAtom);

  if (!open) return null;

  // key={String(open)} ensures all internal state (selectedCpId, selectedMode,
  // focusIndex) resets automatically when the panel re-opens, replacing the
  // previous useEffect-based reset antipattern.
  return <RewindPanelBody key={String(open)} />;
});

/** Inner body extracted so that key-based remounting resets all local state. */
const RewindPanelBody = React.memo(function RewindPanelBody() {
  const open = useAtomValue(rewindPanelOpenAtom);
  const setOpen = useSetAtom(rewindPanelOpenAtom);
  const checkpoints = useAtomValue(checkpointsAtom);
  const { restoreCheckpoint } = useCheckpointRestore();

  const [selectedCpId, setSelectedCpId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<RestoreMode>("both");
  const [focusIndex, setFocusIndex] = useState(0);

  // Reverse chronological order (newest first)
  const sortedCheckpoints = useMemo(
    () => [...checkpoints].sort((a, b) => b.timestamp_ms - a.timestamp_ms),
    [checkpoints],
  );

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleSelect = useCallback((id: string) => {
    setSelectedCpId((prev) => (prev === id ? null : id));
  }, []);

  const handleRestore = useCallback(() => {
    if (!selectedCpId) return;
    restoreCheckpoint(selectedCpId, selectedMode);
    setOpen(false);
  }, [selectedCpId, selectedMode, restoreCheckpoint, setOpen]);

  const selectedCp = useMemo(
    () => sortedCheckpoints.find((cp) => cp.id === selectedCpId),
    [sortedCheckpoints, selectedCpId],
  );

  // Keyboard navigation inside the list
  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, sortedCheckpoints.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && sortedCheckpoints[focusIndex]) {
        e.preventDefault();
        handleSelect(sortedCheckpoints[focusIndex].id);
      }
    },
    [sortedCheckpoints, focusIndex, handleSelect],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Rewind"
      description="Restore your session to a previous checkpoint"
      maxWidth="lg"
    >
      {sortedCheckpoints.length === 0 ? (
        /* Empty state */
        <div className="py-8 text-center">
          <Icon name="history" tokenSize="sm" className="text-vsc-text-ghost mx-auto mb-2" />
          <Text size="sm" tone="tertiary">
            No checkpoints yet
          </Text>
          <Text size="2xs" tone="ghost" className="mt-1">
            Checkpoints are created automatically as the agent works.
          </Text>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Checkpoint list */}
          <div
            role="listbox"
            aria-label="Checkpoints"
            onKeyDown={handleListKeyDown}
            className="max-h-[--panel-max-h-sm] overflow-y-auto space-y-0.5 rounded-md border border-vsc-border p-1 scroll-shadow"
          >
            {sortedCheckpoints.map((cp, i) => (
              <CheckpointRow
                key={cp.id}
                checkpoint={cp}
                selected={selectedCpId === cp.id}
                focused={focusIndex === i}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Mode selection — visible when a checkpoint is selected */}
          {selectedCp && (
            <div className="animate-[fade-in_0.15s_ease]">
              <Text size="2xs" tone="ghost" weight="medium" className="mb-1.5 px-1">
                Restore mode for "{selectedCp.label}"
              </Text>
              <div className="space-y-1">
                {MODE_OPTIONS.map((opt) => (
                  <label
                    key={opt.mode}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md border cursor-pointer",
                      "transition-colors duration-fast",
                      selectedMode === opt.mode
                        ? "border-vsc-focus bg-vsc-focus/5"
                        : "border-vsc-border hover:bg-vsc-list-hover",
                    )}
                  >
                    <input
                      type="radio"
                      name="rewind-mode"
                      value={opt.mode}
                      checked={selectedMode === opt.mode}
                      onChange={() => setSelectedMode(opt.mode)}
                      className="accent-[var(--vscode-focusBorder)]"
                      aria-label={opt.label}
                    />
                    <Icon name={opt.icon} tokenSize="sm" className="text-vsc-text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Text size="xs" weight="medium">{opt.label}</Text>
                      <Text size="2xs" tone="tertiary">{opt.description}</Text>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-vsc-border">
        <Text size="2xs" tone="ghost">
          {sortedCheckpoints.length} checkpoint{sortedCheckpoints.length !== 1 ? "s" : ""}
        </Text>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRestore}
            disabled={!selectedCpId}
          >
            Rewind
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
