import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { FeaturePanel } from "../FeaturePanel";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("FeaturePanel", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  const renderPanel = (props: Partial<React.ComponentProps<typeof FeaturePanel>> = {}) =>
    render(
      <FeaturePanel open title="Test Panel" onClose={onClose} {...props}>
        <p>Panel body</p>
      </FeaturePanel>,
      { wrapper: JotaiWrapper },
    );

  it("renders nothing when open is false", () => {
    renderPanel({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title when open", () => {
    renderPanel();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Panel")).toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    renderPanel();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to title text", () => {
    renderPanel();
    const dialog = screen.getByRole("dialog");
    const titleId = dialog.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)).toHaveTextContent("Test Panel");
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    renderPanel();
    const backdrop = screen.getByTestId("feature-panel-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when panel content is clicked", () => {
    renderPanel();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders close button with aria-label="Close"', () => {
    renderPanel();
    const closeBtn = screen.getByRole("button", { name: "Close" });
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute("aria-label", "Close");
  });

  it("renders children inside panel", () => {
    renderPanel();
    expect(screen.getByText("Panel body")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    renderPanel({ icon: "settings-gear" });
    const dialog = screen.getByRole("dialog");
    const iconEl = dialog.querySelector(".codicon.codicon-settings-gear");
    expect(iconEl).toBeInTheDocument();
  });
});
