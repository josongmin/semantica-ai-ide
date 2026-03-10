import { createStore } from "jotai";

import { resetDiffStoreAtom } from "~entities/diff";
import { messageOrderAtom } from "~entities/message/core";
import { resetMessageStoreAtom, upsertMessageAtom, upsertTurnAtom } from "~entities/message/writers";
import {
  resetSessionStoreAtom,
  sessionMetaAtom,
  updateSessionMetaAtom,
} from "~entities/session/state";
import { resetTimelineStoreAtom } from "~entities/timeline-event";
import { resetToolCallStoreAtom } from "~entities/tool-call";
import {
  currentPageAtom,
  persistedSessionIdAtom,
  persistSessionIdAtom,
  sessionListAtom,
  setSessionListAtom,
} from "~shared/lib";
import {
  createMessage,
  createSessionListEntry,
  createTurn,
  resetIdCounter,
} from "~shared/lib/mocks";
import type { SessionId } from "~shared/protocol";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();
const mockSetState = vi.fn();

vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: mockSetState,
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
  mockSetState.mockClear();
  resetIdCounter();
});

describe("Session switching integration", () => {
  it("RESET_STORES clears all entity stores", () => {
    const store = createStore();

    // Populate stores
    store.set(upsertMessageAtom, createMessage());
    store.set(upsertMessageAtom, createMessage());
    store.set(upsertTurnAtom, createTurn());
    store.set(updateSessionMetaAtom, { session_id: "sess_1" as SessionId, status: "running" });

    expect(store.get(messageOrderAtom)).toHaveLength(2);
    expect(store.get(sessionMetaAtom).session_id).toBe("sess_1");

    // Simulate RESET_STORES (same as dispatcher does)
    store.set(resetMessageStoreAtom);
    store.set(resetDiffStoreAtom);
    store.set(resetToolCallStoreAtom);
    store.set(resetTimelineStoreAtom);
    store.set(resetSessionStoreAtom);

    // Verify cleared
    expect(store.get(messageOrderAtom)).toHaveLength(0);
    expect(store.get(sessionMetaAtom).session_id).toBe("");
    expect(store.get(sessionMetaAtom).status).toBe("idle");
  });

  it("session switch: populate → reset → new meta arrives", () => {
    const store = createStore();

    // Session A: populate
    store.set(upsertMessageAtom, createMessage());
    store.set(updateSessionMetaAtom, {
      session_id: "sess_A" as SessionId,
      model_label: "Model A",
    });

    // Reset (host sends RESET_STORES)
    store.set(resetMessageStoreAtom);
    store.set(resetDiffStoreAtom);
    store.set(resetToolCallStoreAtom);
    store.set(resetTimelineStoreAtom);
    store.set(resetSessionStoreAtom);

    // Session B: new meta arrives
    store.set(updateSessionMetaAtom, {
      session_id: "sess_B" as SessionId,
      model_label: "Model B",
      status: "running",
    });

    expect(store.get(sessionMetaAtom).session_id).toBe("sess_B");
    expect(store.get(sessionMetaAtom).model_label).toBe("Model B");
    expect(store.get(messageOrderAtom)).toHaveLength(0);
  });

  it("session list → resume → navigates to chat", () => {
    const store = createStore();

    // Set up session list page
    store.set(currentPageAtom, "sessions");
    store.set(setSessionListAtom, [createSessionListEntry({ session_id: "sess_42" as SessionId })]);

    // Simulate resume (what useSessionLifecycle does)
    store.set(persistSessionIdAtom, "sess_42");
    store.set(currentPageAtom, "chat");

    expect(store.get(persistedSessionIdAtom)).toBe("sess_42");
    expect(store.get(currentPageAtom)).toBe("chat");
  });

  it("delete active session triggers new session flow", () => {
    const store = createStore();

    const entries = [
      createSessionListEntry({ session_id: "sess_active" as SessionId }),
      createSessionListEntry({ session_id: "sess_other" as SessionId }),
    ];
    store.set(setSessionListAtom, entries);
    store.set(persistSessionIdAtom, "sess_active");

    // Simulate delete active session
    store.set(
      setSessionListAtom,
      store.get(sessionListAtom).filter((s) => s.session_id !== "sess_active"),
    );
    store.set(persistSessionIdAtom, null);
    store.set(currentPageAtom, "chat");

    expect(store.get(sessionListAtom)).toHaveLength(1);
    expect(store.get(persistedSessionIdAtom)).toBeNull();
    expect(store.get(currentPageAtom)).toBe("chat");
  });
});
