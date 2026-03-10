import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { AlertDialog } from "../AlertDialog";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("AlertDialog", () => {
  const renderAlertDialog = (props: Partial<React.ComponentProps<typeof AlertDialog>> = {}) =>
    render(
      <AlertDialog open title="Critical Error" {...props}>
        <button type="button">Acknowledge</button>
      </AlertDialog>,
      { wrapper: JotaiWrapper },
    );

  it("renders nothing when open is false", () => {
    renderAlertDialog({ open: false });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("renders alertdialog when open", () => {
    renderAlertDialog();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Critical Error")).toBeInTheDocument();
  });

  it('has role="alertdialog" and aria-modal="true"', () => {
    renderAlertDialog();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAttribute("role", "alertdialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-labelledby pointing to title", () => {
    renderAlertDialog();
    const dialog = screen.getByRole("alertdialog");
    const titleId = dialog.getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    expect(document.getElementById(titleId!)).toHaveTextContent("Critical Error");
  });

  it("has aria-describedby when description provided", () => {
    renderAlertDialog({ description: "Something went wrong." });
    const dialog = screen.getByRole("alertdialog");
    const descId = dialog.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();
    expect(document.getElementById(descId!)).toHaveTextContent("Something went wrong.");
  });

  it("does not have aria-describedby when no description", () => {
    renderAlertDialog();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).not.toHaveAttribute("aria-describedby");
  });

  it("does NOT close on Escape press", async () => {
    const user = userEvent.setup();
    renderAlertDialog();

    await user.keyboard("{Escape}");
    // AlertDialog should still be in the DOM after Escape
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("does NOT close on backdrop click", () => {
    renderAlertDialog();
    const backdrop = screen.getByTestId("alertdialog-backdrop");
    fireEvent.click(backdrop);
    // AlertDialog should still be in the DOM after backdrop click
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("renders children content", () => {
    renderAlertDialog();
    expect(screen.getByText("Acknowledge")).toBeInTheDocument();
  });

  it("traps focus within the dialog", async () => {
    const user = userEvent.setup();
    render(
      <Provider>
        <AlertDialog open title="Focus Test">
          <button type="button">First</button>
          <button type="button">Second</button>
        </AlertDialog>
      </Provider>,
    );

    const first = screen.getByText("First");
    const second = screen.getByText("Second");

    first.focus();
    expect(document.activeElement).toBe(first);

    await user.tab();
    expect(document.activeElement).toBe(second);

    await user.tab();
    // Focus should wrap back to first (trap)
    expect(document.activeElement).toBe(first);
  });

  it("applies custom className", () => {
    renderAlertDialog({ className: "custom-alert-class" });
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.className).toContain("custom-alert-class");
  });

  it('data-testid="alertdialog-backdrop" is present', () => {
    renderAlertDialog();
    expect(screen.getByTestId("alertdialog-backdrop")).toBeInTheDocument();
  });

  it("entry animation class present", () => {
    renderAlertDialog();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.className).toMatch(/animate-\[scale-in/);
  });
});
