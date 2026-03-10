import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { SlideDrawer } from "../SlideDrawer";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("SlideDrawer", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  const renderDrawer = (props: Partial<React.ComponentProps<typeof SlideDrawer>> = {}) =>
    render(
      <SlideDrawer open title="Test Drawer" onClose={onClose} {...props}>
        <p>Drawer content</p>
      </SlideDrawer>,
      { wrapper: JotaiWrapper },
    );

  it("renders nothing when open is false", () => {
    renderDrawer({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title when open", () => {
    renderDrawer();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Drawer")).toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to title text", () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog");
    const titleId = dialog.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)).toHaveTextContent("Test Drawer");
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    renderDrawer();
    const backdrop = screen.getByTestId("drawer-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when drawer content is clicked", () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button with aria-label="Close drawer"', () => {
    renderDrawer();
    const closeBtn = screen.getByLabelText("Close drawer");
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn.tagName).toBe("BUTTON");
  });

  it("renders children inside drawer", () => {
    renderDrawer();
    expect(screen.getByText("Drawer content")).toBeInTheDocument();
  });

  it('applies side="left" classes (border-r, rounded-r-lg)', () => {
    renderDrawer({ side: "left" });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("border-r");
    expect(dialog).toHaveClass("rounded-r-lg");
  });

  it('applies side="right" classes (border-l, rounded-l-lg) by default', () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("border-l");
    expect(dialog).toHaveClass("rounded-l-lg");
  });

  it('applies width class w-[400px] for "md" default', () => {
    renderDrawer();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("w-[400px]");
  });
});
