import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RestoreModeDialog } from "../RestoreModeDialog";

// Mock overlay behavior (Dialog uses portal + useOverlayBehavior)
vi.mock("../../../shared/lib/hooks/useOverlayBehavior", () => ({
  useOverlayBehavior: ({ open }: { open: boolean }) => ({
    mounted: open,
    exiting: false,
    handleTabKeyDown: () => {},
  }),
}));

describe("RestoreModeDialog", () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    onConfirm.mockClear();
  });

  function renderDialog(open = true) {
    const user = userEvent.setup();
    const result = render(
      <RestoreModeDialog
        open={open}
        onClose={onClose}
        onConfirm={onConfirm}
        checkpointLabel="v1.0"
      />,
    );
    return { ...result, user };
  }

  it("renders nothing when closed", () => {
    renderDialog(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title and description when open", () => {
    renderDialog(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Restore Checkpoint")).toBeInTheDocument();
    expect(screen.getByText(/Choose what to restore from "v1.0"/)).toBeInTheDocument();
  });

  it("renders all three mode options", () => {
    renderDialog(true);

    expect(screen.getByText("Chat only")).toBeInTheDocument();
    expect(screen.getByText("Code only")).toBeInTheDocument();
    expect(screen.getByText("Both")).toBeInTheDocument();
  });

  it("renders descriptions for each mode", () => {
    renderDialog(true);

    expect(
      screen.getByText("Restore conversation history, keep current file changes"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Restore files to checkpoint state, keep conversation"),
    ).toBeInTheDocument();
    expect(screen.getByText("Restore everything to checkpoint state")).toBeInTheDocument();
  });

  it("defaults to 'both' mode selected", () => {
    renderDialog(true);

    const radioGroup = screen.getByRole("radiogroup", { name: "Restore mode" });
    expect(radioGroup).toBeInTheDocument();

    const bothRadio = screen.getByRole("radio", { name: "Both" });
    expect(bothRadio).toBeChecked();
  });

  it("allows selecting different modes", async () => {
    const { user } = renderDialog(true);

    const chatRadio = screen.getByRole("radio", { name: "Chat only" });
    await user.click(chatRadio);
    expect(chatRadio).toBeChecked();

    const codeRadio = screen.getByRole("radio", { name: "Code only" });
    await user.click(codeRadio);
    expect(codeRadio).toBeChecked();
    expect(chatRadio).not.toBeChecked();
  });

  it("Confirm calls onConfirm with selected mode", async () => {
    const { user } = renderDialog(true);

    // Select "chat" mode
    await user.click(screen.getByRole("radio", { name: "Chat only" }));

    // Click Restore
    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith("chat");
  });

  it("Confirm with default mode calls onConfirm with 'both'", async () => {
    const { user } = renderDialog(true);

    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(onConfirm).toHaveBeenCalledWith("both");
  });

  it("Cancel calls onClose", async () => {
    const { user } = renderDialog(true);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("selecting 'code' mode and confirming calls onConfirm with 'code'", async () => {
    const { user } = renderDialog(true);

    await user.click(screen.getByRole("radio", { name: "Code only" }));
    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(onConfirm).toHaveBeenCalledWith("code");
  });
});
