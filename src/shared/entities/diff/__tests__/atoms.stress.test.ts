/**
 * FileChange & ToolCall Atom Aggregation Stress Tests
 *
 * Tests:
 * - 500 file changes per turn: summary aggregation correctness
 * - Concurrent UPSERT overwrites on same file_path: no double-counting
 * - 100 tool calls per turn grouped by category: grouping correctness
 * - Tool call status updates under load: no data loss
 * - Derived atom recalculation consistency
 */
import { createStore } from "jotai";

import { createFileChange, createToolCall, resetIdCounter } from "~shared/lib/mocks";
import type { FileChangeStatus, ToolCategory } from "~shared/protocol";

import {
  toolCallAtomFamily,
  toolCallGroupsByTurnAtom,
  toolCallIdsByTurnAtom,
  updateToolCallStatusAtom,
  upsertToolCallAtom,
} from "../../tool-call";
import { fileChangeSummaryByTurnAtom, upsertFileChangeAtom } from "../model/atoms";

beforeEach(() => {
  resetIdCounter();
});

describe("FileChange atoms – aggregation stress", () => {
  // ── Large Volume Per Turn ──────────────────────────────
  describe("large volume per turn", () => {
    it("500 file changes in 1 turn: summary counts correct", () => {
      const store = createStore();

      const statuses: FileChangeStatus[] = ["added", "modified", "deleted", "renamed"];
      for (let i = 0; i < 500; i++) {
        store.set(
          upsertFileChangeAtom,
          createFileChange({
            file_path: `src/file_${i}.ts`,
            turn_id: "turn_1",
            status: statuses[i % 4],
            insertions: 10,
            deletions: 5,
          }),
        );
      }

      const summary = store.get(fileChangeSummaryByTurnAtom("turn_1"));
      expect(summary.files).toHaveLength(500);
      expect(summary.added).toBe(125); // 500/4
      expect(summary.modified).toBe(125);
      expect(summary.deleted).toBe(125);
      expect(summary.renamed).toBe(125);
      expect(summary.total_insertions).toBe(5_000); // 500 × 10
      expect(summary.total_deletions).toBe(2_500); // 500 × 5
    });

    it("empty turn: summary returns zero-filled object", () => {
      const store = createStore();

      const summary = store.get(fileChangeSummaryByTurnAtom("nonexistent_turn"));
      expect(summary.added).toBe(0);
      expect(summary.modified).toBe(0);
      expect(summary.deleted).toBe(0);
      expect(summary.renamed).toBe(0);
      expect(summary.total_insertions).toBe(0);
      expect(summary.total_deletions).toBe(0);
      expect(summary.files).toHaveLength(0);
    });
  });

  // ── Overwrite Idempotency ──────────────────────────────
  describe("overwrite idempotency (same file_path)", () => {
    it("upsert same file 100x: summary counts it as 1, uses last values", () => {
      const store = createStore();

      for (let i = 0; i < 100; i++) {
        store.set(
          upsertFileChangeAtom,
          createFileChange({
            file_path: "src/app.ts",
            turn_id: "turn_1",
            status: i < 50 ? "modified" : "added",
            insertions: i,
            deletions: i * 2,
          }),
        );
      }

      const summary = store.get(fileChangeSummaryByTurnAtom("turn_1"));
      expect(summary.files).toHaveLength(1);
      // Last upsert: i=99, status="added", insertions=99, deletions=198
      expect(summary.added).toBe(1);
      expect(summary.modified).toBe(0);
      expect(summary.total_insertions).toBe(99);
      expect(summary.total_deletions).toBe(198);
    });

    it("overwrite changes status: summary reflects latest status", () => {
      const store = createStore();

      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/file.ts",
          turn_id: "turn_1",
          status: "added",
          insertions: 100,
          deletions: 0,
        }),
      );

      // Overwrite: changed to modified
      store.set(
        upsertFileChangeAtom,
        createFileChange({
          file_path: "src/file.ts",
          turn_id: "turn_1",
          status: "modified",
          insertions: 50,
          deletions: 30,
        }),
      );

      const summary = store.get(fileChangeSummaryByTurnAtom("turn_1"));
      expect(summary.added).toBe(0);
      expect(summary.modified).toBe(1);
      expect(summary.total_insertions).toBe(50);
      expect(summary.total_deletions).toBe(30);
    });
  });

  // ── Multi-Turn Isolation ───────────────────────────────
  describe("multi-turn isolation", () => {
    it("file changes in different turns: summaries are independent", () => {
      const store = createStore();

      for (let t = 0; t < 5; t++) {
        for (let f = 0; f < 20; f++) {
          store.set(
            upsertFileChangeAtom,
            createFileChange({
              file_path: `src/t${t}_file_${f}.ts`,
              turn_id: `turn_${t}`,
              status: "modified",
              insertions: t + 1,
              deletions: 1,
            }),
          );
        }
      }

      for (let t = 0; t < 5; t++) {
        const summary = store.get(fileChangeSummaryByTurnAtom(`turn_${t}`));
        expect(summary.files).toHaveLength(20);
        expect(summary.modified).toBe(20);
        expect(summary.total_insertions).toBe(20 * (t + 1));
        expect(summary.total_deletions).toBe(20);
      }
    });
  });
});

