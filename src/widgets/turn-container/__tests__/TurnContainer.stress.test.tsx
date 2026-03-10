/**
 * TurnContainer Stress & Edge-Case Tests
 *
 * Tests:
 * - Null turn: renders nothing
 * - All 3 turn statuses: running, success, error
 * - Phase progress display with multiple phase counts
 * - Error phase banner rendering
 * - Large turn with all 6 phases populated
 * - Timestamp formatting edge cases
 */
import { screen } from "@testing-library/react";

import { turnAtomFamily } from "~entities/message/turns";

import { renderWithAtoms } from "../../../../tests/utils";
import {
  createMessage,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../../shared/protocol";
import { TurnContainer } from "../TurnContainer";

// Mock vscodeApi (used transitively by FileChangeSummaryWidget → useDiffReview)
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => resetIdCounter());

function renderTurn(turnOverrides: Parameters<typeof createTurn>[0] = {}) {
  const turn = createTurn(turnOverrides);
  return {
    turn,
    ...renderWithAtoms(<TurnContainer turnId={turn.id} />, {
      initialValues: [[turnAtomFamily(turn.id), turn]],
    }),
  };
}

describe("TurnContainer – stress & edge cases", () => {
  // ── Null turn ──────────────────────────────────────────
  describe("null turn", () => {
    it("non-existent turnId: renders nothing", () => {
      const { container } = renderWithAtoms(<TurnContainer turnId={"nonexistent" as TurnId} />, {
        initialValues: [],
      });
      expect(container.querySelector("[data-testid]")).toBeNull();
    });
  });

  // ── Status rendering ───────────────────────────────────
  describe("status rendering", () => {
    it("running turn: renders correctly", () => {
      const { turn } = renderTurn({ status: "running" });
      const el = screen.getByTestId(`turn-${turn.id}`);
      expect(el).toBeInTheDocument();
    });

    it("error turn: shows error banner", () => {
      renderTurn({
        status: "error",
        phases: [
          createTurnPhase({ phase: "user_message", status: "success", collapsed: false }),
          createTurnPhase({ phase: "thinking", status: "error", summary: "Rate limit exceeded" }),
        ],
      });

      expect(screen.getAllByText("Rate limit exceeded").length).toBeGreaterThanOrEqual(1);
    });

    it("success turn: has neutral border color", () => {
      const { turn } = renderTurn({
        status: "success",
        phases: [
          createTurnPhase({ phase: "user_message", status: "success", message_ids: ["msg_1" as MessageId] }),
        ],
      });
      const el = screen.getByTestId(`turn-${turn.id}`);
      expect(el.className).toMatch(/border-vsc-border/);
    });

    it("error turn with no error phase: shows fallback error message", () => {
      renderTurn({
        status: "error",
        phases: [
          createTurnPhase({ phase: "user_message", status: "success", collapsed: false }),
          createTurnPhase({ phase: "thinking", status: "pending" }),
        ],
      });

      expect(screen.getByText("An error occurred during this turn.")).toBeInTheDocument();
    });
  });

  // ── Turn container layout guard ───────────────────────
  describe("turn container layout", () => {
    it("outer container uses flex layout for all states", () => {
      for (const status of ["running", "success", "error"] as const) {
        const { turn, unmount } = renderTurn({
          status,
          phases: [
            createTurnPhase({
              phase: "user_message",
              status: "success",
              collapsed: false,
              message_ids: ["msg_1" as MessageId],
            }),
            createTurnPhase({
              phase: "thinking",
              status: status === "running" ? "running" : status,
              ...(status === "error" && { summary: "err" }),
            }),
          ],
        });
        const el = screen.getByTestId(`turn-${turn.id}`);
        expect(el.className).toContain("flex");
        unmount();
        resetIdCounter();
      }
    });

    it("outer container has NO border-l, shadow, or pl- classes", () => {
      const { turn } = renderTurn({ status: "running" });
      const outer = screen.getByTestId(`turn-${turn.id}`);
      expect(outer.className).not.toMatch(/border-l/);
      expect(outer.className).not.toMatch(/shadow/);
      expect(outer.className).not.toMatch(/\bpl-/);
    });
  });

  // ── Phase progress ─────────────────────────────────────
  describe("phase progress", () => {
    it("running turn with 3/6 phases done: shows progress bar", () => {
      renderTurn({
        status: "running",
        phases: [
          createTurnPhase({ phase: "user_message", status: "success", collapsed: false }),
          createTurnPhase({ phase: "thinking", status: "success" }),
          createTurnPhase({ phase: "analysis", status: "success" }),
          createTurnPhase({ phase: "plan", status: "running" }),
          createTurnPhase({ phase: "changes", status: "pending" }),
          createTurnPhase({ phase: "summary", status: "pending", collapsed: false }),
        ],
      });

      // ProgressBar only shown when total > 1 and isRunning
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "3");
      expect(progressBar).toHaveAttribute("aria-valuemax", "6");
      expect(screen.getByText("3/6")).toBeInTheDocument();
    });

    it("running turn with single phase: no progress bar", () => {
      renderTurn({
        status: "running",
        phases: [createTurnPhase({ phase: "thinking", status: "running" })],
      });

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("completed turn: no progress bar", () => {
      renderTurn({
        status: "success",
        phases: [
          createTurnPhase({ phase: "user_message", status: "success", collapsed: false, message_ids: ["msg_1" as MessageId] }),
          createTurnPhase({ phase: "thinking", status: "success" }),
          createTurnPhase({ phase: "summary", status: "success", collapsed: false }),
        ],
      });

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });

  // ── Large turn with all phases ─────────────────────────
  describe("large turn", () => {
    it("all 6 phases with messages and tool calls: renders without crash", () => {
      const msg = createMessage({ id: "msg_1" as MessageId, text: "Test message" });

      renderTurn({
        status: "success",
        phases: [
          createTurnPhase({
            phase: "user_message",
            status: "success",
            collapsed: false,
            message_ids: [msg.id],
          }),
          createTurnPhase({ phase: "thinking", status: "success", summary: "Analyzing codebase" }),
          createTurnPhase({
            phase: "analysis",
            status: "success",
            summary: "Found 5 relevant files",
            tool_call_ids: ["tc_1", "tc_2"],
          }),
          createTurnPhase({ phase: "plan", status: "success", summary: "3-step plan created" }),
          createTurnPhase({
            phase: "changes",
            status: "success",
            summary: "Modified 3 files",
            tool_call_ids: ["tc_3"],
          }),
          createTurnPhase({
            phase: "summary",
            status: "success",
            collapsed: false,
            summary: "All changes applied successfully",
          }),
        ],
      });

      // All collapsible phase labels should be in the DOM (thinking renders flat, no label)
      expect(screen.getByText("Analysis")).toBeInTheDocument();
      expect(screen.getByText("Plan")).toBeInTheDocument();
      expect(screen.getByText("Changes")).toBeInTheDocument();
    });
  });

  // ── Timestamp formatting ───────────────────────────────
  describe("timestamp formatting", () => {
    it("renders timestamp from created_at_ms", () => {
      renderTurn({
        created_at_ms: new Date("2025-06-15T14:30:45").getTime(),
        phases: [
          createTurnPhase({ phase: "user_message", status: "success", message_ids: ["msg_1" as MessageId] }),
        ],
      });

      // The timestamp format is HH:MM:SS
      // The exact text depends on locale, but it should be present
      const timeEl = screen.getByTestId(/^turn-/);
      expect(timeEl.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });
  });
});
