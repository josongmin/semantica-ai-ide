import { createStore } from "jotai";

import { createFileChange, resetIdCounter } from "~shared/lib/mocks";

import {
  fileChangeAtomFamily,
  fileChangeSummaryByTurnAtom,
  setFileApprovalAtom,
  upsertFileChangeAtom,
} from "../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("upsertFileChangeAtom", () => {
  it("stores file change and indexes by turn", () => {
    const store = createStore();
    const fc = createFileChange({
      turn_id: "turn_1",
      file_path: "src/app.tsx",
      status: "modified",
    });

    store.set(upsertFileChangeAtom, fc);

    const key = "turn_1::src/app.tsx";
    expect(store.get(fileChangeAtomFamily(key))).toEqual(fc);
  });
});

describe("setFileApprovalAtom", () => {
  it("changes approval_status of an existing file change", () => {
    const store = createStore();
    const fc = createFileChange({
      turn_id: "turn_1",
      file_path: "src/app.tsx",
      approval_status: "pending",
    });
    store.set(upsertFileChangeAtom, fc);

    store.set(setFileApprovalAtom, {
      turn_id: "turn_1",
      file_path: "src/app.tsx",
      status: "accepted",
    });

    const key = "turn_1::src/app.tsx";
    expect(store.get(fileChangeAtomFamily(key))?.approval_status).toBe("accepted");
  });
});

describe("fileChangeSummaryByTurnAtom", () => {
  it("aggregates added/modified/deleted counts and insertion/deletion sums", () => {
    const store = createStore();

    store.set(
      upsertFileChangeAtom,
      createFileChange({
        turn_id: "turn_1",
        file_path: "src/new-file.ts",
        status: "added",
        insertions: 50,
        deletions: 0,
      }),
    );

    store.set(
      upsertFileChangeAtom,
      createFileChange({
        turn_id: "turn_1",
        file_path: "src/app.tsx",
        status: "modified",
        insertions: 10,
        deletions: 3,
      }),
    );

    store.set(
      upsertFileChangeAtom,
      createFileChange({
        turn_id: "turn_1",
        file_path: "src/old-file.ts",
        status: "deleted",
        insertions: 0,
        deletions: 25,
      }),
    );

    const summary = store.get(fileChangeSummaryByTurnAtom("turn_1"));

    expect(summary.added).toBe(1);
    expect(summary.modified).toBe(1);
    expect(summary.deleted).toBe(1);
    expect(summary.total_insertions).toBe(60);
    expect(summary.total_deletions).toBe(28);
    expect(summary.files).toHaveLength(3);
  });
});
