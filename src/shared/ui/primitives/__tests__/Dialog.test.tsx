import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { Dialog } from "../Dialog";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("Dialog", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  const renderDialog = (props: Partial<React.ComponentProps<typeof Dialog>> = {}) =>
    render(
      <Dialog open title="Test Dialog" onClose={onClose} {...props}>
        <button type="button">Action</button>
      </Dialog>,
      { wrapper: JotaiWrapper },
    );

  it("renders nothing when open is false", () => {
    renderDialog({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title when open", () => {
    renderDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    renderDialog({ description: "Dialog description" });
    expect(screen.getByText("Dialog description")).toBeInTheDocument();
  });

  it("has aria-modal and role=dialog", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to title", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    const titleId = dialog.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)).toHaveTextContent("Test Dialog");
  });

  it("has aria-describedby when description is provided", () => {
    renderDialog({ description: "Desc text" });
    const dialog = screen.getByRole("dialog");
    const descId = dialog.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();
    expect(document.getElementById(descId!)).toHaveTextContent("Desc text");
  });

  it("does not have aria-describedby when no description", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    expect(dialog).not.toHaveAttribute("aria-describedby");
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    renderDialog();
    const backdrop = screen.getByTestId("dialog-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when dialog content is clicked", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders children inside dialog", () => {
    renderDialog();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("traps focus — Tab wraps from last to first", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open title="Focus Trap" onClose={onClose}>
        <button type="button">First</button>
        <button type="button">Second</button>
      </Dialog>,
      { wrapper: JotaiWrapper },
    );

    // Focus should be inside dialog
    const first = screen.getByText("First");
    const second = screen.getByText("Second");

    first.focus();
    expect(document.activeElement).toBe(first);

    await user.tab();
    expect(document.activeElement).toBe(second);

    await user.tab();
    expect(document.activeElement).toBe(first);
  });
});
