import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setThreeModelStateAtom, threeModelStateAtom } from "../../../features/three-model";
import { threeModelPanelVisibleAtom } from "../../../shared/lib/atoms/inspectionPanelAtoms";
import type { ThreeModelState } from "../../../shared/protocol";
import { ThreeModelPanel } from "../ThreeModelPanel";

describe("ThreeModelPanel", () => {
  it("renders three columns (Planner, Coder, Critic)", () => {
    renderWithAtoms(<ThreeModelPanel />, { initialValues: [[threeModelPanelVisibleAtom, true]] });

    expect(screen.getByTestId("model-column-planner")).toBeInTheDocument();
    expect(screen.getByTestId("model-column-coder")).toBeInTheDocument();
    expect(screen.getByTestId("model-column-critic")).toBeInTheDocument();

    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByText("Coder")).toBeInTheDocument();
    expect(screen.getByText("Critic")).toBeInTheDocument();
  });

  it("shows 'No output yet' for idle models with no output", () => {
    renderWithAtoms(<ThreeModelPanel />, { initialValues: [[threeModelPanelVisibleAtom, true]] });

    const noOutputLabels = screen.getAllByText("No output yet");
    expect(noOutputLabels).toHaveLength(3);
  });

  it("displays model name when set via initialValues", () => {
    const state: ThreeModelState = {
      planner: { model: "claude-opus-4-6", status: "active", output: "Planning..." },
      coder: { model: "claude-sonnet", status: "idle", output: "" },
      critic: { model: "claude-haiku", status: "idle", output: "" },
    };

    renderWithAtoms(<ThreeModelPanel />, {
      initialValues: [[threeModelStateAtom, state], [threeModelPanelVisibleAtom, true]],
    });

    expect(screen.getByText("claude-opus-4-6")).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet")).toBeInTheDocument();
    expect(screen.getByText("claude-haiku")).toBeInTheDocument();
  });

  it("shows output text when models are active", () => {
    const state: ThreeModelState = {
      planner: { model: "opus", status: "active", output: "Step 1: Analyze requirements" },
      coder: { model: "sonnet", status: "active", output: "function hello() {}" },
      critic: { model: "haiku", status: "done", output: "Looks good" },
    };

    renderWithAtoms(<ThreeModelPanel />, {
      initialValues: [[threeModelStateAtom, state], [threeModelPanelVisibleAtom, true]],
    });

    expect(screen.getByText("Step 1: Analyze requirements")).toBeInTheDocument();
    expect(screen.getByText("function hello() {}")).toBeInTheDocument();
    expect(screen.getByText("Looks good")).toBeInTheDocument();
  });

  it("shows correct status labels", () => {
    const state: ThreeModelState = {
      planner: { model: "opus", status: "idle", output: "" },
      coder: { model: "sonnet", status: "active", output: "coding..." },
      critic: { model: "haiku", status: "done", output: "reviewed" },
    };

    renderWithAtoms(<ThreeModelPanel />, {
      initialValues: [[threeModelStateAtom, state], [threeModelPanelVisibleAtom, true]],
    });

    expect(screen.getByText("Idle")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("re-renders when state is updated via store", async () => {
    const { store } = renderWithAtoms(<ThreeModelPanel />, { initialValues: [[threeModelPanelVisibleAtom, true]] });

    // Initially idle
    expect(screen.getAllByText("Idle")).toHaveLength(3);

    // Update state
    act(() => {
      store.set(setThreeModelStateAtom, {
        planner: { model: "opus", status: "active", output: "Working..." },
        coder: { model: "sonnet", status: "idle", output: "" },
        critic: { model: "haiku", status: "idle", output: "" },
      });
    });

    expect(await screen.findByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Working...")).toBeInTheDocument();
  });

  it("has correct aria label on panel", () => {
    renderWithAtoms(<ThreeModelPanel />, { initialValues: [[threeModelPanelVisibleAtom, true]] });
    expect(screen.getByRole("region", { name: "Three-model architecture" })).toBeInTheDocument();
  });
});
