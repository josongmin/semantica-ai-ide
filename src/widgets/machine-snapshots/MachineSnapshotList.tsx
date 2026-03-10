import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { isSnapshotBusyAtom, sortedSnapshotsAtom } from "../../features/machine-snapshots";
import { getVscodeApi } from "../../shared/lib";
import type { MachineSnapshot } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";

// ─── Snapshot Row ────────────────────────────────────────────

const SnapshotRow = React.memo(function SnapshotRow({
  snapshot,
  onRestore,
  onDelete,
}: {
  snapshot: MachineSnapshot;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isBusy = snapshot.status !== "ready";

  const handleRestore = useCallback(() => {
    onRestore(snapshot.id);
  }, [snapshot.id, onRestore]);

  const handleDelete = useCallback(() => {
    onDelete(snapshot.id);
  }, [snapshot.id, onDelete]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 border-b border-vsc-border last:border-b-0",
        isBusy && "opacity-60",
      )}
      data-testid={`snapshot-row-${snapshot.id}`}
    >
      {/* Status indicator */}
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full shrink-0",
          snapshot.status === "ready" && "bg-vsc-success",
          snapshot.status === "creating" && "bg-vsc-warning animate-pulse",
          snapshot.status === "restoring" && "bg-vsc-info animate-pulse",
        )}
        aria-label={`Status: ${snapshot.status}`}
      />

      {/* Info */}
      <div className="flex flex-col flex-1 min-w-0">
        <Text size="xs" weight="medium" className="truncate min-w-0">
          {snapshot.label}
        </Text>
        <div className="flex items-center gap-2">
          <Text size="xs" tone="tertiary">
            {formatDate(snapshot.created_at_ms)}
          </Text>
          <Text size="xs" tone="tertiary">
            {snapshot.size_mb.toFixed(1)} MB
          </Text>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestore}
          disabled={isBusy}
          aria-label={`Restore snapshot: ${snapshot.label}`}
          data-testid={`snapshot-restore-${snapshot.id}`}
        >
          <Icon name="history" tokenSize="sm" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isBusy}
          aria-label={`Delete snapshot: ${snapshot.label}`}
          data-testid={`snapshot-delete-${snapshot.id}`}
        >
          <Icon name="trash" tokenSize="sm" />
        </Button>
      </div>
    </div>
  );
});

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Main Component ─────────────────────────────────────────

/**
 * MachineSnapshotList - List of saved development environment snapshots.
 *
 * Displays snapshots with save/restore/delete actions and status indicators.
 */
export const MachineSnapshotList = React.memo(function MachineSnapshotList() {
  const snapshots = useAtomValue(sortedSnapshotsAtom);
  const isBusy = useAtomValue(isSnapshotBusyAtom);

  const handleCreateSnapshot = useCallback(() => {
    const label = `Snapshot ${new Date().toLocaleString()}`;
    getVscodeApi().postMessage({ type: "CREATE_SNAPSHOT", label });
  }, []);

  const handleRestore = useCallback((id: string) => {
    getVscodeApi().postMessage({ type: "RESTORE_SNAPSHOT_ENV", snapshot_id: id });
  }, []);

  const handleDelete = useCallback((id: string) => {
    getVscodeApi().postMessage({ type: "DELETE_SNAPSHOT", snapshot_id: id });
  }, []);

  return (
    <div
      className="flex flex-col border border-vsc-border rounded bg-vsc-bg"
      data-testid="machine-snapshot-list"
      role="region"
      aria-label="Machine snapshots"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-vsc-border">
        <Icon name="save" tokenSize="sm" />
        <Text size="xs" weight="medium" className="flex-1">
          Snapshots
        </Text>
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreateSnapshot}
          disabled={isBusy}
          aria-label="Save snapshot"
          data-testid="create-snapshot-button"
        >
          <Icon name="add" tokenSize="sm" />
          Save
        </Button>
      </div>

      {/* List */}
      {snapshots.length === 0 ? (
        <div className="px-2 py-4 text-center" data-testid="snapshot-empty-state">
          <Text size="xs" tone="tertiary">
            No snapshots saved yet.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col max-h-[--panel-max-h-sm] overflow-y-auto scroll-shadow" data-testid="snapshot-list">
          {snapshots.map((snapshot) => (
            <SnapshotRow
              key={snapshot.id}
              snapshot={snapshot}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});
