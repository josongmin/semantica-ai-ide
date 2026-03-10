/**
 * Integrated Widget Flow E2E Tests
 *
 * Tests widget rendering with pre-seeded atom state:
 * - TurnContainer renders seeded turn with all phases
 * - FileChangeSummaryWidget renders file changes and Accept All works
 * - Multiple turns rendered with different statuses
 */
import { act, screen, within } from "@testing-library/react";

import { upsertFileChangeAtom } from "~entities/diff";
import { messageAtomFamily } from "~entities/message/core";
import { turnAtomFamily } from "~entities/message/turns";

import { renderWithAtoms } from "../../../tests/utils";
import {
  createFileChange,
  createMessage,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../../shared/lib/mocks";
import type { MessageId, TurnId } from "../../shared/protocol";
import { FileChangeSummaryWidget } from "../file-change-summary";
import { TurnContainer } from "../turn-container";

// Mock TurnPhaseSection to isolate rendering (same pattern as TurnContainer.test.tsx)
vi.mock("../turn-container/TurnPhaseSection", () => ({
  TurnPhaseSection: ({ entry }: { entry: { phase: string; summary: string } }) => (
    <div data-testid={`phase-${entry.phase}`}>{entry.summary || entry.phase}</div>
  ),
}));

// Mock diffReviewAdapterAtom (widget reads from atom, not hook)
const mockApproveAll = vi.fn();

import { diffReviewAdapterAtom, type DiffReviewAdapter } from "../../shared/lib/atoms";

function createMockDiffReviewAdapter(): DiffReviewAdapter {
  return {
    approve: vi.fn(),
    reject: vi.fn(),
    approveAll: mockApproveAll,
    rejectAll: vi.fn(),
    openInEditor: vi.fn(),
    setApprovalStatus: vi.fn(),
  };
}

// Mock FileChangeRow to isolate (same pattern as FileChangeSummaryWidget.test.tsx)
vi.mock("../file-change-summary/FileChangeRow", () => ({
  FileChangeRow: ({ fileChange }: { fileChange: { file_path: string } }) => (
    <div data-testid={`file-row-${fileChange.file_path}`}>{fileChange.file_path}</div>
  ),
}));

// Mock vscodeApi
const mockPostMessage = vi.fn();
vi.mock("../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
  mockApproveAll.mockClear();
  resetIdCounter();
});

