import { screen } from "@testing-library/react";

import { agentInstanceAtomFamily, agentInstanceIdsAtom } from "~entities/agent-instance";

import { renderWithAtoms } from "../../../../tests/utils";
import { agentsPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { AgentsPanel } from "../AgentsPanel";

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

const AGENT_ID = "agent_1";
const runningAgent = {
  id: AGENT_ID,
  label: "Refactor Module",
  status: "running" as const,
  progress: 45,
  model_id: "claude-opus-4",
  created_at_ms: Date.now(),
};

describe("AgentsPanel", () => {
  it("returns null when panel is not visible", () => {
    const { container } = renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, false],
        [agentInstanceIdsAtom, [AGENT_ID]],
      ],
    });

    expect(container.firstChild).toBeNull();
  });

  it("shows empty state when no agents even if visible", () => {
    renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, true],
        [agentInstanceIdsAtom, []],
      ],
    });

    expect(screen.getByText("No agents running")).toBeInTheDocument();
  });

  it("renders agents when visible and agents exist", () => {
    renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, true],
        [agentInstanceIdsAtom, [AGENT_ID]],
        [agentInstanceAtomFamily(AGENT_ID), runningAgent],
      ],
    });

    expect(screen.getByTestId("agents-panel")).toBeInTheDocument();
    expect(screen.getByText("Refactor Module")).toBeInTheDocument();
  });

  it("shows cancel button for running agent", () => {
    renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, true],
        [agentInstanceIdsAtom, [AGENT_ID]],
        [agentInstanceAtomFamily(AGENT_ID), runningAgent],
      ],
    });

    expect(screen.getByTestId(`cancel-agent-${AGENT_ID}`)).toBeInTheDocument();
  });

  it("cancel button sends postMessage with CANCEL_AGENT", async () => {
    const { user } = renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, true],
        [agentInstanceIdsAtom, [AGENT_ID]],
        [agentInstanceAtomFamily(AGENT_ID), runningAgent],
      ],
    });

    await user.click(screen.getByTestId(`cancel-agent-${AGENT_ID}`));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "CANCEL_AGENT",
      agent_id: AGENT_ID,
    });
  });

  it("does not show cancel button for completed agent", () => {
    renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, true],
        [agentInstanceIdsAtom, [AGENT_ID]],
        [agentInstanceAtomFamily(AGENT_ID), { ...runningAgent, status: "success" }],
      ],
    });

    expect(screen.queryByTestId(`cancel-agent-${AGENT_ID}`)).not.toBeInTheDocument();
  });

  it("shows queued agents with cancel button", () => {
    renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, true],
        [agentInstanceIdsAtom, [AGENT_ID]],
        [agentInstanceAtomFamily(AGENT_ID), { ...runningAgent, status: "queued" }],
      ],
    });

    expect(screen.getByTestId(`cancel-agent-${AGENT_ID}`)).toBeInTheDocument();
  });

  it("shows header with agent count", () => {
    renderWithAtoms(<AgentsPanel />, {
      initialValues: [
        [agentsPanelVisibleAtom, true],
        [agentInstanceIdsAtom, [AGENT_ID]],
        [agentInstanceAtomFamily(AGENT_ID), runningAgent],
      ],
    });

    expect(screen.getByText("Agents")).toBeInTheDocument();
    // Running count shown as numeric badge
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
