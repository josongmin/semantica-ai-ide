import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertFileChangeAtom } from "~entities/diff";

import { createFileChange } from "../../../shared/lib/mocks";
import type { TurnId } from "../../../shared/protocol";
import { FileChangeSummaryWidget } from "../FileChangeSummaryWidget";

// Mock useDiffReview
vi.mock("../../../features/diff-review", () => ({
  useDiffReview: () => ({
    approve: vi.fn(),
    reject: vi.fn(),
    approveAll: vi.fn(),
    rejectAll: vi.fn(),
    openInEditor: vi.fn(),
    setApprovalStatus: vi.fn(),
  }),
}));

// Mock FileChangeRow to isolate tests
vi.mock("../FileChangeRow", () => ({
  FileChangeRow: ({ fileChange }: { fileChange: { file_path: string } }) => (
    <div data-testid={`file-row-${fileChange.file_path}`}>{fileChange.file_path}</div>
  ),
}));

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return render(<Provider store={store}>{ui}</Provider>);
}

describe("FileChangeSummaryWidget", () => {
  const turnId = "turn_1" as TurnId;

  it("renders file change rows", () => {
    renderWithStore(<FileChangeSummaryWidget turnId={turnId} />, (store) => {
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/new-file.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 10,
          deletions: 0,
          approval_status: "pending",
        }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/existing.ts",
          turn_id: "turn_1",
          status: "modified",
          insertions: 5,
          deletions: 3,
          approval_status: "accepted",
        }),
      );
    });

    expect(screen.getByText("File Changes")).toBeInTheDocument();
    expect(screen.getByTestId("file-row-src/new-file.ts")).toBeInTheDocument();
    expect(screen.getByTestId("file-row-src/existing.ts")).toBeInTheDocument();
  });

  it("shows summary counts in the collapsible header", () => {
    renderWithStore(<FileChangeSummaryWidget turnId={turnId} />, (store) => {
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/a.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 10,
          deletions: 0,
          approval_status: "pending",
        }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/b.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 5,
          deletions: 0,
          approval_status: "pending",
        }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/c.ts",
          turn_id: "turn_1",
          status: "modified",
          insertions: 3,
          deletions: 2,
          approval_status: "pending",
        }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/d.ts",
          turn_id: "turn_1",
          status: "deleted",
          insertions: 2,
          deletions: 3,
          approval_status: "pending",
        }),
      );
    });

    expect(screen.getByText("2 added, 1 modified, 1 deleted")).toBeInTheDocument();
  });

  it("returns null when no files exist", () => {
    const { container } = renderWithStore(<FileChangeSummaryWidget turnId={turnId} />);

    expect(screen.queryByText("File Changes")).not.toBeInTheDocument();
    expect(container.innerHTML).toBe("");
  });

  it("shows Accept All button when pending files exist", () => {
    renderWithStore(<FileChangeSummaryWidget turnId={turnId} />, (store) => {
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/pending.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 10,
          deletions: 0,
          approval_status: "pending",
        }),
      );
    });

    expect(screen.getByText("Accept All")).toBeInTheDocument();
  });

  it("shows Reject All button when pending files exist", () => {
    renderWithStore(<FileChangeSummaryWidget turnId={turnId} />, (store) => {
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/pending.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 10,
          deletions: 0,
          approval_status: "pending",
        }),
      );
    });

    expect(screen.getByText("Reject All")).toBeInTheDocument();
  });

  it("hides Accept All and Reject All when no pending files", () => {
    renderWithStore(<FileChangeSummaryWidget turnId={turnId} />, (store) => {
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/approved.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 10,
          deletions: 0,
          approval_status: "accepted",
        }),
      );
    });

    expect(screen.queryByText("Accept All")).not.toBeInTheDocument();
    expect(screen.queryByText("Reject All")).not.toBeInTheDocument();
  });

  // ─── Batch approval confirmation ─────────────────

  it("opens confirmation dialog on Accept All click", () => {
    renderWithStore(<FileChangeSummaryWidget turnId={turnId} />, (store) => {
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/pending.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 10,
          deletions: 0,
          approval_status: "pending",
        }),
      );
    });

    fireEvent.click(screen.getByText("Accept All"));
    expect(screen.getByText("Accept all changes?")).toBeInTheDocument();
  });

  it("opens confirmation dialog on Reject All click", () => {
    renderWithStore(<FileChangeSummaryWidget turnId={turnId} />, (store) => {
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/pending.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 10,
          deletions: 5,
          approval_status: "pending",
        }),
      );
    });

    fireEvent.click(screen.getByText("Reject All"));
    expect(screen.getByText("Reject all changes?")).toBeInTheDocument();
  });
});
