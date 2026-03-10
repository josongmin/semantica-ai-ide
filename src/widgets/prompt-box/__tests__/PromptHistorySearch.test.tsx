import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  historySearchOpenAtom,
  historySearchQueryAtom,
  promptHistoryAtom,
} from "../../../features/prompt-history";
import { PromptHistorySearchOverlay } from "../PromptHistorySearchOverlay";

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("PromptHistorySearchOverlay", () => {
  it("returns null when not open", () => {
    const { container } = renderWithStore(<PromptHistorySearchOverlay onSelect={vi.fn()} />);
    expect(screen.queryByTestId("history-search-overlay")).not.toBeInTheDocument();
    expect(container.innerHTML).toBe("");
  });

  it("renders when open", () => {
    renderWithStore(<PromptHistorySearchOverlay onSelect={vi.fn()} />, (store) => {
      store.set(historySearchOpenAtom, true);
    });
    expect(screen.getByTestId("history-search-overlay")).toBeInTheDocument();
  });

  it("shows search input", () => {
    renderWithStore(<PromptHistorySearchOverlay onSelect={vi.fn()} />, (store) => {
      store.set(historySearchOpenAtom, true);
    });
    expect(screen.getByTestId("history-search-input")).toBeInTheDocument();
  });

  it("displays history entries", () => {
    renderWithStore(<PromptHistorySearchOverlay onSelect={vi.fn()} />, (store) => {
      store.set(historySearchOpenAtom, true);
      store.set(promptHistoryAtom, ["hello", "world", "test"]);
    });
    expect(screen.getByTestId("history-item-0")).toBeInTheDocument();
    expect(screen.getByTestId("history-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("history-item-2")).toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("world")).toBeInTheDocument();
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("filters entries by query", () => {
    renderWithStore(<PromptHistorySearchOverlay onSelect={vi.fn()} />, (store) => {
      store.set(historySearchOpenAtom, true);
      store.set(promptHistoryAtom, ["hello", "world", "test"]);
      store.set(historySearchQueryAtom, "hel");
    });
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.queryByText("world")).not.toBeInTheDocument();
    expect(screen.queryByText("test")).not.toBeInTheDocument();
  });

  it("calls onSelect with selected entry", () => {
    const onSelect = vi.fn();
    renderWithStore(<PromptHistorySearchOverlay onSelect={onSelect} />, (store) => {
      store.set(historySearchOpenAtom, true);
      store.set(promptHistoryAtom, ["hello", "world", "test"]);
    });
    fireEvent.click(screen.getByTestId("history-item-1"));
    expect(onSelect).toHaveBeenCalledWith("world");
  });

  it("closes on Escape", () => {
    renderWithStore(<PromptHistorySearchOverlay onSelect={vi.fn()} />, (store) => {
      store.set(historySearchOpenAtom, true);
      store.set(promptHistoryAtom, ["hello"]);
    });
    expect(screen.getByTestId("history-search-overlay")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByTestId("history-search-input"), {
      key: "Escape",
    });

    expect(screen.queryByTestId("history-search-overlay")).not.toBeInTheDocument();
  });

  it("navigates with arrow keys", () => {
    renderWithStore(<PromptHistorySearchOverlay onSelect={vi.fn()} />, (store) => {
      store.set(historySearchOpenAtom, true);
      store.set(promptHistoryAtom, ["hello", "world", "test"]);
    });

    const input = screen.getByTestId("history-search-input");

    // Initially first item is selected
    expect(screen.getByTestId("history-item-0")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("history-item-1")).toHaveAttribute("aria-selected", "false");

    // Press ArrowDown to select second item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByTestId("history-item-0")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("history-item-1")).toHaveAttribute("aria-selected", "true");

    // Press ArrowDown again to select third item
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByTestId("history-item-1")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("history-item-2")).toHaveAttribute("aria-selected", "true");

    // Press ArrowUp to go back to second item
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getByTestId("history-item-1")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("history-item-2")).toHaveAttribute("aria-selected", "false");
  });
});
