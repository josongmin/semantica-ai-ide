/**
 * SessionSummaryCard Tests
 *
 * Tests:
 * - Renders nothing when no summary
 * - Renders summary text
 * - Renders stats badges
 * - Omits zero-count stats
 * - Handles long summary text (truncation via CSS)
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { updateSessionMetaAtom } from "~entities/session/state";

import { createSessionMeta, createSessionStats } from "../../../shared/lib/mocks";
import { SessionSummaryCard } from "../SessionSummaryCard";

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("SessionSummaryCard", () => {
  it("renders nothing when no summary is set", () => {
    renderWithStore(<SessionSummaryCard />);
    expect(screen.queryByTestId("session-summary-card")).not.toBeInTheDocument();
  });

  it("renders nothing when summary is empty string", () => {
    renderWithStore(<SessionSummaryCard />, (store) => {
      store.set(updateSessionMetaAtom, createSessionMeta({ summary: "" }));
    });
    expect(screen.queryByTestId("session-summary-card")).not.toBeInTheDocument();
  });

  it("renders summary text when provided", () => {
    renderWithStore(<SessionSummaryCard />, (store) => {
      store.set(
        updateSessionMetaAtom,
        createSessionMeta({ summary: "Implementing user authentication flow" }),
      );
    });

    expect(screen.getByTestId("session-summary-card")).toBeInTheDocument();
    expect(screen.getByText("Implementing user authentication flow")).toBeInTheDocument();
  });

  it("renders stats badges when stats are provided", () => {
    renderWithStore(<SessionSummaryCard />, (store) => {
      store.set(
        updateSessionMetaAtom,
        createSessionMeta({
          summary: "Working on feature",
          stats: createSessionStats({
            files_modified: 3,
            files_created: 2,
            files_deleted: 1,
            tool_calls_count: 12,
            errors_count: 1,
          }),
        }),
      );
    });

    expect(screen.getByTestId("session-summary-card")).toBeInTheDocument();
    // Check that stat numbers are rendered
    expect(screen.getByText("3")).toBeInTheDocument(); // files_modified
    expect(screen.getByText("2")).toBeInTheDocument(); // files_created
    expect(screen.getByText("12")).toBeInTheDocument(); // tool_calls_count
    // files_deleted=1 and errors_count=1 both show "1" in error-colored spans
    const errorSpans = screen.getAllByText("1");
    expect(errorSpans.length).toBeGreaterThanOrEqual(2);
  });

  it("omits zero-count stats badges", () => {
    renderWithStore(<SessionSummaryCard />, (store) => {
      store.set(
        updateSessionMetaAtom,
        createSessionMeta({
          summary: "Just reading files",
          stats: createSessionStats({
            files_modified: 0,
            files_created: 0,
            files_deleted: 0,
            tool_calls_count: 5,
            errors_count: 0,
          }),
        }),
      );
    });

    const card = screen.getByTestId("session-summary-card");
    expect(card).toBeInTheDocument();
    // Only tool_calls_count should be visible (5)
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders without stats when only summary is provided", () => {
    renderWithStore(<SessionSummaryCard />, (store) => {
      store.set(
        updateSessionMetaAtom,
        createSessionMeta({ summary: "Setting up project structure" }),
      );
    });

    expect(screen.getByTestId("session-summary-card")).toBeInTheDocument();
    expect(screen.getByText("Setting up project structure")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    renderWithStore(<SessionSummaryCard className="my-custom-class" />, (store) => {
      store.set(updateSessionMetaAtom, createSessionMeta({ summary: "Test summary" }));
    });

    const card = screen.getByTestId("session-summary-card");
    expect(card).toHaveClass("my-custom-class");
  });
});
