import { screen } from "@testing-library/react";

import { turnOrderAtom } from "~entities/message/turns";
import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils";
import { createSessionMeta, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { MessageList } from "../MessageList";

// Mock TurnContainer to isolate MessageList tests
vi.mock("../../turn-container", () => ({
  TurnContainer: ({ turnId }: { turnId: string }) => (
    <div data-testid={`turn-${turnId}`} style={{ height: 100 }}>
      Turn: {turnId}
    </div>
  ),
}));

beforeEach(() => resetIdCounter());

describe("MessageList", () => {
  it("renders message rows for each turn", () => {
    const turnIds = ["turn_1", "turn_2", "turn_3"] as TurnId[];

    renderWithAtoms(<MessageList />, {
      initialValues: [
        [turnOrderAtom, turnIds],
        [sessionMetaAtom, createSessionMeta({ status: "idle" })],
      ],
    });

    expect(screen.getByTestId("turn-turn_1")).toBeInTheDocument();
    expect(screen.getByTestId("turn-turn_2")).toBeInTheDocument();
    expect(screen.getByTestId("turn-turn_3")).toBeInTheDocument();
  });

  it("empty state when no messages", () => {
    renderWithAtoms(<MessageList />, {
      initialValues: [
        [turnOrderAtom, []],
        [sessionMetaAtom, createSessionMeta({ status: "idle" })],
      ],
    });

    expect(screen.getByText("Start a conversation...")).toBeInTheDocument();
  });

  it("renders the message-list container", () => {
    renderWithAtoms(<MessageList />, {
      initialValues: [
        [turnOrderAtom, ["turn_1"] as TurnId[]],
        [sessionMetaAtom, createSessionMeta({ status: "running" })],
      ],
    });

    expect(screen.getByTestId("message-list")).toBeInTheDocument();
  });

  it("does not show scroll-to-bottom button when at bottom (default)", () => {
    renderWithAtoms(<MessageList />, {
      initialValues: [
        [turnOrderAtom, ["turn_1"] as TurnId[]],
        [sessionMetaAtom, createSessionMeta({ status: "idle" })],
      ],
    });

    // isAtBottom defaults to true → button has aria-hidden, invisible to queryByRole
    expect(screen.queryByRole("button", { name: "Scroll to bottom" })).not.toBeInTheDocument();
  });
});
