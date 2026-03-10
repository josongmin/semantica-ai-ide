/**
 * FileChangeRow & FileChangeSummaryWidget Stress & Edge-Case Tests
 *
 * Tests:
 * - All 4 file statuses: added/modified/deleted/renamed
 * - Approval states: pending/accepted/rejected
 * - Rapid approve/reject clicks
 * - Path edge cases: root file, deeply nested, unicode
 * - Large insertions/deletions
 * - FileChangeSummaryWidget: empty files, Accept All
 */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertFileChangeAtom } from "~entities/diff";

import { diffReviewAdapterAtom, type DiffReviewAdapter } from "../../../shared/lib/atoms";
import { createFileChange, resetIdCounter } from "../../../shared/lib/mocks";
import type { FileChange, FileChangeStatus, TurnId } from "../../../shared/protocol";
import { FileChangeRow } from "../FileChangeRow";
import { FileChangeSummaryWidget } from "../FileChangeSummaryWidget";

// Mock vscodeApi
const mockPostMessage = vi.fn();

vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

function createMockDiffReviewAdapter(): DiffReviewAdapter {
  return {
    approve: (turnId: string, filePath: string) =>
      mockPostMessage({ type: "DIFF_APPROVE", turn_id: turnId, file_path: filePath }),
    reject: (turnId: string, filePath: string) =>
      mockPostMessage({ type: "DIFF_REJECT", turn_id: turnId, file_path: filePath }),
    approveAll: (turnId: string, filePaths: string[]) =>
      mockPostMessage({ type: "DIFF_APPROVE_ALL", turn_id: turnId, file_paths: filePaths }),
    rejectAll: (turnId: string, filePaths: string[]) =>
      mockPostMessage({ type: "DIFF_REJECT_ALL", turn_id: turnId, file_paths: filePaths }),
    openInEditor: (filePath: string) =>
      mockPostMessage({ type: "OPEN_FILE", file_path: filePath }),
    setApprovalStatus: vi.fn(),
  };
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

function renderWithStore(ui: React.ReactElement, fileChanges: FileChange[] = []) {
  const store = createStore();
  store.set(diffReviewAdapterAtom, createMockDiffReviewAdapter());
  for (const fc of fileChanges) {
    store.set(upsertFileChangeAtom, fc);
  }
  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  };
}

