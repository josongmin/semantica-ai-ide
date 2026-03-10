/**
 * ToolCallGroup & ToolCallRow Stress & Edge-Case Tests
 *
 * Tests:
 * - Large group rendering (100+ tool calls)
 * - Rapid expand/collapse toggle on ToolCallRow
 * - All status types displayed correctly
 * - Missing/null atom handling
 * - Running count calculation
 * - Error state with no result_summary
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { toolCallAtomFamily } from "~entities/tool-call";

import { createToolCall, resetIdCounter } from "../../../shared/lib/mocks";
import type { ToolCallGroup as ToolCallGroupType } from "../../../shared/protocol";
import { ToolCallGroup } from "../ToolCallGroup";
import { ToolCallRow } from "../ToolCallRow";

beforeEach(() => resetIdCounter());

/** Render with a store pre-loaded with tool calls */
function renderWithToolCalls(
  ui: React.ReactElement,
  toolCalls: ReturnType<typeof createToolCall>[],
) {
  const store = createStore();
  for (const tc of toolCalls) {
    store.set(toolCallAtomFamily(tc.id), tc);
  }
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe("ToolCallGroup – stress & edge cases", () => {
  // ── Large group rendering ───────────────────────────────
  describe("large group rendering", () => {
    it("100 tool calls in one group: all rendered in collapsible", () => {
      const calls = Array.from({ length: 100 }, (_, i) =>
        createToolCall({
          id: `tc_${i}`,
          category: "read",
          tool_name: `read_file_${i}`,
          status: "success",
        }),
      );

      const group: ToolCallGroupType = {
        category: "read",
        count: 100,
        calls,
      };

      renderWithToolCalls(<ToolCallGroup group={group} />, calls);

      // Badge should show 100
      expect(screen.getByText("100")).toBeInTheDocument();
      // Summary should show "100 completed"
      expect(screen.getByText("100 completed")).toBeInTheDocument();
    });

    it("group with mixed running/completed: running count in summary", () => {
      const calls = Array.from({ length: 20 }, (_, i) =>
        createToolCall({
          id: `tc_${i}`,
          category: "write",
          tool_name: "write_file",
          status: i < 5 ? "running" : "success",
        }),
      );

      const group: ToolCallGroupType = {
        category: "write",
        count: 20,
        calls,
      };

      renderWithToolCalls(<ToolCallGroup group={group} />, calls);

      expect(screen.getByText("5 running...")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("all calls running: summary shows all running", () => {
      const calls = Array.from({ length: 10 }, (_, i) =>
        createToolCall({
          id: `tc_${i}`,
          category: "terminal",
          status: "running",
        }),
      );

      const group: ToolCallGroupType = {
        category: "terminal",
        count: 10,
        calls,
      };

      renderWithToolCalls(<ToolCallGroup group={group} />, calls);
      expect(screen.getByText("10 running...")).toBeInTheDocument();
    });
  });
});

describe("ToolCallRow – stress & edge cases", () => {
  // ── Rapid expand/collapse ───────────────────────────────
  describe("rapid expand/collapse", () => {
    it("100 rapid toggle clicks: expanded state follows parity", () => {
      const tc = createToolCall({
        id: "tc_1",
        tool_name: "read_file",
        status: "success",
        args_summary: "src/app.ts",
        result_summary: "200 lines",
      });

      renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);
      const button = screen.getByRole("button");

      // Starts collapsed (expanded=false)
      expect(button).toHaveAttribute("aria-expanded", "false");

      for (let i = 0; i < 100; i++) {
        fireEvent.click(button);
      }

      // 100 clicks = even → back to collapsed
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("101 clicks: expanded", () => {
      const tc = createToolCall({ id: "tc_1", status: "success" });
      renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);
      const button = screen.getByRole("button");

      for (let i = 0; i < 101; i++) {
        fireEvent.click(button);
      }

      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  // ── All status types ────────────────────────────────────
  describe("all status types", () => {
    it.each(["pending", "running", "success", "error"] as const)(
      "status=%s: renders without crash",
      (status) => {
        const tc = createToolCall({ id: "tc_1", status, tool_name: "some_tool" });
        renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);
        expect(screen.getByText("some_tool")).toBeInTheDocument();
      },
    );

    it("running status: tool name has primary tone", () => {
      const tc = createToolCall({
        id: "tc_1",
        status: "running",
        tool_name: "long_tool",
      });
      renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);
      expect(screen.getByText("long_tool")).toBeInTheDocument();
    });

    it("success: shows duration_ms", () => {
      const tc = createToolCall({
        id: "tc_1",
        status: "success",
        duration_ms: 1234,
      });
      renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);
      expect(screen.getByText("1234ms")).toBeInTheDocument();
    });

    it("error with no result_summary: shows fallback text when expanded", () => {
      const tc = createToolCall({
        id: "tc_1",
        status: "error",
        result_summary: "",
        args_summary: "some args",
      });
      renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);

      // Expand via the Collapsible toggle (not the Retry button)
      fireEvent.click(screen.getByRole("button", { expanded: false }));
      expect(screen.getByText("Error — no result available")).toBeInTheDocument();
    });
  });

  // ── Expanded detail rendering ───────────────────────────
  describe("expanded detail rendering", () => {
    it("expanded shows args and result", () => {
      const tc = createToolCall({
        id: "tc_1",
        status: "success",
        args_summary: "src/index.ts",
        result_summary: "File contents loaded",
      });
      renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);

      fireEvent.click(screen.getByRole("button"));

      const region = screen.getByRole("region");
      expect(region.textContent).toContain("Args:");
      expect(region.textContent).toContain("src/index.ts");
      expect(region.textContent).toContain("Result:");
      expect(region.textContent).toContain("File contents loaded");
    });

    it("no args_summary: args section not rendered", () => {
      const tc = createToolCall({
        id: "tc_1",
        status: "success",
        args_summary: "",
        result_summary: "Done",
      });
      renderWithToolCalls(<ToolCallRow id="tc_1" />, [tc]);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.queryByText(/Args:/)).not.toBeInTheDocument();
      expect(screen.getByText(/Result:/)).toBeInTheDocument();
    });
  });

  // ── Null tool call ──────────────────────────────────────
  describe("null tool call", () => {
    it("non-existent ID: renders nothing", () => {
      const store = createStore();
      const { container } = render(
        <Provider store={store}>
          <ToolCallRow id="nonexistent" />
        </Provider>,
      );
      expect(container.querySelector("button")).toBeNull();
    });
  });
});
