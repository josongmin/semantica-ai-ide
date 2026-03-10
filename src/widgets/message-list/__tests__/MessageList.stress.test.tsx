/**
 * Stress tests for MessageList with many turns/messages.
 *
 * Tests:
 * - Rendering with large numbers of turns
 * - Dynamic turn addition during streaming
 * - Scroll state consistency
 */
import { act, screen, waitFor } from "@testing-library/react";

import { turnOrderAtom } from "~entities/message/turns";
import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils";
import { createSessionMeta, resetIdCounter } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { MessageList } from "../MessageList";

// ─── Mocks ─────────────────────────────────────────────────
// Mock TurnContainer to lightweight render
vi.mock("../../turn-container", () => ({
  TurnContainer: ({ turnId }: { turnId: string }) => (
    <div data-testid={`turn-${turnId}`} style={{ height: 100 }}>
      Turn: {turnId}
    </div>
  ),
}));

// ─── Lifecycle ─────────────────────────────────────────────
beforeEach(() => {
  resetIdCounter();
});

// ─── Helpers ───────────────────────────────────────────────
function makeTurnIds(count: number): TurnId[] {
  return Array.from({ length: count }, (_, i) => `turn_${i}` as TurnId);
}

// ─── Tests ─────────────────────────────────────────────────
describe("MessageList – stress & large dataset", () => {
  // ── Large Turn Count Rendering ─────────────────────────
  describe("large turn count rendering", () => {
    it("500 turns: all rendered without crash", () => {
      const turnIds = makeTurnIds(500);
      renderWithAtoms(<MessageList />, {
        initialValues: [
          [turnOrderAtom, turnIds],
          [sessionMetaAtom, createSessionMeta({ status: "idle" })],
        ],
      });

      // First and last turn should be in document
      expect(screen.getByTestId("turn-turn_0")).toBeInTheDocument();
      expect(screen.getByTestId("turn-turn_499")).toBeInTheDocument();
    });

    it("0 → 500 turns incrementally: empty state disappears, turns appear", async () => {
      const { store } = renderWithAtoms(<MessageList />, {
        initialValues: [
          [turnOrderAtom, [] as TurnId[]],
          [sessionMetaAtom, createSessionMeta({ status: "idle" })],
        ],
      });

      expect(screen.getByText("Start a conversation...")).toBeInTheDocument();

      // Add turns incrementally
      act(() => {
        store.set(turnOrderAtom, makeTurnIds(500));
      });

      await waitFor(() => {
        expect(screen.queryByText("Start a conversation...")).not.toBeInTheDocument();
        expect(screen.getByTestId("turn-turn_0")).toBeInTheDocument();
      });
    });
  });

  // ── Dynamic Turn Addition (Streaming) ──────────────────
  describe("dynamic turn addition during streaming", () => {
    it("50 turns added in rapid succession: all rendered in final state", async () => {
      const { store } = renderWithAtoms(<MessageList />, {
        initialValues: [
          [turnOrderAtom, [] as TurnId[]],
          [sessionMetaAtom, createSessionMeta({ status: "idle" })],
        ],
      });

      // Batch add
      act(() => {
        for (let i = 1; i <= 50; i++) {
          store.set(turnOrderAtom, makeTurnIds(i));
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId("turn-turn_49")).toBeInTheDocument();
      });
    });
  });

  // ── State Transition With Many Turns ───────────────────
  describe("state transitions with many turns", () => {
    it("idle → running → idle with 200 turns: no crash, correct final state", async () => {
      const turnIds = makeTurnIds(200);
      const { store } = renderWithAtoms(<MessageList />, {
        initialValues: [
          [turnOrderAtom, turnIds],
          [sessionMetaAtom, createSessionMeta({ status: "idle" })],
        ],
      });

      // Transition to running
      act(() => {
        store.set(sessionMetaAtom, createSessionMeta({ status: "running" }));
      });

      // Add more turns while running
      act(() => {
        store.set(turnOrderAtom, makeTurnIds(250));
      });

      // Transition back to idle
      act(() => {
        store.set(sessionMetaAtom, createSessionMeta({ status: "idle" }));
      });

      await waitFor(() => {
        expect(screen.getByTestId("turn-turn_249")).toBeInTheDocument();
      });
    });

    it("rapid status toggling with turns: no crash", async () => {
      const { store } = renderWithAtoms(<MessageList />, {
        initialValues: [
          [turnOrderAtom, makeTurnIds(100)],
          [sessionMetaAtom, createSessionMeta({ status: "idle" })],
        ],
      });

      // Toggle status 20 times
      act(() => {
        for (let i = 0; i < 20; i++) {
          store.set(
            sessionMetaAtom,
            createSessionMeta({ status: i % 2 === 0 ? "running" : "idle" }),
          );
        }
      });

      // Should not throw, all turns still rendered
      await waitFor(() => {
        expect(screen.getByTestId("turn-turn_99")).toBeInTheDocument();
      });
    });
  });

  // ── Scroll Button Edge Cases ───────────────────────────
  describe("scroll button edge cases", () => {
    it("scroll-to-bottom button hidden when at bottom (default, many turns)", () => {
      renderWithAtoms(<MessageList />, {
        initialValues: [
          [turnOrderAtom, makeTurnIds(500)],
          [sessionMetaAtom, createSessionMeta({ status: "idle" })],
        ],
      });

      // Default isAtBottom=true → button has aria-hidden, invisible to queryByRole
      expect(screen.queryByRole("button", { name: "Scroll to bottom" })).not.toBeInTheDocument();
    });
  });

  // ── Empty → Populated → Empty Cycles ──────────────────
  describe("empty ↔ populated cycles", () => {
    it("empty → 100 turns → empty → 200 turns: transitions cleanly", async () => {
      const { store } = renderWithAtoms(<MessageList />, {
        initialValues: [
          [turnOrderAtom, [] as TurnId[]],
          [sessionMetaAtom, createSessionMeta({ status: "idle" })],
        ],
      });

      // Empty state
      expect(screen.getByText("Start a conversation...")).toBeInTheDocument();

      // Add 100 turns
      act(() => {
        store.set(turnOrderAtom, makeTurnIds(100));
      });
      await waitFor(() => {
        expect(screen.queryByText("Start a conversation...")).not.toBeInTheDocument();
        expect(screen.getByTestId("turn-turn_99")).toBeInTheDocument();
      });

      // Clear all turns
      act(() => {
        store.set(turnOrderAtom, []);
      });
      await waitFor(() => {
        expect(screen.getByText("Start a conversation...")).toBeInTheDocument();
      });

      // Add 200 turns
      act(() => {
        store.set(turnOrderAtom, makeTurnIds(200));
      });
      await waitFor(() => {
        expect(screen.getByTestId("turn-turn_199")).toBeInTheDocument();
      });
    });
  });
});
