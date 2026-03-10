/**
 * useDiffReview Concurrent & Race Condition Tests
 *
 * Tests:
 * - Approve -> reject -> approve same file rapidly (3 toggles)
 * - ApproveAll then modify single file before completion
 * - 20 concurrent file approvals
 * - Reject after approveAll
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

function renderDiffReview(fileChanges: ReturnType<typeof createFileChange>[]) {
  const store = createStore();
  for (const fc of fileChanges) {
    store.set(upsertFileChangeAtom, fc);
  }

  const { result } = renderHook(() => useDiffReview(), {
    wrapper: createWrapper(store),
  });
  return { result, store };
}

// ─── Lifecycle ─────────────────────────────────────────────
beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

// ─── Tests ─────────────────────────────────────────────────
describe("useDiffReview – concurrent & race conditions", () => {
  it("approve -> reject -> approve same file: last action wins", () => {
    const fc = createFileChange({
      turn_id: "turn_1",
      file_path: "src/app.tsx",
      approval_status: "pending",
    });
    const { result, store } = renderDiffReview([fc]);

    act(() => result.current.approve("turn_1", "src/app.tsx"));
    act(() => result.current.reject("turn_1", "src/app.tsx"));
    act(() => result.current.approve("turn_1", "src/app.tsx"));

    // Last action: approve -> accepted
    // fileChangeAtomFamily key format is `${turn_id}::${file_path}`
    const updated = store.get(fileChangeAtomFamily("turn_1::src/app.tsx"));
    expect(updated!.approval_status).toBe("accepted");

    // postMessage called 3 times (approve + reject + approve)
    expect(mockPostMessage).toHaveBeenCalledTimes(3);
    expect(mockPostMessage.mock.calls[0]?.[0]?.type).toBe("DIFF_APPROVE");
    expect(mockPostMessage.mock.calls[1]?.[0]?.type).toBe("DIFF_REJECT");
    expect(mockPostMessage.mock.calls[2]?.[0]?.type).toBe("DIFF_APPROVE");
  });

  it("approveAll then reject single file: final state correct", () => {
    const files = ["a.tsx", "b.tsx", "c.tsx"].map((fp) =>
      createFileChange({ turn_id: "turn_1", file_path: `src/${fp}`, approval_status: "pending" }),
    );
    const { result, store } = renderDiffReview(files);

    act(() => result.current.approveAll("turn_1", ["src/a.tsx", "src/b.tsx", "src/c.tsx"]));
    act(() => result.current.setApprovalStatus("turn_1", "src/b.tsx", "rejected"));

    // a=accepted, b=rejected (overridden), c=accepted
    expect(store.get(fileChangeAtomFamily("turn_1::src/a.tsx"))!.approval_status).toBe("accepted");
    expect(store.get(fileChangeAtomFamily("turn_1::src/b.tsx"))!.approval_status).toBe("rejected");
    expect(store.get(fileChangeAtomFamily("turn_1::src/c.tsx"))!.approval_status).toBe("accepted");
  });

  it("20 concurrent file approvals across different turns", () => {
    const files = Array.from({ length: 20 }, (_, i) =>
      createFileChange({
        turn_id: `turn_${i % 3}`,
        file_path: `src/file_${i}.tsx`,
        approval_status: "pending",
      }),
    );
    const { result } = renderDiffReview(files);

    for (let i = 0; i < 20; i++) {
      act(() => result.current.approve(`turn_${i % 3}`, `src/file_${i}.tsx`));
    }

    // 20 postMessage calls, all DIFF_APPROVE
    expect(mockPostMessage).toHaveBeenCalledTimes(20);
    const allApprove = mockPostMessage.mock.calls.every(
      (c: unknown[]) => (c[0] as { type: string }).type === "DIFF_APPROVE",
    );
    expect(allApprove).toBe(true);
  });

  it("openInEditor sends correct message", () => {
    const { result } = renderDiffReview([]);

    act(() => result.current.openInEditor("src/utils/helper.ts"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_FILE",
      file_path: "src/utils/helper.ts",
    });
  });
});
