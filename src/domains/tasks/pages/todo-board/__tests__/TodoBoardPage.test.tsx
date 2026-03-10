import { screen, within } from "@testing-library/react";

import { currentPageAtom, todoBoardFilterAtom, todoBoardSortAtom } from "~shared/lib";

import { renderWithAtoms } from "../../../../../../tests/utils";

// ─── Mocks ────────────────────────────────────────────────

const mockLoadTodos = vi.fn();
const mockAddTodo = vi.fn();
const mockDeleteTodo = vi.fn();

let boardShouldThrow = false;

vi.mock("~features/project-todo", () => ({
  useProjectTodoActions: () => ({
    loadTodos: mockLoadTodos,
    addTodo: mockAddTodo,
    deleteTodo: mockDeleteTodo,
  }),
}));

vi.mock("~widgets/todo-board", () => ({
  TodoBoard: ({ onDelete }: { onDelete: (todo: unknown) => void }) => {
    if (boardShouldThrow) throw new Error("Board crashed");
    return (
      <div data-testid="todo-board">
        <button
          data-testid="trigger-delete"
          onClick={() => onDelete({ id: "todo_1", label: "Fix bug" })}
        >
          Delete item
        </button>
      </div>
    );
  },
}));

// Must import after vi.mock calls
import { TodoBoardPage } from "../TodoBoardPage";

beforeEach(() => {
  mockLoadTodos.mockClear();
  mockAddTodo.mockClear();
  mockDeleteTodo.mockClear();
  boardShouldThrow = false;
});

// ─── Tests ────────────────────────────────────────────────

describe("TodoBoardPage", () => {
  it("renders the page with header, search input, and board", () => {
    renderWithAtoms(<TodoBoardPage />);

    expect(screen.getByTestId("todo-board-page")).toBeInTheDocument();
    expect(screen.getByText("Project TODOs")).toBeInTheDocument();
    expect(screen.getByTestId("todo-search")).toBeInTheDocument();
    expect(screen.getByTestId("todo-board")).toBeInTheDocument();
  });

  it("back button sets currentPageAtom to 'chat'", async () => {
    const { store, user } = renderWithAtoms(<TodoBoardPage />, {
      initialValues: [[currentPageAtom, "todos"]],
    });

    const backButton = screen.getByLabelText("Back to chat");
    await user.click(backButton);

    expect(store.get(currentPageAtom)).toBe("chat");
  });

  it("calls loadTodos on mount", () => {
    renderWithAtoms(<TodoBoardPage />);

    expect(mockLoadTodos).toHaveBeenCalledTimes(1);
  });

  it("search input updates when user types", async () => {
    const { user } = renderWithAtoms(<TodoBoardPage />);

    const searchInput = screen.getByTestId("todo-search");
    await user.type(searchInput, "my task");

    expect(searchInput).toHaveValue("my task");
  });

  it("filter pills work — clicking 'Pending' activates it", async () => {
    const { store, user } = renderWithAtoms(<TodoBoardPage />);

    const pendingFilter = screen.getByTestId("filter-pending");
    await user.click(pendingFilter);

    expect(store.get(todoBoardFilterAtom)).toBe("pending");
    // Active filter has the focus ring style
    expect(pendingFilter.className).toMatch(/vsc-focus/);
  });

  it("sort buttons work — clicking 'Priority' activates it", async () => {
    const { store, user } = renderWithAtoms(<TodoBoardPage />);

    const prioritySort = screen.getByTestId("sort-priority");
    await user.click(prioritySort);

    expect(store.get(todoBoardSortAtom)).toBe("priority");
    // Active sort button has the focus ring style
    expect(prioritySort.className).toMatch(/vsc-focus/);
  });

  it("'New' button opens add dialog", async () => {
    const { user } = renderWithAtoms(<TodoBoardPage />);

    const newButton = screen.getByText("New");
    await user.click(newButton);

    expect(screen.getByText("New TODO")).toBeInTheDocument();
    expect(screen.getByTestId("new-todo-input")).toBeInTheDocument();
  });

  it("add dialog — type label, select priority, click Add calls addTodo", async () => {
    const { user } = renderWithAtoms(<TodoBoardPage />);

    // Open dialog
    await user.click(screen.getByText("New"));

    // Type label
    const input = screen.getByTestId("new-todo-input");
    await user.type(input, "Write tests");

    // Select high priority
    const highPriority = screen.getByTestId("priority-high");
    await user.click(highPriority);

    // Click Add
    const addButton = screen.getByTestId("confirm-add");
    await user.click(addButton);

    expect(mockAddTodo).toHaveBeenCalledTimes(1);
    expect(mockAddTodo).toHaveBeenCalledWith("Write tests", "high");
  });

  it("add dialog — Enter key submits the form", async () => {
    const { user } = renderWithAtoms(<TodoBoardPage />);

    // Open dialog
    await user.click(screen.getByText("New"));

    // Type label and press Enter
    const input = screen.getByTestId("new-todo-input");
    await user.type(input, "Quick task{Enter}");

    expect(mockAddTodo).toHaveBeenCalledTimes(1);
    expect(mockAddTodo).toHaveBeenCalledWith("Quick task", "medium");
  });

  it("add dialog — Cancel closes without calling addTodo", async () => {
    const { user } = renderWithAtoms(<TodoBoardPage />);

    // Open dialog
    await user.click(screen.getByText("New"));
    expect(screen.getByText("New TODO")).toBeInTheDocument();

    // Type something but then cancel
    const input = screen.getByTestId("new-todo-input");
    await user.type(input, "will be discarded");

    // Click Cancel
    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(mockAddTodo).not.toHaveBeenCalled();
  });

  it("delete confirmation — trigger from TodoBoard, confirm calls deleteTodo", async () => {
    const { user } = renderWithAtoms(<TodoBoardPage />);

    // Trigger delete from mock TodoBoard
    const deleteButton = screen.getByTestId("trigger-delete");
    await user.click(deleteButton);

    // Confirm dialog should appear with the label
    expect(screen.getByText("Delete TODO")).toBeInTheDocument();
    expect(screen.getByText(/Fix bug/)).toBeInTheDocument();

    // Confirm the deletion
    const confirmButton = screen.getByTestId("confirm-delete");
    await user.click(confirmButton);

    expect(mockDeleteTodo).toHaveBeenCalledTimes(1);
    expect(mockDeleteTodo).toHaveBeenCalledWith("todo_1");
  });

  it("delete confirmation — cancel closes dialog without calling deleteTodo", async () => {
    const { user } = renderWithAtoms(<TodoBoardPage />);

    // Trigger delete from mock TodoBoard
    const deleteButton = screen.getByTestId("trigger-delete");
    await user.click(deleteButton);

    // Confirm dialog should appear
    expect(screen.getByText("Delete TODO")).toBeInTheDocument();

    // Cancel the deletion — get the Cancel button inside the delete dialog
    const deleteDialog = screen.getByRole("dialog");
    const cancelButton = within(deleteDialog).getByText("Cancel");
    await user.click(cancelButton);

    expect(mockDeleteTodo).not.toHaveBeenCalled();
  });

  it("ErrorBoundary wrapping catches render errors", () => {
    boardShouldThrow = true;

    // Suppress React error boundary console.error for cleaner test output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithAtoms(<TodoBoardPage />);

    // ErrorBoundary caught the crash — fallback is shown
    expect(screen.queryByTestId("todo-board")).not.toBeInTheDocument();
    expect(screen.getByText("Todo board failed to load")).toBeInTheDocument();

    spy.mockRestore();
  });
});
