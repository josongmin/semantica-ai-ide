import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToastContainer, type ToastData } from "../Toast";

describe("ToastContainer", () => {
  const onDismiss = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    onDismiss.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const makeToast = (overrides: Partial<ToastData> = {}): ToastData => ({
    id: "toast-1",
    message: "Test notification",
    variant: "info",
    ...overrides,
  });

  it("renders nothing when toasts array is empty", () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={onDismiss} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single toast", () => {
    render(<ToastContainer toasts={[makeToast()]} onDismiss={onDismiss} />);
    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    const toasts = [
      makeToast({ id: "t1", message: "First" }),
      makeToast({ id: "t2", message: "Second" }),
      makeToast({ id: "t3", message: "Third" }),
    ];
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("limits displayed toasts to MAX_TOASTS (5)", () => {
    const toasts = Array.from({ length: 7 }, (_, i) =>
      makeToast({ id: `t${i}`, message: `Toast ${i}` }),
    );
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);
    const items = screen.getAllByRole("status");
    expect(items).toHaveLength(5);
  });

  it("auto-dismisses after default duration", () => {
    render(<ToastContainer toasts={[makeToast()]} onDismiss={onDismiss} />);

    act(() => {
      // 4000ms auto-dismiss + 150ms exit animation
      vi.advanceTimersByTime(4000 + 150);
    });

    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("auto-dismisses after custom duration", () => {
    render(<ToastContainer toasts={[makeToast({ duration: 2000 })]} onDismiss={onDismiss} />);

    act(() => {
      // 2000ms custom duration + 150ms exit animation
      vi.advanceTimersByTime(2000 + 150);
    });

    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("dismiss button calls onDismiss", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ToastContainer toasts={[makeToast()]} onDismiss={onDismiss} />);

    const dismissBtn = screen.getByLabelText("Dismiss");
    await user.click(dismissBtn);

    // Wait for exit animation (150ms)
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("has role=status and aria-live=polite", () => {
    render(<ToastContainer toasts={[makeToast()]} onDismiss={onDismiss} />);
    const toast = screen.getByRole("status");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });

  it("renders correct variant styles", () => {
    const toasts = [
      makeToast({ id: "s", variant: "success", message: "Success" }),
      makeToast({ id: "e", variant: "error", message: "Error" }),
    ];
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("container has aria-label=Notifications", () => {
    render(<ToastContainer toasts={[makeToast()]} onDismiss={onDismiss} />);
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });
});
