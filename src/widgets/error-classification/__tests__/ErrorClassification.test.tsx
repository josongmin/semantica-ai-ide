import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { createClassifiedError } from "../../../shared/lib/mocks";
import type { ErrorCategory } from "../../../shared/protocol";
import { ErrorClassification } from "../ErrorClassification";

describe("ErrorClassification", () => {
  const categoryExpectations: Record<ErrorCategory, { label: string }> = {
    network: { label: "Network Error" },
    model: { label: "Model Error" },
    tool: { label: "Tool Error" },
    permission: { label: "Permission Denied" },
    rate_limit: { label: "Rate Limited" },
    context_overflow: { label: "Context Overflow" },
    unknown: { label: "Error" },
  };

  describe.each(Object.entries(categoryExpectations))("category: %s", (category, { label }) => {
    it(`renders correct label "${label}"`, () => {
      const error = createClassifiedError({
        category: category as ErrorCategory,
        message: "Something went wrong",
      });

      renderWithAtoms(<ErrorClassification error={error} />);

      expect(screen.getByTestId("error-label")).toHaveTextContent(label);
    });

    it("renders the error message", () => {
      const error = createClassifiedError({
        category: category as ErrorCategory,
        message: "Detailed error description",
      });

      renderWithAtoms(<ErrorClassification error={error} />);

      expect(screen.getByTestId("error-message")).toHaveTextContent("Detailed error description");
    });
  });

  it("renders error code when provided", () => {
    const error = createClassifiedError({
      category: "network",
      code: "ECONNREFUSED",
      message: "Connection refused",
    });

    renderWithAtoms(<ErrorClassification error={error} />);

    expect(screen.getByTestId("error-code")).toHaveTextContent("ECONNREFUSED");
  });

  it("does not render error code when not provided", () => {
    const error = createClassifiedError({
      category: "network",
      message: "Connection refused",
    });

    renderWithAtoms(<ErrorClassification error={error} />);

    expect(screen.queryByTestId("error-code")).toBeNull();
  });

  it("shows retry button for auto_retry strategy", () => {
    const onRetry = vi.fn();
    const error = createClassifiedError({
      category: "network",
      message: "Timeout",
      retry_strategy: "auto_retry",
    });

    renderWithAtoms(<ErrorClassification error={error} onRetry={onRetry} />);

    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Retrying automatically…");
  });

  it("shows retry button for retry_with_backoff strategy", () => {
    const onRetry = vi.fn();
    const error = createClassifiedError({
      category: "rate_limit",
      message: "Too many requests",
      retry_strategy: "retry_with_backoff",
      retry_after_ms: 5000,
    });

    renderWithAtoms(<ErrorClassification error={error} onRetry={onRetry} />);

    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Retry in 5s");
  });

  it("shows retry_with_backoff label without delay when retry_after_ms not provided", () => {
    const onRetry = vi.fn();
    const error = createClassifiedError({
      category: "rate_limit",
      message: "Too many requests",
      retry_strategy: "retry_with_backoff",
    });

    renderWithAtoms(<ErrorClassification error={error} onRetry={onRetry} />);

    expect(screen.getByTestId("retry-label")).toHaveTextContent("Retry with backoff");
  });

  it("shows retry button for retry_after_fix strategy", () => {
    const onRetry = vi.fn();
    const error = createClassifiedError({
      category: "tool",
      message: "Invalid arguments",
      retry_strategy: "retry_after_fix",
    });

    renderWithAtoms(<ErrorClassification error={error} onRetry={onRetry} />);

    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Fix the issue, then retry");
  });

  it("hides retry button for non_retryable strategy", () => {
    const onRetry = vi.fn();
    const error = createClassifiedError({
      category: "permission",
      message: "Access denied",
      retry_strategy: "non_retryable",
    });

    renderWithAtoms(<ErrorClassification error={error} onRetry={onRetry} />);

    expect(screen.queryByTestId("retry-button")).toBeNull();
    expect(screen.getByTestId("retry-label")).toHaveTextContent("Cannot be retried");
  });

  it("hides retry button when onRetry is not provided even for retryable errors", () => {
    const error = createClassifiedError({
      category: "network",
      message: "Timeout",
      retry_strategy: "auto_retry",
    });

    renderWithAtoms(<ErrorClassification error={error} />);

    expect(screen.queryByTestId("retry-button")).toBeNull();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();
    const error = createClassifiedError({
      category: "network",
      message: "Timeout",
      retry_strategy: "auto_retry",
    });

    const { user } = renderWithAtoms(<ErrorClassification error={error} onRetry={onRetry} />);

    await user.click(screen.getByTestId("retry-button"));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry section when retry_strategy is not provided", () => {
    const error = createClassifiedError({
      category: "unknown",
      message: "Something happened",
    });

    renderWithAtoms(<ErrorClassification error={error} />);

    expect(screen.queryByTestId("retry-label")).toBeNull();
    expect(screen.queryByTestId("retry-button")).toBeNull();
  });

  it("has role=alert for accessibility", () => {
    const error = createClassifiedError({
      category: "network",
      message: "Connection lost",
    });

    renderWithAtoms(<ErrorClassification error={error} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
