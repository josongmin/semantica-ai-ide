import { createStore } from "jotai";

import {
  persistedSessionIdAtom,
  persistSessionIdAtom,
  restorePersistedSessionAtom,
} from "../sessionPersistenceAtoms";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();
const mockSetState = vi.fn();
let mockState: unknown = null;

vi.mock("../../vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => mockState,
    setState: mockSetState,
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
  mockSetState.mockClear();
  mockState = null;
});

describe("persistedSessionIdAtom", () => {
  it("defaults to null", () => {
    const store = createStore();
    expect(store.get(persistedSessionIdAtom)).toBeNull();
  });
});

describe("persistSessionIdAtom", () => {
  it("updates atom and calls setState", () => {
    const store = createStore();
    store.set(persistSessionIdAtom, "sess_42");

    expect(store.get(persistedSessionIdAtom)).toBe("sess_42");
    expect(mockSetState).toHaveBeenCalledWith({ activeSessionId: "sess_42" });
  });

  it("persists null when clearing", () => {
    const store = createStore();
    store.set(persistSessionIdAtom, "sess_42");
    store.set(persistSessionIdAtom, null);

    expect(store.get(persistedSessionIdAtom)).toBeNull();
    expect(mockSetState).toHaveBeenLastCalledWith({ activeSessionId: null });
  });
});

describe("restorePersistedSessionAtom", () => {
  it("restores session ID and posts RESUME_SESSION when found", () => {
    mockState = { activeSessionId: "sess_99" };
    const store = createStore();
    store.set(restorePersistedSessionAtom);

    expect(store.get(persistedSessionIdAtom)).toBe("sess_99");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "RESUME_SESSION",
      session_id: "sess_99",
    });
  });

  it("does nothing when state is null", () => {
    mockState = null;
    const store = createStore();
    store.set(restorePersistedSessionAtom);

    expect(store.get(persistedSessionIdAtom)).toBeNull();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("does nothing when activeSessionId is empty string", () => {
    mockState = { activeSessionId: "" };
    const store = createStore();
    store.set(restorePersistedSessionAtom);

    expect(store.get(persistedSessionIdAtom)).toBeNull();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("does nothing when state has no activeSessionId", () => {
    mockState = { other: "data" };
    const store = createStore();
    store.set(restorePersistedSessionAtom);

    expect(store.get(persistedSessionIdAtom)).toBeNull();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});
