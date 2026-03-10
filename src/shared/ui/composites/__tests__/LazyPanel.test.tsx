import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { Skeleton } from "../../primitives/Skeleton";
import { LazyPanel } from "../LazyPanel";

// ─── Helpers ───────────────────────────────────────────────

/** A component that resolves immediately */
function ImmediateChild() {
  return <div data-testid="immediate-child">Loaded Content</div>;
}

/** Create a lazy component that resolves after a delay */
function createDelayedLazy(delayMs: number) {
  return React.lazy(
    () =>
      new Promise<{ default: React.ComponentType }>((resolve) =>
        setTimeout(
          () =>
            resolve({
              default: function DelayedContent() {
                return <div data-testid="lazy-child">Lazy Loaded</div>;
              },
            }),
          delayMs,
        ),
      ),
  );
}

// ─── Tests ─────────────────────────────────────────────────

describe("LazyPanel", () => {
  it("renders immediate children without showing fallback", () => {
    render(
      <LazyPanel>
        <ImmediateChild />
      </LazyPanel>,
    );

    expect(screen.getByTestId("immediate-child")).toBeTruthy();
  });

  it("shows default skeleton fallback while lazy component loads", async () => {
    const LazyChild = createDelayedLazy(100);

    render(
      <LazyPanel>
        <LazyChild />
      </LazyPanel>,
    );

    // Default fallback should show loading status
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading panel");

    // After load, content appears
    await waitFor(() => {
      expect(screen.getByTestId("lazy-child")).toBeTruthy();
    });
  });

  it("renders custom fallback when provided", async () => {
    const LazyChild = createDelayedLazy(100);

    render(
      <LazyPanel fallback={<div data-testid="custom-fallback">Custom Loading...</div>}>
        <LazyChild />
      </LazyPanel>,
    );

    expect(screen.getByTestId("custom-fallback")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId("lazy-child")).toBeTruthy();
    });
  });

  it("applies className to wrapper", () => {
    const { container } = render(
      <LazyPanel className="my-panel-class">
        <ImmediateChild />
      </LazyPanel>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveClass("my-panel-class");
    expect(wrapper).toHaveClass("w-full");
  });

  it("renders with DiffSkeleton as custom fallback", async () => {
    const LazyChild = createDelayedLazy(100);

    render(
      <LazyPanel
        fallback={
          <div role="status" aria-label="Loading diff" data-testid="diff-skeleton">
            <Skeleton variant="diff-line" />
          </div>
        }
      >
        <LazyChild />
      </LazyPanel>,
    );

    expect(screen.getByTestId("diff-skeleton")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByTestId("lazy-child")).toBeTruthy();
    });
  });

  it("default fallback respects minHeight", () => {
    const LazyChild = createDelayedLazy(5000);

    render(
      <LazyPanel minHeight="200px">
        <LazyChild />
      </LazyPanel>,
    );

    const fallback = screen.getByRole("status");
    expect(fallback.style.minHeight).toBe("200px");
  });
});
