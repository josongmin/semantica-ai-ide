import React from "react";
import { render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertToolCallAtom } from "~entities/tool-call";

import { createToolCall } from "../../../shared/lib/mocks";
import type { MessageId, TurnId, TurnPhaseEntry } from "../../../shared/protocol";
import { TurnPhaseSection } from "../TurnPhaseSection";

// Mock child widgets to isolate TurnPhaseSection tests
vi.mock("../../message-row", () => ({
  MessageRow: ({ messageId }: { messageId: string }) => (
    <div data-testid={`msg-row-${messageId}`}>{messageId}</div>
  ),
}));

vi.mock("../../tool-call-group", () => ({
  ToolCallGroup: ({ group }: { group: { category: string } }) => (
    <div data-testid={`tool-group-${group.category}`}>{group.category}</div>
  ),
  ToolCallRow: ({ id }: { id: string }) => (
    <div data-testid={`tool-call-${id}`}>{id}</div>
  ),
}));

vi.mock("../../file-change-summary", () => ({
  FileChangeSummaryWidget: ({ turnId }: { turnId: string }) => (
    <div data-testid={`file-summary-${turnId}`}>file summary</div>
  ),
}));

const turnId = "turn_1" as TurnId;

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return render(<Provider store={store}>{ui}</Provider>);
}

// Spy on Icon and Spinner to verify icon name + spinner presence
vi.mock("../../../shared/ui", async () => {
  const actual = await vi.importActual("../../../shared/ui");
  return {
    ...(actual as Record<string, unknown>),
    Icon: ({ name, className, ...rest }: { name: string; className?: string; [k: string]: unknown }) => (
      <i data-testid={`icon-${name}`} data-icon={name} className={className} {...rest} />
    ),
    Spinner: ({ className }: { className?: string }) => (
      <i data-testid="spinner" className={className} />
    ),
  };
});

describe("TurnPhaseSection", () => {
  it("renders messages directly for user_message phase (not collapsible)", () => {
    const entry: TurnPhaseEntry = {
      phase: "user_message",
      message_ids: ["msg_1" as MessageId, "msg_2" as MessageId],
      tool_call_ids: [],
      summary: "",
      collapsed: false,
      status: "success",
    };

    renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

    expect(screen.getByTestId("msg-row-msg_1")).toBeInTheDocument();
    expect(screen.getByTestId("msg-row-msg_2")).toBeInTheDocument();
    // Should NOT have a collapsible toggle button for user_message
    expect(screen.queryByRole("button", { name: /Message/i })).not.toBeInTheDocument();
  });

  it("renders messages directly for summary phase (not collapsible)", () => {
    const entry: TurnPhaseEntry = {
      phase: "summary",
      message_ids: ["msg_3" as MessageId],
      tool_call_ids: [],
      summary: "",
      collapsed: false,
      status: "success",
    };

    renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

    expect(screen.getByTestId("msg-row-msg_3")).toBeInTheDocument();
  });

  it("renders thinking phase as flat messages (not collapsible)", () => {
    const entry: TurnPhaseEntry = {
      phase: "thinking",
      message_ids: [],
      tool_call_ids: [],
      summary: "Analyzing the codebase",
      collapsed: true,
      status: "success",
    };

    renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

    // Thinking phase renders flat like user_message, no collapsible header
    expect(screen.queryByText("Thinking")).not.toBeInTheDocument();
  });

  it("renders analysis phase with tool call groups", () => {
    const entry: TurnPhaseEntry = {
      phase: "analysis",
      message_ids: ["msg_4" as MessageId],
      tool_call_ids: ["tc_1", "tc_2"],
      summary: "Analyzing files",
      collapsed: false,
      status: "success",
    };

    renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />, (store) => {
      store.set(
        upsertToolCallAtom,
        createToolCall({
          id: "tc_1",
          turn_id: "turn_1",
          tool_name: "read_file",
          category: "read",
          args_summary: "src/index.ts",
          status: "success",
        }),
      );
      store.set(
        upsertToolCallAtom,
        createToolCall({
          id: "tc_2",
          turn_id: "turn_1",
          tool_name: "read_file",
          category: "read",
          args_summary: "src/app.ts",
          status: "success",
        }),
      );
    });

    expect(screen.getByText("Analysis")).toBeInTheDocument();
    expect(screen.getByTestId("tool-call-tc_1")).toBeInTheDocument();
    expect(screen.getByTestId("tool-call-tc_2")).toBeInTheDocument();
  });

  it("renders FileChangeSummaryWidget for changes phase", () => {
    const entry: TurnPhaseEntry = {
      phase: "changes",
      message_ids: [],
      tool_call_ids: [],
      summary: "Applied changes",
      collapsed: false,
      status: "success",
    };

    renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

    expect(screen.getByText("Changes")).toBeInTheDocument();
    expect(screen.getByTestId("file-summary-turn_1")).toBeInTheDocument();
  });

  // ── Phase icon state tests ──────────────────────────────
  describe("phase icon states", () => {
    it("running phase: shows spinner, no static icon", () => {
      const entry: TurnPhaseEntry = {
        phase: "analysis",
        message_ids: [],
        tool_call_ids: [],
        summary: "Analyzing...",
        collapsed: false,
        status: "running",
      };
      renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-search")).not.toBeInTheDocument();
      expect(screen.queryByTestId("icon-check")).not.toBeInTheDocument();
    });

    it("success phase: shows check icon (green), no spinner", () => {
      const entry: TurnPhaseEntry = {
        phase: "analysis",
        message_ids: [],
        tool_call_ids: [],
        summary: "",
        collapsed: true,
        status: "success",
      };
      renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      const icon = screen.getByTestId("icon-check");
      expect(icon).toBeInTheDocument();
      expect(icon.className).toMatch(/text-vsc-success/);
    });

    it("error phase: shows error icon (red), no spinner", () => {
      const entry: TurnPhaseEntry = {
        phase: "analysis",
        message_ids: [],
        tool_call_ids: [],
        summary: "Failed",
        collapsed: false,
        status: "error",
      };
      renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      const icon = screen.getByTestId("icon-error");
      expect(icon).toBeInTheDocument();
      expect(icon.className).toMatch(/text-vsc-error/);
    });

    it("pending phase: shows phase-specific icon (not check/error)", () => {
      const entry: TurnPhaseEntry = {
        phase: "plan",
        message_ids: [],
        tool_call_ids: [],
        summary: "",
        collapsed: true,
        status: "pending",
      };
      renderWithStore(<TurnPhaseSection turnId={turnId} entry={entry} />);

      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      // plan phase → tasklist icon
      expect(screen.getByTestId("icon-tasklist")).toBeInTheDocument();
    });
  });
});
