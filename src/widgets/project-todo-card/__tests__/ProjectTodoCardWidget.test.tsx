import { screen } from "@testing-library/react";

import { projectTodoMapAtom } from "~entities/project-todo";

import { renderWithAtoms } from "../../../../tests/utils";
import type { ProjectTodo, ProjectTodoId, TurnId } from "../../../shared/protocol";
import { ProjectTodoCardWidget } from "../ProjectTodoCardWidget";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

const TEST_TURN_ID = "turn_test" as TurnId;

function makeTodo(o: {
  id: string;
  label: string;
  status?: "pending" | "in_progress" | "completed" | "failed";
  priority?: "high" | "medium" | "low";
  updated_at_ms?: number;
}): ProjectTodo {
  return {
    id: o.id as ProjectTodoId,
    label: o.label,
    status: o.status ?? "pending",
    priority: o.priority ?? "medium",
    source_session_ids: [],
    source_turn_id: TEST_TURN_ID,
    created_at_ms: Date.now(),
    updated_at_ms: o.updated_at_ms ?? Date.now(),
  };
}

function makeMap(todos: ProjectTodo[]): ReadonlyMap<ProjectTodoId, ProjectTodo> {
  const m = new Map<ProjectTodoId, ProjectTodo>();
  for (const t of todos) m.set(t.id, t);
  return m;
}

describe("ProjectTodoCardWidget", () => {
  it("returns null when there are no TODOs", () => {
    const { container } = renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, new Map()]],
    });
    expect(container.firstChild).toBeNull();
  });

  it("renders when TODOs exist", () => {
    const todos = [makeTodo({ id: "t1", label: "Task 1" })];
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("Project TODOs")).toBeInTheDocument();
  });

  it("shows todo label", () => {
    const todos = [makeTodo({ id: "t1", label: "Fix auth bug" })];
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("Fix auth bug")).toBeInTheDocument();
  });

  it("shows priority badge", () => {
    const todos = [makeTodo({ id: "t1", label: "Task", priority: "high" })];
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("limits visible items to 5 and shows remaining count", () => {
    const todos = Array.from({ length: 8 }, (_, i) =>
      makeTodo({ id: `t${i}`, label: `Task ${i}`, updated_at_ms: Date.now() - i * 1000 }),
    );
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    // Should show "+3 more — View all"
    expect(screen.getByText(/\+3 more/)).toBeInTheDocument();
  });

  it("does not show remaining count when 5 or fewer items", () => {
    const todos = Array.from({ length: 4 }, (_, i) =>
      makeTodo({ id: `t${i}`, label: `Task ${i}` }),
    );
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it("navigates to todo board when open button clicked", async () => {
    const todos = [makeTodo({ id: "t1", label: "Task 1" })];
    const { user } = renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });

    const openBtn = screen.getByLabelText("Open TODO board");
    await user.click(openBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "LOAD_PROJECT_TODOS" });
  });

  it("shows progress bar", () => {
    const todos = [
      makeTodo({ id: "t1", label: "Done", status: "completed" }),
      makeTodo({ id: "t2", label: "Pending", status: "pending" }),
    ];
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    // Progress bar should show "50%"
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("prefers showing active todos over completed", () => {
    const todos = [
      makeTodo({ id: "t1", label: "Active task", status: "pending", updated_at_ms: 1000 }),
      makeTodo({ id: "t2", label: "Done task", status: "completed", updated_at_ms: 2000 }),
    ];
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("Active task")).toBeInTheDocument();
  });

  it("renders list with proper role", () => {
    const todos = [makeTodo({ id: "t1", label: "Task" })];
    renderWithAtoms(<ProjectTodoCardWidget turnId={TEST_TURN_ID} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
