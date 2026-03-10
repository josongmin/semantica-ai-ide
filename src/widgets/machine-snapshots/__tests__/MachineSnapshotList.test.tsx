import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { machineSnapshotsAtom } from "../../../features/machine-snapshots";
import { snapshotsPanelVisibleAtom } from "../../../shared/lib/atoms/bottomSheetAtoms";
import type { MachineSnapshot } from "../../../shared/protocol";
import { MachineSnapshotList } from "../MachineSnapshotList";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

function createSnapshot(overrides: Partial<MachineSnapshot> = {}): MachineSnapshot {
  return {
    id: `snap_${Math.random().toString(36).slice(2, 8)}`,
    label: "Test Snapshot",
    created_at_ms: Date.now(),
    size_mb: 128.5,
    status: "ready",
    ...overrides,
  };
}

function renderList(snapshots: MachineSnapshot[] = []) {
  return renderWithAtoms(<MachineSnapshotList />, {
    initialValues: snapshots.length > 0
      ? [[machineSnapshotsAtom, snapshots], [snapshotsPanelVisibleAtom, true]]
      : [[snapshotsPanelVisibleAtom, true]],
  });
}

// ─── Tests ─────────────────────────────────────────────────
describe("MachineSnapshotList", () => {
  it("renders empty state when no snapshots", () => {
    renderList();
    expect(screen.getByTestId("machine-snapshot-list")).toBeInTheDocument();
    expect(screen.getByTestId("snapshot-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No snapshots saved yet.")).toBeInTheDocument();
  });

  it("renders snapshot rows", () => {
    renderList([
      createSnapshot({ id: "s1", label: "Before refactor" }),
      createSnapshot({ id: "s2", label: "After feature" }),
    ]);

    expect(screen.getByTestId("snapshot-row-s1")).toBeInTheDocument();
    expect(screen.getByTestId("snapshot-row-s2")).toBeInTheDocument();
    expect(screen.getByText("Before refactor")).toBeInTheDocument();
    expect(screen.getByText("After feature")).toBeInTheDocument();
  });

  it("shows snapshot size", () => {
    renderList([createSnapshot({ id: "s1", size_mb: 256.3 })]);

    expect(screen.getByText("256.3 MB")).toBeInTheDocument();
  });

  it("Save Snapshot button sends CREATE_SNAPSHOT", async () => {
    const { user } = renderList();

    await user.click(screen.getByLabelText("Save snapshot"));
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "CREATE_SNAPSHOT" }),
    );
  });

  it("Restore button sends RESTORE_SNAPSHOT_ENV", async () => {
    const { user } = renderList([createSnapshot({ id: "s1", label: "Snap 1" })]);

    await user.click(screen.getByLabelText("Restore snapshot: Snap 1"));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "RESTORE_SNAPSHOT_ENV",
      snapshot_id: "s1",
    });
  });

  it("Delete button sends DELETE_SNAPSHOT", async () => {
    const { user } = renderList([createSnapshot({ id: "s1", label: "Snap 1" })]);

    await user.click(screen.getByLabelText("Delete snapshot: Snap 1"));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DELETE_SNAPSHOT",
      snapshot_id: "s1",
    });
  });

  it("disables actions when snapshot is creating", () => {
    renderList([createSnapshot({ id: "s1", label: "Creating", status: "creating" })]);

    expect(screen.getByTestId("snapshot-restore-s1")).toBeDisabled();
    expect(screen.getByTestId("snapshot-delete-s1")).toBeDisabled();
  });

  it("disables actions when snapshot is restoring", () => {
    renderList([createSnapshot({ id: "s1", label: "Restoring", status: "restoring" })]);

    expect(screen.getByTestId("snapshot-restore-s1")).toBeDisabled();
    expect(screen.getByTestId("snapshot-delete-s1")).toBeDisabled();
  });

  it("disables Save Snapshot button when any snapshot is busy", () => {
    renderList([createSnapshot({ id: "s1", status: "creating" })]);

    expect(screen.getByTestId("create-snapshot-button")).toBeDisabled();
  });

  it("renders snapshots sorted newest first", () => {
    renderList([
      createSnapshot({ id: "s1", label: "Old", created_at_ms: 1000 }),
      createSnapshot({ id: "s2", label: "New", created_at_ms: 3000 }),
      createSnapshot({ id: "s3", label: "Mid", created_at_ms: 2000 }),
    ]);

    const rows = screen
      .getByTestId("snapshot-list")
      .querySelectorAll("[data-testid^='snapshot-row-']");
    expect(rows[0]).toHaveAttribute("data-testid", "snapshot-row-s2");
    expect(rows[1]).toHaveAttribute("data-testid", "snapshot-row-s3");
    expect(rows[2]).toHaveAttribute("data-testid", "snapshot-row-s1");
  });
});
