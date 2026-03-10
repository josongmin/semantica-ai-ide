import { render, screen } from "@testing-library/react";

import type { ToolCallGroup as ToolCallGroupType } from "../../../shared/protocol";
import { ToolCallGroup } from "../ToolCallGroup";

// Mock ToolCallRow to isolate ToolCallGroup tests
vi.mock("../ToolCallRow", () => ({
  ToolCallRow: ({ id }: { id: string }) => <div data-testid={`tool-call-row-${id}`}>{id}</div>,
}));

describe("ToolCallGroup", () => {
  it("renders category header with label", () => {
    const group: ToolCallGroupType = {
      category: "read",
      calls: [
        {
          id: "tc_1",
          turn_id: "turn_1",
          tool_name: "read_file",
          category: "read",
          args_summary: "src/index.ts",
          status: "success",
          duration_ms: 42,
        },
      ],
      count: 1,
    };

    render(<ToolCallGroup group={group} />);

    // categoryLabels maps "read" -> "Read Files"
    expect(screen.getByText("Read Files")).toBeInTheDocument();
  });

  it("renders ToolCallRow for each call id", () => {
    const group: ToolCallGroupType = {
      category: "write",
      calls: [
        {
          id: "tc_1",
          turn_id: "turn_1",
          tool_name: "write_file",
          category: "write",
          args_summary: "src/app.ts",
          status: "success",
          duration_ms: 10,
        },
        {
          id: "tc_2",
          turn_id: "turn_1",
          tool_name: "write_file",
          category: "write",
          args_summary: "src/utils.ts",
          status: "success",
          duration_ms: 15,
        },
      ],
      count: 2,
    };

    render(<ToolCallGroup group={group} />);

    expect(screen.getByTestId("tool-call-row-tc_1")).toBeInTheDocument();
    expect(screen.getByTestId("tool-call-row-tc_2")).toBeInTheDocument();
  });

  it("shows running count in summary when calls are running", () => {
    const group: ToolCallGroupType = {
      category: "terminal",
      calls: [
        {
          id: "tc_1",
          turn_id: "turn_1",
          tool_name: "execute_command",
          category: "terminal",
          args_summary: "npm test",
          status: "running",
        },
        {
          id: "tc_2",
          turn_id: "turn_1",
          tool_name: "execute_command",
          category: "terminal",
          args_summary: "npm build",
          status: "success",
          duration_ms: 100,
        },
      ],
      count: 2,
    };

    render(<ToolCallGroup group={group} />);

    expect(screen.getByText("1 running...")).toBeInTheDocument();
  });

  it("shows completed count when no calls are running", () => {
    const group: ToolCallGroupType = {
      category: "search",
      calls: [
        {
          id: "tc_1",
          turn_id: "turn_1",
          tool_name: "search_files",
          category: "search",
          args_summary: "pattern",
          status: "success",
          duration_ms: 50,
        },
      ],
      count: 1,
    };

    render(<ToolCallGroup group={group} />);

    expect(screen.getByText("1 completed")).toBeInTheDocument();
  });
});
