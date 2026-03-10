import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createToolCallOutput } from "../../../shared/lib/mocks";
import { ToolOutputViewer } from "../ToolOutputViewer";

describe("ToolOutputViewer", () => {
  it("shows 'No output' when all fields are empty", () => {
    render(<ToolOutputViewer output={{ stdout: "", stderr: "" }} />);
    expect(screen.getByText("No output")).toBeInTheDocument();
  });

  it("renders stdout in Output tab", () => {
    const output = createToolCallOutput({ stdout: "hello world" });
    render(<ToolOutputViewer output={output} />);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("renders stderr in Output tab with error styling", () => {
    const output = createToolCallOutput({ stdout: "", stderr: "error occurred" });
    render(<ToolOutputViewer output={output} />);
    expect(screen.getByText("error occurred")).toBeInTheDocument();
  });

  it("switches to JSON tab and shows structured data", async () => {
    const user = userEvent.setup();
    const output = createToolCallOutput({
      structured: { key: "value", count: 42 },
    });
    render(<ToolOutputViewer output={output} />);

    await user.click(screen.getByRole("tab", { name: "JSON" }));
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();
    expect(screen.getByText(/"count": 42/)).toBeInTheDocument();
  });

  it("JSON tab shows stdout/stderr/exit_code when no structured data", async () => {
    const user = userEvent.setup();
    const output = createToolCallOutput({
      stdout: "test",
      stderr: "",
      exit_code: 0,
    });
    render(<ToolOutputViewer output={output} />);

    await user.click(screen.getByRole("tab", { name: "JSON" }));
    expect(screen.getByText(/"stdout": "test"/)).toBeInTheDocument();
  });

  it("has Output and JSON tabs", () => {
    const output = createToolCallOutput();
    render(<ToolOutputViewer output={output} />);
    expect(screen.getByRole("tab", { name: "Output" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "JSON" })).toBeInTheDocument();
  });

  it("Output tab is active by default", () => {
    const output = createToolCallOutput();
    render(<ToolOutputViewer output={output} />);
    expect(screen.getByRole("tab", { name: "Output" })).toHaveAttribute("aria-selected", "true");
  });
});
