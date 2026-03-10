import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as clipboard from "../../../lib/clipboard";
import { CodeBlockActions } from "../CodeBlockActions";

vi.mock("../../../lib/clipboard", () => ({
  writeToClipboard: vi.fn(() => Promise.resolve()),
}));

const mockPostMessage = vi.fn();
vi.mock("../../../lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
  }),
}));

describe("CodeBlockActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders three action buttons", () => {
    render(<CodeBlockActions code="const x = 1;" />);

    expect(screen.getByLabelText("Insert at cursor")).toBeInTheDocument();
    expect(screen.getByLabelText("Apply to file")).toBeInTheDocument();
    expect(screen.getByLabelText("Copy code")).toBeInTheDocument();
  });

  it("calls writeToClipboard on copy click", async () => {
    const user = userEvent.setup();
    render(<CodeBlockActions code="hello world" />);

    await user.click(screen.getByLabelText("Copy code"));

    expect(clipboard.writeToClipboard).toHaveBeenCalledWith("hello world");
  });

  it("sends APPLY_CODE_BLOCK message on apply click", async () => {
    const user = userEvent.setup();
    render(<CodeBlockActions code="const a = 1;" language="typescript" filePath="src/app.ts" />);

    await user.click(screen.getByLabelText("Apply to file"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "APPLY_CODE_BLOCK",
      code: "const a = 1;",
      language: "typescript",
      file_path: "src/app.ts",
    });
  });

  it("sends INSERT_CODE_BLOCK message on insert click", async () => {
    const user = userEvent.setup();
    render(<CodeBlockActions code="console.log('hi');" />);

    await user.click(screen.getByLabelText("Insert at cursor"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "INSERT_CODE_BLOCK",
      code: "console.log('hi');",
    });
  });

  it("shows Copied label after successful copy", async () => {
    const user = userEvent.setup();
    render(<CodeBlockActions code="test" />);

    await user.click(screen.getByLabelText("Copy code"));

    // After successful copy, label should change
    expect(screen.getByLabelText("Copied")).toBeInTheDocument();
  });

  it("sends APPLY_CODE_BLOCK without optional fields", async () => {
    const user = userEvent.setup();
    render(<CodeBlockActions code="x" />);

    await user.click(screen.getByLabelText("Apply to file"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "APPLY_CODE_BLOCK",
      code: "x",
      language: undefined,
      file_path: undefined,
    });
  });

  it("has correct titles for buttons", () => {
    render(<CodeBlockActions code="code" />);

    expect(screen.getByTitle("Insert at cursor")).toBeInTheDocument();
    expect(screen.getByTitle("Apply to file")).toBeInTheDocument();
    expect(screen.getByTitle("Copy")).toBeInTheDocument();
  });

  it("renders codicon icons", () => {
    const { container } = render(<CodeBlockActions code="x" />);

    expect(container.querySelector(".codicon-diff-added")).toBeInTheDocument();
    expect(container.querySelector(".codicon-go-to-file")).toBeInTheDocument();
    expect(container.querySelector(".codicon-copy")).toBeInTheDocument();
  });

  it("handles clipboard failure silently", async () => {
    vi.mocked(clipboard.writeToClipboard).mockRejectedValueOnce(new Error("denied"));
    const user = userEvent.setup();
    render(<CodeBlockActions code="fail" />);

    await user.click(screen.getByLabelText("Copy code"));

    // Should still show "Copy code" (not "Copied") since it failed
    expect(screen.getByLabelText("Copy code")).toBeInTheDocument();
  });

  it("buttons are type='button'", () => {
    render(<CodeBlockActions code="x" />);

    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).toHaveAttribute("type", "button");
    }
  });
});
