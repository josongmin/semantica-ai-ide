import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { sessionListAtom } from "~shared/lib";
import { createSessionListEntry } from "~shared/lib/mocks";
import type { SessionId } from "~shared/protocol";

import { SessionListPage } from "../SessionListPage";

const mockLifecycle = {
  createSession: vi.fn(),
  resumeSession: vi.fn(),
  deleteSession: vi.fn(),
  loadSessionList: vi.fn(),
  activeSessionId: null,
};

vi.mock("~shared/bootstrap/session-lifecycle", () => ({
  useSessionLifecycle: () => mockLifecycle,
  useSessionPrefetch: () => ({
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    isPrefetched: false,
  }),
}));

vi.mock("~features/session-tags", () => ({
  useSessionTags: () => ({
    allTags: [],
    getTagsForSession: () => [],
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
  }),
}));

vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({ postMessage: vi.fn() }),
}));

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("SessionListPage — reinforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── formatRelativeTime ────────────────────────────────────────────────────

  describe("formatRelativeTime", () => {
    it('shows "just now" for a session created less than 10 seconds ago', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Recent Session",
            session_id: "s1" as SessionId,
            created_at_ms: now - 5_000, // 5 seconds ago
          }),
        ]);
      });

      expect(screen.getByText("just now")).toBeInTheDocument();
      vi.restoreAllMocks();
    });

    it('shows "Xm ago" for a session created less than 60 minutes ago', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Some Minutes Ago",
            session_id: "s1" as SessionId,
            created_at_ms: now - 15 * 60_000, // 15 minutes ago
          }),
        ]);
      });

      expect(screen.getByText("15m ago")).toBeInTheDocument();
      vi.restoreAllMocks();
    });

    it('shows "Xh ago" for a session created less than 24 hours ago', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "A Few Hours Ago",
            session_id: "s1" as SessionId,
            created_at_ms: now - 5 * 60 * 60_000, // 5 hours ago
          }),
        ]);
      });

      expect(screen.getByText("5h ago")).toBeInTheDocument();
      vi.restoreAllMocks();
    });

    it('shows "Xd ago" for a session created 24 or more hours ago', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Several Days Ago",
            session_id: "s1" as SessionId,
            created_at_ms: now - 3 * 24 * 60 * 60_000, // 3 days ago
          }),
        ]);
      });

      expect(screen.getByText("3d ago")).toBeInTheDocument();
      vi.restoreAllMocks();
    });

    it('shows "1d ago" for a session created exactly 24 hours ago', () => {
      const now = 1_700_000_000_000;
      vi.spyOn(Date, "now").mockReturnValue(now);

      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Exactly One Day",
            session_id: "s1" as SessionId,
            created_at_ms: now - 24 * 60 * 60_000, // exactly 24 hours ago
          }),
        ]);
      });

      expect(screen.getByText("1d ago")).toBeInTheDocument();
      vi.restoreAllMocks();
    });
  });

  // ─── Sort functionality ────────────────────────────────────────────────────

  describe("sort functionality", () => {
    it("sorts by date (newest first) by default", () => {
      const base = 1_700_000_000_000;
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Older Session",
            session_id: "s1" as SessionId,
            created_at_ms: base - 60_000,
          }),
          createSessionListEntry({
            title: "Newer Session",
            session_id: "s2" as SessionId,
            created_at_ms: base,
          }),
        ]);
      });

      // Session rows use data-testid="session-row-{id}" and div[role="button"]
      const rows = screen.getAllByTestId(/^session-row-/);
      // The newest session should appear first (lower index in DOM)
      expect(rows[0]).toHaveTextContent("Newer Session");
      expect(rows[1]).toHaveTextContent("Older Session");
    });

    it("reorders sessions by cost when Cost sort button is clicked", async () => {
      const user = userEvent.setup();
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Cheap Session",
            session_id: "s1" as SessionId,
            cost_usd: 0.001,
          }),
          createSessionListEntry({
            title: "Expensive Session",
            session_id: "s2" as SessionId,
            cost_usd: 9.99,
          }),
          createSessionListEntry({
            title: "Mid Session",
            session_id: "s3" as SessionId,
            cost_usd: 1.5,
          }),
        ]);
      });

      await user.click(screen.getByTestId("sort-cost"));

      const rows = screen.getAllByTestId(/^session-row-/);
      expect(rows[0]).toHaveTextContent("Expensive Session");
      expect(rows[1]).toHaveTextContent("Mid Session");
      expect(rows[2]).toHaveTextContent("Cheap Session");
    });

    it("reorders sessions by turn_count when Turns sort button is clicked", async () => {
      const user = userEvent.setup();
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Few Turns",
            session_id: "s1" as SessionId,
            turn_count: 2,
          }),
          createSessionListEntry({
            title: "Many Turns",
            session_id: "s2" as SessionId,
            turn_count: 42,
          }),
          createSessionListEntry({
            title: "Some Turns",
            session_id: "s3" as SessionId,
            turn_count: 10,
          }),
        ]);
      });

      await user.click(screen.getByTestId("sort-turns"));

      const rows = screen.getAllByTestId(/^session-row-/);
      expect(rows[0]).toHaveTextContent("Many Turns");
      expect(rows[1]).toHaveTextContent("Some Turns");
      expect(rows[2]).toHaveTextContent("Few Turns");
    });

    it("returns to date sort when Date button is clicked after changing sort", async () => {
      const user = userEvent.setup();
      const base = 1_700_000_000_000;
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Older",
            session_id: "s1" as SessionId,
            created_at_ms: base - 60_000,
            turn_count: 100,
          }),
          createSessionListEntry({
            title: "Newer",
            session_id: "s2" as SessionId,
            created_at_ms: base,
            turn_count: 1,
          }),
        ]);
      });

      // Switch to turns sort first (Older has more turns, so it would be first)
      await user.click(screen.getByTestId("sort-turns"));
      // Switch back to date sort (Newer has the later timestamp, so it should be first)
      await user.click(screen.getByTestId("sort-date"));

      const rows = screen.getAllByTestId(/^session-row-/);
      expect(rows[0]).toHaveTextContent("Newer");
      expect(rows[1]).toHaveTextContent("Older");
    });
  });

  // ─── Delete confirmation flow ──────────────────────────────────────────────

  describe("delete confirmation flow", () => {
    it("opens confirmation dialog when delete icon is clicked", async () => {
      const user = userEvent.setup();
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "My Session",
            session_id: "s1" as SessionId,
          }),
        ]);
      });

      await user.click(screen.getByLabelText('Delete session "My Session"'));

      expect(screen.getByText("Delete Session")).toBeInTheDocument();
      expect(screen.getByText(/Delete "My Session"\? This cannot be undone\./)).toBeInTheDocument();
    });

    it("closes dialog and session still exists when Cancel is clicked", async () => {
      const user = userEvent.setup();
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Keep Me",
            session_id: "s1" as SessionId,
          }),
        ]);
      });

      await user.click(screen.getByLabelText('Delete session "Keep Me"'));
      expect(screen.getByText("Delete Session")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // The dialog uses useAnimatedPresence with a 150ms exit animation — wait for it to unmount
      await waitFor(() => expect(screen.queryByText("Delete Session")).not.toBeInTheDocument(), {
        timeout: 500,
      });
      expect(screen.getByText("Keep Me")).toBeInTheDocument();
      expect(mockLifecycle.deleteSession).not.toHaveBeenCalled();
    });

    it("calls deleteSession with correct id when Delete is confirmed", async () => {
      const user = userEvent.setup();
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Delete Me",
            session_id: "target-id" as SessionId,
          }),
        ]);
      });

      await user.click(screen.getByLabelText('Delete session "Delete Me"'));
      await user.click(screen.getByTestId("confirm-delete"));

      expect(mockLifecycle.deleteSession).toHaveBeenCalledOnce();
      expect(mockLifecycle.deleteSession).toHaveBeenCalledWith("target-id");
    });

    it("closes dialog after confirming delete", async () => {
      const user = userEvent.setup();
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Gone Session",
            session_id: "s1" as SessionId,
          }),
        ]);
      });

      await user.click(screen.getByLabelText('Delete session "Gone Session"'));
      await user.click(screen.getByTestId("confirm-delete"));

      // The dialog uses useAnimatedPresence with a 150ms exit animation — wait for it to unmount
      await waitFor(() => expect(screen.queryByText("Delete Session")).not.toBeInTheDocument(), {
        timeout: 500,
      });
    });

    it("does not trigger session resume when delete button is clicked", async () => {
      const user = userEvent.setup();
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "No Resume",
            session_id: "s1" as SessionId,
          }),
        ]);
      });

      await user.click(screen.getByLabelText('Delete session "No Resume"'));

      expect(mockLifecycle.resumeSession).not.toHaveBeenCalled();
    });
  });

  // ─── Session status display ────────────────────────────────────────────────

  describe("session status display", () => {
    it('shows a "running" status dot for a running session', () => {
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Running Session",
            session_id: "s1" as SessionId,
            status: "running",
          }),
        ]);
      });

      const row = screen.getByTestId("session-row-s1");
      const dot = within(row).getByRole("status");
      expect(dot).toHaveAttribute("aria-label", "running");
    });

    it('shows an "error" status dot for an errored session', () => {
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Error Session",
            session_id: "s1" as SessionId,
            status: "error",
          }),
        ]);
      });

      const row = screen.getByTestId("session-row-s1");
      const dot = within(row).getByRole("status");
      expect(dot).toHaveAttribute("aria-label", "error");
    });

    it('shows a "success" status dot for a completed session', () => {
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Completed Session",
            session_id: "s1" as SessionId,
            status: "completed",
          }),
        ]);
      });

      const row = screen.getByTestId("session-row-s1");
      const dot = within(row).getByRole("status");
      expect(dot).toHaveAttribute("aria-label", "success");
    });

    it('shows an "idle" status dot for an idle session', () => {
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Idle Session",
            session_id: "s1" as SessionId,
            status: "idle",
          }),
        ]);
      });

      const row = screen.getByTestId("session-row-s1");
      const dot = within(row).getByRole("status");
      expect(dot).toHaveAttribute("aria-label", "idle");
    });

    it('maps "paused" status to "idle" dot', () => {
      renderWithStore(<SessionListPage />, (store) => {
        store.set(sessionListAtom, [
          createSessionListEntry({
            title: "Paused Session",
            session_id: "s1" as SessionId,
            status: "paused",
          }),
        ]);
      });

      const row = screen.getByTestId("session-row-s1");
      const dot = within(row).getByRole("status");
      // paused falls through to the "idle" case in the SessionRow status mapping
      expect(dot).toHaveAttribute("aria-label", "idle");
    });
  });
});
