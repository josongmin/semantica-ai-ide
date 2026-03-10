import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { currentPageAtom, sessionListAtom } from "~shared/lib";
import { createSessionListEntry } from "~shared/lib/mocks";
import type { SessionId } from "~shared/protocol";

import { SessionListPage } from "../SessionListPage";

const mockPostMessage = vi.fn();
vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

vi.mock("../../../features/session-lifecycle", () => ({
  useSessionLifecycle: () => ({
    createSession: () => mockPostMessage({ type: "NEW_SESSION" }),
    resumeSession: (id: string) => mockPostMessage({ type: "RESUME_SESSION", session_id: id }),
    deleteSession: vi.fn(),
    loadSessionList: vi.fn(),
    activeSessionId: null,
  }),
  useSessionPrefetch: () => ({
    onMouseEnter: vi.fn(),
    onMouseLeave: vi.fn(),
    isPrefetched: false,
  }),
}));

vi.mock("../../../features/session-tags", () => ({
  useSessionTags: () => ({
    allTags: [],
    getTagsForSession: () => [],
    createTag: vi.fn(),
    deleteTag: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
  }),
}));

function renderWithStore(
  ui: React.ReactElement,
  setup?: (store: ReturnType<typeof createStore>) => void,
) {
  const store = createStore();
  setup?.(store);
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe("SessionListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page with data-testid", () => {
    renderWithStore(<SessionListPage />);
    expect(screen.getByTestId("session-list-page")).toBeInTheDocument();
  });

  it("sends LOAD_SESSION_LIST on mount", () => {
    renderWithStore(<SessionListPage />);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: "LOAD_SESSION_LIST" });
  });

  it("shows skeleton loading state on initial render with no sessions", () => {
    renderWithStore(<SessionListPage />);
    // On initial load with no sessions, the component shows skeleton placeholders
    // (isInitialLoad is true until sessions arrive)
    expect(screen.getByTestId("session-list-skeleton")).toBeInTheDocument();
  });

  it("shows empty state after initial load completes with no sessions", async () => {
    const store = createStore();
    // First set sessions to trigger isInitialLoad = false, then clear them
    store.set(sessionListAtom, [
      createSessionListEntry({ title: "Temp", session_id: "tmp" as SessionId }),
    ]);
    const { rerender } = render(
      <Provider store={store}>
        <SessionListPage />
      </Provider>,
    );
    // Now clear sessions to trigger the empty state
    act(() => {
      store.set(sessionListAtom, []);
    });
    rerender(
      <Provider store={store}>
        <SessionListPage />
      </Provider>,
    );
    await waitFor(() => {
      expect(screen.getByText("No sessions yet")).toBeInTheDocument();
    });
  });

  it("renders session entries", () => {
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({ title: "My First Session", session_id: "s1" as SessionId }),
        createSessionListEntry({ title: "Bug Fix Session", session_id: "s2" as SessionId }),
      ]);
    });

    expect(screen.getByText("My First Session")).toBeInTheDocument();
    expect(screen.getByText("Bug Fix Session")).toBeInTheDocument();
  });

  it("filters sessions by search query", async () => {
    const user = userEvent.setup();
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({ title: "Auth Feature", session_id: "s1" as SessionId }),
        createSessionListEntry({ title: "Database Migration", session_id: "s2" as SessionId }),
      ]);
    });

    const searchInput = screen.getByTestId("session-search");
    await user.type(searchInput, "Auth");

    expect(screen.getByText("Auth Feature")).toBeInTheDocument();
    expect(screen.queryByText("Database Migration")).not.toBeInTheDocument();
  });

  it("shows 'No matching sessions' when filter has no results", async () => {
    const user = userEvent.setup();
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({ title: "Session 1", session_id: "s1" as SessionId }),
      ]);
    });

    const searchInput = screen.getByTestId("session-search");
    await user.type(searchInput, "zzz-no-match");

    expect(screen.getByText("No matching sessions")).toBeInTheDocument();
  });

  it("sends RESUME_SESSION on session click", async () => {
    const user = userEvent.setup();
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({ title: "Click Me", session_id: "s42" as SessionId }),
      ]);
    });

    await user.click(screen.getByText("Click Me"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "RESUME_SESSION",
      session_id: "s42",
    });
  });

  it("sends NEW_SESSION on new button click", async () => {
    const user = userEvent.setup();
    renderWithStore(<SessionListPage />);

    await user.click(screen.getByText("New"));

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "NEW_SESSION" });
  });

  it("back button sets page to chat", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<SessionListPage />, (s) => {
      s.set(currentPageAtom, "sessions");
    });

    await user.click(screen.getByLabelText("Back to chat"));

    expect(store.get(currentPageAtom)).toBe("chat");
  });

  it("shows model label and turn count", () => {
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({
          title: "Test",
          session_id: "s1" as SessionId,
          model_label: "Sonnet 4.5",
          turn_count: 7,
        }),
      ]);
    });

    expect(screen.getByText("Sonnet 4.5")).toBeInTheDocument();
    expect(screen.getByText("7 turns")).toBeInTheDocument();
  });

  it("shows cost when present", () => {
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({
          title: "Costly",
          session_id: "s1" as SessionId,
          cost_usd: 0.1234,
        }),
      ]);
    });

    expect(screen.getByText("$0.12")).toBeInTheDocument();
  });

  it("shows last message preview", () => {
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({
          title: "Preview Test",
          session_id: "s1" as SessionId,
          last_message_preview: "Here is the implementation...",
        }),
      ]);
    });

    expect(screen.getByText("Here is the implementation...")).toBeInTheDocument();
  });

  it("filters by last_message_preview content", async () => {
    const user = userEvent.setup();
    renderWithStore(<SessionListPage />, (store) => {
      store.set(sessionListAtom, [
        createSessionListEntry({
          title: "Session A",
          session_id: "s1" as SessionId,
          last_message_preview: "implemented auth flow",
        }),
        createSessionListEntry({
          title: "Session B",
          session_id: "s2" as SessionId,
          last_message_preview: "fixed database issue",
        }),
      ]);
    });

    const searchInput = screen.getByTestId("session-search");
    await user.type(searchInput, "database");

    expect(screen.queryByText("Session A")).not.toBeInTheDocument();
    expect(screen.getByText("Session B")).toBeInTheDocument();
  });

  it("has search input with placeholder", () => {
    renderWithStore(<SessionListPage />);
    expect(screen.getByPlaceholderText("Search sessions...")).toBeInTheDocument();
  });

  it("renders Sessions title in header", () => {
    renderWithStore(<SessionListPage />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
  });
});
