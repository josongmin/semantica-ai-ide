import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { BottomSheet } from "../BottomSheet";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("BottomSheet", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  const renderSheet = (props: Partial<React.ComponentProps<typeof BottomSheet>> = {}) =>
    render(
      <BottomSheet open title="Test Sheet" onClose={onClose} {...props}>
        <p>Sheet content</p>
      </BottomSheet>,
      { wrapper: JotaiWrapper },
    );

  it("renders nothing when open is false", () => {
    renderSheet({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title when open", () => {
    renderSheet();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Sheet")).toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to title text", () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    const titleId = dialog.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)).toHaveTextContent("Test Sheet");
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    renderSheet();
    const backdrop = screen.getByTestId("bottom-sheet-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when sheet content is clicked", () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button with aria-label="Close"', () => {
    renderSheet();
    const closeBtn = screen.getByLabelText("Close");
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn.tagName).toBe("BUTTON");
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders handle bar with data-sheet-handle attribute", () => {
    renderSheet();
    const handle = document.querySelector("[data-sheet-handle]");
    expect(handle).toBeInTheDocument();
  });

  it("renders children inside scrollable content", () => {
    renderSheet();
    expect(screen.getByText("Sheet content")).toBeInTheDocument();
  });

  it("uses onOpenChange(false) when provided instead of onClose", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <BottomSheet open title="Change Sheet" onOpenChange={onOpenChange}>
        <p>Content</p>
      </BottomSheet>,
      { wrapper: JotaiWrapper },
    );

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies max-h-[75vh] for "full" snap point (default)', () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("max-h-[75vh]");
  });

  it('applies max-h-[40vh] for "half" snap point', () => {
    renderSheet({ snapPoints: ["half"] });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("max-h-[40vh]");
  });
});
