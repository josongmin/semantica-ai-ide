import { createStore } from "jotai";

import { upsertFileChangeAtom } from "~entities/diff";
import { turnOrderAtom } from "~entities/message/turns";
import { toolCallAtomFamily, toolCallIdsByTurnAtom } from "~entities/tool-call";
import { createFileChange, createToolCall } from "~shared/lib/mocks";
import type { TurnId } from "~shared/protocol";

import {
  allWorkspaceFileChangesAtom,
  allWorkspaceReadFilesAtom,
  inferLanguage,
  workspaceFileGroupsAtom,
  workspaceFileTotalCountAtom,
} from "../model/workspaceAwarenessAtoms";
describe("workspaceAwarenessAtoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe("inferLanguage", () => {
    it("maps .ts to typescript", () => {
      expect(inferLanguage("src/app.ts")).toBe("typescript");
    });

    it("maps .tsx to typescriptreact", () => {
      expect(inferLanguage("src/App.tsx")).toBe("typescriptreact");
    });

    it("maps .py to python", () => {
      expect(inferLanguage("script.py")).toBe("python");
    });

    it("returns undefined for unknown extension", () => {
      expect(inferLanguage("file.xyz")).toBeUndefined();
    });

    it("returns undefined for no extension", () => {
      expect(inferLanguage("Makefile")).toBeUndefined();
    });
  });

  describe("allWorkspaceFileChangesAtom", () => {
    it("returns empty when no turns", () => {
      expect(store.get(allWorkspaceFileChangesAtom)).toEqual([]);
    });

    it("collects file changes across turns", () => {
      const turnId = "turn_1" as TurnId;
      store.set(turnOrderAtom, [turnId]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turnId, status: "modified" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/new.ts", turn_id: turnId, status: "added" }),
      );

      const result = store.get(allWorkspaceFileChangesAtom);
      expect(result).toHaveLength(2);
      expect(result.find((e) => e.file_path === "src/app.ts")?.action).toBe("modified");
      expect(result.find((e) => e.file_path === "src/new.ts")?.action).toBe("created");
    });

    it("deduplicates files across turns (latest wins)", () => {
      const turn1 = "turn_1" as TurnId;
      const turn2 = "turn_2" as TurnId;
      store.set(turnOrderAtom, [turn1, turn2]);

      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turn1, status: "added" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turn2, status: "modified" }),
      );

      const result = store.get(allWorkspaceFileChangesAtom);
      expect(result).toHaveLength(1);
      // Latest turn (turn_2) wins
      expect(result[0]?.action).toBe("modified");
      expect(result[0]?.turn_id).toBe(turn2);
    });
  });

  describe("allWorkspaceReadFilesAtom", () => {
    it("returns empty when no tool calls", () => {
      expect(store.get(allWorkspaceReadFilesAtom)).toEqual([]);
    });

    it("extracts read files from tool calls", () => {
      const tc = createToolCall({
        id: "tc_1",
        turn_id: "turn_1",
        tool_name: "read_file",
        category: "read",
        args_summary: "src/index.ts",
      });
      store.set(toolCallAtomFamily("tc_1"), tc);
      store.set(toolCallIdsByTurnAtom, { turn_1: ["tc_1"] });

      const result = store.get(allWorkspaceReadFilesAtom);
      expect(result).toHaveLength(1);
      expect(result[0]?.file_path).toBe("src/index.ts");
      expect(result[0]?.action).toBe("read");
      expect(result[0]?.language).toBe("typescript");
    });

    it("deduplicates read files", () => {
      const tc1 = createToolCall({
        id: "tc_1",
        turn_id: "turn_1",
        tool_name: "read_file",
        category: "read",
        args_summary: "src/index.ts",
      });
      const tc2 = createToolCall({
        id: "tc_2",
        turn_id: "turn_1",
        tool_name: "read_file",
        category: "read",
        args_summary: "src/index.ts",
      });
      store.set(toolCallAtomFamily("tc_1"), tc1);
      store.set(toolCallAtomFamily("tc_2"), tc2);
      store.set(toolCallIdsByTurnAtom, { turn_1: ["tc_1", "tc_2"] });

      const result = store.get(allWorkspaceReadFilesAtom);
      expect(result).toHaveLength(1);
    });
  });

  describe("workspaceFileGroupsAtom", () => {
    it("groups files by action in correct order", () => {
      const turnId = "turn_1" as TurnId;
      store.set(turnOrderAtom, [turnId]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/new.ts", turn_id: turnId, status: "added" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/old.ts", turn_id: turnId, status: "deleted" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/edit.ts", turn_id: turnId, status: "modified" }),
      );

      const groups = store.get(workspaceFileGroupsAtom);
      // Order should be: created, modified, read, deleted
      const actions = groups.map((g) => g.action);
      expect(actions).toEqual(["created", "modified", "deleted"]);
    });

    it("excludes read files that overlap with changes", () => {
      const turnId = "turn_1" as TurnId;
      store.set(turnOrderAtom, [turnId]);

      // File that was both read and modified
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/app.ts", turn_id: turnId, status: "modified" }),
      );

      const tc = createToolCall({
        id: "tc_1",
        turn_id: turnId,
        tool_name: "read_file",
        category: "read",
        args_summary: "src/app.ts",
      });
      store.set(toolCallAtomFamily("tc_1"), tc);
      store.set(toolCallIdsByTurnAtom, { [turnId]: ["tc_1"] });

      const groups = store.get(workspaceFileGroupsAtom);
      // Should only appear once as "modified", not additionally as "read"
      const totalFiles = groups.reduce((sum, g) => sum + g.count, 0);
      expect(totalFiles).toBe(1);
      expect(groups[0]?.action).toBe("modified");
    });
  });

  describe("workspaceFileTotalCountAtom", () => {
    it("returns 0 when empty", () => {
      expect(store.get(workspaceFileTotalCountAtom)).toBe(0);
    });

    it("sums all groups", () => {
      const turnId = "turn_1" as TurnId;
      store.set(turnOrderAtom, [turnId]);
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/a.ts", turn_id: turnId, status: "added" }),
      );
      store.set(
        upsertFileChangeAtom,
        createFileChange({ file_path: "src/b.ts", turn_id: turnId, status: "modified" }),
      );

      expect(store.get(workspaceFileTotalCountAtom)).toBe(2);
    });
  });
});
