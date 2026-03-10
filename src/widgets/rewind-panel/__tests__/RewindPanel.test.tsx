import { fireEvent, screen } from "@testing-library/react";

import { checkpointsAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils";
import { rewindPanelOpenAtom } from "../../../features/rewind";
import type * as SharedLib from "../../../shared/lib";
import { createCheckpoint, resetIdCounter } from "../../../shared/lib/mocks";
import { RewindPanel } from "../RewindPanel";

// Mock getVscodeApi
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedLib>()),
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// Mock overlay behavior for Dialog
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

function renderRewindPanel(cpCount: number, open = true) {
  const checkpoints = Array.from({ length: cpCount }, (_, i) =>
    createCheckpoint({
      id: `cp_${i}`,
      label: `Before step ${i}`,
      timestamp_ms: Date.now() - (cpCount - i) * 60_000, // older first
    }),
  );

  return renderWithAtoms(<RewindPanel />, {
    initialValues: [
      [checkpointsAtom, checkpoints],
      [rewindPanelOpenAtom, open],
    ],
  });
}

describe("RewindPanel", () => {
  it("renders nothing when closed", () => {
    const { container } = renderRewindPanel(3, false);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog with checkpoints when open", () => {
    renderRewindPanel(3);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Restore your session to a previous checkpoint")).toBeInTheDocument();
    expect(screen.getByTestId("rewind-cp-cp_0")).toBeInTheDocument();
    expect(screen.getByTestId("rewind-cp-cp_1")).toBeInTheDocument();
    expect(screen.getByTestId("rewind-cp-cp_2")).toBeInTheDocument();
  });

  it("shows empty state when no checkpoints", () => {
    renderRewindPanel(0);

    expect(screen.getByText("No checkpoints yet")).toBeInTheDocument();
  });

  it("shows checkpoint count in footer", () => {
    renderRewindPanel(5);

    expect(screen.getByText("5 checkpoints")).toBeInTheDocument();
  });

  it("selects a checkpoint on click and shows mode options", () => {
    renderRewindPanel(3);

    // Click a checkpoint
    fireEvent.click(screen.getByTestId("rewind-cp-cp_1"));

    // Mode options should appear
    expect(screen.getByText("Everything")).toBeInTheDocument();
    expect(screen.getByText("Code only")).toBeInTheDocument();
    expect(screen.getByText("Chat only")).toBeInTheDocument();
  });

  it("deselects checkpoint when clicking same one again", () => {
    renderRewindPanel(3);

    fireEvent.click(screen.getByTestId("rewind-cp-cp_1"));
    expect(screen.getByText("Everything")).toBeInTheDocument();

    // Click same checkpoint again
    fireEvent.click(screen.getByTestId("rewind-cp-cp_1"));
    expect(screen.queryByText("Everything")).not.toBeInTheDocument();
  });

  it("Rewind button is disabled when no checkpoint selected", () => {
    renderRewindPanel(3);

    const rewindBtn = screen.getByRole("button", { name: "Rewind" });
    expect(rewindBtn).toBeDisabled();
  });

  it("sends RESTORE_CHECKPOINT on Rewind click", () => {
    renderRewindPanel(3);

    // Select checkpoint
    fireEvent.click(screen.getByTestId("rewind-cp-cp_1"));

    // "Both" mode is selected by default, click Rewind
    fireEvent.click(screen.getByRole("button", { name: "Rewind" }));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "RESTORE_CHECKPOINT",
      checkpoint_id: "cp_1",
      mode: "both",
    });
  });

  it("sends correct mode when switching to code-only", () => {
    renderRewindPanel(3);

    fireEvent.click(screen.getByTestId("rewind-cp-cp_0"));

    // Select "Code only" radio
    const codeRadio = screen.getByRole("radio", { name: "Code only" });
    fireEvent.click(codeRadio);

    fireEvent.click(screen.getByRole("button", { name: "Rewind" }));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "RESTORE_CHECKPOINT",
      checkpoint_id: "cp_0",
      mode: "code",
    });
  });

  it("navigates checkpoints with arrow keys", () => {
    renderRewindPanel(3);

    const listbox = screen.getByRole("listbox");

    // Arrow down twice, then Enter to select
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    fireEvent.keyDown(listbox, { key: "Enter" });

    // Mode options should appear (checkpoint selected)
    expect(screen.getByText("Everything")).toBeInTheDocument();
  });

  it("sorts checkpoints newest first", () => {
    renderRewindPanel(3);

    const options = screen.getAllByRole("option");
    // cp_2 has highest timestamp → should be first
    expect(options[0]).toHaveAttribute("data-testid", "rewind-cp-cp_2");
    expect(options[2]).toHaveAttribute("data-testid", "rewind-cp-cp_0");
  });
});
