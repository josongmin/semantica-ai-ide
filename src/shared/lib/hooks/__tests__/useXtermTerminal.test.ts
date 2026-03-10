import type { RefObject } from "react";
import { renderHook, waitFor } from "@testing-library/react";

const mockOpen = vi.fn();
const mockWrite = vi.fn();
const mockDispose = vi.fn();
const mockLoadAddon = vi.fn();
const mockFit = vi.fn();

class MockTerminal {
  open = mockOpen;
  write = mockWrite;
  dispose = mockDispose;
  loadAddon = mockLoadAddon;
}

class MockFitAddon {
  fit = mockFit;
}

vi.mock("@xterm/xterm", () => ({
  Terminal: MockTerminal,
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: MockFitAddon,
}));

const { useXtermTerminal } = await import("../useXtermTerminal");

describe("useXtermTerminal", () => {
  let container: HTMLDivElement;
  let containerRef: RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
    containerRef = { current: container };
  });

  afterEach(() => {
    container.remove();
  });

  it("returns isReady=false initially", () => {
    const { result } = renderHook(() => useXtermTerminal({ content: "hello", containerRef }));
    // Before async load resolves, isReady is false
    expect(result.current.isReady).toBe(false);
  });

  it("sets isReady=true after xterm loads", async () => {
    const { result } = renderHook(() => useXtermTerminal({ content: "hello", containerRef }));

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    expect(result.current.isReady).toBe(true);
  });

  it("opens terminal on the container element", async () => {
    renderHook(() => useXtermTerminal({ content: "hello", containerRef }));

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    expect(mockOpen).toHaveBeenCalledWith(container);
  });

  it("writes content to terminal", async () => {
    renderHook(() => useXtermTerminal({ content: "test output", containerRef }));

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    expect(mockWrite).toHaveBeenCalledWith("test output");
  });

  it("loads FitAddon", async () => {
    renderHook(() => useXtermTerminal({ content: "hello", containerRef }));

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    expect(mockLoadAddon).toHaveBeenCalled();
    expect(mockFit).toHaveBeenCalled();
  });

  it("disposes terminal on unmount", async () => {
    const { unmount } = renderHook(() => useXtermTerminal({ content: "hello", containerRef }));

    await waitFor(() => expect(mockOpen).toHaveBeenCalled());
    unmount();

    expect(mockDispose).toHaveBeenCalled();
  });

  it("returns isReady=false when content is empty", () => {
    const { result } = renderHook(() => useXtermTerminal({ content: "", containerRef }));
    expect(result.current.isReady).toBe(false);
  });

  it("returns isReady=false when containerRef is null", () => {
    const nullRef = { current: null };
    const { result } = renderHook(() =>
      useXtermTerminal({ content: "hello", containerRef: nullRef }),
    );
    expect(result.current.isReady).toBe(false);
  });
});
