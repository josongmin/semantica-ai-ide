import { screen } from "@testing-library/react";

import { projectTodoMapAtom } from "~entities/project-todo";

import { renderWithAtoms } from "../../../../tests/utils";
import type { ProjectTodo, ProjectTodoId } from "../../../shared/protocol";
import { TodoBoard } from "../TodoBoard";

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
    created_at_ms: Date.now(),
    updated_at_ms: o.updated_at_ms ?? Date.now(),
  };
}

function makeMap(todos: ProjectTodo[]): ReadonlyMap<ProjectTodoId, ProjectTodo> {
  const m = new Map<ProjectTodoId, ProjectTodo>();
  for (const t of todos) m.set(t.id, t);
  return m;
}

const noop = vi.fn();

describe("TodoBoard", () => {
  it("shows empty state when no TODOs", () => {
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, new Map()]],
    });
    expect(screen.getByText("No project TODOs yet")).toBeInTheDocument();
  });

  it("renders todo board region", () => {
    const todos = [makeTodo({ id: "t1", label: "Task 1" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByRole("region", { name: "Todo board" })).toBeInTheDocument();
  });

  it("renders pending column with items", () => {
    const todos = [makeTodo({ id: "t1", label: "Pending task", status: "pending" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Pending task")).toBeInTheDocument();
  });

  it("renders in_progress column with items", () => {
    const todos = [makeTodo({ id: "t1", label: "Active task", status: "in_progress" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Active task")).toBeInTheDocument();
  });

  it("hides empty completed column", () => {
    const todos = [makeTodo({ id: "t1", label: "Task", status: "pending" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    // Completed column should not render when empty
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });

  it("hides empty failed column", () => {
    const todos = [makeTodo({ id: "t1", label: "Task", status: "pending" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.queryByText("Failed")).not.toBeInTheDocument();
  });

  it("shows completed column when it has items", () => {
    const todos = [makeTodo({ id: "t1", label: "Done task", status: "completed" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Done task")).toBeInTheDocument();
  });

  it("renders cards with todo label and priority", () => {
    const todos = [makeTodo({ id: "t1", label: "Important task", priority: "high" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByText("Important task")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("renders cards with data-testid", () => {
    const todos = [makeTodo({ id: "t1", label: "Task" })];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    expect(screen.getByTestId("todo-card-t1")).toBeInTheDocument();
  });

  it("renders multiple columns for mixed statuses", () => {
    const todos = [
      makeTodo({ id: "t1", label: "Todo alpha", status: "pending" }),
      makeTodo({ id: "t2", label: "Todo beta", status: "in_progress" }),
      makeTodo({ id: "t3", label: "Todo gamma", status: "completed" }),
      makeTodo({ id: "t4", label: "Todo delta", status: "failed" }),
    ];
    renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    // All 4 column headers render
    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Failed").length).toBeGreaterThanOrEqual(1);
    // All 4 todo cards render
    expect(screen.getByText("Todo alpha")).toBeInTheDocument();
    expect(screen.getByText("Todo beta")).toBeInTheDocument();
    expect(screen.getByText("Todo gamma")).toBeInTheDocument();
    expect(screen.getByText("Todo delta")).toBeInTheDocument();
  });

  it("calls onDelete when delete action is triggered", async () => {
    const onDelete = vi.fn();
    const todos = [makeTodo({ id: "t1", label: "Task" })];
    const { user } = renderWithAtoms(<TodoBoard onDelete={onDelete} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    const deleteBtn = screen.getByTestId("todo-card-t1").querySelector("[aria-label='Delete']");
    expect(deleteBtn).toBeTruthy();
    await user.click(deleteBtn!);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
  });

  it("sends UPDATE_PROJECT_TODO when status action clicked", async () => {
    const todos = [makeTodo({ id: "t1", label: "Task", status: "pending" })];
    const { user } = renderWithAtoms(<TodoBoard onDelete={noop} />, {
      initialValues: [[projectTodoMapAtom, makeMap(todos)]],
    });
    // "Start" button should transition pending → in_progress
    const startBtn = screen.getByTestId("todo-card-t1").querySelector("[aria-label='Start']");
    expect(startBtn).toBeTruthy();
    await user.click(startBtn!);
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "UPDATE_PROJECT_TODO", id: "t1", status: "in_progress" }),
    );
  });
});
