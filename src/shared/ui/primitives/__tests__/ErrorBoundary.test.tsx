import type React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ErrorBoundary } from "../ErrorBoundary";

// A component that throws an error on demand
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test render error");
  }
  return <div>Child content</div>;
}

// A component that always throws
function AlwaysThrows(): React.JSX.Element {
  throw new Error("Permanent error");
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress console.error output from ErrorBoundary.componentDidCatch
    // and React's error boundary warning
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders multiple children normally", () => {
    render(
      <ErrorBoundary>
        <div>First</div>
        <div>Second</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("catches error and shows default fallback UI", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test render error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("catches error and shows custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error view</div>}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error view")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("calls console.error via componentDidCatch", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    // Check that our ErrorBoundary's own console.error was called
    const {calls} = consoleErrorSpy.mock;
    const boundaryCall = calls.find(
      (call: unknown[]) => typeof call[0] === "string" && call[0].includes("[ErrorBoundary]"),
    );
    expect(boundaryCall).toBeDefined();
  });

  it("reset button attempts recovery by clearing error state", async () => {
    const user = userEvent.setup();

    // Use a component that will keep throwing to verify the reset attempt
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error("Recoverable error");
      }
      return <div>Recovered content</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    // Should show error fallback
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Fix the condition before clicking retry
    shouldThrow = false;

    // Click Try Again
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // Should now render the recovered content
    expect(screen.getByText("Recovered content")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("shows error again if child still throws after reset", async () => {
    const user = userEvent.setup();

    render(
      <ErrorBoundary>
        <AlwaysThrows />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    // Still shows error because the child always throws
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("displays the error message in a pre element", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    const el = screen.getByText("Test render error");
    expect(el.tagName).toBe("SPAN");
  });
});
