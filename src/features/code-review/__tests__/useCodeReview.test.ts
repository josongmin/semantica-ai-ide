import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { reviewedFilesAtom, upsertReviewCommentAtom } from "../../../entities/review-comment";
import type { ReviewCommentId } from "../../../shared/protocol";
import { useCodeReview } from "../model/useCodeReview";

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
describe("useCodeReview", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("returns default values when store is empty", () => {
    const store = createStore();
    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.reviewedFiles).toEqual([]);
    expect(result.current.openCommentCount).toBe(0);
  });

  it("reflects open comment count from upserted comments", () => {
    const store = createStore();
    store.set(upsertReviewCommentAtom, {
      id: "cmt-1" as ReviewCommentId,
      file_path: "src/foo.ts",
      line: 10,
      line_start: 10,
      line_end: 10,
      text: "Use const",
      message: "Use const",
      severity: "suggestion",
      status: "open",
    });
    store.set(upsertReviewCommentAtom, {
      id: "cmt-2" as ReviewCommentId,
      file_path: "src/foo.ts",
      line: 20,
      line_start: 20,
      line_end: 20,
      text: "Missing test",
      message: "Missing test",
      severity: "warning",
      status: "accepted",
    });

    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.openCommentCount).toBe(1);
    expect(result.current.reviewedFiles).toContain("src/foo.ts");
  });

  it("requestReview posts REQUEST_CODE_REVIEW without a file path", () => {
    const store = createStore();
    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.requestReview());

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "REQUEST_CODE_REVIEW",
      file_path: undefined,
    });
  });

  it("requestReview posts REQUEST_CODE_REVIEW with a file path", () => {
    const store = createStore();
    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.requestReview("src/features/foo.ts"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "REQUEST_CODE_REVIEW",
      file_path: "src/features/foo.ts",
    });
  });

  it("acceptComment posts ACCEPT_REVIEW_COMMENT with correct comment_id", () => {
    const store = createStore();
    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.acceptComment("cmt-99"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ACCEPT_REVIEW_COMMENT",
      comment_id: "cmt-99",
    });
  });

  it("dismissComment posts DISMISS_REVIEW_COMMENT with correct comment_id", () => {
    const store = createStore();
    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.dismissComment("cmt-55"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DISMISS_REVIEW_COMMENT",
      comment_id: "cmt-55",
    });
  });

  it("reviewSummary reflects all comment statuses", () => {
    const store = createStore();
    store.set(upsertReviewCommentAtom, {
      id: "c1" as ReviewCommentId,
      file_path: "a.ts",
      line: 1,
      line_start: 1,
      line_end: 1,
      text: "open one",
      message: "open one",
      severity: "suggestion",
      status: "open",
    });
    store.set(upsertReviewCommentAtom, {
      id: "c2" as ReviewCommentId,
      file_path: "a.ts",
      line: 2,
      line_start: 2,
      line_end: 2,
      text: "accepted one",
      message: "accepted one",
      severity: "warning",
      status: "accepted",
    });
    store.set(upsertReviewCommentAtom, {
      id: "c3" as ReviewCommentId,
      file_path: "b.ts",
      line: 5,
      line_start: 5,
      line_end: 5,
      text: "dismissed one",
      message: "dismissed one",
      severity: "error",
      status: "dismissed",
    });

    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.reviewSummary).toMatchObject({
      files: 2,
      open: 1,
      accepted: 1,
      dismissed: 1,
    });
    expect(result.current.reviewedFiles).toHaveLength(2);
  });

  it("reflects pre-seeded reviewedFiles atom", () => {
    const store = createStore();
    store.set(reviewedFilesAtom, ["src/a.ts", "src/b.ts"]);

    const { result } = renderHook(() => useCodeReview(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.reviewedFiles).toEqual(["src/a.ts", "src/b.ts"]);
  });
});