describe("FileChangeRow – stress & edge cases", () => {
  // ── All file statuses ──────────────────────────────────
  describe("all file statuses", () => {
    it.each(["added", "modified", "deleted", "renamed"] as FileChangeStatus[])(
      "status '%s': renders without crash",
      (status) => {
        const fc = createFileChange({ status, file_path: `src/${status}.tsx` });
        renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);
        expect(screen.getByText(`${status}.tsx`)).toBeInTheDocument();
      },
    );
  });

  // ── Approval states ────────────────────────────────────
  describe("approval states", () => {
    it("pending: shows approve/reject buttons on hover container", () => {
      const fc = createFileChange({ approval_status: "pending" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);

      expect(screen.getByLabelText(/Accept changes to/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Reject changes to/)).toBeInTheDocument();
    });

    it("accepted: shows check icon, no approve/reject buttons", () => {
      const fc = createFileChange({ approval_status: "accepted" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);

      expect(screen.getByTitle("Accepted")).toBeInTheDocument();
      expect(screen.queryByLabelText(/Accept changes to/)).not.toBeInTheDocument();
    });

    it("rejected: shows close icon, no approve/reject buttons", () => {
      const fc = createFileChange({ approval_status: "rejected" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);

      expect(screen.getByTitle("Rejected")).toBeInTheDocument();
      expect(screen.queryByLabelText(/Reject changes to/)).not.toBeInTheDocument();
    });
  });

  // ── Rapid clicks ───────────────────────────────────────
  describe("rapid clicks", () => {
    it("100 rapid approve clicks: postMessage called each time", () => {
      const fc = createFileChange({ approval_status: "pending" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);

      const btn = screen.getByLabelText(/Accept changes to/);
      for (let i = 0; i < 100; i++) {
        fireEvent.click(btn);
      }

      // Each click sends a DIFF_APPROVE message
      const approveCalls = mockPostMessage.mock.calls.filter((c) => c[0].type === "DIFF_APPROVE");
      expect(approveCalls.length).toBe(100);
    });

    it("open in editor: sends OPEN_FILE message", () => {
      const fc = createFileChange({ file_path: "src/utils/helper.ts" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);

      const openBtn = screen.getByLabelText("Open src/utils/helper.ts");
      fireEvent.click(openBtn);

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "OPEN_FILE",
        file_path: "src/utils/helper.ts",
      });
    });
  });

  // ── Path edge cases ────────────────────────────────────
  describe("path edge cases", () => {
    it("root-level file: shows filename", () => {
      const fc = createFileChange({ file_path: "Makefile" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);
      expect(screen.getByText("Makefile")).toBeInTheDocument();
    });

    it("deeply nested file: shows filename + directory path", () => {
      const fc = createFileChange({ file_path: "src/a/b/c/d/Component.tsx" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);
      expect(screen.getByText("Component.tsx")).toBeInTheDocument();
      expect(screen.getByText("src/a/b/c/d")).toBeInTheDocument();
    });

    it("unicode file path", () => {
      const fc = createFileChange({ file_path: "src/컴포넌트/버튼.tsx" });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);
      expect(screen.getByText("버튼.tsx")).toBeInTheDocument();
    });
  });

  // ── Insertion/deletion display ─────────────────────────
  describe("insertion/deletion display", () => {
    it("large numbers: displays correctly", () => {
      const fc = createFileChange({ insertions: 99999, deletions: 88888 });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);
      expect(screen.getByText("+99999")).toBeInTheDocument();
      expect(screen.getByText("-88888")).toBeInTheDocument();
    });

    it("zero insertions and deletions", () => {
      const fc = createFileChange({ insertions: 0, deletions: 0 });
      renderWithStore(<FileChangeRow fileChange={fc} />, [fc]);
      expect(screen.getByText("+0")).toBeInTheDocument();
      expect(screen.getByText("-0")).toBeInTheDocument();
    });
  });
});

describe("FileChangeSummaryWidget – stress & edge cases", () => {
  const TURN_ID = "turn_1" as TurnId;

  // ── Empty files ────────────────────────────────────────
  describe("empty files", () => {
    it("no file changes: renders nothing", () => {
      const store = createStore();
      const { container } = render(
        <Provider store={store}>
          <FileChangeSummaryWidget turnId={TURN_ID} />
        </Provider>,
      );
      // No Collapsible rendered
      expect(container.querySelector("button")).toBeNull();
    });
  });

  // ── Accept All ─────────────────────────────────────────
  describe("Accept All", () => {
    it("all pending: shows Accept All button", () => {
      const files = Array.from({ length: 5 }, (_, i) =>
        createFileChange({
          turn_id: TURN_ID,
          file_path: `src/file_${i}.tsx`,
          approval_status: "pending",
        }),
      );
      renderWithStore(<FileChangeSummaryWidget turnId={TURN_ID} />, files);

      expect(screen.getByText("Accept All")).toBeInTheDocument();
    });

    it("no pending files: no Accept All button", () => {
      const files = [
        createFileChange({
          turn_id: TURN_ID,
          file_path: "src/a.tsx",
          approval_status: "accepted",
        }),
        createFileChange({
          turn_id: TURN_ID,
          file_path: "src/b.tsx",
          approval_status: "rejected",
        }),
      ];
      renderWithStore(<FileChangeSummaryWidget turnId={TURN_ID} />, files);

      expect(screen.queryByText("Accept All")).not.toBeInTheDocument();
    });

    it("Accept All click: sends DIFF_APPROVE_ALL with pending file paths", () => {
      const files = Array.from({ length: 3 }, (_, i) =>
        createFileChange({
          turn_id: TURN_ID,
          file_path: `src/p_${i}.tsx`,
          approval_status: "pending",
        }),
      );
      renderWithStore(<FileChangeSummaryWidget turnId={TURN_ID} />, files);

      fireEvent.click(screen.getByText("Accept All"));

      // Confirm in the dialog
      const dialog = screen.getByRole("dialog");
      fireEvent.click(within(dialog).getByText("Accept All"));

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "DIFF_APPROVE_ALL",
        turn_id: TURN_ID,
        file_paths: ["src/p_0.tsx", "src/p_1.tsx", "src/p_2.tsx"],
      });
    });
  });

  // ── Summary text ───────────────────────────────────────
  describe("summary text", () => {
    it("mixed statuses: shows correct summary", () => {
      const files = [
        createFileChange({ turn_id: TURN_ID, file_path: "a.tsx", status: "added" }),
        createFileChange({ turn_id: TURN_ID, file_path: "b.tsx", status: "modified" }),
        createFileChange({ turn_id: TURN_ID, file_path: "c.tsx", status: "deleted" }),
      ];
      renderWithStore(<FileChangeSummaryWidget turnId={TURN_ID} />, files);

      expect(screen.getByText("File Changes")).toBeInTheDocument();
      // Badge should show 3
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  // ── Large file count ───────────────────────────────────
  describe("large file count", () => {
    it("50 files: all rendered with badge count", () => {
      const files = Array.from({ length: 50 }, (_, i) =>
        createFileChange({
          turn_id: TURN_ID,
          file_path: `src/component_${i}.tsx`,
          status: i % 2 === 0 ? "added" : "modified",
        }),
      );
      renderWithStore(<FileChangeSummaryWidget turnId={TURN_ID} />, files);

      expect(screen.getByText("50")).toBeInTheDocument();
      expect(screen.getByText("File Changes")).toBeInTheDocument();
    });
  });
});
