import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { buildFixPrompt } from "../../../features/fix-in-editor";
import { promptPrefillAtom } from "../../../shared/lib";
import type { ReviewComment, ReviewCommentId } from "../../../shared/protocol";
import { FixButton } from "../FixButton";

// Mock vscodeApi
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

function createComment(overrides: Partial<ReviewComment> = {}): ReviewComment {
  return {
    id: "comment_1" as ReviewCommentId,
    file_path: "src/app.ts",
    line: 42,
    text: "This function has a potential null dereference.",
    severity: "error",
    ...overrides,
  };
}

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("buildFixPrompt", () => {
  it("builds prompt with file path and line", () => {
    const comment = createComment();
    const prompt = buildFixPrompt(comment);

    expect(prompt).toContain("src/app.ts:42");
    expect(prompt).toContain("This function has a potential null dereference.");
  });

  it("includes suggested fix when present", () => {
    const comment = createComment({ suggested_fix: "Add null check before accessing .value" });
    const prompt = buildFixPrompt(comment);

    expect(prompt).toContain("Suggested fix: Add null check before accessing .value");
  });

  it("does not include suggested fix when absent", () => {
    const comment = createComment({ suggested_fix: undefined });
    const prompt = buildFixPrompt(comment);

    expect(prompt).not.toContain("Suggested fix:");
  });
});

describe("FixButton", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders the Fix button", () => {
    renderWithStore(<FixButton comment={createComment()} />);

    expect(screen.getByTestId("fix-in-editor-button")).toBeInTheDocument();
    expect(screen.getByText("Fix")).toBeInTheDocument();
  });

  it("sends OPEN_FILE_AT_LINE message on click", () => {
    renderWithStore(<FixButton comment={createComment()} />);

    fireEvent.click(screen.getByTestId("fix-in-editor-button"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_FILE_AT_LINE",
      file_path: "src/app.ts",
      line: 42,
    });
  });

  it("pre-fills the prompt atom on click", () => {
    const { store } = renderWithStore(<FixButton comment={createComment()} />);

    fireEvent.click(screen.getByTestId("fix-in-editor-button"));

    const prefill = store.get(promptPrefillAtom);
    expect(prefill).toContain("src/app.ts:42");
    expect(prefill).toContain("This function has a potential null dereference.");
  });

  it("has proper aria-label", () => {
    renderWithStore(<FixButton comment={createComment()} />);

    expect(screen.getByLabelText("Fix issue at src/app.ts:42")).toBeInTheDocument();
  });
});
