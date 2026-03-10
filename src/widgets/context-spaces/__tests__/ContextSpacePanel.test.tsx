import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { contextSpacePanelOpenAtom, setContextSpacesAtom } from "../../../features/context-spaces";
import { createContextSpace, resetIdCounter } from "../../../shared/lib/mocks";
import { ContextSpacePanel } from "../ContextSpacePanel";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("ContextSpacePanel", () => {
  it("renders nothing when panel is not open", () => {
    const { container } = renderWithAtoms(<ContextSpacePanel />);
    expect(container.querySelector("[data-testid='context-space-panel']")).toBeNull();
  });

  it("renders empty state when open but no spaces", () => {
    renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });
    expect(screen.getByTestId("context-space-panel")).toBeInTheDocument();
    expect(screen.getByText("No context spaces")).toBeInTheDocument();
  });

  it("renders space rows when spaces are present", () => {
    const { store } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    act(() => {
      store.set(setContextSpacesAtom, [
        createContextSpace({ id: "s1", name: "Frontend", active: true }),
        createContextSpace({ id: "s2", name: "Backend", active: false }),
      ]);
    });

    expect(screen.getByTestId("context-space-row-s1")).toBeInTheDocument();
    expect(screen.getByTestId("context-space-row-s2")).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
  });

  it("shows active badge count", () => {
    const { store } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    act(() => {
      store.set(setContextSpacesAtom, [
        createContextSpace({ id: "s1", name: "A", active: true }),
        createContextSpace({ id: "s2", name: "B", active: true }),
        createContextSpace({ id: "s3", name: "C", active: false }),
      ]);
    });

    expect(screen.getByText("2 active")).toBeInTheDocument();
  });

  it("closes panel when close button is clicked", async () => {
    const { store, user } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    const closeBtn = screen.getByLabelText("Close Context Spaces");
    await user.click(closeBtn);

    expect(store.get(contextSpacePanelOpenAtom)).toBe(false);
  });

  it("shows create form when add button is clicked", async () => {
    const { user } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    const addBtn = screen.getByLabelText("Create Space");
    await user.click(addBtn);

    expect(screen.getByTestId("create-space-form")).toBeInTheDocument();
  });

  it("sends CREATE_CONTEXT_SPACE message on form submit", async () => {
    const { user } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    const addBtn = screen.getByLabelText("Create Space");
    await user.click(addBtn);

    const nameInput = screen.getByLabelText("Space name");
    await user.type(nameInput, "My Space");

    const descInput = screen.getByLabelText("Space description");
    await user.type(descInput, "Test description");

    const createBtn = screen.getByText("Create");
    await user.click(createBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "CREATE_CONTEXT_SPACE",
      name: "My Space",
      description: "Test description",
    });
  });

  it("sends DELETE_CONTEXT_SPACE when delete button is clicked", async () => {
    const { store, user } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    act(() => {
      store.set(setContextSpacesAtom, [createContextSpace({ id: "s1", name: "Test Space" })]);
    });

    const deleteBtn = screen.getByLabelText("Delete Test Space");
    await user.click(deleteBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DELETE_CONTEXT_SPACE",
      space_id: "s1",
    });
  });

  it("sends UPDATE_CONTEXT_SPACE when toggle button is clicked", async () => {
    const { store, user } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    act(() => {
      store.set(setContextSpacesAtom, [
        createContextSpace({ id: "s1", name: "Test Space", active: true }),
      ]);
    });

    const toggleBtn = screen.getByLabelText("Deactivate Test Space");
    await user.click(toggleBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "UPDATE_CONTEXT_SPACE",
      space_id: "s1",
      updates: { toggle_active: true },
    });
  });

  it("displays file and rule counts", () => {
    const { store } = renderWithAtoms(<ContextSpacePanel />, {
      initialValues: [[contextSpacePanelOpenAtom, true]],
    });

    act(() => {
      store.set(setContextSpacesAtom, [
        createContextSpace({
          id: "s1",
          name: "Space",
          files: ["a.ts", "b.ts", "c.ts"],
          rules: ["rule1"],
        }),
      ]);
    });

    expect(screen.getByText("3 files")).toBeInTheDocument();
    expect(screen.getByText("1 rule")).toBeInTheDocument();
  });
});
