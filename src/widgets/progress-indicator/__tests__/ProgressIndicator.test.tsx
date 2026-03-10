import { createElement, type ReactNode } from "react";
import { act, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { progressKeysAtom, setProgressAtom } from "../../../shared/lib";
import { ProgressIndicator } from "../ProgressIndicator";

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

describe("ProgressIndicator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when no progress items", () => {
    const store = createStore();
    const { container } = render(<ProgressIndicator />, {
      wrapper: createWrapper(store),
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders progress bar for active item", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "build", value: 50, max: 100, label: "Building" });

    render(<ProgressIndicator />, { wrapper: createWrapper(store) });

    expect(screen.getByTestId("progress-build")).toBeInTheDocument();
    expect(screen.getByText("Building")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders multiple progress items", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "build", value: 30, max: 100 });
    store.set(setProgressAtom, { key: "test", value: 70, max: 100 });

    render(<ProgressIndicator />, { wrapper: createWrapper(store) });

    expect(screen.getByTestId("progress-build")).toBeInTheDocument();
    expect(screen.getByTestId("progress-test")).toBeInTheDocument();
  });

  it("shows key as label when no label provided", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "deploy", value: 25, max: 100 });

    render(<ProgressIndicator />, { wrapper: createWrapper(store) });

    expect(screen.getByText("deploy")).toBeInTheDocument();
  });

  it("defaults max to 100 when not provided", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "task", value: 75 });

    render(<ProgressIndicator />, { wrapper: createWrapper(store) });

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("treats max=0 as default 100 to prevent division by zero", () => {
    const store = createStore();
    store.set(setProgressAtom, { key: "zero", value: 50, max: 0 });

    render(<ProgressIndicator />, { wrapper: createWrapper(store) });

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("applies fade-out class when progress is complete and removes after delay", () => {
    vi.useFakeTimers();
    const store = createStore();
    store.set(setProgressAtom, { key: "done", value: 100, max: 100 });

    render(<ProgressIndicator />, { wrapper: createWrapper(store) });

    const el = screen.getByTestId("progress-done");
    expect(el.className).toContain("opacity-0");

    // After FADE_OUT_DELAY (2000ms), progress should be removed
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // The removeProgressAtom should have been called — key gone
    expect(store.get(progressKeysAtom)).not.toContain("done");

    vi.useRealTimers();
  });
});
