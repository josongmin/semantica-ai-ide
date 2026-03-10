import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { ConfirmDialog } from "../ConfirmDialog";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("ConfirmDialog", () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    onConfirm.mockClear();
    onCancel.mockClear();
  });

  const renderConfirmDialog = (props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) =>
    render(
      <ConfirmDialog
        open
        title="Confirm Action"
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />,
      { wrapper: JotaiWrapper },
    );

  it("renders nothing when open is false", () => {
    renderConfirmDialog({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with title when open", () => {
    renderConfirmDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    renderConfirmDialog({ description: "Are you sure you want to proceed?" });
    expect(screen.getByText("Are you sure you want to proceed?")).toBeInTheDocument();
  });

  it('renders default "Confirm" and "Cancel" button labels', () => {
    renderConfirmDialog();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders custom confirm and cancel labels", () => {
    renderConfirmDialog({ confirmLabel: "Delete", cancelLabel: "Keep" });
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Keep")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", async () => {
    const user = userEvent.setup();
    renderConfirmDialog();

    await user.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    renderConfirmDialog();

    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel on Escape press (via Dialog)", async () => {
    const user = userEvent.setup();
    renderConfirmDialog();

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel on backdrop click", () => {
    renderConfirmDialog();
    const backdrop = screen.getByTestId("dialog-backdrop");
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders children content", () => {
    renderConfirmDialog({ children: <p>Extra information</p> });
    expect(screen.getByText("Extra information")).toBeInTheDocument();
  });

  it('confirm button uses danger variant when confirmVariant="danger"', () => {
    renderConfirmDialog({ confirmVariant: "danger" });
    const confirmButton = screen.getByText("Confirm");
    // The danger variant applies "bg-vsc-error/20 text-vsc-error" classes
    expect(confirmButton.className).toMatch(/vsc-error/);
  });
});
