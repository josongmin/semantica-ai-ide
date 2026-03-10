import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { agentInstanceAtomFamily } from "~entities/agent-instance";

import { createAgentInstance } from "../../../shared/lib/mocks";
import type { AgentInstanceId } from "../../../shared/protocol";
import { AgentInstanceRow } from "../AgentInstanceRow";

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return render(<Provider store={store}>{ui}</Provider>);
}

const AGENT_ID = "agent-1";
const noop = () => {};

describe("AgentInstanceRow", () => {
  it("renders agent label and status", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          label: "Worker Alpha",
          status: "running",
        }),
      );
    });

    expect(screen.getByText("Worker Alpha")).toBeInTheDocument();
    expect(screen.getByTestId(`agent-row-${AGENT_ID}`)).toBeInTheDocument();
  });

  it("shows cancel button for active agents", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          status: "running",
        }),
      );
    });

    expect(screen.getByTestId(`cancel-agent-${AGENT_ID}`)).toBeInTheDocument();
  });

  it("shows current file name (truncated)", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          status: "running",
          current_file: "src/components/Header.tsx",
        }),
      );
    });

    const fileEl = screen.getByTestId("current-file");
    expect(fileEl).toBeInTheDocument();
    expect(fileEl).toHaveTextContent("Header.tsx");
  });

  it("does not show file when current_file is undefined", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          status: "running",
        }),
      );
    });

    expect(screen.queryByTestId("current-file")).not.toBeInTheDocument();
  });

  it("shows file progress badge", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          status: "running",
          files_processed: 3,
          files_total: 10,
        }),
      );
    });

    const badge = screen.getByTestId("file-progress-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("3/10");
  });

  it("shows file count text when completed", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          status: "success",
          files_processed: 10,
          files_total: 10,
        }),
      );
    });

    // Completed agents show "N files" text instead of badge
    expect(screen.getByText("10 files")).toBeInTheDocument();
    expect(screen.queryByTestId("file-progress-badge")).not.toBeInTheDocument();
  });

  it("shows current task", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          status: "running",
          current_task: "Analyzing imports",
        }),
      );
    });

    const taskEl = screen.getByTestId("current-task");
    expect(taskEl).toBeInTheDocument();
    expect(taskEl).toHaveTextContent("Analyzing imports");
  });

  it("expands resource details on chevron click", () => {
    renderWithStore(<AgentInstanceRow id={AGENT_ID} onCancel={noop} />, (store) => {
      store.set(
        agentInstanceAtomFamily(AGENT_ID),
        createAgentInstance({
          id: AGENT_ID as AgentInstanceId,
          status: "running",
          resources: { memory_mb: 128.5, cpu_percent: 45.2 },
        }),
      );
    });

    // Resource details should not be visible initially
    expect(screen.queryByTestId("resource-details")).not.toBeInTheDocument();

    // Click the expand chevron
    fireEvent.click(screen.getByTestId("expand-resources"));

    // Resource details should now be visible
    const details = screen.getByTestId("resource-details");
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent("129 MB");
    expect(details).toHaveTextContent("45%");
  });
});
