import { screen } from "@testing-library/react";

import { toolCallAtomFamily } from "~entities/tool-call";

import { renderWithAtoms } from "../../../../tests/utils";
import { createToolCall, resetIdCounter } from "../../../shared/lib/mocks";
import { ToolCallRow } from "../ToolCallRow";

beforeEach(() => resetIdCounter());

describe("ToolCallRow", () => {
  it("renders tool name and status dot", () => {
    const tc = createToolCall({
      id: "tc_1",
      tool_name: "read_file",
      status: "success",
      category: "read",
      args_summary: "src/index.ts",
    });

    renderWithAtoms(<ToolCallRow id="tc_1" />, {
      initialValues: [[toolCallAtomFamily("tc_1"), tc]],
    });

    expect(screen.getByText("read_file")).toBeInTheDocument();
    // The button should be present (the row is a toggle button)
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("click toggles expanded section", async () => {
    const tc = createToolCall({
      id: "tc_2",
      tool_name: "write_file",
      status: "success",
      category: "write",
      args_summary: "src/app.ts",
      result_summary: "File written successfully",
    });

    const { user } = renderWithAtoms(<ToolCallRow id="tc_2" />, {
      initialValues: [[toolCallAtomFamily("tc_2"), tc]],
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("shows duration when done", () => {
    const tc = createToolCall({
      id: "tc_3",
      tool_name: "search_files",
      status: "success",
      category: "search",
      duration_ms: 150,
    });

    renderWithAtoms(<ToolCallRow id="tc_3" />, {
      initialValues: [[toolCallAtomFamily("tc_3"), tc]],
    });

    expect(screen.getByText("150ms")).toBeInTheDocument();
  });

  it("shows args and result when expanded", async () => {
    const tc = createToolCall({
      id: "tc_4",
      tool_name: "read_file",
      status: "success",
      category: "read",
      args_summary: "src/utils.ts",
      result_summary: "120 lines read",
    });

    const { user } = renderWithAtoms(<ToolCallRow id="tc_4" />, {
      initialValues: [[toolCallAtomFamily("tc_4"), tc]],
    });

    await user.click(screen.getByRole("button"));

    const region = screen.getByRole("region");
    expect(region).toBeInTheDocument();
    // Args and result are inside the expanded region
    expect(region.textContent).toContain("src/utils.ts");
    expect(region.textContent).toContain("120 lines read");
  });

  it("error shows error text when expanded and no result_summary", async () => {
    const tc = createToolCall({
      id: "tc_5",
      tool_name: "execute_command",
      status: "error",
      category: "terminal",
      args_summary: "npm test",
      result_summary: undefined,
      duration_ms: 3000,
    });

    const { user } = renderWithAtoms(<ToolCallRow id="tc_5" />, {
      initialValues: [[toolCallAtomFamily("tc_5"), tc]],
    });

    // Click the Collapsible toggle, not the Retry button
    await user.click(screen.getByRole("button", { expanded: false }));

    expect(screen.getByText(/Error — no result available/)).toBeInTheDocument();
  });

  it("shows check icon for successful tool calls", () => {
    const tc = createToolCall({
      id: "tc_icon",
      tool_name: "read_file",
      status: "success",
      category: "read",
      args_summary: "src/index.ts",
    });

    renderWithAtoms(<ToolCallRow id="tc_icon" />, {
      initialValues: [[toolCallAtomFamily("tc_icon"), tc]],
    });

    // Success tool calls show a check icon instead of category icon
    const button = screen.getByRole("button");
    const checkIcon = button.querySelector(".codicon-check");
    expect(checkIcon).toBeInTheDocument();
  });

  it("shows category icon for running tool calls", () => {
    const tc = createToolCall({
      id: "tc_run",
      tool_name: "read_file",
      status: "running",
      category: "read",
    });

    renderWithAtoms(<ToolCallRow id="tc_run" />, {
      initialValues: [[toolCallAtomFamily("tc_run"), tc]],
    });

    const button = screen.getByRole("button", { expanded: false });
    // Running tool calls should NOT have check icon
    const checkIcon = button.querySelector(".codicon-check");
    expect(checkIcon).not.toBeInTheDocument();
  });

  it("returns null when tool call data is not available", () => {
    const { container } = renderWithAtoms(<ToolCallRow id="nonexistent" />, {
      initialValues: [],
    });

    expect(container.innerHTML).toBe("");
  });
});
