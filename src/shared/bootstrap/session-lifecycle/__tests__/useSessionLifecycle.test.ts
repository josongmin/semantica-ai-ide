import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  currentPageAtom,
  persistedSessionIdAtom,
  sessionListAtom,
  setSessionListAtom,
} from "~shared/lib";
import { createSessionListEntry, resetIdCounter } from "~shared/lib/mocks";
import type { SessionId } from "~shared/protocol";

import { useSessionLifecycle } from "../model/useSessionLifecycle";
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

// ─── Helpers ───────────────────────────────────────────────
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

beforeEach(() => {
  mockPostMessage.mockClear();
  mockSetState.mockClear();
  resetIdCounter();
});

describe("useSessionLifecycle", () => {
  describe("createSession", () => {
    it("posts NEW_SESSION to host", () => {
      const store = createStore();
      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.createSession();
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: "NEW_SESSION" });
    });

    it("navigates to chat page", () => {
      const store = createStore();
      store.set(currentPageAtom, "sessions");

      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.createSession();
      });

      expect(store.get(currentPageAtom)).toBe("chat");
    });
  });

  describe("resumeSession", () => {
    it("posts RESUME_SESSION with session_id", () => {
      const store = createStore();
      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.resumeSession("sess_42");
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "RESUME_SESSION",
        session_id: "sess_42",
      });
    });

    it("persists session ID and navigates to chat", () => {
      const store = createStore();
      store.set(currentPageAtom, "sessions");

      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.resumeSession("sess_42");
      });

      expect(store.get(persistedSessionIdAtom)).toBe("sess_42");
      expect(store.get(currentPageAtom)).toBe("chat");
    });
  });

  describe("deleteSession", () => {
    it("posts DELETE_SESSION with session_id", () => {
      const store = createStore();
      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.deleteSession("sess_42");
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "DELETE_SESSION",
        session_id: "sess_42",
      });
    });

    it("removes entry from sessionListAtom optimistically", () => {
      const store = createStore();
      const entry1 = createSessionListEntry({ session_id: "sess_1" as SessionId });
      const entry2 = createSessionListEntry({ session_id: "sess_2" as SessionId });
      store.set(setSessionListAtom, [entry1, entry2]);

      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.deleteSession("sess_1");
      });

      const remaining = store.get(sessionListAtom);
      expect(remaining).toHaveLength(1);
      expect(remaining[0]?.session_id).toBe("sess_2");
    });

    it("creates new session when deleting the active session", () => {
      const store = createStore();
      store.set(persistedSessionIdAtom, "sess_active");

      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      act(() => {
        result.current.deleteSession("sess_active");
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "DELETE_SESSION",
        session_id: "sess_active",
      });
      expect(mockPostMessage).toHaveBeenCalledWith({ type: "NEW_SESSION" });
      expect(store.get(currentPageAtom)).toBe("chat");
    });
  });

  describe("activeSessionId", () => {
    it("reflects persistedSessionIdAtom", () => {
      const store = createStore();
      store.set(persistedSessionIdAtom, "sess_77");

      const { result } = renderHook(() => useSessionLifecycle(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.activeSessionId).toBe("sess_77");
    });
  });
});