describe("ToolCall atoms – grouping stress", () => {
  // ── Large Volume Grouping ──────────────────────────────
  describe("large volume grouping", () => {
    it("100 tool calls across 5 categories: groups correct", () => {
      const store = createStore();
      const categories: ToolCategory[] = ["read", "write", "search", "terminal", "git"];

      for (let i = 0; i < 100; i++) {
        store.set(
          upsertToolCallAtom,
          createToolCall({
            id: `tc_${i}`,
            turn_id: "turn_1",
            tool_name: `tool_${categories[i % 5]}`,
            category: categories[i % 5],
            status: "success",
          }),
        );
      }

      const groups = store.get(toolCallGroupsByTurnAtom("turn_1"));
      expect(groups).toHaveLength(5);

      for (const group of groups) {
        expect(group.count).toBe(20); // 100/5
        expect(group.calls).toHaveLength(20);
      }
    });

    it("all same category: single group with all calls", () => {
      const store = createStore();

      for (let i = 0; i < 50; i++) {
        store.set(
          upsertToolCallAtom,
          createToolCall({
            id: `tc_${i}`,
            turn_id: "turn_1",
            category: "read",
            status: "success",
          }),
        );
      }

      const groups = store.get(toolCallGroupsByTurnAtom("turn_1"));
      expect(groups).toHaveLength(1);
      expect(groups[0]?.category).toBe("read");
      expect(groups[0]?.count).toBe(50);
    });

    it("empty turn: no groups", () => {
      const store = createStore();
      const groups = store.get(toolCallGroupsByTurnAtom("nonexistent"));
      expect(groups).toHaveLength(0);
    });
  });

  // ── Insertion Order Preservation ───────────────────────
  describe("insertion order preservation", () => {
    it("tool calls maintain insertion order within each group", () => {
      const store = createStore();

      // Insert in specific order
      const insertOrder = ["tc_a", "tc_b", "tc_c", "tc_d", "tc_e"];
      for (const id of insertOrder) {
        store.set(
          upsertToolCallAtom,
          createToolCall({ id, turn_id: "turn_1", category: "read", status: "running" }),
        );
      }

      const groups = store.get(toolCallGroupsByTurnAtom("turn_1"));
      const callIds = groups[0]?.calls.map((c) => c.id);
      expect(callIds).toEqual(insertOrder);
    });
  });

  // ── Status Updates Under Load ──────────────────────────
  describe("status updates under load", () => {
    it("50 concurrent tool calls: all updated from running → success", () => {
      const store = createStore();

      // Create 50 running tool calls
      for (let i = 0; i < 50; i++) {
        store.set(
          upsertToolCallAtom,
          createToolCall({
            id: `tc_${i}`,
            turn_id: "turn_1",
            category: i % 2 === 0 ? "read" : "write",
            status: "running",
          }),
        );
      }

      // Update all to success
      for (let i = 0; i < 50; i++) {
        store.set(updateToolCallStatusAtom, {
          id: `tc_${i}`,
          status: "success",
          result_summary: `Result ${i}`,
          duration_ms: i * 10,
        });
      }

      // Verify all updated
      for (let i = 0; i < 50; i++) {
        const tc = store.get(toolCallAtomFamily(`tc_${i}`));
        expect(tc!.status).toBe("success");
        expect(tc!.result_summary).toBe(`Result ${i}`);
        expect(tc!.duration_ms).toBe(i * 10);
      }

      // Verify grouping reflects updated status
      const groups = store.get(toolCallGroupsByTurnAtom("turn_1"));
      const allCalls = groups.flatMap((g) => g.calls);
      expect(allCalls.every((c) => c.status === "success")).toBe(true);
    });

    it("update non-existent tool call: silently ignored", () => {
      const store = createStore();

      expect(() => {
        store.set(updateToolCallStatusAtom, {
          id: "ghost_tc",
          status: "success",
          result_summary: "nope",
          duration_ms: 0,
        });
      }).not.toThrow();

      expect(store.get(toolCallAtomFamily("ghost_tc"))).toBeNull();
    });

    it("duplicate upsert: order preserved, no duplicate entries", () => {
      const store = createStore();

      for (let i = 0; i < 3; i++) {
        store.set(
          upsertToolCallAtom,
          createToolCall({
            id: "tc_1",
            turn_id: "turn_1",
            category: "read",
            status: i === 2 ? "success" : "running",
            result_summary: `attempt_${i}`,
          }),
        );
      }

      const ids = store.get(toolCallIdsByTurnAtom).turn_1 ?? [];
      expect(ids).toHaveLength(1);

      const tc = store.get(toolCallAtomFamily("tc_1"));
      expect(tc!.status).toBe("success");
      expect(tc!.result_summary).toBe("attempt_2");
    });
  });
});
