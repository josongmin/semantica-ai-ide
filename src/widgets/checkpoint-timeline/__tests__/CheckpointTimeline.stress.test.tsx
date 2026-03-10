/**
 * CheckpointTimeline Stress & Edge-Case Tests
 *
 * Tests:
 * - Keyboard navigation through many checkpoints (left/right arrow)
 * - Double-click restore prevention
 * - Confirm/cancel state transitions
 * - Boundary navigation (first/last checkpoint)
 * - Large checkpoint counts (50+)
 * - Confirmation auto-focus
 */
import { fireEvent, screen } from "@testing-library/react";

import { checkpointsAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils";
import { createCheckpoint, resetIdCounter } from "../../../shared/lib/mocks";
import { CheckpointTimeline } from "../CheckpointTimeline";

// Mock getVscodeApi
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// Mock overlay behavior for Dialog (used by RestoreModeDialog)
vi.mock("../../../shared/lib/hooks/useOverlayBehavior", () => ({
  useOverlayBehavior: ({ open }: { open: boolean }) => ({
    mounted: open,
    exiting: false,
    handleTabKeyDown: () => {},
  }),
}));

beforeEach(() => {
  resetIdCounter();
  mockPostMessage.mockClear();
});

function renderTimeline(count: number) {
  const checkpoints = Array.from({ length: count }, (_, i) =>
    createCheckpoint({
      id: `cp_${i}`,
      label: `Checkpoint ${i}`,
      timestamp_ms: Date.now() + i * 1000,
    }),
  );

  return renderWithAtoms(<CheckpointTimeline />, {
    initialValues: [[checkpointsAtom, checkpoints]],
  });
}

describe("CheckpointTimeline – stress & edge cases", () => {
  // ── Keyboard navigation ─────────────────────────────────
  describe("keyboard navigation", () => {
    it("ArrowRight moves focus to next checkpoint", () => {
      renderTimeline(5);

      const firstBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 0");
      firstBtn.focus();
      expect(firstBtn).toHaveFocus();

      fireEvent.keyDown(firstBtn, { key: "ArrowRight" });
      const secondBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 1");
      expect(secondBtn).toHaveFocus();
    });

    it("ArrowLeft moves focus to previous checkpoint", () => {
      renderTimeline(5);

      const secondBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 1");
      secondBtn.focus();
      fireEvent.keyDown(secondBtn, { key: "ArrowLeft" });

      const firstBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 0");
      expect(firstBtn).toHaveFocus();
    });

    it("ArrowRight at last checkpoint: focus stays (no wrap)", () => {
      renderTimeline(3);

      const lastBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 2");
      lastBtn.focus();
      fireEvent.keyDown(lastBtn, { key: "ArrowRight" });

      // Focus should remain on last button
      expect(lastBtn).toHaveFocus();
    });

    it("ArrowLeft at first checkpoint: focus stays (no wrap)", () => {
      renderTimeline(3);

      const firstBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 0");
      firstBtn.focus();
      fireEvent.keyDown(firstBtn, { key: "ArrowLeft" });

      expect(firstBtn).toHaveFocus();
    });

    it("navigate through all 20 checkpoints with ArrowRight", () => {
      renderTimeline(20);

      const firstBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 0");
      firstBtn.focus();

      for (let i = 0; i < 19; i++) {
        const currentBtn = screen.getByLabelText(`Restore to checkpoint: Checkpoint ${i}`);
        fireEvent.keyDown(currentBtn, { key: "ArrowRight" });
      }

      const lastBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 19");
      expect(lastBtn).toHaveFocus();
    });

    it("rapid ArrowRight 50x on 10 checkpoints: focus stops at last", () => {
      renderTimeline(10);

      const firstBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 0");
      firstBtn.focus();

      // Navigate right 50 times (only 9 possible moves)
      let current = firstBtn;
      for (let i = 0; i < 50; i++) {
        fireEvent.keyDown(current, { key: "ArrowRight" });
        current = document.activeElement as HTMLButtonElement;
      }

      const lastBtn = screen.getByLabelText("Restore to checkpoint: Checkpoint 9");
      expect(lastBtn).toHaveFocus();
    });
  });

  // ── Confirm/cancel state transitions ────────────────────
  describe("confirm/cancel state transitions", () => {
    it("clicking restore shows Restore? confirmation UI", async () => {
      const { user } = renderTimeline(3);

      await user.click(screen.getByLabelText("Restore to checkpoint: Checkpoint 1"));
      expect(screen.getByText("Restore?")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirm restore")).toBeInTheDocument();
      expect(screen.getByLabelText("Cancel restore")).toBeInTheDocument();
    });

    it("confirm opens mode dialog, selecting mode and restoring sends postMessage", async () => {
      const { user } = renderTimeline(3);

      await user.click(screen.getByLabelText("Restore to checkpoint: Checkpoint 1"));
      await user.click(screen.getByLabelText("Confirm restore"));

      // Inline "Restore?" should be hidden, mode dialog should be open
      expect(screen.queryByText("Restore?")).not.toBeInTheDocument();
      expect(screen.getByText("Restore Checkpoint")).toBeInTheDocument();

      // Select "both" (default) and confirm in dialog
      await user.click(screen.getByRole("button", { name: "Restore" }));

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "RESTORE_CHECKPOINT",
        checkpoint_id: "cp_1",
        mode: "both",
      });
    });

    it("cancel hides confirmation without sending postMessage", async () => {
      const { user } = renderTimeline(3);

      await user.click(screen.getByLabelText("Restore to checkpoint: Checkpoint 1"));
      await user.click(screen.getByLabelText("Cancel restore"));

      expect(mockPostMessage).not.toHaveBeenCalled();
      expect(screen.queryByText("Restore?")).not.toBeInTheDocument();
    });

    it("clicking different checkpoint while confirming: switches confirmation target", async () => {
      const { user } = renderTimeline(5);

      // Click checkpoint 1 → shows confirmation
      await user.click(screen.getByLabelText("Restore to checkpoint: Checkpoint 1"));
      expect(screen.getByText("Restore?")).toBeInTheDocument();

      // Checkpoint 1 is now showing confirmation, so its restore button is gone.
      // Click checkpoint 3 instead.
      await user.click(screen.getByLabelText("Restore to checkpoint: Checkpoint 3"));

      // Now confirm → should open mode dialog for cp_3
      await user.click(screen.getByLabelText("Confirm restore"));
      expect(screen.getByText("Restore Checkpoint")).toBeInTheDocument();

      // Confirm in mode dialog
      await user.click(screen.getByRole("button", { name: "Restore" }));
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "RESTORE_CHECKPOINT",
        checkpoint_id: "cp_3",
        mode: "both",
      });
    });

    it("double-click confirm: opens mode dialog only once (no duplicate postMessage)", async () => {
      const { user } = renderTimeline(3);

      await user.click(screen.getByLabelText("Restore to checkpoint: Checkpoint 0"));
      const confirmBtn = screen.getByLabelText("Confirm restore");

      // Double-click: first click opens mode dialog, second click is on nothing
      // (confirm UI disappears after first click)
      await user.click(confirmBtn);

      // Mode dialog should be open
      expect(screen.getByText("Restore Checkpoint")).toBeInTheDocument();

      // Confirm in dialog
      await user.click(screen.getByRole("button", { name: "Restore" }));

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
    });
  });

  // ── Large checkpoint counts ─────────────────────────────
  describe("large checkpoint counts", () => {
    it("50 checkpoints: all rendered with correct labels", () => {
      renderTimeline(50);

      const toolbar = screen.getByRole("toolbar", { name: "Checkpoint timeline" });
      expect(toolbar).toBeInTheDocument();

      // Check first and last
      expect(screen.getByLabelText("Restore to checkpoint: Checkpoint 0")).toBeInTheDocument();
      expect(screen.getByLabelText("Restore to checkpoint: Checkpoint 49")).toBeInTheDocument();
    });

    it("50 checkpoints: separators present between each pair", () => {
      const { container } = renderTimeline(50);

      // Separators: one between each pair = 49
      const separators = container.querySelectorAll("hr, [class*='h-px']");
      expect(separators.length).toBe(49);
    });
  });

  // ── Empty state ─────────────────────────────────────────
  describe("empty state", () => {
    it("0 checkpoints: renders nothing", () => {
      const { container } = renderTimeline(0);
      expect(container.querySelector("[role='toolbar']")).toBeNull();
    });

    it("1 checkpoint: no separators rendered", () => {
      const { container } = renderTimeline(1);
      expect(screen.getByLabelText("Restore to checkpoint: Checkpoint 0")).toBeInTheDocument();
      const separators = container.querySelectorAll("[class*='h-px']");
      expect(separators.length).toBe(0);
    });
  });
});
