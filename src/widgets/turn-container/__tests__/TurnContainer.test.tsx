import { screen } from "@testing-library/react";

import { turnAtomFamily } from "~entities/message/turns";

import { renderWithAtoms } from "../../../../tests/utils";
import { createTurn, createTurnPhase, resetIdCounter } from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";
import { TurnContainer } from "../TurnContainer";

// Mock TurnPhaseSection to isolate TurnContainer tests
vi.mock("../TurnPhaseSection", () => ({
  TurnPhaseSection: ({ entry }: { entry: { phase: string } }) => (
    <div data-testid={`phase-${entry.phase}`}>{entry.phase}</div>
  ),
}));

beforeEach(() => resetIdCounter());

function renderTurnContainer(turnId: TurnId, turnData: ReturnType<typeof createTurn>) {
  return renderWithAtoms(<TurnContainer turnId={turnId} />, {
    initialValues: [[turnAtomFamily(turnId), turnData]],
  });
}

describe("TurnContainer", () => {
  it("renders turn with status dot and timestamp", () => {
    const turn = createTurn({
      id: "turn_1" as TurnId,
      status: "success",
      created_at_ms: new Date("2025-01-15T10:30:45").getTime(),
      phases: [
        createTurnPhase({ phase: "user_message", status: "success", message_ids: ["msg_1" as MessageId] }),
      ],
    });

    renderTurnContainer("turn_1" as TurnId, turn);

    const container = screen.getByTestId("turn-turn_1");
    expect(container).toBeInTheDocument();

    // Timestamp should be rendered
    expect(container.textContent).toContain("10:30:45");
  });

  it("running state shows progress bar when multiple phases", () => {
    const turn = createTurn({
      id: "turn_2" as TurnId,
      status: "running",
      phases: [
        createTurnPhase({ phase: "user_message", status: "success" }),
        createTurnPhase({ phase: "thinking", status: "success" }),
        createTurnPhase({ phase: "analysis", status: "running" }),
        createTurnPhase({ phase: "plan", status: "pending" }),
      ],
    });

    renderTurnContainer("turn_2" as TurnId, turn);

    // ProgressBar renders a progressbar role
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
  });

  it("error state shows InlineBanner", () => {
    const turn = createTurn({
      id: "turn_3" as TurnId,
      status: "error",
      phases: [
        createTurnPhase({ phase: "user_message", status: "success" }),
        createTurnPhase({
          phase: "analysis",
          status: "error",
          summary: "Tool execution failed",
        }),
      ],
    });

    renderTurnContainer("turn_3" as TurnId, turn);

    expect(screen.getByText("Tool execution failed")).toBeInTheDocument();
  });

  it("error state shows default error message when no error phase summary", () => {
    const turn = createTurn({
      id: "turn_4" as TurnId,
      status: "error",
      phases: [
        createTurnPhase({ phase: "user_message", status: "success" }),
        createTurnPhase({ phase: "thinking", status: "pending" }),
      ],
    });

    renderTurnContainer("turn_4" as TurnId, turn);

    expect(screen.getByText("An error occurred during this turn.")).toBeInTheDocument();
  });

  it("renders phase sections for each phase", () => {
    const turn = createTurn({
      id: "turn_5" as TurnId,
      status: "success",
      phases: [
        createTurnPhase({ phase: "user_message", status: "success", message_ids: ["msg_1" as MessageId] }),
        createTurnPhase({ phase: "thinking", status: "success", message_ids: ["msg_2" as MessageId] }),
        createTurnPhase({ phase: "summary", status: "success", message_ids: ["msg_3" as MessageId] }),
      ],
    });

    renderTurnContainer("turn_5" as TurnId, turn);

    expect(screen.getByTestId("phase-user_message")).toBeInTheDocument();
    expect(screen.getByTestId("phase-thinking")).toBeInTheDocument();
    expect(screen.getByTestId("phase-summary")).toBeInTheDocument();
  });

  it("returns null when turn data is not available", () => {
    const { container } = renderWithAtoms(<TurnContainer turnId={"nonexistent" as TurnId} />, {
      initialValues: [],
    });

    expect(container.innerHTML).toBe("");
  });
});
