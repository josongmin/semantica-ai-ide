import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  autoCommitEnabledAtom,
  gitCommitsAtom,
  pushGitCommitAtom,
} from "~entities/git-history";

import { gitPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import type { GitCommitId } from "../../../shared/protocol";
import { useGitAutoCommit } from "../model/useGitAutoCommit";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// ─── Helpers ───────────────────────────────────────────────
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

// ─── Tests ─────────────────────────────────────────────────
describe("useGitAutoCommit", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("returns default values when store is empty", () => {
    const store = createStore();
    const { result } = renderHook(() => useGitAutoCommit(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.commits).toEqual([]);
    expect(result.current.autoCommitEnabled).toBe(false);
    expect(result.current.panelVisible).toBe(false);
  });

  it("togglePanel flips gitPanelVisibleAtom", () => {
    const store = createStore();
    const { result } = renderHook(() => useGitAutoCommit(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.panelVisible).toBe(false);
    act(() => result.current.togglePanel());
    expect(result.current.panelVisible).toBe(true);
    expect(store.get(gitPanelVisibleAtom)).toBe(true);

    act(() => result.current.togglePanel());
    expect(result.current.panelVisible).toBe(false);
  });

  it("toggleAutoCommit posts TOGGLE_AUTO_COMMIT with inverted enabled flag (off → on)", () => {
    const store = createStore();
    const { result } = renderHook(() => useGitAutoCommit(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.autoCommitEnabled).toBe(false);
    act(() => result.current.toggleAutoCommit());

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "TOGGLE_AUTO_COMMIT",
      enabled: true,
    });
  });

  it("toggleAutoCommit posts TOGGLE_AUTO_COMMIT with inverted enabled flag (on → off)", () => {
    const store = createStore();
    store.set(autoCommitEnabledAtom, true);

    const { result } = renderHook(() => useGitAutoCommit(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.autoCommitEnabled).toBe(true);
    act(() => result.current.toggleAutoCommit());

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "TOGGLE_AUTO_COMMIT",
      enabled: false,
    });
  });

  it("undoLastCommit posts GIT_UNDO_COMMIT", () => {
    const store = createStore();
    const { result } = renderHook(() => useGitAutoCommit(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.undoLastCommit());

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "GIT_UNDO_COMMIT" });
  });

  it("reflects pre-seeded commit list", () => {
    const store = createStore();
    const commit = {
      id: "abc123" as GitCommitId,
      sha: "abc123",
      message: "feat: add feature",
      timestamp_ms: Date.now(),
      auto: true,
    };
    store.set(pushGitCommitAtom, commit);

    const { result } = renderHook(() => useGitAutoCommit(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.commits).toHaveLength(1);
    expect(result.current.commits[0]).toEqual(commit);
  });

  it("reflects pre-set autoCommitEnabled from the store", () => {
    const store = createStore();
    store.set(autoCommitEnabledAtom, true);

    const { result } = renderHook(() => useGitAutoCommit(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.autoCommitEnabled).toBe(true);
  });

  it("gitCommitsAtom is readable directly", () => {
    const store = createStore();
    expect(store.get(gitCommitsAtom)).toEqual([]);
  });
});
