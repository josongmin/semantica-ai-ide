/**
 * useDiffReview – edge cases & stress tests
 *
 * Tests:
 * - Idempotent approve/reject (same file twice)
 * - approveAll with empty array
 * - Rapid approve→reject toggle on same file
 * - 100 file changes approved in batch
 * - approve on unseeded file (no atom in store)
 */
import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { fileChangeAtomFamily, upsertFileChangeAtom } from "~entities/diff";
import { createFileChange, resetIdCounter } from "~shared/lib/mocks";

import { useDiffReview } from "../model/useDiffReview";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();

vi.mock("~shared/lib/vscodeApi", () => ({
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

function seedFileChange(store: ReturnType<typeof createStore>, turnId: string, filePath: string) {
  const fc = createFileChange({
    turn_id: turnId,
    file_path: filePath,
    approval_status: "pending",
  });
  store.set(upsertFileChangeAtom, fc);
  return fc;
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("useDiffReview – stress & edge cases", () => {
  // ── Idempotency ──────────────────────────────────────────
  describe("idempotent operations", () => {
    it("approve same file twice: atom stays 'accepted', 2 messages sent", () => {
      const store = createStore();
      seedFileChange(store, "turn_1", "src/a.tsx");

      const { result } = renderHook(() => useDiffReview(), {
        wrapper: createWrapper(store),
      });

      act(() => result.current.approve("turn_1", "src/a.tsx"));
      act(() => result.current.approve("turn_1", "src/a.tsx"));

      expect(store.get(fileChangeAtomFamily("turn_1::src/a.tsx"))?.approval_status).toBe(
        "accepted",
      );
      expect(mockPostMessage).toHaveBeenCalledTimes(2);
    });

    it("reject same file twice: atom stays 'rejected'", () => {
      const store = createStore();
      seedFileChange(store, "turn_1", "src/a.tsx");

      const { result } = renderHook(() => useDiffReview(), {
        wrapper: createWrapper(store),
      });

      act(() => result.current.reject("turn_1", "src/a.tsx"));
      act(() => result.current.reject("turn_1", "src/a.tsx"));

      expect(store.get(fileChangeAtomFamily("turn_1::src/a.tsx"))?.approval_status).toBe(
        "rejected",
      );
    });
  });

  // ── Rapid Toggle ─────────────────────────────────────────
  describe("rapid approve/reject toggle", () => {
    it("50 rapid approve→reject cycles: final state matches last action", () => {
      const store = createStore();
      seedFileChange(store, "turn_1", "src/app.tsx");

      const { result } = renderHook(() => useDiffReview(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 50; i++) {
        act(() => result.current.approve("turn_1", "src/app.tsx"));
        act(() => result.current.reject("turn_1", "src/app.tsx"));
      }

      // Last action was reject
      expect(store.get(fileChangeAtomFamily("turn_1::src/app.tsx"))?.approval_status).toBe(
        "rejected",
      );
      // 100 messages total (50 approve + 50 reject)
      expect(mockPostMessage).toHaveBeenCalledTimes(100);
    });
  });

  // ── Empty Array ──────────────────────────────────────────
  describe("edge cases", () => {
    it("approveAll with empty file array: posts message, no atom changes", () => {
      const store = createStore();

      const { result } = renderHook(() => useDiffReview(), {
        wrapper: createWrapper(store),
      });

      act(() => result.current.approveAll("turn_1", []));

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "DIFF_APPROVE_ALL",
        turn_id: "turn_1",
        file_paths: [],
      });
    });

    it("approve on unseeded file: setApproval runs without throwing", () => {
      const store = createStore();

      const { result } = renderHook(() => useDiffReview(), {
        wrapper: createWrapper(store),
      });

      // No file seeded for this key — should not throw
      expect(() => {
        act(() => result.current.approve("turn_x", "nonexistent.tsx"));
      }).not.toThrow();

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "DIFF_APPROVE",
        turn_id: "turn_x",
        file_path: "nonexistent.tsx",
      });
    });
  });

  // ── Batch Stress ─────────────────────────────────────────
  describe("batch stress", () => {
    it("approveAll with 100 files: all atoms updated", () => {
      const store = createStore();
      const paths: string[] = [];

      for (let i = 0; i < 100; i++) {
        const path = `src/file_${i}.tsx`;
        paths.push(path);
        seedFileChange(store, "turn_1", path);
      }

      const { result } = renderHook(() => useDiffReview(), {
        wrapper: createWrapper(store),
      });

      act(() => result.current.approveAll("turn_1", paths));

      for (const path of paths) {
        expect(store.get(fileChangeAtomFamily(`turn_1::${path}`))?.approval_status).toBe(
          "accepted",
        );
      }
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: "DIFF_APPROVE_ALL",
        turn_id: "turn_1",
        file_paths: paths,
      });
    });

    it("100 individual approves on different files: all succeed", () => {
      const store = createStore();

      for (let i = 0; i < 100; i++) {
        seedFileChange(store, "turn_1", `src/f${i}.tsx`);
      }

      const { result } = renderHook(() => useDiffReview(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 100; i++) {
        act(() => result.current.approve("turn_1", `src/f${i}.tsx`));
      }

      expect(mockPostMessage).toHaveBeenCalledTimes(100);
      for (let i = 0; i < 100; i++) {
        expect(store.get(fileChangeAtomFamily(`turn_1::src/f${i}.tsx`))?.approval_status).toBe(
          "accepted",
        );
      }
    });
  });
});
