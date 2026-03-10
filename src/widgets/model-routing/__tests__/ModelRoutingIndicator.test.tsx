import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setModelRoutesAtom } from "../../../features/model-routing";
import { createModelRoute, resetIdCounter } from "../../../shared/lib/mocks";
import { ModelRoutingIndicator } from "../ModelRoutingIndicator";

beforeEach(() => {
  resetIdCounter();
});

describe("ModelRoutingIndicator", () => {
  it("renders nothing when no routes exist", () => {
    const { container } = renderWithAtoms(<ModelRoutingIndicator />);
    expect(container.querySelector("[data-testid='model-routing-indicator']")).toBeNull();
  });

  it("renders compact indicator with latest route", () => {
    const { store } = renderWithAtoms(<ModelRoutingIndicator />);

    act(() => {
      store.set(setModelRoutesAtom, [
        createModelRoute({
          task_type: "code_gen",
          model: "Claude Opus 4.6",
          timestamp_ms: 1000,
        }),
      ]);
    });

    expect(screen.getByTestId("model-routing-indicator")).toBeInTheDocument();
    expect(screen.getByText("code_gen")).toBeInTheDocument();
    expect(screen.getByText("Claude Opus 4.6")).toBeInTheDocument();
  });

  it("expands to show routing history on click", async () => {
    const { store, user } = renderWithAtoms(<ModelRoutingIndicator />);

    act(() => {
      store.set(setModelRoutesAtom, [
        createModelRoute({ task_type: "analysis", model: "Opus", timestamp_ms: 2000 }),
        createModelRoute({ task_type: "code_gen", model: "Sonnet", timestamp_ms: 1000 }),
      ]);
    });

    // Click to expand
    const toggleBtn = screen.getByLabelText("Model routing decisions");
    await user.click(toggleBtn);

    expect(screen.getByTestId("model-routing-history")).toBeInTheDocument();
    // "analysis" appears both in compact indicator and expanded list
    expect(screen.getAllByText("analysis").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("code_gen")).toBeInTheDocument();
  });

  it("collapses history on second click", async () => {
    const { store, user } = renderWithAtoms(<ModelRoutingIndicator />);

    act(() => {
      store.set(setModelRoutesAtom, [
        createModelRoute({ task_type: "analysis", model: "Opus", timestamp_ms: 1000 }),
      ]);
    });

    const toggleBtn = screen.getByLabelText("Model routing decisions");

    // Expand
    await user.click(toggleBtn);
    expect(screen.getByTestId("model-routing-history")).toBeInTheDocument();

    // Collapse
    await user.click(toggleBtn);
    expect(screen.queryByTestId("model-routing-history")).not.toBeInTheDocument();
  });

  it("shows reason text in route rows", async () => {
    const { store, user } = renderWithAtoms(<ModelRoutingIndicator />);

    act(() => {
      store.set(setModelRoutesAtom, [
        createModelRoute({
          task_type: "review",
          model: "Opus",
          reason: "Requires deep reasoning",
          timestamp_ms: 1000,
        }),
      ]);
    });

    const toggleBtn = screen.getByLabelText("Model routing decisions");
    await user.click(toggleBtn);

    expect(screen.getByText("Requires deep reasoning")).toBeInTheDocument();
  });

  it("updates when new routes arrive", () => {
    const { store } = renderWithAtoms(<ModelRoutingIndicator />);

    act(() => {
      store.set(setModelRoutesAtom, [
        createModelRoute({ task_type: "old_task", model: "Haiku", timestamp_ms: 1000 }),
      ]);
    });

    expect(screen.getByText("old_task")).toBeInTheDocument();

    act(() => {
      store.set(setModelRoutesAtom, [
        createModelRoute({ task_type: "new_task", model: "Opus", timestamp_ms: 2000 }),
      ]);
    });

    // The compact indicator should show the newest route
    expect(screen.getByText("new_task")).toBeInTheDocument();
  });
});
