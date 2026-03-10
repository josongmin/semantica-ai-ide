import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  patchSimulationListAtom,
  setPatchSimulationAtom,
  setPatchSimulationForTurnAtom,
  worstConflictRiskAtom,
} from "../../../features/patch-simulation";
import type { PatchSimulationResult, TurnId } from "../../../shared/protocol";
import { ConflictBadge } from "../ConflictBadge";
import { PatchSimulationBanner } from "../PatchSimulationBanner";
function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

function createSimResult(overrides: Partial<PatchSimulationResult> = {}): PatchSimulationResult {
  return {
    file_path: "src/index.ts",
    conflict_risk: "none",
    affected_files: [],
    ...overrides,
  };
}

describe("ConflictBadge", () => {
  it("renders nothing for 'none' risk", () => {
    const { container } = render(<ConflictBadge risk="none" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders 'Low' for low risk", () => {
    render(<ConflictBadge risk="low" />);
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByTestId("conflict-badge")).toBeInTheDocument();
  });

  it("renders 'Medium' for medium risk", () => {
    render(<ConflictBadge risk="medium" />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("renders 'High' for high risk", () => {
    render(<ConflictBadge risk="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});

describe("PatchSimulationBanner", () => {
  it("renders nothing when no simulation results exist", () => {
    const { container } = renderWithStore(<PatchSimulationBanner turnId={"turn_test" as TurnId} />);
    expect(container.querySelector("[data-testid='patch-simulation-banner']")).toBeNull();
  });

  it("renders banner with file count", () => {
    const tid = "turn_test" as TurnId;
    renderWithStore(<PatchSimulationBanner turnId={tid} />, (store) => {
      store.set(setPatchSimulationForTurnAtom, {
        turn_id: tid,
        ...createSimResult({ file_path: "src/a.ts", conflict_risk: "low" }),
      });
      store.set(setPatchSimulationForTurnAtom, {
        turn_id: tid,
        ...createSimResult({ file_path: "src/b.ts", conflict_risk: "none" }),
      });
    });

    expect(screen.getByTestId("patch-simulation-banner")).toBeInTheDocument();
    expect(screen.getByText("Patch Simulation")).toBeInTheDocument();
    expect(screen.getByText(/2 files/)).toBeInTheDocument();
  });

  it("shows high risk count in summary", () => {
    const tid = "turn_test" as TurnId;
    renderWithStore(<PatchSimulationBanner turnId={tid} />, (store) => {
      store.set(setPatchSimulationForTurnAtom, {
        turn_id: tid,
        ...createSimResult({ file_path: "src/a.ts", conflict_risk: "high" }),
      });
      store.set(setPatchSimulationForTurnAtom, {
        turn_id: tid,
        ...createSimResult({ file_path: "src/b.ts", conflict_risk: "high" }),
      });
    });

    expect(screen.getByText(/2 high risk/)).toBeInTheDocument();
  });

  it("expands to show file list on click", () => {
    const tid = "turn_test" as TurnId;
    renderWithStore(<PatchSimulationBanner turnId={tid} />, (store) => {
      store.set(setPatchSimulationForTurnAtom, {
        turn_id: tid,
        ...createSimResult({
          file_path: "src/app.ts",
          conflict_risk: "medium",
          conflict_details: "Concurrent edits detected",
        }),
      });
    });

    // File details not visible initially
    expect(screen.queryByTestId("patch-sim-file-src/app.ts")).toBeNull();

    // Click to expand
    fireEvent.click(screen.getByText("Patch Simulation"));

    expect(screen.getByTestId("patch-sim-file-src/app.ts")).toBeInTheDocument();
    expect(screen.getByText("Concurrent edits detected")).toBeInTheDocument();
  });

  it("shows affected files count in expanded view", () => {
    const tid = "turn_test" as TurnId;
    renderWithStore(<PatchSimulationBanner turnId={tid} />, (store) => {
      store.set(setPatchSimulationForTurnAtom, {
        turn_id: tid,
        ...createSimResult({
          file_path: "src/main.ts",
          conflict_risk: "low",
          affected_files: ["src/utils.ts", "src/types.ts"],
        }),
      });
    });

    fireEvent.click(screen.getByText("Patch Simulation"));
    expect(screen.getByText("+2 affected")).toBeInTheDocument();
  });
});

describe("patchSimulationAtoms", () => {
  it("setPatchSimulationAtom upserts results by file_path", () => {
    const store = createStore();

    store.set(setPatchSimulationAtom, createSimResult({ file_path: "a.ts", conflict_risk: "low" }));
    store.set(
      setPatchSimulationAtom,
      createSimResult({ file_path: "b.ts", conflict_risk: "high" }),
    );

    const results = store.get(patchSimulationListAtom);
    expect(results).toHaveLength(2);
  });

  it("worstConflictRiskAtom returns highest risk level", () => {
    const store = createStore();

    store.set(setPatchSimulationAtom, createSimResult({ file_path: "a.ts", conflict_risk: "low" }));
    store.set(
      setPatchSimulationAtom,
      createSimResult({ file_path: "b.ts", conflict_risk: "medium" }),
    );

    expect(store.get(worstConflictRiskAtom)).toBe("medium");
  });

  it("worstConflictRiskAtom returns 'none' when empty", () => {
    const store = createStore();
    expect(store.get(worstConflictRiskAtom)).toBe("none");
  });

  it("overwriting same file_path updates the result", () => {
    const store = createStore();

    store.set(setPatchSimulationAtom, createSimResult({ file_path: "a.ts", conflict_risk: "low" }));
    store.set(
      setPatchSimulationAtom,
      createSimResult({ file_path: "a.ts", conflict_risk: "high" }),
    );

    const results = store.get(patchSimulationListAtom);
    expect(results).toHaveLength(1);
    expect(results[0]?.conflict_risk).toBe("high");
  });
});
