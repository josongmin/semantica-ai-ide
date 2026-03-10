import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { fileChangeAtomFamily, upsertFileChangeAtom } from "~entities/diff";
import { createFileChange } from "~shared/lib/mocks";

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

// ─── Tests ─────────────────────────────────────────────────
describe("useDiffReview", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("approve updates the atom to 'accepted' and posts DIFF_APPROVE", () => {
    const store = createStore();
    seedFileChange(store, "turn_1", "src/app.tsx");

    const { result } = renderHook(() => useDiffReview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.approve("turn_1", "src/app.tsx");
    });

    const fc = store.get(fileChangeAtomFamily("turn_1::src/app.tsx"));
    expect(fc?.approval_status).toBe("accepted");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DIFF_APPROVE",
      turn_id: "turn_1",
      file_path: "src/app.tsx",
    });
  });

  it("reject updates the atom to 'rejected' and posts DIFF_REJECT", () => {
    const store = createStore();
    seedFileChange(store, "turn_1", "src/app.tsx");

    const { result } = renderHook(() => useDiffReview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.reject("turn_1", "src/app.tsx");
    });

    const fc = store.get(fileChangeAtomFamily("turn_1::src/app.tsx"));
    expect(fc?.approval_status).toBe("rejected");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DIFF_REJECT",
      turn_id: "turn_1",
      file_path: "src/app.tsx",
    });
  });

  it("approveAll updates multiple files and posts DIFF_APPROVE_ALL", () => {
    const store = createStore();
    seedFileChange(store, "turn_1", "src/a.tsx");
    seedFileChange(store, "turn_1", "src/b.tsx");

    const { result } = renderHook(() => useDiffReview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.approveAll("turn_1", ["src/a.tsx", "src/b.tsx"]);
    });

    expect(store.get(fileChangeAtomFamily("turn_1::src/a.tsx"))?.approval_status).toBe("accepted");
    expect(store.get(fileChangeAtomFamily("turn_1::src/b.tsx"))?.approval_status).toBe("accepted");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DIFF_APPROVE_ALL",
      turn_id: "turn_1",
      file_paths: ["src/a.tsx", "src/b.tsx"],
    });
  });

  it("openInEditor sends OPEN_FILE postMessage with correct file path", () => {
    const store = createStore();
    const { result } = renderHook(() => useDiffReview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.openInEditor("src/components/Button.tsx");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_FILE",
      file_path: "src/components/Button.tsx",
    });
  });

  it("setApprovalStatus updates atom without posting a message", () => {
    const store = createStore();
    seedFileChange(store, "turn_2", "src/index.ts");

    const { result } = renderHook(() => useDiffReview(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.setApprovalStatus("turn_2", "src/index.ts", "rejected");
    });

    const fc = store.get(fileChangeAtomFamily("turn_2::src/index.ts"));
    expect(fc?.approval_status).toBe("rejected");
    // setApprovalStatus does NOT post a message
    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});
