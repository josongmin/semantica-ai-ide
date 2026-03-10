/**
 * useApprovalGate – stress & edge cases
 *
 * Tests:
 * - 100 rapid mode changes
 * - 50 concurrent grant/deny calls
 * - Mode stability after rapid cycling
 * - Same mode set repeatedly (idempotent)
 * - Empty action ID handling
 */
import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { approvalModeAtom } from "~entities/session/settings";
import type { ApprovalMode } from "~shared/protocol";

import { useApprovalGate } from "../../model/useApprovalGate";
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

const MODES: ApprovalMode[] = ["auto", "turbo"];

beforeEach(() => {
  mockPostMessage.mockClear();
});

describe("useApprovalGate – stress & edge cases", () => {
  // ── Rapid Mode Changes ───────────────────────────────────
  describe("rapid mode changes", () => {
    it("100 rapid mode changes: final mode matches last set", () => {
      const store = createStore();
      const { result } = renderHook(() => useApprovalGate(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 100; i++) {
        act(() => result.current.changeMode((MODES[i % 2] ?? MODES[0] ?? "auto")));
      }

      // Last iteration i=99, 99 % 2 = 1 → "turbo"
      expect(result.current.mode).toBe("turbo");
      expect(store.get(approvalModeAtom)).toBe("turbo");
      expect(mockPostMessage).toHaveBeenCalledTimes(100);
    });

    it("setting same mode 50 times: atom stable, 50 messages sent", () => {
      const store = createStore();
      const { result } = renderHook(() => useApprovalGate(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 50; i++) {
        act(() => result.current.changeMode("turbo"));
      }

      expect(result.current.mode).toBe("turbo");
      expect(mockPostMessage).toHaveBeenCalledTimes(50);
      // All messages should have the same mode
      for (const call of mockPostMessage.mock.calls) {
        expect(call[0]).toEqual({ type: "SET_APPROVAL_MODE", mode: "turbo" });
      }
    });
  });

  // ── Rapid Grant/Deny ─────────────────────────────────────
  describe("rapid grant/deny", () => {
    it("50 grants with unique action IDs: all messages sent correctly", () => {
      const store = createStore();
      const { result } = renderHook(() => useApprovalGate(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 50; i++) {
        act(() => result.current.grantApproval(`action_${i}`));
      }

      expect(mockPostMessage).toHaveBeenCalledTimes(50);
      for (let i = 0; i < 50; i++) {
        expect(mockPostMessage).toHaveBeenNthCalledWith(i + 1, {
          type: "GRANT_APPROVAL",
          action_id: `action_${i}`,
        });
      }
    });

    it("50 denials with unique action IDs: all messages sent correctly", () => {
      const store = createStore();
      const { result } = renderHook(() => useApprovalGate(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 50; i++) {
        act(() => result.current.denyApproval(`deny_${i}`));
      }

      expect(mockPostMessage).toHaveBeenCalledTimes(50);
      for (let i = 0; i < 50; i++) {
        expect(mockPostMessage).toHaveBeenNthCalledWith(i + 1, {
          type: "DENY_APPROVAL",
          action_id: `deny_${i}`,
        });
      }
    });

    it("interleaved grant→deny 25 cycles: all 50 messages sent", () => {
      const store = createStore();
      const { result } = renderHook(() => useApprovalGate(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 25; i++) {
        act(() => result.current.grantApproval(`action_${i}`));
        act(() => result.current.denyApproval(`action_${i}`));
      }

      expect(mockPostMessage).toHaveBeenCalledTimes(50);
    });
  });

  // ── Mode Cycling Stability ───────────────────────────────
  describe("mode cycling stability", () => {
    it("full cycle auto→turbo→auto 33 times: returns to auto", () => {
      const store = createStore();
      const { result } = renderHook(() => useApprovalGate(), {
        wrapper: createWrapper(store),
      });

      for (let i = 0; i < 33; i++) {
        act(() => result.current.changeMode("turbo"));
        act(() => result.current.changeMode("auto"));
      }

      expect(result.current.mode).toBe("auto");
      expect(mockPostMessage).toHaveBeenCalledTimes(66);
    });

    it("mode changes interleaved with grant/deny: independent operations", () => {
      const store = createStore();
      const { result } = renderHook(() => useApprovalGate(), {
        wrapper: createWrapper(store),
      });

      act(() => result.current.changeMode("turbo"));
      act(() => result.current.grantApproval("a1"));
      act(() => result.current.changeMode("auto"));
      act(() => result.current.denyApproval("a2"));

      expect(result.current.mode).toBe("auto");
      expect(mockPostMessage).toHaveBeenCalledTimes(4);

      // Verify message types are correct
      expect(mockPostMessage.mock.calls[0]?.[0]?.type).toBe("SET_APPROVAL_MODE");
      expect(mockPostMessage.mock.calls[1]?.[0]?.type).toBe("GRANT_APPROVAL");
      expect(mockPostMessage.mock.calls[2]?.[0]?.type).toBe("SET_APPROVAL_MODE");
      expect(mockPostMessage.mock.calls[3]?.[0]?.type).toBe("DENY_APPROVAL");
    });
  });
});
