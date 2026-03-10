import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { setBoomerangTasksAtom } from "../../../features/boomerang-tasks";
import { createBoomerangTask, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { BoomerangTaskList } from "../BoomerangTaskList";

beforeEach(() => {
  resetIdCounter();
});

const TURN_ID = "turn_1" as TurnId;

describe("BoomerangTaskList", () => {
  it("renders nothing when no tasks exist for the turn", () => {
    const { container } = renderWithAtoms(<BoomerangTaskList turnId={TURN_ID} />);
    expect(container.querySelector("[data-testid='boomerang-task-list']")).toBeNull();
  });

  it("renders tasks when they exist for the turn", () => {
    const { store } = renderWithAtoms(<BoomerangTaskList turnId={TURN_ID} />);

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({ id: "task-1", parent_turn_id: TURN_ID, label: "Fix auth" }),
        createBoomerangTask({ id: "task-2", parent_turn_id: TURN_ID, label: "Add tests" }),
      ]);
    });

    expect(screen.getByTestId("boomerang-task-list")).toBeInTheDocument();
    expect(screen.getByTestId("boomerang-task-task-1")).toBeInTheDocument();
    expect(screen.getByTestId("boomerang-task-task-2")).toBeInTheDocument();
    expect(screen.getByText("Fix auth")).toBeInTheDocument();
    expect(screen.getByText("Add tests")).toBeInTheDocument();
  });

  it("does not render tasks for a different turn", () => {
    const { store, container } = renderWithAtoms(<BoomerangTaskList turnId={TURN_ID} />);

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({
          id: "task-other",
          parent_turn_id: "turn_other" as TurnId,
          label: "Other task",
        }),
      ]);
    });

    expect(container.querySelector("[data-testid='boomerang-task-list']")).toBeNull();
  });

  it("shows agent badge when agent_id is present", () => {
    const { store } = renderWithAtoms(<BoomerangTaskList turnId={TURN_ID} />);

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({
          id: "task-1",
          parent_turn_id: TURN_ID,
          label: "Delegated task",
          agent_id: "agent-42",
        }),
      ]);
    });

    expect(screen.getByText("agent-42")).toBeInTheDocument();
  });

  it("shows completion count in summary", () => {
    const { store } = renderWithAtoms(<BoomerangTaskList turnId={TURN_ID} />);

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({ id: "task-1", parent_turn_id: TURN_ID, status: "success" }),
        createBoomerangTask({ id: "task-2", parent_turn_id: TURN_ID, status: "running" }),
        createBoomerangTask({ id: "task-3", parent_turn_id: TURN_ID, status: "pending" }),
      ]);
    });

    expect(screen.getByText("1/3 complete")).toBeInTheDocument();
  });

  it("shows Merge Results button when all tasks are complete", () => {
    const onMerge = vi.fn();
    const { store } = renderWithAtoms(
      <BoomerangTaskList turnId={TURN_ID} onMergeResults={onMerge} />,
    );

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({ id: "task-1", parent_turn_id: TURN_ID, status: "success" }),
        createBoomerangTask({ id: "task-2", parent_turn_id: TURN_ID, status: "error" }),
      ]);
    });

    expect(screen.getByText("Merge Results")).toBeInTheDocument();
  });

  it("does not show Merge Results button when tasks are still pending", () => {
    const onMerge = vi.fn();
    const { store } = renderWithAtoms(
      <BoomerangTaskList turnId={TURN_ID} onMergeResults={onMerge} />,
    );

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({ id: "task-1", parent_turn_id: TURN_ID, status: "success" }),
        createBoomerangTask({ id: "task-2", parent_turn_id: TURN_ID, status: "running" }),
      ]);
    });

    expect(screen.queryByText("Merge Results")).not.toBeInTheDocument();
  });

  it("calls onMergeResults when Merge Results button is clicked", async () => {
    const onMerge = vi.fn();
    const { store, user } = renderWithAtoms(
      <BoomerangTaskList turnId={TURN_ID} onMergeResults={onMerge} />,
    );

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({ id: "task-1", parent_turn_id: TURN_ID, status: "success" }),
      ]);
    });

    const mergeBtn = screen.getByText("Merge Results");
    await user.click(mergeBtn);

    expect(onMerge).toHaveBeenCalledWith(TURN_ID);
  });

  it("expands result summary on click", async () => {
    const { store, user } = renderWithAtoms(<BoomerangTaskList turnId={TURN_ID} />);

    act(() => {
      store.set(setBoomerangTasksAtom, [
        createBoomerangTask({
          id: "task-1",
          parent_turn_id: TURN_ID,
          label: "Auth fix",
          status: "success",
          result_summary: "Fixed the authentication flow by updating the token validation.",
        }),
      ]);
    });

    // Initially, result should not be visible
    expect(
      screen.queryByText("Fixed the authentication flow by updating the token validation."),
    ).not.toBeInTheDocument();

    // Click to expand
    const taskRow = screen.getByTestId("boomerang-task-task-1");
    const expandable = taskRow.querySelector("button")!;
    await user.click(expandable);

    expect(
      screen.getByText("Fixed the authentication flow by updating the token validation."),
    ).toBeInTheDocument();
  });
});
