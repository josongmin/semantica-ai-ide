import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { createToolCall } from "../../../shared/lib/mocks";
import type { ToolCall } from "../../../shared/protocol";
import { ToolApprovalDialog } from "../ToolApprovalDialog";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("ToolApprovalDialog", () => {
  const onApprove = vi.fn();
  const onDeny = vi.fn();

  beforeEach(() => {
    onApprove.mockClear();
    onDeny.mockClear();
  });

  const dangerousToolCall: ToolCall = createToolCall({
    id: "tc_1",
    tool_name: "delete_file",
    status: "awaiting_approval",
    risk_level: "dangerous",
    args_summary: "rm -rf /important",
    reasoning: "Agent wants to remove old cache files",
  });

  it("renders nothing when toolCall is null", () => {
    const { container } = render(
      <ToolApprovalDialog toolCall={null} onApprove={onApprove} onDeny={onDeny} />,
      { wrapper: JotaiWrapper },
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders dialog with tool name when toolCall is provided", () => {
    render(
      <ToolApprovalDialog toolCall={dangerousToolCall} onApprove={onApprove} onDeny={onDeny} />,
      { wrapper: JotaiWrapper },
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dangerous Operation")).toBeInTheDocument();
    expect(screen.getByText(/delete_file/)).toBeInTheDocument();
  });

  it("shows args summary in warning banner", () => {
    render(
      <ToolApprovalDialog toolCall={dangerousToolCall} onApprove={onApprove} onDeny={onDeny} />,
      { wrapper: JotaiWrapper },
    );
    expect(screen.getByText("rm -rf /important")).toBeInTheDocument();
  });

  it("shows reasoning when present", () => {
    render(
      <ToolApprovalDialog toolCall={dangerousToolCall} onApprove={onApprove} onDeny={onDeny} />,
      { wrapper: JotaiWrapper },
    );
    expect(screen.getByText("Agent wants to remove old cache files")).toBeInTheDocument();
  });

  it("does not show reasoning when absent", () => {
    const tcNoReasoning = createToolCall({
      ...dangerousToolCall,
      reasoning: undefined,
    });
    render(<ToolApprovalDialog toolCall={tcNoReasoning} onApprove={onApprove} onDeny={onDeny} />, {
      wrapper: JotaiWrapper,
    });
    expect(screen.queryByText("Agent wants to remove old cache files")).not.toBeInTheDocument();
  });

  it("calls onApprove when Approve Anyway is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ToolApprovalDialog toolCall={dangerousToolCall} onApprove={onApprove} onDeny={onDeny} />,
      { wrapper: JotaiWrapper },
    );
    await user.click(screen.getByText("Approve Anyway"));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("calls onDeny when Deny is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ToolApprovalDialog toolCall={dangerousToolCall} onApprove={onApprove} onDeny={onDeny} />,
      { wrapper: JotaiWrapper },
    );
    await user.click(screen.getByText("Deny"));
    expect(onDeny).toHaveBeenCalledTimes(1);
  });

  it("calls onDeny when Escape is pressed (dialog close)", async () => {
    const user = userEvent.setup();
    render(
      <ToolApprovalDialog toolCall={dangerousToolCall} onApprove={onApprove} onDeny={onDeny} />,
      { wrapper: JotaiWrapper },
    );
    await user.keyboard("{Escape}");
    expect(onDeny).toHaveBeenCalledTimes(1);
  });
});
