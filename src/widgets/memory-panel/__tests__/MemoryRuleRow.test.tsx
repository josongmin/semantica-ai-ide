import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertMemoryRuleAtom } from "../../../entities/memory-rule";
import { createMemoryRule } from "../../../shared/lib/mocks";
import type { MemoryRuleId } from "../../../shared/protocol";
import { MemoryRuleRow } from "../MemoryRuleRow";

// ─── Helpers ────────────────────────────────────────────────

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

const defaultRule = createMemoryRule({
  id: "rule-1" as MemoryRuleId,
  title: "Always use strict mode",
  content: "Enable TypeScript strict mode in all projects.",
  source: "custom",
  active: true,
});

const defaultProps = {
  id: "rule-1",
  onToggle: vi.fn(),
  onDelete: vi.fn(),
  onEdit: vi.fn(),
  onCancelEdit: vi.fn(),
  onSave: vi.fn(),
};

// ─── Tests ──────────────────────────────────────────────────

describe("MemoryRuleRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders rule title and source", () => {
    renderWithStore(<MemoryRuleRow {...defaultProps} />, (store) => {
      store.set(upsertMemoryRuleAtom, defaultRule);
    });

    expect(screen.getByText("Always use strict mode")).toBeInTheDocument();
    expect(screen.getByText("custom")).toBeInTheDocument();
  });

  it("shows Active button when rule is active", () => {
    renderWithStore(<MemoryRuleRow {...defaultProps} />, (store) => {
      store.set(upsertMemoryRuleAtom, { ...defaultRule, active: true });
    });

    expect(screen.getByRole("button", { name: "Deactivate rule" })).toHaveTextContent("Active");
  });

  it("shows Off button when rule is inactive", () => {
    renderWithStore(<MemoryRuleRow {...defaultProps} />, (store) => {
      store.set(upsertMemoryRuleAtom, { ...defaultRule, active: false });
    });

    expect(screen.getByRole("button", { name: "Activate rule" })).toHaveTextContent("Off");
  });

  it("calls onToggle when toggle button clicked", () => {
    const onToggle = vi.fn();
    renderWithStore(<MemoryRuleRow {...defaultProps} onToggle={onToggle} />, (store) => {
      store.set(upsertMemoryRuleAtom, { ...defaultRule, active: true });
    });

    fireEvent.click(screen.getByRole("button", { name: "Deactivate rule" }));

    expect(onToggle).toHaveBeenCalledWith("rule-1", false);
  });

  it("shows delete confirmation dialog on delete click", () => {
    renderWithStore(<MemoryRuleRow {...defaultProps} />, (store) => {
      store.set(upsertMemoryRuleAtom, defaultRule);
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete rule" }));

    expect(screen.getByText("Delete memory rule")).toBeInTheDocument();
  });

  it("shows Edit button", () => {
    renderWithStore(<MemoryRuleRow {...defaultProps} />, (store) => {
      store.set(upsertMemoryRuleAtom, defaultRule);
    });

    expect(screen.getByTestId("edit-rule")).toBeInTheDocument();
  });

  it("switches to edit mode", () => {
    renderWithStore(<MemoryRuleRow {...defaultProps} isEditing />, (store) => {
      store.set(upsertMemoryRuleAtom, defaultRule);
    });

    expect(screen.getByTestId("edit-title")).toBeInTheDocument();
    expect(screen.getByTestId("edit-content")).toBeInTheDocument();
  });

  it("shows drag handle when draggable", () => {
    renderWithStore(<MemoryRuleRow {...defaultProps} draggable />, (store) => {
      store.set(upsertMemoryRuleAtom, defaultRule);
    });

    expect(screen.getByTestId("drag-handle")).toBeInTheDocument();
  });
});
