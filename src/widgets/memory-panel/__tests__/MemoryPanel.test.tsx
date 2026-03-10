import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { MemoryPanel } from "../MemoryPanel";

// ─── Mocks ──────────────────────────────────────────────────

const mockSaveRule = vi.fn();
const mockDeleteRule = vi.fn();
const mockToggleActive = vi.fn();
const mockSetEditingRuleId = vi.fn();
const mockTogglePanel = vi.fn();

let mockReturnValue: Record<string, unknown> = {};

vi.mock("../../../features/project-memory", () => ({
  useProjectMemory: () => mockReturnValue,
}));

// Mock MemoryRuleRow so the panel test is isolated
vi.mock("../MemoryRuleRow", () => ({
  MemoryRuleRow: (props: { id: string; draggable?: boolean }) => (
    <div data-testid={`rule-row-${props.id}`} draggable={props.draggable}>
      {props.id}
    </div>
  ),
}));

// Mock reorderMemoryRulesAtom (used by useSetAtom inside MemoryPanel)
vi.mock("../../../entities/memory-rule", () => ({
  reorderMemoryRulesAtom: { write: vi.fn() },
}));

// ─── Helpers ────────────────────────────────────────────────

function renderPanel() {
  const store = createStore();
  return render(
    <Provider store={store}>
      <MemoryPanel />
    </Provider>,
  );
}

// ─── Tests ──────────────────────────────────────────────────

describe("MemoryPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturnValue = {
      panelVisible: true,
      ruleIds: ["rule-1", "rule-2", "rule-3"],
      editingRuleId: null,
      setEditingRuleId: mockSetEditingRuleId,
      rulesCount: { total: 3, active: 2 },
      togglePanel: mockTogglePanel,
      saveRule: mockSaveRule,
      deleteRule: mockDeleteRule,
      toggleActive: mockToggleActive,
    };
  });

  it("renders memory panel with rules", () => {
    renderPanel();

    expect(screen.getByRole("region", { name: /memory panel/i })).toBeInTheDocument();
    expect(screen.getByTestId("rule-row-rule-1")).toBeInTheDocument();
    expect(screen.getByTestId("rule-row-rule-2")).toBeInTheDocument();
    expect(screen.getByTestId("rule-row-rule-3")).toBeInTheDocument();
  });

  it("shows empty state when no rules", () => {
    mockReturnValue = {
      ...mockReturnValue,
      ruleIds: [],
      rulesCount: { total: 0, active: 0 },
    };

    renderPanel();

    expect(screen.getByText("No memory rules yet")).toBeInTheDocument();
    expect(screen.queryByTestId("rule-row-rule-1")).not.toBeInTheDocument();
  });

  it("returns null when not visible", () => {
    mockReturnValue = {
      ...mockReturnValue,
      panelVisible: false,
    };

    const { container } = renderPanel();

    expect(container.innerHTML).toBe("");
  });

  it("renders rule rows as draggable", () => {
    renderPanel();

    const row1 = screen.getByTestId("rule-row-rule-1");
    const row2 = screen.getByTestId("rule-row-rule-2");
    const row3 = screen.getByTestId("rule-row-rule-3");

    expect(row1).toHaveAttribute("draggable", "true");
    expect(row2).toHaveAttribute("draggable", "true");
    expect(row3).toHaveAttribute("draggable", "true");
  });

  it("shows New Rule button", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: /new rule/i })).toBeInTheDocument();
  });
});
