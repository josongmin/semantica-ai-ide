import { act, screen } from "@testing-library/react";

import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { prSummaryDialogOpenAtom, setPrSummaryContentAtom } from "../../../features/pr-summary";
import type * as SharedLib from "../../../shared/lib";
import { createFileChange, createPRSummary, createSessionMeta } from "../../../shared/lib/mocks";
import type { SessionId } from "../../../shared/protocol";
import { PRSummaryCard } from "../PRSummaryCard";
// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

const mockWriteToClipboard = vi.fn().mockResolvedValue(undefined);
vi.mock("../../../shared/lib", async (importOriginal) => {
  const original = await importOriginal<typeof SharedLib>();
  return {
    ...original,
    writeToClipboard: (...args: unknown[]) => mockWriteToClipboard(...args),
  };
});

// ─── Tests ─────────────────────────────────────────────────
describe("PRSummaryCard", () => {
  const sessionId = "session_pr" as SessionId;

  beforeEach(() => {
    mockPostMessage.mockClear();
    mockWriteToClipboard.mockClear();
  });

  it("renders nothing when dialog is closed", () => {
    renderWithAtoms(<PRSummaryCard />);
    expect(screen.queryByText("PR Summary")).toBeNull();
  });

  it("shows loading spinner when no summary is available", () => {
    renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    expect(screen.getByTestId("pr-summary-loading")).toBeTruthy();
    expect(screen.getByText("Generating summary...")).toBeTruthy();
  });

  it("renders summary content when available", () => {
    const summary = createPRSummary({
      title: "Add user authentication",
      intent: "Implement JWT-based auth flow",
      todos: ["Add rate limiting", "Write integration tests"],
      changes: [
        createFileChange({
          file_path: "src/auth.ts",
          status: "added",
          insertions: 50,
          deletions: 0,
        }),
        createFileChange({
          file_path: "src/app.ts",
          status: "modified",
          insertions: 5,
          deletions: 2,
        }),
      ],
    });

    const { store } = renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setPrSummaryContentAtom, summary);
    });

    expect(screen.getByTestId("pr-title-input")).toBeTruthy();
    const titleInput = screen.getByTestId("pr-title-input");
    expect((titleInput as unknown as HTMLInputElement).value).toBe(
      "Add user authentication",
    );
    expect(screen.getByTestId("pr-changes-section")).toBeTruthy();
    expect(screen.getByTestId("pr-intent-section")).toBeTruthy();
    expect(screen.getByTestId("pr-todos-section")).toBeTruthy();
  });

  it("shows file changes with correct count", () => {
    const summary = createPRSummary({
      changes: [
        createFileChange({ file_path: "src/a.ts", status: "added" }),
        createFileChange({ file_path: "src/b.ts", status: "modified" }),
        createFileChange({ file_path: "src/c.ts", status: "deleted" }),
      ],
    });

    const { store } = renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setPrSummaryContentAtom, summary);
    });

    expect(screen.getByText("Changes (3 files)")).toBeTruthy();
  });

  it("allows title editing", async () => {
    const summary = createPRSummary({ title: "Original Title" });

    const { store, user } = renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setPrSummaryContentAtom, summary);
    });

    const titleInput = screen.getByTestId("pr-title-input");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");

    expect((titleInput as HTMLInputElement).value).toBe("Updated Title");
  });

  it("copies markdown to clipboard", async () => {
    const summary = createPRSummary({
      title: "Test PR",
      intent: "Test intent",
      todos: ["Task 1"],
      changes: [
        createFileChange({ file_path: "src/a.ts", status: "added", insertions: 10, deletions: 0 }),
      ],
    });

    const { store, user } = renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setPrSummaryContentAtom, summary);
    });

    const copyBtn = screen.getByTestId("copy-markdown-btn");
    await user.click(copyBtn);

    expect(mockWriteToClipboard).toHaveBeenCalledTimes(1);
    const clipboardContent = mockWriteToClipboard.mock.calls[0]?.[0] as string;
    expect(clipboardContent).toContain("## Test PR");
    expect(clipboardContent).toContain("### Intent");
    expect(clipboardContent).toContain("Test intent");
    expect(clipboardContent).toContain("### Changes");
    expect(clipboardContent).toContain("src/a.ts");
    expect(clipboardContent).toContain("### TODO");
    expect(clipboardContent).toContain("- [ ] Task 1");
  });

  it("sends OPEN_PR_IN_GITHUB message when button is clicked", async () => {
    const summary = createPRSummary();

    const { store, user } = renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setPrSummaryContentAtom, summary);
    });

    const githubBtn = screen.getByTestId("open-github-btn");
    await user.click(githubBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_PR_IN_GITHUB",
      session_id: sessionId,
    });
  });

  it("sends GENERATE_PR_SUMMARY when regenerate is clicked", async () => {
    const summary = createPRSummary();

    const { store, user } = renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setPrSummaryContentAtom, summary);
    });

    const regenBtn = screen.getByTestId("regenerate-summary-btn");
    await user.click(regenBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GENERATE_PR_SUMMARY",
      session_id: sessionId,
    });
  });

  it("hides TODO section when no todos", () => {
    const summary = createPRSummary({ todos: [] });

    const { store } = renderWithAtoms(<PRSummaryCard />, {
      initialValues: [
        [prSummaryDialogOpenAtom, true],
        [sessionMetaAtom, createSessionMeta({ session_id: sessionId })],
      ],
    });

    act(() => {
      store.set(setPrSummaryContentAtom, summary);
    });

    expect(screen.queryByTestId("pr-todos-section")).toBeNull();
  });
});
