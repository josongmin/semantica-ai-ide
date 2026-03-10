import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { activeNotepadIdAtom, setNotepadsAtom } from "../../../features/scratchpad";
import { scratchpadPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { createNotepad, resetIdCounter } from "../../../shared/lib/mocks";
import { ScratchpadPanel } from "../ScratchpadPanel";

beforeEach(() => {
  resetIdCounter();
});

describe("ScratchpadPanel", () => {
  it("renders empty state when no notepads exist", () => {
    renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    expect(screen.getByTestId("scratchpad-panel")).toBeInTheDocument();
    expect(screen.getByText("No notepads yet")).toBeInTheDocument();
  });

  it("renders create button in empty state", () => {
    renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    const createBtns = screen.getAllByText("Create Notepad");
    expect(createBtns.length).toBeGreaterThan(0);
  });

  it("renders notepad tabs when notepads exist", () => {
    const { store } = renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    act(() => {
      store.set(setNotepadsAtom, [
        createNotepad({ id: "np1", title: "Notes 1", updated_at_ms: 2000 }),
        createNotepad({ id: "np2", title: "Notes 2", updated_at_ms: 1000 }),
      ]);
    });

    expect(screen.getByTestId("notepad-tab-np1")).toBeInTheDocument();
    expect(screen.getByTestId("notepad-tab-np2")).toBeInTheDocument();
    expect(screen.getByText("Notes 1")).toBeInTheDocument();
    expect(screen.getByText("Notes 2")).toBeInTheDocument();
  });

  it("shows editor area when a notepad is selected", () => {
    const { store } = renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    act(() => {
      store.set(setNotepadsAtom, [
        createNotepad({
          id: "np1",
          title: "Test Notes",
          content: "Hello world",
          updated_at_ms: 1000,
        }),
      ]);
      store.set(activeNotepadIdAtom, "np1");
    });

    expect(screen.getByTestId("notepad-title-input")).toBeInTheDocument();
    expect(screen.getByTestId("notepad-content-textarea")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Notes")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();
  });

  it("creates a new notepad when create button is clicked", async () => {
    const { user } = renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    const createBtn = screen.getByTestId("create-notepad-button");
    await user.click(createBtn);

    // A new notepad tab should be created
    expect(screen.getByTestId("notepad-title-input")).toBeInTheDocument();
  });

  it("switches between notepad tabs", async () => {
    const { store, user } = renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    act(() => {
      store.set(setNotepadsAtom, [
        createNotepad({ id: "np1", title: "First", content: "Content 1", updated_at_ms: 2000 }),
        createNotepad({ id: "np2", title: "Second", content: "Content 2", updated_at_ms: 1000 }),
      ]);
      store.set(activeNotepadIdAtom, "np1");
    });

    expect(screen.getByDisplayValue("First")).toBeInTheDocument();

    // Click second tab
    const tab2 = screen.getByTestId("notepad-tab-np2");
    await user.click(tab2);

    expect(screen.getByDisplayValue("Second")).toBeInTheDocument();
  });

  it("has a save button", () => {
    const { store } = renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    act(() => {
      store.set(setNotepadsAtom, [
        createNotepad({ id: "np1", title: "Notes", updated_at_ms: 1000 }),
      ]);
      store.set(activeNotepadIdAtom, "np1");
    });

    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("shows plus button for creating new notepad in tab bar", () => {
    renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });

    expect(screen.getByTestId("create-notepad-button")).toBeInTheDocument();
  });

  it("shows last updated timestamp", () => {
    const { store } = renderWithAtoms(<ScratchpadPanel />, { initialValues: [[scratchpadPanelVisibleAtom, true]] });
    const timestamp = Date.now();

    act(() => {
      store.set(setNotepadsAtom, [
        createNotepad({ id: "np1", title: "Notes", updated_at_ms: timestamp }),
      ]);
      store.set(activeNotepadIdAtom, "np1");
    });

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });
});
