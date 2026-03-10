import { createStore } from "jotai";

import { resetIdCounter } from "../../../shared/lib/mocks";
import type { ReviewComment, ReviewCommentId } from "../../../shared/protocol";
import {
  openCommentCountAtom,
  resetReviewStoreAtom,
  reviewCommentAtomFamily,
  reviewCommentIdsByFileAtom,
  reviewedFilesAtom,
  reviewSummaryAtom,
  setReviewCommentsAtom,
  updateReviewCommentStatusAtom,
  upsertReviewCommentAtom,
} from "../model/atoms";

function createReviewComment(overrides: Partial<ReviewComment> = {}): ReviewComment {
  return {
    id: "rc_1" as ReviewCommentId,
    file_path: "src/app.tsx",
    line: 10,
    line_start: 10,
    line_end: 12,
    text: "Consider extracting this into a separate function.",
    severity: "warning",
    message: "Consider extracting this into a separate function.",
    status: "open",
    ...overrides,
  };
}

beforeEach(() => {
  resetIdCounter();
});

describe("upsertReviewCommentAtom", () => {
  it("new comment: stores in atomFamily and indexes by file_path", () => {
    const store = createStore();
    const comment = createReviewComment({
      id: "rc_1" as ReviewCommentId,
      file_path: "src/app.tsx",
    });

    store.set(upsertReviewCommentAtom, comment);

    expect(store.get(reviewCommentAtomFamily("rc_1"))).toEqual(comment);
    expect(store.get(reviewCommentIdsByFileAtom)["src/app.tsx"]).toContain("rc_1");
  });

  it("existing ID: updates comment without duplicating in index", () => {
    const store = createStore();
    const comment = createReviewComment({ id: "rc_1" as ReviewCommentId, message: "Original" });
    const updated = createReviewComment({ id: "rc_1" as ReviewCommentId, message: "Updated" });

    store.set(upsertReviewCommentAtom, comment);
    store.set(upsertReviewCommentAtom, updated);

    expect(store.get(reviewCommentIdsByFileAtom)["src/app.tsx"]).toHaveLength(1);
    expect(store.get(reviewCommentAtomFamily("rc_1"))?.message).toBe("Updated");
  });

  it("tracks file in reviewedFilesAtom", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/app.tsx" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_2" as ReviewCommentId, file_path: "src/utils.ts" }),
    );

    expect(store.get(reviewedFilesAtom)).toContain("src/app.tsx");
    expect(store.get(reviewedFilesAtom)).toContain("src/utils.ts");
    expect(store.get(reviewedFilesAtom)).toHaveLength(2);
  });

  it("does not duplicate file in reviewedFilesAtom", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/app.tsx" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_2" as ReviewCommentId, file_path: "src/app.tsx" }),
    );

    expect(store.get(reviewedFilesAtom)).toHaveLength(1);
  });

  it("groups multiple comments by file_path", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/app.tsx" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_2" as ReviewCommentId, file_path: "src/app.tsx" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_3" as ReviewCommentId, file_path: "src/utils.ts" }),
    );

    expect(store.get(reviewCommentIdsByFileAtom)["src/app.tsx"]).toHaveLength(2);
    expect(store.get(reviewCommentIdsByFileAtom)["src/utils.ts"]).toHaveLength(1);
  });
});

describe("setReviewCommentsAtom", () => {
  it("replaces all comments for a file", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/app.tsx" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_2" as ReviewCommentId, file_path: "src/app.tsx" }),
    );

    store.set(setReviewCommentsAtom, {
      file_path: "src/app.tsx",
      comments: [createReviewComment({ id: "rc_3" as ReviewCommentId, file_path: "src/app.tsx" })],
    });

    const ids = store.get(reviewCommentIdsByFileAtom)["src/app.tsx"];
    expect(ids).toHaveLength(1);
    expect(ids).toContain("rc_3");
    expect(ids).not.toContain("rc_1");
    expect(ids).not.toContain("rc_2");
  });

  it("does not affect comments for other files", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/app.tsx" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_2" as ReviewCommentId, file_path: "src/utils.ts" }),
    );

    store.set(setReviewCommentsAtom, {
      file_path: "src/app.tsx",
      comments: [],
    });

    expect(store.get(reviewCommentIdsByFileAtom)["src/utils.ts"]).toContain("rc_2");
  });
});

describe("updateReviewCommentStatusAtom", () => {
  it("updates status on an existing comment", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, status: "open" }),
    );

    store.set(updateReviewCommentStatusAtom, { id: "rc_1" as ReviewCommentId, status: "accepted" });

    expect(store.get(reviewCommentAtomFamily("rc_1"))?.status).toBe("accepted");
  });

  it("no-op for non-existent comment (no throw)", () => {
    const store = createStore();

    expect(() => {
      store.set(updateReviewCommentStatusAtom, {
        id: "nonexistent" as ReviewCommentId,
        status: "dismissed",
      });
    }).not.toThrow();
  });
});

describe("openCommentCountAtom", () => {
  it("counts only open comments across all files", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/a.ts", status: "open" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({
        id: "rc_2" as ReviewCommentId,
        file_path: "src/a.ts",
        status: "accepted",
      }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_3" as ReviewCommentId, file_path: "src/b.ts", status: "open" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({
        id: "rc_4" as ReviewCommentId,
        file_path: "src/b.ts",
        status: "dismissed",
      }),
    );

    expect(store.get(openCommentCountAtom)).toBe(2);
  });

  it("returns 0 when store is empty", () => {
    const store = createStore();
    expect(store.get(openCommentCountAtom)).toBe(0);
  });
});

describe("reviewSummaryAtom", () => {
  it("summarizes files and status counts", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/a.ts", status: "open" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({
        id: "rc_2" as ReviewCommentId,
        file_path: "src/a.ts",
        status: "accepted",
      }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({
        id: "rc_3" as ReviewCommentId,
        file_path: "src/b.ts",
        status: "dismissed",
      }),
    );

    const summary = store.get(reviewSummaryAtom);
    expect(summary.files).toBe(2);
    expect(summary.open).toBe(1);
    expect(summary.accepted).toBe(1);
    expect(summary.dismissed).toBe(1);
  });

  it("returns zeros when store is empty", () => {
    const store = createStore();
    const summary = store.get(reviewSummaryAtom);
    expect(summary.files).toBe(0);
    expect(summary.open).toBe(0);
    expect(summary.accepted).toBe(0);
    expect(summary.dismissed).toBe(0);
  });
});

describe("resetReviewStoreAtom", () => {
  it("clears all review state", () => {
    const store = createStore();
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_1" as ReviewCommentId, file_path: "src/app.tsx" }),
    );
    store.set(
      upsertReviewCommentAtom,
      createReviewComment({ id: "rc_2" as ReviewCommentId, file_path: "src/utils.ts" }),
    );

    store.set(resetReviewStoreAtom);

    expect(store.get(reviewCommentIdsByFileAtom)).toEqual({});
    expect(store.get(reviewedFilesAtom)).toEqual([]);
    expect(store.get(openCommentCountAtom)).toBe(0);
  });

  it("after reset, fresh store returns null from atomFamily", () => {
    const store = createStore();
    store.set(upsertReviewCommentAtom, createReviewComment({ id: "rc_1" as ReviewCommentId }));
    store.set(resetReviewStoreAtom);

    const store2 = createStore();
    expect(store2.get(reviewCommentAtomFamily("rc_1"))).toBeNull();
  });
});
