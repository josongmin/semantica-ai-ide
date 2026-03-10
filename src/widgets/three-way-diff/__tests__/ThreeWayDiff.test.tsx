import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { pushThreeWayDiffAtom } from "../../../features/three-way-diff";
import { createThreeWayDiffData, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { ThreeWayDiff } from "../ThreeWayDiff";

const TURN_ID = "turn_test" as TurnId;

beforeEach(() => {
  resetIdCounter();
});

function renderWithStore(
  turnId: TurnId = TURN_ID,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  const user = userEvent.setup();
  return { ...render(<Provider store={store}><ThreeWayDiff turnId={turnId} /></Provider>), store, user };
}

describe("ThreeWayDiff", () => {
  it("renders nothing when no diffs for turn", () => {
    const { container } = renderWithStore();
    expect(container.innerHTML).toBe("");
  });

  it("renders pending diff card with file name and conflict count", () => {
    renderWithStore(TURN_ID, (store) => {
      store.set(pushThreeWayDiffAtom, createThreeWayDiffData({
        turn_id: TURN_ID,
        file_path: "src/components/App.tsx",
        conflicts: [{ start_line: 2, end_line: 3 }, { start_line: 10, end_line: 12 }],
      }));
    });

    expect(screen.getByText("App.tsx")).toBeInTheDocument();
    expect(screen.getByText("2 conflicts")).toBeInTheDocument();
  });

  it("shows singular conflict text for 1 conflict", () => {
    renderWithStore(TURN_ID, (store) => {
      store.set(pushThreeWayDiffAtom, createThreeWayDiffData({
        turn_id: TURN_ID,
        conflicts: [{ start_line: 2, end_line: 2 }],
      }));
    });

    expect(screen.getByText("1 conflict")).toBeInTheDocument();
  });

  it("shows three panels (Base, Agent, Current) for pending diff", () => {
    renderWithStore(TURN_ID, (store) => {
      store.set(pushThreeWayDiffAtom, createThreeWayDiffData({ turn_id: TURN_ID }));
    });

    expect(screen.getByText("Base")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("shows action buttons for pending diff", () => {
    renderWithStore(TURN_ID, (store) => {
      store.set(pushThreeWayDiffAtom, createThreeWayDiffData({ turn_id: TURN_ID }));
    });

    expect(screen.getByText("Accept Agent")).toBeInTheDocument();
    expect(screen.getByText("Keep Current")).toBeInTheDocument();
    expect(screen.getByText("Manual Merge")).toBeInTheDocument();
  });

  it("each panel shows correct line count", () => {
    renderWithStore(TURN_ID, (store) => {
      store.set(pushThreeWayDiffAtom, createThreeWayDiffData({
        turn_id: TURN_ID,
        base_content: "a\nb\nc",
        agent_content: "a\nb\nc\nd",
        current_content: "x",
        conflicts: [],
      }));
    });

    expect(screen.getByText("3 lines")).toBeInTheDocument();
    expect(screen.getByText("4 lines")).toBeInTheDocument();
    expect(screen.getByText("1 line")).toBeInTheDocument();
  });

  it("shows resolved badge when status is resolved", () => {
    renderWithStore(TURN_ID, (store) => {
      store.set(pushThreeWayDiffAtom, createThreeWayDiffData({
        turn_id: TURN_ID,
        file_path: "src/utils.ts",
        status: "resolved",
        resolution: "accept_agent",
      }));
    });

    expect(screen.getByText(/utils\.ts/)).toBeInTheDocument();
    expect(screen.getByText(/Agent 변경 적용/)).toBeInTheDocument();
    // Should NOT show action buttons
    expect(screen.queryByText("Accept Agent")).not.toBeInTheDocument();
  });
});