describe("Integrated widget flow – E2E", () => {
  describe("TurnContainer with full phase structure", () => {
    it("renders turn with 4 collapsible phases + user_message + summary", () => {
      const turnId = "turn_1" as TurnId;
      const userMsgId = "msg_1" as MessageId;
      const summaryMsgId = "msg_2" as MessageId;

      const turn = createTurn({
        id: turnId,
        status: "success",
        phases: [
          createTurnPhase({
            phase: "user_message",
            status: "success",
            collapsed: false,
            message_ids: [userMsgId],
          }),
          createTurnPhase({
            phase: "thinking",
            status: "success",
            summary: "Analyzed the problem",
          }),
          createTurnPhase({ phase: "analysis", status: "success", summary: "Found 3 files" }),
          createTurnPhase({ phase: "plan", status: "success", summary: "2-step plan" }),
          createTurnPhase({ phase: "changes", status: "success", summary: "Modified 1 file" }),
          createTurnPhase({
            phase: "summary",
            status: "success",
            collapsed: false,
            message_ids: [summaryMsgId],
          }),
        ],
      });

      renderWithAtoms(<TurnContainer turnId={turnId} />, {
        initialValues: [
          [turnAtomFamily(turnId), turn],
          [
            messageAtomFamily(userMsgId),
            createMessage({ id: userMsgId, role: "user", text: "Fix the bug" }),
          ],
          [
            messageAtomFamily(summaryMsgId),
            createMessage({ id: summaryMsgId, text: "Bug fixed successfully" }),
          ],
        ],
      });

      // All 6 phase sections rendered (via mocked TurnPhaseSection)
      expect(screen.getByTestId("phase-user_message")).toBeInTheDocument();
      expect(screen.getByTestId("phase-thinking")).toBeInTheDocument();
      expect(screen.getByTestId("phase-analysis")).toBeInTheDocument();
      expect(screen.getByTestId("phase-plan")).toBeInTheDocument();
      expect(screen.getByTestId("phase-changes")).toBeInTheDocument();
      expect(screen.getByTestId("phase-summary")).toBeInTheDocument();

      // Phase summaries rendered in the mocked output
      expect(screen.getByText("Analyzed the problem")).toBeInTheDocument();
      expect(screen.getByText("Found 3 files")).toBeInTheDocument();
      expect(screen.getByText("2-step plan")).toBeInTheDocument();
      expect(screen.getByText("Modified 1 file")).toBeInTheDocument();
    });
  });

  describe("FileChangeSummaryWidget with Accept All", () => {
    it("5 pending files -> Accept All -> approveAll called", async () => {
      const turnId = "turn_1" as TurnId;
      const files = Array.from({ length: 5 }, (_, i) =>
        createFileChange({
          turn_id: turnId as string,
          file_path: `src/file_${i}.tsx`,
          approval_status: "pending",
          status: "modified",
          insertions: 3,
          deletions: 1,
        }),
      );

      const { store, user } = renderWithAtoms(<FileChangeSummaryWidget turnId={turnId} />, {
        initialValues: [[diffReviewAdapterAtom, createMockDiffReviewAdapter()]],
      });

      // Seed file changes via write atoms (triggers derived atom recomputation)
      act(() => {
        for (const fc of files) {
          store.set(upsertFileChangeAtom, fc);
        }
      });

      // FileChangeSummaryWidget subscribes to derived atom
      // After seeding, "Accept All" button should be rendered for pending files
      const acceptAllBtn = await screen.findByText("Accept All");
      expect(acceptAllBtn).toBeInTheDocument();

      // Click Accept All → opens confirmation dialog
      await user.click(acceptAllBtn);

      // Confirm in the dialog
      const dialog = screen.getByRole("dialog");
      const confirmBtn = within(dialog).getByText("Accept All");
      await user.click(confirmBtn);

      expect(mockApproveAll).toHaveBeenCalledTimes(1);
      expect(mockApproveAll).toHaveBeenCalledWith(
        turnId,
        files.map((f) => f.file_path),
      );
    });

    it("file change rows rendered for each seeded file", async () => {
      const turnId = "turn_1" as TurnId;

      const { store } = renderWithAtoms(<FileChangeSummaryWidget turnId={turnId} />, {
        initialValues: [],
      });

      // Wrap store mutations in act() to flush React re-renders
      act(() => {
        store.set(
          upsertFileChangeAtom,
          createFileChange({
            turn_id: turnId as string,
            file_path: "src/alpha.ts",
            status: "added",
            insertions: 10,
            deletions: 0,
            approval_status: "pending",
          }),
        );
        store.set(
          upsertFileChangeAtom,
          createFileChange({
            turn_id: turnId as string,
            file_path: "src/beta.ts",
            status: "modified",
            insertions: 5,
            deletions: 3,
            approval_status: "accepted",
          }),
        );
      });

      expect(screen.getByTestId("file-row-src/alpha.ts")).toBeInTheDocument();
      expect(screen.getByTestId("file-row-src/beta.ts")).toBeInTheDocument();
      expect(screen.getByText("File Changes")).toBeInTheDocument();
    });
  });

  describe("multiple turns rendered in sequence", () => {
    it("3 turns with different statuses: all render correctly", () => {
      const turns = [
        createTurn({
          id: "turn_1" as TurnId,
          status: "success",
          phases: [
            createTurnPhase({
              phase: "user_message",
              status: "success",
              collapsed: false,
              message_ids: ["msg_1" as MessageId],
            }),
            createTurnPhase({ phase: "thinking", status: "success" }),
          ],
        }),
        createTurn({
          id: "turn_2" as TurnId,
          status: "error",
          phases: [
            createTurnPhase({ phase: "user_message", status: "success", collapsed: false }),
            createTurnPhase({ phase: "thinking", status: "error", summary: "Rate limit" }),
          ],
        }),
        createTurn({
          id: "turn_3" as TurnId,
          status: "running",
          phases: [
            createTurnPhase({ phase: "user_message", status: "success", collapsed: false }),
            createTurnPhase({ phase: "thinking", status: "running" }),
          ],
        }),
      ];

       
      const initialValues: [any, any][] = turns.map((t) => [turnAtomFamily(t.id), t]);

      renderWithAtoms(
        <>
          {turns.map((t, i) => (
            <TurnContainer key={t.id} turnId={t.id} isLast={i === turns.length - 1} />
          ))}
        </>,
        { initialValues },
      );

      // All 3 turns rendered
      expect(screen.getByTestId("turn-turn_1")).toBeInTheDocument();
      expect(screen.getByTestId("turn-turn_2")).toBeInTheDocument();
      expect(screen.getByTestId("turn-turn_3")).toBeInTheDocument();

      // First two turns have bottom border (not last), last does not
      expect(screen.getByTestId("turn-turn_1").className).toMatch(/border-b/);
      expect(screen.getByTestId("turn-turn_2").className).toMatch(/border-b/);
      expect(screen.getByTestId("turn-turn_3").className).not.toMatch(/border-b/);

      // Error turn shows error banner with phase summary (appears in both phase mock and banner)
      expect(screen.getAllByText("Rate limit").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("TurnContainer with null turn", () => {
    it("renders nothing when turn atom has no data", () => {
      const { container } = renderWithAtoms(<TurnContainer turnId={"nonexistent" as TurnId} />, {
        initialValues: [],
      });

      expect(container.innerHTML).toBe("");
    });
  });
});
