import { screen } from "@testing-library/react";

import { checkpointsAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils";
import { createCheckpoint, resetIdCounter } from "../../../shared/lib/mocks";
import { CheckpointTimeline } from "../CheckpointTimeline";

// Mock getVscodeApi
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => resetIdCounter());

describe("CheckpointTimeline", () => {
  it("renders checkpoints with labels", () => {
    const checkpoints = [
      createCheckpoint({
        id: "cp_1",
        label: "Before refactor",
        timestamp_ms: Date.now(),
      }),
      createCheckpoint({
        id: "cp_2",
        label: "After tests pass",
        timestamp_ms: Date.now(),
      }),
    ];

    renderWithAtoms(<CheckpointTimeline />, {
      initialValues: [[checkpointsAtom, checkpoints]],
    });

    const toolbar = screen.getByRole("toolbar", { name: "Checkpoint timeline" });
    expect(toolbar).toBeInTheDocument();

    expect(screen.getByText("Before refactor")).toBeInTheDocument();
    expect(screen.getByText("After tests pass")).toBeInTheDocument();
  });

  it("renders restore buttons with proper aria-labels", () => {
    const checkpoints = [
      createCheckpoint({
        id: "cp_1",
        label: "Initial state",
        timestamp_ms: Date.now(),
      }),
    ];

    renderWithAtoms(<CheckpointTimeline />, {
      initialValues: [[checkpointsAtom, checkpoints]],
    });

    expect(screen.getByLabelText("Restore to checkpoint: Initial state")).toBeInTheDocument();
  });

  it("clicking restore shows confirmation UI", async () => {
    const checkpoints = [
      createCheckpoint({
        id: "cp_1",
        label: "Checkpoint A",
        timestamp_ms: Date.now(),
      }),
    ];

    const { user } = renderWithAtoms(<CheckpointTimeline />, {
      initialValues: [[checkpointsAtom, checkpoints]],
    });

    await user.click(screen.getByLabelText("Restore to checkpoint: Checkpoint A"));

    expect(screen.getByText("Restore?")).toBeInTheDocument();
  });

  it("returns null when no checkpoints exist (empty state)", () => {
    const { container } = renderWithAtoms(<CheckpointTimeline />, {
      initialValues: [[checkpointsAtom, []]],
    });

    expect(container.querySelector("[role='toolbar']")).toBeNull();
  });
});
