import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { agentTeamPanelOpenAtom, setAgentMessagesAtom } from "../../../features/agent-team";
import { createAgentMessage, resetIdCounter } from "../../../shared/lib/mocks";
import { AgentTeamChat } from "../AgentTeamChat";

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

describe("AgentTeamChat", () => {
  it("renders nothing when panel is not open", () => {
    const { container } = renderWithAtoms(<AgentTeamChat />);
    expect(container.querySelector("[data-testid='agent-team-chat']")).toBeNull();
  });

  it("renders empty state when open but no messages", () => {
    renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });
    expect(screen.getByTestId("agent-team-chat")).toBeInTheDocument();
    expect(screen.getByText("No agent messages")).toBeInTheDocument();
  });

  it("renders agent messages when present", () => {
    const { store } = renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setAgentMessagesAtom, [
        createAgentMessage({
          id: "m1",
          from_agent: "alpha",
          to_agent: "beta",
          content: "Please review the auth module.",
          message_type: "request",
        }),
        createAgentMessage({
          id: "m2",
          from_agent: "beta",
          to_agent: "alpha",
          content: "Review complete, looks good.",
          message_type: "response",
        }),
      ]);
    });

    expect(screen.getByTestId("agent-message-m1")).toBeInTheDocument();
    expect(screen.getByTestId("agent-message-m2")).toBeInTheDocument();
    expect(screen.getByText("Please review the auth module.")).toBeInTheDocument();
    expect(screen.getByText("Review complete, looks good.")).toBeInTheDocument();
  });

  it("shows agent participants", () => {
    const { store } = renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setAgentMessagesAtom, [
        createAgentMessage({ id: "m1", from_agent: "alpha", to_agent: "beta" }),
        createAgentMessage({ id: "m2", from_agent: "gamma", to_agent: "alpha" }),
      ]);
    });

    const participantsContainer = screen.getByTestId("agent-participants");
    expect(participantsContainer).toBeInTheDocument();
    expect(screen.getByText("3 agents")).toBeInTheDocument();
  });

  it("shows message count badge", () => {
    const { store } = renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setAgentMessagesAtom, [
        createAgentMessage({ id: "m1" }),
        createAgentMessage({ id: "m2" }),
      ]);
    });

    expect(screen.getByText("2 msgs")).toBeInTheDocument();
  });

  it("closes panel when close button is clicked", async () => {
    const { store, user } = renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });

    const closeBtn = screen.getByLabelText("Close Agent Team");
    await user.click(closeBtn);

    expect(store.get(agentTeamPanelOpenAtom)).toBe(false);
  });

  it("sends SEND_AGENT_INTERVENTION when intervene button is clicked", async () => {
    const { store, user } = renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setAgentMessagesAtom, [
        createAgentMessage({ id: "m1", from_agent: "alpha", to_agent: "beta" }),
      ]);
    });

    const interveneBtn = screen.getByLabelText("Intervene");
    await user.click(interveneBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SEND_AGENT_INTERVENTION",
      agent_id: "alpha",
      message: "",
    });
  });

  it("shows message type badges", () => {
    const { store } = renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });

    act(() => {
      store.set(setAgentMessagesAtom, [
        createAgentMessage({ id: "m1", message_type: "request" }),
        createAgentMessage({ id: "m2", message_type: "response" }),
        createAgentMessage({ id: "m3", message_type: "broadcast" }),
      ]);
    });

    expect(screen.getByTestId("agent-message-m1")).toBeInTheDocument();
    expect(screen.getByTestId("agent-message-m2")).toBeInTheDocument();
    expect(screen.getByTestId("agent-message-m3")).toBeInTheDocument();
  });

  it("does not show intervene button when no participants", () => {
    renderWithAtoms(<AgentTeamChat />, {
      initialValues: [[agentTeamPanelOpenAtom, true]],
    });

    expect(screen.queryByLabelText("Intervene")).not.toBeInTheDocument();
  });
});
