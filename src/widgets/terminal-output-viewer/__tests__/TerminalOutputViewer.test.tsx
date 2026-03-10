import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createToolCallOutput } from "../../../shared/lib/mocks";

// Mock useXtermTerminal — xterm renders into a canvas, not DOM text
const mockUseXterm = vi.fn().mockReturnValue({ isReady: true });

vi.mock("../../../shared/lib/hooks/useXtermTerminal", () => ({
  useXtermTerminal: (...args: unknown[]) => mockUseXterm(...args),
}));

import { TerminalOutputViewer } from "../TerminalOutputViewer";
describe("TerminalOutputViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseXterm.mockReturnValue({ isReady: true });
  });

  it("shows Terminal label in header", () => {
    const output = createToolCallOutput();
    render(<TerminalOutputViewer output={output} />);
    expect(screen.getByText("Terminal")).toBeInTheDocument();
  });

  it("displays exit code badge for success (exit 0)", () => {
    const output = createToolCallOutput({ exit_code: 0 });
    render(<TerminalOutputViewer output={output} />);
    expect(screen.getByText("exit 0")).toBeInTheDocument();
  });

  it("displays exit code badge for error (exit 1)", () => {
    const output = createToolCallOutput({ exit_code: 1, stderr: "fail" });
    render(<TerminalOutputViewer output={output} />);
    expect(screen.getByText("exit 1")).toBeInTheDocument();
  });

  it("shows 'No output' when stdout and stderr are empty", () => {
    const output = createToolCallOutput({ stdout: "", stderr: "", exit_code: 0 });
    render(<TerminalOutputViewer output={output} />);
    expect(screen.getByText("No output")).toBeInTheDocument();
  });

  it("calls useXtermTerminal with stdout content", () => {
    const output = createToolCallOutput({ stdout: "hello terminal", exit_code: 0 });
    render(<TerminalOutputViewer output={output} />);
    expect(mockUseXterm).toHaveBeenCalledWith(
      expect.objectContaining({ content: "hello terminal" }),
    );
  });

  it("stderr toggle button appears when stderr exists", () => {
    const output = createToolCallOutput({ stderr: "warning text" });
    render(<TerminalOutputViewer output={output} />);
    expect(screen.getByText(/stderr/)).toBeInTheDocument();
  });

  it("stderr toggle button is absent when no stderr", () => {
    const output = createToolCallOutput({ stdout: "ok", stderr: "" });
    render(<TerminalOutputViewer output={output} />);
    expect(screen.queryByText(/stderr/)).not.toBeInTheDocument();
  });

  it("clicking stderr toggle switches to stderr content", async () => {
    const user = userEvent.setup();
    const output = createToolCallOutput({ stdout: "out", stderr: "err text" });
    render(<TerminalOutputViewer output={output} />);

    await user.click(screen.getByText(/stderr/));

    // After toggle, useXtermTerminal should be called with stderr content
    const lastCall = mockUseXterm.mock.calls[mockUseXterm.mock.calls.length - 1];
    if (lastCall === undefined) throw new Error("expected mock call");
    expect(lastCall[0]?.content).toBe("err text");
  });

  it("shows truncation notice for long output", () => {
    const longOutput = Array.from({ length: 50 }, (_, i) => `line ${i}`).join("\n");
    const output = createToolCallOutput({ stdout: longOutput });
    render(<TerminalOutputViewer output={output} maxLines={10} />);
    expect(screen.getByText(/truncated at 10/)).toBeInTheDocument();
  });

  it("does not show truncation notice when within limit", () => {
    const shortOutput = "line 1\nline 2";
    const output = createToolCallOutput({ stdout: shortOutput });
    render(<TerminalOutputViewer output={output} maxLines={10} />);
    expect(screen.queryByText(/truncated/)).not.toBeInTheDocument();
  });

  it("shows loading spinner when xterm is not ready", () => {
    mockUseXterm.mockReturnValue({ isReady: false });
    const output = createToolCallOutput({ stdout: "hello" });
    render(<TerminalOutputViewer output={output} />);
    expect(screen.getByText("Loading terminal...")).toBeInTheDocument();
  });
});
