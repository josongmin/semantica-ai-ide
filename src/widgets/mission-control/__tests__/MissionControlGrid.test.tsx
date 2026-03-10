import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import {
  agentGridLayoutAtom,
  missionControlVisibleAtom,
  setMissionControlAgentsAtom,
} from "../../../features/parallel-agents";
import { createMissionControlAgent, resetIdCounter } from "../../../shared/lib/mocks";
import type { AgentInstanceId, SessionId } from "../../../shared/protocol";
import { MissionControlGrid } from "../MissionControlGrid";

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

describe("MissionControlGrid", () => {
  it("renders nothing when not visible", () => {
    const { container } = renderWithAtoms(<MissionControlGrid />);
    expect(container.querySelector("[data-testid='mission-control-grid']")).toBeNull();
  });

  it("renders empty state when visible but no agents", () => {
    renderWithAtoms(<MissionControlGrid />, {
      initialValues: [[missionControlVisibleAtom, true]],
    });
    expect(screen.getByTestId("mission-control-grid")).toBeInTheDocument();
    expect(screen.getByText("No agents running")).toBeInTheDocument();
  });

  it("renders agent cards when agents are present", () => {
    const { store } = renderWithAtoms(<MissionControlGrid />, {
      initialValues: [[missionControlVisibleAtom, true]],
    });

    act(() => {
      store.set(setMissionControlAgentsAtom, [
        createMissionControlAgent({
          id: "agent-1" as unknown as AgentInstanceId,
          name: "Agent Alpha",
          status: "running",
          progress_pct: 75,
          session_id: "session-1" as SessionId,
        }),
        createMissionControlAgent({
          id: "agent-2" as unknown as AgentInstanceId,
          name: "Agent Beta",
          status: "error",
          progress_pct: 30,
          session_id: "session-2" as SessionId,
        }),
      ]);
    });

    expect(screen.getByTestId("mission-control-card-agent-1")).toBeInTheDocument();
    expect(screen.getByTestId("mission-control-card-agent-2")).toBeInTheDocument();
    expect(screen.getByText("Agent Alpha")).toBeInTheDocument();
    expect(screen.getByText("Agent Beta")).toBeInTheDocument();
  });

  it("navigates to agent session on card click", async () => {
    const { store, user } = renderWithAtoms(<MissionControlGrid />, {
      initialValues: [[missionControlVisibleAtom, true]],
    });

    act(() => {
      store.set(setMissionControlAgentsAtom, [
        createMissionControlAgent({
          id: "agent-1" as unknown as AgentInstanceId,
          name: "Agent Alpha",
          session_id: "session-abc" as SessionId,
        }),
      ]);
    });

    const card = screen.getByTestId("mission-control-card-agent-1");
    await user.click(card);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "RESUME_SESSION",
      session_id: "session-abc",
    });
  });

  it("shows Mission Control title in the header", () => {
    const { store } = renderWithAtoms(<MissionControlGrid />, {
      initialValues: [[missionControlVisibleAtom, true]],
    });

    act(() => {
      store.set(setMissionControlAgentsAtom, [
        createMissionControlAgent({
          id: "agent-1" as unknown as AgentInstanceId,
          name: "A",
          status: "running",
        }),
        createMissionControlAgent({
          id: "agent-2" as unknown as AgentInstanceId,
          name: "B",
          status: "running",
        }),
        createMissionControlAgent({
          id: "agent-3" as unknown as AgentInstanceId,
          name: "C",
          status: "error",
        }),
      ]);
    });

    expect(screen.getByText("Mission Control")).toBeInTheDocument();
  });

  it("closes when close button is clicked", async () => {
    const { store, user } = renderWithAtoms(<MissionControlGrid />, {
      initialValues: [[missionControlVisibleAtom, true]],
    });

    const closeBtn = screen.getByLabelText("Close Mission Control");
    await user.click(closeBtn);

    expect(store.get(missionControlVisibleAtom)).toBe(false);
  });

  it("supports list layout mode", () => {
    const { store } = renderWithAtoms(<MissionControlGrid />, {
      initialValues: [
        [missionControlVisibleAtom, true],
        [agentGridLayoutAtom, "list"],
      ],
    });

    act(() => {
      store.set(setMissionControlAgentsAtom, [
        createMissionControlAgent({
          id: "agent-1" as unknown as AgentInstanceId,
          name: "Agent 1",
        }),
      ]);
    });

    const list = screen.getByRole("list", { name: "Agent list" });
    expect(list).toBeInTheDocument();
  });
});
