import { createStore } from "jotai";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import { createPRSummary, createShareLink, resetIdCounter } from "../../../shared/lib/mocks";
import type { SessionId } from "../../../shared/protocol";
import { prSummaryContentAtom } from "../../pr-summary";
import { shareLinksAtom } from "../../session-share";

function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) => dispatchServerEvent(store, serverEvent);
}

beforeEach(() => {
  resetIdCounter();
});

describe("ServerEvent dispatcher — session share & PR summary", () => {
  it("SET_SHARE_LINK stores share link for session", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const link = createShareLink({ url: "https://share.example.com/abc123" });
    const sessionId = "session_42" as SessionId;

    dispatch({
      t: "SET_SHARE_LINK",
      session_id: sessionId,
      link,
    });

    const links = store.get(shareLinksAtom);
    expect(links.size).toBe(1);
    expect(links.get(sessionId)?.url).toBe("https://share.example.com/abc123");
    expect(links.get(sessionId)?.masked).toBe(true);
  });

  it("SET_SHARE_LINK with null expiry", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const link = createShareLink({ expires_at_ms: null, masked: false });
    const sessionId = "session_1" as SessionId;

    dispatch({ t: "SET_SHARE_LINK", session_id: sessionId, link });

    const stored = store.get(shareLinksAtom).get(sessionId);
    expect(stored?.expires_at_ms).toBeNull();
    expect(stored?.masked).toBe(false);
  });

  it("SET_PR_SUMMARY stores the PR summary content", () => {
    const store = createStore();
    const dispatch = createDispatch(store);
    const summary = createPRSummary({
      title: "Add session sharing feature",
      intent: "Enable sharing sessions via read-only links.",
      todos: ["Add rate limiting", "Write E2E tests"],
    });

    dispatch({ t: "SET_PR_SUMMARY", summary });

    const result = store.get(prSummaryContentAtom);
    expect(result).not.toBeNull();
    expect(result?.title).toBe("Add session sharing feature");
    expect(result?.intent).toBe("Enable sharing sessions via read-only links.");
    expect(result?.todos).toHaveLength(2);
    expect(result?.changes).toHaveLength(2);
  });

  it("SET_PR_SUMMARY replaces previous summary", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    dispatch({
      t: "SET_PR_SUMMARY",
      summary: createPRSummary({ title: "First" }),
    });
    dispatch({
      t: "SET_PR_SUMMARY",
      summary: createPRSummary({ title: "Second" }),
    });

    expect(store.get(prSummaryContentAtom)?.title).toBe("Second");
  });

  it("RESET_STORES clears session share and PR summary stores", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // Populate
    dispatch({
      t: "SET_SHARE_LINK",
      session_id: "session_1" as SessionId,
      link: createShareLink(),
    });
    dispatch({
      t: "SET_PR_SUMMARY",
      summary: createPRSummary(),
    });

    expect(store.get(shareLinksAtom).size).toBe(1);
    expect(store.get(prSummaryContentAtom)).not.toBeNull();

    // Reset
    dispatch({ t: "RESET_STORES" });

    expect(store.get(shareLinksAtom).size).toBe(0);
    expect(store.get(prSummaryContentAtom)).toBeNull();
  });
});
