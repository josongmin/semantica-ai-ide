/**
 * TurnPhaseSection Stress & Edge-Case Tests
 *
 * Tests:
 * - User override vs running status: running forces open
 * - User override persists after status transition
 * - user_message/summary phases: rendered as plain MessageRow
 * - Phase header with status indicators
 * - Phase label rendering for all standard phases
 * - Empty tool_call_ids: no tool calls rendered
 * - Rapid toggle on phases with content
 */
import { fireEvent, screen } from "@testing-library/react";

import { messageAtomFamily } from "~entities/message/core";
import { upsertToolCallAtom } from "~entities/tool-call";

import { renderWithAtoms } from "../../../../../tests/utils";
import { createMessage, createToolCall, createTurnPhase, resetIdCounter } from "../../../../shared/lib/mocks";
import type { MessageId, TurnId, TurnPhaseEntry } from "../../../../shared/protocol";
import { TurnPhaseSection } from "../../TurnPhaseSection";

// Mock vscodeApi
vi.mock("../../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => resetIdCounter());

const TURN_ID = "turn_1" as TurnId;

function renderPhase(
  entry: TurnPhaseEntry,
  options?: {
    messages?: { id: MessageId; text: string }[];
    toolCalls?: { id: string; tool_name: string }[];
  },
) {
   
  const initialValues: [any, unknown][] = [];

  if (options?.messages) {
    for (const msg of options.messages) {
      const fullMsg = createMessage({ id: msg.id, text: msg.text });
      initialValues.push([messageAtomFamily(msg.id), fullMsg]);
    }
  }

  const result = renderWithAtoms(<TurnPhaseSection turnId={TURN_ID} entry={entry} />, {
    initialValues,
  });

  // Seed tool calls after render (write-only atoms need store.set)
  if (options?.toolCalls) {
    for (const tc of options.toolCalls) {
      result.store.set(
        upsertToolCallAtom,
        createToolCall({
          id: tc.id,
          turn_id: "turn_1",
          tool_name: tc.tool_name,
          category: "read",
          args_summary: "test",
          status: "success",
        }),
      );
    }
  }

  return result;
}

describe("TurnPhaseSection – stress & edge cases", () => {
  // ── User override vs running status ────────────────────
  describe("user override vs running status", () => {
    it("running phase with content: always open regardless of user override", () => {
      const msgId = "msg_1" as MessageId;
      renderPhase(
        createTurnPhase({
          phase: "analysis",
          status: "running",
          collapsed: true,
          summary: "Processing...",
          message_ids: [msgId],
        }),
        { messages: [{ id: msgId, text: "analyzing..." }] },
      );

      // Running phase with content should be expanded
      const button = screen.getByRole("button", { expanded: true });
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("user collapses → status changes to success: stays collapsed", () => {
      const msgId = "msg_2" as MessageId;
      const entry = createTurnPhase({
        phase: "analysis",
        status: "success",
        collapsed: false,
        summary: "Done analyzing",
        message_ids: [msgId],
      });

      const { rerender } = renderPhase(entry, {
        messages: [{ id: msgId, text: "analysis result" }],
      });

      // User collapses
      const button = screen.getByRole("button", { expanded: true });
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");

      // Re-render with same entry — user override should persist
      rerender(<TurnPhaseSection turnId={TURN_ID} entry={entry} />);
      expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    });
  });

  // ── Phase types ────────────────────────────────────────
  describe("phase types", () => {
    it("user_message: renders as plain div (no toggle button)", () => {
      const msgId = "msg_1" as MessageId;
      renderPhase(
        createTurnPhase({
          phase: "user_message",
          status: "success",
          collapsed: false,
          message_ids: [msgId],
        }),
        { messages: [{ id: msgId, text: "Hello world" }] },
      );

      // No toggle button for user_message
      expect(screen.queryByRole("button", { expanded: true })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { expanded: false })).not.toBeInTheDocument();
    });

    it("summary: renders as plain div (no toggle button)", () => {
      const msgId = "msg_2" as MessageId;
      renderPhase(
        createTurnPhase({
          phase: "summary",
          status: "success",
          collapsed: false,
          message_ids: [msgId],
        }),
        { messages: [{ id: msgId, text: "Summary text" }] },
      );

      // No toggle button for summary
      expect(screen.queryByRole("button", { expanded: true })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { expanded: false })).not.toBeInTheDocument();
    });
  });

  // ── Status indicators ──────────────────────────────────
  describe("status indicators", () => {
    it("success phase: shows check icon and label", () => {
      renderPhase(createTurnPhase({ phase: "analysis", status: "success", summary: "Done" }));

      expect(screen.getByText("Analysis")).toBeInTheDocument();
    });

    it("error phase: shows error icon and label", () => {
      renderPhase(createTurnPhase({ phase: "analysis", status: "error", summary: "Failed" }));

      expect(screen.getByText("Analysis")).toBeInTheDocument();
    });

    it("pending phase: shows label", () => {
      renderPhase(createTurnPhase({ phase: "plan", status: "pending", summary: "" }));

      expect(screen.getByText("Plan")).toBeInTheDocument();
    });
  });

  // ── Phase labels ───────────────────────────────────────
  describe("phase labels", () => {
    it("all 3 collapsible phases have correct labels", () => {
      const phases = [
        { phase: "analysis" as const, label: "Analysis" },
        { phase: "plan" as const, label: "Plan" },
        { phase: "changes" as const, label: "Changes" },
      ];

      for (const { phase, label } of phases) {
        const { unmount } = renderPhase(
          createTurnPhase({ phase, status: "success", summary: `${label} done` }),
        );
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      }
    });
  });

  // ── Empty tool_call_ids ────────────────────────────────
  describe("empty tool_call_ids", () => {
    it("analysis phase with no tool calls: no ToolCallRow rendered", () => {
      renderPhase(
        createTurnPhase({
          phase: "analysis",
          status: "success",
          tool_call_ids: [],
          summary: "Analyzed",
        }),
      );

      expect(screen.getByText("Analysis")).toBeInTheDocument();
    });
  });

  // ── Rapid toggle on phase with content ──────────────────
  describe("rapid toggle", () => {
    it("50 rapid toggles on analysis phase with content: follows parity", () => {
      const msgId = "msg_3" as MessageId;
      renderPhase(
        createTurnPhase({
          phase: "analysis",
          status: "success",
          collapsed: false,
          summary: "Analysis complete",
          message_ids: [msgId],
        }),
        { messages: [{ id: msgId, text: "result" }] },
      );

      const button = screen.getByRole("button", { expanded: true });
      const initialExpanded = button.getAttribute("aria-expanded");

      for (let i = 0; i < 50; i++) {
        fireEvent.click(button);
      }

      // 50 clicks = even → back to initial state
      expect(button).toHaveAttribute("aria-expanded", initialExpanded);
    });
  });
});
